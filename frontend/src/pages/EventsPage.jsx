import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import ParticleBackground from '../components/ParticleBackground';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const filters = ['All', 'Summit', 'Workshop', 'Seminar', 'Funding'];

const cardGradients = {
  Summit:   'linear-gradient(135deg,#001d5c,#1a56db 55%,#4f46e5)',
  Workshop: 'linear-gradient(135deg,#0891b2,#059669)',
  Seminar:  'linear-gradient(135deg,#7c3aed,#ec4899)',
  Funding:  'linear-gradient(135deg,#f59e0b,#f97316)',
};

const MODAL_STYLES = `
  @keyframes fbModalIn { from { transform:scale(0.84);opacity:0 } to { transform:scale(1);opacity:1 } }
  @keyframes checkPop  { 0%{transform:scale(0)}60%{transform:scale(1.3)}100%{transform:scale(1)} }
  .reg-input {
    width:100%; box-sizing:border-box;
    border:1.5px solid rgba(255,255,255,0.15); border-radius:10px;
    padding:10px 14px; font-size:13.5px; font-family:inherit;
    color:#fff; outline:none; transition:border-color 0.15s;
    background:rgba(255,255,255,0.07);
  }
  .reg-input::placeholder { color:rgba(255,255,255,0.35); }
  .reg-input:focus { border-color:#f97316; background:rgba(255,255,255,0.12); }
  .reg-input:read-only { background:rgba(255,255,255,0.04); color:rgba(255,255,255,0.45); cursor:default; }
`;

