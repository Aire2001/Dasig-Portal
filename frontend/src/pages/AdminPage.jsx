import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import ParticleBackground from '../components/ParticleBackground';

/* ─── CSS ───────────────────────────────────────────────────────── */
const CSS = `
  @keyframes modalIn  { from{transform:scale(.94) translateY(12px);opacity:0} to{transform:scale(1) translateY(0);opacity:1} }
  @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes statPop  { from{transform:translateY(14px);opacity:0} to{transform:translateY(0);opacity:1} }
  @keyframes toastIn  { from{transform:translateX(70px) scale(0.9);opacity:0} to{transform:translateX(0) scale(1);opacity:1} }
  @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

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
    items: [{ key:'reports', icon:'📈', label:'Reports' }],
  },
];

/* ─── Shared micro-components ────────────────────────────────────── */
function DInput({ label, name, value, onChange, type='text', as, opts, required, span }) {
  return (
    <div style={span ? { gridColumn: span } : {}}>
      {as !== 'checkbox' && (
        <label style={{ display:'block', fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:5 }}>
          {label}{required && <span style={{ color:'#f97316' }}> *</span>}
        </label>
      )}
      {as === 'select' ? (
        <select name={name} value={value} onChange={onChange} className="ap-input" style={{ cursor:'pointer' }}>
          {opts.map(o => <option key={o} value={o} style={{ background:'#0f172a' }}>{o}</option>)}
        </select>
      ) : as === 'textarea' ? (
        <textarea name={name} value={value} onChange={onChange} rows={3} className="ap-input" style={{ resize:'vertical' }} />
      ) : as === 'checkbox' ? (
        <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', paddingTop:4 }}>
          <input type="checkbox" name={name} checked={value} onChange={onChange}
            style={{ width:16, height:16, accentColor:'#f97316', cursor:'pointer' }} />
          <span style={{ fontSize:13, color:'rgba(255,255,255,0.65)', fontWeight:600 }}>{label}</span>
        </label>
      ) : (
        <input type={type} name={name} value={value} onChange={onChange} className="ap-input" />
      )}
    </div>
  );
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div onClick={onClose} style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.72)', zIndex:9100,
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:24, animation:'fadeIn .16s ease', overflowY:'auto',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background:'#0f1629', border:'1px solid rgba(255,255,255,0.1)',
        borderRadius:20, width:'100%', maxWidth: wide ? 680 : 500,
        boxShadow:'0 40px 100px rgba(0,0,0,0.8)',
        animation:'modalIn .22s cubic-bezier(.34,1.3,.64,1)',
        maxHeight:'92vh', overflowY:'auto', margin:'auto',
      }}>
        <div style={{
          padding:'20px 24px 18px', borderBottom:'1px solid rgba(255,255,255,0.08)',
          display:'flex', justifyContent:'space-between', alignItems:'center',
          position:'sticky', top:0, background:'#0f1629', zIndex:1,
        }}>
          <h3 style={{ color:'#fff', fontWeight:800, fontSize:16, margin:0 }}>{title}</h3>
          <button onClick={onClose} className="ap-btn ap-btn-ghost" style={{ width:32, height:32, padding:0, borderRadius:8, fontSize:14 }}>✕</button>
        </div>
        <div style={{ padding:'22px 24px 26px' }}>{children}</div>
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
        {desc && <p style={{ color:'rgba(255,255,255,0.38)', fontSize:12.5, margin:0 }}>{desc}</p>}
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
                  padding:'10px 16px', fontSize:10.5, fontWeight:800,
                  color:'rgba(255,255,255,0.38)', textTransform:'uppercase',
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
const VALID_TABS = ['dashboard','calendar','users','applications','events','news','training','policies','funding','partnerships','reports'];

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
          <span style={{ background:'rgba(225,29,72,0.18)', color:'#f87171', fontSize:10.5, fontWeight:800, borderRadius:5, padding:'2px 8px', border:'1px solid rgba(225,29,72,0.3)' }}>ADMIN</span>
        </div>
        <div style={{ flex:1 }} />
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:12.5, fontWeight:700, color:'rgba(255,255,255,0.8)' }}>{user?.name || 'Admin'}</div>
            <div style={{ fontSize:10.5, color:'rgba(255,255,255,0.35)' }}>{user?.email}</div>
          </div>
          <div style={{ width:34, height:34, borderRadius:10, background:'linear-gradient(135deg,#1e3a8a,#4f46e5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:900, color:'#fff' }}>{initials}</div>
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
        </main>
      </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════════════════════════════════ */
function DashboardTab({ showToast, setTab }) {
  const [stats, setStats]       = useState(null);
  const [renewals, setRenewals] = useState([]);

  useEffect(() => {
    api.admin.stats().then(setStats).catch(() => showToast('Failed to load stats', false));
    api.admin.renewals().then(r => setRenewals(r.data || [])).catch(() => {});
  }, []);

  if (!stats) return <Loading />;

  const CARDS = [
    { label:'Total Users',       value:stats.users.total,          sub:`${stats.users.member} members`,       icon:'👥', color:'#3b82f6', tab:'users'        },
    { label:'Pending Apps',      value:stats.applications.pending, sub:`awaiting review`,                     icon:'⏳', color:'#f59e0b', tab:'applications'  },
    { label:'Events',            value:stats.events.total,         sub:`${stats.events.totalEnrolled} joined`,icon:'📅', color:'#a855f7', tab:'events'        },
    { label:'Training Programs', value:stats.trainings.total,      sub:`${stats.trainings.totalEnrolled} enrolled`, icon:'🎓', color:'#f43f5e', tab:'training'     },
    { label:'News Articles',     value:stats.news.total,           sub:'published',                           icon:'📰', color:'#14b8a6', tab:'news'          },
    { label:'Partnerships',      value:stats.partnerships.active,  sub:`of ${stats.partnerships.total} total`,icon:'🤝', color:'#8b5cf6', tab:'partnerships'  },
    { label:'Open Funding',      value:stats.funding.open,         sub:`of ${stats.funding.total} listed`,    icon:'💰', color:'#10b981', tab:'funding'       },
    { label:'Active Policies',   value:stats.policies.active,      sub:`${stats.policies.archived} archived`, icon:'📜', color:'#0ea5e9', tab:'policies'      },
  ];

  const evFill    = stats.events.totalCapacity   > 0 ? Math.round(stats.events.totalEnrolled   / stats.events.totalCapacity   * 100) : 0;
  const trFill    = (stats.trainings.total * 20) > 0 ? Math.round(stats.trainings.totalEnrolled / (stats.trainings.total * 20) * 100) : 0;
  const memberPct = stats.users.total            > 0 ? Math.round(stats.users.member            / stats.users.total            * 100) : 0;

  return (
    <div>
      <PageHeader title="Dashboard" desc="Live snapshot of all portal activity" />

      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
        {CARDS.map((c, i) => (
          <div key={c.label} onClick={() => setTab(c.tab)} style={{
            background:`linear-gradient(140deg,${c.color}18,${c.color}08)`,
            border:`1px solid ${c.color}30`,
            borderRadius:14, padding:'18px 16px', cursor:'pointer',
            transition:'transform .2s, box-shadow .2s',
            animation:`statPop .35s ease ${i * .06}s both`,
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 12px 32px ${c.color}20`; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
              <div style={{ fontSize:28, fontWeight:900, color:'#fff', letterSpacing:'-1px' }}>{c.value}</div>
              <div style={{ width:34, height:34, borderRadius:9, background:`${c.color}22`, border:`1px solid ${c.color}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15 }}>{c.icon}</div>
            </div>
            <div style={{ fontSize:12.5, fontWeight:700, color:'rgba(255,255,255,0.75)', marginBottom:2 }}>{c.label}</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.38)' }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Progress bars */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginBottom:24 }}>
        {[
          { label:'Event Fill Rate',   pct:evFill,    color:'#a855f7' },
          { label:'Training Fill Rate',pct:trFill,    color:'#f43f5e' },
          { label:'Member Conversion', pct:memberPct, color:'#3b82f6' },
        ].map(b => (
          <div key={b.label} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'16px 18px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
              <span style={{ fontSize:12.5, color:'rgba(255,255,255,0.6)', fontWeight:700 }}>{b.label}</span>
              <span style={{ fontSize:13, fontWeight:900, color:'#fff' }}>{Math.min(b.pct, 100)}%</span>
            </div>
            <div style={{ height:7, background:'rgba(255,255,255,0.08)', borderRadius:4, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${Math.min(b.pct, 100)}%`, background:`linear-gradient(90deg,${b.color},${b.color}aa)`, borderRadius:4, transition:'width .8s ease' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Renewals */}
      {renewals.length > 0 && (
        <div style={{ background:'rgba(245,158,11,0.07)', border:'1px solid rgba(245,158,11,0.22)', borderRadius:14, padding:'18px 20px' }}>
          <div style={{ fontSize:12, fontWeight:800, color:'#fbbf24', marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
            ⚠ Memberships Expiring Soon
            <span style={{ background:'rgba(245,158,11,0.2)', borderRadius:99, padding:'1px 8px', fontSize:11 }}>{renewals.length}</span>
          </div>
          {renewals.map(r => (
            <div key={r.id} style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'rgba(255,255,255,0.65)', padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
              <span>{r.name} {r.institution ? `— ${r.institution}` : ''}</span>
              <span style={{ color:'#fcd34d', fontWeight:700 }}>Due {r.renewal_due}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   USERS
═══════════════════════════════════════════════════════════════════ */
function UsersTab({ showToast }) {
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleF, setRoleF]   = useState('All');
  const [acting, setActing] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    api.admin.users({ search, role: roleF })
      .then(r => setUsers(r.data || []))
      .catch(() => showToast('Failed to load users', false))
      .finally(() => setLoading(false));
  }, [search, roleF]);

  useEffect(() => { load(); }, [load]);

  async function changeRole(u, role) {
    setActing(u.id + 'r');
    try { await api.admin.changeRole(u.id, role); setUsers(p => p.map(x => x.id === u.id ? { ...x, role } : x)); showToast('Role updated successfully!', true, `${u.name} is now ${role}`); }
    catch (e) { showToast(e.message, false); } finally { setActing(null); }
  }

  async function toggleStatus(u) {
    setActing(u.id + 's');
    try {
      if (u.status === 'INACTIVE') {
        await api.admin.activate(u.id);
        setUsers(p => p.map(x => x.id === u.id ? { ...x, status: 'ACTIVE' } : x));
        showToast('Account activated successfully!', true, `${u.name} can now log in`);
      } else {
        await api.admin.suspend(u.id);
        setUsers(p => p.map(x => x.id === u.id ? { ...x, status: 'INACTIVE' } : x));
        showToast('Account suspended', false, `${u.name} has been suspended`);
      }
    } catch (e) { showToast(e.message, false); } finally { setActing(null); }
  }

  const ROLE_STYLE = {
    ADMIN:  { bg:'rgba(225,29,72,.18)',   color:'#fca5a5' },
    MEMBER: { bg:'rgba(16,185,129,.15)',  color:'#6ee7b7' },
    GUEST:  { bg:'rgba(255,255,255,.07)', color:'rgba(255,255,255,.45)' },
  };

  return (
    <div>
      <PageHeader title="Users" desc="Manage roles and account status" action={
        <div style={{ display:'flex', gap:8 }}>
          <input className="ap-input" placeholder="Search name, email…" value={search} onChange={e => setSearch(e.target.value)} style={{ width:200 }} />
          <select className="ap-input" value={roleF} onChange={e => setRoleF(e.target.value)} style={{ width:120, cursor:'pointer' }}>
            {['All','ADMIN','MEMBER','GUEST'].map(r => <option key={r} value={r} style={{ background:'#0f172a' }}>{r}</option>)}
          </select>
        </div>
      } />

      {loading ? <Loading /> : (
        <DataTable head={['User','Institution','Role','Status','Joined','Actions']}>
          {users.length === 0 ? <EmptyTR cols={6} /> : users.map(u => {
            const rs = ROLE_STYLE[u.role] || ROLE_STYLE.GUEST;
            return (
              <TR key={u.id}>
                <TD>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:34, height:34, borderRadius:9, background:'linear-gradient(135deg,#1e3a8a,#4f46e5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:900, color:'#fff', flexShrink:0 }}>
                      {(u.name || 'U').split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight:700, color:'#fff', fontSize:13 }}>{u.name}</div>
                      <div style={{ fontSize:11.5, color:'rgba(255,255,255,0.38)' }}>{u.email}</div>
                    </div>
                  </div>
                </TD>
                <TD muted>{u.institution || '—'}{u.campus ? `, ${u.campus}` : ''}</TD>
                <TD>
                  <select onChange={e => changeRole(u, e.target.value)} value={u.role} disabled={!!acting}
                    style={{ background:rs.bg, color:rs.color, border:`1px solid ${rs.color}44`, borderRadius:7, padding:'4px 8px', fontSize:11.5, fontWeight:800, cursor:'pointer', fontFamily:'inherit', outline:'none' }}>
                    {['ADMIN','MEMBER','GUEST'].map(r => <option key={r} value={r} style={{ background:'#0f172a' }}>{r}</option>)}
                  </select>
                </TD>
                <TD>
                  <span className="ap-pill" style={{ background: u.status === 'ACTIVE' ? 'rgba(16,185,129,.15)' : 'rgba(255,255,255,.06)', color: u.status === 'ACTIVE' ? '#6ee7b7' : 'rgba(255,255,255,.38)' }}>
                    {u.status === 'ACTIVE' ? '● Active' : '● Inactive'}
                  </span>
                </TD>
                <TD muted>{u.created_at?.slice(0,10) || '—'}</TD>
                <TD>
                  <button onClick={() => toggleStatus(u)} disabled={!!acting} className={`ap-btn ${u.status === 'INACTIVE' ? 'ap-btn-green' : 'ap-btn-red'}`}>
                    {acting === u.id + 's' ? '…' : u.status === 'INACTIVE' ? 'Activate' : 'Suspend'}
                  </button>
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
   APPLICATIONS
═══════════════════════════════════════════════════════════════════ */
function ApplicationsTab({ showToast }) {
  const [apps, setApps]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing]   = useState(null);

  useEffect(() => {
    api.membership.applications().then(setApps).catch(() => showToast('Failed', false)).finally(() => setLoading(false));
  }, []);

  async function approve(a) {
    setActing(a.id);
    try { await api.membership.approve(a.id); setApps(p => p.map(x => x.id === a.id ? { ...x, status:'APPROVED' } : x)); showToast('Application approved successfully!', true, `${a.name} is now a Member`); }
    catch (e) { showToast(e.message, false); } finally { setActing(null); }
  }
  async function reject(a) {
    setActing(a.id);
    try { await api.membership.reject(a.id); setApps(p => p.map(x => x.id === a.id ? { ...x, status:'REJECTED' } : x)); showToast('Application rejected', false, `${a.name}'s request was declined`); }
    catch (e) { showToast(e.message, false); } finally { setActing(null); }
  }

  const STATUS = {
    PENDING:  { bg:'rgba(245,158,11,.18)',  color:'#fcd34d' },
    APPROVED: { bg:'rgba(16,185,129,.15)',  color:'#6ee7b7' },
    REJECTED: { bg:'rgba(225,29,72,.15)',   color:'#fca5a5' },
  };

  return (
    <div>
      <PageHeader title="Applications" desc="Approve or reject membership requests" />
      {loading ? <Loading /> : (
        <DataTable head={['Applicant','Institution','Tier','Applied','Status','Actions']}>
          {apps.length === 0 ? <EmptyTR cols={6} /> : apps.map(a => {
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
                      <div style={{ fontSize:11.5, color:'rgba(255,255,255,0.38)' }}>{a.email}</div>
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
                      <button onClick={() => reject(a)}  disabled={acting === a.id} className="ap-btn ap-btn-red">✕ Reject</button>
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
const EV_BLANK = { title:'', date:'', venue:'', organizer:'', category:'Summit', total:50, description:'', registration_deadline:'' };

function EventsTab({ showToast }) {
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(null);
  const [form, setForm]           = useState(EV_BLANK);
  const [saving, setSaving]       = useState(false);
  const [confirm, setConfirm]     = useState(null);
  const [attnEvent, setAttnEvent] = useState(null);   // event object for attendees modal
  const [attnList, setAttnList]   = useState([]);
  const [attnLoading, setAttnLoading] = useState(false);

  const load = useCallback(() => { setLoading(true); api.events.list({ limit: 1000 }).then(r => setItems(r.data || [])).catch(() => showToast('Failed', false)).finally(() => setLoading(false)); }, []);
  useEffect(load, [load]);
  const fc = e => setForm(p => ({ ...p, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  async function openAttendees(ev) {
    setAttnEvent(ev);
    setAttnLoading(true);
    setAttnList([]);
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
    if (!form.title || !form.date || !form.venue || !form.organizer) { showToast('Fill required fields', false); return; }
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

  const CAT = { Summit:'#a855f7', Workshop:'#3b82f6', Seminar:'#14b8a6', Funding:'#10b981' };

  return (
    <div>
      <PageHeader title="Events" desc="Create and manage consortium events" action={<AddBtn onClick={() => { setForm(EV_BLANK); setModal('create'); }} />} />
      {confirm && <ConfirmModal msg={`Delete "${confirm.title}"?`} onConfirm={() => del(confirm.id, confirm.title)} onCancel={() => setConfirm(null)} />}

      {/* ── Attendees Modal ── */}
      {attnEvent && (
        <Modal title={`Attendance — ${attnEvent.title}`} onClose={() => { setAttnEvent(null); load(); }} wide>
          <div style={{ marginBottom:14, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <span style={{ fontSize:13, fontWeight:700, color:'#fff' }}>
                {attnList.filter(r => r.attended).length} attended
              </span>
              <span style={{ fontSize:12.5, color:'rgba(255,255,255,0.45)', marginLeft:6 }}>
                / {attnList.length} registered
              </span>
            </div>
            <button onClick={() => reloadAttendees(attnEvent)} className="ap-btn ap-btn-ghost" style={{ fontSize:11 }}>↻ Refresh</button>
          </div>
          {attnLoading ? <Loading /> : attnList.length === 0 ? (
            <div style={{ textAlign:'center', padding:'28px 0', color:'rgba(255,255,255,0.35)', fontSize:13 }}>No registrations yet</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {attnList.map(reg => (
                <div key={reg.user_id} style={{
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                  background:'rgba(255,255,255,0.04)', borderRadius:10,
                  padding:'10px 14px', border:'1px solid rgba(255,255,255,0.07)',
                }}>
                  <div>
                    <div style={{ fontWeight:700, color:'#fff', fontSize:13 }}>{reg.users?.name}</div>
                    <div style={{ fontSize:11.5, color:'rgba(255,255,255,0.4)' }}>{reg.users?.email} · {reg.users?.institution}</div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    {reg.attended
                      ? <span className="ap-badge" style={{ background:'rgba(16,185,129,0.18)', color:'#6ee7b7' }}>✓ Attended</span>
                      : <span className="ap-badge" style={{ background:'rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.45)' }}>Absent</span>
                    }
                    <button
                      onClick={() => toggleAttendance(reg, !reg.attended)}
                      className={`ap-btn ${reg.attended ? 'ap-btn-amber' : 'ap-btn-green'}`}
                    >{reg.attended ? 'Mark Absent' : 'Mark Attended'}</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop:16, textAlign:'right' }}>
            <button onClick={() => setAttnEvent(null)} className="ap-btn ap-btn-ghost">Close</button>
          </div>
        </Modal>
      )}

      {modal && (
        <Modal title={modal === 'create' ? 'Create Event' : 'Edit Event'} onClose={() => setModal(null)} wide>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <DInput label="Title *" name="title" value={form.title} onChange={fc} required span="1/-1" />
            <DInput label="Date *" name="date" value={form.date} onChange={fc} type="date" required />
            <DInput label="Registration Deadline" name="registration_deadline" value={form.registration_deadline} onChange={fc} type="date" />
            <DInput label="Venue *" name="venue" value={form.venue} onChange={fc} required />
            <DInput label="Organizer *" name="organizer" value={form.organizer} onChange={fc} required />
            <DInput label="Category" name="category" value={form.category} onChange={fc} as="select" opts={['Summit','Workshop','Seminar','Funding']} />
            <DInput label="Capacity" name="total" value={form.total} onChange={fc} type="number" />
            <DInput label="Description" name="description" value={form.description} onChange={fc} as="textarea" span="1/-1" />
          </div>
          <FormActions onCancel={() => setModal(null)} onSave={save} saving={saving} saveLabel={modal === 'create' ? 'Create Event' : 'Save Changes'} />
        </Modal>
      )}
      {loading ? <Loading /> : (
        <DataTable head={['Event','Date','Category','Fill Rate','Actions']}>
          {items.length === 0 ? <EmptyTR cols={5} /> : items.map(ev => {
            const fill = ev.total > 0 ? Math.round(ev.enrolled / ev.total * 100) : 0;
            const c = CAT[ev.category] || '#a855f7';
            return (
              <TR key={ev.id}>
                <TD>
                  <div style={{ fontWeight:700, color:'#fff' }}>{ev.title}</div>
                  <div style={{ fontSize:11.5, color:'rgba(255,255,255,0.38)', marginTop:2 }}>{ev.venue} · {ev.organizer}</div>
                </TD>
                <TD muted>{ev.date}</TD>
                <TD><span className="ap-badge" style={{ background:`${c}1a`, color:c }}>{ev.category}</span></TD>
                <TD>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ flex:1, height:6, background:'rgba(255,255,255,0.08)', borderRadius:3, overflow:'hidden', minWidth:60 }}>
                      <div style={{ height:'100%', width:`${Math.min(fill,100)}%`, background:`linear-gradient(90deg,${c},${c}aa)`, borderRadius:3 }} />
                    </div>
                    <span style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.55)', width:44 }}>{ev.enrolled}/{ev.total}</span>
                  </div>
                </TD>
                <TD>
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={() => openAttendees(ev)} className="ap-btn ap-btn-green">Attendees</button>
                    <button onClick={() => { setForm({ ...ev }); setModal(ev); }} className="ap-btn ap-btn-blue">Edit</button>
                    <button onClick={() => setConfirm(ev)} className="ap-btn ap-btn-red">Delete</button>
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

  const load = useCallback(() => { setLoading(true); api.news.list({ limit: 1000 }).then(r => setItems(r.data || [])).catch(() => showToast('Failed', false)).finally(() => setLoading(false)); }, []);
  useEffect(load, [load]);
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
    if (!form.title || !form.date) { showToast('Fill required fields', false); return; }
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

  const BC = { Announcement:'#60a5fa', Policy:'#fcd34d', Funding:'#6ee7b7', Training:'#fca5a5', Research:'#c4b5fd' };

  return (
    <div>
      <PageHeader title="News & Announcements" desc="Publish consortium news and updates" action={<AddBtn onClick={() => { setForm(NW_BLANK); setModal('create'); }} />} />
      {confirm && <ConfirmModal msg={`Delete "${confirm.title}"?`} onConfirm={() => del(confirm.id, confirm.title)} onCancel={() => setConfirm(null)} />}
      {modal && (
        <Modal title={modal === 'create' ? 'Publish Article' : 'Edit Article'} onClose={() => setModal(null)} wide>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <DInput label="Title *" name="title" value={form.title} onChange={fc} required span="1/-1" />
            <DInput label="Badge" name="badge" value={form.badge} onChange={fc} as="select" opts={['Announcement','Policy','Funding','Training','Research']} />
            <DInput label="Date *" name="date" value={form.date} onChange={fc} type="date" required />
            <DInput label="Icon (emoji)" name="icon" value={form.icon} onChange={fc} />
            <DInput label="Members Only" name="members_only" value={form.members_only} onChange={fc} as="checkbox" />

            {/* ── Article cover image ── */}
            <div style={{ gridColumn:'1/-1' }}>
              <label style={{ display:'block', fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:8 }}>
                Cover Image <span style={{ color:'rgba(255,255,255,0.25)', fontWeight:400, textTransform:'none' }}>(recommended: 1200×630px)</span>
              </label>
              {form.image_url ? (
                <div style={{ position:'relative', borderRadius:10, overflow:'hidden', marginBottom:8 }}>
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
                  gap:8, height:140, borderRadius:10, cursor:'pointer',
                  border:'2px dashed rgba(255,255,255,0.15)', background:'rgba(255,255,255,0.03)',
                  transition:'all .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(249,115,22,0.5)'; e.currentTarget.style.background='rgba(249,115,22,0.04)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.15)'; e.currentTarget.style.background='rgba(255,255,255,0.03)'; }}
                >
                  <span style={{ fontSize:32 }}>{imgUploading ? '⏳' : '🖼'}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.55)' }}>
                    {imgUploading ? 'Processing image…' : 'Click to upload cover photo'}
                  </span>
                  <span style={{ fontSize:11.5, color:'rgba(255,255,255,0.3)' }}>JPG, PNG, WebP — max 10 MB</span>
                </label>
              )}
              <input id="news-img-upload" id2="news-img-replace" type="file" accept="image/*" onChange={handleImageUpload} style={{ display:'none' }} />
              <input id="news-img-replace" type="file" accept="image/*" onChange={handleImageUpload} style={{ display:'none' }} />
            </div>

            <DInput label="Excerpt" name="excerpt" value={form.excerpt} onChange={fc} as="textarea" span="1/-1" />
            <DInput label="Full Content" name="content" value={form.content} onChange={fc} as="textarea" span="1/-1" />
          </div>
          <FormActions onCancel={() => setModal(null)} onSave={save} saving={saving} saveLabel={modal === 'create' ? 'Publish Article' : 'Save Changes'} />
        </Modal>
      )}
      {loading ? <Loading /> : (
        <DataTable head={['Cover','Title','Badge','Date','Access','Status','Actions']}>
          {items.length === 0 ? <EmptyTR cols={7} /> : items.map(n => {
            const c = BC[n.badge] || '#60a5fa';
            return (
              <TR key={n.id}>
                {/* Cover thumbnail */}
                <TD w={60}>
                  {n.image_url
                    ? <img src={n.image_url} alt="" style={{ width:52, height:34, objectFit:'cover', borderRadius:6, display:'block' }} />
                    : <div style={{ width:52, height:34, borderRadius:6, background:'rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>{n.icon || '📰'}</div>
                  }
                </TD>
                <TD>
                  <div style={{ fontWeight:700, color: n.archived ? 'rgba(255,255,255,0.38)' : '#fff', maxWidth:240, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{n.title}</div>
                  <div style={{ fontSize:11.5, color:'rgba(255,255,255,0.38)', marginTop:2, maxWidth:240, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{n.excerpt}</div>
                </TD>
                <TD><span className="ap-badge" style={{ background:`${c}1a`, color:c }}>{n.badge}</span></TD>
                <TD muted>{String(n.date).slice(0,10)}</TD>
                <TD>
                  <span style={{ fontSize:12, color: n.members_only ? '#fcd34d' : 'rgba(255,255,255,0.38)' }}>
                    {n.members_only ? '🔒 Members' : '🌐 Public'}
                  </span>
                </TD>
                <TD>
                  <span className="ap-pill" style={{ background: n.archived ? 'rgba(255,255,255,0.06)' : 'rgba(16,185,129,0.15)', color: n.archived ? 'rgba(255,255,255,0.35)' : '#6ee7b7' }}>
                    {n.archived ? 'Archived' : '● Active'}
                  </span>
                </TD>
                <TD>
                  <div style={{ display:'flex', gap:5 }}>
                    <button onClick={() => { setForm({ ...n }); setModal(n); }} className="ap-btn ap-btn-blue">Edit</button>
                    <button onClick={() => toggleArchive(n)} className="ap-btn ap-btn-amber">{n.archived ? 'Restore' : 'Archive'}</button>
                    <button onClick={() => setConfirm(n)} className="ap-btn ap-btn-red">Del</button>
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
const TR_BLANK = { icon:'💻', category:'Technology', title:'', org:'', duration:'2 weeks', level:'Beginner', total:20, description:'', schedule:'' };
const TR_DURATIONS = ['1 week','2 weeks','3 weeks','4 weeks','5 weeks','6 weeks','8 weeks','10 weeks','12 weeks','3 months','4 months','6 months'];

function TrainingTab({ showToast }) {
  const [items, setItems]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(null);
  const [form, setForm]             = useState(TR_BLANK);
  const [saving, setSaving]         = useState(false);
  const [confirm, setConfirm]       = useState(null);
  const [enrolEvent, setEnrolEvent] = useState(null);
  const [enrolList, setEnrolList]   = useState([]);
  const [enrolLoading, setEnrolLoading] = useState(false);

  const load = useCallback(() => { setLoading(true); api.training.list({ limit: 1000 }).then(r => setItems(r.data || [])).catch(() => showToast('Failed', false)).finally(() => setLoading(false)); }, []);
  useEffect(load, [load]);
  const fc = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  async function openEnrollments(t) {
    setEnrolEvent(t);
    setEnrolLoading(true);
    setEnrolList([]);
    try { setEnrolList(await api.training.enrollments(t.id)); }
    catch (e) { showToast(e.message, false); }
    finally { setEnrolLoading(false); }
  }

  async function save() {
    if (!form.title || !form.org || !form.duration) { showToast('Fill required fields', false); return; }
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

  const CC = { Technology:'#60a5fa', Research:'#6ee7b7', Leadership:'#fcd34d', Governance:'#c4b5fd' };
  const LC = { Beginner:'#6ee7b7', Intermediate:'#fcd34d', Advanced:'#fca5a5' };

  return (
    <div>
      <PageHeader title="Training Programs" desc="Manage professional development programs" action={<AddBtn onClick={() => { setForm(TR_BLANK); setModal('create'); }} />} />
      {confirm && <ConfirmModal msg={`Delete "${confirm.title}"?`} onConfirm={() => del(confirm.id, confirm.title)} onCancel={() => setConfirm(null)} />}

      {/* Enrollments Modal */}
      {enrolEvent && (
        <Modal title={`Enrollments — ${enrolEvent.title}`} onClose={() => { setEnrolEvent(null); load(); }} wide>
          <div style={{ marginBottom:14, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <span style={{ fontSize:13, fontWeight:700, color:'#fff' }}>{enrolList.length} enrolled</span>
              <span style={{ fontSize:12.5, color:'rgba(255,255,255,0.45)', marginLeft:6 }}>/ {enrolEvent.total} capacity</span>
            </div>
            <button onClick={() => { setEnrolLoading(true); api.training.enrollments(enrolEvent.id).then(setEnrolList).catch(() => {}).finally(() => setEnrolLoading(false)); }} className="ap-btn ap-btn-ghost" style={{ fontSize:11 }}>↻ Refresh</button>
          </div>
          {enrolLoading ? <Loading /> : enrolList.length === 0 ? (
            <div style={{ textAlign:'center', padding:'28px 0', color:'rgba(255,255,255,0.35)', fontSize:13 }}>No enrollments yet</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {enrolList.map(en => (
                <div key={en.id} style={{
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                  background:'rgba(255,255,255,0.04)', borderRadius:10,
                  padding:'10px 14px', border:'1px solid rgba(255,255,255,0.07)',
                }}>
                  <div>
                    <div style={{ fontWeight:700, color:'#fff', fontSize:13 }}>{en.users?.name}</div>
                    <div style={{ fontSize:11.5, color:'rgba(255,255,255,0.4)' }}>{en.users?.email} · {en.users?.institution}</div>
                  </div>
                  <span style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>{new Date(en.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop:16, textAlign:'right' }}>
            <button onClick={() => { setEnrolEvent(null); load(); }} className="ap-btn ap-btn-ghost">Close</button>
          </div>
        </Modal>
      )}

      {modal && (
        <Modal title={modal === 'create' ? 'Create Program' : 'Edit Program'} onClose={() => setModal(null)} wide>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <DInput label="Title *" name="title" value={form.title} onChange={fc} required span="1/-1" />
            <DInput label="Organization *" name="org" value={form.org} onChange={fc} required />
            <DInput label="Duration *" name="duration" value={form.duration} onChange={fc} as="select" opts={TR_DURATIONS} required />
            <DInput label="Category" name="category" value={form.category} onChange={fc} as="select" opts={['Technology','Research','Leadership','Governance']} />
            <DInput label="Level" name="level" value={form.level} onChange={fc} as="select" opts={['Beginner','Intermediate','Advanced']} />
            <DInput label="Capacity" name="total" value={form.total} onChange={fc} type="number" />
            <DInput label="Schedule (Start Date)" name="schedule" value={form.schedule} onChange={fc} type="date" span="1/-1" />
            <DInput label="Description" name="description" value={form.description} onChange={fc} as="textarea" span="1/-1" />
          </div>
          <FormActions onCancel={() => setModal(null)} onSave={save} saving={saving} saveLabel={modal === 'create' ? 'Create Program' : 'Save Changes'} />
        </Modal>
      )}
      {loading ? <Loading /> : (
        <DataTable head={['Program','Category','Level','Fill Rate','Actions']}>
          {items.length === 0 ? <EmptyTR cols={5} /> : items.map(t => {
            const fill = t.total > 0 ? Math.round((t.enrolled || 0) / t.total * 100) : 0;
            const cc = CC[t.category] || '#60a5fa';
            const lc = LC[t.level] || '#6ee7b7';
            return (
              <TR key={t.id}>
                <TD>
                  <div style={{ fontWeight:700, color:'#fff' }}>{t.title}</div>
                  <div style={{ fontSize:11.5, color:'rgba(255,255,255,0.38)', marginTop:2 }}>{t.org} · {t.duration}{t.schedule ? ` · ${t.schedule}` : ''}</div>
                </TD>
                <TD><span className="ap-badge" style={{ background:`${cc}1a`, color:cc }}>{t.category}</span></TD>
                <TD><span className="ap-badge" style={{ background:`${lc}1a`, color:lc }}>{t.level}</span></TD>
                <TD>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ flex:1, height:6, background:'rgba(255,255,255,0.08)', borderRadius:3, overflow:'hidden', minWidth:60 }}>
                      <div style={{ height:'100%', width:`${Math.min(fill,100)}%`, background:'linear-gradient(90deg,#f43f5e,#f97316)', borderRadius:3 }} />
                    </div>
                    <span style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.55)', width:52 }}>{t.enrolled || 0}/{t.total}</span>
                  </div>
                </TD>
                <TD>
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={() => openEnrollments(t)} className="ap-btn ap-btn-green">Enrollees</button>
                    <button onClick={() => { setForm({ ...t }); setModal(t); }} className="ap-btn ap-btn-blue">Edit</button>
                    <button onClick={() => setConfirm(t)} className="ap-btn ap-btn-red">Delete</button>
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

  const load = useCallback(() => { setLoading(true); api.policies.list({ limit: 1000 }).then(r => setItems(r.data || [])).catch(() => showToast('Failed', false)).finally(() => setLoading(false)); }, []);
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
        <Modal title={modal === 'create' ? 'Create Policy' : 'Edit Policy'} onClose={() => setModal(null)} wide>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <DInput label="Title *" name="title" value={form.title} onChange={fc} required span="1/-1" />
            <DInput label="Category" name="category" value={form.category} onChange={fc} as="select" opts={['Membership','Governance','Events','Research']} />
            <DInput label="Effective Date *" name="effective_date" value={form.effective_date} onChange={fc} type="date" required />
            <DInput label="Members Only" name="members_only" value={form.members_only} onChange={fc} as="checkbox" />
            <DInput label="Content *" name="content" value={form.content} onChange={fc} as="textarea" span="1/-1" />
          </div>
          <FormActions onCancel={() => setModal(null)} onSave={save} saving={saving} saveLabel={modal === 'create' ? 'Create Policy' : 'Save Changes'} />
        </Modal>
      )}
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

  const load = useCallback(() => { setLoading(true); api.funding.list({ limit: 1000 }).then(r => setItems(r.data || [])).catch(() => showToast('Failed', false)).finally(() => setLoading(false)); }, []);
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
        <Modal title={modal === 'create' ? 'Create Funding' : 'Edit Funding'} onClose={() => setModal(null)} wide>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <DInput label="Title *" name="title" value={form.title} onChange={fc} required span="1/-1" />
            <DInput label="Category" name="category" value={form.category} onChange={fc} as="select" opts={['Scholarship','Grant','Government Fund','Research Grant']} />
            <DInput label="Status" name="status" value={form.status} onChange={fc} as="select" opts={['Open','Upcoming','Closed']} />
            <DInput label="Provider *" name="provider" value={form.provider} onChange={fc} required />
            <DInput label="Amount" name="amount" value={form.amount} onChange={fc} />
            <DInput label="Deadline *" name="deadline" value={form.deadline} onChange={fc} type="date" required />
            <DInput label="Description" name="description" value={form.description} onChange={fc} as="textarea" span="1/-1" />
            <DInput label="Eligibility" name="eligibility" value={form.eligibility} onChange={fc} as="textarea" span="1/-1" />
          </div>
          <FormActions onCancel={() => setModal(null)} onSave={save} saving={saving} saveLabel={modal === 'create' ? 'Create Funding' : 'Save Changes'} />
        </Modal>
      )}
      {loading ? <Loading /> : (
        <DataTable head={['Title','Provider','Amount','Deadline','Status','Actions']}>
          {items.length === 0 ? <EmptyTR cols={6} /> : items.map(f => {
            const sc = SC[f.status] || '#6ee7b7';
            return (
              <TR key={f.id}>
                <TD>
                  <div style={{ fontWeight:700, color:'#fff' }}>{f.title}</div>
                  <div style={{ fontSize:11.5, color:'rgba(255,255,255,0.38)', marginTop:2 }}>{f.category}</div>
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

  const load = useCallback(() => { setLoading(true); api.partnerships.list({ limit: 1000 }).then(r => setItems(r.data || [])).catch(() => showToast('Failed', false)).finally(() => setLoading(false)); }, []);
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
        <Modal title={modal === 'create' ? 'Create Partnership' : 'Edit Partnership'} onClose={() => setModal(null)} wide>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <DInput label="Partner Name *" name="partner_name" value={form.partner_name} onChange={fc} required span="1/-1" />
            <DInput label="Type" name="type" value={form.type} onChange={fc} as="select" opts={['Academic Partnership','Research Collaboration','Technology Partnership','Funding Partnership']} />
            <DInput label="Status" name="status" value={form.status} onChange={fc} as="select" opts={['Active','Pending','Expired']} />
            <DInput label="Start Date *" name="start_date" value={form.start_date} onChange={fc} type="date" required />
            <DInput label="End Date" name="end_date" value={form.end_date} onChange={fc} type="date" />
            <DInput label="Contact Person" name="contact_person" value={form.contact_person} onChange={fc} />
            <DInput label="Contact Email" name="contact_email" value={form.contact_email} onChange={fc} type="email" />
            <DInput label="Description" name="description" value={form.description} onChange={fc} as="textarea" span="1/-1" />
          </div>
          <FormActions onCancel={() => setModal(null)} onSave={save} saving={saving} saveLabel={modal === 'create' ? 'Create Partnership' : 'Save Changes'} />
        </Modal>
      )}
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
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRef]    = useState(false);
  const [lastFetched, setLast]  = useState(null);

  const load = useCallback((isRefresh = false) => {
    if (isRefresh) setRef(true); else setLoading(true);
    Promise.all([api.admin.reportChatbot(), api.admin.reportEvents(), api.admin.reportTraining()])
      .then(([c,e,t]) => { setChatbot(c); setEvRep(e); setTrRep(t); setLast(new Date()); })
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
          {lastFetched && <span style={{ fontSize:11.5, color:'rgba(255,255,255,0.35)' }}>Live data · {lastFetched.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', second:'2-digit' })}</span>}
          <button onClick={() => load(true)} disabled={refreshing} className="ap-btn ap-btn-ghost" style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ display:'inline-block', animation: refreshing ? 'spin .7s linear infinite' : 'none' }}>↻</span>
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      } />

      {/* Chatbot accuracy panel */}
      <div style={{ background:'rgba(79,70,229,0.07)', border:'1px solid rgba(79,70,229,0.2)', borderRadius:16, padding:'22px 24px', marginBottom:22 }}>
        <div style={{ fontSize:11.5, fontWeight:800, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:16 }}>
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
              <div style={{ fontSize:11.5, color:'rgba(255,255,255,0.38)', marginTop:4 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ marginBottom: chatbot?.topIntents?.length > 0 ? 14 : 0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7, fontSize:12, color:'rgba(255,255,255,0.45)' }}>
            <span>Overall accuracy rate</span>
            <span style={{ fontWeight:800, color:accColor }}>{chatbot?.accuracy || 0}%</span>
          </div>
          <div style={{ height:8, background:'rgba(255,255,255,0.08)', borderRadius:4, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${chatbot?.accuracy || 0}%`, background: chatbot?.accuracy >= 80 ? 'linear-gradient(90deg,#059669,#6ee7b7)' : 'linear-gradient(90deg,#f59e0b,#fcd34d)', borderRadius:4, transition:'width .8s ease' }} />
          </div>
        </div>
        {chatbot?.topIntents?.length > 0 && (
          <div>
            <div style={{ fontSize:10.5, fontWeight:800, color:'rgba(255,255,255,0.28)', textTransform:'uppercase', letterSpacing:'.8px', marginBottom:8 }}>Top Intents</div>
            <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
              {chatbot.topIntents.map(i => (
                <span key={i.intent} style={{ background:'rgba(79,70,229,0.2)', color:'#a5b4fc', border:'1px solid rgba(99,102,241,0.3)', borderRadius:7, padding:'4px 10px', fontSize:12, fontWeight:700 }}>
                  {i.intent} · {i.count}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Event fill rates */}
      <div style={{ marginBottom:22 }}>
        <div style={{ fontSize:11.5, fontWeight:800, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:14 }}>
          📅 Event Fill Rates — {evRep?.summary?.overallFillRate || 0}% average
        </div>
        <DataTable head={['Event','Category','Enrolled','Capacity','Fill Rate']}>
          {(evRep?.events || []).map(ev => (
            <TR key={ev.id}>
              <TD><div style={{ fontWeight:700, color:'#fff' }}>{ev.title}</div></TD>
              <TD muted>{ev.category}</TD>
              <TD muted>{ev.enrolled}</TD>
              <TD muted>{ev.total}</TD>
              <TD>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ flex:1, height:6, background:'rgba(255,255,255,0.08)', borderRadius:3, overflow:'hidden', minWidth:80 }}>
                    <div style={{ height:'100%', width:`${ev.fillRate}%`, background:'linear-gradient(90deg,#7c3aed,#a855f7)', borderRadius:3 }} />
                  </div>
                  <span style={{ fontSize:12, fontWeight:700, color:'#c4b5fd', width:36, textAlign:'right' }}>{ev.fillRate}%</span>
                </div>
              </TD>
            </TR>
          ))}
          {!(evRep?.events?.length) && <EmptyTR cols={5} />}
        </DataTable>
      </div>

      {/* Training enrollment */}
      <div>
        <div style={{ fontSize:11.5, fontWeight:800, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:14 }}>
          🎓 Training Enrollment
        </div>
        <DataTable head={['Program','Org','Level','Enrolled','Fill Rate']}>
          {(trRep?.trainings || []).map(t => (
            <TR key={t.id}>
              <TD><div style={{ fontWeight:700, color:'#fff' }}>{t.title}</div></TD>
              <TD muted>{t.org}</TD>
              <TD muted>{t.level}</TD>
              <TD muted>{t.enrolled}/{t.total}</TD>
              <TD>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ flex:1, height:6, background:'rgba(255,255,255,0.08)', borderRadius:3, overflow:'hidden', minWidth:80 }}>
                    <div style={{ height:'100%', width:`${t.fillRate}%`, background:'linear-gradient(90deg,#be123c,#f43f5e)', borderRadius:3 }} />
                  </div>
                  <span style={{ fontSize:12, fontWeight:700, color:'#fca5a5', width:36, textAlign:'right' }}>{t.fillRate}%</span>
                </div>
              </TD>
            </TR>
          ))}
          {!(trRep?.trainings?.length) && <EmptyTR cols={5} />}
        </DataTable>
      </div>
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
  Summit:   { bg:'rgba(79,70,229,0.4)', border:'rgba(99,102,241,0.7)', text:'#c4b5fd' },
  Workshop: { bg:'rgba(5,150,105,0.4)', border:'rgba(16,185,129,0.7)', text:'#6ee7b7' },
  Seminar:  { bg:'rgba(124,58,237,0.4)',border:'rgba(167,139,250,0.7)',text:'#ddd6fe' },
  Funding:  { bg:'rgba(245,158,11,0.4)',border:'rgba(251,191,36,0.7)', text:'#fde68a' },
};
const TR_CAL_COLORS = {
  Technology:'rgba(37,99,235,0.4)',
  Research:  'rgba(5,150,105,0.4)',
  Leadership:'rgba(217,119,6,0.4)',
  Governance:'rgba(124,58,237,0.4)',
};

function AdminCalendarTab({ showToast, setTab }) {
  const today      = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year,  setYear]  = useState(today.getFullYear());
  const [events,    setEvents]    = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [detail,    setDetail]    = useState(null);

  useEffect(() => {
    Promise.all([
      api.events.list({ limit:1000 }),
      api.training.list({ limit:1000 }),
    ]).then(([ev, tr]) => {
      setEvents(ev.data || []);
      setTrainings(tr.data || []);
    }).catch(() => showToast('Failed to load calendar data', false))
      .finally(() => setLoading(false));
  }, []);

  // All calendar items
  const allItems = [
    ...events.map(e => {
      const r = parseAdminRange(e.date);
      const c = EV_CAL_COLORS[e.category] || EV_CAL_COLORS.Summit;
      return { ...e, startDate:r?.start||null, endDate:r?.end||null, _type:'event', _bg:c.bg, _border:c.border, _text:c.text };
    }),
    ...trainings.map(t => {
      const r = parseAdminRange(t.schedule);
      const bg = TR_CAL_COLORS[t.category] || TR_CAL_COLORS.Technology;
      return { ...t, startDate:r?.start||null, endDate:r?.end||null, _type:'training', _bg:bg, _border:bg.replace('0.4','0.75'), _text:'#fff' };
    }),
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

  const evCount = allItems.filter(i=>i._type==='event').length;
  const trCount = allItems.filter(i=>i._type==='training').length;

  const [selectedDay, setSelectedDay] = useState(null); // { day, items }

  function handleMiniClick(d) {
    if (d < 1 || d > daysInMon) return;
    const items = itemsOnDay(d);
    setSelectedDay(s => s?.day === d ? null : { day: d, items });
    setDetail(null);
  }

  const ROLE_SHORTCUTS = {
    ADMIN: [
      { icon:'📅', label:'Add Event',    action:() => setTab('events')    },
      { icon:'🎓', label:'Add Training', action:() => setTab('training')  },
      { icon:'👥', label:'View Users',   action:() => setTab('users')     },
      { icon:'📊', label:'Reports',      action:() => setTab('reports')   },
    ],
    MEMBER: [
      { icon:'📅', label:'Browse Events',   action:() => {} },
      { icon:'🎓', label:'Enroll Training', action:() => {} },
      { icon:'📋', label:'View Policies',   action:() => {} },
      { icon:'💰', label:'Funding',         action:() => {} },
    ],
    GUEST: [
      { icon:'📅', label:'Upcoming Events', action:() => {} },
      { icon:'👤', label:'Join DASIG',      action:() => {} },
      { icon:'📰', label:'Latest News',     action:() => {} },
      { icon:'🏛', label:'Members',         action:() => {} },
    ],
  };
  // Admin panel is admin-only, so always show ADMIN shortcuts
  const shortcuts = ROLE_SHORTCUTS.ADMIN;

  return (
    <div style={{ display:'flex', gap:0, height:'calc(100vh - 140px)', overflow:'hidden' }}>

      {/* ── Left sidebar ── */}
      <div style={{ width:220, flexShrink:0, padding:'4px 16px 16px 0', overflowY:'auto', borderRight:'1px solid rgba(255,255,255,0.06)' }}>

        {/* Mini calendar — clickable */}
        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'14px 12px', marginBottom:12 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <span style={{ color:'#fff', fontWeight:800, fontSize:13 }}>{MONTH_NAMES_LONG[month].slice(0,3)} {year}</span>
            <div style={{ display:'flex', gap:2 }}>
              <button onClick={prevMon} style={{ background:'none',border:'none',color:'rgba(255,255,255,0.5)',cursor:'pointer',fontSize:14,padding:'2px 5px',borderRadius:4,transition:'color .12s' }}
                onMouseEnter={e=>e.currentTarget.style.color='#fff'}
                onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.5)'}
              >‹</button>
              <button onClick={nextMon} style={{ background:'none',border:'none',color:'rgba(255,255,255,0.5)',cursor:'pointer',fontSize:14,padding:'2px 5px',borderRadius:4,transition:'color .12s' }}
                onMouseEnter={e=>e.currentTarget.style.color='#fff'}
                onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.5)'}
              >›</button>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', marginBottom:4 }}>
            {['M','T','W','T','F','S','S'].map((d,i) => (
              <div key={i} style={{ textAlign:'center', fontSize:9.5, fontWeight:700, color:'rgba(255,255,255,0.28)' }}>{d}</div>
            ))}
          </div>
          {miniGrid.map((row,ri) => (
            <div key={ri} style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)' }}>
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
                      width:22, height:22, borderRadius:'50%', fontSize:10.5, transition:'all .12s',
                      fontWeight: isT || isSel ? 900 : 400,
                      color: isT ? '#fff' : isSel ? '#fff' : inM ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.18)',
                      background: isT ? '#f97316' : isSel ? '#3b82f6' : 'transparent',
                      boxShadow: isSel ? '0 0 0 2px rgba(59,130,246,0.4)' : 'none',
                    }}>{inM ? d : ''}</span>
                    {/* Event/training dots */}
                    {inM && !isT && !isSel && (evCnt > 0 || trCnt > 0) && (
                      <div style={{ position:'absolute', bottom:0, left:'50%', transform:'translateX(-50%)', display:'flex', gap:2 }}>
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
          <div style={{ background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.25)', borderRadius:12, padding:'12px 12px', marginBottom:12, animation:'modalIn .18s ease' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <div>
                <div style={{ color:'rgba(255,255,255,0.45)', fontSize:9.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'.5px' }}>
                  {MONTH_NAMES_LONG[month].slice(0,3)} {selectedDay.day}
                </div>
                <div style={{ color:'#fff', fontWeight:900, fontSize:13, marginTop:1 }}>
                  {selectedDay.items.length === 0 ? 'No items' : `${selectedDay.items.length} scheduled`}
                </div>
              </div>
              <button onClick={() => setSelectedDay(null)} style={{ background:'none',border:'none',color:'rgba(255,255,255,0.35)',cursor:'pointer',fontSize:14,lineHeight:1,padding:2 }}>✕</button>
            </div>

            {selectedDay.items.length === 0 ? (
              <div>
                <p style={{ color:'rgba(255,255,255,0.35)', fontSize:11, margin:'0 0 8px', lineHeight:1.5 }}>Nothing scheduled on this day.</p>
                <button onClick={() => setTab('events')} style={{ width:'100%', background:'linear-gradient(90deg,#f97316,#e11d48)', color:'#fff', border:'none', borderRadius:8, padding:'7px', fontSize:11.5, fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}>
                  ＋ Add Event on this date
                </button>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                {selectedDay.items.map(it => (
                  <div key={it.id} onClick={() => { setDetail(it); setSelectedDay(null); }}
                    style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 8px', background: it._type==='event' ? 'rgba(129,140,248,0.12)' : 'rgba(52,211,153,0.12)', border: `1px solid ${it._type==='event' ? 'rgba(129,140,248,0.3)' : 'rgba(52,211,153,0.3)'}`, borderRadius:8, cursor:'pointer', transition:'all .13s' }}
                    onMouseEnter={e=>e.currentTarget.style.background= it._type==='event' ? 'rgba(129,140,248,0.22)' : 'rgba(52,211,153,0.22)'}
                    onMouseLeave={e=>e.currentTarget.style.background= it._type==='event' ? 'rgba(129,140,248,0.12)' : 'rgba(52,211,153,0.12)'}
                  >
                    <span style={{ fontSize:12, flexShrink:0 }}>{it._type==='event' ? '📅' : '🎓'}</span>
                    <span style={{ fontSize:11, fontWeight:700, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{it.title}</span>
                    <span style={{ fontSize:9.5, color: it._type==='event' ? '#a5b4fc' : '#6ee7b7', flexShrink:0, fontWeight:700 }}>{it._type==='event' ? it.category : it.level}</span>
                  </div>
                ))}
                <button onClick={() => setTab('events')} style={{ marginTop:2, background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.55)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'6px', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                  ＋ Add more
                </button>
              </div>
            )}
          </div>
        )}

        {/* Role-based quick shortcuts */}
        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'12px', marginBottom:14 }}>
          <div style={{ fontSize:10, fontWeight:800, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'.6px', marginBottom:10 }}>
            ⚡ Quick Shortcuts
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
            {shortcuts.map(s => (
              <button key={s.label} onClick={s.action} style={{
                background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)',
                borderRadius:9, padding:'9px 6px', cursor:'pointer', fontFamily:'inherit',
                display:'flex', flexDirection:'column', alignItems:'center', gap:4,
                transition:'all .15s',
              }}
              onMouseEnter={e=>{e.currentTarget.style.background='rgba(249,115,22,0.12)';e.currentTarget.style.borderColor='rgba(249,115,22,0.3)';}}
              onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.05)';e.currentTarget.style.borderColor='rgba(255,255,255,0.08)';}}
              >
                <span style={{ fontSize:18 }}>{s.icon}</span>
                <span style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.6)', textAlign:'center', lineHeight:1.2 }}>{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:10, fontWeight:800, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'.6px', marginBottom:8 }}>My Calendars</div>
          {[
            { color:'#818cf8', label:`Events (${evCount})`,   key:'event'    },
            { color:'#34d399', label:`Training (${trCount})`, key:'training' },
          ].map(l => (
            <div key={l.key} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:7 }}>
              <div style={{ width:10, height:10, borderRadius:3, background:l.color, flexShrink:0 }} />
              <span style={{ fontSize:12, color:'rgba(255,255,255,0.65)', fontWeight:600 }}>{l.label}</span>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div style={{ fontSize:10, fontWeight:800, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'.6px', marginBottom:8 }}>Quick Actions</div>
        {[
          { label:'＋ Add Event', action:() => setTab('events') },
          { label:'＋ Add Training', action:() => setTab('training') },
        ].map(a => (
          <button key={a.label} onClick={a.action} style={{
            display:'block', width:'100%', textAlign:'left', background:'transparent',
            border:'none', color:'rgba(255,255,255,0.55)', fontSize:12.5, fontWeight:600,
            cursor:'pointer', padding:'6px 0', fontFamily:'inherit', transition:'color .13s',
          }}
          onMouseEnter={e=>e.currentTarget.style.color='#f97316'}
          onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.55)'}
          >{a.label}</button>
        ))}
      </div>

      {/* ── Main calendar ── */}
      <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column', paddingLeft:20 }}>

        {/* Toolbar */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, flexShrink:0 }}>
          <button onClick={goToday} style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.14)', borderRadius:8, padding:'7px 16px', color:'rgba(255,255,255,0.8)', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'all .13s' }}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.13)'}
            onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.07)'}
          >Today</button>
          <div style={{ display:'flex', gap:2 }}>
            {[['‹',prevMon],['›',nextMon]].map(([ch,fn])=>(
              <button key={ch} onClick={fn} style={{ background:'none',border:'1px solid rgba(255,255,255,0.12)',borderRadius:7,width:32,height:32,color:'rgba(255,255,255,0.65)',fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .13s' }}
                onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.09)';e.currentTarget.style.color='#fff';}}
                onMouseLeave={e=>{e.currentTarget.style.background='none';e.currentTarget.style.color='rgba(255,255,255,0.65)';}}
              >{ch}</button>
            ))}
          </div>
          <h2 style={{ color:'#fff', fontWeight:900, fontSize:18, letterSpacing:'-0.3px', margin:0 }}>
            {MONTH_NAMES_LONG[month]} {year}
          </h2>
          <div style={{ marginLeft:'auto', display:'flex', gap:8, alignItems:'center' }}>
            <span style={{ fontSize:12, color:'rgba(255,255,255,0.35)' }}>
              {allItems.filter(i=>{ const m=i.startDate?.getMonth(); return m===month; }).length} items this month
            </span>
            <button onClick={() => setTab('events')} style={{ background:'linear-gradient(90deg,#f97316,#e11d48)', color:'#fff', border:'none', borderRadius:9, padding:'8px 16px', fontSize:12.5, fontWeight:800, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:6 }}>
              ＋ New Event
            </button>
          </div>
        </div>

        {/* Day headers Mon–Sun */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', borderBottom:'1px solid rgba(255,255,255,0.08)', paddingBottom:6, marginBottom:0, flexShrink:0 }}>
          {DAY_LABELS.map((d,i) => (
            <div key={d} style={{ textAlign:'center', fontSize:11.5, fontWeight:700, color: i>=5 ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.45)', letterSpacing:'.5px', textTransform:'uppercase' }}>{d}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.3)' }}>
            <div style={{ textAlign:'center' }}><div style={{ fontSize:32, marginBottom:8 }}>⏳</div>Loading calendar…</div>
          </div>
        ) : (
          /* Week rows */
          <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column' }}>
            {weeks.map((wDays, wi) => {
              const bars = getWeekBars(wDays);
              const maxRow = bars.reduce((mx,b)=>Math.max(mx,b.row), -1);
              return (
                <div key={wi} style={{ flex:1, minHeight:90, borderBottom:'1px solid rgba(255,255,255,0.05)', display:'flex', flexDirection:'column' }}>
                  {/* Event bars */}
                  {bars.length > 0 && (
                    <div style={{
                      display:'grid', gridTemplateColumns:'repeat(7,1fr)',
                      gridTemplateRows:`repeat(${maxRow+1}, 22px)`,
                      gap:2, padding:'4px 4px 2px', flexShrink:0,
                      minHeight:(maxRow+1)*24+8,
                    }}>
                      {bars.map((item,ii) => {
                        const lR = item.isStart ? 5 : 0;
                        const rR = item.isEnd   ? 5 : 0;
                        return (
                          <div
                            key={`${item.id}-w${wi}-${ii}`}
                            title={item.title}
                            onClick={() => setDetail(item)}
                            style={{
                              gridColumnStart: item.sCol+1, gridColumnEnd: item.eCol+2,
                              gridRowStart: item.row+1,
                              background: item._bg,
                              border: `1px solid ${item._border}`,
                              borderRadius: `${lR}px ${rR}px ${rR}px ${lR}px`,
                              padding: '1px 7px',
                              cursor:'pointer', overflow:'hidden',
                              display:'flex', alignItems:'center', gap:5,
                              transition:'filter .12s',
                            }}
                            onMouseEnter={e=>e.currentTarget.style.filter='brightness(1.25)'}
                            onMouseLeave={e=>e.currentTarget.style.filter='none'}
                          >
                            {item._type === 'training' && <span style={{ fontSize:8, flexShrink:0, opacity:0.8 }}>🎓</span>}
                            {!item.isStart && <span style={{ fontSize:9, color:item._text, opacity:0.5, flexShrink:0 }}>◀</span>}
                            <span style={{ fontSize:10.5, fontWeight:700, color:item._text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>
                              {item.title}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {/* Day number cells */}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', flex:1 }}>
                    {wDays.map((d, di) => {
                      const inM = d >= 1 && d <= daysInMon;
                      const isT = inM && d===today.getDate() && month===today.getMonth() && year===today.getFullYear();
                      const isWE = di >= 5;
                      return (
                        <div key={di} style={{ borderLeft: di>0 ? '1px solid rgba(255,255,255,0.04)' : 'none', padding:'4px 7px', background: isT ? 'rgba(249,115,22,0.05)' : 'transparent' }}>
                          <div style={{
                            width:24, height:24, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                            background: isT ? '#f97316' : 'transparent',
                            fontSize:12, fontWeight: isT ? 900 : 400,
                            color: isT ? '#fff' : inM ? (isWE ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.65)') : 'rgba(255,255,255,0.18)',
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
        <div onClick={() => setDetail(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:9100, display:'flex', alignItems:'flex-start', justifyContent:'flex-end', padding:20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#0f172a', border:'1px solid rgba(255,255,255,0.12)', borderRadius:20, width:340, maxHeight:'80vh', overflow:'auto', animation:'modalIn .22s ease', boxShadow:'0 24px 80px rgba(0,0,0,0.7)' }}>
            <div style={{ background: detail._type==='event' ? (EV_CAL_COLORS[detail.category]?.bg?.replace('0.4','0.7') || 'rgba(79,70,229,0.7)') : TR_CAL_COLORS[detail.category]?.replace('0.4','0.7'), padding:'18px 20px 16px', position:'relative' }}>
              <button onClick={()=>setDetail(null)} style={{ position:'absolute',top:12,right:12,background:'rgba(255,255,255,0.18)',border:'none',borderRadius:'50%',width:28,height:28,color:'#fff',fontSize:14,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>✕</button>
              <div style={{ fontSize:10.5, fontWeight:700, color:'rgba(255,255,255,0.65)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:5 }}>
                {detail._type === 'event' ? `📅 ${detail.category}` : `🎓 ${detail.category}`}
              </div>
              <div style={{ color:'#fff', fontSize:16, fontWeight:900, lineHeight:1.35 }}>{detail.title}</div>
            </div>
            <div style={{ padding:'16px 20px' }}>
              {detail._type === 'event'
                ? [['📅','Date',detail.date],['📍','Venue',detail.venue],['🏛','Organizer',detail.organizer],['👥','Seats',`${detail.enrolled}/${detail.total}`]]
                    .map(([ic,l,v]) => v && (
                      <div key={l} style={{ display:'flex',gap:10,marginBottom:10 }}>
                        <span style={{ fontSize:14,flexShrink:0 }}>{ic}</span>
                        <div><div style={{ fontSize:10,color:'rgba(255,255,255,0.3)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.5px' }}>{l}</div><div style={{ fontSize:13,color:'#fff',fontWeight:600 }}>{v}</div></div>
                      </div>
                    ))
                : [['🏛','Organizer',detail.org],['⏱','Duration',detail.duration],['📊','Level',detail.level],['📅','Schedule',detail.schedule],['👥','Enrollment',`${detail.enrolled}/${detail.total}`]]
                    .map(([ic,l,v]) => v && (
                      <div key={l} style={{ display:'flex',gap:10,marginBottom:10 }}>
                        <span style={{ fontSize:14,flexShrink:0 }}>{ic}</span>
                        <div><div style={{ fontSize:10,color:'rgba(255,255,255,0.3)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.5px' }}>{l}</div><div style={{ fontSize:13,color:'#fff',fontWeight:600 }}>{v}</div></div>
                      </div>
                    ))
              }
              {detail.description && <p style={{ color:'rgba(255,255,255,0.5)',fontSize:12.5,lineHeight:1.65,marginBottom:14 }}>{detail.description}</p>}
              <button onClick={() => { setDetail(null); setTab(detail._type==='event'?'events':'training'); }} style={{ width:'100%', background:'linear-gradient(90deg,#f97316,#e11d48)', color:'#fff', border:'none', borderRadius:11, padding:'11px', fontSize:13.5, fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}>
                Edit in {detail._type==='event'?'Events':'Training'} tab →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
