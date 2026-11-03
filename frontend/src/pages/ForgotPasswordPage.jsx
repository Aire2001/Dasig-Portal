import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import SunSeal from '../components/SunSeal';
import ParticleBackground from '../components/ParticleBackground';
import { recordSecurityAlert } from '../lib/notifications';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // If ?token= & ?email= are in URL (direct from email link), auto-fill and jump to reset step
  const urlToken = searchParams.get('token') || '';
  const urlEmail = searchParams.get('email') || '';

  const [step, setStep] = useState(urlToken ? 'reset' : 'email'); // 'email' | 'reset' | 'done'
  const [email, setEmail] = useState(urlEmail);
  const [tokenInput, setTokenInput] = useState(urlToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState('');
  const [error, setError] = useState('');
  const [fe, setFe] = useState({});

  // Countdown timer for resending OTP
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Sync state if URL search parameters change
  useEffect(() => {
    if (urlToken) {
      setTokenInput(urlToken);
      setStep('reset');
    }
    if (urlEmail) {
      setEmail(urlEmail);
    }
  }, [urlToken, urlEmail]);

  async function handleRequestReset(e) {
    if (e) e.preventDefault();
    setError('');
    setResendSuccess('');
    const errs = {};
    if (!email.trim()) errs.email = 'Email address is required.';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email address.';
    if (Object.keys(errs).length) { setFe(errs); return; }
    setFe({});
    setLoading(true);

    try {
      await api.auth.forgotPassword(email.trim());
      setStep('reset');
      setResendCooldown(60); // 60s cooldown like actual modern apps
      setResendSuccess('Verification code dispatched to your email inbox.');
    } catch (err) {
      setError(err.message || 'Failed to dispatch reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setError('');
    const errs = {};
    const cleanToken = tokenInput.trim();
    const cleanEmail = email.trim();

    if (!cleanEmail) errs.email = 'Email address is required.';
    if (!cleanToken) errs.token = '6-digit reset code is required.';
    else if (!/^\d{6}$/.test(cleanToken)) errs.token = 'Reset code must be exactly 6 digits.';

    if (!newPassword) errs.newPassword = 'New password is required.';
    else if (newPassword.length < 8) errs.newPassword = 'Password must be at least 8 characters.';

    if (!confirmPassword) errs.confirmPassword = 'Please confirm your new password.';
    else if (newPassword && newPassword !== confirmPassword) errs.confirmPassword = 'Passwords do not match.';

    if (Object.keys(errs).length) { setFe(errs); return; }
    setFe({});
    setLoading(true);

    try {
      await api.auth.resetPassword(cleanToken, newPassword, cleanEmail);

      // Record real enterprise security alert
      try {
        recordSecurityAlert(cleanEmail, 'Password Reset');
      } catch (alertErr) {
        console.warn('[security] Failed to record security notification:', alertErr);
      }

      setStep('done');
    } catch (err) {
      setError(err.message || 'Invalid or expired code. Please request a new one.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#030712',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '32px 24px',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Dynamic Ambient Aurora Glows */}
      <div style={{
        position: 'absolute', top: '-15%', left: '-10%', width: '55vw', height: '55vw',
        background: 'radial-gradient(circle, rgba(249,115,22,0.14) 0%, rgba(225,29,72,0.06) 45%, transparent 70%)',
        filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0,
      }} />
      <div style={{
        position: 'absolute', bottom: '-20%', right: '-10%', width: '60vw', height: '60vw',
        background: 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, rgba(79,70,229,0.08) 50%, transparent 75%)',
        filter: 'blur(90px)', pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Live subtle particle canvas */}
      <ParticleBackground density={45} />

      {/* Subtle modern mesh overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
        backgroundSize: '32px 32px', pointerEvents: 'none', zIndex: 0, opacity: 0.6,
      }} />

      <div style={{
        background: 'rgba(8, 14, 28, 0.92)',
        backdropFilter: 'blur(20px)',
        borderRadius: 24, width: '100%', maxWidth: 460,
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
            Consortium Account Security &amp; Recovery
          </div>
          <div style={{ color: '#fff', fontSize: 23, fontWeight: 900, letterSpacing: '-0.5px' }}>
            {step === 'done' ? 'Password Updated!' : step === 'reset' ? 'Enter Verification Code' : 'Reset Your Password'}
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

          {resendSuccess && step === 'reset' && (
            <div style={{
              background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.35)', borderRadius: 10,
              padding: '11px 14px', marginBottom: 18, fontSize: 13, color: '#6ee7b7',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span>✓</span>
              <span>{resendSuccess}</span>
            </div>
          )}

          {step === 'email' && (
            <form onSubmit={handleRequestReset}>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 20, lineHeight: 1.6 }}>
                Enter the verified email address associated with your consortium account. We will send a secure 6-digit one-time code to verify your identity.
              </p>
              <FPField label="Account Email Address" type="email" value={email}
                onChange={e => { setEmail(e.target.value); if (fe.email) setFe(p => ({ ...p, email: undefined })); }}
                placeholder="your.email@institution.ph" error={fe.email} />
              <FPBtn loading={loading}>Send 6-Digit Code →</FPBtn>
              <div style={{ textAlign: 'center', marginTop: 18, fontSize: 12.5 }}>
                <Link to="/login" style={{ color: '#f97316', fontWeight: 700, textDecoration: 'none' }}>← Back to login</Link>
              </div>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handleResetPassword}>
              <div style={{
                background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 12,
                padding: '14px 16px', marginBottom: 18, fontSize: 12.5, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6,
              }}>
                <div style={{ fontWeight: 800, color: '#93c5fd', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>📧</span> Check Your Email Inbox
                </div>
                <div>
                  We sent a 6-digit security code to <strong>{email || 'your email'}</strong>. The code is single-use and expires in 60 minutes.
                </div>
              </div>

              <FPField label="Account Email Address" type="email" value={email}
                onChange={e => { setEmail(e.target.value); if (fe.email) setFe(p => ({ ...p, email: undefined })); }}
                placeholder="your.email@institution.ph" error={fe.email} />

              <FPField label="6-Digit Reset Code" value={tokenInput}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setTokenInput(val);
                  if (fe.token) setFe(p => ({ ...p, token: undefined }));
                }}
                placeholder="e.g. 849201" error={fe.token} />

              {/* Password */}
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

              {/* Confirm Password */}
              <div style={{ position: 'relative' }}>
                <FPField label="Confirm New Password" type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); if (fe.confirmPassword) setFe(p => ({ ...p, confirmPassword: undefined })); }}
                  placeholder="Re-enter new password" error={fe.confirmPassword} />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute', right: 12, top: 35,
                    background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)',
                    fontSize: 14, cursor: 'pointer', padding: 4,
                  }}
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? '🙈' : '👁️'}
                </button>
              </div>

              <FPBtn loading={loading}>Save New Password &amp; Log In →</FPBtn>

              {/* Resend Cooldown Option */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, fontSize: 12 }}>
                <button
                  type="button"
                  disabled={resendCooldown > 0 || loading}
                  onClick={() => handleRequestReset()}
                  style={{
                    background: 'none', border: 'none',
                    color: resendCooldown > 0 ? 'rgba(255,255,255,0.35)' : '#fb923c',
                    fontWeight: 700, cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit', padding: 0,
                  }}
                >
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend verification code'}
                </button>

                <Link to="/login" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontWeight: 600 }}>
                  Cancel
                </Link>
              </div>
            </form>
          )}

          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, margin: '0 auto 16px', color: '#34d399',
              }}>✓</div>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 8 }}>Password Successfully Reset</h3>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 24, lineHeight: 1.6 }}>
                Your account password has been updated and a security notification has been logged to your account feed.
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
