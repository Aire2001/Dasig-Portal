import { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import ParticleBackground from '../components/ParticleBackground';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const BADGE_FILTERS = ['All', 'Announcement', 'Policy', 'Funding', 'Training', 'Research'];

const BADGE = {
  Announcement: { color:'#60a5fa', bg:'rgba(96,165,250,0.15)',  border:'rgba(96,165,250,0.35)',  accent:'linear-gradient(135deg,#1e3a8a,#4f46e5)', icon:'📣' },
  Policy:       { color:'#fcd34d', bg:'rgba(252,211,77,0.15)',  border:'rgba(252,211,77,0.35)',  accent:'linear-gradient(135deg,#92400e,#f59e0b)', icon:'📋' },
  Funding:      { color:'#6ee7b7', bg:'rgba(110,231,183,0.15)', border:'rgba(110,231,183,0.35)', accent:'linear-gradient(135deg,#064e3b,#059669)', icon:'💰' },
  Training:     { color:'#fca5a5', bg:'rgba(252,165,165,0.15)', border:'rgba(252,165,165,0.35)', accent:'linear-gradient(135deg,#881337,#e11d48)', icon:'🎓' },
  Research:     { color:'#c4b5fd', bg:'rgba(196,181,253,0.15)', border:'rgba(196,181,253,0.35)', accent:'linear-gradient(135deg,#4c1d95,#7c3aed)', icon:'🔬' },
};
const B0 = BADGE.Announcement;

// Stable Unsplash photos per category
const COVERS = {
  Announcement: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
  Policy:       'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80',
  Funding:      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80',
  Training:     'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80',
  Research:     'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&q=80',
};

function coverUrl(a) {
  if (a.image_url) return a.image_url;
  return COVERS[a.badge] || COVERS.Announcement;
}

function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  return isNaN(dt) ? String(d).slice(0,10) : dt.toLocaleDateString('en-PH', { year:'numeric', month:'long', day:'numeric' });
}

function readTime(text) {
  if (!text) return '1 min read';
  const words = text.trim().split(/\s+/).length;
  return `${Math.max(1, Math.round(words / 200))} min read`;
}

const CSS = `
  @keyframes modalIn { from{transform:scale(.9) translateY(24px);opacity:0} to{transform:scale(1) translateY(0);opacity:1} }
  @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes cardUp  { from{transform:translateY(18px);opacity:0} to{transform:translateY(0);opacity:1} }
  @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
`;

