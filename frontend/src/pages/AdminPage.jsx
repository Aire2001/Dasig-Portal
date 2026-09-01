import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import ParticleBackground from '../components/ParticleBackground';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

/* ─── CSS ───────────────────────────────────────────────────────── */
const CSS = `
  * { box-sizing: border-box; }

  .ap-sidebar-link {
    display:flex; align-items:center; gap:10px;
    padding:9px 14px; border-radius:9px; width:100%;
    border:none; cursor:pointer; font-family:inherit;
    font-size:13px; font-weight:600; text-align:left;
    background:transparent; color:rgba(255,255,255,0.52);
    transition:all .16s;
  }
  .ap-sidebar-link:hover { background:rgba(255,255,255,0.07); color:rgba(255,255,255,0.88); }
  .ap-sidebar-link.active {
    background:rgba(249,115,22,0.14);
    color:#f97316;
    font-weight:800;
    box-shadow:inset 3px 0 0 #f97316;
  }

  .ap-input {
    width:100%; padding:9px 12px; border-radius:9px;
    border:1.5px solid rgba(255,255,255,0.11);
    background:rgba(255,255,255,0.05);
    color:#fff; font-size:13px; font-family:inherit;
    outline:none; transition:border-color .15s;
  }
  .ap-input:focus { border-color:#f97316; background:rgba(255,255,255,0.08); }
  .ap-input::placeholder { color:rgba(255,255,255,0.25); }

  .ap-row { transition:background .12s; }
  .ap-row:hover { background:rgba(255,255,255,0.035); }

  .ap-btn {
    border:none; border-radius:7px;
    padding:6px 13px; font-size:11.5px; font-weight:700;
    cursor:pointer; font-family:inherit; transition:all .14s;
    white-space:nowrap;
  }
  .ap-btn-primary { background:linear-gradient(90deg,#f97316,#e11d48); color:#fff; }
  .ap-btn-primary:hover { opacity:.88; }
  .ap-btn-blue  { background:rgba(59,130,246,.18); color:#93c5fd; }
  .ap-btn-blue:hover  { background:rgba(59,130,246,.32); }
  .ap-btn-red   { background:rgba(225,29,72,.15);  color:#fca5a5; }
  .ap-btn-red:hover   { background:rgba(225,29,72,.3); }
  .ap-btn-green { background:rgba(16,185,129,.15); color:#6ee7b7; }
  .ap-btn-green:hover { background:rgba(16,185,129,.3); }
  .ap-btn-amber { background:rgba(245,158,11,.15); color:#fcd34d; }
  .ap-btn-amber:hover { background:rgba(245,158,11,.3); }
  .ap-btn-ghost { background:rgba(255,255,255,.07); color:rgba(255,255,255,.6); border:1px solid rgba(255,255,255,.1); }
  .ap-btn-ghost:hover { background:rgba(255,255,255,.12); }

  .ap-badge {
    display:inline-block; border-radius:6px;
    padding:3px 9px; font-size:11px; font-weight:800;
    white-space:nowrap;
  }
  .ap-pill {
    display:inline-block; border-radius:99px;
    padding:3px 11px; font-size:11px; font-weight:800;
  }
`;

/* ─── Navigation config ─────────────────────────────────────────── */
const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { key:'dashboard', icon:'⊞', label:'Dashboard' },
      { key:'calendar',  icon:'📆', label:'Calendar'  },
    ],
  },
  {
    label: 'People',
    items: [
      { key:'users',        icon:'👥', label:'Users'        },
      { key:'applications', icon:'📋', label:'Applications' },
    ],
  },
  {
    label: 'Content',
    items: [
      { key:'events',    icon:'📅', label:'Events'    },
      { key:'news',      icon:'📰', label:'News'      },
      { key:'training',  icon:'🎓', label:'Training'  },
      { key:'policies',  icon:'📜', label:'Policies'  },
    ],
  },
  {
    label: 'Resources',
    items: [
      { key:'funding',      icon:'💰', label:'Funding'      },
      { key:'partnerships', icon:'🤝', label:'Partnerships' },
    ],
  },
  {
    label: 'Insights',
    items: [
      { key:'reports',  icon:'📈', label:'Reports'  },
      { key:'messages', icon:'📬', label:'Messages' },
    ],
  },
];

/* ─── Shared micro-components ────────────────────────────────────── */
function DInput({ label, name, value, onChange, type='text', as, opts, required, span }) {
  const cleanLabel = (label || '').replace(/\s*\*\s*$/, '');
  return (
    <div style={span ? { gridColumn: span } : {}}>
      {as !== 'checkbox' && (
        <label style={{ display:'block', fontSize:11.5, fontWeight:800, color:'rgba(255,255,255,0.65)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:6 }}>
          {cleanLabel}{required && <span style={{ color:'#f97316' }}> *</span>}
        </label>
      )}
      {as === 'select' ? (
        <select name={name} value={value} onChange={onChange} className="ap-input" style={{ cursor:'pointer' }}>
          {opts.map(o => <option key={o} value={o} style={{ background:'#0f172a' }}>{o}</option>)}
        </select>
      ) : as === 'textarea' ? (
        <textarea name={name} value={value} onChange={onChange} rows={3} className="ap-input" style={{ resize:'vertical' }} />
      ) : as === 'checkbox' ? (
        <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', paddingTop:6 }}>
          <input type="checkbox" name={name} checked={value} onChange={onChange}
            style={{ width:16, height:16, accentColor:'#f97316', cursor:'pointer' }} />
          <span style={{ fontSize:13, color:'rgba(255,255,255,0.75)', fontWeight:700 }}>{cleanLabel}</span>
        </label>
      ) : (
        <input type={type} name={name} value={value} onChange={onChange} className="ap-input" />
      )}
    </div>
  );
}

function Modal({ title, onClose, children, wide }) {
  const [isFull, setIsFull] = useState(false);
  const [isMin, setIsMin]   = useState(false);

  if (isMin) {
    return (
      <div style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 999999,
        background: 'rgba(13, 20, 36, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1.5px solid rgba(249,115,22,0.5)',
        borderRadius: 14, padding: '10px 16px',
        boxShadow: '0 16px 40px rgba(0,0,0,0.9), 0 0 20px rgba(249,115,22,0.25)',
        display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
      }}
      onClick={() => setIsMin(false)}
      >
        <span style={{ fontSize: 16 }}>📋</span>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ color: '#fff', fontWeight: 900, fontSize: 13 }}>{title}</span>
          <span style={{ fontSize: 10.5, color: '#fb923c', fontWeight: 700 }}>Minimized draft · Click to restore</span>
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          style={{
            background: 'rgba(255,255,255,0.08)', border: 'none',
            color: 'rgba(255,255,255,0.6)', width: 26, height: 26, borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, cursor: 'pointer', marginLeft: 6,
          }}
          title="Discard & Close"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(10px)', zIndex: 999999,
      display: 'flex', alignItems: isFull ? 'stretch' : 'center', justifyContent: 'center',
      padding: isFull ? 0 : '64px 20px 32px', overflowY: 'auto',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#0d1424', border: isFull ? 'none' : '1px solid rgba(255,255,255,0.14)',
        borderRadius: isFull ? 0 : 20, width: isFull ? '100vw' : '100%',
        maxWidth: isFull ? '100vw' : wide ? 700 : 540,
        boxShadow: isFull ? 'none' : '0 30px 90px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.06)',
        maxHeight: isFull ? '100vh' : 'calc(100vh - 90px)',
        height: isFull ? '100vh' : 'auto',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden', margin: 'auto',
      }}>
        {/* Titlebar */}
        <div style={{
          padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, background: '#090e1c', zIndex: 10, flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(249,115,22,0.18)', border: '1px solid rgba(249,115,22,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>📋</span>
            <h3 style={{ color: '#fff', fontWeight: 900, fontSize: 15, margin: 0, letterSpacing: '-0.3px' }}>{title}</h3>
          </div>
          
          {/* Top-Right Window Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Minimize */}
            <button
              type="button"
              onClick={() => setIsMin(true)}
              style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.7)', width: 32, height: 30, borderRadius: 7,
                fontSize: 14, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
              title="Minimize window"
            >
              —
            </button>
            {/* Fullscreen / Restore */}
            <button
              type="button"
              onClick={() => setIsFull(f => !f)}
              style={{
                background: isFull ? 'rgba(249,115,22,0.2)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${isFull ? 'rgba(249,115,22,0.4)' : 'rgba(255,255,255,0.12)'}`,
                color: isFull ? '#fb923c' : 'rgba(255,255,255,0.7)',
                width: 32, height: 30, borderRadius: 7,
                fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = isFull ? 'rgba(249,115,22,0.2)' : 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = isFull ? '#fb923c' : 'rgba(255,255,255,0.7)'; }}
              title={isFull ? 'Exit full screen (Restore)' : 'Full screen'}
            >
              {isFull ? '🗗' : '⛶'}
            </button>
            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(225,29,72,0.15)', border: '1px solid rgba(225,29,72,0.3)',
                color: '#f87171', width: 32, height: 30, borderRadius: 7,
                fontSize: 13, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(225,29,72,0.3)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(225,29,72,0.15)'; e.currentTarget.style.color = '#f87171'; }}
              title="Close dialog"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: isFull ? '28px 36px' : '20px 24px 24px', overflowY: 'auto', flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ msg, onConfirm, onCancel }) {
  return (
    <div onClick={onCancel} style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.78)', zIndex:9200,
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:24, animation:'fadeIn .16s ease',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background:'#0f1629', border:'1px solid rgba(225,29,72,0.25)',
        borderRadius:18, maxWidth:380, width:'100%', padding:'28px 26px',
        animation:'modalIn .2s ease', boxShadow:'0 30px 80px rgba(0,0,0,0.8)',
      }}>
        <div style={{ fontSize:36, textAlign:'center', marginBottom:14 }}>⚠️</div>
        <p style={{ color:'rgba(255,255,255,0.75)', fontSize:14, textAlign:'center', lineHeight:1.65, marginBottom:22 }}>{msg}</p>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onCancel} className="ap-btn ap-btn-ghost" style={{ flex:1, padding:'11px' }}>Cancel</button>
          <button onClick={onConfirm} className="ap-btn" style={{ flex:1, padding:'11px', background:'linear-gradient(90deg,#e11d48,#f97316)', color:'#fff' }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

function Toast({ msg, ok, sub }) {
  return (
    <div style={{
      position:'fixed', bottom:28, right:28,
      background: ok !== false
        ? 'linear-gradient(135deg,#065f46,#059669)'
        : 'linear-gradient(135deg,#9f1239,#e11d48)',
      color:'#fff', borderRadius:14, padding:'14px 16px',
      zIndex:9999, boxShadow:'0 12px 40px rgba(0,0,0,0.55)',
      animation:'toastIn .3s cubic-bezier(.34,1.56,.64,1)',
      display:'flex', alignItems:'flex-start', gap:12,
      minWidth:240, maxWidth:360,
      border: ok !== false ? '1px solid rgba(52,211,153,0.35)' : '1px solid rgba(252,165,165,0.3)',
    }}>
      <div style={{
        width:32, height:32, borderRadius:9, flexShrink:0,
        background:'rgba(255,255,255,0.18)',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:14, fontWeight:900,
      }}>
        {ok !== false ? '✓' : '✕'}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:800, fontSize:13.5, lineHeight:1.35 }}>{msg}</div>
        {sub && <div style={{ fontSize:12, opacity:0.75, marginTop:3, lineHeight:1.4 }}>{sub}</div>}
      </div>
    </div>
  );
}

function PageHeader({ title, desc, action }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 }}>
      <div>
        <h2 style={{ color:'#fff', fontWeight:900, fontSize:19, margin:'0 0 3px', letterSpacing:'-0.3px' }}>{title}</h2>
        {desc && <p style={{ color:'rgba(255,255,255,0.55)', fontSize:12.5, margin:0 }}>{desc}</p>}
      </div>
      {action}
    </div>
  );
}

function AddBtn({ label='+ Add New', onClick }) {
  return (
    <button onClick={onClick} className="ap-btn ap-btn-primary" style={{ padding:'9px 18px', fontSize:13, fontWeight:800, boxShadow:'0 4px 14px rgba(249,115,22,.3)' }}>
      {label}
    </button>
  );
}

