import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function AdminLayout({ title = 'Admin Dashboard', subtitle = '' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { adminUser, logoutAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const token = localStorage.getItem('cs_admin_token');

  useEffect(() => {
    if (!token) return;
    api
      .get('/admin/overview')
      .then((res) => {
        setPendingCount(res.data?.status_breakdown?.pending || 0);
      })
      .catch(() => {});
  }, [token, location.pathname]);

  if (!token) {
    return <Navigate to="/auth/login" replace />;
  }

  const role = adminUser?.role || 'admin';
  const path = location.pathname;

  const allNavItems = [
    { key: 'overview', label: 'Overview', to: '/admin/overview', roles: ['admin', 'manager', 'receptionist', 'housekeeping'] },
    { key: 'resorts', label: 'Resorts', to: '/admin/resorts', roles: ['admin', 'manager'] },
    { key: 'rooms', label: 'Rooms', to: '/admin/rooms', roles: ['admin', 'manager', 'housekeeping'] },
    { key: 'reservations', label: 'Reservations', to: '/admin/reservations', roles: ['admin', 'manager', 'receptionist'] },
    { key: 'customers', label: 'Customers', to: '/admin/customers', roles: ['admin', 'manager', 'receptionist'] },
    { key: 'payments', label: 'Payments', to: '/admin/payments', roles: ['admin', 'manager', 'receptionist'] },
    { key: 'reviews', label: 'Reviews', to: '/admin/reviews', roles: ['admin', 'manager'] },
    { key: 'reports', label: 'Reports', to: '/admin/reports', roles: ['admin', 'manager'] },
    { key: 'staff', label: 'Staff', to: '/admin/staff', roles: ['admin'] },
  ];

  const visibleItems = allNavItems.filter((item) => item.roles.includes(role));

  const isActive = (item) => {
    if (item.key === 'overview') return path === '/admin' || path === '/admin/overview';
    return path.startsWith(item.to);
  };

  // Determine dynamic header title & subtitle from route
  const getHeaderMeta = () => {
    if (path.includes('/resorts/new')) {
      return { hTitle: 'Add New Resort', hSub: 'Create a resort listing and add its details to Cordova Stays.' };
    }
    if (path.includes('/resorts/') && path.includes('/edit')) {
      return { hTitle: 'Edit Resort', hSub: 'Update resort listing details and status.' };
    }
    if (path.startsWith('/admin/resorts')) {
      return { hTitle: 'Resort Management', hSub: 'Manage resort listings, locations, and publishing status.' };
    }
    if (path.includes('/rooms/new')) {
      return { hTitle: 'Add New Room', hSub: 'Create a room listing and configure its details, capacity, and pricing.' };
    }
    if (path.includes('/rooms/') && path.includes('/edit')) {
      return { hTitle: 'Edit Room', hSub: 'Update room information and save changes to the room record.' };
    }
    if (path.startsWith('/admin/rooms')) {
      return { hTitle: 'Room Management', hSub: 'Manage room types, capacity, nightly rates, and availability.' };
    }
    if (path.startsWith('/admin/reservations')) {
      return { hTitle: 'Reservations', hSub: 'Review booking requests and manage reservation status.' };
    }
    if (path.includes('/customers/new')) {
      return { hTitle: 'Add New Customer', hSub: 'Create a customer profile and save their contact information.' };
    }
    if (path.startsWith('/admin/customers')) {
      return { hTitle: 'Customer Management', hSub: '' };
    }
    if (path.includes('/payments/export')) {
      return { hTitle: 'Export Payments', hSub: '' };
    }
    if (path.startsWith('/admin/payments')) {
      return { hTitle: 'Payment Management', hSub: 'Track payment records, amounts, and refund status.' };
    }
    if (path.includes('/reviews/export')) {
      return { hTitle: 'Export Reviews', hSub: '' };
    }
    if (path.startsWith('/admin/reviews')) {
      return { hTitle: 'Reviews & Feedback', hSub: 'Moderate guest reviews and track resort feedback.' };
    }
    if (path.startsWith('/admin/reports')) {
      return { hTitle: 'Reports & Analytics', hSub: 'Understand booking trends and platform performance.' };
    }
    if (path.includes('/staff/new')) {
      return { hTitle: 'Add New Staff Member', hSub: 'Create a staff profile and assign their role and access level.' };
    }
    if (path.startsWith('/admin/staff')) {
      return { hTitle: 'Staff & Roles', hSub: 'Manage administrator and staff access permissions.' };
    }
    return { hTitle: 'Admin Dashboard', hSub: '' };
  };

  const { hTitle, hSub } = getHeaderMeta();

  const handleLogout = async () => {
    await logoutAdmin();
    navigate('/auth/login');
  };

  return (
    <div className="admin-wrapper">
      {sidebarOpen && (
        <div
          className="mobile-drawer-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="admin-brand" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="admin-brand-title">CORDOVA STAYS</div>
            <div className="admin-brand-sub">RESERVATION SYSTEM</div>
          </div>
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setSidebarOpen(false)}
            style={{ color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.25)', padding: '4px 8px' }}
          >
            ✕
          </button>
        </div>

        <nav className="admin-nav">
          {visibleItems.map((item) => (
            <div
              key={item.key}
              onClick={() => {
                setSidebarOpen(false);
                navigate(item.to);
              }}
              className={`admin-nav-item ${isActive(item) ? 'active' : ''}`}
            >
              {item.label}
            </div>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div
            style={{
              fontSize: 12,
              fontStyle: 'italic',
              color: 'rgba(255, 255, 255, 0.65)',
              marginBottom: 14,
              lineHeight: 1.35,
            }}
          >
            Better Stays,
            <br />
            Bigger Memories
          </div>
          <button
            type="button"
            onClick={handleLogout}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: 13.5,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Log out
          </button>
        </div>
      </aside>

      <div className="admin-content-area">
        <header className="admin-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen((o) => !o)}
              aria-label="Toggle admin sidebar"
            >
              ☰
            </button>
            <div style={{ minWidth: 0 }}>
              <h1 className="admin-topbar-title" style={{ fontSize: 24, fontWeight: 800, color: '#0F3F40', lineHeight: 1.2 }}>
                {hTitle}
              </h1>
              {hSub && (
                <div className="admin-topbar-sub" style={{ fontSize: 13, color: '#6B8585', marginTop: 2 }}>{hSub}</div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', flexShrink: 0 }}>
            {/* Live Admin Notification Bell */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setNotifOpen((o) => !o)}
                title="Notifications"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: '1px solid #DCE7E5',
                  background: '#FFFFFF',
                  color: '#0F3F40',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                🔔
                {pendingCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: -4,
                      right: -4,
                      background: '#D97706',
                      color: '#FFFFFF',
                      fontSize: 10,
                      fontWeight: 700,
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {pendingCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div
                  className="cs-card"
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 44,
                    width: 260,
                    padding: 14,
                    zIndex: 100,
                    boxShadow: '0 10px 28px rgba(15, 63, 64, 0.14)',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F3F40', marginBottom: 8 }}>
                    System Notifications
                  </div>
                  <div
                    onClick={() => {
                      setNotifOpen(false);
                      navigate('/admin/reservations');
                    }}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 8,
                      background: '#F4F8F7',
                      fontSize: 12.5,
                      cursor: 'pointer',
                      marginBottom: 6,
                    }}
                  >
                    <strong>{pendingCount} Pending Reservation(s)</strong> awaiting confirmation.
                  </div>
                  <div
                    onClick={() => {
                      setNotifOpen(false);
                      navigate('/admin/payments');
                    }}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 8,
                      background: '#F4F8F7',
                      fontSize: 12.5,
                      cursor: 'pointer',
                    }}
                  >
                    Review <strong>QR Payment Proofs</strong> in Payments.
                  </div>
                </div>
              )}
            </div>

            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                backgroundColor: '#DDF3EC',
                color: '#0A7F82',
                fontWeight: 700,
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {(adminUser?.role === 'admin' ? 'A' : adminUser?.name?.charAt(0) || 'A').toUpperCase()}
            </div>
            <div className="admin-user-meta">
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F3F40', lineHeight: 1.2 }}>
                {adminUser?.role === 'admin' ? 'Administrator' : adminUser?.name || 'Administrator'}
              </div>
              <div style={{ fontSize: 11.5, color: '#6B8585' }}>
                {adminUser?.role === 'admin'
                  ? 'Platform manager'
                  : adminUser?.role_title || adminUser?.role || 'Staff'}
              </div>
            </div>
          </div>
        </header>

        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
