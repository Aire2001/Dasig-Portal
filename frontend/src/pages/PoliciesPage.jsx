import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import ParticleBackground from '../components/ParticleBackground';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const categories = ['All', 'Membership', 'Governance', 'Events', 'Research'];

const catConfig = {
  Membership: { color: '#60a5fa', bg: 'rgba(59,130,246,0.14)', border: 'rgba(59,130,246,0.3)', grad: 'linear-gradient(135deg,#1e3a8a,#3b82f6)', icon: '🏛️' },
  Governance: { color: '#c084fc', bg: 'rgba(192,132,252,0.14)', border: 'rgba(192,132,252,0.3)', grad: 'linear-gradient(135deg,#4c1d95,#8b5cf6)', icon: '⚖️'  },
  Events:     { color: '#fb7185', bg: 'rgba(251,113,133,0.14)', border: 'rgba(251,113,133,0.3)', grad: 'linear-gradient(135deg,#be123c,#f43f5e)', icon: '📅'  },
  Research:   { color: '#34d399', bg: 'rgba(52,211,153,0.14)', border: 'rgba(52,211,153,0.3)', grad: 'linear-gradient(135deg,#065f46,#10b981)', icon: '🔬'  },
};

const POLICIES_CSS = `
  @keyframes cardIn {
    from { transform: translateY(12px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  .policy-card {
    border-radius: 18px; padding: 22px;
    cursor: pointer; position: relative; overflow: hidden;
    transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(15,23,42,0.82);
    backdrop-filter: blur(14px);
  }
  .policy-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 16px 40px rgba(0,0,0,0.6);
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
    api.policies.list({ category: active, search })
      .then(r => setPolicies(Array.isArray(r) ? r : (r?.data || [])))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [active, search]);

  return (
    <div style={{ background: 'linear-gradient(180deg,#000d30 0%,#020817 300px,#0f172a 100%)', minHeight: '100vh', position: 'relative' }}>
      <ParticleBackground density={40} />
      <div style={{ position: 'relative', zIndex: 1 }}>
      <style>{POLICIES_CSS}</style>
      <PageHeader eyebrow="Governance" title="Policies & Guidelines" />

      {/* Detail modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, backdropFilter: 'blur(6px)' }}
          onClick={() => setSelected(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'linear-gradient(180deg,#0f172a,#020817)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 22, maxWidth: 640, width: '100%', maxHeight: '80vh', overflow: 'auto',
            boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
          }}>
            <div style={{
              background: 'linear-gradient(135deg,rgba(15,23,42,0.95),rgba(30,41,59,0.95))',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              padding: '24px 28px', position: 'relative', overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', bottom: -20, right: -10, fontSize: 80, opacity: 0.08 }}>{catConfig[selected.category]?.icon || '📋'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{
                  background: catConfig[selected.category]?.bg || 'rgba(59,130,246,0.15)',
                  color: catConfig[selected.category]?.color || '#60a5fa',
                  border: `1px solid ${catConfig[selected.category]?.border || 'rgba(59,130,246,0.3)'}`,
                  borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 800,
                }}>
                  {selected.category}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11.5, fontWeight: 600 }}>
                  Effective: {selected.effective_date}
                </span>
              </div>
              <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 900, margin: 0, lineHeight: 1.3 }}>{selected.title}</h2>
            </div>
            <div style={{ padding: '24px 28px' }}>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.85, marginBottom: 24 }}>{selected.content}</p>
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
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="policy-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'rgba(15,23,42,0.85)',
        backdropFilter: 'blur(16px)',
        border: `1.5px solid ${hovered && !locked ? cfg.border : 'rgba(255,255,255,0.08)'}`,
        boxShadow: hovered && !locked ? `0 16px 38px rgba(0,0,0,0.6), 0 0 20px ${cfg.bg}` : '0 4px 20px rgba(0,0,0,0.3)',
        borderRadius: 18,
        padding: '24px',
        opacity: locked ? 0.65 : 1,
        cursor: locked ? 'default' : 'pointer',
        animation: `cardIn 0.4s ease ${index * 0.05}s both`,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.2s cubic-bezier(.34,1.2,.64,1)',
        transform: hovered && !locked ? 'translateY(-3px)' : 'none',
      }}
      onClick={onClick}
    >
      <div style={{ position: 'absolute', bottom: -12, right: -6, fontSize: 72, opacity: 0.06, lineHeight: 1, pointerEvents: 'none' }}>{cfg.icon}</div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{
          background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
          borderRadius: 8, padding: '3px 10px', fontSize: 11.5, fontWeight: 800,
          display: 'inline-flex', alignItems: 'center', gap: 5,
        }}>
          <span>{cfg.icon}</span>
          <span>{p.category}</span>
        </span>
        <span style={{ fontSize: 13, color: locked ? '#f87171' : '#34d399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
          {locked ? '🔒 Members Only' : '✓ Official Charter'}
        </span>
      </div>

      <h3 style={{ fontWeight: 900, fontSize: 16, color: '#fff', lineHeight: 1.35, marginBottom: 8 }}>{p.title}</h3>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 12, fontWeight: 600 }}>📅 Effective Date: {p.effective_date}</div>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: 0 }}>
        {locked ? 'This policy is available to active DASIG members only.' : p.content.slice(0, 130) + (p.content.length > 130 ? '…' : '')}
      </p>
      {!locked && (
        <div style={{ marginTop: 16, fontSize: 12.5, color: '#f97316', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span>Read full charter</span>
          <span>→</span>
        </div>
      )}
    </div>
  );
}
