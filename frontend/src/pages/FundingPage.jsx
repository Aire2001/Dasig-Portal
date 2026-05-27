import { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import ParticleBackground from '../components/ParticleBackground';
import { api } from '../api';

const categories = ['All', 'Scholarship', 'Grant', 'Government Fund', 'Research Grant'];
const statuses   = ['All', 'Open', 'Upcoming', 'Closed'];

const catConfig = {
  Scholarship:      { grad: 'linear-gradient(135deg,#1e3a8a,#3b82f6)', icon: '🎓' },
  Grant:            { grad: 'linear-gradient(135deg,#065f46,#10b981)', icon: '💰' },
  'Government Fund':{ grad: 'linear-gradient(135deg,#b45309,#f59e0b)', icon: '🏛️' },
  'Research Grant': { grad: 'linear-gradient(135deg,#4c1d95,#8b5cf6)', icon: '🔬' },
};

const statusBadge = {
  Open:     { bg: 'rgba(16,185,129,0.2)', color: '#34d399', border: 'rgba(16,185,129,0.35)' },
  Upcoming: { bg: 'rgba(59,130,246,0.2)', color: '#60a5fa', border: 'rgba(59,130,246,0.35)' },
  Closed:   { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', border: 'rgba(255,255,255,0.12)' },
};

const FUNDING_CSS = `
  @keyframes cardIn {
    from { transform: translateY(18px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  .fund-card {
    border-radius: 18px; padding: 22px;
    cursor: pointer; position: relative; overflow: hidden;
    transition: transform 0.22s cubic-bezier(.34,1.56,.64,1), box-shadow 0.22s;
    border: 1px solid rgba(255,255,255,0.1);
  }
  .fund-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 18px 44px rgba(0,0,0,0.4);
  }
  .fund-card::after {
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

export default function FundingPage() {
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [category, setCategory]   = useState('All');
  const [status, setStatus]       = useState('All');
  const [selected, setSelected]   = useState(null);

  useEffect(() => {
    api.funding.list({ category, status })
      .then(r => setItems(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [category, status]);

  return (
    <div style={{ background: 'linear-gradient(180deg,#000d30 0%,#020817 300px,#0f172a 100%)', minHeight: '100vh', position: 'relative' }}>
      <ParticleBackground density={40} />
      <div style={{ position: 'relative', zIndex: 1 }}>
      <style>{FUNDING_CSS}</style>
      <PageHeader eyebrow="Funding & Investment" title="Funding Opportunities" />

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
            <div style={{ background: catConfig[selected.category]?.grad || 'linear-gradient(135deg,#065f46,#10b981)', padding: '26px 30px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', bottom: -20, right: -10, fontSize: 80, opacity: 0.1 }}>{catConfig[selected.category]?.icon || '💰'}</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{selected.category} · Deadline: {selected.deadline}</div>
              <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 900, margin: 0, lineHeight: 1.25 }}>{selected.title}</h2>
            </div>
            <div style={{ padding: '26px 30px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 22 }}>
                {[
                  { l: 'Provider', v: selected.provider },
                  { l: 'Amount',   v: selected.amount || 'See details' },
                  { l: 'Deadline', v: selected.deadline },
                  { l: 'Status',   v: selected.status },
                ].map(r => (
                  <div key={r.l} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '13px 16px' }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{r.l}</div>
                    <div style={{ fontSize: 14, color: '#fff', fontWeight: 700 }}>{r.v}</div>
                  </div>
                ))}
              </div>
              {selected.description && (
                <>
                  <div style={{ fontWeight: 800, fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</div>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13.5, lineHeight: 1.8, marginBottom: 18 }}>{selected.description}</p>
                </>
              )}
              {selected.eligibility && (
                <>
                  <div style={{ fontWeight: 800, fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Eligibility</div>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13.5, lineHeight: 1.8, marginBottom: 18 }}>{selected.eligibility}</p>
                </>
              )}
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
              { label: 'Open Opportunities', value: items.filter(i => i.status === 'Open').length,     grad: 'linear-gradient(135deg,#065f46,#10b981)', icon: '✅' },
              { label: 'Upcoming',           value: items.filter(i => i.status === 'Upcoming').length, grad: 'linear-gradient(135deg,#1e3a8a,#3b82f6)', icon: '⏳' },
              { label: 'Total Listed',       value: items.length,                                      grad: 'linear-gradient(135deg,#4c1d95,#8b5cf6)', icon: '📊' },
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
          <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {categories.map(c => (
                <button key={c} className="filter-btn" onClick={() => setCategory(c)} style={{
                  background: category === c ? 'linear-gradient(90deg,#1e3a8a,#3b82f6)' : 'rgba(255,255,255,0.06)',
                  color: category === c ? '#fff' : 'rgba(255,255,255,0.55)',
                  borderColor: category === c ? 'transparent' : 'rgba(255,255,255,0.12)',
                  boxShadow: category === c ? '0 4px 14px rgba(59,130,246,0.35)' : 'none',
                }}>{c}</button>
              ))}
            </div>
            <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.12)' }} />
            <div style={{ display: 'flex', gap: 8 }}>
              {statuses.map(s => (
                <button key={s} className="filter-btn" onClick={() => setStatus(s)} style={{
                  background: status === s ? 'linear-gradient(90deg,#065f46,#10b981)' : 'rgba(255,255,255,0.06)',
                  color: status === s ? '#fff' : 'rgba(255,255,255,0.55)',
                  borderColor: status === s ? 'transparent' : 'rgba(255,255,255,0.12)',
                  boxShadow: status === s ? '0 4px 14px rgba(16,185,129,0.35)' : 'none',
                }}>{s}</button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.35)' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>Loading opportunities…
            </div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)' }}>No funding opportunities found.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
              {items.map((item, i) => <FundingCard key={item.id} item={item} index={i} onClick={() => setSelected(item)} />)}
            </div>
          )}
        </div>
      </section>
      </div>
    </div>
  );
}

function FundingCard({ item, index, onClick }) {
  const cfg = catConfig[item.category] || catConfig.Grant;
  const sb  = statusBadge[item.status] || statusBadge.Closed;

  return (
    <div className="fund-card"
      style={{ background: cfg.grad, animation: `cardIn 0.4s ease ${index * 0.06}s both` }}
      onClick={onClick}
    >
      <div style={{ position: 'absolute', bottom: -16, right: -8, fontSize: 72, opacity: 0.08, lineHeight: 1 }}>{cfg.icon}</div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{
          background: sb.bg, color: sb.color, border: `1px solid ${sb.border}`,
          borderRadius: 20, padding: '4px 13px', fontSize: 11.5, fontWeight: 800,
        }}>{item.status}</span>
        <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Due: {item.deadline}</span>
      </div>

      <h3 style={{ fontWeight: 900, fontSize: 16, color: '#fff', lineHeight: 1.3, marginBottom: 8 }}>{item.title}</h3>
      <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.65)', marginBottom: 6 }}>🏛️ {item.provider}</div>
      {item.amount && <div style={{ fontSize: 14, color: '#fff', fontWeight: 800, marginBottom: 10 }}>💰 {item.amount}</div>}
      {item.description && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.65, marginBottom: 14 }}>{item.description.slice(0, 100)}…</p>}
      <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)', fontWeight: 700 }}>View details →</div>
    </div>
  );
}
