import { useState, useEffect } from 'react';
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

const CONSORTIUM_MEMBERS = [
  { name: 'Cebu Institute of Technology - University', short: 'CIT-U', icon: '🏛️' },
  { name: 'University of the Philippines Visayas', short: 'UP Visayas', icon: '🎓' },
  { name: 'University of San Agustin', short: 'USA Iloilo', icon: '🏛️' },
  { name: 'DOST Region VII', short: 'DOST-7', icon: '🔬' },
  { name: 'DICT Region VII', short: 'DICT-7', icon: '💻' },
  { name: 'DTI Region VII', short: 'DTI-7', icon: '📈' },
  { name: 'DepEd Region VII', short: 'DepEd-7', icon: '📚' },
];

function detectDomainBadge(email) {
  if (!email || !email.includes('@')) return null;
  const domain = email.split('@')[1]?.toLowerCase() || '';
  if (domain.includes('cit.edu')) return { text: 'CIT-University Domain', icon: '🏛️', color: '#fbbf24' };
  if (domain.includes('up.edu.ph') || domain.includes('upv.edu.ph')) return { text: 'UP Visayas Domain', icon: '🎓', color: '#34d399' };
  if (domain.includes('usa.edu.ph') || domain.includes('sanagustin')) return { text: 'Univ. of San Agustin Domain', icon: '🏛️', color: '#60a5fa' };
  if (domain.includes('dost.gov.ph')) return { text: 'DOST Region VII Domain', icon: '🔬', color: '#38bdf8' };
  if (domain.includes('dict.gov.ph')) return { text: 'DICT Region VII Domain', icon: '💻', color: '#818cf8' };
  if (domain.includes('dti.gov.ph')) return { text: 'DTI Region VII Domain', icon: '📈', color: '#f472b6' };
  if (domain.includes('deped.gov.ph')) return { text: 'DepEd Region VII Domain', icon: '📚', color: '#facc15' };
  if (domain.includes('.gov.ph')) return { text: 'Government Agency Domain', icon: '🏛️', color: '#34d399' };
  if (domain.includes('.edu.ph') || domain.includes('.edu')) return { text: 'Academic Institution Domain', icon: '🎓', color: '#60a5fa' };
  return null;
}

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
      {/* Live particle background */}
      <ParticleBackground density={50} />

      {/* Grid overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)',
        backgroundSize: '40px 40px', pointerEvents: 'none', zIndex: 0,
      }} />

      {/* ── Dual-Panel Enterprise Gateway Container ── */}
      <div style={{
        width: '100%', maxWidth: 1040,
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: 32, alignItems: 'center',
        position: 'relative', zIndex: 1,
      }}>

        {/* ── LEFT PANEL: Consortium Showcase & Trust Badges ── */}
        <div style={{ padding: '16px 12px' }}>
          <Link to="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 700,
            textDecoration: 'none', marginBottom: 28,
            background: 'rgba(255,255,255,0.06)', padding: '6px 14px', borderRadius: 20,
            border: '1px solid rgba(255,255,255,0.1)', transition: 'all .15s',
          }}>
            ← Back to DASIG Portal
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div style={{ filter: 'drop-shadow(0 0 16px rgba(249,115,22,0.5))' }}>
              <SunSeal size={46} />
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 900, fontSize: 24, letterSpacing: '-0.5px', lineHeight: 1.1 }}>
                DASIG <span style={{ color: '#f97316' }}>Portal</span>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', marginTop: 2 }}>
                Executive Authentication Gateway
              </div>
            </div>
          </div>

          <p style={{
            color: 'rgba(255,255,255,0.75)', fontSize: 14.5, lineHeight: 1.7,
            marginBottom: 24, maxWidth: 440,
          }}>
            The centralized collaborative network for higher education institutions, state universities, and national government agencies across Central Visayas (Region VII).
          </p>

          {/* Member Institutions Grid */}
          <div style={{ marginBottom: 26 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(249,115,22,0.85)', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 10 }}>
              Consortium Member Institutions
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {CONSORTIUM_MEMBERS.map(m => (
                <div key={m.short} style={{
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
                  borderRadius: 8, padding: '5px 10px', fontSize: 12, color: 'rgba(255,255,255,0.8)',
                  display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600,
                }}>
                  <span>{m.icon}</span>
                  <span>{m.short}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Security & Compliance Badges */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
            paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>🔒</span>
              <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>256-Bit SSL Encrypted</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>🛡️</span>
              <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>Data Privacy Act (RA 10173)</span>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL: Glassmorphic Sign-in Card ── */}
        <div style={{
          background: 'rgba(8, 14, 28, 0.92)',
          backdropFilter: 'blur(20px)',
          borderRadius: 24, width: '100%',
          boxShadow: '0 32px 100px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.1)',
          overflow: 'hidden', position: 'relative',
        }}>
          {/* Card Top Header */}
          <div style={{
            background: 'linear-gradient(135deg,#001233 0%,#0f2d6b 60%,#1e40af 100%)',
            padding: '24px 30px 20px', position: 'relative', borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ color: 'rgba(249,115,22,0.9)', fontSize: 11, fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 3 }}>
              Region VII Consortium Access
            </div>
            <div style={{ color: '#fff', fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px' }}>
              {tab === 'login' ? 'Executive Sign In' : 'Create an Account'}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.25)' }}>
            {['login', 'register'].map(t => (
              <button key={t} onClick={() => { setTab(t); setError(''); }}
                style={{
                  flex: 1, padding: '13px', fontSize: 13.5, fontWeight: 800,
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  fontFamily: 'inherit', textTransform: 'capitalize',
                  color: tab === t ? '#f97316' : 'rgba(255,255,255,0.45)',
                  borderBottom: tab === t ? '2px solid #f97316' : '2px solid transparent',
                  transition: 'all 0.15s',
                }}
              >{t === 'login' ? 'Log in' : 'Register'}</button>
            ))}
          </div>

          {/* Form Content */}
          <div style={{ padding: '26px 30px 30px' }}>
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

            <div style={{ marginTop: 20, textAlign: 'center', fontSize: 12.5, color: 'rgba(255,255,255,0.45)' }}>
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
    </div>
  );
}

function LoginForm({ setError }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(() => localStorage.getItem('dasig_remember_email') || '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('dasig_remember_email'));
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fe, setFe] = useState({});

  const domainBadge = detectDomainBadge(email);

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

    if (rememberMe) {
      localStorage.setItem('dasig_remember_email', email.trim());
    } else {
      localStorage.removeItem('dasig_remember_email');
    }

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

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ position: 'relative' }}>
        <Field
          label="Account Email"
          type="email"
          value={email}
          onChange={e => { setEmail(e.target.value); if (fe.email) setFe(p => ({ ...p, email: undefined })); }}
          placeholder="your.email@institution.ph"
          error={fe.email}
        />
        {domainBadge && (
          <div style={{
            marginTop: -8, marginBottom: 12,
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: 11, fontWeight: 700, color: domainBadge.color,
            background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 6,
          }}>
            <span>{domainBadge.icon}</span>
            <span>{domainBadge.text}</span>
          </div>
        )}
      </div>

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

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: -4, marginBottom: 18 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 12.5, color: 'rgba(255,255,255,0.65)' }}>
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={e => setRememberMe(e.target.checked)}
            style={{ accentColor: '#f97316', cursor: 'pointer' }}
          />
          <span>Remember me</span>
        </label>
        <Link to="/forgot-password" style={{ fontSize: 12.5, color: '#f97316', textDecoration: 'none', fontWeight: 700 }}>
          Forgot password?
        </Link>
      </div>

      <SubmitBtn loading={loading}>Sign In to Portal →</SubmitBtn>
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

  const domainBadge = detectDomainBadge(form.email);

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
      
      <div style={{ position: 'relative' }}>
        <Field label="Institutional / Personal Email" type="email" value={form.email} onChange={set('email')} placeholder="name@institution.edu.ph" error={fe.email} />
        {domainBadge && (
          <div style={{
            marginTop: -8, marginBottom: 12,
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: 11, fontWeight: 700, color: domainBadge.color,
            background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 6,
          }}>
            <span>{domainBadge.icon}</span>
            <span>{domainBadge.text}</span>
          </div>
        )}
      </div>
      
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

      <div style={{ marginBottom: 15 }}>
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
    <div style={{ marginBottom: 14 }}>
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
      width: '100%', marginTop: 6,
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
