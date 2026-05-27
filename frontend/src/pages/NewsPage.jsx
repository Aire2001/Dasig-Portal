import { useState, useEffect, useRef } from 'react';
import PageHeader from '../components/PageHeader';
import ParticleBackground from '../components/ParticleBackground';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const BADGE_FILTERS = ['All', 'Announcement', 'Policy', 'Funding', 'Training', 'Research'];

const badgeStyle = {
  Announcement: { bg: '#eff6ff', color: '#1e40af', accent: 'linear-gradient(135deg,#001d5c,#4f46e5)', icon: '📣' },
  Policy:       { bg: '#fef9c3', color: '#713f12', accent: 'linear-gradient(135deg,#f59e0b,#f97316)', icon: '📋' },
  Funding:      { bg: '#dcfce7', color: '#14532d', accent: 'linear-gradient(135deg,#059669,#0891b2)', icon: '💰' },
  Training:     { bg: '#fff1f2', color: '#9f1239', accent: 'linear-gradient(135deg,#e11d48,#7c3aed)', icon: '🎓' },
  Research:     { bg: '#f5f3ff', color: '#4c1d95', accent: 'linear-gradient(135deg,#7c3aed,#4f46e5)', icon: '🔬' },
};
const defaultBadge = badgeStyle.Announcement;

const NEWS_CSS = `
  @keyframes modalIn { from{transform:scale(0.88) translateY(20px);opacity:0} to{transform:scale(1) translateY(0);opacity:1} }
  @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
`;

export default function NewsPage() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('All');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setLoading(true);
    const params = filter !== 'All' ? { badge: filter } : {};
    api.news.list(params)
      .then(r => setArticles(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  function openArticle(a) {
    if (a.locked) { navigate(user ? '/membership' : '/login'); return; }
    setSelected(a);
  }

  const bs = selected ? (badgeStyle[selected.badge] || defaultBadge) : defaultBadge;

  return (
    <div style={{ background:'linear-gradient(180deg,#000d30 0%,#020817 300px,#0f172a 100%)', minHeight:'100vh', position:'relative' }}>
      <ParticleBackground density={45} />
      <div style={{ position:'relative', zIndex:1 }}>
      <style>{NEWS_CSS}</style>
      <PageHeader eyebrow="Consortium News" title="News & Announcements" />

      {/* ── Article Modal ── */}
      {selected && (
        <div onClick={() => setSelected(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          animation: 'fadeIn 0.18s ease',
          overflowY: 'auto',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'linear-gradient(180deg,#0f172a,#020817)', borderRadius: 22, maxWidth: 660, width: '100%',
            boxShadow: '0 32px 100px rgba(0,0,0,0.7)', overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.1)',
            animation: 'modalIn 0.26s cubic-bezier(.34,1.3,.64,1)',
            margin: 'auto',
          }}>
            {/* banner */}
            <div style={{ background: bs.accent, padding: '28px 28px 22px', position: 'relative' }}>
              <button onClick={() => setSelected(null)} style={{
                position: 'absolute', top: 14, right: 14,
                background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%',
                width: 32, height: 32, color: '#fff', fontSize: 16, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>✕</button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{
                  background: 'rgba(255,255,255,0.2)', color: '#fff',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: 6, padding: '3px 12px', fontSize: 11, fontWeight: 700,
                }}>{selected.badge}</span>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{selected.date}</span>
              </div>
              <h2 style={{ color: '#fff', fontSize: 21, fontWeight: 900, lineHeight: 1.3, margin: 0 }}>
                {selected.title}
              </h2>
            </div>

            {/* article body */}
            <div style={{ padding: '24px 28px 32px', maxHeight: '60vh', overflowY: 'auto' }}>
              {selected.excerpt && (
                <p style={{
                  fontSize: 14.5, color: 'rgba(255,255,255,0.8)', fontWeight: 600, lineHeight: 1.7,
                  borderLeft: '4px solid rgba(255,255,255,0.3)',
                  paddingLeft: 14, marginBottom: 20,
                  background: 'rgba(255,255,255,0.06)', borderRadius: '0 8px 8px 0', padding: '10px 14px',
                }}>{selected.excerpt}</p>
              )}
              {selected.content ? (
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.85 }}>
                  {selected.content.split('\n').map((para, i) =>
                    para.trim() ? <p key={i} style={{ marginBottom: 14 }}>{para}</p> : null
                  )}
                </div>
              ) : (
                <p style={{ color: 'rgba(255,255,255,0.35)', fontStyle: 'italic' }}>No additional content available.</p>
              )}
              <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setSelected(null)} style={{
                  background: bs.accent, color: '#fff', border: 'none', borderRadius: 10,
                  padding: '10px 24px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                }}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <section style={{ padding: '32px 24px 80px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>

          {/* filter badges */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
            {BADGE_FILTERS.map(b => {
              const isActive = filter === b;
              const s = badgeStyle[b] || {};
              return (
                <button key={b} onClick={() => setFilter(b)} style={{
                  background: isActive ? 'linear-gradient(90deg,#f97316,#e11d48)' : 'rgba(255,255,255,0.07)',
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
                  border: isActive ? 'none' : '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 20, padding: '7px 18px', fontSize: 12.5, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                  boxShadow: isActive ? '0 4px 14px rgba(249,115,22,0.35)' : 'none',
                }}>
                  {b !== 'All' && s.icon ? `${s.icon} ` : ''}{b}
                </button>
              );
            })}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.35)' }}>
              <div style={{ fontSize:36, marginBottom:12 }}>⏳</div>Loading news…
            </div>
          ) : articles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)' }}>No articles found.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {articles.map(a => <NewsCard key={a.id} article={a} onOpen={() => openArticle(a)} />)}
            </div>
          )}
        </div>
      </section>
      </div>
    </div>
  );
}

