import { useState, useEffect } from 'react';
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

// Curated Unsplash photo seeds per category — consistent, real photos, no API key needed
const COVER_SEEDS = {
  Announcement: 'conference-summit-meeting',
  Policy:       'government-document-law',
  Funding:      'finance-scholarship-money',
  Training:     'education-classroom-learning',
  Research:     'science-research-laboratory',
};

function coverUrl(article) {
  const seed = COVER_SEEDS[article.badge] || 'education-conference';
  // Unique per article (same badge always gives different photo per article ID)
  return `https://picsum.photos/seed/${seed}-${article.id || 1}/800/400`;
}

const NEWS_CSS = `
  @keyframes modalIn { from{transform:scale(0.88) translateY(20px);opacity:0} to{transform:scale(1) translateY(0);opacity:1} }
  @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes cardUp  { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 22 }}>
              {articles.map((a, i) => <NewsCard key={a.id} article={a} idx={i} onOpen={() => openArticle(a)} />)}
            </div>
          )}
        </div>
      </section>
      </div>
    </div>
  );
}

function NewsCard({ article: a, idx, onOpen }) {
  const [hov, setHov]       = useState(false);
  const [imgOk, setImgOk]   = useState(true);
  const bs = badgeStyle[a.badge] || defaultBadge;

  return (
    <div
      onClick={onOpen}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        borderRadius: 18, overflow: 'hidden',
        background: 'rgba(12,18,36,0.96)',
        border: `1px solid ${hov && !a.locked ? 'rgba(249,115,22,0.45)' : 'rgba(255,255,255,0.08)'}`,
        boxShadow: hov && !a.locked ? '0 18px 48px rgba(0,0,0,0.45)' : '0 4px 18px rgba(0,0,0,0.35)',
        transform: hov && !a.locked ? 'translateY(-6px)' : 'none',
        transition: 'all .22s cubic-bezier(.34,1.56,.64,1)',
        cursor: a.locked ? 'default' : 'pointer',
        animation: `cardUp .35s ease ${idx * 0.05}s both`,
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* ── Actual photo cover ── */}
      <div style={{ position:'relative', height:200, overflow:'hidden', flexShrink:0 }}>
        {imgOk ? (
          <img
            src={coverUrl(a)}
            alt={a.title}
            onError={() => setImgOk(false)}
            style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', transition:'transform .35s ease', transform: hov ? 'scale(1.06)' : 'scale(1)' }}
          />
        ) : (
          /* Fallback: gradient when photo fails to load */
          <div style={{ width:'100%', height:'100%', background: bs.accent, display:'flex', alignItems:'center', justifyContent:'center', fontSize:64, opacity:0.5 }}>
            {a.icon || bs.icon}
          </div>
        )}

        {/* Gradient overlay at bottom for text legibility */}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(0,0,0,0) 30%, rgba(0,0,0,0.72) 100%)', pointerEvents:'none' }} />

        {/* Badge + date pinned to bottom-left of photo */}
        <div style={{ position:'absolute', bottom:12, left:14, display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ background: bs.accent, color:'#fff', borderRadius:6, padding:'4px 10px', fontSize:10.5, fontWeight:800, boxShadow:'0 2px 8px rgba(0,0,0,0.4)' }}>
            {bs.icon} {a.badge}
          </span>
          <span style={{ color:'rgba(255,255,255,0.8)', fontSize:11.5, fontWeight:600, textShadow:'0 1px 4px rgba(0,0,0,0.8)' }}>
            {String(a.date).slice(0,10)}
          </span>
        </div>

        {/* Members-only lock overlay */}
        {a.locked && (
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:8 }}>
            <div style={{ fontSize:32 }}>🔒</div>
            <div style={{ color:'#fff', fontSize:13, fontWeight:800, letterSpacing:'.3px' }}>Members Only</div>
          </div>
        )}
      </div>

      {/* ── Card body ── */}
      <div style={{ padding:'16px 18px 18px', flex:1, display:'flex', flexDirection:'column' }}>
        <h3 style={{ color:'#fff', fontSize:15, fontWeight:900, lineHeight:1.4, marginBottom:8, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
          {a.title}
        </h3>
        {a.excerpt && (
          <p style={{ color:'rgba(255,255,255,0.5)', fontSize:12.5, lineHeight:1.65, marginBottom:'auto', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical', paddingBottom:12 }}>
            {a.excerpt}
          </p>
        )}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:12, paddingTop:12, borderTop:'1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize:11, color:'rgba(255,255,255,0.28)', fontWeight:500 }}>DASIG Consortium</span>
          {!a.locked && (
            <span style={{ fontSize:12.5, color: hov ? '#f97316' : 'rgba(255,255,255,0.4)', fontWeight:700, transition:'color .15s', display:'flex', alignItems:'center', gap:4 }}>
              Read more <span style={{ fontSize:14 }}>→</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
