import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import ParticleBackground from '../components/ParticleBackground';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const filters = ['All', 'Summit', 'Workshop', 'Seminar', 'Funding'];

const CATEGORY_STYLES = {
  Summit:   { color: '#60a5fa', bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.3)', icon: '🏛️' },
  Workshop: { color: '#34d399', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)', icon: '💻' },
  Seminar:  { color: '#c084fc', bg: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.3)', icon: '🎤' },
  Funding:  { color: '#fbbf24', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)', icon: '💰' },
};

const M2I = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 };

function parseRange(str) {
  if (!str) return null;
  const yMatch = str.match(/\b(\d{4})\b/);
  if (!yMatch) return null;
  const yr = +yMatch[1];

  const cross = str.match(/([A-Z][a-z]{2})\s+(\d+)\s*[–\-]\s*([A-Z][a-z]{2})\s+(\d+)/);
  if (cross && M2I[cross[1]] !== undefined && M2I[cross[3]] !== undefined) {
    return { start: new Date(yr, M2I[cross[1]], +cross[2]), end: new Date(yr, M2I[cross[3]], +cross[4]) };
  }
  const same = str.match(/([A-Z][a-z]{2})\s+(\d+)[–\-](\d+)/);
  if (same && M2I[same[1]] !== undefined) {
    return { start: new Date(yr, M2I[same[1]], +same[2]), end: new Date(yr, M2I[same[1]], +same[3]) };
  }
  const single = str.match(/([A-Z][a-z]{2})\s+(\d+)/);
  if (single && M2I[single[1]] !== undefined) {
    const d = new Date(yr, M2I[single[1]], +single[2]);
    return { start: d, end: d };
  }
  return null;
}

