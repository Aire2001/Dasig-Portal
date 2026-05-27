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
    from { transform: translateY(18px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  .policy-card {
    border-radius: 18px; padding: 22px;
    cursor: pointer; position: relative; overflow: hidden;
    transition: transform 0.22s cubic-bezier(.34,1.56,.64,1), box-shadow 0.22s;
    border: 1px solid rgba(255,255,255,0.1);
  }
  .policy-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 18px 44px rgba(0,0,0,0.4);
  }
  .policy-card::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.09) 0%, transparent 55%);
    pointer-events: none;
  }
  .filter-btn {
    border-radius: 20px; padding: 7px 18px; font-size: 13px; font-weight: 700;
    cursor: pointer; font-family: inherit; transition: all 0.18s;
    border: 1px solid rgba(255,255,255,0.15);
  }
  .filter-btn:hover { transform: translateY(-1px); }
`;

export default function PoliciesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [active, setActive]     = useState('All');
  const [selected, setSelected] = useState(null);

  const isMember = user && (user.role === 'MEMBER' || user.role === 'ADMIN');

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    api.policies.list({ category: active })
      .then(r => setPolicies(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, active]);

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

          {/* Filter buttons */}
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
          borderRadius: 8, padding: '4px 12px', fontSize: 11, fontWeight: 800,
        }}>{p.category}</span>
        <span style={{ fontSize: 20 }}>{locked ? '🔒' : cfg.icon}</span>
      </div>

      <h3 style={{ fontWeight: 900, fontSize: 15.5, color: '#fff', lineHeight: 1.35, marginBottom: 8 }}>{p.title}</h3>
      <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)', marginBottom: 10, fontWeight: 600 }}>Effective: {p.effective_date}</div>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: 0 }}>
        {locked ? 'This policy is available to DASIG members only.' : p.content.slice(0, 120) + (p.content.length > 120 ? '…' : '')}
      </p>
      {!locked && <div style={{ marginTop: 14, fontSize: 12.5, color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>Read full policy →</div>}
    </div>
  );
}
