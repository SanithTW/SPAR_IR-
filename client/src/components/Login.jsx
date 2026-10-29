import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { authApi } from '../services/api';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authApi.login(username, password);
      onLoginSuccess(res.token, res.user);
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#eef2f6',
        padding: '1.5rem',
        fontFamily: "'Plus Jakarta Sans', sans-serif"
      }}
    >
      {/* Centered Floating Card Matching Mockup */}
      <div
        className="animate-fade-in login-card"
        style={{
          width: '100%',
          maxWidth: '860px',
          minHeight: '540px',
          background: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.14), 0 0 0 1px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
          display: 'flex',
          position: 'relative'
        }}
      >
        {/* Left Section: Red Branded Angled Banner */}
        <div
          className="login-banner"
          style={{
            flex: '1.08',
            background: '#d51e27',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'center',
            padding: '3.5rem 2.5rem 0 2.5rem',
            overflow: 'hidden',
            clipPath: 'polygon(0 0, 100% 0, 92% 40%, 85% 100%, 0 100%)'
          }}
        >
          {/* Logo & Headings */}
          <div style={{ position: 'relative', zIndex: 3, width: '100%', maxWidth: '320px', textAlign: 'center' }}>
            <img
              src="/spar-savemor-logo.png"
              alt="SPAR SaveMor"
              style={{
                width: '100%',
                maxWidth: '290px',
                height: 'auto',
                display: 'block',
                margin: '0 auto',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.12))'
              }}
            />

            <h1
              style={{
                color: '#ffffff',
                fontSize: '25px',
                fontWeight: 800,
                fontFamily: "'Outfit', sans-serif",
                letterSpacing: '-0.02em',
                marginTop: '12px',
                lineHeight: 1.1
              }}
            >
              POSM Tracker
            </h1>

            <p
              style={{
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 500,
                letterSpacing: '0.04em',
                marginTop: '16px',
                opacity: 0.95
              }}
            >
              Track &nbsp;·&nbsp; Issue &nbsp;·&nbsp; Confirm &nbsp;·&nbsp; Together
            </p>
          </div>

          {/* Red Duotone Storefront Image at Bottom */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '240px',
              zIndex: 1,
              overflow: 'hidden',
              pointerEvents: 'none'
            }}
          >
            <img
              src="/store-building.png"
              alt="SaveMor Storefront"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: 0.95
              }}
            />
            {/* Smooth Red Gradient Overlay at the Top of Image */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '70px',
                background: 'linear-gradient(to bottom, #d51e27 0%, rgba(213, 30, 39, 0) 100%)'
              }}
            />
          </div>
        </div>

        {/* Right Section: Sign In Form */}
        <div
          className="login-form-container"
          style={{
            flex: '1',
            background: '#ffffff',
            padding: '3.5rem 3rem 2.5rem 2.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >
          <div style={{ maxWidth: '340px', width: '100%', margin: '0 auto' }}>
            <h2
              style={{
                fontSize: '26px',
                fontWeight: 800,
                color: '#0f172a',
                fontFamily: "'Outfit', sans-serif",
                letterSpacing: '-0.02em',
                lineHeight: 1.2
              }}
            >
              Welcome Back
            </h2>
            <p
              style={{
                fontSize: '13px',
                color: '#64748b',
                marginTop: '4px',
                marginBottom: '1.75rem'
              }}
            >
              Sign in to your POSM Tracker account
            </p>

            {error && (
              <div
                style={{
                  marginBottom: '1.25rem',
                  padding: '0.65rem 0.85rem',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  color: '#b91c1c',
                  fontSize: '0.8rem',
                  lineHeight: 1.4
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#1e293b',
                    marginBottom: '6px'
                  }}
                >
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  style={{
                    width: '100%',
                    height: '42px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '0 14px',
                    fontSize: '13.5px',
                    color: '#1e293b',
                    outline: 'none',
                    transition: 'border-color 0.15s, box-shadow 0.15s'
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#1e293b',
                    marginBottom: '6px'
                  }}
                >
                  Password
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    style={{
                      width: '100%',
                      height: '42px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '0 38px 0 14px',
                      fontSize: '13.5px',
                      color: '#1e293b',
                      outline: 'none',
                      transition: 'border-color 0.15s, box-shadow 0.15s'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                    style={{
                      position: 'absolute',
                      right: '12px',
                      background: 'transparent',
                      color: '#64748b',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  height: '42px',
                  background: '#d51e27',
                  color: '#ffffff',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  marginTop: '0.4rem',
                  boxShadow: '0 2px 6px rgba(213, 30, 39, 0.25)',
                  transition: 'background 0.15s, transform 0.1s'
                }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '2px' }}>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Please contact SPAR Marketing System Admin (sanith@spar.lk) to reset your branch password.');
                  }}
                  style={{
                    fontSize: '13px',
                    color: '#475569',
                    textDecoration: 'none',
                    fontWeight: 500
                  }}
                >
                  Forgot password?
                </a>
              </div>
            </form>

          </div>
        </div>
      </div>
    </div>
  );
}
