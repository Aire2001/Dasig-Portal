import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import ParticleBackground from '../components/ParticleBackground';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const types = ['All', 'Academic Partnership', 'Research Collaboration', 'Technology Partnership', 'Funding Partnership'];

const typeConfig = {
  'Academic Partnership':   { grad: 'linear-gradient(135deg,#1e3a8a,#3b82f6)', icon: '🎓' },
  'Research Collaboration': { grad: 'linear-gradient(135deg,#065f46,#10b981)', icon: '🔬' },
  'Technology Partnership': { grad: 'linear-gradient(135deg,#4c1d95,#8b5cf6)', icon: '💻' },
  'Funding Partnership':    { grad: 'linear-gradient(135deg,#b45309,#f59e0b)', icon: '💰' },
};

const statusBadge = {
  Active:  { bg: 'rgba(16,185,129,0.2)', color: '#34d399', border: 'rgba(16,185,129,0.35)', dot: '#10b981' },
  Expired: { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', border: 'rgba(255,255,255,0.12)', dot: '#475569' },
  Pending: { bg: 'rgba(245,158,11,0.2)', color: '#fbbf24', border: 'rgba(245,158,11,0.35)', dot: '#f59e0b' },
};

const PARTNERS_CSS = `
  @keyframes cardIn {
    from { transform: translateY(18px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  .partner-card {
    border-radius: 18px; padding: 22px;
    cursor: pointer; position: relative; overflow: hidden;
    transition: transform 0.22s cubic-bezier(.34,1.56,.64,1), box-shadow 0.22s;
    border: 1px solid rgba(255,255,255,0.1);
  }
  .partner-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 18px 44px rgba(0,0,0,0.4);
  }
  .partner-card::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.09) 0%, transparent 55%);
    pointer-events: none;
  }
  .filter-btn {
    border-radius: 20px; padding: 7px 16px; font-size: 12.5px; font-weight: 700;
    cursor: pointer; font-family: inherit; transition: all 0.18s;
    border: 1px solid rgba(255,255,255,0.15);
  }
`;

export default function PartnershipsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [partnerships, setPartnerships] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [activeType, setActiveType]     = useState('All');
  const [selected, setSelected]         = useState(null);

  const isMember = user && (user.role === 'MEMBER' || user.role === 'ADMIN');

  useEffect(() => {
    if (!isMember) { setLoading(false); return; }
    api.partnerships.list({ type: activeType })
      .then(r => setPartnerships(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isMember, activeType]);

  if (!isMember) {
    return (
      <div style={{ background: 'linear-gradient(180deg,#000d30 0%,#020817 300px,#0f172a 100%)', minHeight: '100vh', position: 'relative' }}>
        <ParticleBackground density={40} />
        <div style={{ position: 'relative', zIndex: 1 }}>
        <PageHeader eyebrow="Strategic Partnerships" title="Partnerships" />
        <div style={{ minHeight: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <div style={{ fontSize: 52 }}>🤝</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>Members Only</div>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, textAlign: 'center', maxWidth: 340 }}>
            Partnership information is available to active DASIG consortium members.
          </p>
          <button onClick={() => navigate(user ? '/membership' : '/login')} style={{
            background: 'linear-gradient(90deg,#f97316,#e11d48)', color: '#fff',
            border: 'none', borderRadius: 12, padding: '13px 32px', fontSize: 14, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 20px rgba(249,115,22,0.4)',
          }}>{user ? 'Apply for Membership →' : 'Log in →'}</button>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'linear-gradient(180deg,#000d30 0%,#020817 300px,#0f172a 100%)', minHeight: '100vh', position: 'relative' }}>
      <ParticleBackground density={40} />
      <div style={{ position: 'relative', zIndex: 1 }}>
      <style>{PARTNERS_CSS}</style>
      <PageHeader eyebrow="Strategic Partnerships" title="Partnerships" />

      {/* Detail modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, backdropFilter: 'blur(4px)' }}
          onClick={() => setSelected(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'linear-gradient(180deg,#0f172a,#020817)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 22, maxWidth: 620, width: '100%', maxHeight: '80vh', overflow: 'auto',
            boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
          }}>
            <div style={{ background: typeConfig[selected.type]?.grad || 'linear-gradient(135deg,#1e3a8a,#3b82f6)', padding: '26px 30px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', bottom: -20, right: -10, fontSize: 80, opacity: 0.1 }}>{typeConfig[selected.type]?.icon || '🤝'}</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{selected.type}</div>
              <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 900, margin: 0, lineHeight: 1.25 }}>{selected.partner_name}</h2>
            </div>
            <div style={{ padding: '26px 30px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 22 }}>
                {[
                  { l: 'Status',   v: selected.status },
                  { l: 'Started',  v: selected.start_date },
                  { l: 'End Date', v: selected.end_date || 'Ongoing' },
                  { l: 'Contact',  v: selected.contact_person || '—' },
                ].map(r => (
                  <div key={r.l} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '13px 16px' }}>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{r.l}</div>
                    <div style={{ fontSize: 14, color: '#fff', fontWeight: 700 }}>{r.v}</div>
                  </div>
                ))}
              </div>
              {selected.description && <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13.5, lineHeight: 1.8, marginBottom: 18 }}>{selected.description}</p>}
              {selected.contact_email && <div style={{ fontSize: 13, color: '#60a5fa', marginBottom: 18 }}>✉️ {selected.contact_email}</div>}
              <button onClick={() => setSelected(null)} style={{ background: 'linear-gradient(90deg,#f97316,#e11d48)', color: '#fff', border: 'none', borderRadius: 12, padding: '11px 28px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(249,115,22,0.35)' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      <section style={{ padding: '32px 24px 80px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 32 }}>
            {[
              { label: 'Active Partnerships', value: partnerships.filter(p => p.status === 'Active').length,  grad: 'linear-gradient(135deg,#065f46,#10b981)', icon: '✅' },
              { label: 'Pending',             value: partnerships.filter(p => p.status === 'Pending').length, grad: 'linear-gradient(135deg,#b45309,#f59e0b)', icon: '⏳' },
              { label: 'Total',               value: partnerships.length,                                     grad: 'linear-gradient(135deg,#1e3a8a,#3b82f6)', icon: '🤝' },
            ].map(s => (
              <div key={s.label} style={{
                background: s.grad, borderRadius: 16, padding: '18px 20px',
                display: 'flex', alignItems: 'center', gap: 14,
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)', position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', bottom: -8, right: 5, fontSize: 52, opacity: 0.1, lineHeight: 1 }}>{s.icon}</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#fff' }}>{s.value}</div>
                <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
            {types.map(t => (
              <button key={t} className="filter-btn" onClick={() => setActiveType(t)} style={{
                background: activeType === t ? 'linear-gradient(90deg,#f97316,#e11d48)' : 'rgba(255,255,255,0.06)',
                color: activeType === t ? '#fff' : 'rgba(255,255,255,0.55)',
                borderColor: activeType === t ? 'transparent' : 'rgba(255,255,255,0.12)',
                boxShadow: activeType === t ? '0 4px 14px rgba(249,115,22,0.35)' : 'none',
              }}>{t}</button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.35)' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>Loading partnerships…
            </div>
          ) : partnerships.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)' }}>No partnerships found.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
              {partnerships.map((p, i) => <PartnerCard key={p.id} p={p} index={i} onClick={() => setSelected(p)} />)}
            </div>
          )}
        </div>
      </section>
      </div>
    </div>
  );
}

function PartnerCard({ p, index, onClick }) {
  const cfg = typeConfig[p.type] || typeConfig['Academic Partnership'];
  const sb  = statusBadge[p.status] || statusBadge.Active;

  return (
    <div className="partner-card"
      style={{ background: cfg.grad, animation: `cardIn 0.4s ease ${index * 0.06}s both` }}
      onClick={onClick}
    >
      <div style={{ position: 'absolute', bottom: -16, right: -8, fontSize: 72, opacity: 0.08, lineHeight: 1 }}>{cfg.icon}</div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: sb.dot, display: 'inline-block' }} />
          <span style={{
            background: sb.bg, color: sb.color, border: `1px solid ${sb.border}`,
            borderRadius: 20, padding: '4px 11px', fontSize: 11.5, fontWeight: 800,
          }}>{p.status}</span>
        </div>
        <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>{p.start_date}</span>
      </div>

      <h3 style={{ fontWeight: 900, fontSize: 16, color: '#fff', lineHeight: 1.3, marginBottom: 8 }}>{p.partner_name}</h3>
      <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.65)', marginBottom: 10 }}>{cfg.icon} {p.type}</div>
      {p.description && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.65, marginBottom: 14 }}>{p.description.slice(0, 100)}…</p>}
      {p.contact_person && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>👤 {p.contact_person}</div>}
      <div style={{ marginTop: 12, fontSize: 12.5, color: 'rgba(255,255,255,0.55)', fontWeight: 700 }}>View details →</div>
    </div>
  );
}