export default function EventsPage() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [active, setActive]       = useState('All');
  const [events, setEvents]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [formModal, setFormModal] = useState(null);   // step 1 — form
  const [okModal, setOkModal]     = useState(null);   // step 2 — success
  const [errModal, setErrModal]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  // map of eventId -> { attended: bool } for the logged-in user
  const [myRegs, setMyRegs]       = useState({});
  const [cancelling, setCancelling] = useState(null); // eventId being cancelled

  // form fields
  const [fname, setFname]             = useState('');
  const [phone, setPhone]             = useState('');
  const [institution, setInstitution] = useState('');
  const [fnameErr, setFnameErr]       = useState(false);

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
        const map = {};
        regs.forEach(r => { map[r.event_id] = { attended: r.attended ?? false }; });
        setMyRegs(map);
      })
      .catch(() => {});
  }, [user]);

  async function cancelRegistration(ev) {
    if (!window.confirm(`Cancel your registration for "${ev.title}"?`)) return;
    setCancelling(ev.id);
    try {
      await api.events.unregister(ev.id);
      setMyRegs(prev => { const n = { ...prev }; delete n[ev.id]; return n; });
      setEvents(prev => prev.map(e => e.id === ev.id ? { ...e, enrolled: Math.max(0, e.enrolled - 1) } : e));
    } catch (err) {
      setErrModal(err.message || 'Failed to cancel registration');
    } finally {
      setCancelling(null);
    }
  }

  async function markAttended(ev) {
    try {
      await api.events.markAttendSelf(ev.id);
      setMyRegs(prev => ({ ...prev, [ev.id]: { attended: true } }));
    } catch (err) {
      setErrModal(err.message || 'Failed to mark attendance');
    }
  }

  function openForm(ev) {
    if (!user) { setErrModal('login'); return; }
    setFname(user.name || '');
    setPhone(user.phone || '');
    setInstitution(user.institution || '');
    setFnameErr(false);
    setFormModal(ev);
  }

  async function submitRegistration() {
    if (!fname.trim()) { setFnameErr(true); return; }
    setSubmitting(true);
    try {
      const res = await api.events.register(formModal.id);
      const newEnrolled = res.enrolled ?? formModal.enrolled + 1;
      const updated = { ...formModal, enrolled: newEnrolled };
      setEvents(prev => prev.map(e => e.id === formModal.id ? updated : e));
      setFormModal(null);
      setOkModal({ event: updated, name: fname, phone, institution, email: user.email, role: user.role });
    } catch (err) {
      const msg = err.message || '';
      setFormModal(null);
      if (msg.toLowerCase().includes('already')) setErrModal('already');
      else setErrModal(msg || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  const gradient = ev => cardGradients[ev?.category] || cardGradients.Summit;

  return (
    <div style={{ background:'linear-gradient(180deg,#000d30 0%,#020817 300px,#0f172a 100%)', minHeight:'100vh', position:'relative' }}>
      <ParticleBackground density={45} />
      <div style={{ position:'relative', zIndex:1 }}>
      <style>{MODAL_STYLES}</style>
      <PageHeader eyebrow="Consortium Events" title="Events & Activities" />

      {/* ── STEP 1: Registration Form Modal ── */}
      {formModal && (
        <div onClick={() => !submitting && setFormModal(null)} style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.6)',
          zIndex:9100, display:'flex', alignItems:'center', justifyContent:'center', padding:20,
          overflowY:'auto',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background:'linear-gradient(180deg,#0f172a,#020817)', borderRadius:22, maxWidth:480, width:'100%',
            boxShadow:'0 32px 100px rgba(0,0,0,0.7)', overflow:'hidden',
            border:'1px solid rgba(255,255,255,0.1)',
            animation:'fbModalIn 0.24s cubic-bezier(.34,1.56,.64,1)',
            margin:'auto',
          }}>
            {/* banner */}
            <div style={{ background: gradient(formModal), padding:'22px 24px 18px', position:'relative' }}>
              <button onClick={() => setFormModal(null)} style={{
                position:'absolute', top:14, right:14,
                background:'rgba(255,255,255,0.2)', border:'none', borderRadius:'50%',
                width:30, height:30, color:'#fff', fontSize:16, cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>✕</button>
              <div style={{ color:'rgba(255,255,255,0.7)', fontSize:11.5, fontWeight:700, marginBottom:4 }}>
                EVENT REGISTRATION
              </div>
              <div style={{ color:'#fff', fontSize:18, fontWeight:900, lineHeight:1.3 }}>{formModal.title}</div>
              <div style={{ display:'flex', gap:16, marginTop:10 }}>
                {[
                  { icon:'📅', val: formModal.date },
                  { icon:'📍', val: formModal.venue },
                ].map(r => (
                  <div key={r.val} style={{ color:'rgba(255,255,255,0.85)', fontSize:12, display:'flex', alignItems:'center', gap:4 }}>
                    <span>{r.icon}</span>{r.val}
                  </div>
                ))}
              </div>
              <div style={{ marginTop:10, background:'rgba(255,255,255,0.15)', borderRadius:8, padding:'6px 12px', display:'inline-flex', gap:6, alignItems:'center' }}>
                <span style={{ color:'rgba(255,255,255,0.7)', fontSize:11.5 }}>Slots left:</span>
                <span style={{ color:'#fff', fontWeight:800, fontSize:13 }}>{formModal.total - formModal.enrolled}</span>
              </div>
            </div>

            {/* form body */}
            <div style={{ padding:'20px 24px 24px' }}>
              <div style={{ fontSize:13.5, fontWeight:700, color:'#fff', marginBottom:16 }}>
                📋 Your Registration Details
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {/* full name */}
                <div>
                  <label style={{ fontSize:11.5, fontWeight:700, color: fnameErr ? '#e11d48' : '#64748b', display:'block', marginBottom:5 }}>
                    FULL NAME <span style={{ color:'#e11d48' }}>*</span>
                    <span style={{ fontSize:10.5, fontWeight:400, color:'#94a3b8', marginLeft:4 }}>required</span>
                  </label>
                  <input
                    className="reg-input"
                    value={fname}
                    onChange={e => { setFname(e.target.value); if (e.target.value.trim()) setFnameErr(false); }}
                    placeholder="Enter your full name"
                    style={{ borderColor: fnameErr ? '#e11d48' : undefined, background: fnameErr ? '#fff5f5' : undefined }}
                  />
                  {fnameErr && (
                    <div style={{ marginTop:6, fontSize:12, color:'#e11d48', fontWeight:600, display:'flex', alignItems:'center', gap:5 }}>
                      <span>⚠</span> Full name is required to register.
                    </div>
                  )}
                </div>

                {/* email — read only (from account) */}
                <div>
                  <label style={{ fontSize:11.5, fontWeight:700, color:'#64748b', display:'block', marginBottom:5 }}>
                    EMAIL ADDRESS
                  </label>
                  <input className="reg-input" readOnly value={user?.email || ''} />
                </div>

                {/* phone */}
                <div>
                  <label style={{ fontSize:11.5, fontWeight:700, color:'#64748b', display:'block', marginBottom:5 }}>
                    PHONE NUMBER <span style={{ fontSize:10.5, fontWeight:400, color:'#94a3b8' }}>(optional)</span>
                  </label>
                  <input
                    className="reg-input"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="e.g. 09XX-XXX-XXXX"
                  />
                </div>

                {/* institution */}
                <div>
                  <label style={{ fontSize:11.5, fontWeight:700, color:'#64748b', display:'block', marginBottom:5 }}>
                    INSTITUTION / ORGANIZATION <span style={{ fontSize:10.5, fontWeight:400, color:'#94a3b8' }}>(optional)</span>
                  </label>
                  <input
                    className="reg-input"
                    value={institution}
                    onChange={e => setInstitution(e.target.value)}
                    placeholder="e.g. University of the Philippines"
                  />
                </div>

                {/* role badge */}
                <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'rgba(255,255,255,0.06)', borderRadius:10, border:'1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ fontSize:16 }}>🪪</span>
                  <div>
                    <div style={{ fontSize:11, color:'#94a3b8', fontWeight:700 }}>ACCOUNT TYPE</div>
                    <div style={{
                      fontSize:12, fontWeight:800,
                      color: user?.role === 'ADMIN' ? '#713f12' : user?.role === 'MEMBER' ? '#14532d' : '#1e40af',
                    }}>{user?.role || 'GUEST'}</div>
                  </div>
                </div>
              </div>

              <div style={{ height:1, background:'rgba(255,255,255,0.08)', margin:'18px 0' }} />

              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setFormModal(null)} disabled={submitting} style={{
                  flex:1, background:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.6)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:12,
                  padding:'12px', fontSize:13.5, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
                }}>Cancel</button>
                <button onClick={submitRegistration} disabled={submitting} style={{
                  flex:2, background: submitting ? '#94a3b8' : 'linear-gradient(90deg,#f97316,#e11d48)',
                  color:'#fff', border:'none', borderRadius:12,
                  padding:'12px', fontSize:14, fontWeight:800, cursor: submitting ? 'not-allowed' : 'pointer',
                  fontFamily:'inherit', transition:'all 0.2s',
                }}>
                  {submitting ? '⏳ Submitting…' : '✅ Confirm Registration'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 2: Success Modal ── */}
      {okModal && (
        <div onClick={() => setOkModal(null)} style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.65)',
          zIndex:9100, display:'flex', alignItems:'center', justifyContent:'center', padding:20,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background:'#0f172a', borderRadius:24, maxWidth:520, width:'100%',
            boxShadow:'0 40px 120px rgba(0,0,0,0.8)', overflow:'hidden',
            border:'1px solid rgba(255,255,255,0.1)',
            animation:'fbModalIn 0.28s cubic-bezier(.34,1.56,.64,1)',
            maxHeight:'92vh', display:'flex', flexDirection:'column',
          }}>
            {/* Header */}
            <div style={{ background: gradient(okModal.event), padding:'36px 32px 60px', textAlign:'center', position:'relative', flexShrink:0 }}>
              {/* ✕ Close button */}
              <button onClick={() => setOkModal(null)} style={{
                position:'absolute', top:14, right:14, width:34, height:34, borderRadius:'50%',
                background:'rgba(255,255,255,0.18)', border:'1px solid rgba(255,255,255,0.3)',
                color:'#fff', fontSize:16, cursor:'pointer', display:'flex', alignItems:'center',
                justifyContent:'center', backdropFilter:'blur(4px)', transition:'all .15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.3)'}
              onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.18)'}
              >✕</button>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.6)', fontWeight:700, letterSpacing:1, textTransform:'uppercase', marginBottom:8 }}>Registration Confirmed</div>
              <div style={{ color:'#fff', fontSize:22, fontWeight:900, lineHeight:1.3 }}>{okModal.event.title}</div>
              <div style={{ color:'rgba(255,255,255,0.65)', fontSize:13, marginTop:6 }}>{okModal.event.category}</div>
              {/* Avatar */}
              <div style={{
                position:'absolute', bottom:-40, left:'50%', transform:'translateX(-50%)',
                width:80, height:80, borderRadius:'50%',
                background:'linear-gradient(135deg,#f97316,#e11d48)',
                border:'4px solid #0f172a',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:32, fontWeight:900, color:'#fff',
                boxShadow:'0 8px 24px rgba(0,0,0,0.4)',
              }}>
                {(okModal.name || 'U')[0].toUpperCase()}
              </div>
            </div>

            {/* User info */}
            <div style={{ paddingTop:54, paddingBottom:20, paddingLeft:32, paddingRight:32, textAlign:'center' }}>
              <div style={{ fontWeight:900, fontSize:19, color:'#fff' }}>{okModal.name}</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.5)', marginTop:3 }}>{okModal.email}</div>
              {okModal.institution && <div style={{ fontSize:12.5, color:'rgba(255,255,255,0.4)', marginTop:3 }}>🏛 {okModal.institution}</div>}
              {okModal.phone && <div style={{ fontSize:12.5, color:'rgba(255,255,255,0.4)', marginTop:3 }}>📞 {okModal.phone}</div>}
              <span style={{
                display:'inline-block', marginTop:10,
                background: okModal.role === 'ADMIN' ? 'rgba(239,68,68,0.18)' : okModal.role === 'MEMBER' ? 'rgba(16,185,129,0.18)' : 'rgba(99,102,241,0.18)',
                color: okModal.role === 'ADMIN' ? '#fca5a5' : okModal.role === 'MEMBER' ? '#6ee7b7' : '#a5b4fc',
                border: `1px solid ${okModal.role === 'ADMIN' ? 'rgba(239,68,68,0.35)' : okModal.role === 'MEMBER' ? 'rgba(16,185,129,0.35)' : 'rgba(99,102,241,0.35)'}`,
                borderRadius:20, padding:'4px 16px', fontSize:11.5, fontWeight:800, letterSpacing:0.5,
              }}>
                {okModal.role === 'ADMIN' ? '🛡 Administrator' : okModal.role === 'MEMBER' ? '✓ Member' : '○ Guest'}
              </span>
            </div>

            <div style={{ height:1, background:'rgba(255,255,255,0.07)', margin:'0 32px' }} />

            {/* Event detail rows */}
            <div style={{ padding:'20px 32px 28px', display:'flex', flexDirection:'column', gap:10, overflowY:'auto' }}>
              {[
                { icon:'📅', label:'DATE',       value: okModal.event.date },
                { icon:'📍', label:'VENUE',      value: okModal.event.venue },
                { icon:'🏛',  label:'ORGANIZER', value: okModal.event.organizer },
                { icon:'👥', label:'ENROLLMENT', value: `${okModal.event.enrolled} / ${okModal.event.total} registered` },
              ].map(r => (
                <div key={r.label} style={{
                  display:'flex', alignItems:'center', gap:14,
                  background:'rgba(255,255,255,0.05)', borderRadius:12, padding:'12px 16px',
                  border:'1px solid rgba(255,255,255,0.07)',
                }}>
                  <span style={{ fontSize:18, flexShrink:0 }}>{r.icon}</span>
                  <div>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', fontWeight:700, letterSpacing:0.8, textTransform:'uppercase' }}>{r.label}</div>
                    <div style={{ fontSize:14, color:'#fff', fontWeight:700, marginTop:2 }}>{r.value}</div>
                  </div>
                </div>
              ))}

              {/* Confirmation notice */}
              <div style={{
                background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.25)', borderRadius:12,
                padding:'16px 18px', marginTop:2,
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                  <span style={{ animation:'checkPop 0.4s 0.15s both', display:'inline-block', fontSize:18 }}>✅</span>
                  <span style={{ fontSize:14, color:'#34d399', fontWeight:800 }}>You&apos;re all set!</span>
                </div>
                <div style={{ fontSize:13, color:'rgba(52,211,153,0.75)', lineHeight:1.6 }}>
                  A confirmation email has been sent to{' '}
                  <strong style={{ color:'#34d399' }}>{okModal.email}</strong>.{' '}
                  Check your inbox for event details and bring this confirmation on the day.
                </div>
              </div>

              <button onClick={() => setOkModal(null)} style={{
                width:'100%', background:'linear-gradient(90deg,#f97316,#e11d48)',
                color:'#fff', border:'none', borderRadius:14, padding:'15px',
                fontSize:15, fontWeight:800, cursor:'pointer', fontFamily:'inherit', marginTop:4,
                letterSpacing:0.3,
              }}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Error Modal ── */}
      {errModal && (
        <div onClick={() => setErrModal('')} style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.55)',
          zIndex:9200, display:'flex', alignItems:'center', justifyContent:'center', padding:24,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background:'linear-gradient(180deg,#0f172a,#020817)', borderRadius:20, maxWidth:380, width:'100%',
            boxShadow:'0 24px 80px rgba(0,0,0,0.7)', overflow:'hidden',
            border:'1px solid rgba(255,255,255,0.1)',
            animation:'fbModalIn 0.22s cubic-bezier(.34,1.56,.64,1)',
          }}>
            {errModal === 'login' ? (
              <>
                <div style={{ background:'linear-gradient(135deg,#001d5c,#1a56db)', padding:'28px 24px 20px', textAlign:'center' }}>
                  <div style={{ fontSize:46 }}>🔐</div>
                  <div style={{ color:'#fff', fontSize:19, fontWeight:900, marginTop:8 }}>Login Required</div>
                  <div style={{ color:'rgba(255,255,255,0.75)', fontSize:12.5, marginTop:4 }}>Sign in to register for events</div>
                </div>
                <div style={{ padding:'20px 24px 24px', display:'flex', flexDirection:'column', gap:10 }}>
                  <button onClick={() => { setErrModal(''); navigate('/login'); }} style={{
                    width:'100%', background:'linear-gradient(90deg,#f97316,#e11d48)',
                    color:'#fff', border:'none', borderRadius:12, padding:'13px',
                    fontSize:14.5, fontWeight:800, cursor:'pointer', fontFamily:'inherit',
                  }}>Log In →</button>
                  <button onClick={() => setErrModal('')} style={{
                    width:'100%', background:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.6)',
                    border:'1px solid rgba(255,255,255,0.12)', borderRadius:12, padding:'11px',
                    fontSize:13.5, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
                  }}>Cancel</button>
                </div>
              </>
            ) : errModal === 'already' ? (
              <>
                <div style={{ background:'linear-gradient(135deg,#f59e0b,#f97316)', padding:'28px 24px 20px', textAlign:'center' }}>
                  <div style={{ fontSize:46 }}>✅</div>
                  <div style={{ color:'#fff', fontSize:19, fontWeight:900, marginTop:8 }}>Already Registered!</div>
                  <div style={{ color:'rgba(255,255,255,0.8)', fontSize:12.5, marginTop:4 }}>You've already signed up for this event</div>
                </div>
                <div style={{ padding:'20px 24px 24px' }}>
                  <p style={{ color:'rgba(255,255,255,0.55)', fontSize:13.5, textAlign:'center', marginBottom:16 }}>
                    Your spot is already confirmed for this event.
                  </p>
                  <button onClick={() => setErrModal('')} style={{
                    width:'100%', background:'linear-gradient(90deg,#f97316,#e11d48)',
                    color:'#fff', border:'none', borderRadius:12, padding:'13px',
                    fontSize:14.5, fontWeight:800, cursor:'pointer', fontFamily:'inherit',
                  }}>Got it</button>
                </div>
              </>
            ) : (
              <>
                <div style={{ background:'linear-gradient(135deg,#e11d48,#7c3aed)', padding:'28px 24px 20px', textAlign:'center' }}>
                  <div style={{ fontSize:46 }}>⚠️</div>
                  <div style={{ color:'#fff', fontSize:19, fontWeight:900, marginTop:8 }}>Registration Failed</div>
                </div>
                <div style={{ padding:'20px 24px 24px' }}>
                  <p style={{ color:'rgba(255,255,255,0.55)', fontSize:13.5, textAlign:'center', marginBottom:16 }}>{errModal}</p>
                  <button onClick={() => setErrModal('')} style={{
                    width:'100%', background:'linear-gradient(90deg,#f97316,#e11d48)',
                    color:'#fff', border:'none', borderRadius:12, padding:'13px',
                    fontSize:14.5, fontWeight:800, cursor:'pointer', fontFamily:'inherit',
                  }}>Close</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <section style={{ padding:'32px 24px 80px' }}>
        <div style={{ maxWidth:1120, margin:'0 auto' }}>
          <div style={{ display:'flex', gap:8, marginBottom:28, flexWrap:'wrap' }}>
            {filters.map(f => (
              <button key={f} onClick={() => setActive(f)} style={{
                background: active === f ? 'linear-gradient(90deg,#f97316,#e11d48)' : 'rgba(255,255,255,0.07)',
                color: active === f ? '#fff' : 'rgba(255,255,255,0.6)',
                border: active === f ? 'none' : '1px solid rgba(255,255,255,0.15)',
                borderRadius:20, padding:'7px 18px', fontSize:13,
                fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s',
                boxShadow: active === f ? '0 4px 14px rgba(249,115,22,0.35)' : 'none',
              }}>{f}</button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign:'center', padding:'60px 0', color:'rgba(255,255,255,0.35)', fontSize:14 }}>
              <div style={{ fontSize:36, marginBottom:12 }}>⏳</div>Loading events…
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:18 }}>
              {events.map(ev => (
                <EventCard key={ev.id}
                  ev={{ ...ev, bg: cardGradients[ev.category] || cardGradients.Summit }}
                  myReg={myRegs[ev.id]}
                  isCancelling={cancelling === ev.id}
                  onRegister={() => openForm(ev)}
                  onAttend={() => markAttended(ev)}
                  onCancel={() => cancelRegistration(ev)} />
              ))}
            </div>
          )}
        </div>
      </section>
      </div>
    </div>
  );
}

