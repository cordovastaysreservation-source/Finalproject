import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const BrandLogo = ({ onClick }) => (
  <div className="brand-logo-wrap" onClick={onClick}>
    <div className="brand-circle">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22V8" />
        <path d="M5 12c2.5-3 5-4 7-4s4.5 1 7 4" />
        <path d="M7 7c2-2 3.5-3 5-3s3 1 5 3" />
      </svg>
    </div>
    <div>
      <div className="brand-title">Cordova Stays</div>
      <div className="brand-subtitle">RESORT RESERVATION SYSTEM</div>
    </div>
  </div>
);

export const CupStrawIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 8h1a2 2 0 0 1 0 4H6a2 2 0 0 1 0-4h1" />
    <path d="M7 8a5 5 0 0 1 10 0" />
    <path d="M8 12l1 9h6l1-9" />
    <path d="M12 3v5" />
  </svg>
);

export default function CustomerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const token = localStorage.getItem('cs_token');
  if (!token) {
    return <Navigate to="/auth/login" replace />;
  }

  const path = location.pathname;

  const isNavActive = (key) => {
    if (key === 'home') return path === '/';
    if (key === 'explore') {
      return (
        path.startsWith('/explore') ||
        (path.startsWith('/resorts/') && !path.includes('/foods-drinks'))
      );
    }
    if (key === 'bookings') {
      return (
        path.startsWith('/my-bookings') ||
        path.startsWith('/booking')
      );
    }
    if (key === 'profile') return path.startsWith('/profile');
    if (key === 'foods') return path.startsWith('/foods-drinks') || path.includes('/foods-drinks');
    return false;
  };

  const navItems = [
    {
      key: 'home',
      label: 'Home',
      to: '/',
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5z" />
        </svg>
      ),
    },
    {
      key: 'explore',
      label: 'Explore Resorts',
      to: '/explore',
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
      ),
    },
    {
      key: 'bookings',
      label: 'My Bookings',
      to: '/my-bookings',
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="17" rx="2" />
          <path d="M8 2v4M16 2v4M3 10h18" />
        </svg>
      ),
    },
    {
      key: 'profile',
      label: 'My Profile',
      to: '/profile',
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6" />
        </svg>
      ),
    },
    {
      key: 'foods',
      label: 'Foods and Drinks',
      to: '/foods-drinks',
      icon: <CupStrawIcon />,
    },
  ];

  const displayName = user ? user.first_name || user.name : 'Guest';
  const displayInitial = (displayName || 'G').charAt(0).toUpperCase();

  return (
    <div className="portal-wrapper">
      <header className="portal-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setSidebarOpen((o) => !o)}
          >
            ☰
          </button>
          <BrandLogo onClick={() => navigate('/')} />
        </div>

        <div
          className="user-chip"
          onClick={() => navigate(user ? '/profile' : '/auth/login')}
          title={user ? 'Go to My Profile' : 'Click to Log In'}
        >
          <div className="user-avatar-circle">{displayInitial}</div>
          <span className="user-chip-name">{displayName}</span>
        </div>
      </header>

      <div className="portal-body">
        <aside className={`portal-sidebar ${sidebarOpen ? 'open' : ''}`}>
          {navItems.map((item) => (
            <div
              key={item.key}
              onClick={() => {
                setSidebarOpen(false);
                navigate(item.to);
              }}
              className={`portal-nav-item ${isNavActive(item.key) ? 'active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </div>
          ))}
        </aside>

        <main className="portal-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
