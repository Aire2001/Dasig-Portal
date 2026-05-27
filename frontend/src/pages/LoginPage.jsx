import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SunSeal from '../components/SunSeal';
import HaribonFace from '../components/HaribonFace';
import ParticleBackground from '../components/ParticleBackground';

export default function LoginPage() {
  const [tab, setTab] = useState('login');
  const [error, setError] = useState('');

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg,#000d30 0%,#001d5c 50%,#1a3878 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Live particle canvas */}
      <ParticleBackground density={70} />

      {/* Grid overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)',
        backgroundSize: '40px 40px', pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Login card */}
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 420,
        boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
        overflow: 'hidden', position: 'relative', zIndex: 1,
      }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#001d5c,#1a56db 55%,#4f46e5)', padding: '28px 32px 24px' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 16 }}>
            <SunSeal size={28} />
            <HaribonFace size={24} />
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>
              DASIG <span style={{ fontWeight: 400, opacity: 0.6 }}>Portal</span>
            </span>
          </Link>
          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 4 }}>
            Region VII Consortium
          </div>
          <div style={{ color: '#fff', fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px' }}>
            {tab === 'login' ? 'Welcome back' : 'Create account'}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
          {['login', 'register'].map(t => (
            <button key={t} onClick={() => { setTab(t); setError(''); }}
              style={{
                flex: 1, padding: '13px', fontSize: 13.5, fontWeight: 700,
                background: 'transparent', border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', textTransform: 'capitalize',
                color: tab === t ? '#001d5c' : '#94a3b8',
                borderBottom: tab === t ? '2px solid #1a56db' : '2px solid transparent',
                transition: 'all 0.15s',
              }}
            >{t === 'login' ? 'Log in' : 'Register'}</button>
          ))}
        </div>

        {/* Form area */}
        <div style={{ padding: '28px 32px 32px' }}>
          {error && (
            <div style={{
              background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 9,
              padding: '10px 14px', marginBottom: 18, fontSize: 13, color: '#e11d48',
            }}>{error}</div>
          )}

          {tab === 'login'
            ? <LoginForm setError={setError} />
            : <RegisterForm setError={setError} />
          }

          <div style={{ marginTop: 20, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
            {tab === 'login' ? (
              <>Don't have an account?{' '}
                <span onClick={() => { setTab('register'); setError(''); }}
                  style={{ color: '#1a56db', fontWeight: 700, cursor: 'pointer' }}>
                  Register free →
                </span>
              </>
            ) : (
              <>Already have an account?{' '}
                <span onClick={() => { setTab('login'); setError(''); }}
                  style={{ color: '#1a56db', fontWeight: 700, cursor: 'pointer' }}>
                  Log in →
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginForm({ setError }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [fe, setFe] = useState({});

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const errs = {};
    if (!email.trim()) errs.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email address.';
    if (!password) errs.password = 'Password is required.';
    if (Object.keys(errs).length) { setFe(errs); return; }
    setFe({});
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Field label="Email" type="email" value={email}
        onChange={e => { setEmail(e.target.value); if (fe.email) setFe(p => ({ ...p, email: undefined })); }}
        placeholder="your@institution.ph" error={fe.email} />
      <Field label="Password" type="password" value={password}
        onChange={e => { setPassword(e.target.value); if (fe.password) setFe(p => ({ ...p, password: undefined })); }}
        placeholder="••••••••" error={fe.password} />
      <div style={{ textAlign: 'right', marginTop: -8, marginBottom: 12 }}>
        <Link to="/forgot-password" style={{ fontSize: 12, color: '#1a56db', textDecoration: 'none', fontWeight: 600 }}>
          Forgot password?
        </Link>
      </div>
      <SubmitBtn loading={loading}>Log in →</SubmitBtn>
    </form>
  );
}

function RegisterForm({ setError }) {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', institution: '', campus: '' });
  const [loading, setLoading] = useState(false);
  const [fe, setFe] = useState({});

  const set = field => e => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    if (fe[field]) setFe(p => ({ ...p, [field]: undefined }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const errs = {};
    if (!form.name.trim()) errs.name = 'Full name is required.';
    if (!form.email.trim()) errs.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email address.';
    if (!form.password) errs.password = 'Password is required.';
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters.';
    if (Object.keys(errs).length) { setFe(errs); return; }
    setFe({});
    setLoading(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Field label="Full Name" value={form.name} onChange={set('name')} placeholder="Juan dela Cruz" error={fe.name} />
      <Field label="Email" type="email" value={form.email} onChange={set('email')} placeholder="your@institution.ph" error={fe.email} />
      <Field label="Password" type="password" value={form.password} onChange={set('password')} placeholder="Min. 8 characters" error={fe.password} />
      <Field label="Institution" value={form.institution} onChange={set('institution')} placeholder="University / Agency" optional />
      <Field label="Campus / City" value={form.campus} onChange={set('campus')} placeholder="e.g. Cebu City" optional />
      <SubmitBtn loading={loading}>Create account →</SubmitBtn>
    </form>
  );
}

function Field({ label, type = 'text', value, onChange, placeholder, error, optional }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: error ? '#e11d48' : '#374151', marginBottom: 6 }}>
        {label}
        {optional && <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400, marginLeft: 5 }}>(optional)</span>}
      </label>
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder}
        style={{
          width: '100%', padding: '10px 13px', borderRadius: 9,
          border: `1.5px solid ${error ? '#e11d48' : '#e2e8f0'}`,
          fontSize: 13.5, fontFamily: 'inherit',
          color: '#0f172a', outline: 'none', boxSizing: 'border-box',
          background: error ? '#fff5f5' : '#fff',
        }}
        onFocus={e => { e.target.style.borderColor = error ? '#e11d48' : '#1a56db'; }}
        onBlur={e => { e.target.style.borderColor = error ? '#e11d48' : '#e2e8f0'; }}
      />
      {error && (
        <div style={{ marginTop: 5, fontSize: 12, color: '#e11d48', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
          ⚠ {error}
        </div>
      )}
    </div>
  );
}

function SubmitBtn({ children, loading }) {
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
