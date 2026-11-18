import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import api, { API_BASE_URL } from '../../api/client';
import { Button, StatusBadge } from '../../components/UI';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../styles/tokens';

/**
 * 1. Admin Login Page (Page 2 of Admin.pdf)
 */
export function AdminLoginPage() {
  const navigate = useNavigate();
  const { loginAdmin, loading } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await loginAdmin(email, password);
      showToast('Signed in to Admin Dashboard.');
      navigate('/admin/overview');
    } catch (err) {
      const msg =
        err.response?.data?.errors?.email?.[0] ||
        err.response?.data?.message ||
        'Invalid administrator credentials.';
      setError(msg);
      showToast(msg, 'error');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: '#F4F8F7' }}>
      {/* Left Teal Promo Panel */}
      <div
        style={{
          width: '42%',
          minWidth: 340,
          backgroundColor: '#0E7373',
          color: '#FFFFFF',
          padding: '48px 44px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 260,
            height: 260,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.06)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -70,
            left: -60,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'rgba(0, 0, 0, 0.08)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 2 }}>
          {/* Brand Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 48 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                backgroundColor: '#FFFFFF',
                color: '#0E7373',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 22V8" />
                <path d="M5 12c2.5-3 5-4 7-4s4.5 1 7 4" />
                <path d="M7 7c2-2 3.5-3 5-3s3 1 5 3" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.15 }}>Cordova Stays</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
                Resort Reservation
                <br />
                System
              </div>
            </div>
          </div>

          <h1 style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.35, marginBottom: 24 }}>
            Manage resorts, reservations,
            <br />
            and guests — all in one
            <br />
            place.
          </h1>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 14.5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span>◆</span>
              <span>Secure Access</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span>▥</span>
              <span>Manage Bookings</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span>●</span>
              <span>Handle Customers</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span>⚙</span>
              <span>System Settings</span>
            </div>
          </div>
        </div>

        <div
          style={{
            position: 'relative',
            zIndex: 2,
            fontSize: 20,
            fontStyle: 'italic',
            color: 'rgba(255, 255, 255, 0.9)',
            lineHeight: 1.3,
          }}
        >
          Better Stays,
          <br />
          Bigger Memories
        </div>
      </div>

      {/* Right Login Card Area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
        }}
      >
        <div
          className="cs-card"
          style={{
            width: '100%',
            maxWidth: 440,
            padding: '48px 40px',
            borderRadius: 18,
            boxShadow: '0 10px 30px rgba(15, 63, 64, 0.06)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: '#E0F4EE',
              color: '#0E7373',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px',
            }}
          >
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="4" />
              <path d="M5 20c1.5-4 4-6 7-6s5.5 2 7 6" />
            </svg>
          </div>

          <h2 style={{ fontSize: 28, fontWeight: 800, color: '#0F3F40', marginBottom: 6 }}>
            Admin Login
          </h2>
          <p style={{ fontSize: 13.5, color: '#6B8585', marginBottom: 28 }}>
            Sign in to access your dashboard
          </p>

          <form onSubmit={handleSubmit} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="cs-input-wrap">
              <span style={{ position: 'absolute', left: 14, color: '#94A3B8' }}>✉</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                className="cs-input"
                style={{ paddingLeft: 38, height: 46 }}
                autoComplete="off"
                required
              />
            </div>

            <div className="cs-input-wrap">
              <span style={{ position: 'absolute', left: 14, color: '#94A3B8' }}>♙</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="cs-input"
                style={{ paddingLeft: 38, height: 46 }}
                autoComplete="new-password"
                required
              />
            </div>

            {error && (
              <div style={{ fontSize: 12.5, color: '#A82E2E', textAlign: 'left' }}>{error}</div>
            )}

            <Button
              type="submit"
              fullWidth
              disabled={loading}
              style={{ height: 46, marginTop: 6, backgroundColor: '#006A60' }}
            >
              {loading ? 'Signing in...' : 'Log In'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

/**
 * 2. Admin Dashboard Overview Page (Page 8 of Admin.pdf)
 */
export function AdminOverviewPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/admin/overview')
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return <div className="cs-card">Loading dashboard overview...</div>;
  }

  const { stats, status_breakdown, monthly_chart, recent_reservations } = data;
  const totalStatus = Math.max(
    1,
    status_breakdown.confirmed +
      status_breakdown.pending +
      status_breakdown.cancelled +
      status_breakdown.completed
  );

  const statusRows = [
    { label: 'Confirmed', count: status_breakdown.confirmed, color: '#1E6E62' },
    { label: 'Pending', count: status_breakdown.pending, color: '#E29E38' },
    { label: 'Cancelled', count: status_breakdown.cancelled, color: '#E07A5F' },
    { label: 'Completed', count: status_breakdown.completed, color: '#3B82C4' },
  ];

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F3F40', marginBottom: 4 }}>
        Platform overview
      </h2>
      <p style={{ fontSize: 12.5, color: '#6B8585', marginBottom: 18 }}>
        Sample figures for design preview — connect real data in your system.
      </p>

      {/* 4 Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div className="cs-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                backgroundColor: '#DDF3EC',
                color: '#1E6E62',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
              }}
            >
              ▦
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#0F3F40' }}>
              {stats.total_resorts}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ fontSize: 12.5, color: '#6B8585' }}>
              Total
              <br />
              Resorts
            </div>
            <div style={{ fontSize: 11, color: '#6B8585' }}>
              Registered
              <br />
              properties
            </div>
          </div>
        </div>

        <div className="cs-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                backgroundColor: '#DDF3EC',
                color: '#1E6E62',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
              }}
            >
              ▣
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#0F3F40' }}>
              {stats.reservations}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ fontSize: 12.5, color: '#6B8585' }}>
              Reservati
              <br />
              ons
            </div>
            <div style={{ fontSize: 11, color: '#6B8585' }}>
              All booking
              <br />
              records
            </div>
          </div>
        </div>

        <div className="cs-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                backgroundColor: '#DDF3EC',
                color: '#1E6E62',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
              }}
            >
              ♙
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#0F3F40' }}>
              {stats.registered_guests}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ fontSize: 12.5, color: '#6B8585' }}>
              Registered
              <br />
              Guests
            </div>
            <div style={{ fontSize: 11, color: '#6B8585' }}>
              Guest
              <br />
              accounts
            </div>
          </div>
        </div>

        <div className="cs-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                backgroundColor: '#DDF3EC',
                color: '#1E6E62',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
              }}
            >
              ₱
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#0F3F40' }}>
              {formatCurrency(stats.revenue)}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ fontSize: 12.5, color: '#6B8585' }}>
              Reve
              <br />
              nue
            </div>
            <div style={{ fontSize: 11, color: '#6B8585' }}>
              Illustrative
              <br />
              total
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row: Reservations & revenue Chart + Reservation status Breakdown */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.65fr 1fr',
          gap: 18,
          marginBottom: 20,
        }}
      >
        <div className="cs-card">
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F3F40', marginBottom: 2 }}>
            Reservations & revenue
          </h3>
          <div style={{ fontSize: 12, color: '#6B8585', marginBottom: 16 }}>
            Monthly overview · sample visualization
          </div>

          <div style={{ width: '100%', height: 210 }}>
            <ResponsiveContainer>
              <BarChart data={monthly_chart} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EDF3F2" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11.5, fill: '#6B8585' }}
                />
                <Tooltip
                  formatter={(value) => [value, 'Reservations']}
                  contentStyle={{ borderRadius: 8, border: '1px solid #DCE7E5' }}
                />
                <Bar dataKey="reservations" radius={[6, 6, 0, 0]}>
                  {monthly_chart.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={entry.is_highlight ? '#8FD0C1' : '#1E6E62'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="cs-card">
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F3F40', marginBottom: 2 }}>
            Reservation status
          </h3>
          <div style={{ fontSize: 12, color: '#6B8585', marginBottom: 20 }}>
            Illustrative breakdown
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {statusRows.map((row) => {
              const pct = Math.min(100, Math.max(12, Math.round((row.count / totalStatus) * 100)));
              return (
                <div
                  key={row.label}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '85px 1fr 32px',
                    alignItems: 'center',
                    gap: 12,
                    fontSize: 13,
                  }}
                >
                  <span style={{ color: '#0F3F40', fontWeight: 500 }}>{row.label}</span>
                  <div
                    style={{
                      height: 10,
                      borderRadius: 9999,
                      backgroundColor: '#EDF2F1',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        borderRadius: 9999,
                        backgroundColor: row.color,
                      }}
                    />
                  </div>
                  <span style={{ textAlign: 'right', fontWeight: 600, color: '#0F3F40' }}>
                    {row.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom: Recent Reservations Table */}
      <div className="cs-card">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F3F40' }}>
            Recent reservations
          </h3>
          <Button
            onClick={() => navigate('/admin/reservations')}
            style={{ backgroundColor: '#1E6E62', padding: '8px 18px', fontSize: 13 }}
          >
            View all
          </Button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid #E2ECEA',
                  textAlign: 'left',
                  color: '#6B8585',
                  fontSize: 12,
                }}
              >
                <th style={{ padding: '10px 8px' }}>Booking ID</th>
                <th style={{ padding: '10px 8px' }}>Guest</th>
                <th style={{ padding: '10px 8px' }}>Resort</th>
                <th style={{ padding: '10px 8px' }}>Check-in</th>
                <th style={{ padding: '10px 8px' }}>Status</th>
                <th style={{ padding: '10px 8px' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {recent_reservations.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #F0F5F4' }}>
                  <td style={{ padding: '14px 8px', fontWeight: 600 }}>{r.reference}</td>
                  <td style={{ padding: '14px 8px' }}>{r.guest}</td>
                  <td style={{ padding: '14px 8px' }}>{r.resort}</td>
                  <td style={{ padding: '14px 8px' }}>{r.check_in}</td>
                  <td style={{ padding: '14px 8px' }}>
                    <StatusBadge status={r.status} />
                  </td>
                  <td style={{ padding: '14px 8px', fontWeight: 600 }}>
                    {formatCurrency(r.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/**
 * 3. Admin Reports & Analytics Page (Page 9 of Admin.pdf)
 */
export function AdminReportsPage() {
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/admin/reports')
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  const handleDownloadReport = async (type, title) => {
    try {
      const token = localStorage.getItem('cs_admin_token');
      const res = await fetch(`${API_BASE_URL}/admin/reports/download/${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cordova-stays-${type}-report.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast(`Downloaded ${title}.`);
    } catch {
      showToast('Failed to download report.', 'error');
    }
  };

  if (loading || !data) {
    return <div className="cs-card">Loading reports & analytics...</div>;
  }

  const { stats, bookings_by_month } = data;

  const quickActions = [
    {
      type: 'reservations',
      title: 'Reservations report',
      subtitle: 'Bookings by date and status',
    },
    {
      type: 'revenue',
      title: 'Revenue report',
      subtitle: 'Payment totals and refunds',
    },
    {
      type: 'resort-performance',
      title: 'Resort performance',
      subtitle: 'Compare listing activity',
    },
    {
      type: 'customers',
      title: 'Customer report',
      subtitle: 'Guest registration trends',
    },
  ];

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F3F40', marginBottom: 4 }}>
        Performance overview
      </h2>
      <p style={{ fontSize: 12.5, color: '#6B8585', marginBottom: 18 }}>
        Illustrative report layout. Metrics should come from live records.
      </p>

      {/* 4 Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div className="cs-card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: 12.5, color: '#6B8585', marginBottom: 8 }}>Gross bookings</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#0F3F40' }}>
            {formatCurrency(stats.gross_bookings)}
          </div>
        </div>

        <div className="cs-card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: 12.5, color: '#6B8585', marginBottom: 8 }}>Completed stays</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#0F3F40' }}>
            {stats.completed_stays}
          </div>
        </div>

        <div className="cs-card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: 12.5, color: '#6B8585', marginBottom: 8 }}>Average stay</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#0F3F40' }}>
            {stats.average_stay} nights
          </div>
        </div>

        <div className="cs-card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: 12.5, color: '#6B8585', marginBottom: 8 }}>Occupancy</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#0F3F40' }}>
            {stats.occupancy}%
          </div>
        </div>
      </div>

      {/* Bottom Row: Bookings by month Chart + Quick report actions */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.65fr 1fr',
          gap: 18,
          alignItems: 'stretch',
        }}
      >
        <div className="cs-card">
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F3F40', marginBottom: 2 }}>
            Bookings by month
          </h3>
          <div style={{ fontSize: 12, color: '#6B8585', marginBottom: 16 }}>
            Sample data visualization
          </div>

          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={bookings_by_month} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EDF3F2" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11.5, fill: '#6B8585' }}
                />
                <Tooltip
                  formatter={(value) => [value, 'Bookings']}
                  contentStyle={{ borderRadius: 8, border: '1px solid #DCE7E5' }}
                />
                <Bar dataKey="bookings" radius={[6, 6, 0, 0]}>
                  {bookings_by_month.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={entry.is_highlight ? '#8FD0C1' : '#1E6E62'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="cs-card">
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F3F40', marginBottom: 16 }}>
            Quick report actions
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {quickActions.map((qa) => (
              <div
                key={qa.type}
                onClick={() => handleDownloadReport(qa.type, qa.title)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '10px 8px',
                  borderBottom: '1px solid #F0F5F4',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: '#DDF3EC',
                    color: '#0A7F82',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  ↗
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F3F40' }}>
                    {qa.title}
                  </div>
                  <div style={{ fontSize: 12, color: '#6B8585' }}>{qa.subtitle}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