function CancelConfirmModal({ title, subtitle, onConfirm, onCancel, confirming }) {
  return (
    <div onClick={onCancel} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:9500, display:'flex', alignItems:'center', justifyContent:'center', padding:20, backdropFilter:'blur(6px)' }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#070d1c', border:'1px solid rgba(225,29,72,0.35)', borderRadius:20, maxWidth:'min(420px,calc(100vw - 32px))', width:'100%', padding:'28px 26px', boxShadow:'0 32px 80px rgba(0,0,0,0.85)', textAlign:'center' }}>
        <div style={{ fontSize:40, marginBottom:12 }}>⚠️</div>
        <div style={{ color:'#fff', fontWeight:900, fontSize:18, marginBottom:6 }}>{title}</div>
        <p style={{ color:'rgba(255,255,255,0.6)', fontSize:13.5, lineHeight:1.6, marginBottom:22 }}>{subtitle}</p>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onCancel} style={{ flex:1, background:'rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.7)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:11, padding:'11px', fontSize:13.5, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
            Keep Registration
          </button>
          <button onClick={onConfirm} disabled={confirming} style={{ flex:1, background: confirming ? '#475569' : 'linear-gradient(90deg,#e11d48,#be123c)', color:'#fff', border:'none', borderRadius:11, padding:'11px', fontSize:13.5, fontWeight:800, cursor: confirming ? 'not-allowed' : 'pointer', fontFamily:'inherit', boxShadow: confirming ? 'none' : '0 4px 14px rgba(225,29,72,0.4)' }}>
            {confirming ? '⏳ Cancelling…' : 'Yes, Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}

const CSS = `
  .event-card {
    background: rgba(8, 13, 26, 0.94);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 18px;
    overflow: hidden;
    transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
    display: flex;
    flex-direction: column;
    position: relative;
  }
  .event-card:hover {
    transform: translateY(-3px);
    border-color: rgba(249, 115, 22, 0.4);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
  }
  .ev-filter-pill {
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
  .reg-input {
    width:100%; box-sizing:border-box;
    border:1.5px solid rgba(255,255,255,0.15); border-radius:10px;
    padding:11px 14px; font-size:13.5px; font-family:inherit;
    color:#fff; outline:none; transition:border-color 0.15s;
    background:rgba(255,255,255,0.07);
  }
  .reg-input:focus { border-color:#f97316; background:rgba(255,255,255,0.12); }
  .reg-input:read-only { background:rgba(255,255,255,0.04); color:rgba(255,255,255,0.45); cursor:default; }
`;

export default function EventsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('events');
  const [active, setActive]       = useState('All');
  const [search, setSearch]       = useState('');
  const [events, setEvents]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [formModal, setFormModal] = useState(null);
  const [conflictModal, setConflictModal] = useState(null);
  const [okModal, setOkModal]     = useState(null);
  const [errModal, setErrModal]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [myRegs, setMyRegs]       = useState({});
  const [cancelling, setCancelling] = useState(null);
  const [cancelConfirm, setCancelConfirm] = useState(null);

  // Form fields
  const [fname, setFname]             = useState('');
  const [phone, setPhone]             = useState('');
  const [institution, setInstitution] = useState('');
  const [fnameErr, setFnameErr]       = useState(false);

  function loadEvents() {
    setLoading(true);
    api.events.list({ category: active !== 'All' ? active : undefined, search: search.trim() || undefined })
      .then(r => setEvents(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const timer = setTimeout(() => { loadEvents(); }, 150);
    return () => clearTimeout(timer);
  }, [active, search]);

  useEffect(() => {
    if (!user) return;
    api.auth.myRegistrations()
      .then(regs => {
        const map = {};
        regs.forEach(r => { map[+r.event_id] = { attended: r.attended ?? false }; });
        setMyRegs(map);
      })
      .catch(() => {});
  }, [user]);

  // Compute registered events with date ranges
  const registeredEventsWithDate = events
    .filter(e => myRegs[e.id])
    .map(e => ({ ...e, range: parseRange(e.date) }))
    .filter(e => e.range?.start);

  // Map each event to conflicting registered events
  const eventConflictsMap = {};
  events.forEach(ev => {
    const r = parseRange(ev.date);
    if (!r?.start) return;
    const tStart = r.start.getTime();
    const tEnd = (r.end || r.start).getTime();

    const conflicts = registeredEventsWithDate.filter(regEv => {
      if (regEv.id === ev.id) return false;
      const rStart = regEv.range.start.getTime();
      const rEnd = (regEv.range.end || regEv.range.start).getTime();
      return tStart <= rEnd && rStart <= tEnd;
    });

    if (conflicts.length > 0) {
      eventConflictsMap[ev.id] = conflicts;
    }
  });

  function cancelRegistration(ev) { setCancelConfirm(ev); }

  async function doCancelRegistration() {
    const ev = cancelConfirm;
    if (!ev) return;
    setCancelConfirm(null);
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

  function handleRegisterClick(ev) {
    if (!user) { setErrModal('login'); return; }
    const conflicts = eventConflictsMap[ev.id];
    if (conflicts && conflicts.length > 0) {
      setConflictModal({ event: ev, conflictsWith: conflicts });
      return;
    }
    startForm(ev);
  }

  function startForm(ev) {
    setFname(user?.name || '');
    setPhone(user?.phone || '');
    setInstitution(user?.institution || '');
    setFnameErr(false);
    setConflictModal(null);
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
      setMyRegs(prev => ({ ...prev, [formModal.id]: { attended: false } }));
      setFormModal(null);
      setOkModal({ event: updated, name: fname, phone, institution, email: user?.email || '', role: user?.role || 'GUEST' });
    } catch (err) {
      const msg = err.message || '';
      setFormModal(null);
      if (msg.toLowerCase().includes('already')) setErrModal('already');
      else setErrModal(msg || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  // Filter category counts
  const counts = {
    All: events.length,
    Registered: Object.keys(myRegs).length,
  };
  filters.slice(1).forEach(f => {
    counts[f] = events.filter(e => e.category === f).length;
  });

  const displayedEvents = active === 'Registered'
    ? events.filter(e => myRegs[e.id])
    : events;

  return (
    <div style={{ background:'linear-gradient(180deg,#000d30 0%,#020817 300px,#0f172a 100%)', minHeight:'100vh', position:'relative' }}>
      <ParticleBackground density={35} />
      <div style={{ position:'relative', zIndex:1 }}>
        <style>{CSS}</style>
        <PageHeader eyebrow="Consortium Programs" title="Events, Summits & Workshops" />

        {/* ── Cancel registration confirmation modal ── */}
        {cancelConfirm && (
          <CancelConfirmModal
            title="Cancel Registration?"
            subtitle={`Are you sure you want to cancel your slot for "${cancelConfirm.title}"? Your seat will be released.`}
            confirming={!!cancelling}
            onConfirm={doCancelRegistration}
            onCancel={() => setCancelConfirm(null)}
          />
        )}

        {/* ── Conflict Warning Modal ── */}
        {conflictModal && (
          <div onClick={() => setConflictModal(null)} style={{
            position:'fixed', inset:0, background:'rgba(0,0,0,0.8)',
            zIndex:9400, display:'flex', alignItems:'center', justifyContent:'center', padding:20,
            backdropFilter:'blur(8px)',
          }}>
            <div onClick={e => e.stopPropagation()} style={{
              background:'#070d1c', borderRadius:20, maxWidth:'min(480px,calc(100vw - 32px))', width:'100%',
              boxShadow:'0 32px 100px rgba(0,0,0,0.9)', overflow:'hidden',
              border:'1px solid rgba(245,158,11,0.35)', margin:'auto',
            }}>
              {/* Header */}
              <div style={{ background:'linear-gradient(135deg,rgba(245,158,11,0.2),rgba(249,115,22,0.12))', padding:'22px 24px 18px', textAlign:'center', borderBottom:'1px solid rgba(245,158,11,0.2)' }}>
                <div style={{ fontSize:40, marginBottom:8 }}>⚠️</div>
                <div style={{ color:'#fbbf24', fontWeight:900, fontSize:18, letterSpacing:'-0.3px' }}>Scheduling Conflict Detected</div>
                <p style={{ color:'rgba(255,255,255,0.6)', fontSize:13, marginTop:5, lineHeight:1.5 }}>
                  You are already registered for an event on the same dates.
                </p>
              </div>

              <div style={{ padding:'20px 24px', maxHeight:'65vh', overflowY:'auto' }}>
                {/* Conflicting Events List */}
                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:8 }}>
                    Already Registered ({conflictModal.conflictsWith.length})
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {conflictModal.conflictsWith.map(ev => (
                      <div key={ev.id} style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:12, padding:'12px 14px' }}>
                        <div style={{ color:'#fff', fontWeight:800, fontSize:13.5, marginBottom:2 }}>{ev.title}</div>
                        <div style={{ color:'rgba(255,255,255,0.6)', fontSize:12 }}>📅 {ev.date}</div>
                        {ev.start_time && <div style={{ color:'#f87171', fontSize:12, fontWeight:700, marginTop:2 }}>🕐 {ev.start_time}{ev.end_time ? ` – ${ev.end_time}` : ''}</div>}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ textAlign:'center', color:'rgba(245,158,11,0.7)', fontSize:18, margin:'8px 0' }}>⬇</div>

                {/* Target Event */}
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:8 }}>
                    You are trying to register for
                  </div>
                  <div style={{ background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:12, padding:'12px 14px' }}>
                    <div style={{ color:'#fff', fontWeight:800, fontSize:13.5, marginBottom:2 }}>{conflictModal.event.title}</div>
                    <div style={{ color:'rgba(255,255,255,0.6)', fontSize:12 }}>📅 {conflictModal.event.date}</div>
                    {conflictModal.event.start_time && <div style={{ color:'#fbbf24', fontSize:12, fontWeight:700, marginTop:2 }}>🕐 {conflictModal.event.start_time}{conflictModal.event.end_time ? ` – ${conflictModal.event.end_time}` : ''}</div>}
                  </div>
                </div>

                <div style={{ display:'flex', gap:10 }}>
                  <button onClick={() => setConflictModal(null)} style={{ flex:1, background:'rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.7)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:11, padding:'11px', fontSize:13.5, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                    Cancel
                  </button>
                  <button onClick={() => startForm(conflictModal.event)} style={{ flex:1.3, background:'linear-gradient(90deg,#f59e0b,#f97316)', color:'#fff', border:'none', borderRadius:11, padding:'11px', fontSize:13.5, fontWeight:800, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 14px rgba(249,115,22,0.35)' }}>
                    Register Anyway →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 1: Registration Form Modal ── */}
        {formModal && (
          <div onClick={() => !submitting && setFormModal(null)} style={{
            position:'fixed', inset:0, background:'rgba(0,0,0,0.8)',
            zIndex:9100, display:'flex', alignItems:'center', justifyContent:'center', padding:20,
            backdropFilter:'blur(8px)',
          }}>
            <div onClick={e => e.stopPropagation()} style={{
              background:'#070d1c', borderRadius:20, maxWidth:'min(480px,calc(100vw - 32px))', width:'100%',
              boxShadow:'0 32px 100px rgba(0,0,0,0.9)', position:'relative',
              border:'1px solid rgba(255,255,255,0.1)',
              margin:'auto', overflow:'hidden',
            }}>
              {/* Header */}
              <div style={{ background:'linear-gradient(135deg,#001233,#0f2d6b 60%,#1e40af)', padding:'22px 24px 18px', position:'relative' }}>
                <button onClick={() => setFormModal(null)} style={{
                  position:'absolute', top:14, right:14,
                  background:'rgba(0,0,0,0.6)', border:'1px solid rgba(255,255,255,0.3)', borderRadius:'50%',
                  width:30, height:30, color:'#fff', fontSize:14, cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>✕</button>
                <div style={{ color:'rgba(255,255,255,0.6)', fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'.5px', marginBottom:4 }}>
                  Registration Form
                </div>
                <div style={{ color:'#fff', fontSize:17, fontWeight:900, lineHeight:1.35 }}>{formModal.title}</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginTop:10, fontSize:12, color:'rgba(255,255,255,0.85)' }}>
                  <span>📅 {formModal.date}</span>
                  <span>📍 {formModal.venue}</span>
                  {formModal.start_time && <span>🕐 {formModal.start_time}{formModal.end_time ? `–${formModal.end_time}` : ''}</span>}
                </div>
              </div>

              {/* Form body */}
              <div style={{ padding:'20px 24px 24px' }}>
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  <div>
                    <label style={{ fontSize:11, fontWeight:800, color: fnameErr ? '#f87171' : 'rgba(255,255,255,0.5)', display:'block', marginBottom:4, textTransform:'uppercase' }}>
                      Full Name <span style={{ color:'#f43f5e' }}>*</span>
                    </label>
                    <input
                      className="reg-input"
                      value={fname}
                      onChange={e => { setFname(e.target.value); if (e.target.value.trim()) setFnameErr(false); }}
                      placeholder="Your full legal name"
                      style={{ borderColor: fnameErr ? '#e11d48' : undefined }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,0.5)', display:'block', marginBottom:4, textTransform:'uppercase' }}>
                      Account Email
                    </label>
                    <input className="reg-input" readOnly value={user?.email || ''} />
                  </div>

                  <div>
                    <label style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,0.5)', display:'block', marginBottom:4, textTransform:'uppercase' }}>
                      Contact Number (Optional)
                    </label>
                    <input
                      className="reg-input"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="e.g. 0917-123-4567"
                    />
                  </div>

                  <div>
                    <label style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,0.5)', display:'block', marginBottom:4, textTransform:'uppercase' }}>
                      Affiliation / Institution (Optional)
                    </label>
                    <input
                      className="reg-input"
                      value={institution}
                      onChange={e => setInstitution(e.target.value)}
                      placeholder="e.g. Cebu Institute of Technology - University"
                    />
                  </div>
                </div>

                <div style={{ height:1, background:'rgba(255,255,255,0.08)', margin:'18px 0' }} />

                <div style={{ display:'flex', gap:10 }}>
                  <button onClick={() => setFormModal(null)} disabled={submitting} style={{
                    flex:1, background:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.7)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:11,
                    padding:'11px', fontSize:13.5, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
                  }}>Cancel</button>
                  <button onClick={submitRegistration} disabled={submitting} style={{
                    flex:2, background: submitting ? '#475569' : 'linear-gradient(90deg,#f97316,#e11d48)',
                    color:'#fff', border:'none', borderRadius:11,
                    padding:'11px', fontSize:13.5, fontWeight:800, cursor: submitting ? 'not-allowed' : 'pointer',
                    fontFamily:'inherit', boxShadow: '0 4px 14px rgba(249,115,22,0.35)',
                  }}>
                    {submitting ? '⏳ Submitting…' : 'Confirm Registration →'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Registration Success Modal ── */}
        {okModal && (
          <div onClick={() => setOkModal(null)} style={{
            position:'fixed', inset:0, background:'rgba(0,0,0,0.8)',
            zIndex:9100, display:'flex', alignItems:'center', justifyContent:'center', padding:20,
            backdropFilter:'blur(8px)',
          }}>
            <div onClick={e => e.stopPropagation()} style={{
              background:'#070d1c', borderRadius:20, maxWidth:'min(440px,calc(100vw - 32px))', width:'100%',
              boxShadow:'0 32px 100px rgba(0,0,0,0.9)', textAlign:'center', padding:'28px 24px',
              border:'1px solid rgba(16,185,129,0.3)',
            }}>
              <div style={{ fontSize:44, marginBottom:10 }}>🎉</div>
              <h3 style={{ color:'#fff', fontSize:18, fontWeight:900, margin:'0 0 6px' }}>Registration Confirmed!</h3>
              <p style={{ color:'rgba(255,255,255,0.6)', fontSize:13, lineHeight:1.5, margin:'0 0 18px' }}>
                You have successfully reserved a seat for <strong style={{ color:'#fff' }}>{okModal.event.title}</strong>.
              </p>

              <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:12, padding:'14px', border:'1px solid rgba(255,255,255,0.08)', textAlign:'left', marginBottom:18, display:'flex', flexDirection:'column', gap:6, fontSize:12.5 }}>
                <div style={{ color:'rgba(255,255,255,0.5)' }}>Date: <strong style={{ color:'#fff' }}>{okModal.event.date}</strong></div>
                <div style={{ color:'rgba(255,255,255,0.5)' }}>Venue: <strong style={{ color:'#fff' }}>{okModal.event.venue}</strong></div>
                <div style={{ color:'rgba(255,255,255,0.5)' }}>Attendee: <strong style={{ color:'#fff' }}>{okModal.name}</strong> ({okModal.email})</div>
              </div>

              <div style={{ display:'flex', gap:8 }}>
                <a
                  href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(okModal.event.title)}&details=${encodeURIComponent(okModal.event.organizer || 'DASIG Event')}&location=${encodeURIComponent(okModal.event.venue || 'Region VII')}&dates=${(okModal.event.date || '2026-06-18').replace(/-/g, '')}T090000/${(okModal.event.date || '2026-06-18').replace(/-/g, '')}T170000`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ flex:1, background:'rgba(255,255,255,0.08)', color:'#60a5fa', border:'1px solid rgba(255,255,255,0.15)', borderRadius:11, padding:'11px', fontSize:13, fontWeight:700, textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}
                >
                  📅 Google Cal
                </a>
                <button onClick={() => setOkModal(null)} style={{ flex:1, background:'linear-gradient(90deg,#f97316,#e11d48)', color:'#fff', border:'none', borderRadius:11, padding:'11px', fontSize:13.5, fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}>
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Error / Login Alert Modal ── */}
        {errModal && (
          <div onClick={() => setErrModal('')} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:9200, display:'flex', alignItems:'center', justifyContent:'center', padding:20, backdropFilter:'blur(6px)' }}>
            <div onClick={e => e.stopPropagation()} style={{ background:'#070d1c', borderRadius:18, maxWidth:380, width:'100%', padding:'26px 24px', textAlign:'center', border:'1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize:38, marginBottom:10 }}>{errModal === 'login' ? '🔐' : '⚠️'}</div>
              <div style={{ color:'#fff', fontSize:17, fontWeight:900, marginBottom:6 }}>
                {errModal === 'login' ? 'Login Required' : errModal === 'already' ? 'Already Registered' : 'Registration Alert'}
              </div>
              <p style={{ color:'rgba(255,255,255,0.6)', fontSize:13, lineHeight:1.5, marginBottom:18 }}>
                {errModal === 'login' ? 'Please log in to your account to reserve your slot for this event.' : errModal === 'already' ? 'You have already signed up for this event.' : errModal}
              </p>
              <div style={{ display:'flex', gap:8 }}>
                {errModal === 'login' && (
                  <button onClick={() => { setErrModal(''); navigate('/login'); }} style={{ flex:1, background:'linear-gradient(90deg,#f97316,#e11d48)', color:'#fff', border:'none', borderRadius:10, padding:'10px', fontSize:13.5, fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}>Log in →</button>
                )}
                <button onClick={() => setErrModal('')} style={{ flex:1, background:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.7)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:10, padding:'10px', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Close</button>
              </div>
            </div>
          </div>
        )}

        <section style={{ padding:'28px 24px 80px' }}>
          <div style={{ maxWidth:1160, margin:'0 auto' }}>

            {/* ── Top Navigation Tabs (Events vs Training) ── */}
            <div style={{ display:'flex', gap:8, marginBottom:22 }}>
              <button
                onClick={() => setActiveTab('events')}
                style={{
                  background: activeTab === 'events' ? 'linear-gradient(90deg,#f97316,#e11d48)' : 'rgba(255,255,255,0.05)',
                  color: activeTab === 'events' ? '#fff' : 'rgba(255,255,255,0.6)',
                  border: `1px solid ${activeTab === 'events' ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius:12, padding:'10px 18px', fontSize:13.5, fontWeight:800,
                  cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:8,
                  boxShadow: activeTab === 'events' ? '0 4px 14px rgba(249,115,22,0.35)' : 'none',
                }}
              >
                <span>📅</span>
                <div>
                  <div>Events & Summits</div>
                </div>
              </button>
              <button
                onClick={() => navigate('/news')}
                style={{
                  background: 'rgba(255,255,255,0.05)', color:'rgba(255,255,255,0.6)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius:12, padding:'10px 18px', fontSize:13.5, fontWeight:700,
                  cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:8,
                }}
              >
                <span>📰</span>
                <div>Press & News</div>
              </button>
            </div>

            {/* ── Filter Bar & Search ── */}
            <div style={{
              background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)',
              borderRadius:16, padding:'12px 16px', marginBottom:24,
              display:'flex', alignItems:'center', gap:10, flexWrap:'wrap',
              backdropFilter:'blur(8px)',
            }}>
              {/* Category pills */}
              <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', flex:1 }}>
                {filters.map(f => (
                  <button key={f} className="ev-filter-pill" onClick={() => setActive(f)} style={{
                    background: active === f ? 'linear-gradient(90deg,#f97316,#e11d48)' : 'rgba(255,255,255,0.06)',
                    color: active === f ? '#fff' : 'rgba(255,255,255,0.65)',
                    border: `1px solid ${active === f ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
                    boxShadow: active === f ? '0 4px 12px rgba(249,115,22,0.35)' : 'none',
                  }}>
                    {f}
                    <span style={{ fontSize:10, background: active === f ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.1)', borderRadius:10, padding:'1px 6px', fontWeight:800 }}>
                      {counts[f] || 0}
                    </span>
                  </button>
                ))}

                {user && (
                  <button className="ev-filter-pill" onClick={() => setActive('Registered')} style={{
                    background: active === 'Registered' ? 'linear-gradient(90deg,#10b981,#059669)' : 'rgba(255,255,255,0.06)',
                    color: active === 'Registered' ? '#fff' : 'rgba(255,255,255,0.65)',
                    border: `1px solid ${active === 'Registered' ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
                  }}>
                    ✓ My Registered ({counts.Registered})
                  </button>
                )}
              </div>

              {/* Search */}
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search events by title, venue…"
                  style={{
                    background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.13)',
                    borderRadius:10, padding:'8px 14px', fontSize:13, color:'#fff',
                    fontFamily:'inherit', outline:'none', minWidth:220,
                  }}
                />
                {search && (
                  <button onClick={() => setSearch('')} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontSize:13 }}>✕</button>
                )}
                <button onClick={loadEvents} style={{
                  background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.14)',
                  borderRadius:10, padding:'8px 13px', color:'rgba(255,255,255,0.7)',
                  fontSize:13, cursor:'pointer', fontFamily:'inherit',
                }}>↻</button>
              </div>
            </div>

            {/* ── Event Grid ── */}
            {loading ? (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:18 }}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} style={{ background:'rgba(255,255,255,0.03)', borderRadius:16, height:240, border:'1px solid rgba(255,255,255,0.06)' }} />
                ))}
              </div>
            ) : displayedEvents.length === 0 ? (
              <div style={{ textAlign:'center', padding:'80px 0' }}>
                <div style={{ fontSize:44, marginBottom:12 }}>📅</div>
                <div style={{ color:'rgba(255,255,255,0.65)', fontSize:16, fontWeight:700 }}>No events found</div>
                <div style={{ color:'rgba(255,255,255,0.35)', fontSize:13, marginTop:5 }}>
                  {active === 'Registered' ? "You haven't registered for any events yet." : 'Try adjusting your search keywords or category filter.'}
                </div>
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(350px,1fr))', gap:18 }}>
                {displayedEvents.map(ev => (
                  <EventCard
                    key={ev.id}
                    ev={ev}
                    myReg={myRegs[ev.id]}
                    conflicts={eventConflictsMap[ev.id]}
                    isCancelling={cancelling === ev.id}
                    onRegister={() => handleRegisterClick(ev)}
                    onAttend={() => markAttended(ev)}
                    onCancel={() => cancelRegistration(ev)}
                  />
                ))}
              </div>
            )}

          </div>
        </section>
      </div>
    </div>
  );
}