export default function NewsPage() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('All');
  const [selected, setSelected] = useState(null);

  function load(f = filter) {
    setLoading(true);
    const params = f !== 'All' ? { badge: f } : {};
    api.news.list(params).then(r => setArticles(r.data || [])).catch(() => {}).finally(() => setLoading(false));
  }

  useEffect(() => { load(filter); }, [filter]);

  function openArticle(a) {
    if (a.locked) { navigate(user ? '/membership' : '/login'); return; }
    setSelected(a);
  }

  const featured = articles[0];
  const rest = articles.slice(1);

  return (
    <div style={{ background:'linear-gradient(180deg,#000d30 0%,#020817 300px,#0f172a 100%)', minHeight:'100vh', position:'relative' }}>
      <ParticleBackground density={40} />
      <style>{CSS}</style>
      <div style={{ position:'relative', zIndex:1 }}>
        <PageHeader eyebrow="Consortium News" title="News & Announcements" />

        {selected && <ArticleReader article={selected} onClose={() => setSelected(null)} />}

        <section style={{ padding:'28px 24px 80px' }}>
          <div style={{ maxWidth:1160, margin:'0 auto' }}>

            {/* ── Filter bar ── */}
            <div style={{
              background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)',
              borderRadius:18, padding:'12px 16px', marginBottom:28,
              display:'flex', alignItems:'center', gap:8, flexWrap:'wrap',
              backdropFilter:'blur(10px)',
            }}>
              {BADGE_FILTERS.map(b => {
                const isA = filter === b;
                const s = BADGE[b];
                return (
                  <button key={b} onClick={() => setFilter(b)} style={{
                    background: isA ? 'linear-gradient(90deg,#f97316,#e11d48)' : 'rgba(255,255,255,0.07)',
                    color: isA ? '#fff' : 'rgba(255,255,255,0.55)',
                    border: isA ? 'none' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius:20, padding:'7px 18px', fontSize:12.5, fontWeight:700,
                    cursor:'pointer', fontFamily:'inherit', transition:'all .15s',
                    boxShadow: isA ? '0 3px 12px rgba(249,115,22,0.35)' : 'none',
                    transform: isA ? 'scale(1.04)' : 'scale(1)',
                  }}>{s ? `${s.icon} ` : ''}{b}</button>
                );
              })}
              <button onClick={() => load(filter)} style={{ marginLeft:'auto', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:20, padding:'7px 16px', color:'rgba(255,255,255,0.6)', fontSize:12.5, fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:5, transition:'all .13s' }}
                onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.13)'; e.currentTarget.style.color='#fff';}}
                onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.07)'; e.currentTarget.style.color='rgba(255,255,255,0.6)';}}
              >↻ Refresh</button>
            </div>

            {loading ? (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:22 }}>
                {[...Array(6)].map((_,i) => (
                  <div key={i} style={{ borderRadius:18, overflow:'hidden', background:'rgba(255,255,255,0.04)', height:320, animation:'cardUp .35s ease both', animationDelay:`${i*0.05}s` }}>
                    <div style={{ height:180, background:'linear-gradient(90deg,rgba(255,255,255,0.04) 0%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 100%)', backgroundSize:'400px 100%', animation:'shimmer 1.4s infinite' }} />
                    <div style={{ padding:18 }}>
                      <div style={{ height:14, borderRadius:7, background:'rgba(255,255,255,0.07)', marginBottom:10 }} />
                      <div style={{ height:14, borderRadius:7, background:'rgba(255,255,255,0.05)', width:'70%' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : articles.length === 0 ? (
              <div style={{ textAlign:'center', padding:'80px 0' }}>
                <div style={{ fontSize:48, marginBottom:14 }}>📰</div>
                <div style={{ color:'rgba(255,255,255,0.55)', fontSize:16, fontWeight:700 }}>No articles found</div>
                <div style={{ color:'rgba(255,255,255,0.3)', fontSize:13, marginTop:6 }}>Try a different filter category.</div>
              </div>
            ) : (
              <>
                {/* ── Featured article (first) ── */}
                {featured && filter === 'All' && (
                  <FeaturedCard article={featured} onOpen={() => openArticle(featured)} />
                )}

                {/* ── Article grid ── */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:22, marginTop: filter === 'All' && featured ? 22 : 0 }}>
                  {(filter === 'All' ? rest : articles).map((a, i) => (
                    <NewsCard key={a.id} article={a} idx={i} onOpen={() => openArticle(a)} />
                  ))}
                </div>
              </>
            )}

          </div>
        </section>
      </div>
    </div>
  );
}

/* ── Featured hero card ── */
function FeaturedCard({ article: a, onOpen }) {
  const [hov, setHov] = useState(false);
  const [imgOk, setImgOk] = useState(true);
  const bs = BADGE[a.badge] || B0;

  return (
    <div onClick={onOpen} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        borderRadius:22, overflow:'hidden', cursor:'pointer', position:'relative',
        border: `1px solid ${hov ? 'rgba(249,115,22,0.5)' : 'rgba(255,255,255,0.08)'}`,
        boxShadow: hov ? '0 24px 64px rgba(0,0,0,0.6)' : '0 6px 24px rgba(0,0,0,0.4)',
        transform: hov ? 'translateY(-4px)' : 'none',
        transition:'all .24s cubic-bezier(.34,1.56,.64,1)',
        animation:'cardUp .4s ease both',
        height:360,
      }}>
      {imgOk
        ? <img src={coverUrl(a)} alt={a.title} onError={() => setImgOk(false)}
            style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', transition:'transform .5s ease', transform: hov ? 'scale(1.04)' : 'scale(1)' }} />
        : <div style={{ width:'100%', height:'100%', background: bs.accent }} />
      }
      {/* Gradient overlay */}
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.15) 40%, rgba(5,8,20,0.97) 100%)' }} />

      {/* FEATURED badge top-left */}
      <div style={{ position:'absolute', top:18, left:20 }}>
        <span style={{ background:'linear-gradient(90deg,#f97316,#e11d48)', color:'#fff', borderRadius:7, padding:'5px 14px', fontSize:11.5, fontWeight:900, letterSpacing:'1px', textTransform:'uppercase', boxShadow:'0 4px 14px rgba(249,115,22,0.5)' }}>★ Featured</span>
      </div>

      {/* Content bottom */}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'24px 28px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
          <span style={{ background: bs.bg, color: bs.color, border:`1px solid ${bs.border}`, borderRadius:7, padding:'4px 13px', fontSize:12, fontWeight:800 }}>{bs.icon} {a.badge}</span>
          <span style={{ color:'rgba(255,255,255,0.6)', fontSize:12.5, fontWeight:600 }}>{fmtDate(a.date)}</span>
          <span style={{ color:'rgba(255,255,255,0.35)', fontSize:12 }}>{readTime(a.content)}</span>
        </div>
        <h2 style={{ color:'#fff', fontSize:22, fontWeight:900, lineHeight:1.35, margin:'0 0 10px', textShadow:'0 2px 12px rgba(0,0,0,0.8)', maxWidth:680 }}>{a.title}</h2>
        {a.excerpt && <p style={{ color:'rgba(255,255,255,0.65)', fontSize:13.5, lineHeight:1.65, margin:'0 0 14px', maxWidth:600, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{a.excerpt}</p>}
        <span style={{ color: hov ? '#f97316' : 'rgba(255,255,255,0.5)', fontSize:13.5, fontWeight:700, transition:'color .15s', display:'flex', alignItems:'center', gap:5 }}>
          Read article <span style={{ fontSize:16 }}>→</span>
        </span>
      </div>
    </div>
  );
}

