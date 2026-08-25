import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import ParticleBackground from '../components/ParticleBackground';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const categories = ['All', 'Membership', 'Governance', 'Events', 'Research'];

const catConfig = {
  Membership: { grad: 'linear-gradient(135deg,#1e3a8a,#3b82f6)', icon: '🏛️' },
  Governance: { grad: 'linear-gradient(135deg,#4c1d95,#8b5cf6)', icon: '⚖️'  },
  Events:     { grad: 'linear-gradient(135deg,#be123c,#f43f5e)', icon: '📅'  },
  Research:   { grad: 'linear-gradient(135deg,#065f46,#10b981)', icon: '🔬'  },
};

const POLICIES_CSS = `
  @keyframes cardIn {
    from { transform: translateY(12px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  .policy-card {
    border-radius: 18px; padding: 22px;
    cursor: pointer; position: relative; overflow: hidden;
    transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(15,23,42,0.75);
    backdrop-filter: blur(12px);
  }
  .policy-card:hover {
    transform: translateY(-3px);
    border-color: rgba(249,115,22,0.45);
    box-shadow: 0 16px 38px rgba(0,0,0,0.55);
  }
  .policy-card::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 55%);
    pointer-events: none;
  }
  .filter-btn {
    border-radius: 9px; padding: 7px 16px; font-size: 12.5px; font-weight: 700;
    cursor: pointer; font-family: inherit; transition: all 0.15s ease;
    border: 1px solid rgba(255,255,255,0.12);
  }
`;

