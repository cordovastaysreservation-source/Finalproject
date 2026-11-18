import { formatCurrency } from '../styles/tokens';

/**
 * Generates a clean printable / Save-as-PDF Booking E-Voucher window for customers.
 */
export function printBookingVoucher(booking) {
  const win = window.open('', '_blank', 'width=840,height=720');
  if (!win) return;

  const ref = booking.reference || booking.bookingReference || 'CS-2026-00125';
  const resort = booking.resort_name || booking.resortName || 'Eventesia Garden';
  const room = booking.room_name || booking.roomName || 'Deluxe Pool View';
  const dates = booking.dates_label || booking.short_dates || '20–22 Oct 2026';
  const guest = booking.guest_full_name || `${booking.firstName || 'Guest'} ${booking.lastName || ''}`.trim();
  const email = booking.guest_email || booking.email || 'guest@example.com';
  const mobile = booking.guest_mobile || booking.mobile || '0917 555 8899';
  const status = (booking.status || 'pending').toUpperCase();
  const subtotal = formatCurrency(booking.subtotal ?? 7600, 2);
  const fees = formatCurrency(booking.fees ?? 500, 2);
  const total = formatCurrency(booking.total ?? 8100, 2);

  win.document.write(`
    <!doctype html>
    <html>
    <head>
      <title>Cordova Stays - Booking Voucher ${ref}</title>
      <style>
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #0F3F40;
          background: #F4F8F7;
          padding: 32px;
        }
        .voucher {
          max-width: 720px;
          margin: 0 auto;
          background: #FFFFFF;
          border: 2px solid #0B6E75;
          border-radius: 16px;
          overflow: hidden;
        }
        .header {
          background: #0B6E75;
          color: #FFFFFF;
          padding: 24px 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .header h1 {
          margin: 0;
          font-size: 22px;
        }
        .header p {
          margin: 4px 0 0;
          font-size: 11px;
          letter-spacing: 0.08em;
          opacity: 0.85;
        }
        .badge {
          background: #DAF3EE;
          color: #0F3F40;
          padding: 6px 16px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
        }
        .body {
          padding: 28px 32px;
        }
        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 24px;
        }
        .label {
          font-size: 11px;
          color: #6B8585;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .val {
          font-size: 15px;
          font-weight: 700;
          margin-top: 2px;
        }
        .totals {
          border-top: 1px solid #DCE7E5;
          padding-top: 16px;
        }
        .row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 14px;
        }
        .row.total {
          font-size: 18px;
          font-weight: 800;
          color: #0A7F82;
          border-top: 1px solid #DCE7E5;
          padding-top: 10px;
          margin-top: 10px;
        }
        .footer {
          background: #F4F8F7;
          padding: 16px 32px;
          font-size: 12px;
          color: #6B8585;
          text-align: center;
          border-top: 1px solid #DCE7E5;
        }
        @media print {
          body { background: #FFFFFF; padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="voucher">
        <div class="header">
          <div>
            <h1>CORDOVA STAYS</h1>
            <p>OFFICIAL RESERVATION E-VOUCHER • CORDOVA, CEBU</p>
          </div>
          <div class="badge">${status}</div>
        </div>
        <div class="body">
          <div class="grid">
            <div>
              <div class="label">Reservation Reference</div>
              <div class="val">${ref}</div>
            </div>
            <div>
              <div class="label">Resort Property</div>
              <div class="val">${resort}</div>
            </div>
            <div>
              <div class="label">Selected Room / Package</div>
              <div class="val">${room}</div>
            </div>
            <div>
              <div class="label">Stay Dates</div>
              <div class="val">${dates}</div>
            </div>
            <div>
              <div class="label">Primary Guest</div>
              <div class="val">${guest}</div>
            </div>
            <div>
              <div class="label">Contact Info</div>
              <div class="val">${email} • ${mobile}</div>
            </div>
          </div>

          <div class="totals">
            <div class="row">
              <span>Subtotal</span>
              <span>${subtotal}</span>
            </div>
            <div class="row">
              <span>Taxes & Resort Fees</span>
              <span>${fees}</span>
            </div>
            <div class="row total">
              <span>Total Amount</span>
              <span>${total}</span>
            </div>
          </div>
        </div>
        <div class="footer">
          Cordova Stays Resort Reservation System — "Better Stays, Bigger Memories"<br/>
          Please present this voucher upon check-in at ${resort}.
        </div>
      </div>
      <script>
        window.onload = function() { window.print(); };
      </script>
    </body>
    </html>
  `);
  win.document.close();
}

/**
 * Generates a clean printable / Save-as-PDF Admin Table Report.
 */
export function printAdminReport(title, subtitle, headers, rows) {
  const win = window.open('', '_blank', 'width=960,height=760');
  if (!win) return;

  const ths = headers.map((h) => `<th>${h}</th>`).join('');
  const trs = rows
    .map(
      (r) =>
        `<tr>${r.map((cell) => `<td>${cell ?? '-'}</td>`).join('')}</tr>`
    )
    .join('');

  win.document.write(`
    <!doctype html>
    <html>
    <head>
      <title>Cordova Stays - ${title}</title>
      <style>
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #0F3F40;
          padding: 28px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          border-bottom: 2px solid #153B3B;
          padding-bottom: 16px;
          margin-bottom: 22px;
        }
        .brand {
          font-size: 20px;
          font-weight: 800;
          color: #153B3B;
        }
        .sub {
          font-size: 12px;
          color: #6B8585;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12.5px;
        }
        th {
          background: #EFF6F5;
          color: #0F3F40;
          text-align: left;
          padding: 10px;
          border-bottom: 1px solid #CFE0DD;
        }
        td {
          padding: 10px;
          border-bottom: 1px solid #EDF3F2;
        }
        .footer {
          margin-top: 28px;
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #6B8585;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="brand">CORDOVA STAYS — ADMIN REPORT</div>
          <div style="font-size: 16px; font-weight: 700; margin-top: 4px;">${title}</div>
          <div class="sub">${subtitle}</div>
        </div>
        <div class="sub">Generated: ${new Date().toLocaleDateString('en-PH', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })}</div>
      </div>
      <table>
        <thead><tr>${ths}</tr></thead>
        <tbody>${trs}</tbody>
      </table>
      <div class="footer">
        <span>Cordova Stays Reservation System • Cordova, Cebu</span>
        <span>Prepared by: Platform Administrator</span>
      </div>
      <script>
        window.onload = function() { window.print(); };
      </script>
    </body>
    </html>
  `);
  win.document.close();
}
