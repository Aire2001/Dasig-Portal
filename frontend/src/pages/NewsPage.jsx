import { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import ParticleBackground from '../components/ParticleBackground';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';

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

// Clean, enterprise styling without exaggerated bouncy animations
const CSS = `
  .news-card-hover {
    transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
  }
  .news-card-hover:hover {
    transform: translateY(-3px);
    border-color: rgba(249,115,22,0.45) !important;
    box-shadow: 0 14px 36px rgba(0,0,0,0.55);
  }
  .filter-pill {
    border-radius: 9px;
    padding: 7px 14px;
    font-size: 12.5px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.12s ease;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .action-btn-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 9px;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 700;
    color: rgba(255,255,255,0.85);
    cursor: pointer;
    font-family: inherit;
    transition: all 0.12s ease;
  }
  .action-btn-pill:hover {
    background: rgba(249,115,22,0.2);
    border-color: rgba(249,115,22,0.4);
    color: #f97316;
  }
`;

export default function NewsPage() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('All');
  const [search, setSearch]     = useState('');
  const [selected, setSelected] = useState(null);
  const [minimized, setMinimized] = useState(false);
  const [bookmarks, setBookmarks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dasig_bookmarked_news') || '[]'); } catch { return []; }
  });

  function toggleBookmark(id) {
    setBookmarks(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem('dasig_bookmarked_news', JSON.stringify(next));
      return next;
    });
  }

  function load(f = filter, s = search) {
    setLoading(true);
    const params = {};
    if (f && f !== 'All' && f !== 'Bookmarks') params.badge = f;
    if (s && s.trim()) params.search = s.trim();
    api.news.list(params).then(res => {
      const list = Array.isArray(res) ? res : (res?.data || []);
      setArticles(list);
      
      // Auto-open specific article if linked via URL query param (?id=... or ?title=...)
      const targetId = searchParams.get('id');
      const targetTitle = searchParams.get('title');
      if (targetId) {
        const found = list.find(x => String(x.id) === String(targetId));
        if (found) { setSelected(found); setMinimized(false); }
      } else if (targetTitle) {
        const decoded = decodeURIComponent(targetTitle).toLowerCase();
        const found = list.find(x => x.title?.toLowerCase() === decoded || x.title?.toLowerCase().includes(decoded));
        if (found) { setSelected(found); setMinimized(false); }
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }

  useEffect(() => {
    const timer = setTimeout(() => { load(filter, search); }, 200);
    return () => clearTimeout(timer);
  }, [filter, search]);

  function openArticle(a) {
    if (a.locked) { navigate(user ? '/membership' : '/login'); return; }
    setSelected(a);
    setMinimized(false);
    setSearchParams({ id: a.id }, { replace: true });
  }

  const displayedArticles = filter === 'Bookmarks'
    ? articles.filter(a => bookmarks.includes(a.id))
    : articles;

  const featured = displayedArticles[0];
  const rest = displayedArticles.slice(1);

  // Category counts
  const counts = {
    All: articles.length,
    Bookmarks: articles.filter(a => bookmarks.includes(a.id)).length,
  };
  BADGE_FILTERS.slice(1).forEach(b => {
    counts[b] = articles.filter(a => a.badge === b).length;
  });

  return (
    <div style={{ background:'linear-gradient(180deg,#000d30 0%,#020817 300px,#0f172a 100%)', minHeight:'100vh', position:'relative' }}>
      <ParticleBackground density={35} />
      <style>{CSS}</style>
      <div style={{ position:'relative', zIndex:1 }}>
        <PageHeader eyebrow="Consortium Publications" title="News & Press Releases" />

        {/* Full Modal Reader */}
        {selected && !minimized && (
          <ArticleReader
            article={selected}
            allArticles={articles}
            isBookmarked={bookmarks.includes(selected.id)}
            onToggleBookmark={() => toggleBookmark(selected.id)}
            onSelectArticle={a => { setSelected(a); setMinimized(false); setSearchParams({ id: a.id }, { replace: true }); }}
            onClose={() => { setSelected(null); setMinimized(false); setSearchParams({}, { replace: true }); }}
            onMinimize={() => setMinimized(true)}
          />
        )}

        {/* Minimized Floating Reader Dock */}
        {selected && minimized && (
          <div
            onClick={() => setMinimized(false)}
            style={{
              position: 'fixed', bottom: 24, left: 24, zIndex: 9000,
              background: '#070d1c', border: '1.5px solid rgba(249,115,22,0.45)',
              borderRadius: 14, padding: '10px 16px',
              boxShadow: '0 16px 40px rgba(0,0,0,0.85), 0 0 15px rgba(249,115,22,0.2)',
              display: 'flex', alignItems: 'center', gap: 12, maxWidth: 360,
              cursor: 'pointer', transition: 'all 0.15s ease',
            }}
          >
            <div style={{ width: 32, height: 32, borderRadius: 8, background: BADGE[selected.badge]?.accent || '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>
              {BADGE[selected.badge]?.icon || '📰'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 9.5, color: '#f97316', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.4px' }}>Reading in Background</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.title}</div>
            </div>
            <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
              <button onClick={(e) => { e.stopPropagation(); setMinimized(false); }} title="Restore article" style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 6, padding: '4px 7px', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>⤢</button>
              <button onClick={(e) => { e.stopPropagation(); setSelected(null); setMinimized(false); }} title="Close" style={{ background: 'rgba(225,29,72,0.2)', border: 'none', borderRadius: 6, padding: '4px 7px', color: '#f87171', fontSize: 12, fontWeight: 900, cursor: 'pointer' }}>✕</button>
            </div>
          </div>
        )}

        <section style={{ padding:'28px 24px 80px' }}>
          <div style={{ maxWidth:1160, margin:'0 auto' }}>

            {/* ── Filter bar & Search ── */}
            <div style={{
              background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)',
              borderRadius:16, padding:'12px 16px', marginBottom:28,
              display:'flex', alignItems:'center', gap:10, flexWrap:'wrap',
              backdropFilter:'blur(8px)',
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', flex:1 }}>
                {BADGE_FILTERS.map(f => (
                  <button key={f} className="filter-pill" onClick={() => setFilter(f)} style={{
                    background: filter === f ? 'linear-gradient(90deg,#f97316,#e11d48)' : 'rgba(255,255,255,0.06)',
                    color: filter === f ? '#fff' : 'rgba(255,255,255,0.65)',
                    border: `1px solid ${filter === f ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
                    boxShadow: filter === f ? '0 4px 12px rgba(249,115,22,0.35)' : 'none',
                  }}>
                    {f}
                    <span style={{
                      fontSize: 10,
                      background: filter === f ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.1)',
                      borderRadius: 10,
                      padding: '1px 6px',
                      fontWeight: 800,
                    }}>
                      {counts[f] || 0}
                    </span>
                  </button>
                ))}

                {/* Bookmarks Filter */}
                <button className="filter-pill" onClick={() => setFilter('Bookmarks')} style={{
                  background: filter === 'Bookmarks' ? 'linear-gradient(90deg,#f59e0b,#d97706)' : 'rgba(255,255,255,0.06)',
                  color: filter === 'Bookmarks' ? '#fff' : 'rgba(255,255,255,0.65)',
                  border: `1px solid ${filter === 'Bookmarks' ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
                }}>
                  🔖 Saved ({counts.Bookmarks})
                </button>
              </div>

              {/* Search input */}
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search press releases…"
                  style={{
                    background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.13)',
                    borderRadius:10, padding:'8px 14px', fontSize:13, color:'#fff',
                    fontFamily:'inherit', outline:'none', minWidth:210,
                  }}
                />
                {search && (
                  <button onClick={() => setSearch('')} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontSize:13 }}>✕</button>
                )}
                <button onClick={() => load(filter, search)} style={{
                  background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.14)',
                  borderRadius:10, padding:'8px 13px', color:'rgba(255,255,255,0.7)',
                  fontSize:13, cursor:'pointer', fontFamily:'inherit',
                }}>↻</button>
              </div>
            </div>

            {loading ? (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:20 }}>
                {[...Array(6)].map((_,i) => (
                  <div key={i} style={{ borderRadius:16, overflow:'hidden', background:'rgba(255,255,255,0.03)', height:300 }}>
                    <div style={{ height:170, background:'rgba(255,255,255,0.05)' }} />
                    <div style={{ padding:16 }}>
                      <div style={{ height:14, borderRadius:6, background:'rgba(255,255,255,0.06)', marginBottom:8 }} />
                      <div style={{ height:14, borderRadius:6, background:'rgba(255,255,255,0.04)', width:'70%' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : displayedArticles.length === 0 ? (
              <div style={{ textAlign:'center', padding:'80px 0' }}>
                <div style={{ fontSize:44, marginBottom:12 }}>📰</div>
                <div style={{ color:'rgba(255,255,255,0.65)', fontSize:16, fontWeight:700 }}>No articles found</div>
                <div style={{ color:'rgba(255,255,255,0.35)', fontSize:13, marginTop:5 }}>
                  {filter === 'Bookmarks' ? 'You have not bookmarked any articles yet.' : 'Try adjusting your search keywords or filter category.'}
                </div>
              </div>
            ) : (
              <>
                {/* ── Featured hero card ── */}
                {featured && filter === 'All' && (
                  <FeaturedCard article={featured} isBookmarked={bookmarks.includes(featured.id)} onToggleBookmark={() => toggleBookmark(featured.id)} onOpen={() => openArticle(featured)} />
                )}

                {/* ── Article grid ── */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:20, marginTop: filter === 'All' && featured ? 20 : 0 }}>
                  {(filter === 'All' ? rest : displayedArticles).map((a, i) => (
                    <NewsCard key={a.id} article={a} isBookmarked={bookmarks.includes(a.id)} onToggleBookmark={() => toggleBookmark(a.id)} onOpen={() => openArticle(a)} />
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
function FeaturedCard({ article: a, isBookmarked, onToggleBookmark, onOpen }) {
  const [imgOk, setImgOk] = useState(true);
  const bs = BADGE[a.badge] || B0;

  return (
    <div onClick={onOpen} className="news-card-hover"
      style={{
        borderRadius:18, overflow:'hidden', cursor:'pointer', position:'relative',
        background: '#070d1c',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        height:340,
      }}>
      {imgOk
        ? <img src={coverUrl(a)} alt={a.title} onError={() => setImgOk(false)}
            style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
        : <div style={{ width:'100%', height:'100%', background: bs.accent }} />
      }
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 40%, rgba(4,7,18,0.97) 100%)' }} />

      {/* FEATURED badge & bookmark */}
      <div style={{ position:'absolute', top:16, left:18, right:18, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ background:'linear-gradient(90deg,#f97316,#e11d48)', color:'#fff', borderRadius:6, padding:'4px 12px', fontSize:11, fontWeight:900, letterSpacing:'0.8px', textTransform:'uppercase' }}>★ Featured Publication</span>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleBookmark(); }}
          title={isBookmarked ? 'Remove bookmark' : 'Bookmark article'}
          style={{ background:'rgba(0,0,0,0.6)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'50%', width:34, height:34, color: isBookmarked ? '#f59e0b' : '#fff', fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
        >
          {isBookmarked ? '★' : '☆'}
        </button>
      </div>

      {/* Content bottom */}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'20px 24px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
          <span style={{ background: bs.bg, color: bs.color, border:`1px solid ${bs.border}`, borderRadius:6, padding:'3px 10px', fontSize:11.5, fontWeight:800 }}>{bs.icon} {a.badge}</span>
          <span style={{ color:'rgba(255,255,255,0.6)', fontSize:12, fontWeight:600 }}>{fmtDate(a.date)}</span>
          <span style={{ color:'rgba(255,255,255,0.35)', fontSize:11.5 }}>· {readTime(a.content)}</span>
        </div>
        <h2 style={{ color:'#fff', fontSize:21, fontWeight:900, lineHeight:1.35, margin:'0 0 8px', maxWidth:680 }}>{a.title}</h2>
        {a.excerpt && <p style={{ color:'rgba(255,255,255,0.65)', fontSize:13, lineHeight:1.6, margin:'0 0 10px', maxWidth:600, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{a.excerpt}</p>}
        <span style={{ color:'#f97316', fontSize:13, fontWeight:700, display:'flex', alignItems:'center', gap:4 }}>
          Read full press release <span style={{ fontSize:15 }}>→</span>
        </span>
      </div>
    </div>
  );
}

/* ── Regular news card ── */
function NewsCard({ article: a, isBookmarked, onToggleBookmark, onOpen }) {
  const [imgOk, setImgOk] = useState(true);
  const bs = BADGE[a.badge] || B0;

  return (
    <div onClick={onOpen} className="news-card-hover"
      style={{
        borderRadius:16, overflow:'hidden', cursor: a.locked ? 'default' : 'pointer',
        background:'rgba(8,13,26,0.96)',
        border:'1px solid rgba(255,255,255,0.07)',
        boxShadow:'0 4px 16px rgba(0,0,0,0.35)',
        display:'flex', flexDirection:'column',
        position: 'relative',
      }}>
      {/* Cover image */}
      <div style={{ position:'relative', height:185, overflow:'hidden', flexShrink:0 }}>
        {imgOk
          ? <img src={coverUrl(a)} alt={a.title} onError={() => setImgOk(false)}
              style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
          : <div style={{ width:'100%', height:'100%', background: bs.accent, display:'flex', alignItems:'center', justifyContent:'center', fontSize:48 }}>{bs.icon}</div>
        }
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, transparent 40%, rgba(8,13,26,0.9) 100%)', pointerEvents:'none' }} />

        {/* Badge pinned bottom-left */}
        <div style={{ position:'absolute', bottom:10, left:12, display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ background: bs.bg, color: bs.color, border:`1px solid ${bs.border}`, borderRadius:6, padding:'2.5px 9px', fontSize:11, fontWeight:800 }}>{bs.icon} {a.badge}</span>
        </div>

        {/* Bookmark toggle top-right */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleBookmark(); }}
          title={isBookmarked ? 'Remove bookmark' : 'Bookmark article'}
          style={{ position:'absolute', top:10, right:10, background:'rgba(0,0,0,0.6)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'50%', width:30, height:30, color: isBookmarked ? '#f59e0b' : '#fff', fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
        >
          {isBookmarked ? '★' : '☆'}
        </button>
      </div>

      {/* Card body */}
      <div style={{ padding:'14px 16px 16px', display:'flex', flexDirection:'column', flex:1 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:7 }}>
          <span style={{ color:'rgba(255,255,255,0.45)', fontSize:11.5 }}>{fmtDate(a.date)}</span>
          <span style={{ color:'rgba(255,255,255,0.25)', fontSize:11 }}>·</span>
          <span style={{ color:'rgba(255,255,255,0.45)', fontSize:11.5 }}>{readTime(a.content)}</span>
        </div>
        <h3 style={{ color:'#fff', fontSize:15, fontWeight:800, lineHeight:1.4, margin:'0 0 7px', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{a.title}</h3>
        {a.excerpt && <p style={{ color:'rgba(255,255,255,0.5)', fontSize:12.5, lineHeight:1.55, margin:'0 0 12px', flex:1, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{a.excerpt}</p>}

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:'auto', paddingTop:8, borderTop:'1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ color:'#f97316', fontSize:12, fontWeight:700 }}>Read more →</span>
        </div>
      </div>
    </div>
  );
}

/* ── Article reader modal ── */
function ArticleReader({ article: a, allArticles = [], isBookmarked, onToggleBookmark, onSelectArticle, onClose, onMinimize }) {
  const [imgOk, setImgOk] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const bs = BADGE[a.badge] || B0;

  // ESC key listener
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        if (isFullscreen) setIsFullscreen(false);
        else onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, onClose]);

  // Copy link
  function handleCopyLink() {
    const shareUrl = `${window.location.origin}/news?id=${a.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Official Print / Save PDF
  function handlePrintArticle() {
    const w = window.open('', '_blank', 'width=800,height=700');
    w.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <title>${a.title} - DASIG Official Release</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px auto; max-width: 720px; color: #1e293b; line-height: 1.7; }
          .header { border-bottom: 2px solid #001d5c; padding-bottom: 16px; margin-bottom: 24px; }
          .org { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; font-weight: 700; }
          .title { font-size: 24px; font-weight: 900; color: #001d5c; margin: 8px 0; }
          .meta { font-size: 12px; color: #64748b; margin-bottom: 20px; }
          .badge { display: inline-block; background: #e2e8f0; color: #0f172a; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 11px; margin-right: 8px; }
          .lead { font-size: 15px; font-style: italic; background: #f8fafc; border-left: 3px solid #f97316; padding: 12px 16px; margin-bottom: 20px; }
          .content { font-size: 14px; color: #334155; }
          .footer { margin-top: 40px; padding-top: 14px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
          @media print { body { margin: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="org">DASIG Consortium · Region VII Central Visayas Academic & Government Group</div>
          <h1 class="title">${a.title}</h1>
          <div class="meta">
            <span class="badge">${a.badge}</span> Published on ${fmtDate(a.date)} · DASIG Press Release
          </div>
        </div>
        ${a.excerpt ? `<div class="lead">${a.excerpt}</div>` : ''}
        <div class="content">
          ${(a.content || '').split('\n').filter(Boolean).map(p => `<p>${p}</p>`).join('')}
        </div>
        <div class="footer">
          Official Publication of Dynamic Academic and Scientific Information Group (DASIG) · Region VII, Philippines
        </div>
        <script>window.onload=function(){ window.print(); }<\/script>
      </body>
      </html>
    `);
    w.document.close();
  }

  const related = allArticles.filter(item => item.id !== a.id && item.badge === a.badge).slice(0, 2);

  function renderContent(text) {
    if (!text) return null;
    return text.split('\n').filter(l => l.trim()).map((line, i) => {
      const t = line.trim();
      if (/^\d+\./.test(t)) {
        const num = t.match(/^(\d+)\./)[1];
        const body = t.replace(/^\d+\.\s*/, '');
        return (
          <div key={i} style={{ display:'flex', gap:12, marginBottom:10, alignItems:'flex-start' }}>
            <span style={{ background: bs.accent, color:'#fff', borderRadius:'50%', width:24, height:24, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900, flexShrink:0, marginTop:2 }}>{num}</span>
            <p style={{ margin:0, fontSize:14.5, color:'rgba(255,255,255,0.78)', lineHeight:1.75 }}>{body}</p>
          </div>
        );
      }
      if (t.startsWith('- ') || t.startsWith('• ')) {
        return (
          <div key={i} style={{ display:'flex', gap:10, marginBottom:8, alignItems:'flex-start' }}>
            <span style={{ color:'#f97316', fontSize:14, flexShrink:0, lineHeight:1.6 }}>▸</span>
            <p style={{ margin:0, fontSize:14.5, color:'rgba(255,255,255,0.78)', lineHeight:1.75 }}>{t.replace(/^[-•]\s*/, '')}</p>
          </div>
        );
      }
      if (t.endsWith(':') && t.length < 70) {
        return <h4 key={i} style={{ color:'#fff', fontSize:15.5, fontWeight:800, margin: i > 0 ? '20px 0 8px' : '0 0 8px', letterSpacing:'-0.2px' }}>{t}</h4>;
      }
      return <p key={i} style={{ margin:'0 0 14px', fontSize:14.5, color:'rgba(255,255,255,0.75)', lineHeight:1.8 }}>{t}</p>;
    });
  }

  return (
    <div
      onClick={onClose}
      style={{
        position:'fixed', inset:0,
        background:'rgba(0,0,0,0.85)', zIndex:9100,
        display:'flex', alignItems:'center', justifyContent:'center',
        padding: isFullscreen ? 0 : 16,
        overflowY:'auto', backdropFilter:'blur(8px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background:'#070d1c',
          borderRadius: isFullscreen ? 0 : 20,
          maxWidth: isFullscreen ? '100vw' : 'min(760px, calc(100vw - 32px))',
          width: isFullscreen ? '100vw' : '100%',
          height: isFullscreen ? '100vh' : 'auto',
          maxHeight: isFullscreen ? '100vh' : '92vh',
          boxShadow: isFullscreen ? 'none' : '0 32px 80px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.08)',
          margin:'auto',
          display:'flex', flexDirection:'column',
          position:'relative', overflow:'hidden',
        }}
      >

        {/* ── Window Control Bar (Bookmark, Print, Share, Minimize, Fullscreen, Close) ── */}
        <div style={{
          position:'absolute', top:14, right:14, zIndex:30,
          display:'flex', alignItems:'center', gap:6,
        }}>
          {/* Bookmark Button */}
          <button
            onClick={onToggleBookmark}
            title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Press Release'}
            className="action-btn-pill"
            style={{ color: isBookmarked ? '#f59e0b' : '#fff' }}
          >
            {isBookmarked ? '★ Saved' : '☆ Save'}
          </button>

          {/* Share / Copy Link */}
          <button
            onClick={handleCopyLink}
            title="Copy article link"
            className="action-btn-pill"
          >
            {copied ? '✓ Copied' : '🔗 Share'}
          </button>

          {/* Print / Save PDF */}
          <button
            onClick={handlePrintArticle}
            title="Print or Save PDF"
            className="action-btn-pill"
          >
            🖨️ PDF
          </button>

          {/* Minimize button */}
          <button
            onClick={onMinimize}
            title="Minimize to dock"
            style={{
              background:'rgba(0,0,0,0.65)', border:'1px solid rgba(255,255,255,0.2)',
              borderRadius:'50%', width:34, height:34, color:'rgba(255,255,255,0.8)', fontSize:14, fontWeight:700,
              cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
            }}
          >
            —
          </button>

          {/* Fullscreen toggle button */}
          <button
            onClick={() => setIsFullscreen(f => !f)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen view'}
            style={{
              background:'rgba(0,0,0,0.65)', border:'1px solid rgba(255,255,255,0.2)',
              borderRadius:'50%', width:34, height:34, color:'#fff', fontSize:13, fontWeight:700,
              cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
            }}
          >
            {isFullscreen ? '❐' : '⤢'}
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            title="Close press release"
            style={{
              background:'rgba(0,0,0,0.65)', border:'1px solid rgba(255,255,255,0.2)',
              borderRadius:'50%', width:34, height:34, color:'#fff', fontSize:14, fontWeight:700,
              cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Hero image */}
        <div style={{ position:'relative', height: isFullscreen ? 300 : 240, flexShrink:0, overflow:'hidden' }}>
          {imgOk
            ? <img src={coverUrl(a)} alt={a.title} onError={() => setImgOk(false)}
                style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
            : <div style={{ width:'100%', height:'100%', background: bs.accent, display:'flex', alignItems:'center', justifyContent:'center', fontSize:64, opacity:0.35 }}>{bs.icon}</div>
          }
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(7,13,28,0.98) 100%)' }} />

          {/* Badge + meta over image */}
          <div style={{ position:'absolute', bottom:18, left: isFullscreen ? 'calc(50% - 430px)' : 24, right: isFullscreen ? 'calc(50% - 430px)' : 70, padding: isFullscreen ? '0 20px' : 0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
              <span style={{ background: bs.bg, color: bs.color, border:`1px solid ${bs.border}`, borderRadius:6, padding:'3px 10px', fontSize:11.5, fontWeight:800 }}>{bs.icon} {a.badge}</span>
              <span style={{ color:'rgba(255,255,255,0.6)', fontSize:12, fontWeight:600 }}>{fmtDate(a.date)}</span>
              <span style={{ color:'rgba(255,255,255,0.35)', fontSize:11.5 }}>· {readTime(a.content)}</span>
            </div>
            <h2 style={{ color:'#fff', fontSize: isFullscreen ? 24 : 19, fontWeight:900, lineHeight:1.35, margin:0 }}>{a.title}</h2>
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ overflowY:'auto', flex:1 }}>
          <div style={{ padding: isFullscreen ? '28px 24px 16px' : '20px 26px 10px', maxWidth: isFullscreen ? 860 : '100%', margin: isFullscreen ? '0 auto' : '0' }}>

            {/* Byline */}
            <div style={{ display:'flex', alignItems:'center', gap:10, paddingBottom:16, borderBottom:'1px solid rgba(255,255,255,0.07)', marginBottom:18 }}>
              <div style={{ width:36, height:36, borderRadius:'50%', background: bs.accent, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0 }}>{bs.icon}</div>
              <div>
                <div style={{ color:'rgba(255,255,255,0.9)', fontSize:13, fontWeight:700 }}>DASIG Secretariat & Editorial Board</div>
                <div style={{ color:'rgba(255,255,255,0.4)', fontSize:11.5 }}>Official Press Release · Region VII, Central Visayas, Philippines</div>
              </div>
              <div style={{ marginLeft:'auto', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'5px 11px', fontSize:11.5, color:'rgba(255,255,255,0.5)', fontWeight:600 }}>📖 {readTime(a.content)}</div>
            </div>

            {/* Excerpt / lead */}
            {a.excerpt && (
              <div style={{ borderLeft:'3px solid #f97316', paddingLeft:16, marginBottom:20, background:'rgba(249,115,22,0.06)', borderRadius:'0 10px 10px 0', padding:'12px 16px', borderLeftWidth:3, borderLeftColor:'#f97316', borderLeftStyle:'solid' }}>
                <p style={{ margin:0, fontSize:14.5, color:'rgba(255,255,255,0.85)', fontWeight:600, lineHeight:1.65, fontStyle:'italic' }}>{a.excerpt}</p>
              </div>
            )}

            {/* Article body */}
            <div style={{ paddingBottom:8 }}>{renderContent(a.content)}</div>
            {!a.content && <p style={{ color:'rgba(255,255,255,0.25)', fontStyle:'italic', fontSize:13.5 }}>No full text provided for this press release.</p>}

            {/* ── Related articles section ── */}
            {related.length > 0 && (
              <div style={{ marginTop: 28, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 12 }}>Related Publications</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                  {related.map(r => (
                    <div
                      key={r.id}
                      onClick={() => onSelectArticle(r)}
                      style={{
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 12, padding: '12px 14px', cursor: 'pointer',
                        transition: 'border-color 0.15s ease',
                      }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(249,115,22,0.4)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
                    >
                      <div style={{ fontSize: 10.5, color: '#f97316', fontWeight: 700, marginBottom: 4 }}>{r.badge} · {fmtDate(r.date)}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.title}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: isFullscreen ? '16px 24px 24px' : '14px 26px 20px', borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', justifyContent:'space-between', alignItems:'center', maxWidth: isFullscreen ? 860 : '100%', margin: isFullscreen ? '0 auto' : '0' }}>
            <div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', fontWeight:600 }}>DASIG Consortium Portal · Region VII</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.25)', marginTop:1 }}>Official Press & Public Release</div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button
                onClick={() => setIsFullscreen(f => !f)}
                style={{ background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.75)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, padding:'9px 14px', fontSize:12.5, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}
              >
                {isFullscreen ? '❐ Standard' : '⤢ Fullscreen'}
              </button>
              <button onClick={onClose} style={{ background:'linear-gradient(90deg,#f97316,#e11d48)', color:'#fff', border:'none', borderRadius:10, padding:'9px 20px', fontSize:13, fontWeight:800, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 3px 12px rgba(249,115,22,0.35)' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
