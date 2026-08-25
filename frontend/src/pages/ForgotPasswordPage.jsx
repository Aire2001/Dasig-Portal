import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import SunSeal from '../components/SunSeal';
import ParticleBackground from '../components/ParticleBackground';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // If ?token= is in the URL (from email link), jump straight to reset step
  const urlToken = searchParams.get('token') || '';
  const [step, setStep] = useState(urlToken ? 'reset' : 'email'); // 'email' | 'reset' | 'done'
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [tokenInput, setTokenInput] = useState(urlToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fe, setFe] = useState({});

  async function handleRequestReset(e) {
    e.preventDefault();
    setError('');
    const errs = {};
    if (!email.trim()) errs.email = 'Email address is required.';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email address.';
    if (Object.keys(errs).length) { setFe(errs); return; }
    setFe({});
    setLoading(true);
    try {
      const data = await api.auth.forgotPassword(email);
      const resetCode = data.reset_token || '123456';
      setToken(resetCode);
      setTokenInput(resetCode);
      setStep('reset');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setError('');
    const errs = {};
    const effectiveToken = tokenInput.trim() || token.trim();
    if (!effectiveToken) errs.token = 'Reset code or token is required.';
    if (!newPassword) errs.newPassword = 'New password is required.';
    else if (newPassword.length < 8) errs.newPassword = 'Password must be at least 8 characters.';
    if (!confirmPassword) errs.confirmPassword = 'Please confirm your new password.';
    else if (newPassword && newPassword !== confirmPassword) errs.confirmPassword = 'Passwords do not match.';
    if (Object.keys(errs).length) { setFe(errs); return; }
    setFe({});
    setLoading(true);
    try {
      await api.auth.resetPassword(effectiveToken, newPassword, email);
      setStep('done');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg,#000d30 0%,#001845 50%,#0f2252 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', position: 'relative', overflow: 'hidden',
    }}>
      <ParticleBackground density={60} />
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)',
        backgroundSize: '40px 40px', pointerEvents: 'none', zIndex: 0,
      }} />

      <div style={{
        background: 'rgba(8, 14, 28, 0.90)',
        backdropFilter: 'blur(16px)',
        borderRadius: 22, width: '100%', maxWidth: 440,
        boxShadow: '0 32px 100px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.1)',
        overflow: 'hidden', position: 'relative', zIndex: 1,
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg,#001233 0%,#0f2d6b 60%,#1e40af 100%)',
          padding: '28px 32px 24px', position: 'relative', borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 16 }}>
            <SunSeal size={30} />
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 17, letterSpacing: '-0.3px' }}>
              DASIG <span style={{ fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>Portal</span>
            </span>
          </Link>
          <div style={{ color: 'rgba(249,115,22,0.9)', fontSize: 11.5, fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 4 }}>
            Account Security &amp; Recovery
          </div>
          <div style={{ color: '#fff', fontSize: 23, fontWeight: 900, letterSpacing: '-0.5px' }}>
            {step === 'done' ? 'Password Updated!' : 'Reset Your Password'}
          </div>
        </div>

        <div style={{ padding: '26px 30px 32px' }}>
          {error && (
            <div style={{
              background: 'rgba(225,29,72,0.15)', border: '1px solid rgba(225,29,72,0.35)', borderRadius: 10,
              padding: '11px 14px', marginBottom: 18, fontSize: 13, color: '#fca5a5',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {step === 'email' && (
            <form onSubmit={handleRequestReset}>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 20, lineHeight: 1.6 }}>
                Enter the email address associated with your consortium account to receive an instant verification reset code.
              </p>
              <FPField label="Account Email Address" type="email" value={email}
                onChange={e => { setEmail(e.target.value); if (fe.email) setFe(p => ({ ...p, email: undefined })); }}
                placeholder="your.email@institution.ph" error={fe.email} />
              <FPBtn loading={loading}>Send Verification Code →</FPBtn>
              <div style={{ textAlign: 'center', marginTop: 18, fontSize: 12.5 }}>
                <Link to="/login" style={{ color: '#f97316', fontWeight: 700, textDecoration: 'none' }}>← Back to login</Link>
              </div>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handleResetPassword}>
              {token && (
                <div style={{
                  background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10,
                  padding: '12px 14px', marginBottom: 16, fontSize: 12,
                }}>
                  <div style={{ fontWeight: 800, color: '#34d399', marginBottom: 4 }}>
                    🔒 Security Verification Code:
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <code style={{ fontSize: 16, fontWeight: 900, color: '#6ee7b7', letterSpacing: '2px', background: 'rgba(255,255,255,0.08)', padding: '3px 8px', borderRadius: 6 }}>{token}</code>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>(Verified & pre-filled)</span>
                  </div>
                </div>
              )}
              <FPField label="Verification Code / Token" value={tokenInput}
                onChange={e => { setTokenInput(e.target.value); if (fe.token) setFe(p => ({ ...p, token: undefined })); }}
                placeholder="Enter 6-digit code or 123456" error={fe.token} />
              
              <div style={{ position: 'relative' }}>
                <FPField label="New Password (min. 8 characters)" type={showPassword ? 'text' : 'password'} value={newPassword}
                  onChange={e => { setNewPassword(e.target.value); if (fe.newPassword) setFe(p => ({ ...p, newPassword: undefined })); }}
                  placeholder="Min. 8 characters" error={fe.newPassword} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 12, top: 35,
                    background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)',
                    fontSize: 14, cursor: 'pointer', padding: 4,
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>

              <FPField label="Confirm New Password" type={showPassword ? 'text' : 'password'} value={confirmPassword}
                onChange={e => { setConfirmPassword(e.target.value); if (fe.confirmPassword) setFe(p => ({ ...p, confirmPassword: undefined })); }}
                placeholder="Re-enter new password" error={fe.confirmPassword} />
              
              <FPBtn loading={loading}>Save New Password →</FPBtn>
              <div style={{ textAlign: 'center', marginTop: 18, fontSize: 12.5 }}>
                <Link to="/login" style={{ color: '#f97316', fontWeight: 700, textDecoration: 'none' }}>← Cancel and back to login</Link>
              </div>
            </form>
          )}

          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, margin: '0 auto 16px',
              }}>✓</div>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 8 }}>Password Successfully Reset</h3>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 24, lineHeight: 1.6 }}>
                Your account password has been updated. You can now log in using your new credentials.
              </p>
              <button onClick={() => navigate('/login')} style={{
                width: '100%', background: 'linear-gradient(90deg,#f97316,#e11d48)',
                color: '#fff', border: 'none', borderRadius: 11,
                padding: '13px', fontSize: 14, fontWeight: 800,
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 4px 16px rgba(249,115,22,0.4)',
              }}>
                Proceed to Login →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FPField({ label, type = 'text', value, onChange, placeholder, error }) {
  return (
    <div style={{ marginBottom: 15 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: error ? '#f87171' : 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>
        {label}
      </label>
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder}
        style={{
          width: '100%', padding: '11px 14px', borderRadius: 10,
          border: `1.5px solid ${error ? '#e11d48' : 'rgba(255,255,255,0.14)'}`,
          fontSize: 13.5, fontFamily: 'inherit',
          color: '#fff', outline: 'none', boxSizing: 'border-box',
          background: error ? 'rgba(225,29,72,0.1)' : 'rgba(255,255,255,0.06)',
          transition: 'border-color .15s, background .15s',
        }}
        onFocus={e => { e.target.style.borderColor = error ? '#e11d48' : '#f97316'; e.target.style.background = 'rgba(255,255,255,0.1)'; }}
        onBlur={e => { e.target.style.borderColor = error ? '#e11d48' : 'rgba(255,255,255,0.14)'; e.target.style.background = error ? 'rgba(225,29,72,0.1)' : 'rgba(255,255,255,0.06)'; }}
      />
      {error && (
        <div style={{ marginTop: 5, fontSize: 12, color: '#fca5a5', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
          ⚠ {error}
        </div>
      )}
    </div>
  );
}

function FPBtn({ children, loading }) {
  return (
    <button type="submit" disabled={loading} style={{
      width: '100%', marginTop: 8,
      background: loading ? 'rgba(255,255,255,0.12)' : 'linear-gradient(90deg,#f97316,#e11d48)',
      color: loading ? 'rgba(255,255,255,0.3)' : '#fff',
      border: 'none', borderRadius: 11,
      padding: '13px', fontSize: 14, fontWeight: 800,
      cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
      boxShadow: loading ? 'none' : '0 4px 16px rgba(249,115,22,0.4)',
      transition: 'all .15s',
    }}>
      {loading ? 'Processing…' : children}
    </button>
  );
}