/* ── Clean Enterprise Event Card with Conflict Badging ── */
function EventCard({ ev, myReg, conflicts, isCancelling, onRegister, onAttend, onCancel }) {
  const catStyle = CATEGORY_STYLES[ev.category] || CATEGORY_STYLES.Summit;
  const pct = ev.total > 0 ? Math.min(100, Math.round((ev.enrolled / ev.total) * 100)) : 0;
  const full = ev.total > 0 && ev.enrolled >= ev.total;
  const registered = !!myReg;
  const attended = myReg?.attended === true;
  const hasConflict = conflicts && conflicts.length > 0;

  return (
    <div className="event-card">
      {/* Top Header Row */}
      <div style={{ padding:'16px 18px 12px', display:'flex', justifyContent:'space-between', alignItems:'flex-start', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          <span style={{
            background: catStyle.bg, color: catStyle.color, border: `1px solid ${catStyle.border}`,
            borderRadius: 7, padding: '3px 10px', fontSize: 11.5, fontWeight: 800, display:'flex', alignItems:'center', gap:5,
          }}>
            <span>{catStyle.icon}</span> {ev.category}
          </span>
          {hasConflict && (
            <span style={{
              background:'rgba(245,158,11,0.18)', color:'#fbbf24',
              border:'1px solid rgba(245,158,11,0.4)',
              borderRadius:6, padding:'3px 8px', fontSize:11, fontWeight:800,
              display:'flex', alignItems:'center', gap:4,
            }}>
              ⚠️ Schedule Conflict
            </span>
          )}
        </div>

        {/* Available slots badge */}
        <div style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:7, padding:'3px 9px', fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.6)' }}>
          <strong style={{ color: full ? '#f87171' : '#fff' }}>{ev.total - ev.enrolled}</strong> slots left
        </div>
      </div>

      {/* Main Body */}
      <div style={{ padding:'14px 18px 16px', display:'flex', flexDirection:'column', flex:1 }}>
        <h3 style={{ color:'#fff', fontSize:16, fontWeight:900, lineHeight:1.35, margin:'0 0 10px' }}>
          {ev.title}
        </h3>

        <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:14, fontSize:12.5, color:'rgba(255,255,255,0.6)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:7 }}>
            <span style={{ color:'#f97316' }}>📅</span>
            <span style={{ color:'#fff', fontWeight:600 }}>{ev.date}</span>
            {ev.start_time && (
              <span style={{ color:'rgba(255,255,255,0.45)' }}>· 🕐 {ev.start_time}{ev.end_time ? `–${ev.end_time}` : ''}</span>
            )}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:7 }}>
            <span style={{ color:'#60a5fa' }}>📍</span>
            <span>{ev.venue}</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:7 }}>
            <span style={{ color:'#a78bfa' }}>🏛️</span>
            <span>{ev.organizer}</span>
          </div>
        </div>

        {/* Inline conflict notice */}
        {hasConflict && (
          <div style={{
            background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.25)',
            borderRadius:8, padding:'8px 10px', fontSize:11.5, color:'#fcd34d',
            marginBottom:12, lineHeight:1.4,
          }}>
            ⚠️ <strong>Overlaps with:</strong> {conflicts.map(c => c.title).join(', ')}
          </div>
        )}

        {/* Seat Enrollment Progress Bar */}
        <div style={{ marginTop:'auto', marginBottom:14 }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:11.5, color:'rgba(255,255,255,0.45)', marginBottom:5 }}>
            <span>Seat Capacity</span>
            <span style={{ fontWeight:700, color:'rgba(255,255,255,0.7)' }}>{ev.enrolled} / {ev.total} ({pct}%)</span>
          </div>
          <div style={{ height:6, background:'rgba(255,255,255,0.08)', borderRadius:3, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${pct}%`, background: full ? '#ef4444' : 'linear-gradient(90deg,#f97316,#e11d48)', borderRadius:3 }} />
          </div>
        </div>

        {/* Action Button Bar */}
        {attended ? (
          <div style={{
            background:'rgba(16,185,129,0.12)', border:'1px solid rgba(16,185,129,0.3)',
            borderRadius:10, padding:'9px', fontSize:13, fontWeight:800,
            color:'#34d399', textAlign:'center',
          }}>
            ✅ Attended
          </div>
        ) : registered ? (
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            <div style={{ display:'flex', gap:6 }}>
              <div style={{
                flex:1, background:'rgba(16,185,129,0.12)', border:'1px solid rgba(16,185,129,0.3)',
                borderRadius:9, padding:'8px 10px', fontSize:12, fontWeight:800,
                color:'#34d399', textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                ✓ Registered
              </div>
              <button
                onClick={onAttend}
                style={{
                  flex:1, background:'linear-gradient(90deg,#059669,#0891b2)',
                  color:'#fff', border:'none', borderRadius:9,
                  padding:'8px 10px', fontSize:12, fontWeight:800,
                  cursor:'pointer', fontFamily:'inherit',
                }}
              >
                Mark Attended
              </button>
            </div>
            <div style={{ display:'flex', gap:6 }}>
              <a
                href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(ev.title)}&details=${encodeURIComponent(ev.organizer || 'DASIG Event')}&location=${encodeURIComponent(ev.venue || 'Region VII')}&dates=${(ev.date || '2026-06-18').replace(/-/g, '')}T090000/${(ev.date || '2026-06-18').replace(/-/g, '')}T170000`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex:1, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)',
                  borderRadius:8, padding:'6px 10px', fontSize:11.5, fontWeight:700, color:'#60a5fa',
                  textDecoration:'none', textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center', gap:4,
                }}
              >
                📅 Google Cal
              </a>
              <button
                onClick={onCancel}
                disabled={isCancelling}
                style={{
                  flex:1, background:'transparent', border:'1px solid rgba(225,29,72,0.3)',
                  borderRadius:8, padding:'6px 10px', fontSize:11.5, fontWeight:700, color:'rgba(244,63,94,0.85)',
                  cursor: isCancelling ? 'not-allowed' : 'pointer', fontFamily:'inherit',
                }}
              >
                {isCancelling ? '⏳ Cancelling…' : '✕ Cancel Slot'}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={onRegister}
            disabled={full}
            style={{
              width:'100%',
              background: full ? 'rgba(255,255,255,0.08)' : hasConflict ? 'linear-gradient(90deg,#f59e0b,#f97316)' : 'linear-gradient(90deg,#f97316,#e11d48)',
              color: full ? 'rgba(255,255,255,0.35)' : '#fff',
              border:'none', borderRadius:10, padding:'10px', fontSize:13.5, fontWeight:800,
              cursor: full ? 'not-allowed' : 'pointer', fontFamily:'inherit',
              boxShadow: full ? 'none' : hasConflict ? '0 3px 12px rgba(245,158,11,0.35)' : '0 3px 12px rgba(249,115,22,0.35)',
              transition:'opacity 0.15s ease',
            }}
          >
            {full ? 'Fully Booked' : hasConflict ? '⚠️ Check Conflict & Register →' : 'Register Slot →'}
          </button>
        )}
      </div>
    </div>
  );
}
