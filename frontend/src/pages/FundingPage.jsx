import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import ParticleBackground from '../components/ParticleBackground';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const categories = ['All', 'Scholarship', 'Grant', 'Government Fund', 'Research Grant'];
const statuses   = ['All', 'Open', 'Upcoming', 'Closed'];

const catConfig = {
  Scholarship:      { color: '#60a5fa', bg: 'rgba(59,130,246,0.14)', border: 'rgba(59,130,246,0.3)', icon: '🎓' },
  Grant:            { color: '#34d399', bg: 'rgba(52,211,153,0.14)', border: 'rgba(52,211,153,0.3)', icon: '💰' },
  'Government Fund':{ color: '#f59e0b', bg: 'rgba(245,158,11,0.14)', border: 'rgba(245,158,11,0.3)', icon: '🏛️' },
  'Research Grant': { color: '#c084fc', bg: 'rgba(192,132,252,0.14)', border: 'rgba(192,132,252,0.3)', icon: '🔬' },
};

const statusBadge = {
  Open:     { bg: 'rgba(16,185,129,0.15)', color: '#34d399', border: 'rgba(16,185,129,0.35)' },
  Upcoming: { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: 'rgba(59,130,246,0.35)' },
  Closed:   { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', border: 'rgba(255,255,255,0.12)' },
};

const FUNDING_CSS = `
  @keyframes cardIn {
    from { transform: translateY(12px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  .fund-card {
    border-radius: 18px; padding: 22px;
    cursor: pointer; position: relative; overflow: hidden;
    transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(15,23,42,0.85);
    backdrop-filter: blur(14px);
  }
  .fund-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 16px 40px rgba(0,0,0,0.6);
  }
  .filter-btn {
    border-radius: 9px; padding: 7px 16px; font-size: 12.5px; font-weight: 700;
    cursor: pointer; font-family: inherit; transition: all 0.15s ease;
    border: 1px solid rgba(255,255,255,0.12);
  }
`;

export default function FundingPage() {
  const { user }                  = useAuth();
  const navigate                  = useNavigate();
  const isMember                  = user && (user.role === 'MEMBER' || user.role === 'ADMIN');
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [category, setCategory]   = useState('All');
  const [status, setStatus]       = useState('All');
  const [selected, setSelected]   = useState(null);

  useEffect(() => {
    api.funding.list({ category, status })
      .then(r => setItems(Array.isArray(r) ? r : (r?.data || [])))
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
            <div style={{
              background: 'linear-gradient(135deg,rgba(15,23,42,0.95),rgba(30,41,59,0.95))',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              padding: '24px 28px', position: 'relative', overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', bottom: -20, right: -10, fontSize: 80, opacity: 0.08 }}>{catConfig[selected.category]?.icon || '💰'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{
                  background: catConfig[selected.category]?.bg || 'rgba(52,211,153,0.15)',
                  color: catConfig[selected.category]?.color || '#34d399',
                  border: `1px solid ${catConfig[selected.category]?.border || 'rgba(52,211,153,0.3)'}`,
                  borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 800,
                }}>
                  {selected.category}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600 }}>Deadline: {selected.deadline}</span>
              </div>
              <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 900, margin: 0, lineHeight: 1.3 }}>{selected.title}</h2>
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
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{r.l}</div>
                    <div style={{ fontSize: 14, color: '#fff', fontWeight: 700 }}>{r.v}</div>
                  </div>
                ))}
              </div>
              {selected.description && (
                <>
                  <div style={{ fontWeight: 800, fontSize: 12.5, color: 'rgba(255,255,255,0.6)', marginBottom: 9, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</div>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13.5, lineHeight: 1.8, marginBottom: 18 }}>{selected.description}</p>
                </>
              )}
              {selected.eligibility && (
                <>
                  <div style={{ fontWeight: 800, fontSize: 12.5, color: 'rgba(255,255,255,0.6)', marginBottom: 9, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Eligibility</div>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13.5, lineHeight: 1.8, marginBottom: 18 }}>{selected.eligibility}</p>
                </>
              )}
              <div style={{ display: 'flex', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
                {isMember ? (
                  <button
                    onClick={() => { setSelected(null); navigate('/contact-admin'); }}
                    style={{
                      flex: 1, background: 'linear-gradient(90deg,#10b981,#059669)',
                      color: '#fff', border: 'none', borderRadius: 12, padding: '12px 20px',
                      fontSize: 13.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                      boxShadow: '0 4px 16px rgba(16,185,129,0.35)',
                    }}
                  >
                    📝 Submit Grant Inquiry / Application →
                  </button>
                ) : (
                  <button
                    onClick={() => { setSelected(null); navigate('/membership'); }}
                    style={{
                      flex: 1, background: 'linear-gradient(90deg,#f97316,#e11d48)',
                      color: '#fff', border: 'none', borderRadius: 12, padding: '12px 20px',
                      fontSize: 13.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                      boxShadow: '0 4px 16px rgba(249,115,22,0.35)',
                    }}
                  >
                    🔒 Apply for Membership to Access Grants →
                  </button>
                )}
                <button
                  onClick={() => setSelected(null)}
                  style={{
                    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                    color: 'rgba(255,255,255,0.8)', borderRadius: 12, padding: '12px 24px',
                    fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <section style={{ padding: '32px 24px 80px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 28 }}>
            {[
              { label: 'Open Opportunities', value: items.filter(i => i.status === 'Open').length,     color: '#34d399', icon: '💰' },
              { label: 'Upcoming Grants',    value: items.filter(i => i.status === 'Upcoming').length, color: '#60a5fa', icon: '⏳' },
              { label: 'Total Catalog',      value: items.length,                                      color: '#f97316', icon: '📊' },
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
            <div style={{ textAlign:'center', padding:'60px 0' }}>
              <div style={{ fontSize:40, marginBottom:12 }}>💰</div>
              <div style={{ color:'rgba(255,255,255,0.55)', fontSize:16, fontWeight:700, marginBottom:6 }}>No funding opportunities found</div>
              <div style={{ color:'rgba(255,255,255,0.28)', fontSize:13 }}>Try adjusting the category or status filter above</div>
            </div>
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
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="fund-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'rgba(15,23,42,0.85)',
        backdropFilter: 'blur(16px)',
        border: `1.5px solid ${hovered ? cfg.border : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 18,
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: hovered ? `0 16px 38px rgba(0,0,0,0.6), 0 0 20px ${cfg.bg}` : '0 4px 20px rgba(0,0,0,0.3)',
        transform: hovered ? 'translateY(-3px)' : 'none',
        transition: 'all 0.2s cubic-bezier(.34,1.2,.64,1)',
        animation: `cardIn 0.4s ease ${index * 0.05}s both`,
      }}
      onClick={onClick}
    >
      <div style={{ position: 'absolute', bottom: -12, right: -6, fontSize: 72, opacity: 0.06, lineHeight: 1, pointerEvents: 'none' }}>{cfg.icon}</div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{
          background: sb.bg, color: sb.color, border: `1px solid ${sb.border}`,
          borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 800,
        }}>{item.status}</span>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>⏰ Due: {item.deadline}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: cfg.color }}>{cfg.icon} {item.category}</span>
        <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{item.provider}</span>
      </div>

      <h3 style={{ fontWeight: 900, fontSize: 16, color: '#fff', lineHeight: 1.35, marginBottom: 10 }}>{item.title}</h3>

      {item.amount && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: 8, padding: '3px 10px', fontSize: 13, color: '#34d399', fontWeight: 800, marginBottom: 12,
        }}>
          <span>💰</span>
          <span>{item.amount}</span>
        </div>
      )}

      {item.description && (
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.65, marginBottom: 14 }}>
          {item.description.slice(0, 110)}…
        </p>
      )}

      <div style={{ fontSize: 12.5, color: '#f97316', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
        <span>View opportunity details</span>
        <span>→</span>
      </div>
    </div>
  );
}
