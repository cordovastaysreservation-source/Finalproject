import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useToast } from '../context/ToastContext';

export default function GitPushPage() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  const handlePush = async (e) => {
    e.preventDefault();
    if (!token.trim()) {
      setError('Please paste your GitHub Personal Access Token.');
      showToast('Please paste your GitHub Token.', 'error');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await api.post('/git-push', { token: token.trim() });
      setResult(res.data);
      showToast('Successfully pushed to GitHub!', 'success');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to push to GitHub.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F4F8F7',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 580,
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          boxShadow: '0 12px 36px rgba(15, 63, 64, 0.08)',
          border: '1px solid #DCE7E5',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0F3F40 0%, #0A7F82 100%)',
            color: '#FFFFFF',
            padding: '28px 32px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 28 }}>🚀</span>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>GitHub Connect & Push</h1>
          </div>
          <p style={{ margin: 0, fontSize: 13.5, opacity: 0.9 }}>
            Push your latest Cordova Stays code updates directly to GitHub with 1-click.
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: '32px' }}>
          {/* Target Repo Info */}
          <div
            style={{
              backgroundColor: '#F8FAFA',
              border: '1px solid #E2E8F0',
              borderRadius: 12,
              padding: '16px 20px',
              marginBottom: 24,
            }}
          >
            <div style={{ fontSize: 12, color: '#6B8585', fontWeight: 600, textTransform: 'uppercase' }}>
              Target Repository
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0F3F40', marginTop: 4 }}>
              cordovastaysreservation-source / Finalproject
            </div>
            <a
              href="https://github.com/cordovastaysreservation-source/Finalproject"
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: 12.5, color: '#0A7F82', textDecoration: 'none', display: 'inline-block', marginTop: 4 }}
            >
              https://github.com/cordovastaysreservation-source/Finalproject ↗
            </a>
          </div>

          {/* Step 1 Box */}
          <div
            style={{
              backgroundColor: '#EFFBF7',
              border: '1px dashed #0A7F82',
              borderRadius: 12,
              padding: '16px 20px',
              marginBottom: 24,
            }}
          >
            <div style={{ fontWeight: 700, color: '#0F3F40', fontSize: 14, marginBottom: 6 }}>
              Lakang 1: Kuhaa ang GitHub Token
            </div>
            <p style={{ fontSize: 13, color: '#4B6363', margin: '0 0 12px' }}>
              Pindota kining button sa ubos aron ablihan ang GitHub token generator. Pag-scroll lang sa ubos sa page ug i-click ang <strong>"Generate token"</strong>, unya i-copy ang token:
            </p>
            <a
              href="https://github.com/settings/tokens/new?scopes=repo&description=CordovaStaysPush"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-block',
                backgroundColor: '#0A7F82',
                color: '#FFFFFF',
                padding: '10px 18px',
                borderRadius: 8,
                fontSize: 13.5,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              🔑 Ablihi ang GitHub Token Page (Click diri) ↗
            </a>
          </div>

          {/* Step 2 Form */}
          <form onSubmit={handlePush}>
            <div style={{ fontWeight: 700, color: '#0F3F40', fontSize: 14, marginBottom: 8 }}>
              Lakang 2: I-paste ang Token diri:
            </div>
            <input
              type="password"
              placeholder="I-paste diri ang imong GitHub Token (ghp_...)"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '14px 16px',
                borderRadius: 10,
                border: '1.5px solid #CBD5E1',
                fontSize: 14,
                marginBottom: 16,
                outline: 'none',
              }}
              required
            />

            {error && (
              <div
                style={{
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  color: '#991B1B',
                  borderRadius: 10,
                  padding: '12px 16px',
                  fontSize: 13,
                  marginBottom: 16,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {error}
              </div>
            )}

            {result && (
              <div
                style={{
                  backgroundColor: '#ECFDF5',
                  border: '1px solid #6EE7B7',
                  color: '#065F46',
                  borderRadius: 10,
                  padding: '14px 16px',
                  fontSize: 13.5,
                  marginBottom: 16,
                }}
              >
                <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>
                  ✅ Na-push na sa GitHub!
                </div>
                <div>Na-update na ang tanang pinaka-latest nga code sa repository.</div>
                <div style={{ marginTop: 10 }}>
                  <a
                    href="https://github.com/cordovastaysreservation-source/Finalproject"
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-block',
                      backgroundColor: '#059669',
                      color: '#FFFFFF',
                      padding: '8px 14px',
                      borderRadius: 6,
                      fontSize: 12.5,
                      fontWeight: 700,
                      textDecoration: 'none',
                    }}
                  >
                    Tan-awa sa GitHub ↗
                  </a>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                backgroundColor: loading ? '#8DA3A3' : '#0F3F40',
                color: '#FFFFFF',
                padding: '14px',
                borderRadius: 10,
                border: 'none',
                fontSize: 15,
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
              }}
            >
              {loading ? 'Nag-push pa sa GitHub...' : '🚀 I-push Na sa GitHub!'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Link
              to="/"
              style={{ fontSize: 13, color: '#0A7F82', textDecoration: 'none', fontWeight: 600 }}
            >
              ← Balik sa Cordova Stays Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
