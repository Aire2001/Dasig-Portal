import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import ParticleBackground from '../components/ParticleBackground';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

/* ── Date utilities ─────────────────────────────────────────────── */
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_ABBR    = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const M2I = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 };

function parseStartDate(schedule) {
  if (!schedule) return null;
  const m = schedule.match(/([A-Z][a-z]{2})\s+(\d+)/);
  const y = schedule.match(/\b(\d{4})\b/);
  if (!m || !y || M2I[m[1]] === undefined) return null;
  return new Date(+y[1], M2I[m[1]], +m[2]);
}

function parseEventDays(dateStr) {
  if (!dateStr) return [];
  const m = dateStr.match(/([A-Z][a-z]{2})\s+(\d+)(?:[–\-](\d+))?,\s*(\d{4})/);
  if (!m || M2I[m[1]] === undefined) return [];
  const mon = M2I[m[1]], yr = +m[4], start = +m[2], end = m[3] ? +m[3] : start;
  const days = [];
  for (let d = start; d <= end; d++) days.push({ month: mon, year: yr, day: d });
  return days;
}

function findConflict(targetEv, myRegs, allEvents) {
  const tDays = parseEventDays(targetEv.date);
  if (!tDays.length) return null;
  for (const id of Object.keys(myRegs)) {
    const ev = allEvents.find(e => e.id === +id);
    if (!ev || ev.id === targetEv.id) continue;
    const eDays = parseEventDays(ev.date);
    for (const t of tDays) for (const e of eDays)
      if (t.month === e.month && t.year === e.year && t.day === e.day) return ev;
  }
  return null;
}

/* ── Style constants ─────────────────────────────────────────────── */
const EV_GRADS = {
  Summit:   'linear-gradient(135deg,#001d5c,#1a56db 55%,#4f46e5)',
  Workshop: 'linear-gradient(135deg,#0891b2,#059669)',
  Seminar:  'linear-gradient(135deg,#7c3aed,#ec4899)',
  Funding:  'linear-gradient(135deg,#f59e0b,#f97316)',
};
const TR_STYLES = {
  Technology: { accent:'linear-gradient(135deg,#1a56db,#4f46e5)', color:'#60a5fa', bg:'rgba(59,130,246,0.08)' },
  Research:   { accent:'linear-gradient(135deg,#059669,#0891b2)', color:'#34d399', bg:'rgba(16,185,129,0.08)' },
  Leadership: { accent:'linear-gradient(135deg,#f59e0b,#f97316)', color:'#fcd34d', bg:'rgba(245,158,11,0.08)' },
  Governance: { accent:'linear-gradient(135deg,#7c3aed,#1a56db)', color:'#c4b5fd', bg:'rgba(124,58,237,0.08)' },
};
const EV_ICONS = { Summit:'🏛', Workshop:'🔬', Seminar:'📢', Funding:'💰' };

const CSS = `
  @keyframes cardIn  { from{transform:translateY(14px);opacity:0} to{transform:translateY(0);opacity:1} }
  @keyframes modalIn { from{transform:scale(.88);opacity:0} to{transform:scale(1);opacity:1} }
  @keyframes calPop  { from{transform:scale(.96);opacity:0} to{transform:scale(1);opacity:1} }
  @keyframes checkPop{ 0%{transform:scale(0)} 60%{transform:scale(1.3)} 100%{transform:scale(1)} }
  .prog-input {
    width:100%; box-sizing:border-box;
    border:1.5px solid rgba(255,255,255,0.15); border-radius:10px;
    padding:10px 14px; font-size:13.5px; font-family:inherit;
    color:#fff; outline:none; transition:border-color .15s;
    background:rgba(255,255,255,0.07);
  }
  .prog-input::placeholder { color:rgba(255,255,255,0.35); }
  .prog-input:focus { border-color:#f97316; background:rgba(255,255,255,0.11); }
  .cal-cell {
    min-height:76px; border-radius:9px; padding:5px 4px;
    border:1px solid rgba(255,255,255,0.04);
    transition:background .13s;
  }
  .cal-cell.today    { border-color:rgba(249,115,22,.5); background:rgba(249,115,22,.06); }
  .cal-cell.has-item { cursor:pointer; }
  .cal-cell.has-item:hover { background:rgba(255,255,255,.05); }
`;