function EventCard({ ev, myReg, isCancelling, onRegister, onAttend, onCancel }) {
  const [tilt, setTilt]       = useState({ x: 0, y: 0 });
  const [shine, setShine]     = useState({ x: 50, y: 50 });
  const [hovered, setHovered] = useState(false);
  const cardRef               = useRef(null);
  const pct       = ev.total > 0 ? Math.min(100, Math.round((ev.enrolled / ev.total) * 100)) : 0;
  const full      = ev.total > 0 && ev.enrolled >= ev.total;
  const registered = !!myReg;
  const attended   = myReg?.attended === true;

  function onMouseMove(e) {
    const rect = cardRef.current.getBoundingClientRect();
    const cx   = rect.left + rect.width  / 2;
    const cy   = rect.top  + rect.height / 2;
    const dx   = (e.clientX - cx) / (rect.width  / 2);
    const dy   = (e.clientY - cy) / (rect.height / 2);
    setTilt({ x: -dy * 12, y: dx * 12 });
    setShine({
      x: ((e.clientX - rect.left) / rect.width)  * 100,
      y: ((e.clientY - rect.top)  / rect.height) * 100,
    });
  }

  function onMouseLeave() {
    setHovered(false);
    setTilt({ x: 0, y: 0 });
    setShine({ x: 50, y: 50 });
  }

  return (
    <div style={{ perspective: '800px' }}>
      <div
        ref={cardRef}
        onMouseEnter={() => setHovered(true)}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        style={{
          background:'rgba(15,23,42,0.85)', borderRadius:18, overflow:'hidden',
          border:'1px solid rgba(255,255,255,0.1)',
          transition: hovered ? 'box-shadow 0.1s' : 'transform 0.5s ease, box-shadow 0.5s ease',
          transform: hovered
            ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(10px) scale(1.02)`
            : 'rotateX(0deg) rotateY(0deg) translateZ(0px) scale(1)',
          boxShadow: hovered
            ? `0 30px 60px rgba(0,29,92,0.22), 0 8px 20px rgba(0,0,0,0.14), ${tilt.y > 0 ? '-' : ''}6px 6px 20px rgba(0,29,92,0.1)`
            : '0 4px 18px rgba(0,29,92,0.07)',
          position:'relative', willChange:'transform',
          transformStyle:'preserve-3d',
        }}
      >
        {/* coloured banner */}
        <div style={{ height:155, background:ev.bg, position:'relative', display:'flex', alignItems:'flex-end', padding:16 }}>
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.12)' }} />

          {/* 3-D shine sweep */}
          {hovered && (
            <div style={{
              position:'absolute', inset:0, pointerEvents:'none', zIndex:2,
              background:`radial-gradient(circle at ${shine.x}% ${shine.y}%, rgba(255,255,255,0.28) 0%, transparent 65%)`,
              borderRadius:'18px 18px 0 0',
              transition:'background 0.05s',
            }} />
          )}

          {/* floating depth badge */}
          <div style={{
            position:'absolute', top:14, right:14, zIndex:3,
            background:'rgba(255,255,255,0.15)',
            backdropFilter:'blur(6px)',
            border:'1px solid rgba(255,255,255,0.3)',
            borderRadius:10, padding:'6px 12px',
            transform:'translateZ(20px)',
            boxShadow:'0 4px 12px rgba(0,0,0,0.15)',
          }}>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.7)', fontWeight:700 }}>SLOTS LEFT</div>
            <div style={{ fontSize:15, color:'#fff', fontWeight:900, textAlign:'center' }}>{ev.total - ev.enrolled}</div>
          </div>

          <div style={{ position:'relative', zIndex:3, display:'flex', gap:8, alignItems:'center', transform:'translateZ(15px)' }}>
            <span style={{
              background:'rgba(255,255,255,0.22)', color:'#fff',
              border:'1px solid rgba(255,255,255,0.35)',
              borderRadius:6, padding:'4px 11px', fontSize:11, fontWeight:800,
              backdropFilter:'blur(4px)',
            }}>{ev.category}</span>
            <span style={{ color:'rgba(255,255,255,0.85)', fontSize:11.5, fontWeight:600 }}>{ev.date}</span>
          </div>
        </div>

        {/* card body */}
        <div style={{ padding:'18px 20px 20px', position:'relative' }}>
          {/* bottom shine */}
          {hovered && (
            <div style={{
              position:'absolute', inset:0, pointerEvents:'none', zIndex:0,
              background:`radial-gradient(circle at ${shine.x}% ${shine.y + 30}%, rgba(249,115,22,0.06) 0%, transparent 70%)`,
              transition:'background 0.05s',
            }} />
          )}

          <h3 style={{ fontWeight:900, fontSize:16, color:'#fff', lineHeight:1.3, marginBottom:8, position:'relative', zIndex:1, transform:'translateZ(8px)' }}>
            {ev.title}
          </h3>
          <div style={{ color:'rgba(255,255,255,0.6)', fontSize:12.5, marginBottom:4, zIndex:1, position:'relative' }}>📍 {ev.venue}</div>
          <div style={{ color:'rgba(255,255,255,0.6)', fontSize:12.5, marginBottom: ev.registration_deadline ? 4 : 16, zIndex:1, position:'relative' }}>🏛 {ev.organizer}</div>
          {ev.registration_deadline && (
            <div style={{ color: new Date(ev.registration_deadline) < new Date() ? '#f87171' : '#fbbf24', fontSize:12, marginBottom:16, zIndex:1, position:'relative', fontWeight:600 }}>
              ⏰ Reg. deadline: {new Date(ev.registration_deadline).toLocaleDateString('en-PH', { year:'numeric', month:'short', day:'numeric' })}
            </div>
          )}

          <div style={{ marginBottom:16, position:'relative', zIndex:1 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11.5, color:'rgba(255,255,255,0.55)', marginBottom:6 }}>
              <span>Enrollment</span><span style={{ fontWeight:700 }}>{ev.enrolled}/{ev.total}</span>
            </div>
            <div style={{ height:7, background:'rgba(255,255,255,0.12)', borderRadius:4, overflow:'hidden' }}>
              <div style={{
                height:'100%', width:`${pct}%`,
                background:'linear-gradient(90deg,#f97316,#e11d48)',
                borderRadius:4,
                boxShadow:'0 1px 4px rgba(249,115,22,0.5)',
              }} />
            </div>
          </div>

          {attended ? (
            <div style={{
              width:'100%', position:'relative', zIndex:1, boxSizing:'border-box',
              background:'rgba(16,185,129,0.15)', border:'1.5px solid rgba(16,185,129,0.4)',
              borderRadius:12, padding:'11px', fontSize:13.5, fontWeight:800,
              color:'#34d399', textAlign:'center',
            }}>✅ Attended</div>
          ) : registered ? (
            <div style={{ display:'flex', flexDirection:'column', gap:8, position:'relative', zIndex:1 }}>
              <div style={{ display:'flex', gap:8 }}>
                <div style={{
                  flex:1, background:'rgba(74,222,128,0.12)', border:'1.5px solid rgba(74,222,128,0.3)',
                  borderRadius:12, padding:'11px', fontSize:12.5, fontWeight:700,
                  color:'#4ade80', textAlign:'center',
                }}>✓ Registered</div>
                <button onClick={onAttend} style={{
                  flex:1, background:'linear-gradient(90deg,#059669,#0891b2)',
                  color:'#fff', border:'none', borderRadius:12,
                  padding:'11px', fontSize:12.5, fontWeight:800,
                  cursor:'pointer', fontFamily:'inherit',
                  boxShadow:'0 4px 14px rgba(5,150,105,0.35)',
                }}>Mark Attended</button>
              </div>
              <button onClick={onCancel} disabled={isCancelling} style={{
                width:'100%', background:'transparent',
                border:'1.5px solid rgba(225,29,72,0.35)',
                borderRadius:12, padding:'9px', fontSize:12.5, fontWeight:700,
                color:'rgba(244,63,94,0.85)', cursor: isCancelling ? 'not-allowed' : 'pointer',
                fontFamily:'inherit', transition:'all .15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(225,29,72,0.12)'; e.currentTarget.style.color='#f43f5e'; }}
              onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='rgba(244,63,94,0.85)'; }}
              >
                {isCancelling ? '⏳ Cancelling…' : '✕ Cancel Registration'}
              </button>
            </div>
          ) : (
            <button onClick={onRegister} disabled={full}
              style={{
                width:'100%', position:'relative', zIndex:1,
                background: full ? '#e2e8f0' : 'linear-gradient(90deg,#f97316,#e11d48)',
                color: full ? '#94a3b8' : '#fff',
                border:'none', borderRadius:12, padding:'11px', fontSize:13.5, fontWeight:800,
                cursor: full ? 'not-allowed' : 'pointer', fontFamily:'inherit',
                boxShadow: full ? 'none' : '0 4px 14px rgba(249,115,22,0.45)',
                transform: hovered && !full ? 'translateZ(16px)' : 'translateZ(0)',
                transition:'transform 0.2s, box-shadow 0.2s',
              }}
            >{full ? 'Fully Booked' : '✦ Register'}</button>
          )}
        </div>
      </div>
    </div>
  );
}
