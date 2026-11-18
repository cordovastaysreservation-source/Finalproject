const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

let pool;
function getPool() {
  if (!pool) {
    const connectionString =
      process.env.DATABASE_URL ||
      `postgresql://${process.env.DB_USERNAME || 'neondb_owner'}:${encodeURIComponent(
        process.env.DB_PASSWORD || ''
      )}@${process.env.DB_HOST || 'ep-gentle-scene-b3h35aaq.c-4.ap-southeast-1.aws.neon.tech'}:${
        process.env.DB_PORT || 5432
      }/${process.env.DB_DATABASE || 'neondb'}?sslmode=require`;

    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 5,
    });
  }
  return pool;
}

const TOKEN_SECRET = process.env.APP_KEY || 'cordova-stays-secret-key-2026';

function createSignedToken(user) {
  const payload = Buffer.from(
    JSON.stringify({ id: user.id, email: user.email, role: user.role, iat: Date.now() })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
  return `cs_${payload}.${sig}`;
}

function verifySignedToken(token) {
  if (!token || !token.startsWith('cs_')) return null;
  const raw = token.slice(3);
  const [payload, sig] = raw.split('.');
  if (!payload || !sig) return null;
  const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
  if (sig !== expected) return null;
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

async function getAuthUser(req, db) {
  const auth = req.headers.authorization || req.headers.Authorization || '';
  if (!auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7).trim();
  const decoded = verifySignedToken(token);
  if (decoded && decoded.id) {
    const { rows } = await db.query('SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL LIMIT 1', [
      decoded.id,
    ]);
    return rows[0] || null;
  }
  if (token.includes('|')) {
    const [, plain] = token.split('|');
    const hashed = crypto.createHash('sha256').update(plain).digest('hex');
    const { rows } = await db.query(
      'SELECT u.* FROM personal_access_tokens t JOIN users u ON u.id = t.tokenable_id WHERE t.token = $1 LIMIT 1',
      [hashed]
    );
    return rows[0] || null;
  }
  return null;
}

function verifyPassword(plain, hash, userRole = '') {
  if (!plain || !hash) return false;
  const trimmed = String(plain).trim();
  const normalized = String(hash).replace(/^\$2y\$/, '$2a$');
  if (bcrypt.compareSync(trimmed, normalized)) return true;
  if (userRole === 'admin' && bcrypt.compareSync(trimmed.toLowerCase(), normalized)) return true;
  return false;
}

function hashPassword(plain) {
  return bcrypt.hashSync(String(plain), 10);
}

function maskPhone(phone) {
  if (!phone) return '09•• ••• 0000';
  const digits = String(phone).replace(/\D/g, '');
  const last4 = digits.slice(-4) || '1024';
  return `09•• ••• ${last4}`;
}

function formatUser(u) {
  if (!u) return null;
  const parts = String(u.name || '').trim().split(/\s+/);
  const firstName = u.first_name || parts[0] || 'Guest';
  const lastName = u.last_name || parts.slice(1).join(' ') || '';
  const role = u.role || 'customer';
  return {
    id: Number(u.id),
    name: u.name,
    first_name: firstName,
    last_name: lastName,
    email: u.email,
    phone: u.phone,
    masked_phone: maskPhone(u.phone),
    role,
    role_title: u.role_title || role.charAt(0).toUpperCase() + role.slice(1),
    status: u.status || 'active',
    email_updates: Boolean(u.email_updates ?? true),
    address: u.address,
    city: u.city,
    province: u.province,
    country: u.country || 'Philippines',
  };
}

function fmtDate(d, mode = 'd M Y') {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return String(d);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(dt.getUTCDate()).padStart(2, '0');
  const mon = months[dt.getUTCMonth()];
  const yr = dt.getUTCFullYear();
  if (mode === 'Y-m-d') return `${yr}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${day}`;
  if (mode === 'd M') return `${day} ${mon}`;
  if (mode === 'M d') return `${mon} ${day}`;
  if (mode === 'M d, Y') return `${mon} ${day}, ${yr}`;
  return `${day} ${mon} ${yr}`;
}

async function sendMail(to, subject, html) {
  const user = process.env.MAIL_USERNAME;
  const pass = process.env.MAIL_PASSWORD;
  if (!user || !pass) return;
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.MAIL_PORT || 587),
      secure: false,
      auth: { user, pass },
    });
    await transporter.sendMail({
      from: `"Cordova Stays" <${user}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.warn('Mail warning:', err.message);
  }
}

async function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body.trim()) {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const db = getPool();
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const path = parsedUrl.pathname.replace(/^\/api\/v1/, '') || '/';
  const query = Object.fromEntries(parsedUrl.searchParams.entries());
  const method = req.method.toUpperCase();
  const body = ['POST', 'PUT', 'PATCH'].includes(method) ? await parseBody(req) : {};

  try {
    // =========================================================================
    // 1. AUTHENTICATION ROUTES
    // =========================================================================
    if (path === '/auth/register' && method === 'POST') {
      const name = String(body.name || '').trim();
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      const passwordConfirmation = String(body.password_confirmation || '');
      const code = String(body.code || '').trim();

      if (!name) {
        return res.status(422).json({
          message: 'Full name cannot be empty or spaces only.',
          errors: { name: ['Full name cannot be empty or spaces only.'] },
        });
      }
      if (!email || !email.includes('@')) {
        return res.status(422).json({
          message: 'Please enter a valid email address.',
          errors: { email: ['Please enter a valid email address.'] },
        });
      }
      if (
        password.length < 8 ||
        /\s/.test(password) ||
        !/[A-Z]/.test(password) ||
        !/[0-9]/.test(password)
      ) {
        const msg =
          'Password must contain at least 8 characters, 1 uppercase letter (A-Z), 1 number (0-9), and no spaces.';
        return res.status(422).json({ message: msg, errors: { password: [msg] } });
      }
      if (password !== passwordConfirmation) {
        return res.status(422).json({
          message: 'The password field confirmation does not match.',
          errors: { password: ['The password field confirmation does not match.'] },
        });
      }

      const existing = await db.query('SELECT id FROM users WHERE LOWER(email) = $1 LIMIT 1', [email]);
      if (existing.rows.length > 0) {
        return res.status(422).json({
          message: 'The email has already been taken.',
          errors: { email: ['The email has already been taken.'] },
        });
      }

      // Step 1: Send 6-digit OTP to user's Gmail before creating the account
      if (!code) {
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        await db.query('DELETE FROM password_reset_codes WHERE LOWER(email) = $1', [email]);
        await db.query(
          `INSERT INTO password_reset_codes (email, code, expires_at, created_at, updated_at)
           VALUES ($1, $2, NOW() + INTERVAL '10 minutes', NOW(), NOW())`,
          [email, otp]
        );

        await sendMail(
          email,
          'Cordova Stays - Your 6-Digit Account Verification Code',
          `<div style='font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;border:1px solid #DCE7E5;border-radius:12px;overflow:hidden;'>
            <div style='background:#0B6E75;color:#FFFFFF;padding:20px 24px;'>
              <h2 style='margin:0;font-size:20px;'>Cordova Stays</h2>
              <p style='margin:4px 0 0;font-size:11px;opacity:0.85;'>RESORT RESERVATION SYSTEM • EMAIL VERIFICATION</p>
            </div>
            <div style='padding:24px;color:#0F3F40;'>
              <p style='margin-top:0;'>Hello <strong>${name}</strong>,</p>
              <p>Welcome to <strong>Cordova Stays</strong>! Use the 6-digit verification code below to verify your email and complete your registration:</p>
              <div style='background:#DAF3EE;color:#0B6E75;font-size:28px;font-weight:800;letter-spacing:6px;text-align:center;padding:16px;border-radius:10px;margin:20px 0;'>
                ${otp}
              </div>
              <p style='font-size:13px;color:#6B8585;'>This code will expire in <strong>10 minutes</strong>. If you did not create an account, please ignore this email.</p>
            </div>
          </div>`
        );

        return res.json({
          requires_verification: true,
          message: 'A 6-digit verification code has been sent to your Gmail!',
        });
      }

      // Step 2: Verify the 6-digit OTP code and create the user
      const { rows: codeRows } = await db.query(
        'SELECT * FROM password_reset_codes WHERE LOWER(email) = $1 AND code = $2 LIMIT 1',
        [email, code]
      );
      if (!codeRows[0]) {
        return res.status(422).json({
          message: 'Invalid verification code. Please check your Gmail and try again.',
          errors: { code: ['Invalid verification code. Please check your Gmail and try again.'] },
        });
      }
      if (new Date(codeRows[0].expires_at) < new Date()) {
        return res.status(422).json({
          message: 'This verification code has expired. Please request a new code.',
          errors: { code: ['This verification code has expired. Please request a new code.'] },
        });
      }

      const parts = name.split(/\s+/);
      const firstName = parts[0] || name;
      const lastName = parts.slice(1).join(' ') || '';

      const { rows } = await db.query(
        `INSERT INTO users (name, first_name, last_name, email, phone, email_verified_at, password, role, status, country, account_type, email_updates, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), $6, 'customer', 'active', 'Philippines', 'Registered customer', true, NOW(), NOW())
         RETURNING *`,
        [name, firstName, lastName, email, body.phone || null, hashPassword(password)]
      );
      await db.query('DELETE FROM password_reset_codes WHERE LOWER(email) = $1', [email]);

      const user = rows[0];
      return res.status(201).json({
        message: 'Account created successfully.',
        user: formatUser(user),
        token: createSignedToken(user),
      });
    }

    if (path === '/auth/login' && method === 'POST') {
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '').trim();
      const { rows } = await db.query(
        'SELECT * FROM users WHERE LOWER(email) = $1 AND deleted_at IS NULL LIMIT 1',
        [email]
      );
      const user = rows[0];
      if (!user || !verifyPassword(password, user.password, user.role)) {
        return res.status(422).json({
          message: 'The provided credentials do not match our records.',
          errors: { email: ['The provided credentials do not match our records.'] },
        });
      }
      if (user.status === 'inactive') {
        return res.status(422).json({
          message: 'Your account is currently inactive. Please contact support.',
          errors: { email: ['Your account is currently inactive. Please contact support.'] },
        });
      }
      await db.query(
        "UPDATE users SET last_active_at = NOW(), last_active_label = 'Today' WHERE id = $1",
        [user.id]
      );
      return res.json({
        message: 'Logged in successfully.',
        user: formatUser(user),
        token: createSignedToken(user),
      });
    }

    if (path === '/auth/admin/login' && method === 'POST') {
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '').trim();
      const { rows } = await db.query(
        'SELECT * FROM users WHERE LOWER(email) = $1 AND deleted_at IS NULL LIMIT 1',
        [email]
      );
      const user = rows[0];
      if (!user || !verifyPassword(password, user.password, user.role)) {
        return res.status(422).json({
          message: 'Invalid administrator credentials.',
          errors: { email: ['Invalid administrator credentials.'] },
        });
      }
      if (user.role !== 'admin') {
        return res.status(403).json({
          message: 'Access denied. Only the Administrator account can sign in to the Admin Dashboard.',
          errors: {
            email: ['Only the Administrator account is authorized for Admin Dashboard access.'],
          },
        });
      }
      if (user.status === 'inactive') {
        return res.status(403).json({
          message: 'Staff account is inactive.',
          errors: { email: ['Your staff account is inactive.'] },
        });
      }
      await db.query(
        "UPDATE users SET last_active_at = NOW(), last_active_label = 'Today' WHERE id = $1",
        [user.id]
      );
      return res.json({
        message: 'Admin logged in successfully.',
        user: formatUser(user),
        token: createSignedToken(user),
      });
    }

    if (path === '/auth/logout' && method === 'POST') {
      return res.json({ message: 'Logged out successfully.' });
    }

    if (path === '/auth/me' && method === 'GET') {
      const user = await getAuthUser(req, db);
      if (!user) return res.status(401).json({ message: 'Unauthenticated.' });
      return res.json({ user: formatUser(user) });
    }

    if (path === '/auth/profile' && method === 'PUT') {
      const user = await getAuthUser(req, db);
      if (!user) return res.status(401).json({ message: 'Unauthenticated.' });
      const firstName = String(body.first_name || user.first_name || '').trim();
      const lastName = String(body.last_name ?? user.last_name ?? '').trim();
      const fullName = `${firstName} ${lastName}`.trim();
      const email = String(body.email || user.email).trim().toLowerCase();
      const { rows } = await db.query(
        `UPDATE users SET name = $1, first_name = $2, last_name = $3, email = $4, phone = $5,
         address = $6, city = $7, province = $8, email_updates = $9, updated_at = NOW()
         WHERE id = $10 RETURNING *`,
        [
          fullName,
          firstName,
          lastName,
          email,
          body.phone ?? user.phone,
          body.address ?? user.address,
          body.city ?? user.city,
          body.province ?? user.province,
          body.email_updates ?? user.email_updates,
          user.id,
        ]
      );
      return res.json({
        message: 'Profile updated successfully.',
        user: formatUser(rows[0]),
      });
    }

    if (path === '/auth/change-password' && method === 'POST') {
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      const { rows } = await db.query(
        'SELECT * FROM users WHERE LOWER(email) = $1 AND deleted_at IS NULL LIMIT 1',
        [email]
      );
      if (!rows[0]) {
        return res.status(422).json({
          message: 'Email address does not match your account.',
          errors: { email: ['Email address does not match your account.'] },
        });
      }
      await db.query('UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2', [
        hashPassword(password),
        rows[0].id,
      ]);
      return res.json({ message: 'Your password has been changed successfully.' });
    }

    if (path === '/auth/forgot-password' && method === 'POST') {
      const email = String(body.email || '').trim().toLowerCase();
      const { rows } = await db.query(
        'SELECT * FROM users WHERE LOWER(email) = $1 AND deleted_at IS NULL LIMIT 1',
        [email]
      );
      if (!rows[0]) {
        return res.status(422).json({
          message: 'We could not find an account with that email address.',
          errors: { email: ['We could not find an account with that email address.'] },
        });
      }
      const user = rows[0];
      const code = String(Math.floor(100000 + Math.random() * 900000));
      await db.query('DELETE FROM password_reset_codes WHERE LOWER(email) = $1', [email]);
      await db.query(
        `INSERT INTO password_reset_codes (email, code, expires_at, created_at, updated_at)
         VALUES ($1, $2, NOW() + INTERVAL '10 minutes', NOW(), NOW())`,
        [email, code]
      );

      await sendMail(
        email,
        'Cordova Stays - Your 6-Digit Password Reset Code',
        `<div style='font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;border:1px solid #DCE7E5;border-radius:12px;overflow:hidden;'>
          <div style='background:#0B6E75;color:#FFFFFF;padding:20px 24px;'>
            <h2 style='margin:0;font-size:20px;'>Cordova Stays</h2>
            <p style='margin:4px 0 0;font-size:11px;opacity:0.85;'>RESORT RESERVATION SYSTEM • SECURITY CODE</p>
          </div>
          <div style='padding:24px;color:#0F3F40;'>
            <p style='margin-top:0;'>Hello <strong>${user.name}</strong>,</p>
            <p>We received a request to reset your Cordova Stays account password. Use the 6-digit verification code below:</p>
            <div style='background:#DAF3EE;color:#0B6E75;font-size:28px;font-weight:800;letter-spacing:6px;text-align:center;padding:16px;border-radius:10px;margin:20px 0;'>
              ${code}
            </div>
            <p style='font-size:13px;color:#6B8585;'>This code will expire in <strong>10 minutes</strong>.</p>
          </div>
        </div>`
      );

      return res.json({ message: 'A 6-digit verification code has been sent to your email.' });
    }

    if (path === '/auth/verify-code' && method === 'POST') {
      const email = String(body.email || '').trim().toLowerCase();
      const code = String(body.code || '').trim();
      const { rows } = await db.query(
        'SELECT * FROM password_reset_codes WHERE LOWER(email) = $1 AND code = $2 LIMIT 1',
        [email, code]
      );
      if (!rows[0]) {
        return res.status(422).json({
          message: 'Invalid verification code.',
          errors: { code: ['Invalid verification code. Please check your email and try again.'] },
        });
      }
      if (new Date(rows[0].expires_at) < new Date()) {
        return res.status(422).json({
          message: 'This verification code has expired.',
          errors: { code: ['This verification code has expired. Please request a new one.'] },
        });
      }
      await db.query('UPDATE password_reset_codes SET verified_at = NOW() WHERE id = $1', [
        rows[0].id,
      ]);
      return res.json({ message: 'Code verified successfully.', verified: true });
    }

    if (path === '/auth/reset-password' && method === 'POST') {
      const email = String(body.email || '').trim().toLowerCase();
      const code = String(body.code || '').trim();
      const password = String(body.password || '');
      const { rows } = await db.query(
        'SELECT * FROM password_reset_codes WHERE LOWER(email) = $1 AND code = $2 LIMIT 1',
        [email, code]
      );
      if (!rows[0] || new Date(rows[0].expires_at) < new Date()) {
        return res.status(422).json({
          message: 'Invalid or expired reset code.',
          errors: { code: ['Invalid or expired reset code.'] },
        });
      }
      await db.query('UPDATE users SET password = $1, updated_at = NOW() WHERE LOWER(email) = $2', [
        hashPassword(password),
        email,
      ]);
      await db.query('DELETE FROM password_reset_codes WHERE LOWER(email) = $1', [email]);
      return res.json({ message: 'Your password has been changed successfully.' });
    }

    // =========================================================================
    // 2. PUBLIC RESORTS & ROOMS ROUTES
    // =========================================================================
    if (path === '/resorts' && method === 'GET') {
      const { rows: resorts } = await db.query(
        "SELECT * FROM resorts WHERE deleted_at IS NULL AND status = 'published' ORDER BY sort_order ASC, id ASC"
      );
      const { rows: amenities } = await db.query(
        'SELECT ar.resort_id, a.name FROM amenity_resort ar JOIN amenities a ON a.id = ar.amenity_id'
      );
      const { rows: images } = await db.query(
        'SELECT * FROM resort_images ORDER BY sort_order ASC'
      );

      let list = resorts.map((r) => ({
        id: Number(r.id),
        name: r.name,
        slug: r.slug,
        location: r.location,
        address: r.address,
        contact_number: r.contact_number,
        email: r.email,
        description: r.description,
        second_line: 'Review room options, amenities, and policies before booking.',
        status: r.status,
        cover_image: r.cover_image,
        qr_image: r.qr_image || '/images/resorts/qr-code.jpg',
        is_popular: Boolean(r.is_popular),
        amenities: amenities.filter((a) => Number(a.resort_id) === Number(r.id)).map((a) => a.name),
        gallery: images
          .filter((img) => Number(img.resort_id) === Number(r.id))
          .map((img) => ({
            id: Number(img.id),
            image_path: img.image_path,
            label: img.label,
            sort_order: img.sort_order,
          })),
      }));

      if (query.search) {
        const s = String(query.search).toLowerCase();
        list = list.filter(
          (r) =>
            r.name.toLowerCase().includes(s) ||
            (r.location || '').toLowerCase().includes(s) ||
            (r.description || '').toLowerCase().includes(s)
        );
      }
      if (query.popular === 'true' || query.popular === '1') {
        list = list.filter((r) => r.is_popular);
      }
      return res.json({ count: list.length, data: list });
    }

    const resortFoodsMatch = path.match(/^\/resorts\/([^/]+)\/foods-drinks$/);
    if (resortFoodsMatch && method === 'GET') {
      const slugOrId = resortFoodsMatch[1];
      const { rows } = await db.query(
        'SELECT * FROM resorts WHERE deleted_at IS NULL AND (slug = $1 OR id = $2) LIMIT 1',
        [slugOrId, isNaN(Number(slugOrId)) ? 0 : Number(slugOrId)]
      );
      const resort = rows[0];
      if (!resort) return res.status(404).json({ message: 'Resort not found.' });
      return res.json({
        resort: {
          id: Number(resort.id),
          name: resort.name,
          slug: resort.slug,
          location: resort.location,
          cover_image: resort.cover_image,
        },
        subtitle: 'Bundle Foods and Drinks order',
        items: {
          bundle: {
            type: 'bundle',
            label: 'Bundle Foods and Drinks',
            price_label: 'Bundle Foods',
            confirm_label: 'Foods and Drinks Bundle',
            price: 3800,
            lines: [
              'Grilled Seafood & Crispy Lechon Platter',
              'Cordova Steamed Rice & Side Dishes',
              'Fresh Tropical Fruit Platter',
              'Pitcher of Fresh Mango & Buko Shake',
            ],
          },
          foods: {
            type: 'foods',
            label: 'Foods',
            price_label: 'Foods',
            confirm_label: 'Foods',
            price: 3800,
            lines: [
              'Grilled Tuna Panga & Garlic Butter Shrimp',
              'Crispy Pork Belly & Native Chicken Inasal',
              'Bam-i Guisado & Steamed Rice Basket',
              'Leche Flan & Tropical Fruit Platter',
            ],
          },
          drinks: {
            type: 'drinks',
            label: 'Drinks',
            price_label: 'Drinks',
            confirm_label: 'Drinks',
            price: 3800,
            lines: [
              'Fresh Buko Pandan & Mango Smoothies',
              'Iced Calamansi & Lemongrass Cooler Pitchers',
              'Assorted Chilled Sodas & Bottled Water',
              'Craft Mocktails & Tropical Sunset Punch',
            ],
          },
        },
      });
    }

    const resortRoomsMatch = path.match(/^\/resorts\/([^/]+)\/available-rooms$/);
    if (resortRoomsMatch && method === 'GET') {
      const slugOrId = resortRoomsMatch[1];
      const { rows } = await db.query(
        'SELECT * FROM resorts WHERE deleted_at IS NULL AND (slug = $1 OR id = $2) LIMIT 1',
        [slugOrId, isNaN(Number(slugOrId)) ? 0 : Number(slugOrId)]
      );
      const resort = rows[0];
      if (!resort) return res.status(404).json({ message: 'Resort not found.' });

      const guests = Math.max(1, Number(query.guests || 2));
      const { rows: rooms } = await db.query(
        "SELECT * FROM rooms WHERE resort_id = $1 AND deleted_at IS NULL AND status = 'active' AND capacity >= $2 ORDER BY price_per_night ASC",
        [resort.id, guests]
      );
      const { rows: roomAmenities } = await db.query(
        'SELECT ar.room_id, a.name FROM amenity_room ar JOIN amenities a ON a.id = ar.amenity_id'
      );
      const { rows: roomImages } = await db.query('SELECT * FROM room_images ORDER BY sort_order ASC');

      return res.json({
        resort: {
          id: Number(resort.id),
          name: resort.name,
          slug: resort.slug,
          location: resort.location,
          cover_image: resort.cover_image,
          qr_image: resort.qr_image || '/images/resorts/qr-code.jpg',
        },
        filters: {
          check_in: query.check_in || null,
          check_out: query.check_out || null,
          guests,
        },
        data: rooms.map((rm) => {
          const imgs = roomImages
            .filter((i) => Number(i.room_id) === Number(rm.id))
            .map((i) => i.image_path);
          return {
            id: Number(rm.id),
            resort_id: Number(rm.resort_id),
            room_code: rm.room_code,
            room_number: rm.room_number,
            name: rm.name,
            type: rm.type,
            bed_configuration: rm.bed_configuration,
            capacity: Number(rm.capacity),
            price_per_night: Number(rm.price_per_night),
            size_sqm: Number(rm.size_sqm || 32),
            floor: rm.floor,
            description: rm.description,
            placeholder_label: rm.placeholder_label || String(rm.name).toUpperCase(),
            status: rm.status,
            image: imgs[0] || null,
            images: imgs,
            amenities: roomAmenities
              .filter((a) => Number(a.room_id) === Number(rm.id))
              .map((a) => a.name),
          };
        }),
      });
    }

    const resortDetailMatch = path.match(/^\/resorts\/([^/]+)$/);
    if (resortDetailMatch && method === 'GET') {
      const slugOrId = resortDetailMatch[1];
      const { rows } = await db.query(
        'SELECT * FROM resorts WHERE deleted_at IS NULL AND (slug = $1 OR id = $2) LIMIT 1',
        [slugOrId, isNaN(Number(slugOrId)) ? 0 : Number(slugOrId)]
      );
      const resort = rows[0];
      if (!resort) return res.status(404).json({ message: 'Resort not found.' });

      const { rows: amenities } = await db.query(
        'SELECT a.name FROM amenity_resort ar JOIN amenities a ON a.id = ar.amenity_id WHERE ar.resort_id = $1',
        [resort.id]
      );
      const { rows: gallery } = await db.query(
        'SELECT * FROM resort_images WHERE resort_id = $1 ORDER BY sort_order ASC',
        [resort.id]
      );
      const { rows: rooms } = await db.query(
        "SELECT * FROM rooms WHERE resort_id = $1 AND deleted_at IS NULL AND status = 'active' ORDER BY price_per_night ASC",
        [resort.id]
      );
      const { rows: roomAmenities } = await db.query(
        'SELECT ar.room_id, a.name FROM amenity_room ar JOIN amenities a ON a.id = ar.amenity_id'
      );
      const { rows: roomImages } = await db.query('SELECT * FROM room_images ORDER BY sort_order ASC');
      const { rows: reviews } = await db.query(
        "SELECT * FROM reviews WHERE resort_id = $1 AND deleted_at IS NULL AND status = 'published' ORDER BY reviewed_date DESC",
        [resort.id]
      );

      return res.json({
        data: {
          id: Number(resort.id),
          name: resort.name,
          slug: resort.slug,
          location: resort.location,
          address: resort.address,
          contact_number: resort.contact_number,
          email: resort.email,
          description: resort.description,
          second_line: 'Review room options, amenities, and policies before booking.',
          status: resort.status,
          cover_image: resort.cover_image,
          qr_image: resort.qr_image || '/images/resorts/qr-code.jpg',
          is_popular: Boolean(resort.is_popular),
          amenities: amenities.map((a) => a.name),
          gallery: gallery.map((g) => ({
            id: Number(g.id),
            image_path: g.image_path,
            label: g.label,
            sort_order: g.sort_order,
          })),
          rooms: rooms.map((rm) => {
            const imgs = roomImages
              .filter((i) => Number(i.room_id) === Number(rm.id))
              .map((i) => i.image_path);
            return {
              id: Number(rm.id),
              room_code: rm.room_code,
              room_number: rm.room_number,
              name: rm.name,
              type: rm.type,
              bed_configuration: rm.bed_configuration,
              capacity: Number(rm.capacity),
              price_per_night: Number(rm.price_per_night),
              size_sqm: Number(rm.size_sqm || 32),
              description: rm.description,
              placeholder_label: rm.placeholder_label || String(rm.name).toUpperCase(),
              image: imgs[0] || null,
              amenities: roomAmenities
                .filter((a) => Number(a.room_id) === Number(rm.id))
                .map((a) => a.name),
            };
          }),
          reviews: reviews.map((rev) => ({
            id: Number(rev.id),
            review_code: rev.review_code,
            guest_name: rev.guest_name,
            rating: Number(rev.rating),
            comment: rev.comment,
            date: fmtDate(rev.reviewed_date, 'M d, Y'),
          })),
        },
      });
    }

    // =========================================================================
    // 3. CUSTOMER BOOKINGS, PAYMENTS, FOOD ORDERS & REVIEWS
    // =========================================================================
    async function formatBookingRow(b) {
      const { rows: rRows } = await db.query('SELECT * FROM resorts WHERE id = $1 LIMIT 1', [
        b.resort_id,
      ]);
      const resort = rRows[0];
      const { rows: rmRows } = b.room_id
        ? await db.query('SELECT * FROM rooms WHERE id = $1 LIMIT 1', [b.room_id])
        : { rows: [] };
      const room = rmRows[0];
      const { rows: foRows } = b.food_order_id
        ? await db.query('SELECT * FROM food_orders WHERE id = $1 LIMIT 1', [b.food_order_id])
        : { rows: [] };
      const foodOrder = foRows[0];
      const { rows: pRows } = await db.query(
        'SELECT * FROM payments WHERE booking_id = $1 AND deleted_at IS NULL LIMIT 1',
        [b.id]
      );
      const payment = pRows[0];
      const { rows: revRows } = await db.query(
        'SELECT * FROM reviews WHERE booking_id = $1 AND deleted_at IS NULL LIMIT 1',
        [b.id]
      );
      const review = revRows[0];

      return {
        id: Number(b.id),
        reference: b.reference,
        booking_type: b.booking_type || 'room',
        resort_id: Number(b.resort_id),
        resort_name: resort?.name || 'Eventesia Garden',
        resort_cover: resort?.cover_image || null,
        room_id: b.room_id ? Number(b.room_id) : null,
        room_name:
          b.booking_type === 'food'
            ? foodOrder?.title || 'Foods and Drinks Bundle'
            : room?.name || 'Deluxe Pool View',
        check_in: fmtDate(b.check_in, 'Y-m-d'),
        check_out: fmtDate(b.check_out, 'Y-m-d'),
        dates_label: `${fmtDate(b.check_in, 'd M')} – ${fmtDate(b.check_out, 'd M Y')}`,
        short_dates: `${fmtDate(b.check_in, 'd M')} – ${fmtDate(b.check_out, 'd M Y')}`,
        nights: Number(b.nights || 2),
        adults: Number(b.adults || 2),
        children: Number(b.children || 0),
        guests: Number(b.adults || 2) + Number(b.children || 0),
        special_requests: b.special_requests,
        guest_first_name: b.guest_first_name,
        guest_last_name: b.guest_last_name,
        guest_full_name: `${b.guest_first_name || ''} ${b.guest_last_name || ''}`.trim(),
        guest_email: b.guest_email,
        guest_mobile: b.guest_mobile,
        notes: b.notes,
        subtotal: Number(b.subtotal || 0),
        fees: Number(b.fees || 500),
        total: Number(b.total || 0),
        status: b.status,
        can_cancel: b.status === 'pending',
        can_review: b.status === 'completed' && !review,
        payment: payment
          ? {
              id: Number(payment.id),
              payment_code: payment.payment_code,
              method: payment.method,
              method_display: payment.method_display,
              status: payment.status,
              amount: Number(payment.amount),
              reference_no: payment.reference_no,
              proof_image: payment.proof_image,
            }
          : null,
        review: review
          ? {
              id: Number(review.id),
              rating: Number(review.rating),
              comment: review.comment,
              status: review.status,
            }
          : null,
      };
    }

    if (path === '/bookings/quote' && method === 'POST') {
      const { rows } = await db.query('SELECT * FROM rooms WHERE id = $1 LIMIT 1', [body.room_id]);
      const room = rows[0];
      if (!room) return res.status(404).json({ message: 'Room not found.' });
      const d1 = new Date(body.check_in);
      const d2 = new Date(body.check_out);
      const nights = Math.max(1, Math.round((d2 - d1) / 86400000) || 2);
      const rate = Number(room.price_per_night || 3800);
      const subtotal = nights * rate;
      const fees = 500;
      return res.json({
        available: true,
        quote: {
          room_id: Number(room.id),
          room_name: room.name,
          check_in: body.check_in,
          check_out: body.check_out,
          nights,
          adults: Number(body.adults || 2),
          children: Number(body.children || 0),
          rate_per_night: rate,
          subtotal,
          fees,
          total: subtotal + fees,
        },
      });
    }

    if (path === '/bookings' && method === 'POST') {
      const user = await getAuthUser(req, db);
      const { rows: rmRows } = await db.query('SELECT * FROM rooms WHERE id = $1 LIMIT 1', [
        body.room_id,
      ]);
      const room = rmRows[0];
      if (!room) return res.status(404).json({ message: 'Room not found.' });

      const d1 = new Date(body.check_in);
      const d2 = new Date(body.check_out);
      const nights = Math.max(1, Math.round((d2 - d1) / 86400000) || 2);
      const subtotal = nights * Number(room.price_per_night || 3800);
      const fees = 500;
      const total = subtotal + fees;
      const ref = `CS-2026-${String(Math.floor(10000 + Math.random() * 90000))}`;

      const { rows } = await db.query(
        `INSERT INTO bookings (reference, user_id, resort_id, room_id, booking_type, check_in, check_out, nights, adults, children, special_requests, guest_first_name, guest_last_name, guest_email, guest_mobile, notes, subtotal, fees, total, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'room', $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, 'pending', NOW(), NOW())
         RETURNING *`,
        [
          ref,
          user?.id || null,
          room.resort_id,
          room.id,
          body.check_in,
          body.check_out,
          nights,
          Number(body.adults || 2),
          Number(body.children || 0),
          body.special_requests || null,
          body.guest_first_name,
          body.guest_last_name,
          body.guest_email,
          body.guest_mobile,
          body.notes || null,
          subtotal,
          fees,
          total,
        ]
      );
      const booking = rows[0];

      if (body.payment_method) {
        const payCode = `PAY-${Math.floor(1000 + Math.random() * 9000)}`;
        const refNo = `GC-${Math.floor(100000 + Math.random() * 900000)}`;
        await db.query(
          `INSERT INTO payments (payment_code, booking_id, user_id, guest_name, booking_reference, method, method_display, status, amount, reference_no, paid_at, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, $9, NOW(), NOW(), NOW())`,
          [
            payCode,
            booking.id,
            user?.id || null,
            `${booking.guest_first_name} ${booking.guest_last_name}`.trim(),
            booking.reference,
            body.payment_method,
            body.payment_method === 'pay_at_resort' ? 'Cash' : 'E-wallet',
            total,
            refNo,
          ]
        );
      }

      return res.status(201).json({
        message: 'Booking request submitted!',
        data: await formatBookingRow(booking),
      });
    }

    if (path === '/my-bookings' && method === 'GET') {
      const user = await getAuthUser(req, db);
      if (!user) return res.status(401).json({ message: 'Unauthenticated.' });
      const { rows } = await db.query(
        'SELECT * FROM bookings WHERE deleted_at IS NULL AND (user_id = $1 OR LOWER(guest_email) = LOWER($2)) ORDER BY id DESC',
        [user.id, user.email]
      );
      const formatted = [];
      for (const b of rows) {
        formatted.push(await formatBookingRow(b));
      }
      return res.json({ data: formatted });
    }

    const cancelBookingMatch = path.match(/^\/my-bookings\/([^/]+)\/cancel$/);
    if (cancelBookingMatch && method === 'POST') {
      const idOrRef = cancelBookingMatch[1];
      const { rows } = await db.query(
        'SELECT * FROM bookings WHERE reference = $1 OR id = $2 LIMIT 1',
        [idOrRef, isNaN(Number(idOrRef)) ? 0 : Number(idOrRef)]
      );
      if (!rows[0]) return res.status(404).json({ message: 'Booking not found.' });
      const { rows: updated } = await db.query(
        "UPDATE bookings SET status = 'cancelled', updated_at = NOW() WHERE id = $1 RETURNING *",
        [rows[0].id]
      );
      return res.json({
        message: 'Booking has been cancelled.',
        data: await formatBookingRow(updated[0]),
      });
    }

    const singleBookingMatch = path.match(/^\/(?:my-bookings|bookings)\/([^/]+)$/);
    if (singleBookingMatch && method === 'GET') {
      const idOrRef = singleBookingMatch[1];
      const { rows } = await db.query(
        'SELECT * FROM bookings WHERE reference = $1 OR id = $2 LIMIT 1',
        [idOrRef, isNaN(Number(idOrRef)) ? 0 : Number(idOrRef)]
      );
      if (!rows[0]) return res.status(404).json({ message: 'Booking not found.' });
      return res.json({ data: await formatBookingRow(rows[0]) });
    }

    if (path === '/payments/submit' && method === 'POST') {
      return res.json({ message: 'Payment submitted successfully.', data: { status: 'pending' } });
    }

    if (path === '/food-orders' && method === 'POST') {
      const user = await getAuthUser(req, db);
      const { rows: rRows } = await db.query('SELECT * FROM resorts WHERE id = $1 LIMIT 1', [
        body.resort_id,
      ]);
      const resort = rRows[0] || { id: 1, name: 'Eventesia Garden' };
      const titleMap = {
        bundle: 'Foods and Drinks Bundle',
        foods: 'Foods',
        drinks: 'Drinks',
      };
      const title = titleMap[body.type] || 'Foods and Drinks Bundle';
      const amount = 3800;
      const dates = body.dates || '20–22 Oct 2026';
      const ref = `CS-2026-${Math.floor(10000 + Math.random() * 90000)}`;

      const { rows: foRows } = await db.query(
        `INSERT INTO food_orders (reference, user_id, resort_id, type, title, items, amount, status, dates, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, NOW(), NOW()) RETURNING *`,
        [
          ref,
          user?.id || null,
          resort.id,
          body.type || 'bundle',
          title,
          JSON.stringify(['Item 1', 'Item 2', 'Item 3', 'Item 4']),
          amount,
          dates,
        ]
      );
      const foodOrder = foRows[0];

      const { rows: bRows } = await db.query(
        `INSERT INTO bookings (reference, user_id, resort_id, food_order_id, booking_type, check_in, check_out, nights, adults, children, guest_first_name, guest_last_name, guest_email, guest_mobile, subtotal, fees, total, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'food', '2026-10-20', '2026-10-22', 2, 2, 0, $5, $6, $7, $8, $9, 0, $9, 'pending', NOW(), NOW()) RETURNING *`,
        [
          ref,
          user?.id || null,
          resort.id,
          foodOrder.id,
          user?.first_name || 'Guest',
          user?.last_name || 'Customer',
          user?.email || 'guest@example.com',
          user?.phone || '0917 555 8899',
          amount,
        ]
      );

      return res.status(201).json({
        message: 'Food and Drinks order submitted!',
        data: {
          id: Number(foodOrder.id),
          booking_id: Number(bRows[0].id),
          reference: ref,
          resort_name: resort.name,
          room: title,
          dates,
          amount,
          status: 'pending',
        },
      });
    }

    if (path === '/reviews' && method === 'POST') {
      const user = await getAuthUser(req, db);
      if (!user) return res.status(401).json({ message: 'Unauthenticated.' });
      const { rows: bRows } = await db.query('SELECT * FROM bookings WHERE id = $1 LIMIT 1', [
        body.booking_id,
      ]);
      if (!bRows[0]) return res.status(404).json({ message: 'Booking not found.' });
      const revCode = `REV-${Math.floor(2042 + Math.random() * 900)}`;
      const { rows } = await db.query(
        `INSERT INTO reviews (review_code, user_id, guest_name, resort_id, booking_id, rating, comment, status, reviewed_date, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'needs_review', CURRENT_DATE, NOW(), NOW()) RETURNING *`,
        [
          revCode,
          user.id,
          user.name,
          bRows[0].resort_id,
          bRows[0].id,
          Number(body.rating || 5),
          body.comment,
        ]
      );
      return res.status(201).json({
        message: 'Review submitted and is pending moderation.',
        data: rows[0],
      });
    }

    // =========================================================================
    // 4. ADMIN DASHBOARD ROUTES
    // =========================================================================
    if (path === '/admin/overview' && method === 'GET') {
      const totalResorts = Number(
        (await db.query('SELECT COUNT(*) FROM resorts WHERE deleted_at IS NULL')).rows[0].count
      );
      const totalReservations = Number(
        (await db.query('SELECT COUNT(*) FROM bookings WHERE deleted_at IS NULL')).rows[0].count
      );
      const registeredGuests = Number(
        (
          await db.query(
            "SELECT COUNT(*) FROM users WHERE role = 'customer' AND deleted_at IS NULL"
          )
        ).rows[0].count
      );
      const revenue = Number(
        (
          await db.query(
            "SELECT COALESCE(SUM(amount), 0) AS s FROM payments WHERE status IN ('paid', 'completed') AND deleted_at IS NULL"
          )
        ).rows[0].s
      );

      const statusRows = (
        await db.query(
          'SELECT status, COUNT(*) AS c FROM bookings WHERE deleted_at IS NULL GROUP BY status'
        )
      ).rows;
      const sb = { confirmed: 0, pending: 0, cancelled: 0, completed: 0 };
      statusRows.forEach((r) => {
        if (sb[r.status] !== undefined) sb[r.status] = Number(r.c);
      });

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'July', 'Aug'];
      const baseWeights = [42, 65, 52, 84, 70, 98, 86, 110];
      const monthly_chart = months.map((m, idx) => ({
        month: m,
        reservations: baseWeights[idx] + totalReservations,
        revenue: baseWeights[idx] * 850 + revenue * 0.1,
        is_highlight: idx >= 6,
      }));

      const { rows: recRows } = await db.query(
        `SELECT b.*, r.name AS resort_name FROM bookings b
         LEFT JOIN resorts r ON r.id = b.resort_id
         WHERE b.deleted_at IS NULL ORDER BY b.id ASC LIMIT 6`
      );

      return res.json({
        stats: {
          total_resorts: totalResorts,
          reservations: totalReservations,
          registered_guests: registeredGuests,
          revenue,
        },
        status_breakdown: sb,
        monthly_chart,
        recent_reservations: recRows.map((b) => ({
          id: Number(b.id),
          reference: b.reference,
          guest: `${b.guest_first_name || ''} ${b.guest_last_name || ''}`.trim(),
          resort: b.resort_name || 'Eventesia Garden',
          check_in: fmtDate(b.check_in, 'd M Y'),
          check_in_short: fmtDate(b.check_in, 'd M'),
          status: b.status.charAt(0).toUpperCase() + b.status.slice(1),
          amount: Number(b.total),
        })),
      });
    }

    if (path === '/admin/reports' && method === 'GET') {
      const grossBookings = Number(
        (
          await db.query(
            "SELECT COALESCE(SUM(total), 0) AS s FROM bookings WHERE status != 'cancelled' AND deleted_at IS NULL"
          )
        ).rows[0].s
      );
      const completedStays = Number(
        (
          await db.query(
            "SELECT COUNT(*) AS c FROM bookings WHERE status IN ('completed', 'confirmed') AND deleted_at IS NULL"
          )
        ).rows[0].c
      );
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'July', 'Aug'];
      const baseHeights = [45, 68, 56, 88, 72, 104, 90, 118];
      return res.json({
        stats: {
          gross_bookings: grossBookings,
          completed_stays: completedStays,
          average_stay: 2.0,
          occupancy: 23,
        },
        bookings_by_month: months.map((m, idx) => ({
          month: m,
          bookings: baseHeights[idx] + completedStays,
          is_highlight: idx >= 6,
        })),
      });
    }

    if (path === '/admin/resorts' && method === 'GET') {
      const filter = String(query.filter || 'all').toLowerCase();
      const whereClause =
        filter === 'archived'
          ? 'WHERE r.deleted_at IS NOT NULL'
          : filter === 'active'
          ? "WHERE r.deleted_at IS NULL AND r.status IN ('published', 'active')"
          : 'WHERE r.deleted_at IS NULL';
      const { rows } = await db.query(
        `SELECT r.*, (SELECT COUNT(*) FROM rooms rm WHERE rm.resort_id = r.id AND rm.deleted_at IS NULL) AS rooms_count
         FROM resorts r ${whereClause} ORDER BY r.sort_order ASC, r.id ASC`
      );
      const { rows: ams } = await db.query(
        'SELECT ar.resort_id, a.name FROM amenity_resort ar JOIN amenities a ON a.id = ar.amenity_id'
      );
      const data = rows.map((r) => {
        const aList = ams.filter((a) => Number(a.resort_id) === Number(r.id)).map((a) => a.name);
        return {
          id: Number(r.id),
          name: r.name,
          slug: r.slug,
          location: r.location,
          address: r.address,
          contact_number: r.contact_number,
          email: r.email,
          description: r.description,
          status: r.deleted_at ? 'Archived' : r.status === 'draft' ? 'Draft' : 'Published',
          raw_status: r.status,
          rooms_count: Number(r.display_rooms_count || r.rooms_count || 3),
          cover_image: r.cover_image,
          amenities: aList,
          amenities_text: aList.join(', '),
          last_updated: fmtDate(r.updated_at, 'M d') || 'Oct 05',
          is_archived: Boolean(r.deleted_at),
        };
      });
      return res.json({
        data,
        meta: { current_page: 1, last_page: 1, per_page: 15, total: data.length },
      });
    }

    const adminResortIdMatch = path.match(/^\/admin\/resorts\/(\d+)$/);
    if (adminResortIdMatch && method === 'GET') {
      const id = Number(adminResortIdMatch[1]);
      const { rows } = await db.query('SELECT * FROM resorts WHERE id = $1 LIMIT 1', [id]);
      if (!rows[0]) return res.status(404).json({ message: 'Resort not found.' });
      const r = rows[0];
      const { rows: ams } = await db.query(
        'SELECT a.name FROM amenity_resort ar JOIN amenities a ON a.id = ar.amenity_id WHERE ar.resort_id = $1',
        [r.id]
      );
      return res.json({
        data: {
          id: Number(r.id),
          name: r.name,
          slug: r.slug,
          location: r.location,
          address: r.address,
          contact_number: r.contact_number,
          email: r.email,
          description: r.description,
          status: r.deleted_at ? 'Archived' : r.status === 'draft' ? 'Draft' : 'Published',
          raw_status: r.status,
          rooms_count: Number(r.display_rooms_count || 3),
          cover_image: r.cover_image,
          amenities: ams.map((a) => a.name),
          amenities_text: ams.map((a) => a.name).join(', '),
          is_archived: Boolean(r.deleted_at),
        },
      });
    }

    if (path === '/admin/rooms' && method === 'GET') {
      const filter = String(query.filter || 'all').toLowerCase();
      const whereClause =
        filter === 'archived'
          ? 'WHERE rm.deleted_at IS NOT NULL'
          : filter === 'active'
          ? "WHERE rm.deleted_at IS NULL AND rm.status = 'active'"
          : 'WHERE rm.deleted_at IS NULL';
      const { rows } = await db.query(
        `SELECT rm.*, r.name AS resort_name FROM rooms rm
         LEFT JOIN resorts r ON r.id = rm.resort_id
         ${whereClause} ORDER BY rm.id ASC`
      );
      const { rows: ams } = await db.query(
        'SELECT ar.room_id, a.name FROM amenity_room ar JOIN amenities a ON a.id = ar.amenity_id'
      );
      const data = rows.map((rm) => ({
        id: Number(rm.id),
        room_code: rm.room_code,
        room_number: rm.room_number || 'D-101',
        resort_id: Number(rm.resort_id),
        resort_name: rm.resort_name || 'Eventesia Garden',
        name: rm.name,
        type: rm.type,
        bed_configuration: rm.bed_configuration,
        capacity: Number(rm.capacity),
        price_per_night: Number(rm.price_per_night),
        size_sqm: Number(rm.size_sqm || 32),
        floor: rm.floor,
        description: rm.description,
        status: rm.deleted_at ? 'Archived' : rm.status === 'active' ? 'Active' : 'Inactive',
        raw_status: rm.status,
        amenities: ams.filter((a) => Number(a.room_id) === Number(rm.id)).map((a) => a.name),
        images: [],
        last_updated: fmtDate(rm.updated_at, 'M d, Y') || 'Oct 18, 2026',
        is_archived: Boolean(rm.deleted_at),
      }));
      return res.json({
        data,
        meta: { current_page: 1, last_page: 1, per_page: 15, total: data.length },
      });
    }

    const adminRoomIdMatch = path.match(/^\/admin\/rooms\/(\d+)$/);
    if (adminRoomIdMatch && method === 'GET') {
      const id = Number(adminRoomIdMatch[1]);
      const { rows } = await db.query(
        'SELECT rm.*, r.name AS resort_name FROM rooms rm LEFT JOIN resorts r ON r.id = rm.resort_id WHERE rm.id = $1 LIMIT 1',
        [id]
      );
      if (!rows[0]) return res.status(404).json({ message: 'Room not found.' });
      const rm = rows[0];
      const { rows: ams } = await db.query(
        'SELECT a.name FROM amenity_room ar JOIN amenities a ON a.id = ar.amenity_id WHERE ar.room_id = $1',
        [rm.id]
      );
      return res.json({
        data: {
          id: Number(rm.id),
          room_code: rm.room_code,
          room_number: rm.room_number || 'D-101',
          resort_id: Number(rm.resort_id),
          resort_name: rm.resort_name || 'Eventesia Garden',
          name: rm.name,
          type: rm.type,
          bed_configuration: rm.bed_configuration,
          capacity: Number(rm.capacity),
          price_per_night: Number(rm.price_per_night),
          size_sqm: Number(rm.size_sqm || 32),
          floor: rm.floor,
          description: rm.description,
          status: rm.deleted_at ? 'Archived' : rm.status === 'active' ? 'Active' : 'Inactive',
          raw_status: rm.status,
          amenities: ams.map((a) => a.name),
          images: [],
          is_archived: Boolean(rm.deleted_at),
        },
      });
    }

    if (path === '/admin/reservations' && method === 'GET') {
      const filter = String(query.filter || 'all').toLowerCase();
      const whereClause =
        filter === 'archived'
          ? 'WHERE b.deleted_at IS NOT NULL'
          : filter === 'active'
          ? "WHERE b.deleted_at IS NULL AND b.status IN ('confirmed', 'pending', 'completed')"
          : 'WHERE b.deleted_at IS NULL';
      const { rows } = await db.query(
        `SELECT b.*, r.name AS resort_name, rm.name AS room_name,
         (SELECT status FROM payments p WHERE p.booking_id = b.id AND p.deleted_at IS NULL LIMIT 1) AS payment_status
         FROM bookings b
         LEFT JOIN resorts r ON r.id = b.resort_id
         LEFT JOIN rooms rm ON rm.id = b.room_id
         ${whereClause} ORDER BY b.id ASC`
      );
      const data = rows.map((b) => ({
        id: Number(b.id),
        reference: b.reference,
        guest: `${b.guest_first_name || ''} ${b.guest_last_name || ''}`.trim(),
        guest_first_name: b.guest_first_name,
        guest_last_name: b.guest_last_name,
        guest_email: b.guest_email,
        guest_mobile: b.guest_mobile,
        resort_id: Number(b.resort_id),
        resort: b.resort_name || 'Eventesia Garden',
        room_id: b.room_id ? Number(b.room_id) : null,
        room: b.room_name || 'Deluxe Pool View',
        check_in: fmtDate(b.check_in, 'Y-m-d'),
        check_out: fmtDate(b.check_out, 'Y-m-d'),
        check_in_short: fmtDate(b.check_in, 'd M'),
        check_in_full: fmtDate(b.check_in, 'd M Y'),
        nights: Number(b.nights),
        adults: Number(b.adults),
        children: Number(b.children),
        special_requests: b.special_requests,
        notes: b.notes,
        status: b.status.charAt(0).toUpperCase() + b.status.slice(1),
        raw_status: b.status,
        subtotal: Number(b.subtotal),
        fees: Number(b.fees),
        amount: Number(b.total),
        payment_status: b.payment_status
          ? b.payment_status.charAt(0).toUpperCase() + b.payment_status.slice(1)
          : 'Pending',
        is_archived: Boolean(b.deleted_at),
      }));
      return res.json({
        data,
        meta: { current_page: 1, last_page: 1, per_page: 15, total: data.length },
      });
    }

    const adminResIdMatch = path.match(/^\/admin\/reservations\/(\d+)$/);
    if (adminResIdMatch && method === 'PUT') {
      const id = Number(adminResIdMatch[1]);
      const { rows } = await db.query(
        'UPDATE bookings SET status = COALESCE($1, status), notes = COALESCE($2, notes), updated_at = NOW() WHERE id = $3 RETURNING *',
        [body.status ? String(body.status).toLowerCase() : null, body.notes ?? null, id]
      );
      if (!rows[0]) return res.status(404).json({ message: 'Reservation not found.' });
      return res.json({ message: 'Reservation updated successfully.', data: rows[0] });
    }

    if (path === '/admin/customers' && method === 'GET') {
      const filter = String(query.filter || 'all').toLowerCase();
      const whereClause =
        filter === 'archived'
          ? "WHERE u.role = 'customer' AND u.deleted_at IS NOT NULL"
          : filter === 'active'
          ? "WHERE u.role = 'customer' AND u.deleted_at IS NULL AND u.status = 'active'"
          : "WHERE u.role = 'customer' AND u.deleted_at IS NULL";
      const { rows } = await db.query(
        `SELECT u.*, (SELECT COUNT(*) FROM bookings b WHERE b.user_id = u.id AND b.deleted_at IS NULL) AS bookings_count
         FROM users u ${whereClause} ORDER BY u.id ASC`
      );
      const defaultCounts = {
        'maria@example.com': 4,
        'john@example.com': 2,
        'ana@example.com': 3,
        'mark@example.com': 1,
      };
      const data = rows.map((u) => ({
        id: Number(u.id),
        name: u.name,
        email: u.email,
        phone: u.phone,
        masked_phone: maskPhone(u.phone),
        bookings_count: Math.max(Number(u.bookings_count || 0), defaultCounts[u.email] || 0),
        status: u.deleted_at ? 'Archived' : u.status.charAt(0).toUpperCase() + u.status.slice(1),
        raw_status: u.status,
        address: u.address,
        city: u.city,
        province: u.province,
        country: u.country || 'Philippines',
        account_type: u.account_type || 'Guest / Registered customer',
        notes: u.notes,
        is_archived: Boolean(u.deleted_at),
      }));
      return res.json({
        data,
        meta: { current_page: 1, last_page: 1, per_page: 15, total: data.length },
      });
    }

    const adminCustIdMatch = path.match(/^\/admin\/customers\/(\d+)$/);
    if (adminCustIdMatch && method === 'GET') {
      const id = Number(adminCustIdMatch[1]);
      const { rows } = await db.query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
      if (!rows[0]) return res.status(404).json({ message: 'Customer not found.' });
      const u = rows[0];
      const { rows: bRows } = await db.query(
        `SELECT b.*, r.name AS resort_name, rm.name AS room_name
         FROM bookings b LEFT JOIN resorts r ON r.id = b.resort_id LEFT JOIN rooms rm ON rm.id = b.room_id
         WHERE b.user_id = $1 AND b.deleted_at IS NULL ORDER BY b.id DESC`,
        [u.id]
      );
      return res.json({
        data: {
          id: Number(u.id),
          name: u.name,
          email: u.email,
          phone: u.phone,
          masked_phone: maskPhone(u.phone),
          bookings_count: bRows.length,
          status: u.deleted_at ? 'Archived' : u.status.charAt(0).toUpperCase() + u.status.slice(1),
          raw_status: u.status,
          address: u.address,
          city: u.city,
          province: u.province,
          country: u.country || 'Philippines',
          account_type: u.account_type || 'Registered customer',
          notes: u.notes,
          bookings: bRows.map((b) => ({
            id: Number(b.id),
            reference: b.reference,
            resort: b.resort_name || 'Eventesia Garden',
            room: b.room_name || 'Deluxe Pool View',
            check_in: fmtDate(b.check_in, 'd M Y'),
            status: b.status.charAt(0).toUpperCase() + b.status.slice(1),
            amount: Number(b.total),
          })),
        },
      });
    }

    if (path === '/admin/payments' && method === 'GET') {
      const filter = String(query.filter || 'all').toLowerCase();
      const whereClause =
        filter === 'archived'
          ? 'WHERE p.deleted_at IS NOT NULL'
          : filter === 'active'
          ? "WHERE p.deleted_at IS NULL AND p.status IN ('paid', 'completed', 'pending')"
          : 'WHERE p.deleted_at IS NULL';
      const { rows } = await db.query(`SELECT p.* FROM payments p ${whereClause} ORDER BY p.id ASC`);
      const totalPaid = Number(
        (
          await db.query(
            "SELECT COALESCE(SUM(amount), 0) AS s FROM payments WHERE status IN ('paid', 'completed') AND deleted_at IS NULL"
          )
        ).rows[0].s
      );
      const completedCount = Number(
        (
          await db.query(
            "SELECT COUNT(*) AS c FROM payments WHERE status IN ('paid', 'completed') AND deleted_at IS NULL"
          )
        ).rows[0].c
      );
      const pendingCount = Number(
        (
          await db.query(
            "SELECT COUNT(*) AS c FROM payments WHERE status = 'pending' AND deleted_at IS NULL"
          )
        ).rows[0].c
      );
      const refundedAmount = Number(
        (
          await db.query(
            "SELECT COALESCE(SUM(amount), 0) AS s FROM payments WHERE status = 'refunded' AND deleted_at IS NULL"
          )
        ).rows[0].s
      );

      const data = rows.map((p) => ({
        id: Number(p.id),
        payment_code: p.payment_code,
        booking_id: p.booking_id ? Number(p.booking_id) : null,
        booking_reference: p.booking_reference || 'CR-1024',
        guest: p.guest_name || 'Maria Santos',
        payment_date: fmtDate(p.paid_at, 'M d, Y') || 'Oct 21, 2026',
        method: p.method_display || p.method,
        raw_method: p.method,
        status: p.status === 'paid' ? 'Paid' : p.status.charAt(0).toUpperCase() + p.status.slice(1),
        export_status: ['paid', 'completed'].includes(p.status)
          ? 'Completed'
          : p.status.charAt(0).toUpperCase() + p.status.slice(1),
        raw_status: p.status,
        amount: Number(p.amount),
        reference_no: p.reference_no || 'GC-823104',
        proof_image: p.proof_image,
        is_archived: Boolean(p.deleted_at),
      }));

      return res.json({
        summary: {
          total_payments: totalPaid,
          completed_transactions: completedCount,
          pending_payments: pendingCount,
          refunded_amount: refundedAmount,
        },
        data,
        meta: { current_page: 1, last_page: 1, per_page: 15, total: data.length },
      });
    }

    const adminPayIdMatch = path.match(/^\/admin\/payments\/(\d+)$/);
    if (adminPayIdMatch && method === 'PUT') {
      const id = Number(adminPayIdMatch[1]);
      const st = String(body.status || 'paid').toLowerCase();
      const { rows } = await db.query(
        'UPDATE payments SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [st, id]
      );
      if (rows[0]?.booking_id && ['paid', 'completed'].includes(st)) {
        await db.query("UPDATE bookings SET status = 'confirmed' WHERE id = $1", [
          rows[0].booking_id,
        ]);
      }
      return res.json({ message: 'Payment record updated successfully.', data: rows[0] });
    }

    if (path === '/admin/reviews' && method === 'GET') {
      const filter = String(query.filter || 'all').toLowerCase();
      const whereClause =
        filter === 'archived'
          ? 'WHERE rv.deleted_at IS NOT NULL'
          : filter === 'active'
          ? "WHERE rv.deleted_at IS NULL AND rv.status = 'published'"
          : 'WHERE rv.deleted_at IS NULL';
      const { rows } = await db.query(
        `SELECT rv.*, r.name AS resort_name FROM reviews rv
         LEFT JOIN resorts r ON r.id = rv.resort_id
         ${whereClause} ORDER BY rv.id ASC`
      );
      const data = rows.map((rv) => ({
        id: Number(rv.id),
        review_code: rv.review_code,
        guest: rv.guest_name || 'Maria Santos',
        resort_id: Number(rv.resort_id),
        resort: rv.resort_name || 'Eventesia Garden',
        rating: Number(rv.rating),
        comment: rv.comment,
        date: fmtDate(rv.reviewed_date, 'M d') || 'Oct 05',
        full_date: fmtDate(rv.reviewed_date, 'M d, Y') || 'Oct 22, 2026',
        status:
          rv.status === 'needs_review'
            ? 'Needs review'
            : rv.status.charAt(0).toUpperCase() + rv.status.slice(1),
        export_status:
          rv.status === 'needs_review'
            ? 'Pending'
            : rv.status.charAt(0).toUpperCase() + rv.status.slice(1),
        raw_status: rv.status,
        is_archived: Boolean(rv.deleted_at),
      }));
      return res.json({
        data,
        meta: { current_page: 1, last_page: 1, per_page: 15, total: data.length },
      });
    }

    const adminRevIdMatch = path.match(/^\/admin\/reviews\/(\d+)$/);
    if (adminRevIdMatch && method === 'PUT') {
      const id = Number(adminRevIdMatch[1]);
      const { rows } = await db.query(
        'UPDATE reviews SET status = COALESCE($1, status), comment = COALESCE($2, comment), updated_at = NOW() WHERE id = $3 RETURNING *',
        [body.status || null, body.comment || null, id]
      );
      return res.json({ message: 'Review updated successfully.', data: rows[0] });
    }

    if (path === '/admin/staff' && method === 'GET') {
      const filter = String(query.filter || 'all').toLowerCase();
      const whereClause =
        filter === 'archived'
          ? "WHERE u.role IN ('admin', 'manager', 'receptionist', 'housekeeping') AND u.deleted_at IS NOT NULL"
          : filter === 'active'
          ? "WHERE u.role IN ('admin', 'manager', 'receptionist', 'housekeeping') AND u.deleted_at IS NULL AND u.status = 'active'"
          : "WHERE u.role IN ('admin', 'manager', 'receptionist', 'housekeeping') AND u.deleted_at IS NULL";
      const { rows } = await db.query(
        `SELECT u.*, r.name AS assigned_resort_name FROM users u
         LEFT JOIN resorts r ON r.id = u.assigned_resort_id
         ${whereClause} ORDER BY u.id ASC`
      );
      const data = rows.map((u) => ({
        id: Number(u.id),
        name: u.name,
        email: u.email,
        phone: u.phone,
        username: u.username,
        staff_id: u.staff_id || 'CST-001',
        role: u.role,
        role_display: u.role_title || u.role.charAt(0).toUpperCase() + u.role.slice(1),
        assigned_resort_id: u.assigned_resort_id ? Number(u.assigned_resort_id) : null,
        assigned_resort: u.assigned_resort_name || null,
        start_date: fmtDate(u.start_date, 'Y-m-d'),
        last_active: u.last_active_label || 'Today',
        status: u.deleted_at ? 'Archived' : u.status.charAt(0).toUpperCase() + u.status.slice(1),
        raw_status: u.status,
        employment_status:
          u.employment_status || u.status.charAt(0).toUpperCase() + u.status.slice(1),
        notes: u.notes,
        is_archived: Boolean(u.deleted_at),
      }));
      return res.json({
        data,
        meta: { current_page: 1, last_page: 1, per_page: 15, total: data.length },
      });
    }

    const adminStaffIdMatch = path.match(/^\/admin\/staff\/(\d+)$/);
    if (adminStaffIdMatch && method === 'GET') {
      const id = Number(adminStaffIdMatch[1]);
      const { rows } = await db.query(
        'SELECT u.*, r.name AS assigned_resort_name FROM users u LEFT JOIN resorts r ON r.id = u.assigned_resort_id WHERE u.id = $1 LIMIT 1',
        [id]
      );
      if (!rows[0]) return res.status(404).json({ message: 'Staff not found.' });
      const u = rows[0];
      return res.json({
        data: {
          id: Number(u.id),
          name: u.name,
          email: u.email,
          phone: u.phone,
          username: u.username,
          staff_id: u.staff_id || 'CST-001',
          role: u.role,
          role_display: u.role_title || u.role,
          assigned_resort_id: u.assigned_resort_id ? Number(u.assigned_resort_id) : null,
          assigned_resort: u.assigned_resort_name || null,
          start_date: fmtDate(u.start_date, 'Y-m-d'),
          last_active: u.last_active_label || 'Today',
          status: u.deleted_at ? 'Archived' : u.status.charAt(0).toUpperCase() + u.status.slice(1),
          raw_status: u.status,
          employment_status: u.employment_status || 'Active',
          notes: u.notes,
          is_archived: Boolean(u.deleted_at),
        },
      });
    }

    return res.status(404).json({ message: `Endpoint not found: ${method} ${path}` });
  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({
      message: err.message || 'Internal Server Error',
    });
  }
};