/* ═══ Main page ═══════════════════════════════════════════════════════ */
export default function ProgramsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'training' ? 'training' : 'events';
  const { user } = useAuth();
  const setTab = t => setSearchParams({ tab: t }, { replace: true });

  return (
    <div style={{ background:'linear-gradient(180deg,#000d30 0%,#020817 300px,#0f172a 100%)', minHeight:'100vh', position:'relative' }}>
      <ParticleBackground density={45} />
      <style>{CSS}</style>
      <div style={{ position:'relative', zIndex:1 }}>
        <PageHeader eyebrow="DASIG Programs" title="Events & Training" />
        <div style={{ maxWidth:1120, margin:'0 auto', padding:'0 24px 80px' }}>

          {/* ── Tab switcher ── */}
          <div style={{ display:'flex', gap:10, marginBottom:32, flexWrap:'wrap' }}>
            {[
              { key:'events',   label:'📅 Events',            sub:'Summits, workshops & seminars' },
              { key:'training', label:'🎓 Training Calendar', sub:'Professional development programs' },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                flex:'0 0 auto', minWidth:220, padding:'14px 22px', borderRadius:16,
                background: tab === t.key
                  ? 'linear-gradient(135deg,rgba(249,115,22,0.18),rgba(225,29,72,0.12))'
                  : 'rgba(255,255,255,0.04)',
                border: tab === t.key
                  ? '1.5px solid rgba(249,115,22,0.45)'
                  : '1.5px solid rgba(255,255,255,0.08)',
                cursor:'pointer', fontFamily:'inherit', textAlign:'left',
                transition:'all .18s',
                boxShadow: tab === t.key ? '0 4px 20px rgba(249,115,22,0.13)' : 'none',
              }}>
                <div style={{ fontSize:14.5, fontWeight:800, color: tab === t.key ? '#fb923c' : 'rgba(255,255,255,0.72)', marginBottom:3 }}>{t.label}</div>
                <div style={{ fontSize:11.5, color:'rgba(255,255,255,0.35)', fontWeight:500 }}>{t.sub}</div>
              </button>
            ))}
          </div>

          {tab === 'events'   && <EventsTab   user={user} />}
          {tab === 'training' && <TrainingTab user={user} />}
        </div>
      </div>
    </div>
  );
}