function DataTable({ head, children, empty }) {
  return (
    <div style={{ borderRadius:14, border:'1px solid rgba(255,255,255,0.08)', overflow:'hidden' }}>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'rgba(255,255,255,0.04)' }}>
              {head.map(h => (
                <th key={h} style={{
                  padding:'10px 16px', fontSize:12, fontWeight:800,
                  color:'rgba(255,255,255,0.55)', textTransform:'uppercase',
                  letterSpacing:'.6px', textAlign:'left', whiteSpace:'nowrap',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>{children || empty}</tbody>
        </table>
      </div>
    </div>
  );
}

function TR({ children }) {
  return <tr className="ap-row" style={{ borderTop:'1px solid rgba(255,255,255,0.05)' }}>{children}</tr>;
}
function TD({ children, muted, w }) {
  return (
    <td style={{
      padding:'12px 16px', fontSize:13, verticalAlign:'middle',
      color: muted ? 'rgba(255,255,255,0.42)' : 'rgba(255,255,255,0.82)',
      width: w,
    }}>{children}</td>
  );
}
function EmptyTR({ cols }) {
  return (
    <tr><td colSpan={cols} style={{ textAlign:'center', padding:'48px 0', color:'rgba(255,255,255,0.28)', fontSize:14 }}>
      No records found.
    </td></tr>
  );
}
function Loading() {
  return (
    <div style={{ textAlign:'center', padding:'64px 0', color:'rgba(255,255,255,0.3)' }}>
      <div style={{ fontSize:28, marginBottom:10 }}>⏳</div>
      <div style={{ fontSize:13 }}>Loading…</div>
    </div>
  );
}

function SectionKPIs({ items }) {
  if (!items || !items.length) return null;
  return (
    <div style={{ display:'grid', gridTemplateColumns:`repeat(${items.length}, 1fr)`, gap:12, marginBottom:20 }}>
      {items.map((kpi, idx) => (
        <div key={idx} style={{
          background:'rgba(8,14,28,0.75)',
          backdropFilter:'blur(12px)',
          border:'1px solid rgba(255,255,255,0.08)',
          borderRadius:14, padding:'14px 16px',
          display:'flex', alignItems:'center', gap:12,
          boxShadow:'0 4px 16px rgba(0,0,0,0.25)',
        }}>
          <div style={{
            width:38, height:38, borderRadius:10,
            background: `${kpi.color || '#f97316'}15`,
            border: `1px solid ${kpi.color || '#f97316'}35`,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:18, flexShrink:0,
          }}>{kpi.icon}</div>
          <div>
            <div style={{ fontSize:20, fontWeight:900, color:'#fff', lineHeight:1 }}>{kpi.value}</div>
            <div style={{ fontSize:11.5, color:'rgba(255,255,255,0.45)', fontWeight:600, marginTop:3 }}>{kpi.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function FormActions({ onCancel, onSave, saving, saveLabel }) {
  return (
    <div style={{ display:'flex', gap:10, marginTop:20 }}>
      <button onClick={onCancel} className="ap-btn ap-btn-ghost" style={{ flex:1, padding:'11px' }}>Cancel</button>
      <button onClick={onSave} disabled={saving} className="ap-btn ap-btn-primary" style={{ flex:2, padding:'11px', fontSize:13 }}>
        {saving ? 'Saving…' : saveLabel}
      </button>
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────── */
const VALID_TABS = ['dashboard','calendar','users','applications','events','news','training','policies','funding','partnerships','reports','messages'];

export default function AdminPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [toast, setToast] = useState(null);

  const initialTab = VALID_TABS.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'dashboard';
  const [tab, setTabState] = useState(initialTab);

  function setTab(t) {
    setTabState(t);
    setSearchParams({ tab: t }, { replace: true });
  }

  // React to search param changes (e.g. clicking /admin?tab=events from Home or Command Palette)
  useEffect(() => {
    const urlTab = searchParams.get('tab');
    if (urlTab && VALID_TABS.includes(urlTab)) {
      setTabState(urlTab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'ADMIN') navigate('/');
  }, [user]);

  function showToast(msg, ok = true, sub = '') {
    setToast({ msg, ok, sub });
    setTimeout(() => setToast(null), 3000);
  }

  const initials = (user?.name || 'A').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh', background:'#060d1f', fontFamily:'inherit', position:'relative' }}>
      <ParticleBackground density={35} />
      <div style={{ position:'relative', zIndex:1, display:'flex', flexDirection:'column', flex:1 }}>
      <style>{CSS}</style>
      {toast && <Toast msg={toast.msg} ok={toast.ok} sub={toast.sub} />}

      {/* ── Top Bar ── */}
      <header style={{
        height:56, background:'#0b1221', borderBottom:'1px solid rgba(255,255,255,0.08)',
        display:'flex', alignItems:'center', padding:'0 20px', gap:16,
        position:'sticky', top:0, zIndex:100, flexShrink:0,
      }}>
        <button onClick={() => navigate('/')} style={{
          display:'flex', alignItems:'center', gap:8, background:'none', border:'none',
          cursor:'pointer', color:'rgba(255,255,255,0.55)', fontSize:13, fontWeight:600,
          fontFamily:'inherit', padding:'6px 10px', borderRadius:7,
          transition:'color .15s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#fff'}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}
        >
          ← Portal
        </button>
        <div style={{ width:1, height:24, background:'rgba(255,255,255,0.1)' }} />
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:28, height:28, borderRadius:8, background:'linear-gradient(135deg,#f97316,#e11d48)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:900, color:'#fff' }}>⚙</div>
          <span style={{ color:'#fff', fontWeight:800, fontSize:14 }}>Admin Panel</span>
          <span style={{ background:'rgba(225,29,72,0.18)', color:'#f87171', fontSize:12, fontWeight:800, borderRadius:5, padding:'2px 8px', border:'1px solid rgba(225,29,72,0.3)' }}>ADMIN</span>
        </div>
        <div style={{ flex:1 }} />
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ textAlign:'right', lineHeight:1.25 }}>
            <div style={{ fontSize:13, fontWeight:800, color:'#fff' }}>{user?.name || 'Admin'}</div>
            <div style={{ fontSize:11, color:'rgba(249,115,22,0.9)', fontWeight:700, marginTop:1 }}>
              🏛️ {user?.institution || 'Region VII Consortium'}{user?.campus ? ` · ${user.campus}` : ''}
            </div>
          </div>
          <div style={{ width:36, height:36, borderRadius:10, overflow:'hidden', flexShrink:0, border:'1.5px solid rgba(255,255,255,0.2)', boxShadow:'0 2px 8px rgba(0,0,0,0.3)' }}>
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
            ) : (
              <div style={{ width:'100%', height:'100%', background:'linear-gradient(135deg,#e11d48,#9f1239)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:900, color:'#fff' }}>
                {initials}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Body: Sidebar + Content ── */}
      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>

        {/* Sidebar */}
        <aside style={{
          width:220, background:'#0b1221', borderRight:'1px solid rgba(255,255,255,0.07)',
          padding:'16px 12px', display:'flex', flexDirection:'column',
          overflowY:'auto', flexShrink:0,
        }}>
          {NAV_GROUPS.map(g => (
            <div key={g.label} style={{ marginBottom:18 }}>
              <div style={{ fontSize:9.5, fontWeight:900, color:'rgba(255,255,255,0.25)', letterSpacing:'1.2px', textTransform:'uppercase', padding:'0 6px', marginBottom:4 }}>
                {g.label}
              </div>
              {g.items.map(it => (
                <button key={it.key} className={`ap-sidebar-link${tab === it.key ? ' active' : ''}`} onClick={() => setTab(it.key)}>
                  <span style={{ fontSize:14, lineHeight:1 }}>{it.icon}</span>
                  {it.label}
                </button>
              ))}
            </div>
          ))}
        </aside>

        {/* Content area */}
        <main style={{ flex:1, overflowY:'auto', padding:'28px 32px', background:'#060d1f' }}>
          {tab === 'dashboard'    && <DashboardTab showToast={showToast} setTab={setTab} />}
          {tab === 'calendar'     && <AdminCalendarTab showToast={showToast} setTab={setTab} />}
          {tab === 'users'        && <UsersTab showToast={showToast} />}
          {tab === 'applications' && <ApplicationsTab showToast={showToast} />}
          {tab === 'events'       && <EventsTab showToast={showToast} />}
          {tab === 'news'         && <NewsTab showToast={showToast} />}
          {tab === 'training'     && <TrainingTab showToast={showToast} />}
          {tab === 'policies'     && <PoliciesTab showToast={showToast} />}
          {tab === 'funding'      && <FundingTab showToast={showToast} />}
          {tab === 'partnerships' && <PartnershipsTab showToast={showToast} />}
          {tab === 'reports'      && <ReportsTab showToast={showToast} />}
          {tab === 'messages'     && <MessagesTab showToast={showToast} />}
        </main>
      </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   DASHBOARD (Executive Command Center)
═══════════════════════════════════════════════════════════════════ */
function DashboardTab({ showToast, setTab }) {
  const [stats, setStats]       = useState(null);
  const [renewals, setRenewals] = useState([]);
  const [events, setEvents]     = useState([]);

  useEffect(() => {
    api.admin.stats().then(setStats).catch(() => showToast('Failed to load stats', false));
    api.admin.renewals().then(r => setRenewals(r.data || [])).catch(() => {});
    api.events.list({ limit: 6 }).then(r => setEvents(Array.isArray(r) ? r : (r?.data || []))).catch(() => {});
  }, []);

  if (!stats) return <Loading />;

  const CARDS = [
    { label:'Total Users',        value:stats.users.total,          sub:`${stats.users.member} verified members`, icon:'👥', color:'#3b82f6', tab:'users',        tag:'Accounts' },
    { label:'Pending Apps',       value:stats.applications.pending, sub:stats.applications.pending > 0 ? 'Action required' : 'All reviewed', icon:'⏳', color:'#f59e0b', tab:'applications', tag: stats.applications.pending > 0 ? 'Urgent' : 'Clear' },
    { label:'Consortium Events',  value:stats.events.total,         sub:`${stats.events.totalEnrolled} participants`, icon:'📅', color:'#a855f7', tab:'events',        tag:'Live Summits' },
    { label:'Training Courses',   value:stats.trainings.total,      sub:`${stats.trainings.totalEnrolled} faculty enrolled`, icon:'🎓', color:'#f43f5e', tab:'training',     tag:'Capacity Dev' },
    { label:'News & Press',       value:stats.news.total,           sub:'published articles',                 icon:'📰', color:'#14b8a6', tab:'news',          tag:'Public Archive' },
    { label:'Partnerships',       value:stats.partnerships.active,  sub:`${stats.partnerships.total} total MOUs`,   icon:'🤝', color:'#8b5cf6', tab:'partnerships',  tag:'Active Alliances' },
    { label:'Funding & Grants',   value:stats.funding.open,         sub:`${stats.funding.total} listed calls`,      icon:'💰', color:'#10b981', tab:'funding',       tag:'DOST/CHED Calls' },
    { label:'Governance Policies',value:stats.policies.active,      sub:`${stats.policies.archived} archived`,      icon:'📜', color:'#0ea5e9', tab:'policies',      tag:'Active Charters' },
  ];

  const evFill    = stats.events.totalCapacity   > 0 ? Math.round(stats.events.totalEnrolled   / stats.events.totalCapacity   * 100) : 0;
  const trFill    = (stats.trainings.totalCapacity || (stats.trainings.total * 20)) > 0 ? Math.round(stats.trainings.totalEnrolled / (stats.trainings.totalCapacity || (stats.trainings.total * 20)) * 100) : 0;
  const memberPct = stats.users.total            > 0 ? Math.round(stats.users.member            / stats.users.total            * 100) : 0;

  const roleChartData = [
    { name: 'Members', value: stats.users.member, color: '#34d399' },
    { name: 'Guests',  value: stats.users.guest,  color: '#60a5fa' },
    { name: 'Admins',  value: stats.users.admin,  color: '#f87171' },
  ].filter(d => d.value > 0);

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto' }}>
      {/* ── Executive Header Banner ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 16, marginBottom: 24,
        background: 'linear-gradient(135deg,rgba(15,23,42,0.85),rgba(20,30,55,0.75))',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20, padding: '20px 24px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981', display: 'inline-block' }} />
            <span style={{ fontSize: 11.5, fontWeight: 800, color: '#34d399', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Region VII Central Node · Live PostgreSQL Sync
            </span>
          </div>
          <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 900, letterSpacing: '-0.8px', margin: 0 }}>
            Executive Command Dashboard
          </h1>
        </div>

        {/* Quick Action Buttons */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => setTab('events')}
            className="ap-btn ap-btn-primary"
            style={{ padding: '10px 18px', fontSize: 13, fontWeight: 800, borderRadius: 10 }}
          >
            + New Event
          </button>
          <button
            onClick={() => setTab('news')}
            className="ap-btn ap-btn-ghost"
            style={{ padding: '10px 18px', fontSize: 13, fontWeight: 700, borderRadius: 10 }}
          >
            + News Release
          </button>
          <button
            onClick={() => setTab('applications')}
            className="ap-btn"
            style={{
              padding: '10px 18px', fontSize: 13, fontWeight: 800, borderRadius: 10,
              background: stats.applications.pending > 0 ? 'rgba(245,158,11,0.22)' : 'rgba(255,255,255,0.06)',
              color: stats.applications.pending > 0 ? '#fbbf24' : 'rgba(255,255,255,0.85)',
              border: `1px solid ${stats.applications.pending > 0 ? 'rgba(245,158,11,0.45)' : 'rgba(255,255,255,0.12)'}`,
              boxShadow: stats.applications.pending > 0 ? '0 0 14px rgba(245,158,11,0.2)' : 'none'
            }}
          >
            📋 Review Apps ({stats.applications.pending})
          </button>
        </div>
      </div>

      {/* ── 8 KPI Bento Cards (4x2 Balanced Grid) ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:14, marginBottom:24 }}>
        {CARDS.map((c) => (
          <div
            key={c.label}
            onClick={() => setTab(c.tab)}
            style={{
              background: 'rgba(11, 19, 38, 0.85)',
              backdropFilter: 'blur(14px)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 18, padding: '18px 20px', cursor: 'pointer',
              position: 'relative', overflow: 'hidden',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              transition: 'all .2s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: '0 8px 20px rgba(0,0,0,0.25)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = `0 16px 36px rgba(0,0,0,0.5), 0 0 20px ${c.color}25`;
              e.currentTarget.style.borderColor = `${c.color}70`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.25)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
            }}
          >
            {/* Top accent gradient line */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 3,
              background: `linear-gradient(90deg, transparent, ${c.color}, transparent)`
            }} />

            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 12 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 11,
                  background: `${c.color}18`, border: `1px solid ${c.color}35`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, flexShrink: 0
                }}>
                  {c.icon}
                </div>
                <span style={{
                  fontSize: 10.5, fontWeight: 800, color: c.color,
                  background: `${c.color}14`, border: `1px solid ${c.color}30`,
                  borderRadius: 6, padding: '2px 8px', letterSpacing: '.4px'
                }}>
                  {c.tag}
                </span>
              </div>

              <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.8px', marginBottom: 4 }}>
                {c.value}
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: 'rgba(255,255,255,0.9)', marginBottom: 2 }}>
                {c.label}
              </div>
            </div>

            <div style={{
              fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600,
              borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 10, marginTop: 10
            }}>
              {c.sub}
            </div>
          </div>
        ))}
      </div>

      {/* ── Visual Analytics Grid (Donut & Fill Rate Progress) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* User Distribution Donut */}
        <div style={{
          background: 'rgba(11, 19, 38, 0.85)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20, padding: '22px', backdropFilter: 'blur(14px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
        }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '.6px' }}>
              👥 User &amp; Institutional Role Mix
            </div>
            <span style={{ fontSize: 11, color: '#60a5fa', background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.25)', borderRadius: 6, padding: '2px 8px', fontWeight: 800 }}>
              {stats.users.total} Total Accounts
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 160, height: 160, position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={roleChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={46} outerRadius={72} paddingAngle={4}>
                    {roleChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {roleChartData.map(r => (
                <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: 700 }}>{r.name}</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>
                        {r.value} <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 500, fontSize: 11.5 }}>({Math.round((r.value / stats.users.total) * 100)}%)</span>
                      </span>
                    </div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.round((r.value / stats.users.total) * 100)}%`, background: r.color, borderRadius: 4 }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Progress Fill Rates */}
        <div style={{
          background: 'rgba(11, 19, 38, 0.85)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20, padding: '22px', backdropFilter: 'blur(14px)',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
        }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '.6px' }}>
              📊 Consortium Capacity &amp; Engagement
            </div>
            <span style={{ fontSize: 11, color: '#34d399', background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: 6, padding: '2px 8px', fontWeight: 800 }}>
              Live Telemetry
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label:'Event Seat Utilization',    pct:evFill,    color:'#a855f7', count: `${stats.events.totalEnrolled} / ${stats.events.totalCapacity} seats` },
              { label:'Training Capacity Enrolled',pct:trFill,    color:'#f43f5e', count: `${stats.trainings.totalEnrolled} / ${stats.trainings.totalCapacity || 80} faculty` },
              { label:'Member Verification Ratio', pct:memberPct, color:'#3b82f6', count: `${stats.users.member} of ${stats.users.total} accounts` },
            ].map(b => (
              <div key={b.label} style={{ background:'rgba(255,255,255,0.035)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'12px 16px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7 }}>
                  <span style={{ fontSize:12.5, color:'rgba(255,255,255,0.8)', fontWeight:700 }}>{b.label}</span>
                  <span style={{ fontSize:13, fontWeight:900, color:'#fff' }}>
                    {Math.min(b.pct, 100)}% <span style={{ color:'rgba(255,255,255,0.45)', fontWeight:500, fontSize:11.5 }}>({b.count})</span>
                  </span>
                </div>
                <div style={{ height:7, background:'rgba(255,255,255,0.08)', borderRadius:4, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${Math.min(b.pct, 100)}%`, background:`linear-gradient(90deg,${b.color},${b.color}cc)`, borderRadius:4, transition:'width .8s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 🏛️ 7 Region VII Consortium Partner HEIs & Agencies Roster ── */}
      <div style={{
        background: 'rgba(11, 19, 38, 0.85)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 20, padding: '22px', backdropFilter: 'blur(14px)',
        marginBottom: 24, boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>🏛️</span>
            <div>
              <div style={{ color: '#fff', fontSize: 14, fontWeight: 900, letterSpacing: '-0.2px' }}>
                Region VII Academic Consortium Active Nodes
              </div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11.5 }}>
                Central Visayas Higher Education &amp; Research Alliances
              </div>
            </div>
          </div>
          <span style={{ fontSize: 11, color: '#fb923c', background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 6, padding: '3px 10px', fontWeight: 800 }}>
            7 Nodes Operational
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {[
            { name: 'CIT-University', role: 'Central Host Node · Engineering & Computing Hub', icon: '🦁', color: '#fb923c', status: 'Host Active' },
            { name: 'UP Visayas', role: 'Marine Science & Aquaculture Research Lead', icon: '🎓', color: '#ef4444', status: 'Connected' },
            { name: 'University of San Agustin', role: 'Institutional Governance, Ethics & Health', icon: '✝️', color: '#eab308', status: 'Connected' },
            { name: 'DOST Region VII', role: 'Science, Tech & R&D Research Grants', icon: '🔬', color: '#34d399', status: 'Connected' },
            { name: 'DICT Region VII', role: 'Digital Transformation & ICT Bootcamps', icon: '💻', color: '#60a5fa', status: 'Connected' },
            { name: 'DTI Region VII', role: 'Trade, MSME Incubation & Commercialization', icon: '💼', color: '#f87171', status: 'Connected' },
            { name: 'DepEd Region VII', role: 'Basic Education & STEM EdTech Pipeline', icon: '📚', color: '#38bdf8', status: 'Connected' },
          ].map(inst => (
            <div
              key={inst.name}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 14, padding: '12px 14px',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                transition: 'all .16s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.borderColor = 'rgba(249,115,22,0.3)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 18 }}>{inst.icon}</span>
                <span style={{
                  fontSize: 10, fontWeight: 800, color: inst.color,
                  background: `${inst.color}18`, border: `1px solid ${inst.color}35`,
                  borderRadius: 5, padding: '1px 6px'
                }}>
                  {inst.status}
                </span>
              </div>
              <div style={{ color: '#fff', fontSize: 13, fontWeight: 800, marginBottom: 2 }}>
                {inst.name}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, lineHeight: 1.4 }}>
                {inst.role}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── System Status Bar ── */}
      <div style={{
        background: 'rgba(11, 19, 38, 0.65)', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14, padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12, fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 24
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <span style={{ color: '#34d399', fontWeight: 800 }}>⚡ API Latency: 18ms</span>
          <span>·</span>
          <span style={{ color: '#fb923c', fontWeight: 800 }}>🦅 Haribon AI: 100% Accuracy (Online)</span>
          <span>·</span>
          <span style={{ color: '#60a5fa', fontWeight: 800 }}>🔒 Session Security: TLS 1.3 · RFC 6749</span>
        </div>
        <div style={{ fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>
          DASIG Regional Academic Consortium · Region VII
        </div>
      </div>

      {/* ── Upcoming Events Live Queue ── */}
      {events.length > 0 && (
        <div style={{
          background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 18, padding: '20px', backdropFilter: 'blur(12px)', marginBottom: 22,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 7 }}>
              <span>📅</span> Upcoming Consortium Events Queue
            </div>
            <button onClick={() => setTab('events')} style={{ background: 'none', border: 'none', color: '#f97316', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              Manage all events →
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
            {events.slice(0, 3).map(ev => (
              <div key={ev.id} style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 3 }}>{ev.title}</div>
                  <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)' }}>📍 {ev.venue} · {ev.date}</div>
                </div>
                <span className="ap-badge" style={{ background: 'rgba(168,85,247,0.18)', color: '#c084fc', flexShrink: 0 }}>
                  {ev.enrolled}/{ev.total}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Expiring Memberships Alert ── */}
      {renewals.length > 0 && (
        <div style={{ background:'rgba(245,158,11,0.07)', border:'1px solid rgba(245,158,11,0.22)', borderRadius:16, padding:'18px 20px' }}>
          <div style={{ fontSize:12.5, fontWeight:800, color:'#fbbf24', marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
            <span>⚠️</span> Memberships Expiring Soon
            <span style={{ background:'rgba(245,158,11,0.2)', borderRadius:99, padding:'1px 8px', fontSize:11.5 }}>{renewals.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {renewals.map(r => (
              <div key={r.id} style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'rgba(255,255,255,0.7)', padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                <span>{r.name} {r.institution ? `— ${r.institution}` : ''}</span>
                <span style={{ color:'#fcd34d', fontWeight:700 }}>Due {r.renewal_due}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   USERS
═══════════════════════════════════════════════════════════════════ */
const PAGE_SIZE = 15;

function UsersTab({ showToast }) {
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleF, setRoleF]   = useState('All');
  const [acting, setActing] = useState(null);
  const [page, setPage]     = useState(1);
  const [detailUser, setDetailUser] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    api.admin.users({ search, role: roleF })
      .then(r => { setUsers(r.data || []); setPage(1); })
      .catch(() => showToast('Failed to load users', false))
      .finally(() => setLoading(false));
  }, [search, roleF]);

  useEffect(() => { load(); }, [load]);

  async function changeRole(u, role) {
    setActing(u.id + 'r');
    try { await api.admin.changeRole(u.id, role); setUsers(p => p.map(x => x.id === u.id ? { ...x, role } : x)); showToast('Role updated successfully!', true, `${u.name || u.email} is now ${role}`); }
    catch (e) { showToast(e.message, false); } finally { setActing(null); }
  }

  async function toggleStatus(u) {
    setActing(u.id + 's');
    try {
      if (u.status === 'INACTIVE') {
        await api.admin.activate(u.id);
        setUsers(p => p.map(x => x.id === u.id ? { ...x, status: 'ACTIVE' } : x));
        if (detailUser && detailUser.id === u.id) setDetailUser(prev => ({ ...prev, status: 'ACTIVE' }));
        showToast('Account activated successfully!', true, `${u.name || u.email} can now log in`);
      } else {
        await api.admin.suspend(u.id);
        setUsers(p => p.map(x => x.id === u.id ? { ...x, status: 'INACTIVE' } : x));
        if (detailUser && detailUser.id === u.id) setDetailUser(prev => ({ ...prev, status: 'INACTIVE' }));
        showToast('Account suspended', false, `${u.name || u.email} has been suspended`);
      }
    } catch (e) { showToast(e.message, false); } finally { setActing(null); }
  }

  async function handleDeleteUser(u) {
    setActing(u.id + 'd');
    try {
      await api.admin.deleteUser(u.id);
      setUsers(p => p.filter(x => x.id !== u.id));
      if (detailUser && detailUser.id === u.id) setDetailUser(null);
      setDeleteConfirm(null);
      showToast('User deleted permanently', true, `${u.name || u.email} account has been deleted`);
    } catch (e) {
      showToast(e.message || 'Failed to delete user', false);
    } finally {
      setActing(null);
    }
  }

  function exportUsersCSV() {
    if (!users.length) return;
    const headers = ['Name','Email','Institution','Campus','Role','Status','Tier','Joined'];
    const rows = users.map(u => [
      u.name || u.email || '', u.email || '', u.institution || '', u.campus || '', u.role || '', u.status || '', u.tier || '', u.created_at?.slice(0,10) || ''
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'dasig_users_export.csv';
    a.click();
  }

  const ROLE_STYLE = {
    ADMIN:  { bg:'rgba(225,29,72,.18)',   color:'#fca5a5' },
    MEMBER: { bg:'rgba(16,185,129,.15)',  color:'#6ee7b7' },
    GUEST:  { bg:'rgba(255,255,255,.07)', color:'rgba(255,255,255,.45)' },
  };

  return (
    <div>
      {/* Delete User Confirmation Modal */}
      {deleteConfirm && (
        <Modal title="Delete User Account" onClose={() => setDeleteConfirm(null)}>
          <div style={{ display:'flex', flexDirection:'column', gap:16, textAlign:'center', padding:'10px 0' }}>
            <div style={{ fontSize:48 }}>⚠️</div>
            <div>
              <div style={{ color:'#fff', fontWeight:900, fontSize:18, marginBottom:6 }}>
                Delete user {deleteConfirm.name || deleteConfirm.email}?
              </div>
              <div style={{ color:'rgba(255,255,255,0.6)', fontSize:13.5, lineHeight:1.5 }}>
                Are you sure you want to permanently delete this user account (<span style={{ color:'#f87171', fontWeight:700 }}>{deleteConfirm.email}</span>)?
                <br />This will remove their registrations and cannot be undone.
              </div>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:12 }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="ap-btn ap-btn-ghost"
                style={{ flex:1, padding:'11px' }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(deleteConfirm)}
                disabled={acting === deleteConfirm.id + 'd'}
                className="ap-btn ap-btn-red"
                style={{ flex:1, padding:'11px', fontWeight:800 }}
              >
                {acting === deleteConfirm.id + 'd' ? '⏳ Deleting…' : '🗑 Permanently Delete'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* User Detail Modal */}
      {detailUser && (
        <Modal title="User Details & Management" onClose={() => setDetailUser(null)}>
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:14, padding:'4px 0' }}>
              <div style={{ width:56, height:56, borderRadius:16, overflow:'hidden', border:'2px solid rgba(255,255,255,0.2)', boxShadow:'0 4px 16px rgba(0,0,0,0.4)', flexShrink:0 }}>
                {detailUser.avatar_url ? (
                  <img src={detailUser.avatar_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                ) : (
                  <div style={{ width:'100%', height:'100%', background:'linear-gradient(135deg,#1e3a8a,#4f46e5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:900, color:'#fff' }}>
                    {((detailUser.name || detailUser.email) || 'U').split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()}
                  </div>
                )}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ color:'#fff', fontWeight:900, fontSize:17 }}>{detailUser.name || detailUser.email}</div>
                <div style={{ color:'rgba(255,255,255,0.5)', fontSize:13 }}>{detailUser.email}</div>
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {[
                { l:'Role', v:detailUser.role },
                { l:'Status', v:detailUser.status },
                { l:'Institution', v:detailUser.institution || '—' },
                { l:'Campus', v:detailUser.campus || '—' },
                { l:'Phone', v:detailUser.phone || '—' },
                { l:'Tier', v:detailUser.tier || '—' },
                { l:'Joined Date', v:detailUser.created_at?.slice(0,10) || '—' },
                { l:'Renewal Due', v:detailUser.renewal_due || '—' },
              ].map(r => (
                <div key={r.l} style={{ background:'rgba(255,255,255,0.04)', borderRadius:10, padding:'10px 12px', border:'1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize:10.5, fontWeight:800, color:'rgba(255,255,255,0.38)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:3 }}>{r.l}</div>
                  <div style={{ fontSize:13.5, color:'#fff', fontWeight:600 }}>{r.v}</div>
                </div>
              ))}
            </div>

            <div style={{ display:'flex', gap:10, marginTop:8, flexWrap:'wrap' }}>
              <button
                onClick={() => toggleStatus(detailUser)}
                className={`ap-btn ${detailUser.status === 'INACTIVE' ? 'ap-btn-green' : 'ap-btn-ghost'}`}
                style={{ flex:1, padding:'11px', fontSize:13 }}
              >
                {acting === detailUser.id + 's' ? '…' : detailUser.status === 'INACTIVE' ? 'Activate Account' : 'Suspend Account'}
              </button>
              <button
                onClick={() => { setDetailUser(null); setDeleteConfirm(detailUser); }}
                className="ap-btn ap-btn-red"
                style={{ flex:1, padding:'11px', fontSize:13 }}
              >
                🗑 Delete User
              </button>
              <button onClick={() => setDetailUser(null)} className="ap-btn ap-btn-ghost" style={{ padding:'11px 18px', fontSize:13 }}>
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      <PageHeader title="Users" desc="Manage roles, delete accounts, and view user details" action={
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <button onClick={exportUsersCSV} className="ap-btn ap-btn-ghost" style={{ fontSize:12.5, whiteSpace:'nowrap' }}>⬇ Export CSV</button>
          <input className="ap-input" placeholder="Search name, email, institution…" value={search} onChange={e => setSearch(e.target.value)} style={{ width:210 }} />
          <select className="ap-input" value={roleF} onChange={e => setRoleF(e.target.value)} style={{ width:110, cursor:'pointer' }}>
            {['All','ADMIN','MEMBER','GUEST'].map(r => <option key={r} value={r} style={{ background:'#0f172a' }}>{r}</option>)}
          </select>
        </div>
      } />

      <SectionKPIs items={[
        { label: 'Total Accounts', value: users.length, icon: '👥', color: '#60a5fa' },
        { label: 'Verified Members', value: users.filter(u => u.role === 'MEMBER').length, icon: '🎓', color: '#34d399' },
        { label: 'Administrators', value: users.filter(u => u.role === 'ADMIN').length, icon: '🛡️', color: '#f87171' },
        { label: 'Active Status', value: users.filter(u => u.status === 'ACTIVE').length, icon: '🟢', color: '#fbbf24' },
      ]} />

      {loading ? <Loading /> : (() => {
        const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE));
        const paged = users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
        return (<>
        <DataTable head={['User','Institution','Role','Status','Joined','Actions']}>
          {users.length === 0 ? <EmptyTR cols={6} /> : paged.map(u => {
            const rs = ROLE_STYLE[u.role] || ROLE_STYLE.GUEST;
            const displayName = u.name || u.email;
            return (
              <TR key={u.id}>
                <TD>
                  <div
                    onClick={() => setDetailUser(u)}
                    title="Click to view details"
                    style={{ display:'flex', alignItems:'center', gap:12, cursor:'pointer' }}
                  >
                    <div style={{ width:38, height:38, borderRadius:11, overflow:'hidden', flexShrink:0, border:'1.5px solid rgba(255,255,255,0.12)', boxShadow:'0 2px 8px rgba(0,0,0,0.25)' }}>
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                      ) : (
                        <div style={{
                          width:'100%', height:'100%',
                          background: u.role==='ADMIN' ? 'linear-gradient(135deg,#e11d48,#9f1239)' : u.role==='MEMBER' ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#1e3a8a,#3b82f6)',
                          display:'flex', alignItems:'center', justifyContent:'center', fontSize:12.5, fontWeight:900, color:'#fff'
                        }}>
                          {(displayName || 'U').split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight:800, color:'#fff', fontSize:13.5, display:'flex', alignItems:'center', gap:6 }}>
                        {displayName}
                        <span style={{ fontSize:10, color:'rgba(249,115,22,0.8)', fontWeight:700 }}>🔍</span>
                      </div>
                      <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)' }}>{u.email}</div>
                    </div>
                  </div>
                </TD>
                <TD muted>{u.institution || '—'}{u.campus ? `, ${u.campus}` : ''}</TD>
                <TD>
                  <select onChange={e => changeRole(u, e.target.value)} value={u.role} disabled={!!acting}
                    style={{ background:rs.bg, color:rs.color, border:`1px solid ${rs.color}44`, borderRadius:8, padding:'5px 10px', fontSize:12.5, fontWeight:800, cursor:'pointer', fontFamily:'inherit', outline:'none' }}>
                    {['ADMIN','MEMBER','GUEST'].map(r => <option key={r} value={r} style={{ background:'#0f172a' }}>{r}</option>)}
                  </select>
                </TD>
                <TD>
                  <span className="ap-pill" style={{ background: u.status === 'ACTIVE' ? 'rgba(16,185,129,.15)' : 'rgba(255,255,255,.06)', color: u.status === 'ACTIVE' ? '#6ee7b7' : 'rgba(255,255,255,.38)', border: `1px solid ${u.status === 'ACTIVE' ? 'rgba(16,185,129,.3)' : 'rgba(255,255,255,.1)'}` }}>
                    {u.status === 'ACTIVE' ? '● Active' : '● Inactive'}
                  </span>
                </TD>
                <TD muted>{u.created_at?.slice(0,10) || '—'}</TD>
                <TD>
                  <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                    <button
                      onClick={() => toggleStatus(u)}
                      disabled={!!acting}
                      className={`ap-btn ${u.status === 'INACTIVE' ? 'ap-btn-green' : 'ap-btn-ghost'}`}
                    >
                      {acting === u.id + 's' ? '…' : u.status === 'INACTIVE' ? 'Activate' : 'Suspend'}
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(u)}
                      disabled={acting === u.id + 'd'}
                      className="ap-btn ap-btn-red"
                      style={{ padding:'6px 11px', fontSize:13, borderRadius:8 }}
                      title="Delete user account"
                    >
                      🗑
                    </button>
                  </div>
                </TD>
              </TR>
            );
          })}
        </DataTable>
        {totalPages > 1 && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:16, flexWrap:'wrap', gap:8 }}>
            <span style={{ fontSize:12.5, color:'rgba(255,255,255,0.4)' }}>
              Showing {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE, users.length)} of {users.length} users
            </span>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1} className="ap-btn ap-btn-ghost" style={{ opacity:page===1?0.4:1 }}>← Prev</button>
              {Array.from({length:totalPages},(_,i)=>i+1).map(p => (
                <button key={p} onClick={() => setPage(p)} className={`ap-btn ${p===page?'ap-btn-primary':'ap-btn-ghost'}`} style={{ minWidth:34 }}>{p}</button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages} className="ap-btn ap-btn-ghost" style={{ opacity:page===totalPages?0.4:1 }}>Next →</button>
            </div>
          </div>
        )}
        </>);
      })()}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   APPLICATIONS
═══════════════════════════════════════════════════════════════════ */
function ApplicationsTab({ showToast }) {
  const [apps, setApps]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [acting, setActing]     = useState(null);
  const [statusF, setStatusF]   = useState('All');
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    api.membership.applications().then(setApps).catch(() => showToast('Failed', false)).finally(() => setLoading(false));
  }, []);

  async function approve(a) {
    setActing(a.id);
    try { await api.membership.approve(a.id); setApps(p => p.map(x => x.id === a.id ? { ...x, status:'APPROVED' } : x)); showToast('Application approved successfully!', true, `${a.name} is now a Member`); }
    catch (e) { showToast(e.message, false); } finally { setActing(null); }
  }

  async function confirmReject() {
    if (!rejectTarget) return;
    setActing(rejectTarget.id);
    try {
      await api.membership.reject(rejectTarget.id, rejectReason);
      setApps(p => p.map(x => x.id === rejectTarget.id ? { ...x, status:'REJECTED', rejection_reason: rejectReason } : x));
      showToast('Application rejected', false, `${rejectTarget.name}'s request was declined`);
    } catch (e) { showToast(e.message, false); }
    finally { setActing(null); setRejectTarget(null); setRejectReason(''); }
  }

  const STATUS = {
    PENDING:  { bg:'rgba(245,158,11,.18)',  color:'#fcd34d' },
    APPROVED: { bg:'rgba(16,185,129,.15)',  color:'#6ee7b7' },
    REJECTED: { bg:'rgba(225,29,72,.15)',   color:'#fca5a5' },
  };
  const filteredApps = apps.filter(a => statusF === 'All' || a.status === statusF);

  return (
    <div>
      {/* Rejection Modal */}
      {rejectTarget && (
        <Modal title="Reject Application" onClose={() => { setRejectTarget(null); setRejectReason(''); }}>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <p style={{ color:'rgba(255,255,255,0.75)', fontSize:13.5, margin:0, lineHeight:1.6 }}>
              Rejecting membership application for <strong style={{ color:'#fff' }}>{rejectTarget.name}</strong> ({rejectTarget.institution}). Optionally specify a reason:
            </p>
            <div>
              <label style={{ display:'block', fontSize:11.5, fontWeight:800, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:6 }}>Rejection Reason (Optional)</label>
              <textarea
                className="ap-input"
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="e.g., Incomplete institutional accreditation documents..."
                style={{ resize:'vertical' }}
              />
            </div>
            <div style={{ display:'flex', gap:10, marginTop:6 }}>
              <button onClick={() => { setRejectTarget(null); setRejectReason(''); }} className="ap-btn ap-btn-ghost" style={{ flex:1, padding:'11px' }}>Cancel</button>
              <button
                onClick={confirmReject}
                disabled={acting === rejectTarget.id}
                className="ap-btn"
                style={{ flex:2, padding:'11px', background:'linear-gradient(90deg,#e11d48,#be123c)', color:'#fff', fontWeight:800 }}
              >
                {acting === rejectTarget.id ? '…' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      <PageHeader
        title="Applications"
        desc="Approve or reject membership requests"
        action={
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:12, color:'rgba(255,255,255,0.4)', fontWeight:600 }}>Filter:</span>
            <select
              className="ap-input"
              value={statusF}
              onChange={e => setStatusF(e.target.value)}
              style={{ width:130, cursor:'pointer' }}
            >
              {['All','PENDING','APPROVED','REJECTED'].map(s => <option key={s} value={s} style={{ background:'#0f172a' }}>{s}</option>)}
            </select>
          </div>
        }
      />

      <SectionKPIs items={[
        { label: 'Pending Review', value: apps.filter(a => a.status === 'PENDING').length, icon: '⏳', color: '#fbbf24' },
        { label: 'Approved Tiers', value: apps.filter(a => a.status === 'APPROVED').length, icon: '✅', color: '#34d399' },
        { label: 'Declined', value: apps.filter(a => a.status === 'REJECTED').length, icon: '❌', color: '#f87171' },
        { label: 'Total Received', value: apps.length, icon: '📋', color: '#60a5fa' },
      ]} />
      {loading ? <Loading /> : (
        <DataTable head={['Applicant','Institution','Tier','Applied','Status','Actions']}>
          {filteredApps.length === 0 ? <EmptyTR cols={6} /> : filteredApps.map(a => {
            const s = STATUS[a.status] || STATUS.PENDING;
            return (
              <TR key={a.id}>
                <TD>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:34, height:34, borderRadius:9, background:'linear-gradient(135deg,#1e3a8a,#4f46e5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:900, color:'#fff', flexShrink:0 }}>
                      {(a.name || 'U').split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight:700, color:'#fff' }}>{a.name}</div>
                      <div style={{ fontSize:13, color:'rgba(255,255,255,0.55)' }}>{a.email}</div>
                    </div>
                  </div>
                </TD>
                <TD muted>{a.institution}{a.campus ? `, ${a.campus}` : ''}</TD>
                <TD><span className="ap-badge" style={{ background:'rgba(59,130,246,.18)', color:'#93c5fd' }}>{a.tier || 'Tier 2'}</span></TD>
                <TD muted>{a.applied_at?.slice(0,10)}</TD>
                <TD><span className="ap-pill" style={{ background:s.bg, color:s.color }}>{a.status}</span></TD>
                <TD>
                  {a.status === 'PENDING' ? (
                    <div style={{ display:'flex', gap:6 }}>
                      <button onClick={() => approve(a)} disabled={acting === a.id} className="ap-btn ap-btn-green">✓ Approve</button>
                      <button onClick={() => { setRejectTarget(a); setRejectReason(''); }} disabled={acting === a.id} className="ap-btn ap-btn-red">✕ Reject</button>
                    </div>
                  ) : <span style={{ fontSize:12, color:'rgba(255,255,255,0.28)' }}>Resolved</span>}
                </TD>
              </TR>
            );
          })}
        </DataTable>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   EVENTS
═══════════════════════════════════════════════════════════════════ */
const EV_BLANK = { title:'', date:'', venue:'', organizer:'', category:'Summit', total:50, description:'', registration_deadline:'', start_time:'', end_time:'' };

const EV_CAT_OPTIONS = [
  { value:'Summit',   icon:'🏛', color:'#818cf8', desc:'Annual consortium summit' },
  { value:'Workshop', icon:'🔬', color:'#34d399', desc:'Hands-on skill workshops' },
  { value:'Seminar',  icon:'📢', color:'#f9a8d4', desc:'Knowledge sharing seminars' },
  { value:'Funding',  icon:'💰', color:'#fcd34d', desc:'Scholarship & grant events' },
];

const TR_CAT_OPTIONS = [
  { value:'Technology',  icon:'💻', color:'#60a5fa', desc:'ICT & digital skills' },
  { value:'Research',    icon:'🔭', color:'#6ee7b7', desc:'Research methods & output' },
  { value:'Leadership',  icon:'🎯', color:'#fbbf24', desc:'Governance & leadership' },
  { value:'Governance',  icon:'📋', color:'#c4b5fd', desc:'Policy & administration' },
];

function CategoryDropdown({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const sel = options.find(o => o.value === value) || options[0];
  return (
    <div style={{ position:'relative' }}>
      <button type="button" onClick={() => setOpen(o => !o)} style={{ width:'100%', height:38, background: open?'rgba(255,255,255,0.1)':'rgba(255,255,255,0.05)', border:`1.5px solid ${open?'rgba(255,255,255,0.22)':'rgba(255,255,255,0.1)'}`, borderRadius:9, padding:'0 12px', cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:8, transition:'all .15s', color:'#fff' }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.background='rgba(255,255,255,0.08)'; }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background='rgba(255,255,255,0.05)'; }}
      >
        <div style={{ width:24, height:24, borderRadius:6, background:`${sel.color}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, flexShrink:0, border:`1px solid ${sel.color}40` }}>{sel.icon}</div>
        <span style={{ flex:1, textAlign:'left', fontSize:13, fontWeight:700 }}>{sel.value}</span>
        <span style={{ fontSize:9, color:'rgba(255,255,255,0.4)', transition:'transform .2s', transform: open?'rotate(180deg)':'none' }}>▼</span>
      </button>
      {open && (
        <div onClick={e => e.stopPropagation()} style={{ position:'absolute', top:42, left:0, zIndex:9999, width:220, background:'linear-gradient(180deg,#141e36,#0d1424)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, overflow:'hidden', boxShadow:'0 16px 48px rgba(0,0,0,0.7)' }}>
          {options.map((opt, idx) => {
            const isActive = value === opt.value;
            return (
              <button key={opt.value} type="button" onClick={() => { onChange(opt.value); setOpen(false); }} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'9px 12px', background: isActive?`${opt.color}18`:'transparent', border:'none', borderBottom: idx<options.length-1?'1px solid rgba(255,255,255,0.04)':'none', borderLeft:`3px solid ${isActive?opt.color:'transparent'}`, cursor:'pointer', fontFamily:'inherit', transition:'background .12s' }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background='rgba(255,255,255,0.05)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background='transparent'; }}
              >
                <div style={{ width:30, height:30, borderRadius:8, background: isActive?`${opt.color}20`:'rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0, border:`1px solid ${isActive?opt.color+'50':'rgba(255,255,255,0.07)'}` }}>{opt.icon}</div>
                <div style={{ flex:1, textAlign:'left' }}>
                  <div style={{ fontSize:13, fontWeight: isActive?800:600, color: isActive?'#fff':'rgba(255,255,255,0.75)' }}>{opt.value}</div>
                  <div style={{ fontSize:10.5, color:'rgba(255,255,255,0.35)', marginTop:1 }}>{opt.desc}</div>
                </div>
                {isActive && <span style={{ color: opt.color, fontSize:13, flexShrink:0 }}>✓</span>}
              </button>
            );
          })}
        </div>
      )}
      {open && <div onClick={() => setOpen(false)} style={{ position:'fixed', inset:0, zIndex:9998 }} />}
    </div>
  );
}

function EventsTab({ showToast }) {
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(null);
  const [form, setForm]           = useState(EV_BLANK);
  const [saving, setSaving]       = useState(false);
  const [confirm, setConfirm]     = useState(null);
  const [search, setSearch]       = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [attnEvent, setAttnEvent] = useState(null);   // event object for attendees modal
  const [attnList, setAttnList]   = useState([]);
  const [attnLoading, setAttnLoading] = useState(false);
  const [attnFilter, setAttnFilter] = useState('all');
  const [attnSearch, setAttnSearch] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    api.events.list({ limit: 1000 })
      .then(r => setItems(Array.isArray(r) ? r : (r?.data || [])))
      .catch(() => showToast('Failed to load events', false))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);
  const fc = e => setForm(p => ({ ...p, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  async function openAttendees(ev) {
    setAttnEvent(ev);
    setAttnLoading(true);
    setAttnList([]);
    setAttnFilter('all');
    setAttnSearch('');
    try {
      const data = await api.events.registrations(ev.id);
      setAttnList(data);
    } catch (e) { showToast(e.message, false); } finally { setAttnLoading(false); }
  }

  async function toggleAttendance(reg, attended) {
    try {
      await api.events.markAttendance(attnEvent.id, reg.user_id, attended);
      setAttnList(prev => prev.map(r => r.user_id === reg.user_id ? { ...r, attended } : r));
      showToast(attended ? 'Attendance marked successfully!' : 'Marked as absent', attended, reg.users?.name);
    } catch (e) { showToast(e.message, false); }
  }

  async function reloadAttendees(ev) {
    setAttnLoading(true);
    try { setAttnList(await api.events.registrations(ev.id)); }
    catch (e) { showToast(e.message, false); }
    finally { setAttnLoading(false); }
  }

  async function save() {
    if (!form.title || !form.date || !form.venue || !form.organizer) { showToast('Please fill all required fields', false); return; }
    setSaving(true);
    try {
      const body = { ...form, total: Number(form.total) || 50 };
      if (modal === 'create') { await api.events.create(body); showToast('Event created successfully!', true, body.title); }
      else { await api.events.update(modal.id, body); showToast('Event updated successfully!', true, body.title); }
      setModal(null);
      load();
    } catch (e) { showToast(e.message, false); } finally { setSaving(false); }
  }

  async function del(id, title) {
    try { await api.events.delete(id); setItems(p => p.filter(x => x.id !== id)); showToast('Event deleted successfully!', true, title); setConfirm(null); }
    catch (e) { showToast(e.message, false); }
  }

  function exportEventsCSV() {
    if (!items.length) return;
    const headers = ['Title', 'Date', 'Category', 'Venue', 'Organizer', 'Enrolled', 'Total Capacity', 'Registration Deadline'];
    const rows = items.map(e => [
      e.title || '', e.date || '', e.category || '', e.venue || '', e.organizer || '', e.enrolled || 0, e.total || 0, e.registration_deadline || ''
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'dasig_events_export.csv';
    a.click();
  }

  const CAT = {
    Summit:   { bg:'rgba(168,85,247,0.18)', color:'#c084fc', border:'rgba(168,85,247,0.35)', icon:'🦁' },
    Workshop: { bg:'rgba(59,130,246,0.18)',  color:'#60a5fa', border:'rgba(59,130,246,0.35)',  icon:'🛠️' },
    Seminar:  { bg:'rgba(244,114,182,0.18)', color:'#f472b6', border:'rgba(244,114,182,0.35)', icon:'🎙️' },
    Funding:  { bg:'rgba(52,211,153,0.18)',  color:'#34d399', border:'rgba(52,211,153,0.35)',  icon:'💰' },
  };

  const filteredItems = items.filter(ev => {
    if (catFilter !== 'All' && ev.category !== catFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const title = (ev.title || '').toLowerCase();
      const venue = (ev.venue || '').toLowerCase();
      const org = (ev.organizer || '').toLowerCase();
      if (!title.includes(q) && !venue.includes(q) && !org.includes(q)) return false;
    }
    return true;
  });

  const totalEnrolled = items.reduce((sum, e) => sum + (e.enrolled || 0), 0);
  const totalCapacity = items.reduce((sum, e) => sum + (Number(e.total) || 0), 0);
  const avgFillRate = items.length ? Math.round(items.reduce((sum, e) => sum + (e.total > 0 ? (e.enrolled / e.total) * 100 : 0), 0) / items.length) : 0;

  // Filtered attendees list
  const filteredAttn = attnList.filter(r => {
    const role = (r.users?.role || 'GUEST').toUpperCase();
    if (attnFilter === 'MEMBER' && role !== 'MEMBER') return false;
    if (attnFilter === 'GUEST' && role !== 'GUEST') return false;
    if (attnFilter === 'attended' && !r.attended) return false;
    if (attnFilter === 'absent' && r.attended) return false;
    if (attnSearch.trim()) {
      const q = attnSearch.toLowerCase();
      const name = (r.users?.name || '').toLowerCase();
      const email = (r.users?.email || '').toLowerCase();
      const inst = (r.users?.institution || '').toLowerCase();
      if (!name.includes(q) && !email.includes(q) && !inst.includes(q)) return false;
    }
    return true;
  });

  const memberCount = attnList.filter(r => (r.users?.role || 'GUEST').toUpperCase() === 'MEMBER').length;
  const guestCount = attnList.filter(r => (r.users?.role || 'GUEST').toUpperCase() === 'GUEST').length;

  return (
    <div>
      <PageHeader
        title="Events"
        desc="Create, schedule, and oversee consortium summits, workshops, and seminars"
        action={
          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
            <button onClick={exportEventsCSV} className="ap-btn ap-btn-ghost" style={{ fontSize:12.5, whiteSpace:'nowrap' }}>⬇ Export CSV</button>
            <input
              className="ap-input"
              placeholder="Search title, venue, host…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width:210 }}
            />
            <select
              className="ap-input"
              value={catFilter}
              onChange={e => setCatFilter(e.target.value)}
              style={{ width:120, cursor:'pointer' }}
            >
              {['All','Summit','Workshop','Seminar','Funding'].map(c => (
                <option key={c} value={c} style={{ background:'#0f172a' }}>{c}</option>
              ))}
            </select>
            <button
              onClick={() => { setForm(EV_BLANK); setModal('create'); }}
              className="ap-btn ap-btn-primary"
              style={{ padding:'8px 16px', fontSize:13, fontWeight:800, whiteSpace:'nowrap' }}
            >
              + Create Event
            </button>
          </div>
        }
      />

      {confirm && <ConfirmModal msg={`Are you sure you want to delete event "${confirm.title}"?`} onConfirm={() => del(confirm.id, confirm.title)} onCancel={() => setConfirm(null)} />}

      {/* ── Attendees Modal ── */}
      {attnEvent && (
        <Modal title={`Attendance & Roster — ${attnEvent.title}`} onClose={() => { setAttnEvent(null); load(); }} wide>
          {/* Header Summary & Actions */}
          <div style={{ marginBottom:14, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                <span style={{ fontSize:14, fontWeight:800, color:'#fff' }}>
                  {attnList.filter(r => r.attended).length} Attended
                </span>
                <span style={{ fontSize:13, color:'rgba(255,255,255,0.45)' }}>
                  / {attnList.length} Total Registered
                </span>
                <span style={{ fontSize:11, background:'rgba(16,185,129,0.15)', color:'#34d399', border:'1px solid rgba(16,185,129,0.3)', borderRadius:6, padding:'2px 8px', fontWeight:800 }}>
                  👤 {memberCount} Members
                </span>
                <span style={{ fontSize:11, background:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.6)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:6, padding:'2px 8px', fontWeight:800 }}>
                  🌐 {guestCount} Guests
                </span>
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => {
                if (!attnList.length) return;
                const rows = [
                  ['Name','Email','Role','Institution','Attended','Registered At'],
                  ...attnList.map(r => [
                    r.users?.name || '', r.users?.email || '', (r.users?.role || 'GUEST').toUpperCase(), r.users?.institution || '',
                    r.attended ? 'Yes' : 'No',
                    r.created_at ? new Date(r.created_at).toLocaleDateString('en-PH') : '',
                  ])
                ];
                const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
                const a = document.createElement('a');
                a.href = URL.createObjectURL(new Blob([csv], { type:'text/csv' }));
                a.download = `${attnEvent.title.replace(/[^a-z0-9]/gi,'_')}_attendees.csv`;
                a.click();
              }} className="ap-btn ap-btn-green" style={{ fontSize:12 }}>⬇ Export CSV</button>
              <button onClick={() => reloadAttendees(attnEvent)} className="ap-btn ap-btn-ghost" style={{ fontSize:12.5 }}>↻ Refresh</button>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' }}>
            <input
              type="text"
              placeholder="🔍 Search attendee by name, email, institution..."
              value={attnSearch}
              onChange={e => setAttnSearch(e.target.value)}
              className="ap-input"
              style={{ flex:1, minWidth:200, fontSize:12.5 }}
            />
            <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
              {[
                { id:'all', label:`All (${attnList.length})` },
                { id:'MEMBER', label:`Members (${memberCount})` },
                { id:'GUEST', label:`Guests (${guestCount})` },
                { id:'attended', label:`Attended (${attnList.filter(r => r.attended).length})` },
                { id:'absent', label:`Absent (${attnList.filter(r => !r.attended).length})` },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setAttnFilter(f.id)}
                  style={{
                    background: attnFilter === f.id ? 'rgba(249,115,22,0.2)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${attnFilter === f.id ? 'rgba(249,115,22,0.45)' : 'rgba(255,255,255,0.1)'}`,
                    color: attnFilter === f.id ? '#fb923c' : 'rgba(255,255,255,0.7)',
                    borderRadius:8, padding:'5px 10px', fontSize:11.5, fontWeight:700,
                    cursor:'pointer', transition:'all .15s'
                  }}
                >{f.label}</button>
              ))}
            </div>
          </div>

          {attnLoading ? <Loading /> : filteredAttn.length === 0 ? (
            <div style={{ textAlign:'center', padding:'28px 0', color:'rgba(255,255,255,0.5)', fontSize:13 }}>
              {attnList.length === 0 ? 'No registrations yet' : 'No attendees match the selected filter'}
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:380, overflowY:'auto', paddingRight:4 }}>
              {filteredAttn.map(reg => {
                const userRole = (reg.users?.role || 'GUEST').toUpperCase();
                const isMember = userRole === 'MEMBER';
                const isAdmin = userRole === 'ADMIN';
                return (
                  <div key={reg.user_id} style={{
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    background:'rgba(255,255,255,0.04)', borderRadius:12,
                    padding:'10px 14px', border:'1px solid rgba(255,255,255,0.07)',
                    gap:12
                  }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{
                        width:36, height:36, borderRadius:10, overflow:'hidden',
                        background: isMember ? 'linear-gradient(135deg,#059669,#10b981)' : isAdmin ? 'linear-gradient(135deg,#e11d48,#f43f5e)' : 'linear-gradient(135deg,#475569,#64748b)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:12, fontWeight:900, color:'#fff', flexShrink:0
                      }}>
                        {reg.users?.avatar_url ? (
                          <img src={reg.users.avatar_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                        ) : (
                          (reg.users?.name || reg.users?.email || 'U').split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()
                        )}
                      </div>
                      <div>
                        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                          <span style={{ fontWeight:700, color:'#fff', fontSize:13.5 }}>{reg.users?.name || reg.users?.email || 'Unknown User'}</span>
                          {isMember ? (
                            <span style={{ background:'rgba(16,185,129,0.18)', color:'#34d399', border:'1px solid rgba(16,185,129,0.3)', borderRadius:5, padding:'1px 6px', fontSize:10, fontWeight:800 }}>👤 Member</span>
                          ) : isAdmin ? (
                            <span style={{ background:'rgba(225,29,72,0.18)', color:'#f43f5e', border:'1px solid rgba(225,29,72,0.3)', borderRadius:5, padding:'1px 6px', fontSize:10, fontWeight:800 }}>🛡️ Admin</span>
                          ) : (
                            <span style={{ background:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.6)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:5, padding:'1px 6px', fontSize:10, fontWeight:800 }}>🌐 Guest</span>
                          )}
                        </div>
                        <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginTop:2 }}>
                          {reg.users?.email} {reg.users?.institution ? `· ${reg.users?.institution}` : ''}
                        </div>
                      </div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                      {reg.attended
                        ? <span className="ap-badge" style={{ background:'rgba(16,185,129,0.18)', color:'#6ee7b7' }}>✓ Attended</span>
                        : <span className="ap-badge" style={{ background:'rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.45)' }}>Absent</span>
                      }
                      <button
                        onClick={() => toggleAttendance(reg, !reg.attended)}
                        className={`ap-btn ${reg.attended ? 'ap-btn-amber' : 'ap-btn-green'}`}
                        style={{ fontSize:12, padding:'5px 12px' }}
                      >{reg.attended ? 'Mark Absent' : 'Mark Attended'}</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div style={{ marginTop:16, textAlign:'right' }}>
            <button onClick={() => setAttnEvent(null)} className="ap-btn ap-btn-ghost">Close</button>
          </div>
        </Modal>
      )}

      {modal && (
        <Modal title={modal === 'create' ? 'Create Consortium Event' : 'Edit Consortium Event'} onClose={() => setModal(null)} wide>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <DInput label="Event Title" name="title" value={form.title} onChange={fc} required span="1/-1" />
            <DInput label="Event Date" name="date" value={form.date} onChange={fc} type="date" required />
            <DInput label="Registration Deadline" name="registration_deadline" value={form.registration_deadline} onChange={fc} type="date" />
            {/* Start / End Time */}
            <div>
              <label style={{ display:'block', fontSize:11.5, fontWeight:800, color:'rgba(255,255,255,0.65)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:6 }}>Start Time</label>
              <input type="time" name="start_time" value={form.start_time || ''} onChange={fc} className="ap-input" style={{ cursor:'pointer' }} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:11.5, fontWeight:800, color:'rgba(255,255,255,0.65)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:6 }}>End Time</label>
              <input type="time" name="end_time" value={form.end_time || ''} onChange={fc} className="ap-input" style={{ cursor:'pointer' }} />
            </div>
            <DInput label="Venue & Location" name="venue" value={form.venue} onChange={fc} required />
            <DInput label="Host Organizer" name="organizer" value={form.organizer} onChange={fc} required />
            {/* Custom Category Dropdown */}
            <div>
              <label style={{ display:'block', fontSize:11.5, fontWeight:800, color:'rgba(255,255,255,0.65)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:6 }}>Category</label>
              <CategoryDropdown value={form.category} onChange={val => setForm(p => ({ ...p, category: val }))} options={EV_CAT_OPTIONS} />
            </div>
            <DInput label="Total Capacity" name="total" value={form.total} onChange={fc} type="number" />
            <DInput label="Event Overview & Agenda" name="description" value={form.description} onChange={fc} as="textarea" span="1/-1" />
          </div>
          <FormActions onCancel={() => setModal(null)} onSave={save} saving={saving} saveLabel={modal === 'create' ? 'Create Event' : 'Save Changes'} />
        </Modal>
      )}

      <SectionKPIs items={[
        { label: 'Total Events', value: items.length, icon: '📅', color: '#a855f7' },
        { label: 'Total Enrolled', value: totalEnrolled, icon: '👥', color: '#34d399' },
        { label: 'Total Capacity', value: totalCapacity, icon: '💺', color: '#60a5fa' },
        { label: 'Avg Fill Rate', value: `${avgFillRate}%`, icon: '📊', color: '#fbbf24' },
      ]} />

      {loading ? <Loading /> : (
        <DataTable head={['Event','Date','Category','Fill Rate','Actions']}>
          {filteredItems.length === 0 ? <EmptyTR cols={5} /> : filteredItems.map(ev => {
            const fill = ev.total > 0 ? Math.round((ev.enrolled || 0) / ev.total * 100) : 0;
            const catInfo = CAT[ev.category] || { bg:'rgba(168,85,247,0.18)', color:'#c084fc', border:'rgba(168,85,247,0.35)', icon:'📅' };
            const isFull = fill >= 90;
            const isMid = fill >= 50 && fill < 90;
            const barGradient = isFull ? 'linear-gradient(90deg,#f43f5e,#fb7185)' : isMid ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : 'linear-gradient(90deg,#06b6d4,#3b82f6)';
            
            return (
              <TR key={ev.id}>
                <TD>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:38, height:38, borderRadius:11, background:catInfo.bg, border:`1px solid ${catInfo.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, flexShrink:0, boxShadow:'0 2px 8px rgba(0,0,0,0.2)' }}>
                      {catInfo.icon}
                    </div>
                    <div>
                      <div style={{ fontWeight:800, color:'#fff', fontSize:13.5 }}>{ev.title}</div>
                      <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginTop:2, display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                        <span>📍 {ev.venue}</span>
                        <span>·</span>
                        <span style={{ color:'rgba(249,115,22,0.85)', fontWeight:600 }}>🏛️ {ev.organizer}</span>
                      </div>
                    </div>
                  </div>
                </TD>
                <TD>
                  <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                    <span style={{ fontWeight:700, color:'#fff', fontSize:13 }}>📅 {ev.date}</span>
                    {ev.start_time && (
                      <span style={{ fontSize:11, color:'rgba(255,255,255,0.45)' }}>⏰ {ev.start_time}{ev.end_time ? ` – ${ev.end_time}` : ''}</span>
                    )}
                  </div>
                </TD>
                <TD>
                  <span className="ap-badge" style={{ background:catInfo.bg, color:catInfo.color, border:`1px solid ${catInfo.border}`, padding:'4px 10px', borderRadius:8, fontWeight:800, fontSize:12 }}>
                    {catInfo.icon} {ev.category}
                  </span>
                </TD>
                <TD>
                  <div style={{ minWidth:130 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                      <span style={{ fontSize:11, fontWeight:800, color: isFull ? '#f87171' : isMid ? '#fbbf24' : '#60a5fa' }}>
                        {fill}% Fill
                      </span>
                      <span style={{ fontSize:11.5, color:'rgba(255,255,255,0.55)', fontWeight:700 }}>
                        {ev.enrolled || 0} / {ev.total || 0}
                      </span>
                    </div>
                    <div style={{ height:6, background:'rgba(255,255,255,0.08)', borderRadius:4, overflow:'hidden', width:'100%' }}>
                      <div style={{ height:'100%', width:`${Math.min(fill,100)}%`, background:barGradient, borderRadius:4, transition:'width 0.3s ease' }} />
                    </div>
                  </div>
                </TD>
                <TD>
                  <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                    <button
                      onClick={() => openAttendees(ev)}
                      className="ap-btn ap-btn-ghost"
                      style={{ padding:'6px 11px', fontSize:12, borderRadius:8, color:'#34d399', borderColor:'rgba(52,211,153,0.3)', background:'rgba(16,185,129,0.08)' }}
                      title="View attendees list & mark attendance"
                    >
                      👥 Attendees ({ev.enrolled || 0})
                    </button>
                    <button
                      onClick={() => { setForm({ ...ev }); setModal(ev); }}
                      className="ap-btn ap-btn-blue"
                      style={{ padding:'6px 10px', fontSize:12, borderRadius:8 }}
                      title="Edit event details"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => setConfirm(ev)}
                      className="ap-btn ap-btn-red"
                      style={{ padding:'6px 10px', fontSize:12, borderRadius:8 }}
                      title="Delete event"
                    >
                      🗑
                    </button>
                  </div>
                </TD>
              </TR>
            );
          })}
        </DataTable>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   NEWS
═══════════════════════════════════════════════════════════════════ */
const NW_BLANK = { icon:'📣', badge:'Announcement', date:'', title:'', excerpt:'', content:'', members_only:false, archived:false, image_url:'' };

const BADGE_OPTIONS = [
  { value:'Announcement', icon:'📣', color:'#60a5fa', bg:'rgba(96,165,250,0.15)',  desc:'General announcements & updates' },
  { value:'Policy',       icon:'📋', color:'#fcd34d', bg:'rgba(252,211,77,0.15)',  desc:'Governance & policy documents' },
  { value:'Funding',      icon:'💰', color:'#6ee7b7', bg:'rgba(110,231,183,0.15)', desc:'Scholarships, grants & funds' },
  { value:'Training',     icon:'🎓', color:'#fca5a5', bg:'rgba(252,165,165,0.15)', desc:'Professional development programs' },
  { value:'Research',     icon:'🔬', color:'#c4b5fd', bg:'rgba(196,181,253,0.15)', desc:'Research initiatives & papers' },
];

function BadgeDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const selected = BADGE_OPTIONS.find(b => b.value === value) || BADGE_OPTIONS[0];
  return (
    <div style={{ position:'relative' }}>
      {/* Trigger */}
      <button type="button" onClick={() => setOpen(o => !o)} style={{
        width:'100%', height:40, background: open?'rgba(255,255,255,0.1)':'rgba(255,255,255,0.05)',
        border:`1.5px solid ${open?'rgba(255,255,255,0.25)':'rgba(255,255,255,0.11)'}`,
        borderRadius:9, padding:'0 12px', cursor:'pointer', fontFamily:'inherit',
        display:'flex', alignItems:'center', gap:9, transition:'all .15s',
      }}
      onMouseEnter={e => { if (!open) { e.currentTarget.style.background='rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.2)'; } }}
      onMouseLeave={e => { if (!open) { e.currentTarget.style.background='rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.11)'; } }}
      >
        <div style={{ width:26, height:26, borderRadius:7, background: selected.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, flexShrink:0, border:`1px solid ${selected.color}40` }}>{selected.icon}</div>
        <span style={{ flex:1, textAlign:'left', fontSize:13, fontWeight:700, color:'#fff' }}>{selected.value}</span>
        <span style={{ fontSize:9, color:'rgba(255,255,255,0.4)', transition:'transform .2s', transform: open?'rotate(180deg)':'rotate(0)', flexShrink:0 }}>▼</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div onClick={e => e.stopPropagation()} style={{
          position:'absolute', top:46, left:0, zIndex:9999, width:260,
          background:'linear-gradient(180deg,#141e36,#0d1424)',
          border:'1px solid rgba(255,255,255,0.1)', borderRadius:14, overflow:'hidden',
          boxShadow:'0 20px 56px rgba(0,0,0,0.75)',
        }}>
          {BADGE_OPTIONS.map((opt, idx) => {
            const isActive = value === opt.value;
            return (
              <button key={opt.value} type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                style={{
                  width:'100%', display:'flex', alignItems:'center', gap:11,
                  padding:'10px 14px',
                  background: isActive ? opt.bg : 'transparent',
                  border:'none', borderBottom: idx < BADGE_OPTIONS.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  borderLeft: `3px solid ${isActive ? opt.color : 'transparent'}`,
                  cursor:'pointer', fontFamily:'inherit', transition:'background .12s',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background='rgba(255,255,255,0.05)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background='transparent'; }}
              >
                <div style={{ width:34, height:34, borderRadius:9, background: isActive?opt.bg:'rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0, border:`1px solid ${isActive?opt.color+'50':'rgba(255,255,255,0.07)'}` }}>{opt.icon}</div>
                <div style={{ flex:1, textAlign:'left' }}>
                  <div style={{ fontSize:13.5, fontWeight: isActive?800:600, color: isActive?'#fff':'rgba(255,255,255,0.78)', lineHeight:1.2 }}>{opt.value}</div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.38)', marginTop:1.5 }}>{opt.desc}</div>
                </div>
                {isActive && <span style={{ fontSize:14, color: opt.color, flexShrink:0 }}>✓</span>}
              </button>
            );
          })}
        </div>
      )}
      {open && <div onClick={() => setOpen(false)} style={{ position:'fixed', inset:0, zIndex:9998 }} />}
    </div>
  );
}

// Compress uploaded news image to 1200×630 JPEG (Open Graph standard)
function compressNewsImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = e => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const W = 1200, H = 630;
        const canvas = document.createElement('canvas');
        canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext('2d');
        const scale = Math.max(W / img.width, H / img.height);
        const w = img.width * scale, h = img.height * scale;
        ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function NewsTab({ showToast }) {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null);
  const [form, setForm]         = useState(NW_BLANK);
  const [saving, setSaving]     = useState(false);
  const [confirm, setConfirm]   = useState(null);
  const [imgUploading, setImgUp] = useState(false);
  const [search, setSearch]     = useState('');
  const [badgeF, setBadgeF]     = useState('All');

  const load = useCallback(() => {
    setLoading(true);
    const params = { limit: 1000 };
    if (badgeF && badgeF !== 'All') params.badge = badgeF;
    if (search && search.trim()) params.search = search.trim();
    api.news.list(params)
      .then(r => setItems(Array.isArray(r) ? r : (r?.data || [])))
      .catch(() => showToast('Failed to load news articles', false))
      .finally(() => setLoading(false));
  }, [badgeF, search]);

  useEffect(() => {
    const timer = setTimeout(() => { load(); }, 150);
    return () => clearTimeout(timer);
  }, [load]);

  const fc = e => setForm(p => ({ ...p, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { showToast('Image must be under 10 MB', false); return; }
    if (!file.type.startsWith('image/')) { showToast('Please select an image file', false); return; }
    setImgUp(true);
    try {
      const dataUri = await compressNewsImage(file);
      setForm(p => ({ ...p, image_url: dataUri }));
      showToast('Image ready — save the article to publish', true, '');
    } catch { showToast('Image processing failed', false); }
    finally { setImgUp(false); }
  }

  async function save() {
    if (!form.title || !form.date) { showToast('Please fill all required fields', false); return; }
    setSaving(true);
    try {
      if (modal === 'create') { await api.news.create(form); showToast('Article published successfully!', true, form.title); }
      else { await api.news.update(modal.id, form); showToast('Article updated successfully!', true, form.title); }
      setModal(null);
      load();
    } catch (e) { showToast(e.message, false); } finally { setSaving(false); }
  }

  async function toggleArchive(n) {
    try {
      await api.news.archive(n.id, !n.archived);
      showToast(n.archived ? 'Article restored successfully!' : 'Article archived successfully', !n.archived, n.title);
      load();
    } catch (e) { showToast(e.message, false); }
  }

  async function del(id, title) {
    try { await api.news.delete(id); showToast('Article deleted successfully!', true, title); setConfirm(null); load(); }
    catch (e) { showToast(e.message, false); }
  }

  function exportNewsCSV() {
    if (!items.length) return;
    const headers = ['Title', 'Category', 'Date', 'Access', 'Status', 'Excerpt'];
    const rows = items.map(n => [
      n.title || '', n.badge || '', n.date ? String(n.date).slice(0,10) : '', n.members_only ? 'Members Only' : 'Public', n.archived ? 'Archived' : 'Active', n.excerpt || ''
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'dasig_news_export.csv';
    a.click();
  }

  const BC = {
    Announcement: { color:'#60a5fa', bg:'rgba(96,165,250,0.18)',  border:'rgba(96,165,250,0.35)',  icon:'📣' },
    Policy:       { color:'#fcd34d', bg:'rgba(252,211,77,0.18)',  border:'rgba(252,211,77,0.35)',  icon:'📋' },
    Funding:      { color:'#6ee7b7', bg:'rgba(110,231,183,0.18)', border:'rgba(110,231,183,0.35)', icon:'💰' },
    Training:     { color:'#fca5a5', bg:'rgba(252,165,165,0.18)', border:'rgba(252,165,165,0.35)', icon:'🎓' },
    Research:     { color:'#c4b5fd', bg:'rgba(196,181,253,0.18)', border:'rgba(196,181,253,0.35)', icon:'🔬' },
  };

  return (
    <div>
      <PageHeader
        title="News & Announcements"
        desc="Publish, edit, and archive consortium bulletins, policy updates, and press releases"
        action={
          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
            <button onClick={exportNewsCSV} className="ap-btn ap-btn-ghost" style={{ fontSize:12.5, whiteSpace:'nowrap' }}>⬇ Export CSV</button>
            <input
              className="ap-input"
              placeholder="Search title, excerpt…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width:180 }}
            />
            <select
              className="ap-input"
              value={badgeF}
              onChange={e => setBadgeF(e.target.value)}
              style={{ width:140, cursor:'pointer' }}
            >
              {['All','Announcement','Policy','Funding','Training','Research'].map(b => (
                <option key={b} value={b} style={{ background:'#0f172a' }}>{b}</option>
              ))}
            </select>
            <button
              onClick={() => { setForm(NW_BLANK); setModal('create'); }}
              className="ap-btn ap-btn-primary"
              style={{ padding:'8px 16px', fontSize:13, fontWeight:800, whiteSpace:'nowrap' }}
            >
              + Publish News
            </button>
          </div>
        }
      />

      {confirm && <ConfirmModal msg={`Are you sure you want to delete article "${confirm.title}"?`} onConfirm={() => del(confirm.id, confirm.title)} onCancel={() => setConfirm(null)} />}

      {modal && (
        <Modal title={modal === 'create' ? 'Publish News Article' : 'Edit News Article'} onClose={() => setModal(null)} wide>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <DInput label="Title" name="title" value={form.title} onChange={fc} required span="1/-1" />
            
            {/* Custom Badge Dropdown */}
            <div>
              <label style={{ display:'block', fontSize:11.5, fontWeight:800, color:'rgba(255,255,255,0.65)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:6 }}>
                Category / Badge <span style={{ color:'#f97316' }}>*</span>
              </label>
              <BadgeDropdown value={form.badge} onChange={val => {
                const bObj = BADGE_OPTIONS.find(b => b.value === val);
                setForm(p => ({ ...p, badge: val, icon: bObj?.icon || p.icon }));
              }} />
            </div>

            <DInput label="Publish Date" name="date" value={form.date} onChange={fc} type="date" required />

            <div style={{ gridColumn:'1/-1', background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, padding:'10px 14px' }}>
              <DInput label="Restricted Access" name="members_only" value={form.members_only} onChange={fc} as="checkbox" />
              <div style={{ fontSize:11.5, color:'rgba(255,255,255,0.4)', marginTop:2, marginLeft:24 }}>
                Only verified Consortium HEI members can access this article content.
              </div>
            </div>

            {/* ── Article cover image ── */}
            <div style={{ gridColumn:'1/-1' }}>
              <label style={{ display:'block', fontSize:11.5, fontWeight:800, color:'rgba(255,255,255,0.65)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:6 }}>
                Cover Image <span style={{ color:'rgba(255,255,255,0.3)', fontWeight:400, textTransform:'none' }}>(recommended: 1200×630px)</span>
              </label>
              {form.image_url ? (
                <div style={{ position:'relative', borderRadius:12, overflow:'hidden', marginBottom:8, border:'1px solid rgba(255,255,255,0.1)' }}>
                  <img src={form.image_url} alt="cover" style={{ width:'100%', height:180, objectFit:'cover', display:'block' }} />
                  <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(0,0,0,0.7) 100%)' }} />
                  <div style={{ position:'absolute', bottom:10, right:10, display:'flex', gap:8 }}>
                    <label htmlFor="news-img-replace" style={{ background:'rgba(255,255,255,0.18)', backdropFilter:'blur(6px)', color:'#fff', borderRadius:7, padding:'6px 12px', fontSize:12, fontWeight:700, cursor:'pointer', border:'1px solid rgba(255,255,255,0.3)' }}>
                      {imgUploading ? '⏳' : '📷 Replace'}
                    </label>
                    <button type="button" onClick={() => setForm(p => ({...p, image_url:''}))} style={{ background:'rgba(225,29,72,0.7)', color:'#fff', border:'none', borderRadius:7, padding:'6px 12px', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                      ✕ Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label htmlFor="news-img-upload" style={{
                  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                  gap:8, height:130, borderRadius:12, cursor:'pointer',
                  border:'2px dashed rgba(255,255,255,0.15)', background:'rgba(255,255,255,0.02)',
                  transition:'all .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(249,115,22,0.5)'; e.currentTarget.style.background='rgba(249,115,22,0.04)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.15)'; e.currentTarget.style.background='rgba(255,255,255,0.02)'; }}
                >
                  <span style={{ fontSize:28 }}>{imgUploading ? '⏳' : '🖼'}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.65)' }}>
                    {imgUploading ? 'Processing image…' : 'Click to upload cover photo'}
                  </span>
                  <span style={{ fontSize:12, color:'rgba(255,255,255,0.35)' }}>JPG, PNG, WebP — max 10 MB</span>
                </label>
              )}
              <input id="news-img-upload" type="file" accept="image/*" onChange={handleImageUpload} style={{ display:'none' }} />
              <input id="news-img-replace" type="file" accept="image/*" onChange={handleImageUpload} style={{ display:'none' }} />
            </div>

            <DInput label="Excerpt Summary" name="excerpt" value={form.excerpt} onChange={fc} as="textarea" span="1/-1" />
            <DInput label="Full Article Content" name="content" value={form.content} onChange={fc} as="textarea" span="1/-1" />
          </div>
          <FormActions onCancel={() => setModal(null)} onSave={save} saving={saving} saveLabel={modal === 'create' ? 'Publish Article' : 'Save Changes'} />
        </Modal>
      )}

      <SectionKPIs items={[
        { label: 'Published News', value: items.length, icon: '📰', color: '#10b981' },
        { label: 'Active Articles', value: items.filter(n => !n.archived).length, icon: '🟢', color: '#34d399' },
        { label: 'Members Only', value: items.filter(n => n.members_only).length, icon: '🔒', color: '#fbbf24' },
        { label: 'Archived', value: items.filter(n => n.archived).length, icon: '📦', color: '#94a3b8' },
      ]} />

      {loading ? <Loading /> : (
        <DataTable head={['Cover','Title','Badge','Date','Access','Status','Actions']}>
          {items.length === 0 ? <EmptyTR cols={7} /> : items.map(n => {
            const badgeInfo = BC[n.badge] || { color:'#60a5fa', bg:'rgba(96,165,250,0.18)', border:'rgba(96,165,250,0.35)', icon:'📰' };
            return (
              <TR key={n.id}>
                {/* Cover thumbnail */}
                <TD w={70}>
                  {n.image_url
                    ? <img src={n.image_url} alt="" style={{ width:54, height:36, objectFit:'cover', borderRadius:8, display:'block', border:'1px solid rgba(255,255,255,0.15)', boxShadow:'0 2px 8px rgba(0,0,0,0.3)' }} />
                    : <div style={{ width:54, height:36, borderRadius:8, background:badgeInfo.bg, border:`1px solid ${badgeInfo.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:17 }}>{badgeInfo.icon}</div>
                  }
                </TD>
                <TD>
                  <div style={{ fontWeight:800, color: n.archived ? 'rgba(255,255,255,0.38)' : '#fff', fontSize:13.5, maxWidth:260, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {n.title}
                  </div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginTop:2, maxWidth:260, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {n.excerpt || 'No summary excerpt provided'}
                  </div>
                </TD>
                <TD>
                  <span className="ap-badge" style={{ background:badgeInfo.bg, color:badgeInfo.color, border:`1px solid ${badgeInfo.border}`, padding:'4px 10px', borderRadius:8, fontWeight:800, fontSize:11.5 }}>
                    {badgeInfo.icon} {n.badge}
                  </span>
                </TD>
                <TD muted>{n.date ? `📅 ${String(n.date).slice(0,10)}` : '—'}</TD>
                <TD>
                  <span style={{ fontSize:12, fontWeight:700, color: n.members_only ? '#fcd34d' : 'rgba(255,255,255,0.5)' }}>
                    {n.members_only ? '🔒 Members' : '🌐 Public'}
                  </span>
                </TD>
                <TD>
                  <span className="ap-pill" style={{ background: n.archived ? 'rgba(255,255,255,0.06)' : 'rgba(16,185,129,0.15)', color: n.archived ? 'rgba(255,255,255,0.35)' : '#6ee7b7', border:`1px solid ${n.archived ? 'rgba(255,255,255,0.1)' : 'rgba(16,185,129,0.3)'}` }}>
                    {n.archived ? 'Archived' : '● Active'}
                  </span>
                </TD>
                <TD>
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={() => { setForm({ ...n }); setModal(n); }} className="ap-btn ap-btn-blue" style={{ padding:'6px 10px', fontSize:12, borderRadius:8 }}>
                      ✏️ Edit
                    </button>
                    <button onClick={() => toggleArchive(n)} className="ap-btn ap-btn-amber" style={{ padding:'6px 10px', fontSize:12, borderRadius:8 }}>
                      {n.archived ? 'Restore' : 'Archive'}
                    </button>
                    <button onClick={() => setConfirm(n)} className="ap-btn ap-btn-red" style={{ padding:'6px 10px', fontSize:12, borderRadius:8 }}>
                      🗑
                    </button>
                  </div>
                </TD>
              </TR>
            );
          })}
        </DataTable>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TRAINING
═══════════════════════════════════════════════════════════════════ */
const TR_BLANK = { icon:'💻', category:'Technology', title:'', org:'', duration:'2 weeks', level:'Beginner', total:20, description:'', schedule:'', session_start_time:'', session_end_time:'' };
const TR_DURATIONS = ['1 week','2 weeks','3 weeks','4 weeks','5 weeks','6 weeks','8 weeks','10 weeks','12 weeks','3 months','4 months','6 months'];

function TrainingTab({ showToast }) {
  const [items, setItems]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(null);
  const [form, setForm]             = useState(TR_BLANK);
  const [saving, setSaving]         = useState(false);
  const [confirm, setConfirm]       = useState(null);
  const [search, setSearch]         = useState('');
  const [catFilter, setCatFilter]   = useState('All');
  const [enrolEvent, setEnrolEvent] = useState(null);
  const [enrolList, setEnrolList]   = useState([]);
  const [enrolLoading, setEnrolLoading] = useState(false);
  const [enrolFilter, setEnrolFilter] = useState('all');
  const [enrolSearch, setEnrolSearch] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    api.training.list({ limit: 1000 })
      .then(r => setItems(Array.isArray(r) ? r : (r?.data || [])))
      .catch(() => showToast('Failed to load training programs', false))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);
  const fc = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  async function openEnrollments(t) {
    setEnrolEvent(t);
    setEnrolLoading(true);
    setEnrolList([]);
    setEnrolFilter('all');
    setEnrolSearch('');
    try { setEnrolList(await api.training.enrollments(t.id)); }
    catch (e) { showToast(e.message, false); }
    finally { setEnrolLoading(false); }
  }

  async function toggleAttendance(reg, attended) {
    try {
      await api.training.markAttendance(enrolEvent.id, reg.user_id, attended);
      setEnrolList(prev => prev.map(r => r.user_id === reg.user_id ? { ...r, attended } : r));
      showToast(attended ? 'Attendance marked successfully!' : 'Marked as absent', attended, reg.users?.name);
    } catch (e) { showToast(e.message, false); }
  }

  async function reloadEnrollments(t) {
    setEnrolLoading(true);
    try { setEnrolList(await api.training.enrollments(t.id)); }
    catch (e) { showToast(e.message, false); }
    finally { setEnrolLoading(false); }
  }

  async function save() {
    if (!form.title || !form.org || !form.duration) { showToast('Please fill all required fields', false); return; }
    setSaving(true);
    try {
      const body = { ...form, total: Number(form.total) || 20 };
      if (modal === 'create') { await api.training.create(body); showToast('Training program created successfully!', true, body.title); }
      else { await api.training.update(modal.id, body); showToast('Training program updated successfully!', true, body.title); }
      setModal(null);
      load();
    } catch (e) { showToast(e.message, false); } finally { setSaving(false); }
  }

  async function del(id, title) {
    try { await api.training.delete(id); setItems(p => p.filter(x => x.id !== id)); showToast('Training program deleted successfully!', true, title); setConfirm(null); }
    catch (e) { showToast(e.message, false); }
  }

  function exportTrainingCSV() {
    if (!items.length) return;
    const headers = ['Title', 'Category', 'Host Institution', 'Duration', 'Level', 'Enrolled', 'Total Capacity', 'Schedule'];
    const rows = items.map(t => [
      t.title || '', t.category || '', t.org || '', t.duration || '', t.level || '', t.enrolled || 0, t.total || 0, t.schedule || ''
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'dasig_training_export.csv';
    a.click();
  }

  const CC = {
    Technology: { color:'#60a5fa', bg:'rgba(96,165,250,0.18)',  border:'rgba(96,165,250,0.35)',  icon:'💻' },
    Research:   { color:'#6ee7b7', bg:'rgba(110,231,183,0.18)', border:'rgba(110,231,183,0.35)', icon:'🔬' },
    Leadership: { color:'#fcd34d', bg:'rgba(252,211,77,0.18)',  border:'rgba(252,211,77,0.35)',  icon:'🎯' },
    Governance: { color:'#c4b5fd', bg:'rgba(196,181,253,0.18)', border:'rgba(196,181,253,0.35)', icon:'📋' },
  };

  const LC = {
    Beginner:     { color:'#6ee7b7', bg:'rgba(110,231,183,0.15)', border:'rgba(110,231,183,0.3)' },
    Intermediate: { color:'#fcd34d', bg:'rgba(252,211,77,0.15)',  border:'rgba(252,211,77,0.3)' },
    Advanced:     { color:'#fca5a5', bg:'rgba(252,165,165,0.15)', border:'rgba(252,165,165,0.3)' },
  };

  const filteredItems = items.filter(t => {
    if (catFilter !== 'All' && t.category !== catFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const title = (t.title || '').toLowerCase();
      const org = (t.org || '').toLowerCase();
      if (!title.includes(q) && !org.includes(q)) return false;
    }
    return true;
  });

  const totalEnrolled = items.reduce((sum, t) => sum + (t.enrolled || 0), 0);
  const totalCapacity = items.reduce((sum, t) => sum + (Number(t.total) || 0), 0);
  const avgFillRate = items.length ? Math.round(items.reduce((sum, t) => sum + (t.total > 0 ? (t.enrolled / t.total) * 100 : 0), 0) / items.length) : 0;

  // Filtered enrollees
  const filteredEnrollees = enrolList.filter(en => {
    const role = (en.users?.role || 'GUEST').toUpperCase();
    if (enrolFilter === 'MEMBER' && role !== 'MEMBER') return false;
    if (enrolFilter === 'GUEST' && role !== 'GUEST') return false;
    if (enrolFilter === 'attended' && !en.attended) return false;
    if (enrolFilter === 'absent' && en.attended) return false;
    if (enrolSearch.trim()) {
      const q = enrolSearch.toLowerCase();
      const name = (en.users?.name || '').toLowerCase();
      const email = (en.users?.email || '').toLowerCase();
      const inst = (en.users?.institution || '').toLowerCase();
      if (!name.includes(q) && !email.includes(q) && !inst.includes(q)) return false;
    }
    return true;
  });

  const trMemberCount = enrolList.filter(e => (e.users?.role || 'GUEST').toUpperCase() === 'MEMBER').length;
  const trGuestCount = enrolList.filter(e => (e.users?.role || 'GUEST').toUpperCase() === 'GUEST').length;

  return (
    <div>
      <PageHeader
        title="Training Programs"
        desc="Offer, organize, and track consortium certifications and skill programs"
        action={
          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
            <button onClick={exportTrainingCSV} className="ap-btn ap-btn-ghost" style={{ fontSize:12.5, whiteSpace:'nowrap' }}>⬇ Export CSV</button>
            <input
              className="ap-input"
              placeholder="Search program, host…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width:190 }}
            />
            <select
              className="ap-input"
              value={catFilter}
              onChange={e => setCatFilter(e.target.value)}
              style={{ width:140, cursor:'pointer' }}
            >
              {['All','Technology','Research','Leadership','Governance'].map(c => (
                <option key={c} value={c} style={{ background:'#0f172a' }}>{c}</option>
              ))}
            </select>
            <button
              onClick={() => { setForm(TR_BLANK); setModal('create'); }}
              className="ap-btn ap-btn-primary"
              style={{ padding:'8px 16px', fontSize:13, fontWeight:800, whiteSpace:'nowrap' }}
            >
              + Create Program
            </button>
          </div>
        }
      />

      {confirm && <ConfirmModal msg={`Are you sure you want to delete training program "${confirm.title}"?`} onConfirm={() => del(confirm.id, confirm.title)} onCancel={() => setConfirm(null)} />}

      {/* Enrollments Modal */}
      {enrolEvent && (
        <Modal title={`Attendance & Roster — ${enrolEvent.title}`} onClose={() => { setEnrolEvent(null); load(); }} wide>
          {/* Header Summary & Actions */}
          <div style={{ marginBottom:14, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                <span style={{ fontSize:14, fontWeight:800, color:'#fff' }}>
                  {enrolList.filter(r => r.attended).length} Attended
                </span>
                <span style={{ fontSize:13, color:'rgba(255,255,255,0.45)' }}>
                  / {enrolList.length} Total Enrolled
                </span>
                <span style={{ fontSize:11, background:'rgba(16,185,129,0.15)', color:'#34d399', border:'1px solid rgba(16,185,129,0.3)', borderRadius:6, padding:'2px 8px', fontWeight:800 }}>
                  👤 {trMemberCount} Members
                </span>
                <span style={{ fontSize:11, background:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.6)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:6, padding:'2px 8px', fontWeight:800 }}>
                  🌐 {trGuestCount} Guests
                </span>
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => {
                if (!enrolList.length) return;
                const rows = [
                  ['Name','Email','Role','Institution','Attended','Enrolled At'],
                  ...enrolList.map(en => [
                    en.users?.name || '', en.users?.email || '', (en.users?.role || 'GUEST').toUpperCase(), en.users?.institution || '',
                    en.attended ? 'Yes' : 'No',
                    en.created_at ? new Date(en.created_at).toLocaleDateString('en-PH') : '',
                  ])
                ];
                const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
                const a = document.createElement('a');
                a.href = URL.createObjectURL(new Blob([csv], { type:'text/csv' }));
                a.download = `${enrolEvent.title.replace(/[^a-z0-9]/gi,'_')}_enrollees.csv`;
                a.click();
              }} className="ap-btn ap-btn-green" style={{ fontSize:12 }}>⬇ Export CSV</button>
              <button onClick={() => reloadEnrollments(enrolEvent)} className="ap-btn ap-btn-ghost" style={{ fontSize:12.5 }}>↻ Refresh</button>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' }}>
            <input
              type="text"
              placeholder="🔍 Search enrolled student by name, email, institution..."
              value={enrolSearch}
              onChange={e => setEnrolSearch(e.target.value)}
              className="ap-input"
              style={{ flex:1, minWidth:200, fontSize:12.5 }}
            />
            <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
              {[
                { id:'all', label:`All (${enrolList.length})` },
                { id:'MEMBER', label:`Members (${trMemberCount})` },
                { id:'GUEST', label:`Guests (${trGuestCount})` },
                { id:'attended', label:`Attended (${enrolList.filter(r => r.attended).length})` },
                { id:'absent', label:`Absent (${enrolList.filter(r => !r.attended).length})` },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setEnrolFilter(f.id)}
                  style={{
                    background: enrolFilter === f.id ? 'rgba(249,115,22,0.2)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${enrolFilter === f.id ? 'rgba(249,115,22,0.45)' : 'rgba(255,255,255,0.1)'}`,
                    color: enrolFilter === f.id ? '#fb923c' : 'rgba(255,255,255,0.7)',
                    borderRadius:8, padding:'5px 10px', fontSize:11.5, fontWeight:700,
                    cursor:'pointer', transition:'all .15s'
                  }}
                >{f.label}</button>
              ))}
            </div>
          </div>

          {enrolLoading ? <Loading /> : filteredEnrollees.length === 0 ? (
            <div style={{ textAlign:'center', padding:'28px 0', color:'rgba(255,255,255,0.5)', fontSize:13 }}>
              {enrolList.length === 0 ? 'No enrollments yet' : 'No enrollees match the selected filter'}
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:380, overflowY:'auto', paddingRight:4 }}>
              {filteredEnrollees.map(en => {
                const userRole = (en.users?.role || 'GUEST').toUpperCase();
                const isMember = userRole === 'MEMBER';
                const isAdmin = userRole === 'ADMIN';
                return (
                  <div key={en.id} style={{
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    background:'rgba(255,255,255,0.04)', borderRadius:12,
                    padding:'10px 14px', border:'1px solid rgba(255,255,255,0.07)',
                    gap:12
                  }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{
                        width:36, height:36, borderRadius:10, overflow:'hidden',
                        background: isMember ? 'linear-gradient(135deg,#059669,#10b981)' : isAdmin ? 'linear-gradient(135deg,#e11d48,#f43f5e)' : 'linear-gradient(135deg,#475569,#64748b)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:12, fontWeight:900, color:'#fff', flexShrink:0
                      }}>
                        {en.users?.avatar_url ? (
                          <img src={en.users.avatar_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                        ) : (
                          (en.users?.name || en.users?.email || 'U').split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()
                        )}
                      </div>
                      <div>
                        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                          <span style={{ fontWeight:700, color:'#fff', fontSize:13.5 }}>{en.users?.name || en.users?.email || 'Unknown User'}</span>
                          {isMember ? (
                            <span style={{ background:'rgba(16,185,129,0.18)', color:'#34d399', border:'1px solid rgba(16,185,129,0.3)', borderRadius:5, padding:'1px 6px', fontSize:10, fontWeight:800 }}>👤 Member</span>
                          ) : isAdmin ? (
                            <span style={{ background:'rgba(225,29,72,0.18)', color:'#f43f5e', border:'1px solid rgba(225,29,72,0.3)', borderRadius:5, padding:'1px 6px', fontSize:10, fontWeight:800 }}>🛡️ Admin</span>
                          ) : (
                            <span style={{ background:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.6)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:5, padding:'1px 6px', fontSize:10, fontWeight:800 }}>🌐 Guest</span>
                          )}
                        </div>
                        <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginTop:2 }}>
                          {en.users?.email} {en.users?.institution ? `· ${en.users?.institution}` : ''}
                        </div>
                      </div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                      {en.attended
                        ? <span className="ap-badge" style={{ background:'rgba(16,185,129,0.18)', color:'#6ee7b7' }}>✓ Attended</span>
                        : <span className="ap-badge" style={{ background:'rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.45)' }}>Absent</span>
                      }
                      <button
                        onClick={() => toggleAttendance(en, !en.attended)}
                        className={`ap-btn ${en.attended ? 'ap-btn-amber' : 'ap-btn-green'}`}
                        style={{ fontSize:12, padding:'5px 12px' }}
                      >{en.attended ? 'Mark Absent' : 'Mark Attended'}</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div style={{ marginTop:16, textAlign:'right' }}>
            <button onClick={() => { setEnrolEvent(null); load(); }} className="ap-btn ap-btn-ghost">Close</button>
          </div>
        </Modal>
      )}

      {modal && (
        <Modal title={modal === 'create' ? 'Create Training Program' : 'Edit Training Program'} onClose={() => setModal(null)} wide>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <DInput label="Program Title" name="title" value={form.title} onChange={fc} required span="1/-1" />
            <DInput label="Host Institution" name="org" value={form.org} onChange={fc} required />
            <DInput label="Program Duration" name="duration" value={form.duration} onChange={fc} as="select" opts={TR_DURATIONS} required />
            {/* Custom Category Dropdown */}
            <div>
              <label style={{ display:'block', fontSize:11.5, fontWeight:800, color:'rgba(255,255,255,0.65)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:6 }}>Category</label>
              <CategoryDropdown value={form.category} onChange={val => setForm(p => ({ ...p, category: val }))} options={TR_CAT_OPTIONS} />
            </div>
            <DInput label="Skill Level" name="level" value={form.level} onChange={fc} as="select" opts={['Beginner','Intermediate','Advanced']} />
            <DInput label="Enrollment Capacity" name="total" value={form.total} onChange={fc} type="number" />
            <DInput label="Start Date" name="schedule" value={form.schedule} onChange={fc} type="date" />
            <div />
            {/* Session Times */}
            <div>
              <label style={{ display:'block', fontSize:11.5, fontWeight:800, color:'rgba(255,255,255,0.65)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:6 }}>Session Start Time</label>
              <input type="time" name="session_start_time" value={form.session_start_time || ''} onChange={fc} className="ap-input" style={{ cursor:'pointer' }} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:11.5, fontWeight:800, color:'rgba(255,255,255,0.65)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:6 }}>Session End Time</label>
              <input type="time" name="session_end_time" value={form.session_end_time || ''} onChange={fc} className="ap-input" style={{ cursor:'pointer' }} />
            </div>
            <DInput label="Course Syllabus & Objectives" name="description" value={form.description} onChange={fc} as="textarea" span="1/-1" />
          </div>
          <FormActions onCancel={() => setModal(null)} onSave={save} saving={saving} saveLabel={modal === 'create' ? 'Create Program' : 'Save Changes'} />
        </Modal>
      )}

      <SectionKPIs items={[
        { label: 'Total Programs', value: items.length, icon: '🎓', color: '#f43f5e' },
        { label: 'Total Enrolled', value: totalEnrolled, icon: '👥', color: '#34d399' },
        { label: 'Total Capacity', value: totalCapacity, icon: '💺', color: '#60a5fa' },
        { label: 'Avg Fill Rate', value: `${avgFillRate}%`, icon: '📊', color: '#fbbf24' },
      ]} />

      {loading ? <Loading /> : (
        <DataTable head={['Program','Date & Duration','Category','Fill Rate','Actions']}>
          {filteredItems.length === 0 ? <EmptyTR cols={5} /> : filteredItems.map(t => {
            const fill = t.total > 0 ? Math.round((t.enrolled || 0) / t.total * 100) : 0;
            const cc = CC[t.category] || { color:'#60a5fa', bg:'rgba(96,165,250,0.18)', border:'rgba(96,165,250,0.35)', icon:'💻' };
            const lc = LC[t.level] || { color:'#6ee7b7', bg:'rgba(110,231,183,0.15)', border:'rgba(110,231,183,0.3)' };
            const isFull = fill >= 90;
            const isMid = fill >= 50 && fill < 90;
            const barGradient = isFull ? 'linear-gradient(90deg,#f43f5e,#fb7185)' : isMid ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : 'linear-gradient(90deg,#06b6d4,#3b82f6)';

            return (
              <TR key={t.id}>
                <TD>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:38, height:38, borderRadius:11, background:cc.bg, border:`1px solid ${cc.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, flexShrink:0, boxShadow:'0 2px 8px rgba(0,0,0,0.2)' }}>
                      {cc.icon}
                    </div>
                    <div>
                      <div style={{ fontWeight:800, color:'#fff', fontSize:13.5 }}>{t.title}</div>
                      <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginTop:2, display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                        <span>🏛️ {t.org}</span>
                        <span>·</span>
                        <span style={{ color:'rgba(249,115,22,0.85)', fontWeight:600 }}>⏱️ {t.duration}</span>
                      </div>
                    </div>
                  </div>
                </TD>
                <TD>
                  <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                    <span style={{ fontWeight:700, color:'#fff', fontSize:13 }}>📅 {t.schedule || 'Self-paced'}</span>
                    {t.session_start_time && (
                      <span style={{ fontSize:11, color:'rgba(255,255,255,0.45)' }}>⏰ {t.session_start_time}{t.session_end_time ? ` – ${t.session_end_time}` : ''}</span>
                    )}
                  </div>
                </TD>
                <TD>
                  <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                    <span className="ap-badge" style={{ background:cc.bg, color:cc.color, border:`1px solid ${cc.border}`, padding:'4px 10px', borderRadius:8, fontWeight:800, fontSize:12 }}>
                      {cc.icon} {t.category}
                    </span>
                    <span className="ap-badge" style={{ background:lc.bg, color:lc.color, border:`1px solid ${lc.border}`, padding:'3px 8px', borderRadius:7, fontWeight:800, fontSize:11 }}>
                      {t.level}
                    </span>
                  </div>
                </TD>
                <TD>
                  <div style={{ minWidth:130 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                      <span style={{ fontSize:11, fontWeight:800, color: isFull ? '#f87171' : isMid ? '#fbbf24' : '#60a5fa' }}>
                        {fill}% Fill
                      </span>
                      <span style={{ fontSize:11.5, color:'rgba(255,255,255,0.55)', fontWeight:700 }}>
                        {t.enrolled || 0} / {t.total || 0}
                      </span>
                    </div>
                    <div style={{ height:6, background:'rgba(255,255,255,0.08)', borderRadius:4, overflow:'hidden', width:'100%' }}>
                      <div style={{ height:'100%', width:`${Math.min(fill,100)}%`, background:barGradient, borderRadius:4, transition:'width 0.3s ease' }} />
                    </div>
                  </div>
                </TD>
                <TD>
                  <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                    <button
                      onClick={() => openEnrollments(t)}
                      className="ap-btn ap-btn-ghost"
                      style={{ padding:'6px 11px', fontSize:12, borderRadius:8, color:'#34d399', borderColor:'rgba(52,211,153,0.3)', background:'rgba(16,185,129,0.08)' }}
                      title="View attendees list & mark attendance"
                    >
                      👥 Attendees ({t.enrolled || 0})
                    </button>
                    <button
                      onClick={() => { setForm({ ...t }); setModal(t); }}
                      className="ap-btn ap-btn-blue"
                      style={{ padding:'6px 10px', fontSize:12, borderRadius:8 }}
                      title="Edit training program"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => setConfirm(t)}
                      className="ap-btn ap-btn-red"
                      style={{ padding:'6px 10px', fontSize:12, borderRadius:8 }}
                      title="Delete training program"
                    >
                      🗑
                    </button>
                  </div>
                </TD>
              </TR>
            );
          })}
        </DataTable>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   POLICIES
═══════════════════════════════════════════════════════════════════ */
const PL_BLANK = { title:'', category:'Membership', content:'', effective_date:'', members_only:false };

function PoliciesTab({ showToast }) {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null);
  const [form, setForm]       = useState(PL_BLANK);
  const [saving, setSaving]   = useState(false);
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(() => { setLoading(true); api.policies.list({ limit: 1000 }).then(r => setItems(Array.isArray(r) ? r : (r?.data || []))).catch(() => showToast('Failed', false)).finally(() => setLoading(false)); }, []);
  useEffect(load, [load]);
  const fc = e => setForm(p => ({ ...p, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  async function save() {
    if (!form.title || !form.content || !form.effective_date) { showToast('Fill required fields', false); return; }
    setSaving(true);
    try {
      if (modal === 'create') { await api.policies.create(form); showToast('Policy created successfully!', true, form.title); }
      else { await api.policies.update(modal.id, form); showToast('Policy updated successfully!', true, form.title); }
      setModal(null);
      load();
    } catch (e) { showToast(e.message, false); } finally { setSaving(false); }
  }
  async function toggleArchive(p) {
    try { await api.policies.archive(p.id, !p.archived); showToast(p.archived ? 'Policy restored successfully!' : 'Policy archived successfully', !p.archived, p.title); load(); }
    catch (e) { showToast(e.message, false); }
  }
  async function del(id, title) {
    try { await api.policies.delete(id); showToast('Policy deleted successfully!', true, title); setConfirm(null); load(); }
    catch (e) { showToast(e.message, false); }
  }

  const CC = { Membership:'#60a5fa', Governance:'#c4b5fd', Events:'#fcd34d', Research:'#6ee7b7' };

  return (
    <div>
      <PageHeader title="Policies & Guidelines" desc="Manage governance documents" action={<AddBtn onClick={() => { setForm(PL_BLANK); setModal('create'); }} />} />
      {confirm && <ConfirmModal msg={`Delete "${confirm.title}"?`} onConfirm={() => del(confirm.id, confirm.title)} onCancel={() => setConfirm(null)} />}
      {modal && (
        <Modal title={modal === 'create' ? 'Create Governance Policy' : 'Edit Governance Policy'} onClose={() => setModal(null)} wide>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <DInput label="Policy Title" name="title" value={form.title} onChange={fc} required span="1/-1" />
            <DInput label="Policy Category" name="category" value={form.category} onChange={fc} as="select" opts={['Membership','Governance','Events','Research']} />
            <DInput label="Effective Date" name="effective_date" value={form.effective_date} onChange={fc} type="date" required />
            <DInput label="Restricted to Members" name="members_only" value={form.members_only} onChange={fc} as="checkbox" />
            <DInput label="Policy Content & Articles" name="content" value={form.content} onChange={fc} as="textarea" span="1/-1" />
          </div>
          <FormActions onCancel={() => setModal(null)} onSave={save} saving={saving} saveLabel={modal === 'create' ? 'Create Policy' : 'Save Changes'} />
        </Modal>
      )}

      <SectionKPIs items={[
        { label: 'Total Policies', value: items.length, icon: '📜', color: '#0ea5e9' },
        { label: 'Active Documents', value: items.filter(p => !p.archived).length, icon: '🟢', color: '#34d399' },
        { label: 'Members Only', value: items.filter(p => p.members_only).length, icon: '🔒', color: '#fbbf24' },
        { label: 'Governance & Rules', value: items.filter(p => p.category === 'Governance' || p.category === 'Membership').length, icon: '🏛️', color: '#a78bfa' },
      ]} />

      {loading ? <Loading /> : (
        <DataTable head={['Title','Category','Effective','Access','Status','Actions']}>
          {items.length === 0 ? <EmptyTR cols={6} /> : items.map(p => {
            const c = CC[p.category] || '#60a5fa';
            return (
              <TR key={p.id}>
                <TD><div style={{ fontWeight:700, color:'#fff', maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.title}</div></TD>
                <TD><span className="ap-badge" style={{ background:`${c}1a`, color:c }}>{p.category}</span></TD>
                <TD muted>{String(p.effective_date || '').slice(0,10)}</TD>
                <TD><span style={{ fontSize:12, color: p.members_only ? '#fcd34d' : 'rgba(255,255,255,0.38)' }}>{p.members_only ? '🔒 Members' : '🌐 Public'}</span></TD>
                <TD>
                  <span className="ap-pill" style={{ background: p.archived ? 'rgba(255,255,255,0.06)' : 'rgba(16,185,129,0.15)', color: p.archived ? 'rgba(255,255,255,0.35)' : '#6ee7b7' }}>
                    {p.archived ? 'Archived' : '● Active'}
                  </span>
                </TD>
                <TD>
                  <div style={{ display:'flex', gap:5 }}>
                    <button onClick={() => { setForm({ ...p }); setModal(p); }} className="ap-btn ap-btn-blue">Edit</button>
                    <button onClick={() => toggleArchive(p)} className="ap-btn ap-btn-amber">{p.archived ? 'Restore' : 'Archive'}</button>
                    <button onClick={() => setConfirm(p)} className="ap-btn ap-btn-red">Del</button>
                  </div>
                </TD>
              </TR>
            );
          })}
        </DataTable>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   FUNDING
═══════════════════════════════════════════════════════════════════ */
const FU_BLANK = { title:'', category:'Scholarship', provider:'', amount:'', deadline:'', description:'', eligibility:'', status:'Open' };

function FundingTab({ showToast }) {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null);
  const [form, setForm]       = useState(FU_BLANK);
  const [saving, setSaving]   = useState(false);
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(() => { setLoading(true); api.funding.list({ limit: 1000 }).then(r => setItems(Array.isArray(r) ? r : (r?.data || []))).catch(() => showToast('Failed', false)).finally(() => setLoading(false)); }, []);
  useEffect(load, [load]);
  const fc = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  async function save() {
    if (!form.title || !form.provider || !form.deadline) { showToast('Fill required fields', false); return; }
    setSaving(true);
    try {
      if (modal === 'create') { await api.funding.create(form); showToast('Funding opportunity created successfully!', true, form.title); }
      else { await api.funding.update(modal.id, form); showToast('Funding updated successfully!', true, form.title); }
      setModal(null);
      load();
    } catch (e) { showToast(e.message, false); } finally { setSaving(false); }
  }
  async function del(id, title) {
    try { await api.funding.delete(id); showToast('Funding deleted successfully!', true, title); setConfirm(null); load(); }
    catch (e) { showToast(e.message, false); }
  }

  const SC = { Open:'#6ee7b7', Upcoming:'#93c5fd', Closed:'rgba(255,255,255,0.35)' };

  return (
    <div>
      <PageHeader title="Funding Opportunities" desc="Post grants, scholarships and government funds" action={<AddBtn onClick={() => { setForm(FU_BLANK); setModal('create'); }} />} />
      {confirm && <ConfirmModal msg={`Delete "${confirm.title}"?`} onConfirm={() => del(confirm.id, confirm.title)} onCancel={() => setConfirm(null)} />}
      {modal && (
        <Modal title={modal === 'create' ? 'Create Funding Call' : 'Edit Funding Call'} onClose={() => setModal(null)} wide>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <DInput label="Grant / Call Title" name="title" value={form.title} onChange={fc} required span="1/-1" />
            <DInput label="Funding Category" name="category" value={form.category} onChange={fc} as="select" opts={['Scholarship','Grant','Government Fund','Research Grant']} />
            <DInput label="Application Status" name="status" value={form.status} onChange={fc} as="select" opts={['Open','Upcoming','Closed']} />
            <DInput label="Funding Agency / Provider" name="provider" value={form.provider} onChange={fc} required />
            <DInput label="Grant Amount / Ceiling" name="amount" value={form.amount} onChange={fc} />
            <DInput label="Application Deadline" name="deadline" value={form.deadline} onChange={fc} type="date" required />
            <DInput label="Opportunity Description" name="description" value={form.description} onChange={fc} as="textarea" span="1/-1" />
            <DInput label="Eligibility Criteria" name="eligibility" value={form.eligibility} onChange={fc} as="textarea" span="1/-1" />
          </div>
          <FormActions onCancel={() => setModal(null)} onSave={save} saving={saving} saveLabel={modal === 'create' ? 'Create Funding' : 'Save Changes'} />
        </Modal>
      )}

      <SectionKPIs items={[
        { label: 'Total Grants', value: items.length, icon: '💰', color: '#10b981' },
        { label: 'Open Opportunities', value: items.filter(f => f.status === 'Open').length, icon: '🟢', color: '#34d399' },
        { label: 'Upcoming', value: items.filter(f => f.status === 'Upcoming').length, icon: '🟡', color: '#fbbf24' },
        { label: 'Closed / Archived', value: items.filter(f => f.status === 'Closed').length, icon: '🔒', color: '#94a3b8' },
      ]} />

      {loading ? <Loading /> : (
        <DataTable head={['Title','Provider','Amount','Deadline','Status','Actions']}>
          {items.length === 0 ? <EmptyTR cols={6} /> : items.map(f => {
            const sc = SC[f.status] || '#6ee7b7';
            return (
              <TR key={f.id}>
                <TD>
                  <div style={{ fontWeight:700, color:'#fff' }}>{f.title}</div>
                  <div style={{ fontSize:13, color:'rgba(255,255,255,0.55)', marginTop:2 }}>{f.category}</div>
                </TD>
                <TD muted>{f.provider}</TD>
                <TD><span style={{ color:'#6ee7b7', fontWeight:700 }}>{f.amount || '—'}</span></TD>
                <TD muted>{String(f.deadline || '').slice(0,10)}</TD>
                <TD><span className="ap-pill" style={{ background:`${sc}1a`, color:sc }}>{f.status}</span></TD>
                <TD>
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={() => { setForm({ ...f, deadline:String(f.deadline || '').slice(0,10) }); setModal(f); }} className="ap-btn ap-btn-blue">Edit</button>
                    <button onClick={() => setConfirm(f)} className="ap-btn ap-btn-red">Delete</button>
                  </div>
                </TD>
              </TR>
            );
          })}
        </DataTable>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PARTNERSHIPS
═══════════════════════════════════════════════════════════════════ */
const PA_BLANK = { partner_name:'', type:'Academic Partnership', description:'', start_date:'', end_date:'', contact_person:'', contact_email:'', status:'Active' };

function PartnershipsTab({ showToast }) {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null);
  const [form, setForm]       = useState(PA_BLANK);
  const [saving, setSaving]   = useState(false);
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(() => { setLoading(true); api.partnerships.list({ limit: 1000 }).then(r => setItems(Array.isArray(r) ? r : (r?.data || []))).catch(() => showToast('Failed', false)).finally(() => setLoading(false)); }, []);
  useEffect(load, [load]);
  const fc = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  async function save() {
    if (!form.partner_name || !form.start_date) { showToast('Fill required fields', false); return; }
    setSaving(true);
    try {
      if (modal === 'create') { await api.partnerships.create(form); showToast('Partnership created successfully!', true, form.partner_name); }
      else { await api.partnerships.update(modal.id, form); showToast('Partnership updated successfully!', true, form.partner_name); }
      setModal(null);
      load();
    } catch (e) { showToast(e.message, false); } finally { setSaving(false); }
  }
  async function del(id, name) {
    try { await api.partnerships.delete(id); showToast('Partnership deleted successfully!', true, name); setConfirm(null); load(); }
    catch (e) { showToast(e.message, false); }
  }

  const SC = { Active:'#6ee7b7', Pending:'#fcd34d', Expired:'rgba(255,255,255,0.35)' };

  return (
    <div>
      <PageHeader title="Partnerships" desc="Manage strategic consortium partnerships" action={<AddBtn onClick={() => { setForm(PA_BLANK); setModal('create'); }} />} />
      {confirm && <ConfirmModal msg={`Delete "${confirm.partner_name}"?`} onConfirm={() => del(confirm.id, confirm.partner_name)} onCancel={() => setConfirm(null)} />}
      {modal && (
        <Modal title={modal === 'create' ? 'Create Partnership Record' : 'Edit Partnership Record'} onClose={() => setModal(null)} wide>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <DInput label="Partner Institution / Company" name="partner_name" value={form.partner_name} onChange={fc} required span="1/-1" />
            <DInput label="Alliance Type" name="type" value={form.type} onChange={fc} as="select" opts={['Academic Partnership','Research Collaboration','Technology Partnership','Funding Partnership']} />
            <DInput label="Agreement Status" name="status" value={form.status} onChange={fc} as="select" opts={['Active','Pending','Expired']} />
            <DInput label="Effective Start Date" name="start_date" value={form.start_date} onChange={fc} type="date" required />
            <DInput label="Agreement End Date" name="end_date" value={form.end_date} onChange={fc} type="date" />
            <DInput label="Focal Contact Person" name="contact_person" value={form.contact_person} onChange={fc} />
            <DInput label="Official Contact Email" name="contact_email" value={form.contact_email} onChange={fc} type="email" />
            <DInput label="Scope & Collaboration Description" name="description" value={form.description} onChange={fc} as="textarea" span="1/-1" />
          </div>
          <FormActions onCancel={() => setModal(null)} onSave={save} saving={saving} saveLabel={modal === 'create' ? 'Create Partnership' : 'Save Changes'} />
        </Modal>
      )}

      <SectionKPIs items={[
        { label: 'Total Alliances', value: items.length, icon: '🤝', color: '#8b5cf6' },
        { label: 'Active Partners', value: items.filter(p => p.status === 'Active').length, icon: '🟢', color: '#34d399' },
        { label: 'Academic Tracks', value: items.filter(p => p.type?.includes('Academic') || p.type?.includes('Research')).length, icon: '🎓', color: '#60a5fa' },
        { label: 'Pending Review', value: items.filter(p => p.status === 'Pending').length, icon: '⏳', color: '#fbbf24' },
      ]} />

      {loading ? <Loading /> : (
        <DataTable head={['Partner','Type','Started','Contact','Status','Actions']}>
          {items.length === 0 ? <EmptyTR cols={6} /> : items.map(p => {
            const sc = SC[p.status] || '#6ee7b7';
            return (
              <TR key={p.id}>
                <TD><div style={{ fontWeight:700, color:'#fff' }}>{p.partner_name}</div></TD>
                <TD muted>{p.type}</TD>
                <TD muted>{String(p.start_date || '').slice(0,10)}</TD>
                <TD muted>{p.contact_person || '—'}</TD>
                <TD><span className="ap-pill" style={{ background:`${sc}1a`, color:sc }}>{p.status}</span></TD>
                <TD>
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={() => { setForm({ ...p, start_date:String(p.start_date||'').slice(0,10), end_date:String(p.end_date||'').slice(0,10) }); setModal(p); }} className="ap-btn ap-btn-blue">Edit</button>
                    <button onClick={() => setConfirm(p)} className="ap-btn ap-btn-red">Delete</button>
                  </div>
                </TD>
              </TR>
            );
          })}
        </DataTable>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   REPORTS
═══════════════════════════════════════════════════════════════════ */
function ReportsTab({ showToast }) {
  const [chatbot, setChatbot]   = useState(null);
  const [evRep, setEvRep]       = useState(null);
  const [trRep, setTrRep]       = useState(null);
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRef]    = useState(false);
  const [lastFetched, setLast]  = useState(null);

  const load = useCallback((isRefresh = false) => {
    if (isRefresh) setRef(true); else setLoading(true);
    Promise.all([api.admin.reportChatbot(), api.admin.reportEvents(), api.admin.reportTraining(), api.admin.stats()])
      .then(([c,e,t,s]) => { setChatbot(c); setEvRep(e); setTrRep(t); setStatsData(s); setLast(new Date()); })
      .catch(() => showToast('Failed to load reports', false))
      .finally(() => { setLoading(false); setRef(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Loading />;

  const accColor = chatbot?.accuracy >= 80 ? '#6ee7b7' : chatbot?.accuracy >= 60 ? '#fcd34d' : '#fca5a5';

  return (
    <div>
      <PageHeader title="Analytics & Reports" desc="Portal performance and usage insights" action={
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {lastFetched && <span style={{ fontSize:13, color:'rgba(255,255,255,0.5)' }}>Live data · {lastFetched.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', second:'2-digit' })}</span>}
          <button onClick={() => load(true)} disabled={refreshing} className="ap-btn ap-btn-ghost" style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ display:'inline-block', animation: refreshing ? 'spin .7s linear infinite' : 'none' }}>↻</span>
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      } />

      <SectionKPIs items={[
        { label: 'AI Accuracy Rate', value: `${chatbot?.accuracy || 0}%`, icon: '🦅', color: accColor },
        { label: 'Total Inquiries', value: chatbot?.total || 0, icon: '💬', color: '#818cf8' },
        { label: 'Events Active', value: statsData?.events?.total || 0, icon: '📅', color: '#a855f7' },
        { label: 'Registered Members', value: statsData?.users?.member || 0, icon: '👥', color: '#34d399' },
      ]} />

      {/* Chatbot accuracy panel */}
      <div style={{ background:'rgba(79,70,229,0.07)', border:'1px solid rgba(79,70,229,0.2)', borderRadius:16, padding:'22px 24px', marginBottom:22 }}>
        <div style={{ fontSize:13, fontWeight:800, color:'rgba(255,255,255,0.6)', textTransform:'uppercase', letterSpacing:'.6px', marginBottom:16 }}>
          🦅 Haribon NLP — Intent Recognition Accuracy
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:18 }}>
          {[
            { label:'Total Queries', value:chatbot?.total || 0,    color:'#fff'     },
            { label:'Matched',       value:chatbot?.matched || 0,  color:'#6ee7b7'  },
            { label:'Unmatched',     value:chatbot?.unmatched || 0,color:'#fca5a5'  },
            { label:'Accuracy',      value:`${chatbot?.accuracy || 0}%`, color:accColor },
          ].map(s => (
            <div key={s.label} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'14px 16px' }}>
              <div style={{ fontSize:24, fontWeight:900, color:s.color, letterSpacing:'-1px' }}>{s.value}</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.55)', marginTop:4 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ marginBottom: chatbot?.topIntents?.length > 0 ? 16 : 0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7, fontSize:12, color:'rgba(255,255,255,0.45)' }}>
            <span>Overall accuracy rate</span>
            <span style={{ fontWeight:800, color:accColor }}>{chatbot?.accuracy || 0}%</span>
          </div>
          <div style={{ height:8, background:'rgba(255,255,255,0.08)', borderRadius:4, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${chatbot?.accuracy || 0}%`, background: chatbot?.accuracy >= 80 ? 'linear-gradient(90deg,#059669,#6ee7b7)' : 'linear-gradient(90deg,#f59e0b,#fcd34d)', borderRadius:4, transition:'width .8s ease' }} />
          </div>
        </div>

        {/* Top Intents BarChart */}
        {chatbot?.topIntents?.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize:12, fontWeight:800, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'.8px', marginBottom:12 }}>Top Intents Volume</div>
            <ResponsiveContainer width="100%" height={Math.max(160, chatbot.topIntents.length * 28)}>
              <BarChart data={chatbot.topIntents} layout="vertical" margin={{ left: 10, right: 30, top: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="intent" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11.5 }} axisLine={false} tickLine={false} width={130} />
                <Tooltip contentStyle={{ background:'#0f172a', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#fff', fontSize:12 }} cursor={{ fill:'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="count" fill="#818cf8" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* User Role Distribution Pie Chart */}
      {statsData?.users && (
        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:'22px 24px', marginBottom:22 }}>
          <div style={{ fontSize:13, fontWeight:800, color:'rgba(255,255,255,0.6)', textTransform:'uppercase', letterSpacing:'.6px', marginBottom:16 }}>
            👥 User Role Distribution
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, alignItems:'center' }}>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={[
                    { name:'Members', value: statsData.users.member },
                    { name:'Guests', value: statsData.users.guest },
                    { name:'Admins', value: statsData.users.admin },
                  ]}
                  cx="50%" cy="50%" innerRadius={48} outerRadius={76}
                  paddingAngle={3} dataKey="value"
                >
                  <Cell fill="#34d399" />
                  <Cell fill="#60a5fa" />
                  <Cell fill="#f87171" />
                </Pie>
                <Tooltip contentStyle={{ background:'#0f172a', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#fff', fontSize:12 }} />
                <Legend formatter={(v) => <span style={{ color:'rgba(255,255,255,0.7)', fontSize:12 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[
                { label:'Members', value: statsData.users.member, color:'#34d399', pct: statsData.users.total > 0 ? Math.round(statsData.users.member/statsData.users.total*100) : 0 },
                { label:'Guests',  value: statsData.users.guest,  color:'#60a5fa', pct: statsData.users.total > 0 ? Math.round(statsData.users.guest/statsData.users.total*100) : 0 },
                { label:'Admins',  value: statsData.users.admin,  color:'#f87171', pct: statsData.users.total > 0 ? Math.round(statsData.users.admin/statsData.users.total*100) : 0 },
              ].map(r => (
                <div key={r.label} style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:10, height:10, borderRadius:'50%', background:r.color, flexShrink:0 }} />
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                      <span style={{ fontSize:12.5, color:'rgba(255,255,255,0.7)', fontWeight:600 }}>{r.label}</span>
                      <span style={{ fontSize:12.5, fontWeight:800, color:'#fff' }}>{r.value} <span style={{ color:'rgba(255,255,255,0.4)', fontWeight:400 }}>({r.pct}%)</span></span>
                    </div>
                    <div style={{ height:5, background:'rgba(255,255,255,0.08)', borderRadius:3, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${r.pct}%`, background:r.color, borderRadius:3 }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Event fill rates BarChart */}
      <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:'22px 24px', marginBottom:22 }}>
        <div style={{ fontSize:13, fontWeight:800, color:'rgba(255,255,255,0.6)', textTransform:'uppercase', letterSpacing:'.6px', marginBottom:16 }}>
          📅 Event Fill Rates — {evRep?.summary?.overallFillRate || 0}% average
        </div>
        {evRep?.events?.length > 0 ? (
          <ResponsiveContainer width="100%" height={Math.max(140, evRep.events.length * 36)}>
            <BarChart data={evRep.events.map(ev => ({ name: ev.title.length > 25 ? ev.title.slice(0,25)+'…' : ev.title, fillRate: ev.fillRate, enrolled: ev.enrolled, total: ev.total }))} layout="vertical" margin={{ left:10, right:30, top:0, bottom:0 }}>
              <XAxis type="number" domain={[0,100]} tick={{ fill:'rgba(255,255,255,0.4)', fontSize:10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <YAxis type="category" dataKey="name" tick={{ fill:'rgba(255,255,255,0.65)', fontSize:11 }} axisLine={false} tickLine={false} width={150} />
              <Tooltip contentStyle={{ background:'#0f172a', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#fff', fontSize:12 }} formatter={(v,n,p) => [`${v}% (${p.payload.enrolled}/${p.payload.total} registered)`, 'Fill Rate']} cursor={{ fill:'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="fillRate" radius={[0,4,4,0]}>
                {(evRep?.events||[]).map((ev, idx) => (
                  <Cell key={idx} fill={ev.fillRate >= 80 ? '#34d399' : ev.fillRate >= 50 ? '#f59e0b' : '#818cf8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ textAlign:'center', padding:'24px 0', color:'rgba(255,255,255,0.3)', fontSize:13 }}>No event data yet</div>
        )}
      </div>

      {/* Training enrollment BarChart */}
      <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:'22px 24px', marginBottom:22 }}>
        <div style={{ fontSize:13, fontWeight:800, color:'rgba(255,255,255,0.6)', textTransform:'uppercase', letterSpacing:'.6px', marginBottom:16 }}>
          🎓 Training Enrollment
        </div>
        {trRep?.trainings?.length > 0 ? (
          <ResponsiveContainer width="100%" height={Math.max(140, trRep.trainings.length * 36)}>
            <BarChart data={trRep.trainings.map(t => ({ name: t.title.length > 25 ? t.title.slice(0,25)+'…' : t.title, fillRate: t.fillRate, enrolled: t.enrolled, total: t.total }))} layout="vertical" margin={{ left:10, right:30, top:0, bottom:0 }}>
              <XAxis type="number" domain={[0,100]} tick={{ fill:'rgba(255,255,255,0.4)', fontSize:10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <YAxis type="category" dataKey="name" tick={{ fill:'rgba(255,255,255,0.65)', fontSize:11 }} axisLine={false} tickLine={false} width={150} />
              <Tooltip contentStyle={{ background:'#0f172a', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#fff', fontSize:12 }} formatter={(v,n,p) => [`${v}% (${p.payload.enrolled}/${p.payload.total} enrolled)`, 'Fill Rate']} cursor={{ fill:'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="fillRate" radius={[0,4,4,0]}>
                {(trRep?.trainings||[]).map((t, idx) => (
                  <Cell key={idx} fill={t.fillRate >= 80 ? '#34d399' : t.fillRate >= 50 ? '#fbbf24' : '#f43f5e'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ textAlign:'center', padding:'24px 0', color:'rgba(255,255,255,0.3)', fontSize:13 }}>No training data yet</div>
        )}
      </div>

      {/* Unmatched queries log */}
      {chatbot?.unmatchedQueries?.length > 0 && (
        <div style={{ background:'rgba(239,68,68,0.05)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:16, padding:'22px 24px' }}>
          <div style={{ fontSize:13, fontWeight:800, color:'rgba(255,255,255,0.75)', textTransform:'uppercase', letterSpacing:'.6px', marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
            <span>❓ Recent Unmatched Chatbot Queries</span>
            <span style={{ background:'rgba(239,68,68,0.2)', color:'#fca5a5', fontSize:11, padding:'2px 8px', borderRadius:99, fontWeight:800 }}>{chatbot.unmatchedQueries.length}</span>
            <span style={{ fontSize:11, fontWeight:400, color:'rgba(255,255,255,0.4)', textTransform:'none', letterSpacing:0, marginLeft:'auto' }}>Use these to expand Haribon's knowledge base</span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {chatbot.unmatchedQueries.map((q, i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'rgba(255,255,255,0.03)', borderRadius:8, padding:'9px 14px', border:'1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize:13, color:'rgba(255,255,255,0.85)', fontStyle:'italic' }}>"{q.message}"</span>
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.35)', flexShrink:0, marginLeft:12 }}>
                  {new Date(q.time).toLocaleDateString('en-PH', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ADMIN CALENDAR TAB — Outlook-style full calendar for admin
═══════════════════════════════════════════════════════════════════ */
const MONTH_NAMES_LONG = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_LABELS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const DAY_MS = 24 * 60 * 60 * 1000;

function parseAdminRange(str) {
  if (!str) return null;
  const M = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 };
  const yr = (str.match(/\b(\d{4})\b/) || [])[1]; if (!yr) return null;
  const cross = str.match(/([A-Z][a-z]{2})\s+(\d+)\s*[–\-]\s*([A-Z][a-z]{2})\s+(\d+)/);
  if (cross && M[cross[1]] !== undefined && M[cross[3]] !== undefined)
    return { start: new Date(+yr, M[cross[1]], +cross[2]), end: new Date(+yr, M[cross[3]], +cross[4]) };
  const same = str.match(/([A-Z][a-z]{2})\s+(\d+)[–\-](\d+)/);
  if (same && M[same[1]] !== undefined)
    return { start: new Date(+yr, M[same[1]], +same[2]), end: new Date(+yr, M[same[1]], +same[3]) };
  const single = str.match(/([A-Z][a-z]{2})\s+(\d+)/);
  if (single && M[single[1]] !== undefined) { const d = new Date(+yr, M[single[1]], +single[2]); return { start:d, end:d }; }
  return null;
}

const EV_CAL_COLORS = {
  Summit:   { bg:'linear-gradient(90deg,rgba(99,102,241,0.65),rgba(129,140,248,0.45))', border:'rgba(129,140,248,0.7)', text:'#fff', icon:'🦁' },
  Workshop: { bg:'linear-gradient(90deg,rgba(16,185,129,0.65),rgba(52,211,153,0.45))', border:'rgba(52,211,153,0.7)', text:'#fff', icon:'🛠️' },
  Seminar:  { bg:'linear-gradient(90deg,rgba(168,85,247,0.65),rgba(192,132,252,0.45))', border:'rgba(192,132,252,0.7)', text:'#fff', icon:'🎙️' },
  Funding:  { bg:'linear-gradient(90deg,rgba(245,158,11,0.65),rgba(251,191,36,0.45))', border:'rgba(251,191,36,0.7)', text:'#fff', icon:'💰' },
};
const TR_CAL_COLORS = {
  Technology:{ bg:'linear-gradient(90deg,rgba(14,165,233,0.65),rgba(56,189,248,0.45))', border:'rgba(56,189,248,0.7)', text:'#fff', icon:'💻' },
  Research:  { bg:'linear-gradient(90deg,rgba(16,185,129,0.65),rgba(52,211,153,0.45))', border:'rgba(52,211,153,0.7)', text:'#fff', icon:'🔬' },
  Leadership:{ bg:'linear-gradient(90deg,rgba(249,115,22,0.65),rgba(251,146,60,0.45))', border:'rgba(251,146,60,0.7)', text:'#fff', icon:'🎖️' },
  Governance:{ bg:'linear-gradient(90deg,rgba(139,92,246,0.65),rgba(167,139,250,0.45))', border:'rgba(167,139,250,0.7)', text:'#fff', icon:'⚖️' },
};

function AdminCalendarTab({ showToast, setTab }) {
  const today      = new Date();
  const [month, setMonth]         = useState(today.getMonth());
  const [year,  setYear]          = useState(today.getFullYear());
  const [events,    setEvents]    = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [detail,    setDetail]    = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showEvents, setShowEvents]     = useState(true);
  const [showTraining, setShowTraining] = useState(true);

  useEffect(() => {
    Promise.all([
      api.events.list({ limit:1000 }),
      api.training.list({ limit:1000 }),
    ]).then(([ev, tr]) => {
      setEvents(Array.isArray(ev) ? ev : (ev?.data || []));
      setTrainings(Array.isArray(tr) ? tr : (tr?.data || []));
    }).catch(() => showToast('Failed to load calendar data', false))
      .finally(() => setLoading(false));
  }, []);

  // All calendar items
  const allItems = [
    ...(showEvents ? events.map(e => {
      const r = parseAdminRange(e.date);
      const c = EV_CAL_COLORS[e.category] || EV_CAL_COLORS.Summit;
      return { ...e, startDate:r?.start||null, endDate:r?.end||null, _type:'event', _bg:c.bg, _border:c.border, _text:c.text, _icon:c.icon };
    }) : []),
    ...(showTraining ? trainings.map(t => {
      const r = parseAdminRange(t.schedule);
      const c = TR_CAL_COLORS[t.category] || TR_CAL_COLORS.Technology;
      return { ...t, startDate:r?.start||null, endDate:r?.end||null, _type:'training', _bg:c.bg, _border:c.border, _text:c.text, _icon:c.icon };
    }) : []),
  ].filter(i => i.startDate);

  function prevMon() { if (month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1); }
  function nextMon() { if (month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1); }
  function goToday() { setMonth(today.getMonth()); setYear(today.getFullYear()); }

  // Build Mon-first 6-week grid
  const firstDow   = (new Date(year, month, 1).getDay() + 6) % 7; // Mon=0
  const daysInMon  = new Date(year, month+1, 0).getDate();
  const weeks = [];
  let d = 1 - firstDow;
  for (let w = 0; w < 6; w++) {
    const days = [];
    for (let c = 0; c < 7; c++) { days.push(d++); }
    weeks.push(days);
    if (d - 1 > daysInMon && w >= 3) break;
  }

  // Per-week item bars with row assignment
  function getWeekBars(weekDays) {
    const wsDate = new Date(year, month, weekDays[0]);
    const weDate = new Date(year, month, weekDays[6], 23, 59, 59);
    const wsMs = wsDate.getTime(), weMs = weDate.getTime();
    const active = allItems.filter(it => {
      const e = it.endDate ? it.endDate.getTime() : it.startDate.getTime();
      return it.startDate.getTime() <= weMs && e >= wsMs;
    }).map(it => {
      const e = it.endDate ? it.endDate.getTime() : it.startDate.getTime();
      const sCol = Math.max(0, Math.round((it.startDate.getTime()-wsMs)/DAY_MS));
      const eCol = Math.min(6, Math.round((e-wsMs)/DAY_MS));
      const isStart = it.startDate.getTime() >= wsMs;
      const isEnd   = e <= weMs;
      return { ...it, sCol, eCol, isStart, isEnd };
    }).sort((a,b)=>a.sCol-b.sCol);
    const rowEnds = [];
    return active.map(it => {
      let row = rowEnds.findIndex(re => re < it.sCol);
      if (row===-1){row=rowEnds.length;rowEnds.push(it.eCol);}else rowEnds[row]=it.eCol;
      return { ...it, row };
    });
  }

  // Items on a specific date (for "more" popover)
  function itemsOnDay(day) {
    if (day < 1 || day > daysInMon) return [];
    const d = new Date(year, month, day);
    return allItems.filter(it => {
      const e = it.endDate||it.startDate;
      return it.startDate <= d && e >= d;
    });
  }

  // Mini calendar helpers
  const miniFirst = (new Date(year, month, 1).getDay() + 6) % 7;
  const miniDays  = new Date(year, month+1, 0).getDate();
  const miniGrid  = [];
  let md = 1 - miniFirst;
  for (let r=0; r<6; r++) {
    const row=[]; for(let c=0;c<7;c++) row.push(md++);
    miniGrid.push(row);
    if (md-1>miniDays && r>=3) break;
  }

  const rawEvCount = events.length;
  const rawTrCount = trainings.length;

  function handleMiniClick(d) {
    if (d < 1 || d > daysInMon) return;
    const items = itemsOnDay(d);
    setSelectedDay(s => s?.day === d ? null : { day: d, items });
    setDetail(null);
  }

  const shortcuts = [
    { icon:'📅', label:'Add Event',    action:() => setTab('events'), color:'#818cf8' },
    { icon:'🎓', label:'Add Training', action:() => setTab('training'), color:'#34d399' },
    { icon:'👥', label:'View Users',   action:() => setTab('users'), color:'#60a5fa' },
    { icon:'📊', label:'Reports',      action:() => setTab('reports'), color:'#f59e0b' },
  ];

  return (
    <div style={{ display:'flex', gap:0, height:'calc(100vh - 140px)', overflow:'hidden' }}>

      {/* ── Left sidebar ── */}
      <div style={{ width:240, flexShrink:0, padding:'4px 18px 16px 0', overflowY:'auto', borderRight:'1px solid rgba(255,255,255,0.08)' }}>

        {/* Mini calendar — clickable */}
        <div style={{
          background:'rgba(11, 19, 38, 0.85)', border:'1px solid rgba(255,255,255,0.09)',
          borderRadius:16, padding:'16px 14px', marginBottom:14, backdropFilter:'blur(12px)',
          boxShadow:'0 4px 20px rgba(0,0,0,0.25)'
        }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <span style={{ color:'#fff', fontWeight:900, fontSize:13.5, letterSpacing:'-0.2px' }}>
              {MONTH_NAMES_LONG[month].slice(0,3)} {year}
            </span>
            <div style={{ display:'flex', gap:3 }}>
              <button onClick={prevMon} style={{
                background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
                color:'rgba(255,255,255,0.7)', cursor:'pointer', fontSize:13, width:26, height:24,
                borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', transition:'all .12s'
              }}
              onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.15)';e.currentTarget.style.color='#fff';}}
              onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.06)';e.currentTarget.style.color='rgba(255,255,255,0.7)';}}
              >‹</button>
              <button onClick={nextMon} style={{
                background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
                color:'rgba(255,255,255,0.7)', cursor:'pointer', fontSize:13, width:26, height:24,
                borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', transition:'all .12s'
              }}
              onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.15)';e.currentTarget.style.color='#fff';}}
              onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.06)';e.currentTarget.style.color='rgba(255,255,255,0.7)';}}
              >›</button>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', marginBottom:6 }}>
            {['M','T','W','T','F','S','S'].map((d,i) => (
              <div key={i} style={{ textAlign:'center', fontSize:10, fontWeight:800, color: i >= 5 ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.45)' }}>{d}</div>
            ))}
          </div>
          {miniGrid.map((row,ri) => (
            <div key={ri} style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'2px 0' }}>
              {row.map((d,ci) => {
                const inM    = d >= 1 && d <= miniDays;
                const isT    = inM && d===today.getDate() && month===today.getMonth() && year===today.getFullYear();
                const isSel  = inM && selectedDay?.day === d;
                const items  = inM ? itemsOnDay(d) : [];
                const evCnt  = items.filter(i=>i._type==='event').length;
                const trCnt  = items.filter(i=>i._type==='training').length;
                return (
                  <div key={ci} onClick={() => handleMiniClick(d)}
                    style={{ textAlign:'center', padding:'2px 0', position:'relative', cursor: inM ? 'pointer' : 'default' }}>
                    <span style={{
                      display:'inline-flex', alignItems:'center', justifyContent:'center',
                      width:22, height:22, borderRadius:'50%', fontSize:11.5, transition:'all .14s',
                      fontWeight: isT || isSel ? 900 : 500,
                      color: isT ? '#fff' : isSel ? '#fff' : inM ? (ci >= 5 ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.85)') : 'rgba(255,255,255,0.15)',
                      background: isT ? 'linear-gradient(135deg,#f97316,#e11d48)' : isSel ? 'linear-gradient(135deg,#3b82f6,#1d4ed8)' : 'transparent',
                      boxShadow: isT ? '0 0 10px rgba(249,115,22,0.5)' : isSel ? '0 0 10px rgba(59,130,246,0.5)' : 'none',
                    }}>{inM ? d : ''}</span>
                    {/* Event/training dots */}
                    {inM && !isT && !isSel && (evCnt > 0 || trCnt > 0) && (
                      <div style={{ position:'absolute', bottom:1, left:'50%', transform:'translateX(-50%)', display:'flex', gap:2 }}>
                        {evCnt > 0 && <span style={{ width:3, height:3, borderRadius:'50%', background:'#818cf8', display:'block' }} />}
                        {trCnt > 0 && <span style={{ width:3, height:3, borderRadius:'50%', background:'#34d399', display:'block' }} />}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Day quick panel — shows when a date is clicked */}
        {selectedDay && (
          <div style={{ background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.3)', borderRadius:14, padding:'12px', marginBottom:14, animation:'modalIn .18s ease' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <div>
                <div style={{ color:'#93c5fd', fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'.5px' }}>
                  {MONTH_NAMES_LONG[month].slice(0,3)} {selectedDay.day}, {year}
                </div>
                <div style={{ color:'#fff', fontWeight:900, fontSize:13, marginTop:1 }}>
                  {selectedDay.items.length === 0 ? 'No items scheduled' : `${selectedDay.items.length} item${selectedDay.items.length > 1 ? 's' : ''}`}
                </div>
              </div>
              <button onClick={() => setSelectedDay(null)} style={{ background:'none',border:'none',color:'rgba(255,255,255,0.6)',cursor:'pointer',fontSize:13,padding:2 }}>✕</button>
            </div>

            {selectedDay.items.length === 0 ? (
              <div>
                <p style={{ color:'rgba(255,255,255,0.5)', fontSize:12, margin:'0 0 8px', lineHeight:1.5 }}>No events or training on this day.</p>
                <button onClick={() => setTab('events')} style={{ width:'100%', background:'linear-gradient(90deg,#f97316,#e11d48)', color:'#fff', border:'none', borderRadius:8, padding:'7px', fontSize:12.5, fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}>
                  ＋ Add Event
                </button>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {selectedDay.items.map(it => (
                  <div key={it.id} onClick={() => { setDetail(it); setSelectedDay(null); }}
                    style={{
                      display:'flex', alignItems:'center', gap:8, padding:'7px 9px',
                      background: it._type==='event' ? 'rgba(129,140,248,0.15)' : 'rgba(52,211,153,0.15)',
                      border: `1px solid ${it._type==='event' ? 'rgba(129,140,248,0.35)' : 'rgba(52,211,153,0.35)'}`,
                      borderRadius:9, cursor:'pointer', transition:'all .13s'
                    }}
                    onMouseEnter={e=>e.currentTarget.style.transform='translateX(2px)'}
                    onMouseLeave={e=>e.currentTarget.style.transform='translateX(0)'}
                  >
                    <span style={{ fontSize:13 }}>{it._icon || (it._type==='event' ? '📅' : '🎓')}</span>
                    <span style={{ fontSize:12, fontWeight:700, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{it.title}</span>
                    <span style={{ fontSize:10, color: it._type==='event' ? '#a5b4fc' : '#6ee7b7', fontWeight:800 }}>{it.category || it.level}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Role-based quick shortcuts */}
        <div style={{ background:'rgba(11,19,38,0.85)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:'14px 12px', marginBottom:14 }}>
          <div style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'.6px', marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
            <span>⚡</span> Quick Shortcuts
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:7 }}>
            {shortcuts.map(s => (
              <button key={s.label} onClick={s.action} style={{
                background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)',
                borderRadius:10, padding:'10px 6px', cursor:'pointer', fontFamily:'inherit',
                display:'flex', flexDirection:'column', alignItems:'center', gap:4,
                transition:'all .15s',
              }}
              onMouseEnter={e=>{e.currentTarget.style.background='rgba(249,115,22,0.14)';e.currentTarget.style.borderColor='rgba(249,115,22,0.35)';e.currentTarget.style.transform='translateY(-2px)';}}
              onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.04)';e.currentTarget.style.borderColor='rgba(255,255,255,0.08)';e.currentTarget.style.transform='translateY(0)';}}
              >
                <span style={{ fontSize:18 }}>{s.icon}</span>
                <span style={{ fontSize:11.5, fontWeight:800, color:'rgba(255,255,255,0.8)', textAlign:'center', lineHeight:1.2 }}>{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* My Calendars Filter Toggles */}
        <div style={{ background:'rgba(11,19,38,0.85)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:'14px 12px', marginBottom:14 }}>
          <div style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'.6px', marginBottom:10 }}>
            🗂️ My Calendars
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <label style={{ display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', padding:'6px 8px', background:'rgba(255,255,255,0.03)', borderRadius:8, border:'1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <input type="checkbox" checked={showEvents} onChange={e=>setShowEvents(e.target.checked)} style={{ accentColor:'#818cf8', width:15, height:15, cursor:'pointer' }} />
                <span style={{ fontSize:12.5, color: showEvents ? '#fff' : 'rgba(255,255,255,0.4)', fontWeight:700 }}>Events</span>
              </div>
              <span style={{ fontSize:11, fontWeight:800, color:'#818cf8', background:'rgba(129,140,248,0.15)', border:'1px solid rgba(129,140,248,0.3)', borderRadius:5, padding:'1px 6px' }}>
                {rawEvCount}
              </span>
            </label>

            <label style={{ display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', padding:'6px 8px', background:'rgba(255,255,255,0.03)', borderRadius:8, border:'1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <input type="checkbox" checked={showTraining} onChange={e=>setShowTraining(e.target.checked)} style={{ accentColor:'#34d399', width:15, height:15, cursor:'pointer' }} />
                <span style={{ fontSize:12.5, color: showTraining ? '#fff' : 'rgba(255,255,255,0.4)', fontWeight:700 }}>Training</span>
              </div>
              <span style={{ fontSize:11, fontWeight:800, color:'#34d399', background:'rgba(52,211,153,0.15)', border:'1px solid rgba(52,211,153,0.3)', borderRadius:5, padding:'1px 6px' }}>
                {rawTrCount}
              </span>
            </label>
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ padding:'0 4px' }}>
          <div style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'.6px', marginBottom:8 }}>
            Quick Actions
          </div>
          {[
            { label:'＋ Add New Event', action:() => setTab('events'), color:'#fb923c' },
            { label:'＋ Add New Training', action:() => setTab('training'), color:'#34d399' },
          ].map(a => (
            <button key={a.label} onClick={a.action} style={{
              display:'block', width:'100%', textAlign:'left', background:'transparent',
              border:'none', color:'rgba(255,255,255,0.6)', fontSize:12, fontWeight:700,
              cursor:'pointer', padding:'6px 0', fontFamily:'inherit', transition:'all .13s',
            }}
            onMouseEnter={e=>{e.currentTarget.style.color=a.color;e.currentTarget.style.transform='translateX(3px)';}}
            onMouseLeave={e=>{e.currentTarget.style.color='rgba(255,255,255,0.6)';e.currentTarget.style.transform='translateX(0)';}}
            >{a.label}</button>
          ))}
        </div>
      </div>

      {/* ── Main calendar ── */}
      <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column', paddingLeft:20 }}>

        {/* Toolbar */}
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          gap:12, marginBottom:16, flexShrink:0,
          background:'rgba(11, 19, 38, 0.85)', border:'1px solid rgba(255,255,255,0.08)',
          borderRadius:16, padding:'12px 18px', backdropFilter:'blur(14px)',
          boxShadow:'0 4px 20px rgba(0,0,0,0.25)'
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <button onClick={goToday} style={{
              background:'linear-gradient(135deg,#f97316,#e11d48)',
              border:'none', borderRadius:9, padding:'8px 16px', color:'#fff',
              fontSize:13, fontWeight:800, cursor:'pointer', fontFamily:'inherit',
              boxShadow:'0 4px 14px rgba(249,115,22,0.35)', transition:'all .14s'
            }}
            onMouseEnter={e=>e.currentTarget.style.opacity='.9'}
            onMouseLeave={e=>e.currentTarget.style.opacity='1'}
            >Today</button>

            <div style={{ display:'flex', gap:4 }}>
              {[['‹',prevMon],['›',nextMon]].map(([ch,fn])=>(
                <button key={ch} onClick={fn} style={{
                  background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)',
                  borderRadius:8, width:34, height:34, color:'rgba(255,255,255,0.8)',
                  fontSize:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                  transition:'all .13s'
                }}
                onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.15)';e.currentTarget.style.color='#fff';}}
                onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.06)';e.currentTarget.style.color='rgba(255,255,255,0.8)';}}
                >{ch}</button>
              ))}
            </div>

            <div style={{ display:'flex', alignItems:'center', gap:8, marginLeft:6 }}>
              <span style={{ fontSize:18 }}>📅</span>
              <h2 style={{ color:'#fff', fontWeight:900, fontSize:19, letterSpacing:'-0.4px', margin:0 }}>
                {MONTH_NAMES_LONG[month]} {year}
              </h2>
            </div>
          </div>

          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <span style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.6)', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:8, padding:'6px 12px' }}>
              {allItems.filter(i=>{ const m=i.startDate?.getMonth(); return m===month; }).length} items this month
            </span>
            <button onClick={() => setTab('events')} style={{
              background:'linear-gradient(90deg,#f97316,#e11d48)', color:'#fff',
              border:'none', borderRadius:10, padding:'9px 18px', fontSize:13,
              fontWeight:800, cursor:'pointer', fontFamily:'inherit',
              display:'flex', alignItems:'center', gap:6, boxShadow:'0 4px 16px rgba(249,115,22,0.35)'
            }}>
              ＋ New Event
            </button>
          </div>
        </div>

        {/* Day headers Mon–Sun */}
        <div style={{
          display:'grid', gridTemplateColumns:'repeat(7,1fr)',
          background:'rgba(15,23,42,0.6)', border:'1px solid rgba(255,255,255,0.08)',
          borderBottom:'none', borderRadius:'14px 14px 0 0',
          padding:'10px 0', flexShrink:0
        }}>
          {DAY_LABELS.map((d,i) => (
            <div key={d} style={{
              textAlign:'center', fontSize:11.5, fontWeight:800,
              color: i>=5 ? '#f87171' : 'rgba(255,255,255,0.7)',
              letterSpacing:'.6px', textTransform:'uppercase'
            }}>{d}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.3)', background:'rgba(11,19,38,0.5)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'0 0 14px 14px' }}>
            <div style={{ textAlign:'center' }}><div style={{ fontSize:32, marginBottom:8 }}>⏳</div>Loading calendar…</div>
          </div>
        ) : (
          /* Week rows */
          <div style={{
            flex:1, overflowY:'auto', display:'flex', flexDirection:'column',
            background:'rgba(11,19,38,0.75)', border:'1px solid rgba(255,255,255,0.08)',
            borderRadius:'0 0 14px 14px', backdropFilter:'blur(12px)'
          }}>
            {weeks.map((wDays, wi) => {
              const bars = getWeekBars(wDays);
              const maxRow = bars.reduce((mx,b)=>Math.max(mx,b.row), -1);
              return (
                <div key={wi} style={{
                  flex:1, minHeight:105, borderBottom: wi < weeks.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  display:'flex', flexDirection:'column', position:'relative'
                }}>
                  {/* Event bars */}
                  {bars.length > 0 && (
                    <div style={{
                      display:'grid', gridTemplateColumns:'repeat(7,1fr)',
                      gridTemplateRows:`repeat(${maxRow+1}, 26px)`,
                      gap:3, padding:'6px 6px 2px', flexShrink:0,
                      minHeight:(maxRow+1)*28+10, zIndex:2,
                    }}>
                      {bars.map((item,ii) => {
                        const lR = item.isStart ? 8 : 0;
                        const rR = item.isEnd   ? 8 : 0;
                        return (
                          <div
                            key={`${item.id}-w${wi}-${ii}`}
                            title={`${item.title} (${item.date || item.schedule})`}
                            onClick={() => setDetail(item)}
                            style={{
                              gridColumnStart: item.sCol+1, gridColumnEnd: item.eCol+2,
                              gridRowStart: item.row+1,
                              background: item._bg,
                              border: `1px solid ${item._border}`,
                              borderRadius: `${lR}px ${rR}px ${rR}px ${lR}px`,
                              padding: '2px 9px',
                              cursor:'pointer', overflow:'hidden',
                              display:'flex', alignItems:'center', gap:6,
                              boxShadow:'0 2px 8px rgba(0,0,0,0.3)',
                              transition:'all .15s ease',
                            }}
                            onMouseEnter={e=>{
                              e.currentTarget.style.transform='translateY(-1px)';
                              e.currentTarget.style.filter='brightness(1.2)';
                              e.currentTarget.style.boxShadow='0 4px 14px rgba(0,0,0,0.5)';
                            }}
                            onMouseLeave={e=>{
                              e.currentTarget.style.transform='translateY(0)';
                              e.currentTarget.style.filter='none';
                              e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,0.3)';
                            }}
                          >
                            <span style={{ fontSize:11, flexShrink:0 }}>{item._icon || (item._type === 'training' ? '🎓' : '📅')}</span>
                            {!item.isStart && <span style={{ fontSize:9, color:item._text, opacity:0.6, flexShrink:0 }}>◀</span>}
                            <span style={{ fontSize:12, fontWeight:800, color:item._text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>
                              {item.title}
                            </span>
                            {item.isEnd && (
                              <span style={{ fontSize:9.5, opacity:0.85, fontWeight:700, color:'#fff', background:'rgba(0,0,0,0.25)', borderRadius:4, padding:'1px 4px', flexShrink:0 }}>
                                {item.category || item.level}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {/* Day number cells */}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', flex:1, position:'absolute', inset:0, zIndex:1, pointerEvents:'none' }}>
                    {wDays.map((d, di) => {
                      const inM = d >= 1 && d <= daysInMon;
                      const isT = inM && d===today.getDate() && month===today.getMonth() && year===today.getFullYear();
                      const isWE = di >= 5;
                      return (
                        <div key={di} style={{
                          borderLeft: di>0 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                          padding:'6px 8px',
                          background: isT ? 'rgba(249,115,22,0.06)' : isWE ? 'rgba(255,255,255,0.012)' : 'transparent'
                        }}>
                          <div style={{
                            width:26, height:26, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                            background: isT ? 'linear-gradient(135deg,#f97316,#e11d48)' : 'transparent',
                            fontSize:12.5, fontWeight: isT ? 900 : 700,
                            color: isT ? '#fff' : inM ? (isWE ? '#f87171' : 'rgba(255,255,255,0.85)') : 'rgba(255,255,255,0.15)',
                            boxShadow: isT ? '0 0 12px rgba(249,115,22,0.6)' : 'none'
                          }}>
                            {inM ? d : ''}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Detail side panel ── */}
      {detail && (
        <div onClick={() => setDetail(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', zIndex:9100, display:'flex', alignItems:'center', justifyContent:'flex-end', padding:24, backdropFilter:'blur(6px)' }}>
          <div onClick={e => e.stopPropagation()} style={{
            background:'linear-gradient(180deg,#0f172a,#090e1c)',
            border:'1px solid rgba(255,255,255,0.15)', borderRadius:22,
            width:380, maxHeight:'85vh', overflow:'auto',
            animation:'modalIn .22s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow:'0 30px 90px rgba(0,0,0,0.85)'
          }}>
            <div style={{ background: detail._bg, padding:'24px 24px 20px', position:'relative', borderBottom:'1px solid rgba(255,255,255,0.1)' }}>
              <button onClick={()=>setDetail(null)} style={{
                position:'absolute',top:14,right:14,background:'rgba(0,0,0,0.3)',
                border:'1px solid rgba(255,255,255,0.2)',borderRadius:'50%',width:32,height:32,
                color:'#fff',fontSize:13,fontWeight:900,cursor:'pointer',display:'flex',
                alignItems:'center',justifyContent:'center',backdropFilter:'blur(8px)',
                boxShadow:'0 2px 8px rgba(0,0,0,0.4)',transition:'all .13s'
              }}>✕</button>
              <div style={{ fontSize:11.5, fontWeight:800, color:'rgba(255,255,255,0.85)', textTransform:'uppercase', letterSpacing:'.6px', marginBottom:6 }}>
                {detail._icon} {detail._type === 'event' ? `Consortium Event · ${detail.category}` : `Faculty Training · ${detail.category}`}
              </div>
              <div style={{ color:'#fff', fontSize:18, fontWeight:900, lineHeight:1.35, textShadow:'0 2px 6px rgba(0,0,0,0.4)' }}>
                {detail.title}
              </div>
            </div>

            <div style={{ padding:'20px 24px' }}>
              <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:16 }}>
                {detail._type === 'event'
                  ? [['📅','Date & Schedule',detail.date],['📍','Venue / Location',detail.venue],['🏛','Lead Organizer',detail.organizer],['👥','Seat Capacity',`${detail.enrolled}/${detail.total} Registered`]]
                      .map(([ic,l,v]) => v && (
                        <div key={l} style={{ display:'flex',gap:12,alignItems:'center',padding:'8px 12px',background:'rgba(255,255,255,0.035)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:10 }}>
                          <span style={{ fontSize:16,flexShrink:0 }}>{ic}</span>
                          <div>
                            <div style={{ fontSize:10.5,color:'rgba(255,255,255,0.4)',fontWeight:800,textTransform:'uppercase',letterSpacing:'.5px' }}>{l}</div>
                            <div style={{ fontSize:13,color:'#fff',fontWeight:700,marginTop:1 }}>{v}</div>
                          </div>
                        </div>
                      ))
                  : [['🏛','Host Institution',detail.org],['⏱','Duration',detail.duration],['📊','Target Level',detail.level],['📅','Schedule',detail.schedule],['👥','Enrollment',`${detail.enrolled}/${detail.total} Faculty Enrolled`]]
                      .map(([ic,l,v]) => v && (
                        <div key={l} style={{ display:'flex',gap:12,alignItems:'center',padding:'8px 12px',background:'rgba(255,255,255,0.035)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:10 }}>
                          <span style={{ fontSize:16,flexShrink:0 }}>{ic}</span>
                          <div>
                            <div style={{ fontSize:10.5,color:'rgba(255,255,255,0.4)',fontWeight:800,textTransform:'uppercase',letterSpacing:'.5px' }}>{l}</div>
                            <div style={{ fontSize:13,color:'#fff',fontWeight:700,marginTop:1 }}>{v}</div>
                          </div>
                        </div>
                      ))
                }
              </div>

              {detail.description && (
                <div style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:12, padding:'12px 14px', marginBottom:18 }}>
                  <div style={{ fontSize:10.5, fontWeight:800, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:6 }}>Program Overview</div>
                  <p style={{ color:'rgba(255,255,255,0.7)',fontSize:12.5,lineHeight:1.7,margin:0 }}>{detail.description}</p>
                </div>
              )}

              <button onClick={() => { setDetail(null); setTab(detail._type==='event'?'events':'training'); }} style={{
                width:'100%', background:'linear-gradient(90deg,#f97316,#e11d48)',
                color:'#fff', border:'none', borderRadius:12, padding:'12px',
                fontSize:13.5, fontWeight:800, cursor:'pointer', fontFamily:'inherit',
                boxShadow:'0 4px 16px rgba(249,115,22,0.35)'
              }}>
                ✏️ Edit in {detail._type==='event'?'Events':'Training'} tab →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MESSAGES
═══════════════════════════════════════════════════════════════════ */
function MessagesTab({ showToast }) {
  const [msgs, setMsgs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [open, setOpen]         = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    api.contact.messages()
      .then(setMsgs)
      .catch(() => showToast('Failed to load messages', false))
      .finally(() => setLoading(false));
  }, []);

  async function markRead(msg) {
    if (msg.read) return;
    try {
      await api.contact.markRead(msg.id);
      setMsgs(p => p.map(m => m.id === msg.id ? { ...m, read: true } : m));
    } catch (_) {}
  }

  async function markAllRead() {
    try {
      await api.contact.markAllRead();
      setMsgs(p => p.map(m => ({ ...m, read: true })));
      showToast('All messages marked as read', true);
    } catch (e) { showToast(e.message, false); }
  }

  async function deleteMsg(msg) {
    setDeletingId(msg.id);
    try {
      await api.contact.deleteMessage(msg.id);
      setMsgs(p => p.filter(m => m.id !== msg.id));
      if (open?.id === msg.id) setOpen(null);
      showToast('Message deleted', true);
    } catch (e) { showToast(e.message, false); }
    finally { setDeletingId(null); }
  }

  function openMsg(msg) { setOpen(msg); markRead(msg); }

  const unread = msgs.filter(m => !m.read).length;

  return (
    <div>
      <PageHeader
        title="Contact Messages"
        desc={unread > 0 ? `${unread} unread message${unread > 1 ? 's' : ''}` : 'All messages from the contact form'}
        action={
          unread > 0 ? (
            <button onClick={markAllRead} className="ap-btn ap-btn-ghost" style={{ fontSize:12.5, whiteSpace:'nowrap' }}>
              ✓ Mark All Read
            </button>
          ) : null
        }
      />

      <SectionKPIs items={[
        { label: 'Unread Inquiries', value: unread, icon: '📬', color: '#f87171' },
        { label: 'Processed / Read', value: msgs.filter(m => m.read).length, icon: '✅', color: '#34d399' },
        { label: 'Total Inquiries', value: msgs.length, icon: '📋', color: '#60a5fa' },
      ]} />
      {open && (
        <Modal title="Message Details" onClose={() => setOpen(null)}>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {[
              { l:'From',     v:`${open.name} <${open.email}>` },
              { l:'Category', v:open.category },
              { l:'Subject',  v:open.subject },
              { l:'Received', v:new Date(open.created_at).toLocaleString('en-PH', { dateStyle:'medium', timeStyle:'short' }) },
            ].map(r => (
              <div key={r.l} style={{ display:'flex', gap:10, padding:'8px 12px', background:'rgba(255,255,255,0.04)', borderRadius:9 }}>
                <span style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', width:70, flexShrink:0, paddingTop:2 }}>{r.l}</span>
                <span style={{ fontSize:13, color:'#fff', fontWeight:600 }}>{r.v}</span>
              </div>
            ))}
            <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:9, padding:'12px 14px' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', marginBottom:8 }}>Message</div>
              <p style={{ color:'rgba(255,255,255,0.85)', fontSize:13.5, lineHeight:1.75, margin:0, whiteSpace:'pre-wrap' }}>{open.message}</p>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:4 }}>
              <a href={`mailto:${open.email}?subject=Re: ${encodeURIComponent(open.subject)}`}
                style={{ flex:3, display:'block', textAlign:'center', background:'linear-gradient(90deg,#f97316,#e11d48)', color:'#fff', textDecoration:'none', borderRadius:10, padding:'11px', fontSize:13.5, fontWeight:800 }}>
                ✉ Reply to {open.name}
              </a>
              <button
                onClick={() => deleteMsg(open)}
                disabled={deletingId === open.id}
                className="ap-btn ap-btn-red"
                style={{ flex:1, padding:'11px', borderRadius:10 }}
              >
                {deletingId === open.id ? '…' : '🗑 Delete'}
              </button>
            </div>
          </div>
        </Modal>
      )}
      {loading ? <Loading /> : msgs.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:'rgba(255,255,255,0.3)' }}>
          <div style={{ fontSize:40, marginBottom:10 }}>📭</div>
          <div style={{ fontSize:14 }}>No messages yet</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {msgs.map(m => (
            <div key={m.id} onClick={() => openMsg(m)} style={{
              display:'flex', alignItems:'center', gap:14, padding:'12px 16px',
              background: m.read ? 'rgba(255,255,255,0.03)' : 'rgba(249,115,22,0.07)',
              border:`1px solid ${m.read ? 'rgba(255,255,255,0.07)' : 'rgba(249,115,22,0.25)'}`,
              borderRadius:12, cursor:'pointer', transition:'background .12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = m.read ? 'rgba(255,255,255,0.06)' : 'rgba(249,115,22,0.12)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = m.read ? 'rgba(255,255,255,0.03)' : 'rgba(249,115,22,0.07)'; }}>
              <div style={{ width:38, height:38, borderRadius:10, background:'linear-gradient(135deg,#1e3a8a,#4f46e5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:900, color:'#fff', flexShrink:0 }}>
                {(m.name||'?')[0].toUpperCase()}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
                  <span style={{ fontWeight: m.read ? 600 : 800, color:'#fff', fontSize:13.5 }}>{m.name}</span>
                  {!m.read && <span style={{ background:'#f97316', color:'#fff', borderRadius:5, padding:'1px 7px', fontSize:10.5, fontWeight:800 }}>NEW</span>}
                  <span style={{ fontSize:11.5, color:'rgba(255,255,255,0.35)', background:'rgba(255,255,255,0.07)', borderRadius:5, padding:'1px 7px' }}>{m.category}</span>
                </div>
                <div style={{ fontWeight:700, color: m.read ? 'rgba(255,255,255,0.6)' : '#fff', fontSize:12.5, marginBottom:2 }}>{m.subject}</div>
                <div style={{ color:'rgba(255,255,255,0.35)', fontSize:12, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.message}</div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
                <div style={{ fontSize:11.5, color:'rgba(255,255,255,0.3)' }}>
                  {new Date(m.created_at).toLocaleDateString('en-PH', { month:'short', day:'numeric' })}
                </div>
                <button
                  onClick={e => { e.stopPropagation(); deleteMsg(m); }}
                  disabled={deletingId === m.id}
                  title="Delete message"
                  className="ap-btn ap-btn-red"
                  style={{ padding:'4px 8px', fontSize:11 }}
                >
                  {deletingId === m.id ? '…' : '🗑'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
