import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import SunSeal from '../components/SunSeal';
import HaribonFace from '../components/HaribonFace';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleRequestReset(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.auth.forgotPassword(email);
      // For demo purposes the token is returned in the response
      setToken(data.reset_token || '');
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
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await api.auth.resetPassword(tokenInput || token, newPassword);
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
      background: 'linear-gradient(135deg,#000d30 0%,#001d5c 50%,#1a3878 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', position: 'relative', overflow: 'hidden',
    }}>
      <ParticleBackground density={70} />
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)',
        backgroundSize: '40px 40px', pointerEvents: 'none', zIndex: 0,
      }} />

      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 420,
        boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
        overflow: 'hidden', position: 'relative', zIndex: 1,
      }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#001d5c,#1a56db 55%,#4f46e5)', padding: '28px 32px 24px' }}>
          <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 16 }}>
            <SunSeal size={28} />
            <HaribonFace size={24} />
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>
              DASIG <span style={{ fontWeight: 400, opacity: 0.6 }}>Portal</span>
            </span>
          </Link>
          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 4 }}>
            Account Recovery
          </div>
          <div style={{ color: '#fff', fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px' }}>
            {step === 'done' ? 'Password reset!' : 'Reset your password'}
          </div>
        </div>

        <div style={{ padding: '28px 32px 32px' }}>
          {error && (
            <div style={{
              background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 9,
              padding: '10px 14px', marginBottom: 18, fontSize: 13, color: '#e11d48',
            }}>{error}</div>
          )}

          {step === 'email' && (
            <form onSubmit={handleRequestReset}>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20, lineHeight: 1.6 }}>
                Enter the email address associated with your account and we'll send you a password reset link.
              </p>
              <FPField label="Email address" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@institution.ph" />
              <FPBtn loading={loading}>Send reset link →</FPBtn>
              <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#94a3b8' }}>
                <Link to="/login" style={{ color: '#1a56db', fontWeight: 600, textDecoration: 'none' }}>← Back to login</Link>
              </div>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handleResetPassword}>
              {token && (
                <div style={{
                  background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 9,
                  padding: '12px 14px', marginBottom: 16, fontSize: 12,
                }}>
                  <div style={{ fontWeight: 700, color: '#166534', marginBottom: 4 }}>
                    Demo mode — Reset token:
                  </div>
                  <code style={{ wordBreak: 'break-all', color: '#15803d', fontSize: 11 }}>{token}</code>
                  <div style={{ color: '#166534', marginTop: 6, fontSize: 11 }}>
                    In production this would be emailed to you. It has been pre-filled below.
                  </div>
                </div>
              )}
              <FPField label="Reset token" value={tokenInput || token} onChange={e => setTokenInput(e.target.value)} placeholder="Paste your reset token" />
              <FPField label="New password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min. 8 characters" />
              <FPField label="Confirm new password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat new password" />
              <FPBtn loading={loading}>Set new password →</FPBtn>
            </form>
          )}

          {step === 'done' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <p style={{ fontSize: 14, color: '#374151', marginBottom: 24, lineHeight: 1.6 }}>
                Your password has been reset successfully. You can now log in with your new password.
              </p>
              <button
                onClick={() => navigate('/login')}
                style={{
                  width: '100%', padding: '12px',
                  background: 'linear-gradient(90deg,#f97316,#e11d48)',
                  color: '#fff', border: 'none', borderRadius: 10,
                  fontSize: 14.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Go to login →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FPField({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#374151', marginBottom: 6 }}>{label}</label>
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder} required
        style={{
          width: '100%', padding: '10px 13px', borderRadius: 9,
          border: '1.5px solid #e2e8f0', fontSize: 13.5, fontFamily: 'inherit',
          color: '#0f172a', outline: 'none', boxSizing: 'border-box',
        }}
        onFocus={e => { e.target.style.borderColor = '#1a56db'; }}
        onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }}
      />
    </div>
  );
}

function FPBtn({ children, loading }) {
  return (
    <button type="submit" disabled={loading} style={{
      width: '100%', marginTop: 8,
      background: loading ? '#94a3b8' : 'linear-gradient(90deg,#f97316,#e11d48)',
      color: '#fff', border: 'none', borderRadius: 10,
      padding: '12px', fontSize: 14.5, fontWeight: 700,
      cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
    }}>
      {loading ? 'Please wait…' : children}
    </button>
  );
}