function NewsCard({ article: a, onOpen }) {
  const cardRef = useRef(null);
  const [tilt, setTilt]     = useState({ x: 0, y: 0 });
  const [hovered, setHov]   = useState(false);
  const bs = badgeStyle[a.badge] || defaultBadge;

  function onMove(e) {
    const r  = cardRef.current.getBoundingClientRect();
    const cx = r.left + r.width  / 2;
    const cy = r.top  + r.height / 2;
    setTilt({
      x: -((e.clientY - cy) / (r.height / 2)) * 5,
      y:  ((e.clientX - cx) / (r.width  / 2)) * 5,
    });
  }

  return (
    <div style={{ perspective: '600px' }}>
      <div
        ref={cardRef}
        onClick={onOpen}
        onMouseEnter={() => setHov(true)}
        onMouseMove={onMove}
        onMouseLeave={() => { setHov(false); setTilt({ x: 0, y: 0 }); }}
        style={{
          background: 'rgba(15,23,42,0.85)',
          border: `1.5px solid ${hovered && !a.locked ? 'rgba(249,115,22,0.5)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: 16, padding: '18px 20px', display: 'flex', gap: 16,
          cursor: a.locked ? 'default' : 'pointer',
          transition: hovered ? 'box-shadow 0.1s, border-color 0.1s' : 'all 0.4s ease',
          transform: hovered
            ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(-3px) scale(1.01)`
            : 'rotateX(0deg) rotateY(0deg) translateY(0) scale(1)',
          boxShadow: hovered && !a.locked
            ? '0 12px 36px rgba(0,29,92,0.13), 0 2px 8px rgba(0,0,0,0.06)'
            : '0 1px 4px rgba(0,0,0,0.04)',
          opacity: a.locked ? 0.72 : 1,
          position: 'relative', overflow: 'hidden',
        }}
      >
        {/* left accent bar */}
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
          background: bs.accent, borderRadius: '2px 0 0 2px',
        }} />

        {/* icon */}
        <div style={{
          width: 54, height: 54, borderRadius: 14, flexShrink: 0,
          background: bs.accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
          boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          transform: hovered ? 'scale(1.08) rotate(-4deg)' : 'scale(1) rotate(0deg)',
          transition: 'transform 0.3s ease',
        }}>{a.icon || bs.icon}</div>

        {/* content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <span style={{
              background: bs.bg, color: bs.color,
              borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700,
            }}>{a.badge}</span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{a.date}</span>
            {a.locked && (
              <span style={{
                background: '#fef3c7', color: '#92400e',
                borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 700,
              }}>🔒 Members Only</span>
            )}
          </div>
          <h3 style={{
            fontWeight: 800, fontSize: 15.5,
            lineHeight: 1.35, marginBottom: 6,
            color: hovered && !a.locked ? '#f97316' : '#fff',
            transition: 'color 0.2s',
          }}>{a.title}</h3>
          <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, margin: 0 }}>{a.excerpt}</p>
        </div>

        {/* arrow */}
        <div style={{
          alignSelf: 'center', flexShrink: 0,
          width: 32, height: 32, borderRadius: '50%',
          background: hovered && !a.locked ? bs.accent : '#f1f5f9',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, color: hovered && !a.locked ? '#fff' : '#94a3b8',
          transition: 'all 0.2s',
          transform: hovered && !a.locked ? 'translateX(3px)' : 'translateX(0)',
        }}>→</div>
      </div>
    </div>
  );
}