/* ── Regular news card ── */
function NewsCard({ article: a, idx, onOpen }) {
  const [hov, setHov] = useState(false);
  const [imgOk, setImgOk] = useState(true);
  const bs = BADGE[a.badge] || B0;

  return (
    <div onClick={onOpen} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        borderRadius:18, overflow:'hidden', cursor: a.locked ? 'default' : 'pointer',
        background:'rgba(10,15,30,0.96)',
        border:`1px solid ${hov && !a.locked ? 'rgba(249,115,22,0.4)' : 'rgba(255,255,255,0.07)'}`,
        boxShadow: hov && !a.locked ? '0 18px 48px rgba(0,0,0,0.5)' : '0 4px 16px rgba(0,0,0,0.35)',
        transform: hov && !a.locked ? 'translateY(-5px)' : 'none',
        transition:'all .22s cubic-bezier(.34,1.56,.64,1)',
        animation:`cardUp .35s ease ${idx*0.05}s both`,
        display:'flex', flexDirection:'column',
      }}>
      {/* Cover image */}
      <div style={{ position:'relative', height:192, overflow:'hidden', flexShrink:0 }}>
        {imgOk
          ? <img src={coverUrl(a)} alt={a.title} onError={() => setImgOk(false)}
              style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', transition:'transform .4s ease', transform: hov ? 'scale(1.07)' : 'scale(1)' }} />
          : <div style={{ width:'100%', height:'100%', background: bs.accent, display:'flex', alignItems:'center', justifyContent:'center', fontSize:56 }}>{bs.icon}</div>
        }
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, transparent 45%, rgba(10,15,30,0.85) 100%)', pointerEvents:'none' }} />

        {/* Badge pinned bottom-left */}
        <div style={{ position:'absolute', bottom:11, left:13, display:'flex', alignItems:'center', gap:7 }}>
          <span style={{ background: bs.bg, color: bs.color, border:`1px solid ${bs.border}`, borderRadius:6, padding:'3px 10px', fontSize:11.5, fontWeight:800, backdropFilter:'blur(6px)' }}>{bs.icon} {a.badge}</span>
        </div>

        {/* Lock overlay */}
        {a.locked && (
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:8, backdropFilter:'blur(3px)' }}>
            <div style={{ fontSize:28 }}>🔒</div>
            <div style={{ color:'#fff', fontSize:12.5, fontWeight:800, letterSpacing:'.5px' }}>MEMBERS ONLY</div>
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding:'15px 17px 17px', flex:1, display:'flex', flexDirection:'column' }}>
        <h3 style={{ color:'#fff', fontSize:14.5, fontWeight:900, lineHeight:1.45, margin:'0 0 8px', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{a.title}</h3>
        {a.excerpt && (
          <p style={{ color:'rgba(255,255,255,0.45)', fontSize:12.5, lineHeight:1.65, margin:'0 0 12px', display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{a.excerpt}</p>
        )}
        <div style={{ marginTop:'auto', paddingTop:12, borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:7 }}>
            <div style={{ width:26, height:26, borderRadius:'50%', background: bs.accent, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, flexShrink:0 }}>{bs.icon}</div>
            <div>
              <div style={{ color:'rgba(255,255,255,0.65)', fontSize:11.5, fontWeight:600 }}>{fmtDate(a.date)}</div>
              <div style={{ color:'rgba(255,255,255,0.3)', fontSize:11 }}>{readTime(a.content)}</div>
            </div>
          </div>
          {!a.locked && (
            <span style={{ color: hov ? '#f97316' : 'rgba(255,255,255,0.35)', fontSize:13, fontWeight:700, transition:'color .15s' }}>Read →</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Article reader modal ── */
function ArticleReader({ article: a, onClose }) {
  const [imgOk, setImgOk] = useState(true);
  const bs = BADGE[a.badge] || B0;

  function renderContent(text) {
    if (!text) return null;
    return text.split('\n').filter(l => l.trim()).map((line, i) => {
      const t = line.trim();
      if (/^\d+\./.test(t)) {
        const num = t.match(/^(\d+)\./)[1];
        const body = t.replace(/^\d+\.\s*/, '');
        return (
          <div key={i} style={{ display:'flex', gap:14, marginBottom:12, alignItems:'flex-start' }}>
            <span style={{ background: bs.accent, color:'#fff', borderRadius:'50%', width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12.5, fontWeight:900, flexShrink:0, marginTop:2 }}>{num}</span>
            <p style={{ margin:0, fontSize:15, color:'rgba(255,255,255,0.75)', lineHeight:1.8 }}>{body}</p>
          </div>
        );
      }
      if (t.startsWith('- ') || t.startsWith('• ')) {
        return (
          <div key={i} style={{ display:'flex', gap:12, marginBottom:9, alignItems:'flex-start' }}>
            <span style={{ color:'#f97316', fontSize:16, flexShrink:0, lineHeight:1.65 }}>▸</span>
            <p style={{ margin:0, fontSize:15, color:'rgba(255,255,255,0.75)', lineHeight:1.8 }}>{t.replace(/^[-•]\s*/, '')}</p>
          </div>
        );
      }
      if (t.endsWith(':') && t.length < 70) {
        return <h4 key={i} style={{ color:'#fff', fontSize:16, fontWeight:800, margin: i > 0 ? '22px 0 10px' : '0 0 10px', letterSpacing:'-0.2px' }}>{t}</h4>;
      }
      return <p key={i} style={{ margin:'0 0 16px', fontSize:15, color:'rgba(255,255,255,0.7)', lineHeight:1.9 }}>{t}</p>;
    });
  }

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.82)', zIndex:9100, display:'flex', alignItems:'center', justifyContent:'center', padding:16, overflowY:'auto', animation:'fadeIn .18s ease', backdropFilter:'blur(6px)' }}>
      <div onClick={e => e.stopPropagation()} style={{
        background:'#070d1c',
        borderRadius:24,
        maxWidth:'min(740px, calc(100vw - 32px))',
        width:'100%',
        boxShadow:'0 48px 120px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.08)',
        animation:'modalIn .3s cubic-bezier(.34,1.2,.64,1)',
        margin:'auto',
        maxHeight:'92vh',
        display:'flex', flexDirection:'column',
        position:'relative', overflow:'hidden',
      }}>

        {/* Close button */}
        <button onClick={onClose} style={{
          position:'absolute', top:16, right:16, zIndex:30,
          background:'rgba(0,0,0,0.7)', border:'1.5px solid rgba(255,255,255,0.3)',
          backdropFilter:'blur(12px)', borderRadius:'50%',
          width:42, height:42, color:'#fff', fontSize:17, fontWeight:700,
          cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 4px 16px rgba(0,0,0,0.6)', transition:'all .15s',
        }}
        onMouseEnter={e=>{e.currentTarget.style.background='rgba(225,29,72,0.8)'; e.currentTarget.style.transform='scale(1.1)';}}
        onMouseLeave={e=>{e.currentTarget.style.background='rgba(0,0,0,0.7)'; e.currentTarget.style.transform='scale(1)';}}
        >✕</button>

        {/* Hero image */}
        <div style={{ position:'relative', height:260, flexShrink:0, overflow:'hidden' }}>
          {imgOk
            ? <img src={coverUrl(a)} alt={a.title} onError={() => setImgOk(false)}
                style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
            : <div style={{ width:'100%', height:'100%', background: bs.accent, display:'flex', alignItems:'center', justifyContent:'center', fontSize:80, opacity:0.35 }}>{bs.icon}</div>
          }
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(7,13,28,0.98) 100%)' }} />

          {/* Badge + meta over image */}
          <div style={{ position:'absolute', bottom:22, left:28, right:60 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <span style={{ background: bs.bg, color: bs.color, border:`1px solid ${bs.border}`, borderRadius:7, padding:'5px 14px', fontSize:12.5, fontWeight:800 }}>{bs.icon} {a.badge}</span>
              <span style={{ color:'rgba(255,255,255,0.6)', fontSize:13, fontWeight:600 }}>{fmtDate(a.date)}</span>
              <span style={{ color:'rgba(255,255,255,0.35)', fontSize:12.5 }}>· {readTime(a.content)}</span>
            </div>
            <h2 style={{ color:'#fff', fontSize:20, fontWeight:900, lineHeight:1.35, margin:0, textShadow:'0 2px 16px rgba(0,0,0,0.9)' }}>{a.title}</h2>
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ overflowY:'auto', flex:1 }}>
          <div style={{ padding:'24px 30px 10px' }}>

            {/* Byline */}
            <div style={{ display:'flex', alignItems:'center', gap:12, paddingBottom:20, borderBottom:'1px solid rgba(255,255,255,0.07)', marginBottom:22 }}>
              <div style={{ width:40, height:40, borderRadius:'50%', background: bs.accent, display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, flexShrink:0 }}>{bs.icon}</div>
              <div>
                <div style={{ color:'rgba(255,255,255,0.9)', fontSize:13.5, fontWeight:700 }}>DASIG Consortium</div>
                <div style={{ color:'rgba(255,255,255,0.4)', fontSize:12.5 }}>Published {fmtDate(a.date)} · Region VII, Philippines</div>
              </div>
              <div style={{ marginLeft:'auto', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:10, padding:'6px 14px', fontSize:12, color:'rgba(255,255,255,0.45)', fontWeight:600 }}>📖 {readTime(a.content)}</div>
            </div>

            {/* Excerpt / lead */}
            {a.excerpt && (
              <div style={{ borderLeft:'3px solid #f97316', paddingLeft:18, marginBottom:24, background:'rgba(249,115,22,0.06)', borderRadius:'0 12px 12px 0', padding:'14px 18px', borderLeftWidth:3, borderLeftColor:'#f97316', borderLeftStyle:'solid' }}>
                <p style={{ margin:0, fontSize:15.5, color:'rgba(255,255,255,0.88)', fontWeight:600, lineHeight:1.7, fontStyle:'italic' }}>{a.excerpt}</p>
              </div>
            )}

            {/* Article body */}
            <div style={{ paddingBottom:8 }}>{renderContent(a.content)}</div>
            {!a.content && <p style={{ color:'rgba(255,255,255,0.25)', fontStyle:'italic', fontSize:14 }}>No full content available for this article.</p>}
          </div>

          {/* Footer */}
          <div style={{ padding:'16px 30px 24px', borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontSize:12.5, color:'rgba(255,255,255,0.45)', fontWeight:600 }}>DASIG Portal · Region VII Consortium</div>
              <div style={{ fontSize:11.5, color:'rgba(255,255,255,0.25)', marginTop:2 }}>© 2026 All rights reserved</div>
            </div>
            <button onClick={onClose} style={{ background:'linear-gradient(90deg,#f97316,#e11d48)', color:'#fff', border:'none', borderRadius:12, padding:'11px 26px', fontSize:13.5, fontWeight:800, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 16px rgba(249,115,22,0.4)', transition:'opacity .15s' }}
              onMouseEnter={e=>e.currentTarget.style.opacity='.88'}
              onMouseLeave={e=>e.currentTarget.style.opacity='1'}
            >Close Article</button>
          </div>
        </div>
      </div>
    </div>
  );
}
