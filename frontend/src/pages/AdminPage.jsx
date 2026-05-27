import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

/* ─── CSS ───────────────────────────────────────────────────────── */
const CSS = `
  @keyframes modalIn  { from{transform:scale(.94) translateY(12px);opacity:0} to{transform:scale(1) translateY(0);opacity:1} }
  @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes statPop  { from{transform:translateY(14px);opacity:0} to{transform:translateY(0);opacity:1} }
  @keyframes toastIn  { from{transform:translateX(-50%) translateY(20px);opacity:0} to{transform:translateX(-50%) translateY(0);opacity:1} }

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
    items: [{ key:'dashboard', icon:'⊞', label:'Dashboard' }],
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

function Toast({ msg, ok }) {
  return (
    <div style={{
      position:'fixed', bottom:28, left:'50%', transform:'translateX(-50%)',
      background: ok ? '#059669' : '#e11d48',
      color:'#fff', borderRadius:10, padding:'11px 24px',
      fontSize:13.5, fontWeight:700, zIndex:9999,
      boxShadow:'0 8px 32px rgba(0,0,0,0.45)',
      animation:'toastIn .28s ease', whiteSpace:'nowrap',
    }}>{ok ? '✓' : '✕'} {msg}</div>
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
const VALID_TABS = ['dashboard','users','applications','events','news','training','policies','funding','partnerships','reports'];

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

  function showToast(msg, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3200);
  }

  const initials = (user?.name || user?.full_name || 'A').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh', background:'#060d1f', fontFamily:'inherit' }}>
      <style>{CSS}</style>
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}

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
            <div style={{ fontSize:12.5, fontWeight:700, color:'rgba(255,255,255,0.8)' }}>{user?.name || user?.full_name || 'Admin'}</div>
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
    try { await api.admin.changeRole(u.id, role); setUsers(p => p.map(x => x.id === u.id ? { ...x, role } : x)); showToast(`${u.name} → ${role}`); }
    catch (e) { showToast(e.message, false); } finally { setActing(null); }
  }

  async function toggleStatus(u) {
    setActing(u.id + 's');
    try {
      if (u.status === 'INACTIVE') {
        await api.admin.activate(u.id);
        setUsers(p => p.map(x => x.id === u.id ? { ...x, status: 'ACTIVE' } : x));
        showToast(`${u.name} activated`);
      } else {
        await api.admin.suspend(u.id);
        setUsers(p => p.map(x => x.id === u.id ? { ...x, status: 'INACTIVE' } : x));
        showToast(`${u.name} suspended`, false);
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
    try { await api.membership.approve(a.id); setApps(p => p.map(x => x.id === a.id ? { ...x, status:'APPROVED' } : x)); showToast(`Approved ${a.name}`); }
    catch (e) { showToast(e.message, false); } finally { setActing(null); }
  }
  async function reject(a) {
    setActing(a.id);
    try { await api.membership.reject(a.id); setApps(p => p.map(x => x.id === a.id ? { ...x, status:'REJECTED' } : x)); showToast(`Rejected ${a.name}`, false); }
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
const EV_BLANK = { title:'', date:'', venue:'', organizer:'', category:'Summit', total:50, description:'' };

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

  const load = () => { setLoading(true); api.events.list().then(r => setItems(r.data || [])).catch(() => showToast('Failed', false)).finally(() => setLoading(false)); };
  useEffect(load, []);
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
      showToast(attended ? 'Marked as attended' : 'Marked as absent');
    } catch (e) { showToast(e.message, false); }
  }

  async function save() {
    if (!form.title || !form.date || !form.venue || !form.organizer) { showToast('Fill required fields', false); return; }
    setSaving(true);
    try {
      const body = { ...form, total: Number(form.total) || 50 };
      if (modal === 'create') { const r = await api.events.create(body); setItems(p => [r.event || r, ...p]); showToast('Event created!'); }
      else { await api.events.update(modal.id, body); setItems(p => p.map(x => x.id === modal.id ? { ...x, ...body } : x)); showToast('Event updated!'); }
      setModal(null);
    } catch (e) { showToast(e.message, false); } finally { setSaving(false); }
  }
  async function del(id) {
    try { await api.events.delete(id); setItems(p => p.filter(x => x.id !== id)); showToast('Deleted'); setConfirm(null); }
    catch (e) { showToast(e.message, false); }
  }

  const CAT = { Summit:'#a855f7', Workshop:'#3b82f6', Seminar:'#14b8a6', Funding:'#10b981' };

  return (
    <div>
      <PageHeader title="Events" desc="Create and manage consortium events" action={<AddBtn onClick={() => { setForm(EV_BLANK); setModal('create'); }} />} />
      {confirm && <ConfirmModal msg={`Delete "${confirm.title}"?`} onConfirm={() => del(confirm.id)} onCancel={() => setConfirm(null)} />}

      {/* ── Attendees Modal ── */}
      {attnEvent && (
        <Modal title={`Attendance — ${attnEvent.title}`} onClose={() => setAttnEvent(null)} wide>
          <div style={{ marginBottom:14, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:12.5, color:'rgba(255,255,255,0.45)' }}>
              {attnList.filter(r => r.attended).length} / {attnList.length} attended
            </span>
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
const NW_BLANK = { icon:'📣', badge:'Announcement', date:'', title:'', excerpt:'', content:'', members_only:false };

function NewsTab({ showToast }) {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null);
  const [form, setForm]       = useState(NW_BLANK);
  const [saving, setSaving]   = useState(false);
  const [confirm, setConfirm] = useState(null);

  const load = () => { setLoading(true); api.news.list().then(r => setItems(r.data || [])).catch(() => showToast('Failed', false)).finally(() => setLoading(false)); };
  useEffect(load, []);
  const fc = e => setForm(p => ({ ...p, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  async function save() {
    if (!form.title || !form.date) { showToast('Fill required fields', false); return; }
    setSaving(true);
    try {
      if (modal === 'create') { const r = await api.news.create(form); setItems(p => [r.article || r, ...p]); showToast('Article published!'); }
      else { await api.news.update(modal.id, form); setItems(p => p.map(x => x.id === modal.id ? { ...x, ...form } : x)); showToast('Article updated!'); }
      setModal(null);
    } catch (e) { showToast(e.message, false); } finally { setSaving(false); }
  }
  async function del(id) {
    try { await api.news.delete(id); setItems(p => p.filter(x => x.id !== id)); showToast('Deleted'); setConfirm(null); }
    catch (e) { showToast(e.message, false); }
  }

  const BC = { Announcement:'#60a5fa', Policy:'#fcd34d', Funding:'#6ee7b7', Training:'#fca5a5', Research:'#c4b5fd' };

  return (
    <div>
      <PageHeader title="News & Announcements" desc="Publish consortium news and updates" action={<AddBtn onClick={() => { setForm(NW_BLANK); setModal('create'); }} />} />
      {confirm && <ConfirmModal msg={`Delete "${confirm.title}"?`} onConfirm={() => del(confirm.id)} onCancel={() => setConfirm(null)} />}
      {modal && (
        <Modal title={modal === 'create' ? 'Publish Article' : 'Edit Article'} onClose={() => setModal(null)} wide>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <DInput label="Title *" name="title" value={form.title} onChange={fc} required span="1/-1" />
            <DInput label="Badge" name="badge" value={form.badge} onChange={fc} as="select" opts={['Announcement','Policy','Funding','Training','Research']} />
            <DInput label="Date *" name="date" value={form.date} onChange={fc} type="date" required />
            <DInput label="Icon (emoji)" name="icon" value={form.icon} onChange={fc} />
            <DInput label="Members Only" name="members_only" value={form.members_only} onChange={fc} as="checkbox" />
            <DInput label="Excerpt" name="excerpt" value={form.excerpt} onChange={fc} as="textarea" span="1/-1" />
            <DInput label="Full Content" name="content" value={form.content} onChange={fc} as="textarea" span="1/-1" />
          </div>
          <FormActions onCancel={() => setModal(null)} onSave={save} saving={saving} saveLabel={modal === 'create' ? 'Publish Article' : 'Save Changes'} />
        </Modal>
      )}
      {loading ? <Loading /> : (
        <DataTable head={['Title','Badge','Date','Access','Actions']}>
          {items.length === 0 ? <EmptyTR cols={5} /> : items.map(n => {
            const c = BC[n.badge] || '#60a5fa';
            return (
              <TR key={n.id}>
                <TD>
                  <div style={{ fontWeight:700, color:'#fff', maxWidth:280, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{n.title}</div>
                  <div style={{ fontSize:11.5, color:'rgba(255,255,255,0.38)', marginTop:2, maxWidth:280, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{n.excerpt}</div>
                </TD>
                <TD><span className="ap-badge" style={{ background:`${c}1a`, color:c }}>{n.badge}</span></TD>
                <TD muted>{String(n.date).slice(0,10)}</TD>
                <TD>
                  <span style={{ fontSize:12, color: n.members_only ? '#fcd34d' : 'rgba(255,255,255,0.38)' }}>
                    {n.members_only ? '🔒 Members' : '🌐 Public'}
                  </span>
                </TD>
                <TD>
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={() => { setForm({ ...n }); setModal(n); }} className="ap-btn ap-btn-blue">Edit</button>
                    <button onClick={() => setConfirm(n)} className="ap-btn ap-btn-red">Delete</button>
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
const TR_BLANK = { icon:'💻', category:'Technology', title:'', org:'', duration:'', level:'Beginner', total:20, description:'' };

function TrainingTab({ showToast }) {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null);
  const [form, setForm]       = useState(TR_BLANK);
  const [saving, setSaving]   = useState(false);
  const [confirm, setConfirm] = useState(null);

  const load = () => { setLoading(true); api.training.list().then(r => setItems(r.data || [])).catch(() => showToast('Failed', false)).finally(() => setLoading(false)); };
  useEffect(load, []);
  const fc = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  async function save() {
    if (!form.title || !form.org || !form.duration) { showToast('Fill required fields', false); return; }
    setSaving(true);
    try {
      const body = { ...form, total: Number(form.total) || 20 };
      if (modal === 'create') { const r = await api.training.create(body); setItems(p => [r.training || r, ...p]); showToast('Program created!'); }
      else { await api.training.update(modal.id, body); setItems(p => p.map(x => x.id === modal.id ? { ...x, ...body } : x)); showToast('Program updated!'); }
      setModal(null);
    } catch (e) { showToast(e.message, false); } finally { setSaving(false); }
  }
  async function del(id) {
    try { await api.training.delete(id); setItems(p => p.filter(x => x.id !== id)); showToast('Deleted'); setConfirm(null); }
    catch (e) { showToast(e.message, false); }
  }

  const CC = { Technology:'#60a5fa', Research:'#6ee7b7', Leadership:'#fcd34d', Governance:'#c4b5fd' };
  const LC = { Beginner:'#6ee7b7', Intermediate:'#fcd34d', Advanced:'#fca5a5' };

  return (
    <div>
      <PageHeader title="Training Programs" desc="Manage professional development programs" action={<AddBtn onClick={() => { setForm(TR_BLANK); setModal('create'); }} />} />
      {confirm && <ConfirmModal msg={`Delete "${confirm.title}"?`} onConfirm={() => del(confirm.id)} onCancel={() => setConfirm(null)} />}
      {modal && (
        <Modal title={modal === 'create' ? 'Create Program' : 'Edit Program'} onClose={() => setModal(null)} wide>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <DInput label="Title *" name="title" value={form.title} onChange={fc} required span="1/-1" />
            <DInput label="Organization *" name="org" value={form.org} onChange={fc} required />
            <DInput label="Duration *" name="duration" value={form.duration} onChange={fc} required />
            <DInput label="Category" name="category" value={form.category} onChange={fc} as="select" opts={['Technology','Research','Leadership','Governance']} />
            <DInput label="Level" name="level" value={form.level} onChange={fc} as="select" opts={['Beginner','Intermediate','Advanced']} />
            <DInput label="Capacity" name="total" value={form.total} onChange={fc} type="number" />
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
                  <div style={{ fontSize:11.5, color:'rgba(255,255,255,0.38)', marginTop:2 }}>{t.org} · {t.duration}</div>
                </TD>
                <TD><span className="ap-badge" style={{ background:`${cc}1a`, color:cc }}>{t.category}</span></TD>
                <TD><span className="ap-badge" style={{ background:`${lc}1a`, color:lc }}>{t.level}</span></TD>
                <TD>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ flex:1, height:6, background:'rgba(255,255,255,0.08)', borderRadius:3, overflow:'hidden', minWidth:60 }}>
                      <div style={{ height:'100%', width:`${Math.min(fill,100)}%`, background:'linear-gradient(90deg,#f43f5e,#f97316)', borderRadius:3 }} />
                    </div>
                    <span style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.55)', width:44 }}>{t.enrolled || 0}/{t.total}</span>
                  </div>
                </TD>
                <TD>
                  <div style={{ display:'flex', gap:6 }}>
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

  const load = () => { setLoading(true); api.policies.list().then(r => setItems(r.data || [])).catch(() => showToast('Failed', false)).finally(() => setLoading(false)); };
  useEffect(load, []);
  const fc = e => setForm(p => ({ ...p, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  async function save() {
    if (!form.title || !form.content || !form.effective_date) { showToast('Fill required fields', false); return; }
    setSaving(true);
    try {
      if (modal === 'create') { const r = await api.policies.create(form); setItems(p => [r.policy || r, ...p]); showToast('Policy created!'); }
      else { await api.policies.update(modal.id, form); setItems(p => p.map(x => x.id === modal.id ? { ...x, ...form } : x)); showToast('Policy updated!'); }
      setModal(null);
    } catch (e) { showToast(e.message, false); } finally { setSaving(false); }
  }
  async function toggleArchive(p) {
    try { await api.policies.archive(p.id, !p.archived); setItems(prev => prev.map(x => x.id === p.id ? { ...x, archived: !p.archived } : x)); showToast(p.archived ? 'Restored' : 'Archived'); }
    catch (e) { showToast(e.message, false); }
  }
  async function del(id) {
    try { await api.policies.delete(id); setItems(p => p.filter(x => x.id !== id)); showToast('Deleted'); setConfirm(null); }
    catch (e) { showToast(e.message, false); }
  }

  const CC = { Membership:'#60a5fa', Governance:'#c4b5fd', Events:'#fcd34d', Research:'#6ee7b7' };

  return (
    <div>
      <PageHeader title="Policies & Guidelines" desc="Manage governance documents" action={<AddBtn onClick={() => { setForm(PL_BLANK); setModal('create'); }} />} />
      {confirm && <ConfirmModal msg={`Delete "${confirm.title}"?`} onConfirm={() => del(confirm.id)} onCancel={() => setConfirm(null)} />}
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

  const load = () => { setLoading(true); api.funding.list().then(r => setItems(r.data || [])).catch(() => showToast('Failed', false)).finally(() => setLoading(false)); };
  useEffect(load, []);
  const fc = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  async function save() {
    if (!form.title || !form.provider || !form.deadline) { showToast('Fill required fields', false); return; }
    setSaving(true);
    try {
      if (modal === 'create') { const r = await api.funding.create(form); setItems(p => [r.funding || r, ...p]); showToast('Funding created!'); }
      else { await api.funding.update(modal.id, form); setItems(p => p.map(x => x.id === modal.id ? { ...x, ...form } : x)); showToast('Updated!'); }
      setModal(null);
    } catch (e) { showToast(e.message, false); } finally { setSaving(false); }
  }
  async function del(id) {
    try { await api.funding.delete(id); setItems(p => p.filter(x => x.id !== id)); showToast('Deleted'); setConfirm(null); }
    catch (e) { showToast(e.message, false); }
  }

  const SC = { Open:'#6ee7b7', Upcoming:'#93c5fd', Closed:'rgba(255,255,255,0.35)' };

  return (
    <div>
      <PageHeader title="Funding Opportunities" desc="Post grants, scholarships and government funds" action={<AddBtn onClick={() => { setForm(FU_BLANK); setModal('create'); }} />} />
      {confirm && <ConfirmModal msg={`Delete "${confirm.title}"?`} onConfirm={() => del(confirm.id)} onCancel={() => setConfirm(null)} />}
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

  const load = () => { setLoading(true); api.partnerships.list().then(r => setItems(r.data || [])).catch(() => showToast('Failed', false)).finally(() => setLoading(false)); };
  useEffect(load, []);
  const fc = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  async function save() {
    if (!form.partner_name || !form.start_date) { showToast('Fill required fields', false); return; }
    setSaving(true);
    try {
      if (modal === 'create') { const r = await api.partnerships.create(form); setItems(p => [r.partnership || r, ...p]); showToast('Partnership created!'); }
      else { await api.partnerships.update(modal.id, form); setItems(p => p.map(x => x.id === modal.id ? { ...x, ...form } : x)); showToast('Updated!'); }
      setModal(null);
    } catch (e) { showToast(e.message, false); } finally { setSaving(false); }
  }
  async function del(id) {
    try { await api.partnerships.delete(id); setItems(p => p.filter(x => x.id !== id)); showToast('Deleted'); setConfirm(null); }
    catch (e) { showToast(e.message, false); }
  }

  const SC = { Active:'#6ee7b7', Pending:'#fcd34d', Expired:'rgba(255,255,255,0.35)' };

  return (
    <div>
      <PageHeader title="Partnerships" desc="Manage strategic consortium partnerships" action={<AddBtn onClick={() => { setForm(PA_BLANK); setModal('create'); }} />} />
      {confirm && <ConfirmModal msg={`Delete "${confirm.partner_name}"?`} onConfirm={() => del(confirm.id)} onCancel={() => setConfirm(null)} />}
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
  const [chatbot, setChatbot] = useState(null);
  const [evRep, setEvRep]     = useState(null);
  const [trRep, setTrRep]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.admin.reportChatbot(), api.admin.reportEvents(), api.admin.reportTraining()])
      .then(([c,e,t]) => { setChatbot(c); setEvRep(e); setTrRep(t); })
      .catch(() => showToast('Failed to load reports', false))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;

  const accColor = chatbot?.accuracy >= 80 ? '#6ee7b7' : chatbot?.accuracy >= 60 ? '#fcd34d' : '#fca5a5';

  return (
    <div>
      <PageHeader title="Analytics & Reports" desc="Portal performance and usage insights" />

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
