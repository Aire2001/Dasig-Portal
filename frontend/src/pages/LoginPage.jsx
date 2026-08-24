import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SunSeal from '../components/SunSeal';
import ParticleBackground from '../components/ParticleBackground';

const INSTITUTIONS = [
  'Cebu Institute of Technology - University',
  'University of the Philippines Visayas',
  'University of San Agustin',
  'Department of Science and Technology (DOST)',
  'Department of Information and Communications Technology (DICT)',
  'Department of Trade and Industry (DTI)',
  'Department of Education (DepEd)',
  'Other Higher Education Institution / Agency',
];

export default function LoginPage() {
  const [tab, setTab] = useState('login');
  const [error, setError] = useState('');

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg,#000d30 0%,#001845 50%,#0f2252 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Live particle canvas */}
      <ParticleBackground density={60} />

      {/* Grid overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)',
        backgroundSize: '40px 40px', pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Login card — Dark Glassmorphic */}
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
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 16 }}>
            <SunSeal size={30} />
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 17, letterSpacing: '-0.3px' }}>
              DASIG <span style={{ fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>Portal</span>
            </span>
          </Link>
          <div style={{ color: 'rgba(249,115,22,0.9)', fontSize: 11.5, fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 4 }}>
            Region VII Academic &amp; Government Consortium
          </div>
          <div style={{ color: '#fff', fontSize: 23, fontWeight: 900, letterSpacing: '-0.5px' }}>
            {tab === 'login' ? 'Executive Sign In' : 'Create an Account'}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)' }}>
          {['login', 'register'].map(t => (
            <button key={t} onClick={() => { setTab(t); setError(''); }}
              style={{
                flex: 1, padding: '14px', fontSize: 13.5, fontWeight: 800,
                background: 'transparent', border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', textTransform: 'capitalize',
                color: tab === t ? '#f97316' : 'rgba(255,255,255,0.45)',
                borderBottom: tab === t ? '2px solid #f97316' : '2px solid transparent',
                transition: 'all 0.15s',
              }}
            >{t === 'login' ? 'Log in' : 'Register'}</button>
          ))}
        </div>

        {/* Form area */}
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

          {tab === 'login'
            ? <LoginForm setError={setError} />
            : <RegisterForm setError={setError} />
          }

          <div style={{ marginTop: 22, textAlign: 'center', fontSize: 12.5, color: 'rgba(255,255,255,0.45)' }}>
            {tab === 'login' ? (
              <>Don't have an account?{' '}
                <span onClick={() => { setTab('register'); setError(''); }}
                  style={{ color: '#f97316', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}>
                  Register free →
                </span>
              </>
            ) : (
              <>Already have an account?{' '}
                <span onClick={() => { setTab('login'); setError(''); }}
                  style={{ color: '#f97316', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}>
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
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      const from = location.state?.from || '/';
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function fillPreset(eMail, pass) {
    setEmail(eMail);
    setPassword(pass);
    setFe({});
  }

  return (
    <form onSubmit={handleSubmit}>
      <Field
        label="Account Email"
        type="email"
        value={email}
        onChange={e => { setEmail(e.target.value); if (fe.email) setFe(p => ({ ...p, email: undefined })); }}
        placeholder="your.email@institution.ph"
        error={fe.email}
      />
      <div style={{ position: 'relative' }}>
        <Field
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={e => { setPassword(e.target.value); if (fe.password) setFe(p => ({ ...p, password: undefined })); }}
          placeholder="••••••••"
          error={fe.password}
        />
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

      <div style={{ textAlign: 'right', marginTop: -6, marginBottom: 16 }}>
        <Link to="/forgot-password" style={{ fontSize: 12.5, color: '#f97316', textDecoration: 'none', fontWeight: 700 }}>
          Forgot password?
        </Link>
      </div>

      <SubmitBtn loading={loading}>Sign In to Portal →</SubmitBtn>

      {/* ── Quick Demo Logins for Validation / Panel Demo ── */}
      <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 8, textAlign: 'center' }}>
          Quick Demo Accounts (1-Click Fill)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <button
            type="button"
            onClick={() => fillPreset('admin@dasig.gov.ph', 'Admin@123456')}
            style={{
              background: 'rgba(225,29,72,0.12)', border: '1px solid rgba(225,29,72,0.3)',
              borderRadius: 8, padding: '7px 10px', fontSize: 11.5, color: '#fca5a5',
              fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center',
            }}
          >
            🛡️ Admin Preset
          </button>
          <button
            type="button"
            onClick={() => fillPreset('member@cit.edu', 'Member@123456')}
            style={{
              background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: 8, padding: '7px 10px', fontSize: 11.5, color: '#6ee7b7',
              fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center',
            }}
          >
            🎓 Member Preset
          </button>
        </div>
      </div>
    </form>
  );
}

function RegisterForm({ setError }) {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', password: '', institution: INSTITUTIONS[0], campus: '' });
  const [showPassword, setShowPassword] = useState(false);
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
      const from = location.state?.from || '/';
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Field label="Full Legal Name" value={form.name} onChange={set('name')} placeholder="e.g. Dr. Juan dela Cruz" error={fe.name} />
      <Field label="Institutional / Personal Email" type="email" value={form.email} onChange={set('email')} placeholder="name@institution.edu.ph" error={fe.email} />
      
      <div style={{ position: 'relative' }}>
        <Field
          label="Password (min. 8 characters)"
          type={showPassword ? 'text' : 'password'}
          value={form.password}
          onChange={set('password')}
          placeholder="••••••••"
          error={fe.password}
        />
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

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>
          Member Institution
        </label>
        <select
          value={form.institution}
          onChange={set('institution')}
          style={{
            width: '100%', padding: '11px 14px', borderRadius: 10,
            border: '1.5px solid rgba(255,255,255,0.14)', fontSize: 13, fontFamily: 'inherit',
            color: '#fff', outline: 'none', boxSizing: 'border-box', background: '#0a1020',
            cursor: 'pointer',
          }}
        >
          {INSTITUTIONS.map(inst => (
            <option key={inst} value={inst} style={{ background: '#0a1020' }}>{inst}</option>
          ))}
        </select>
      </div>

      <Field label="Campus / City Location" value={form.campus} onChange={set('campus')} placeholder="e.g. Cebu City Campus" optional />

      <SubmitBtn loading={loading}>Complete Registration →</SubmitBtn>
    </form>
  );
}

function Field({ label, type = 'text', value, onChange, placeholder, error, optional }) {
  return (
    <div style={{ marginBottom: 15 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: error ? '#f87171' : 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>
        {label}
        {optional && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 400, marginLeft: 5, textTransform: 'none' }}>(optional)</span>}
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

function SubmitBtn({ children, loading }) {
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
      {loading ? 'Authenticating…' : children}
    </button>
  );
}
