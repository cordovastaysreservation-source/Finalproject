import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BrandLogo } from './CustomerLayout';

/**
 * Split layout used across all Customer Auth screens:
 * Left: Teal gradient panel with translucent circles + wave card or ocean illustration
 * Right: White form card
 */
export default function AuthSplitLayout({
  leftTitle = 'Welcome back!',
  leftSubtitle = 'Your next Cordova getaway starts here.',
  illustrationVariant = 'discover', // 'discover' | 'ocean'
  children,
}) {
  const navigate = useNavigate();

  return (
    <div className="portal-wrapper" style={{ minHeight: '100vh' }}>
      <header className="portal-topbar">
        <BrandLogo onClick={() => navigate('/')} />
      </header>

      <div className="auth-split-outer">
        <div className="auth-split-grid">
          {/* Left Teal Panel */}
          <div className="auth-left-panel">
            {/* Decorative Translucent Circles */}
            <div
              style={{
                position: 'absolute',
                top: -50,
                left: -50,
                width: 220,
                height: 220,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.08)',
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: -60,
                right: -40,
                width: 240,
                height: 240,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.07)',
                pointerEvents: 'none',
              }}
            />

            <div className="auth-left-header" style={{ position: 'relative', zIndex: 2, marginTop: 18 }}>
              <h1 className="auth-left-title" style={{ fontSize: 30, fontWeight: 700, marginBottom: 10, lineHeight: 1.2 }}>
                {leftTitle}
              </h1>
              <p className="auth-left-subtitle" style={{ fontSize: 15, color: 'rgba(255, 255, 255, 0.88)', maxWidth: 360 }}>
                {leftSubtitle}
              </p>
            </div>

            {illustrationVariant === 'discover' ? (
              <div
                className="auth-left-illustration"
                style={{
                  position: 'relative',
                  zIndex: 2,
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: '1px solid rgba(255, 255, 255, 0.22)',
                  borderRadius: 14,
                  padding: '22px 24px',
                  marginTop: 32,
                }}
              >
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
                  Discover stays in Cordova, Cebu
                </div>
                <p style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.85)', marginBottom: 18 }}>
                  Compare resorts, explore room options, and keep your reservations in one place.
                </p>
                <svg viewBox="0 0 320 36" style={{ width: '100%', height: 32 }}>
                  <path
                    d="M0,22 Q45,4 90,22 T180,22 T270,22 T320,18"
                    fill="none"
                    stroke="#A3E4D7"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            ) : (
              <div
                className="auth-left-illustration"
                style={{
                  position: 'relative',
                  zIndex: 2,
                  background: 'rgba(255, 255, 255, 0.14)',
                  borderRadius: 14,
                  overflow: 'hidden',
                  height: 195,
                  marginTop: 32,
                }}
              >
                <svg viewBox="0 0 400 200" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                  <circle cx="88" cy="56" r="24" fill="#FDEAA8" opacity="0.88" />
                  {/* Flying birds */}
                  <path d="M225,52 Q232,44 239,52 Q246,44 253,52" fill="none" stroke="#FFFFFF" strokeWidth="2.2" />
                  <path d="M268,38 Q273,32 278,38 Q283,32 288,38" fill="none" stroke="#FFFFFF" strokeWidth="2" />
                  {/* Layered ocean waves */}
                  <path d="M0,125 Q95,95 200,125 T400,115 L400,200 L0,200 Z" fill="#4BA89E" opacity="0.65" />
                  <path d="M0,150 Q110,122 220,150 T400,142 L400,200 L0,200 Z" fill="#1F7E7A" opacity="0.85" />
                  <path d="M0,172 Q125,150 250,172 T400,166 L400,200 L0,200 Z" fill="#0E5659" />
                </svg>
              </div>
            )}
          </div>

          {/* Right Form Card */}
          <div className="cs-card auth-right-card">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