export default function PoliciesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [active, setActive]     = useState('All');
  const [search, setSearch]     = useState('');
  const [selected, setSelected] = useState(null);

  const isMember = user && (user.role === 'MEMBER' || user.role === 'ADMIN');

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    api.policies.list({ category: active, search })
      .then(r => setPolicies(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, active, search]);

  if (!user) {
    return (
      <div style={{ background: 'linear-gradient(180deg,#000d30 0%,#020817 300px,#0f172a 100%)', minHeight: '100vh', position: 'relative' }}>
        <ParticleBackground density={40} />
        <div style={{ position: 'relative', zIndex: 1 }}>
        <PageHeader eyebrow="Governance" title="Policies & Guidelines" />
        <div style={{ minHeight: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <div style={{ fontSize: 48 }}>📋</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>Sign in to access policies</div>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Policy documents are available to registered users.</p>
          <button onClick={() => navigate('/login')} style={{ background: 'linear-gradient(90deg,#f97316,#e11d48)', color: '#fff', border: 'none', borderRadius: 12, padding: '13px 32px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 20px rgba(249,115,22,0.4)' }}>
            Log in →
          </button>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'linear-gradient(180deg,#000d30 0%,#020817 300px,#0f172a 100%)', minHeight: '100vh', position: 'relative' }}>
      <ParticleBackground density={40} />
      <div style={{ position: 'relative', zIndex: 1 }}>
      <style>{POLICIES_CSS}</style>
      <PageHeader eyebrow="Governance" title="Policies & Guidelines" />

      {/* Detail modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, backdropFilter: 'blur(4px)' }}
          onClick={() => setSelected(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'linear-gradient(180deg,#0f172a,#020817)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 22, maxWidth: 640, width: '100%', maxHeight: '80vh', overflow: 'auto',
            boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
          }}>
            <div style={{ background: catConfig[selected.category]?.grad || 'linear-gradient(135deg,#1e3a8a,#3b82f6)', padding: '26px 30px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', bottom: -20, right: -10, fontSize: 80, opacity: 0.1 }}>{catConfig[selected.category]?.icon || '📋'}</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{selected.category} · Effective {selected.effective_date}</div>
              <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 900, margin: 0, lineHeight: 1.25 }}>{selected.title}</h2>
            </div>
            <div style={{ padding: '26px 30px' }}>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14.5, lineHeight: 1.85, marginBottom: 24 }}>{selected.content}</p>
              <button onClick={() => setSelected(null)} style={{ background: 'linear-gradient(90deg,#f97316,#e11d48)', color: '#fff', border: 'none', borderRadius: 12, padding: '11px 28px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(249,115,22,0.35)' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      <section style={{ padding: '32px 24px 80px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>

          {!isMember && (
            <div style={{
              background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: 14, padding: '14px 20px', marginBottom: 24,
              fontSize: 13.5, color: '#fbbf24', display: 'flex', gap: 10, alignItems: 'center',
            }}>
              🔒 <span>Some policies are available to <strong>DASIG members only</strong>.{' '}
                <span onClick={() => navigate('/membership')} style={{ color: '#f97316', cursor: 'pointer', fontWeight: 800, textDecoration: 'underline' }}>Apply for membership →</span>
              </span>
            </div>
          )}

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 28 }}>
            {[
              { label: 'Public Policies',   value: policies.filter(p => !p.members_only).length, color: '#34d399', icon: '📜' },
              { label: 'Members-Only Acts', value: policies.filter(p => p.members_only).length,  color: '#60a5fa', icon: '🔒' },
              { label: 'Total Charters',    value: policies.length,                              color: '#f97316', icon: '🏛️' },
            ].map(s => (
              <div key={s.label} style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 16, padding: '18px 20px',
                display: 'flex', alignItems: 'center', gap: 14,
                backdropFilter: 'blur(8px)',
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: s.color, letterSpacing: '-0.5px' }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.4px', marginTop: 2 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Search + Filter */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search policies…"
              style={{
                flex: '1 1 220px', maxWidth: 340,
                background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.12)',
                borderRadius: 10, padding: '9px 14px', fontSize: 13, color: '#fff',
                outline: 'none', fontFamily: 'inherit',
              }}
              onFocus={e => e.target.style.borderColor = '#f97316'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
            {categories.map(c => (
              <button key={c} className="filter-btn" onClick={() => setActive(c)} style={{
                background: active === c ? 'linear-gradient(90deg,#f97316,#e11d48)' : 'rgba(255,255,255,0.06)',
                color: active === c ? '#fff' : 'rgba(255,255,255,0.6)',
                borderColor: active === c ? 'transparent' : 'rgba(255,255,255,0.12)',
                boxShadow: active === c ? '0 4px 14px rgba(249,115,22,0.35)' : 'none',
              }}>{c}</button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.35)' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>Loading policies…
            </div>
          ) : policies.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)' }}>No policies found.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
              {policies.map((p, i) => {
                const cfg = catConfig[p.category] || catConfig.Governance;
                const locked = p.members_only && !isMember;
                return <PolicyCard key={p.id} policy={p} cfg={cfg} locked={locked} index={i} onClick={() => !locked && setSelected(p)} />;
              })}
            </div>
          )}
        </div>
      </section>
      </div>
    </div>
  );
}

function PolicyCard({ policy: p, cfg, locked, index, onClick }) {
  return (
    <div className="policy-card"
      style={{
        background: locked ? 'rgba(255,255,255,0.04)' : cfg.grad,
        opacity: locked ? 0.6 : 1,
        cursor: locked ? 'default' : 'pointer',
        animation: `cardIn 0.4s ease ${index * 0.06}s both`,
      }}
      onClick={onClick}
    >
      <div style={{ position: 'absolute', bottom: -16, right: -8, fontSize: 72, opacity: 0.08, lineHeight: 1 }}>{cfg.icon}</div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <span style={{
          background: 'rgba(255,255,255,0.2)', color: '#fff',
          borderRadius: 8, padding: '4px 12px', fontSize: 12, fontWeight: 800,
        }}>{p.category}</span>
        <span style={{ fontSize: 20 }}>{locked ? '🔒' : cfg.icon}</span>
      </div>

      <h3 style={{ fontWeight: 900, fontSize: 15.5, color: '#fff', lineHeight: 1.35, marginBottom: 8 }}>{p.title}</h3>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 10, fontWeight: 600 }}>Effective: {p.effective_date}</div>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: 0 }}>
        {locked ? 'This policy is available to DASIG members only.' : p.content.slice(0, 120) + (p.content.length > 120 ? '…' : '')}
      </p>
      {!locked && <div style={{ marginTop: 14, fontSize: 12.5, color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>Read full policy →</div>}
    </div>
  );
}