/* ═══ Shared small modal helpers ══════════════════════════════════════ */
function ErrModal({ err, onClose }) {
  const navigate = useNavigate();
  if (!err) return null;
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', zIndex:9200, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#0f172a', border:'1px solid rgba(225,29,72,0.3)', borderRadius:22, maxWidth:360, width:'100%', padding:'32px', textAlign:'center', animation:'modalIn .22s ease' }}>
        <div style={{ fontSize:40, marginBottom:10 }}>{err === 'login' ? '🔐' : err === 'already' ? 'ℹ️' : '⚠️'}</div>
        <div style={{ color:'#fff', fontWeight:900, fontSize:17, marginBottom:8 }}>
          {err === 'login' ? 'Sign in required' : err === 'already' ? 'Already registered' : 'Error'}
        </div>
        <p style={{ color:'rgba(255,255,255,0.5)', fontSize:13.5, marginBottom:20, lineHeight:1.6 }}>
          {err === 'login'   ? 'You need to log in first.' :
           err === 'already' ? 'You are already registered / enrolled.' : err}
        </p>
        {err === 'login'
          ? <button onClick={() => { onClose(); navigate('/login'); }} style={{ width:'100%', background:'linear-gradient(90deg,#f97316,#e11d48)', color:'#fff', border:'none', borderRadius:12, padding:'12px', fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}>Log in</button>
          : <button onClick={onClose} style={{ width:'100%', background:'rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.65)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:12, padding:'12px', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>OK</button>
        }
      </div>
    </div>
  );
}

/* ═══ EVENTS TAB ═══════════════════════════════════════════════════════ */
const EV_FILTERS = ['All','Summit','Workshop','Seminar','Funding'];

function EventsTab({ user }) {
  const [active, setActive]       = useState('All');
  const [events, setEvents]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [myRegs, setMyRegs]       = useState({});
  const [formModal, setFormModal] = useState(null);
  const [conflict, setConflict]   = useState(null); // { event, conflictsWith }
  const [okModal, setOkModal]     = useState(null);
  const [errModal, setErrModal]   = useState('');
  const [submitting, setSub]      = useState(false);
  const [fname, setFname]         = useState('');
  const [phone, setPhone]         = useState('');
  const [institution, setInst]    = useState('');
  const [fnameErr, setFnameErr]   = useState(false);

  useEffect(() => {
    setLoading(true);
    api.events.list({ category: active })
      .then(r => setEvents(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [active]);

  useEffect(() => {
    if (!user) return;
    api.auth.myRegistrations()
      .then(regs => {
        const m = {};
        regs.forEach(r => { m[r.event_id] = { attended: r.attended }; });
        setMyRegs(m);
      })
      .catch(() => {});
  }, [user]);

  function openForm(ev) {
    if (!user) { setErrModal('login'); return; }
    const clash = findConflict(ev, myRegs, events);
    if (clash) { setConflict({ event: ev, conflictsWith: clash }); return; }
    prefill(ev);
  }
  function prefill(ev) {
    setFname(user?.name || ''); setPhone(user?.phone || ''); setInst(user?.institution || '');
    setFnameErr(false); setFormModal(ev); setConflict(null);
  }

  async function submit() {
    if (!fname.trim()) { setFnameErr(true); return; }
    setSub(true);
    try {
      const res = await api.events.register(formModal.id);
      const updated = { ...formModal, enrolled: res.enrolled ?? formModal.enrolled + 1 };
      setEvents(p => p.map(e => e.id === formModal.id ? updated : e));
      setMyRegs(p => ({ ...p, [formModal.id]: { attended: false } }));
      setFormModal(null);
      setOkModal({ event: updated, name: fname, phone, institution, email: user.email, role: user.role });
    } catch (err) {
      const msg = err.message || '';
      setFormModal(null);
      setErrModal(msg.toLowerCase().includes('already') ? 'already' : msg || 'Registration failed');
    } finally { setSub(false); }
  }

  const grad = ev => EV_GRADS[ev?.category] || EV_GRADS.Summit;

  return (
    <>
      <ErrModal err={errModal} onClose={() => setErrModal('')} />

      {/* Conflict warning */}
      {conflict && (
        <div onClick={() => setConflict(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.72)', zIndex:9200, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#0f172a', border:'1px solid rgba(245,158,11,0.4)', borderRadius:22, maxWidth:420, width:'100%', padding:'32px', animation:'modalIn .22s ease' }}>
            <div style={{ fontSize:42, textAlign:'center', marginBottom:12 }}>⚠️</div>
            <div style={{ color:'#fbbf24', fontWeight:900, fontSize:17, textAlign:'center', marginBottom:8 }}>Scheduling Conflict</div>
            <p style={{ color:'rgba(255,255,255,0.6)', fontSize:13.5, textAlign:'center', lineHeight:1.65, marginBottom:6 }}>
              You are already registered for <strong style={{ color:'#fff' }}>{conflict.conflictsWith.title}</strong>, which overlaps with <strong style={{ color:'#fff' }}>{conflict.event.title}</strong>.
            </p>
            <p style={{ color:'rgba(245,158,11,0.8)', fontSize:12.5, textAlign:'center', marginBottom:24 }}>📅 {conflict.conflictsWith.date}</p>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setConflict(null)} style={{ flex:1, background:'rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.65)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:12, padding:'12px', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
              <button onClick={() => prefill(conflict.event)} style={{ flex:1, background:'linear-gradient(90deg,#f59e0b,#f97316)', color:'#fff', border:'none', borderRadius:12, padding:'12px', fontSize:13, fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}>Register Anyway</button>
            </div>
          </div>
        </div>
      )}

      {/* Registration form */}
      {formModal && (
        <div onClick={() => !submitting && setFormModal(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', zIndex:9200, display:'flex', alignItems:'center', justifyContent:'center', padding:20, overflowY:'auto' }}>
          <div onClick={e => e.stopPropagation()} style={{ background:'linear-gradient(180deg,#0f172a,#020817)', borderRadius:22, maxWidth:480, width:'100%', overflow:'hidden', border:'1px solid rgba(255,255,255,0.1)', animation:'modalIn .24s cubic-bezier(.34,1.56,.64,1)', margin:'auto' }}>
            <div style={{ background: grad(formModal), padding:'22px 24px 18px', position:'relative' }}>
              <button onClick={() => setFormModal(null)} style={{ position:'absolute', top:14, right:14, background:'rgba(255,255,255,0.2)', border:'none', borderRadius:'50%', width:30, height:30, color:'#fff', fontSize:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
              <div style={{ color:'rgba(255,255,255,0.65)', fontSize:10.5, fontWeight:700, letterSpacing:1, marginBottom:4 }}>EVENT REGISTRATION</div>
              <div style={{ color:'#fff', fontSize:17, fontWeight:900 }}>{formModal.title}</div>
              <div style={{ display:'flex', gap:14, marginTop:8, flexWrap:'wrap' }}>
                <span style={{ color:'rgba(255,255,255,0.8)', fontSize:12 }}>📅 {formModal.date}</span>
                <span style={{ color:'rgba(255,255,255,0.8)', fontSize:12 }}>📍 {formModal.venue}</span>
              </div>
              <div style={{ marginTop:10, background:'rgba(255,255,255,0.15)', borderRadius:8, padding:'5px 12px', display:'inline-flex', gap:6 }}>
                <span style={{ color:'rgba(255,255,255,0.65)', fontSize:11 }}>Slots left:</span>
                <span style={{ color:'#fff', fontWeight:800, fontSize:13 }}>{formModal.total - formModal.enrolled}</span>
              </div>
            </div>
            <div style={{ padding:'20px 24px 24px', display:'flex', flexDirection:'column', gap:12 }}>
              {[
                { label:'FULL NAME', val:fname, set:setFname, err:fnameErr, setErr:setFnameErr, req:true, ph:'Your full name' },
                { label:'PHONE',     val:phone, set:setPhone, ph:'e.g. 09XX-XXX-XXXX' },
                { label:'INSTITUTION', val:institution, set:setInst, ph:'Your organization' },
              ].map(f => (
                <div key={f.label}>
                  <label style={{ fontSize:10.5, fontWeight:700, color: f.err ? '#f87171' : 'rgba(255,255,255,0.4)', display:'block', marginBottom:5, letterSpacing:'.5px', textTransform:'uppercase' }}>
                    {f.label} {f.req && <span style={{ color:'#e11d48' }}>*</span>}
                  </label>
                  <input className="prog-input" value={f.val} placeholder={f.ph}
                    onChange={e => { f.set(e.target.value); if (f.setErr && e.target.value.trim()) f.setErr(false); }}
                    style={f.err ? { borderColor:'#e11d48' } : {}} />
                  {f.err && <div style={{ color:'#f87171', fontSize:12, marginTop:4 }}>⚠ Required.</div>}
                </div>
              ))}
              <div style={{ display:'flex', gap:10, marginTop:6 }}>
                <button onClick={() => setFormModal(null)} style={{ flex:1, background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.55)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:'12px', fontSize:13.5, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
                <button onClick={submit} disabled={submitting} style={{ flex:2, background: submitting ? '#475569' : 'linear-gradient(90deg,#f97316,#e11d48)', color:'#fff', border:'none', borderRadius:12, padding:'12px', fontSize:14, fontWeight:800, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily:'inherit' }}>
                  {submitting ? '⏳ Submitting…' : '✅ Confirm Registration'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success modal */}
      {okModal && (
        <div onClick={() => setOkModal(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', zIndex:9200, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#0f172a', borderRadius:24, maxWidth:480, width:'100%', overflow:'hidden', border:'1px solid rgba(255,255,255,0.1)', animation:'modalIn .26s cubic-bezier(.34,1.56,.64,1)' }}>
            <div style={{ background: grad(okModal.event), padding:'32px 32px 56px', textAlign:'center', position:'relative' }}>
              <div style={{ color:'rgba(255,255,255,0.6)', fontSize:10.5, fontWeight:700, letterSpacing:1, textTransform:'uppercase', marginBottom:6 }}>Registration Confirmed</div>
              <div style={{ color:'#fff', fontSize:20, fontWeight:900, lineHeight:1.3 }}>{okModal.event.title}</div>
              <div style={{ position:'absolute', bottom:-36, left:'50%', transform:'translateX(-50%)', width:72, height:72, borderRadius:'50%', background: grad(okModal.event), border:'4px solid #0f172a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, fontWeight:900, color:'#fff', boxShadow:'0 8px 24px rgba(0,0,0,0.4)' }}>
                {(okModal.name || 'U')[0].toUpperCase()}
              </div>
            </div>
            <div style={{ paddingTop:50, paddingBottom:16, textAlign:'center' }}>
              <div style={{ fontWeight:900, fontSize:18, color:'#fff', paddingLeft:28, paddingRight:28 }}>{okModal.name}</div>
              <div style={{ fontSize:12.5, color:'rgba(255,255,255,0.4)', marginTop:3 }}>{okModal.email}</div>
            </div>
            <div style={{ padding:'0 28px 28px', display:'flex', flexDirection:'column', gap:8 }}>
              {[
                { icon:'📋', l:'EVENT', v: okModal.event.title },
                { icon:'📅', l:'DATE',  v: okModal.event.date || 'TBA' },
                { icon:'📍', l:'VENUE', v: okModal.event.venue || 'TBA' },
              ].map(r => (
                <div key={r.l} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', background:'rgba(255,255,255,0.04)', borderRadius:10 }}>
                  <span style={{ fontSize:16 }}>{r.icon}</span>
                  <div>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', fontWeight:700, letterSpacing:'.5px' }}>{r.l}</div>
                    <div style={{ fontSize:13, color:'#fff', fontWeight:700 }}>{r.v}</div>
                  </div>
                </div>
              ))}
              <div style={{ background:'rgba(16,185,129,0.12)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:12, padding:'12px 14px', marginTop:4 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                  <span style={{ animation:'checkPop 0.4s 0.15s both', display:'inline-block', fontSize:15 }}>✅</span>
                  <span style={{ fontSize:13, color:'#34d399', fontWeight:700 }}>You&apos;re registered!</span>
                </div>
                <div style={{ fontSize:12, color:'rgba(52,211,153,0.8)', lineHeight:1.5 }}>
                  A confirmation email has been sent to <strong style={{ color:'#34d399' }}>{okModal.email}</strong>.
                </div>
              </div>
              <button onClick={() => setOkModal(null)} style={{ width:'100%', background:'linear-gradient(90deg,#f97316,#e11d48)', color:'#fff', border:'none', borderRadius:14, padding:'14px', fontSize:15, fontWeight:800, cursor:'pointer', fontFamily:'inherit', marginTop:4 }}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* Filter chips */}
      <div style={{ display:'flex', gap:8, marginBottom:24, flexWrap:'wrap' }}>
        {EV_FILTERS.map(f => (
          <button key={f} onClick={() => setActive(f)} style={{
            background: active === f ? 'linear-gradient(90deg,#f97316,#e11d48)' : 'rgba(255,255,255,0.06)',
            color: active === f ? '#fff' : 'rgba(255,255,255,0.6)',
            border: active === f ? 'none' : '1px solid rgba(255,255,255,0.12)',
            borderRadius:20, padding:'6px 18px', fontSize:12.5, fontWeight:700,
            cursor:'pointer', fontFamily:'inherit', transition:'all .15s',
            boxShadow: active === f ? '0 4px 14px rgba(249,115,22,0.3)' : 'none',
          }}>{f}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:'rgba(255,255,255,0.3)' }}>
          <div style={{ fontSize:32, marginBottom:10 }}>⏳</div>Loading events…
        </div>
      ) : events.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:'rgba(255,255,255,0.28)', fontSize:14 }}>No events found.</div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:20 }}>
          {events.map((ev, i) => <EventCard key={ev.id} ev={ev} idx={i} registered={!!myRegs[ev.id]} onRegister={() => openForm(ev)} />)}
        </div>
      )}
    </>
  );
}

function EventCard({ ev, idx, registered, onRegister }) {
  const [hov, setHov] = useState(false);
  const pct  = ev.total > 0 ? Math.min(100, Math.round((ev.enrolled / ev.total) * 100)) : 0;
  const full = ev.total > 0 && ev.enrolled >= ev.total;
  const grad = EV_GRADS[ev.category] || EV_GRADS.Summit;

  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        borderRadius:20, overflow:'hidden',
        background:'rgba(15,23,42,0.9)',
        border:`1px solid ${hov ? 'rgba(249,115,22,0.4)' : 'rgba(255,255,255,0.07)'}`,
        boxShadow: hov ? '0 14px 40px rgba(249,115,22,0.12)' : '0 4px 16px rgba(0,0,0,0.3)',
        transform: hov ? 'translateY(-5px)' : 'none',
        transition:'all .22s cubic-bezier(.34,1.56,.64,1)',
        animation:`cardIn .35s ease ${idx * 0.05}s both`,
      }}
    >
      <div style={{ background: grad, padding:'20px 20px 16px', position:'relative', overflow:'hidden', minHeight:110 }}>
        <div style={{ position:'absolute', right:-10, bottom:-14, fontSize:76, opacity:0.13, lineHeight:1, userSelect:'none' }}>
          {EV_ICONS[ev.category] || '📅'}
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
          <span style={{ background:'rgba(255,255,255,0.2)', color:'#fff', borderRadius:6, padding:'3px 10px', fontSize:10.5, fontWeight:700 }}>{ev.category}</span>
          {registered && <span style={{ background:'rgba(16,185,129,0.28)', color:'#34d399', borderRadius:6, padding:'3px 10px', fontSize:10.5, fontWeight:700, border:'1px solid rgba(16,185,129,0.4)' }}>✓ Registered</span>}
          {full && !registered && <span style={{ background:'rgba(225,29,72,0.28)', color:'#f87171', borderRadius:6, padding:'3px 10px', fontSize:10.5, fontWeight:700 }}>Full</span>}
        </div>
        <div style={{ color:'#fff', fontSize:15.5, fontWeight:900, lineHeight:1.35, marginBottom:6 }}>{ev.title}</div>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
          <span style={{ color:'rgba(255,255,255,0.78)', fontSize:11.5 }}>📅 {ev.date}</span>
          <span style={{ color:'rgba(255,255,255,0.78)', fontSize:11.5 }}>📍 {ev.venue}</span>
        </div>
      </div>
      <div style={{ padding:'14px 18px' }}>
        {ev.description && (
          <p style={{ color:'rgba(255,255,255,0.45)', fontSize:12.5, lineHeight:1.6, marginBottom:12, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{ev.description}</p>
        )}
        <div style={{ marginBottom:12 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
            <span style={{ fontSize:11, color:'rgba(255,255,255,0.38)', fontWeight:600 }}>Seats</span>
            <span style={{ fontSize:11.5, color: full ? '#f87171' : pct > 80 ? '#fcd34d' : '#6ee7b7', fontWeight:700 }}>{ev.enrolled}/{ev.total}</span>
          </div>
          <div style={{ height:5, background:'rgba(255,255,255,0.07)', borderRadius:3, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${pct}%`, background: full ? 'linear-gradient(90deg,#e11d48,#f97316)' : pct > 80 ? 'linear-gradient(90deg,#f59e0b,#f97316)' : 'linear-gradient(90deg,#059669,#0891b2)', borderRadius:3, transition:'width .6s ease' }} />
          </div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <span style={{ fontSize:11, color:'rgba(255,255,255,0.3)', flex:1 }}>🏛 {ev.organizer}</span>
          {!registered
            ? <button onClick={onRegister} disabled={full} style={{ background: full ? 'rgba(255,255,255,0.05)' : 'linear-gradient(90deg,#f97316,#e11d48)', color: full ? 'rgba(255,255,255,0.3)' : '#fff', border: full ? '1px solid rgba(255,255,255,0.08)' : 'none', borderRadius:10, padding:'8px 18px', fontSize:12.5, fontWeight:800, cursor: full ? 'not-allowed' : 'pointer', fontFamily:'inherit', boxShadow: full ? 'none' : '0 4px 14px rgba(249,115,22,0.3)', whiteSpace:'nowrap' }}>
                {full ? 'Fully Booked' : 'Register →'}
              </button>
            : <span style={{ background:'rgba(16,185,129,0.12)', color:'#34d399', borderRadius:10, padding:'8px 14px', fontSize:12, fontWeight:700, border:'1px solid rgba(16,185,129,0.22)' }}>✓ Registered</span>
          }
        </div>
      </div>
    </div>
  );
}

/* ═══ TRAINING TAB ═══════════════════════════════════════════════════ */
const TR_CATS = ['All','Technology','Research','Leadership','Governance'];

function TrainingTab({ user }) {
  const today = new Date();
  const [month, setMonth]         = useState(today.getMonth());
  const [year, setYear]           = useState(today.getFullYear());
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [catFilter, setCat]       = useState('All');
  const [myEnr, setMyEnr]         = useState({});
  const [formModal, setFormModal] = useState(null);
  const [calSel, setCalSel]       = useState(null);
  const [okModal, setOkModal]     = useState(null);
  const [errModal, setErrModal]   = useState('');
  const [submitting, setSub]      = useState(false);
  const [fname, setFname]         = useState('');
  const [email, setEmail]         = useState('');
  const [institution, setInst]    = useState('');
  const [fnameErr, setFnameErr]   = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.training.list().then(r => setTrainings(r.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    if (!user) return;
    api.auth.myEnrollments().then(enrs => {
      const m = {}; enrs.forEach(e => { m[e.training_id] = true; }); setMyEnr(m);
    }).catch(() => {});
  }, [user]);

  function prevMon() { if (month === 0) { setMonth(11); setYear(y => y-1); } else setMonth(m => m-1); }
  function nextMon() { if (month === 11) { setMonth(0); setYear(y => y+1); } else setMonth(m => m+1); }

  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calGrid = [];
  let d = 1 - firstDay;
  for (let r = 0; r < 6; r++) {
    const row = [];
    for (let c = 0; c < 7; c++) row.push(d++);
    calGrid.push(row);
    if (d - 1 > daysInMonth) break;
  }

  const trainOnDay = {};
  trainings.forEach(t => {
    const dt = parseStartDate(t.schedule);
    if (dt && dt.getMonth() === month && dt.getFullYear() === year) {
      const k = dt.getDate();
      if (!trainOnDay[k]) trainOnDay[k] = [];
      trainOnDay[k].push(t);
    }
  });

  function openEnroll(t) {
    if (!user) { setErrModal('login'); return; }
    setFname(user.name || ''); setEmail(user.email || ''); setInst(user.institution || '');
    setFnameErr(false); setFormModal(t); setCalSel(null);
  }

  async function submitEnroll() {
    if (!fname.trim()) { setFnameErr(true); return; }
    setSub(true);
    try {
      const res = await api.training.enroll(formModal.id);
      const upd = { ...formModal, enrolled: res.enrolled ?? formModal.enrolled + 1 };
      setTrainings(p => p.map(t => t.id === formModal.id ? upd : t));
      setMyEnr(p => ({ ...p, [formModal.id]: true }));
      setFormModal(null);
      setOkModal({ training: upd, name: fname, email, institution, role: user.role });
    } catch (err) {
      const msg = err.message || '';
      setFormModal(null);
      setErrModal(msg.toLowerCase().includes('already') ? 'already' : msg || 'Enrollment failed');
    } finally { setSub(false); }
  }

  const ts = t => TR_STYLES[t?.category] || TR_STYLES.Technology;
  const filtered = catFilter === 'All' ? trainings : trainings.filter(t => t.category === catFilter);

  return (
    <>
      <ErrModal err={errModal} onClose={() => setErrModal('')} />

      {/* Enrollment form */}
      {formModal && (
        <div onClick={() => !submitting && setFormModal(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', zIndex:9200, display:'flex', alignItems:'center', justifyContent:'center', padding:20, overflowY:'auto' }}>
          <div onClick={e => e.stopPropagation()} style={{ background:'linear-gradient(180deg,#0f172a,#020817)', borderRadius:22, maxWidth:480, width:'100%', overflow:'hidden', border:'1px solid rgba(255,255,255,0.1)', animation:'modalIn .24s cubic-bezier(.34,1.56,.64,1)', margin:'auto' }}>
            <div style={{ background: ts(formModal).accent, padding:'22px 24px 18px', position:'relative' }}>
              <button onClick={() => setFormModal(null)} style={{ position:'absolute', top:14, right:14, background:'rgba(255,255,255,0.2)', border:'none', borderRadius:'50%', width:30, height:30, color:'#fff', fontSize:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
              <div style={{ color:'rgba(255,255,255,0.65)', fontSize:10.5, fontWeight:700, letterSpacing:1, marginBottom:4 }}>PROGRAM ENROLLMENT</div>
              <div style={{ color:'#fff', fontSize:17, fontWeight:900 }}>{formModal.title}</div>
              <div style={{ display:'flex', gap:12, marginTop:8, flexWrap:'wrap' }}>
                {[{ i:'🏛', v: formModal.org }, { i:'⏱', v: formModal.duration }, { i:'📊', v: formModal.level }].map(r =>
                  <span key={r.v} style={{ color:'rgba(255,255,255,0.78)', fontSize:11.5 }}>{r.i} {r.v}</span>
                )}
              </div>
            </div>
            <div style={{ padding:'20px 24px 24px', display:'flex', flexDirection:'column', gap:12 }}>
              {[
                { label:'FULL NAME', val:fname, set:setFname, err:fnameErr, setErr:setFnameErr, req:true, ph:'Your full name' },
                { label:'EMAIL',     val:email, set:setEmail, ph:'your@email.com' },
                { label:'INSTITUTION', val:institution, set:setInst, ph:'Your organization' },
              ].map(f => (
                <div key={f.label}>
                  <label style={{ fontSize:10.5, fontWeight:700, color: f.err ? '#f87171' : 'rgba(255,255,255,0.4)', display:'block', marginBottom:5, letterSpacing:'.5px', textTransform:'uppercase' }}>
                    {f.label}{f.req && <span style={{ color:'#e11d48' }}> *</span>}
                  </label>
                  <input className="prog-input" value={f.val} placeholder={f.ph}
                    onChange={e => { f.set(e.target.value); if (f.setErr && e.target.value.trim()) f.setErr(false); }}
                    style={f.err ? { borderColor:'#e11d48' } : {}} />
                  {f.err && <div style={{ color:'#f87171', fontSize:12, marginTop:4 }}>⚠ Required.</div>}
                </div>
              ))}
              <div style={{ display:'flex', gap:10, marginTop:6 }}>
                <button onClick={() => setFormModal(null)} style={{ flex:1, background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.55)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:'12px', fontSize:13.5, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
                <button onClick={submitEnroll} disabled={submitting} style={{ flex:2, background: submitting ? '#475569' : ts(formModal).accent, color:'#fff', border:'none', borderRadius:12, padding:'12px', fontSize:14, fontWeight:800, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily:'inherit' }}>
                  {submitting ? '⏳ Enrolling…' : '✅ Confirm Enrollment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success */}
      {okModal && (
        <div onClick={() => setOkModal(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', zIndex:9200, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#0f172a', borderRadius:24, maxWidth:440, width:'100%', overflow:'hidden', border:'1px solid rgba(255,255,255,0.1)', animation:'modalIn .26s cubic-bezier(.34,1.56,.64,1)' }}>
            <div style={{ background: ts(okModal.training).accent, padding:'28px 28px 52px', textAlign:'center', position:'relative' }}>
              <div style={{ color:'rgba(255,255,255,0.6)', fontSize:10.5, fontWeight:700, letterSpacing:1, textTransform:'uppercase', marginBottom:6 }}>Enrollment Confirmed</div>
              <div style={{ color:'#fff', fontSize:19, fontWeight:900 }}>{okModal.training.title}</div>
              <div style={{ position:'absolute', bottom:-34, left:'50%', transform:'translateX(-50%)', width:68, height:68, borderRadius:'50%', background: ts(okModal.training).accent, border:'4px solid #0f172a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, fontWeight:900, color:'#fff' }}>
                {(okModal.name || 'U')[0].toUpperCase()}
              </div>
            </div>
            <div style={{ paddingTop:48, paddingBottom:12, textAlign:'center' }}>
              <div style={{ fontWeight:900, fontSize:17, color:'#fff', paddingLeft:28, paddingRight:28 }}>{okModal.name}</div>
            </div>
            <div style={{ padding:'0 24px 24px', display:'flex', flexDirection:'column', gap:8 }}>
              {[
                { i:'🎓', l:'PROGRAM',   v: okModal.training.title },
                { i:'🏛', l:'ORGANIZER', v: okModal.training.org   },
                { i:'⏱', l:'DURATION',  v: okModal.training.duration },
              ].map(r => (
                <div key={r.l} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', background:'rgba(255,255,255,0.04)', borderRadius:10 }}>
                  <span style={{ fontSize:15 }}>{r.i}</span>
                  <div>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', fontWeight:700, letterSpacing:'.5px' }}>{r.l}</div>
                    <div style={{ fontSize:12.5, color:'#fff', fontWeight:700 }}>{r.v}</div>
                  </div>
                </div>
              ))}
              <div style={{ background:'rgba(16,185,129,0.12)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:12, padding:'12px 14px', marginTop:4 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                  <span style={{ animation:'checkPop 0.4s 0.15s both', display:'inline-block', fontSize:15 }}>✅</span>
                  <span style={{ fontSize:13, color:'#34d399', fontWeight:700 }}>You&apos;re enrolled!</span>
                </div>
                <div style={{ fontSize:12, color:'rgba(52,211,153,0.8)', lineHeight:1.5 }}>
                  A confirmation email has been sent to <strong style={{ color:'#34d399' }}>{okModal.email}</strong>.
                </div>
              </div>
              <button onClick={() => setOkModal(null)} style={{ width:'100%', background: ts(okModal.training).accent, color:'#fff', border:'none', borderRadius:14, padding:'13px', fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:'inherit', marginTop:4 }}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* Calendar day popover */}
      {calSel && (
        <div onClick={() => setCalSel(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:9100, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#0f172a', border:'1px solid rgba(255,255,255,0.1)', borderRadius:20, maxWidth:420, width:'100%', padding:'24px', animation:'calPop .2s ease' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:800, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'.5px' }}>
                {MONTH_NAMES[month]} {calSel.day}, {year}
              </div>
              <button onClick={() => setCalSel(null)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.35)', fontSize:18, cursor:'pointer' }}>✕</button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {calSel.trainings.map(t => (
                <div key={t.id} style={{ background: ts(t).bg, border:`1px solid ${ts(t).color}28`, borderRadius:14, padding:'14px 16px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                    <div style={{ fontSize:13.5, fontWeight:800, color:'#fff', flex:1, marginRight:8 }}>{t.title}</div>
                    <span style={{ fontSize:10.5, fontWeight:700, color: ts(t).color, background:`${ts(t).color}20`, borderRadius:5, padding:'2px 8px', whiteSpace:'nowrap' }}>{t.level}</span>
                  </div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginBottom:10 }}>{t.org} · {t.duration}</div>
                  {myEnr[t.id]
                    ? <span style={{ fontSize:12, color:'#34d399', fontWeight:700 }}>✓ Already enrolled</span>
                    : <button onClick={() => openEnroll(t)} disabled={t.enrolled >= t.total} style={{ background: t.enrolled >= t.total ? 'rgba(255,255,255,0.05)' : ts(t).accent, color: t.enrolled >= t.total ? 'rgba(255,255,255,0.3)' : '#fff', border:'none', borderRadius:8, padding:'7px 16px', fontSize:12.5, fontWeight:700, cursor: t.enrolled >= t.total ? 'not-allowed' : 'pointer', fontFamily:'inherit' }}>
                        {t.enrolled >= t.total ? 'Full' : 'Enroll →'}
                      </button>
                  }
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Two-column layout: calendar + list */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:24, alignItems:'start' }}>

        {/* Calendar */}
        <div style={{ background:'rgba(15,23,42,0.7)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:20, overflow:'hidden' }}>
          {/* Month nav */}
          <div style={{ padding:'16px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
            <button onClick={prevMon} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, width:34, height:34, color:'rgba(255,255,255,0.6)', fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>
            <div style={{ textAlign:'center' }}>
              <div style={{ color:'#fff', fontWeight:900, fontSize:16 }}>{MONTH_NAMES[month]}</div>
              <div style={{ color:'rgba(255,255,255,0.35)', fontSize:12 }}>{year}</div>
            </div>
            <button onClick={nextMon} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, width:34, height:34, color:'rgba(255,255,255,0.6)', fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>›</button>
          </div>

          {/* Day headers */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', padding:'10px 12px 4px', gap:4 }}>
            {DAY_ABBR.map(d => (
              <div key={d} style={{ textAlign:'center', fontSize:10.5, fontWeight:700, color:'rgba(255,255,255,0.28)', letterSpacing:'.4px' }}>{d}</div>
            ))}
          </div>

          {/* Grid */}
          <div style={{ padding:'4px 12px 16px', display:'flex', flexDirection:'column', gap:4 }}>
            {calGrid.map((row, ri) => (
              <div key={ri} style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4 }}>
                {row.map((day, ci) => {
                  const inMonth = day >= 1 && day <= daysInMonth;
                  const isToday = inMonth && day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                  const items   = inMonth && trainOnDay[day] ? trainOnDay[day] : [];
                  return (
                    <div
                      key={ci}
                      onClick={() => items.length > 0 && setCalSel({ day, trainings: items })}
                      className={`cal-cell${isToday ? ' today' : ''}${items.length > 0 ? ' has-item' : ''}`}
                      style={{ opacity: inMonth ? 1 : 0 }}
                    >
                      <div style={{ fontSize:11.5, fontWeight: isToday ? 900 : 500, color: isToday ? '#f97316' : 'rgba(255,255,255,0.6)', textAlign:'center', marginBottom:3 }}>
                        {inMonth ? day : ''}
                      </div>
                      {items.slice(0,2).map(t => (
                        <div key={t.id} style={{ background:`${ts(t).color}22`, border:`1px solid ${ts(t).color}40`, borderRadius:3, padding:'2px 3px', fontSize:9, color: ts(t).color, fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:1 }}>
                          {t.title.split(' ').slice(0,3).join(' ')}
                        </div>
                      ))}
                      {items.length > 2 && <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', textAlign:'center' }}>+{items.length - 2}</div>}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div style={{ padding:'8px 14px 14px', borderTop:'1px solid rgba(255,255,255,0.05)', display:'flex', gap:10, flexWrap:'wrap' }}>
            {Object.entries(TR_STYLES).map(([k, s]) => (
              <div key={k} style={{ display:'flex', alignItems:'center', gap:5 }}>
                <div style={{ width:10, height:10, borderRadius:3, background:`${s.color}44`, border:`1px solid ${s.color}` }} />
                <span style={{ fontSize:10.5, color:'rgba(255,255,255,0.4)', fontWeight:600 }}>{k}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Training list */}
        <div>
          <div style={{ display:'flex', gap:6, marginBottom:14, flexWrap:'wrap' }}>
            {TR_CATS.map(c => (
              <button key={c} onClick={() => setCat(c)} style={{
                background: catFilter === c ? 'linear-gradient(90deg,#f97316,#e11d48)' : 'rgba(255,255,255,0.06)',
                color: catFilter === c ? '#fff' : 'rgba(255,255,255,0.55)',
                border: catFilter === c ? 'none' : '1px solid rgba(255,255,255,0.1)',
                borderRadius:16, padding:'5px 13px', fontSize:11.5, fontWeight:700,
                cursor:'pointer', fontFamily:'inherit',
              }}>{c}</button>
            ))}
          </div>
          {loading ? (
            <div style={{ textAlign:'center', padding:'40px 0', color:'rgba(255,255,255,0.3)' }}>⏳</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {filtered.map(t => (
                <div key={t.id} style={{ background:`linear-gradient(135deg,${ts(t).color}10,rgba(15,23,42,0.9))`, border:`1px solid ${ts(t).color}1a`, borderRadius:14, padding:'14px 16px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
                    <div style={{ flex:1, marginRight:8 }}>
                      <div style={{ fontSize:13, fontWeight:800, color:'#fff', lineHeight:1.3 }}>{t.title}</div>
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginTop:2 }}>{t.org} · {t.duration}</div>
                    </div>
                    <span style={{ background:`${ts(t).color}20`, color: ts(t).color, borderRadius:5, padding:'2px 8px', fontSize:10, fontWeight:700, whiteSpace:'nowrap' }}>{t.level}</span>
                  </div>
                  {t.schedule && <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginBottom:8 }}>📅 {t.schedule}</div>}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>{t.enrolled}/{t.total}</span>
                    {myEnr[t.id]
                      ? <span style={{ fontSize:11.5, color:'#34d399', fontWeight:700 }}>✓ Enrolled</span>
                      : <button onClick={() => openEnroll(t)} disabled={t.enrolled >= t.total} style={{ background: t.enrolled >= t.total ? 'rgba(255,255,255,0.04)' : ts(t).accent, color: t.enrolled >= t.total ? 'rgba(255,255,255,0.25)' : '#fff', border: t.enrolled >= t.total ? '1px solid rgba(255,255,255,0.07)' : 'none', borderRadius:8, padding:'6px 13px', fontSize:11.5, fontWeight:700, cursor: t.enrolled >= t.total ? 'not-allowed' : 'pointer', fontFamily:'inherit' }}>
                          {t.enrolled >= t.total ? 'Full' : 'Enroll →'}
                        </button>
                    }
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
