import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import ParticleBackground from '../components/ParticleBackground';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const STYLES = {
  Technology: { iconBg: '#eff6ff', catBg: '#eff6ff', catColor: '#1e40af', accent: 'linear-gradient(135deg,#1a56db,#4f46e5)' },
  Research:   { iconBg: '#ecfdf5', catBg: '#ecfdf5', catColor: '#065f46', accent: 'linear-gradient(135deg,#059669,#0891b2)' },
  Leadership: { iconBg: '#fef9c3', catBg: '#fef9c3', catColor: '#713f12', accent: 'linear-gradient(135deg,#f59e0b,#f97316)' },
  Governance: { iconBg: '#f5f3ff', catBg: '#f5f3ff', catColor: '#4c1d95', accent: 'linear-gradient(135deg,#7c3aed,#1a56db)' },
};

const MODAL_CSS = `
  @keyframes modalIn  { from{transform:scale(0.84) translateY(20px);opacity:0} to{transform:scale(1) translateY(0);opacity:1} }
  @keyframes checkPop { 0%{transform:scale(0)}60%{transform:scale(1.3)}100%{transform:scale(1)} }
  .tr-input {
    width:100%; box-sizing:border-box;
    border:1.5px solid rgba(255,255,255,0.15); border-radius:10px;
    padding:10px 14px; font-size:13.5px; font-family:inherit;
    color:#fff; outline:none; transition:border-color 0.15s;
    background:rgba(255,255,255,0.07);
  }
  .tr-input::placeholder { color:rgba(255,255,255,0.35); }
  .tr-input:focus { border-color:#f97316; background:rgba(255,255,255,0.12); }
  .tr-input:read-only { background:rgba(255,255,255,0.04); color:rgba(255,255,255,0.45); cursor:default; }
`;

export default function TrainingPage() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [formModal, setFormModal] = useState(null);
  const [okModal, setOkModal]     = useState(null);
  const [errModal, setErrModal]   = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [fname, setFname]             = useState('');
  const [email, setEmail]             = useState('');
  const [phone, setPhone]             = useState('');
  const [institution, setInstitution] = useState('');
  const [fnameErr, setFnameErr]       = useState(false);

  useEffect(() => {
    api.training.list()
      .then(r => setTrainings(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function openForm(t) {
    if (!user) { setErrModal('login'); return; }
    setFname(user.name || '');
    setEmail(user.email || '');
    setPhone(user.phone || '');
    setInstitution(user.institution || '');
    setFnameErr(false);
    setFormModal(t);
  }

  async function submitEnrollment() {
    if (!fname.trim()) { setFnameErr(true); return; }
    setSubmitting(true);
    try {
      const res = await api.training.enroll(formModal.id);
      const newEnrolled = res.enrolled ?? formModal.enrolled + 1;
      const updated = { ...formModal, enrolled: newEnrolled };
      setTrainings(prev => prev.map(t => t.id === formModal.id ? updated : t));
      setFormModal(null);
      setOkModal({ training: updated, name: fname, phone, institution, email, role: user.role });
    } catch (err) {
      const msg = err.message || '';
      setFormModal(null);
      if (msg.toLowerCase().includes('already')) setErrModal('already');
      else setErrModal(msg || 'Enrollment failed');
    } finally {
      setSubmitting(false);
    }
  }

  const s = t => STYLES[t?.category] || STYLES.Technology;

  return (
    <div style={{ background:'linear-gradient(180deg,#000d30 0%,#020817 300px,#0f172a 100%)', minHeight:'100vh', position:'relative' }}>
      <ParticleBackground density={45} />
      <div style={{ position:'relative', zIndex:1 }}>
      <style>{MODAL_CSS}</style>
      <PageHeader eyebrow="Training Programs" title="Training & Development" />

      {/* ── STEP 1: Enrollment Form Modal ── */}
      {formModal && (
        <div onClick={() => !submitting && setFormModal(null)} style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.6)',
          zIndex:9100, display:'flex', alignItems:'center', justifyContent:'center',
          padding:20, overflowY:'auto',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background:'linear-gradient(180deg,#0f172a,#020817)', borderRadius:22, maxWidth:480, width:'100%',
            boxShadow:'0 32px 100px rgba(0,0,0,0.7)', overflow:'hidden',
            border:'1px solid rgba(255,255,255,0.1)',
            animation:'modalIn 0.24s cubic-bezier(.34,1.56,.64,1)', margin:'auto',
          }}>
            {/* banner */}
            <div style={{ background: s(formModal).accent, padding:'22px 24px 18px', position:'relative' }}>
              <button onClick={() => setFormModal(null)} style={{
                position:'absolute', top:14, right:14,
                background:'rgba(255,255,255,0.2)', border:'none', borderRadius:'50%',
                width:30, height:30, color:'#fff', fontSize:16, cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>✕</button>
              <div style={{ color:'rgba(255,255,255,0.7)', fontSize:11.5, fontWeight:700, marginBottom:4 }}>PROGRAM ENROLLMENT</div>
              <div style={{ color:'#fff', fontSize:18, fontWeight:900, lineHeight:1.3 }}>{formModal.title}</div>
              <div style={{ display:'flex', gap:16, marginTop:10, flexWrap:'wrap' }}>
                {[
                  { icon:'🏛', val: formModal.org },
                  { icon:'⏱', val: formModal.duration },
                  { icon:'📊', val: formModal.level },
                  ...(formModal.schedule ? [{ icon:'📅', val: formModal.schedule }] : []),
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
              <div style={{ fontSize:13.5, fontWeight:700, color:'#fff', marginBottom:16 }}>📋 Your Enrollment Details</div>

              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {/* Full Name */}
                <div>
                  <label style={{ fontSize:11.5, fontWeight:700, color: fnameErr ? '#f87171' : 'rgba(255,255,255,0.45)', display:'block', marginBottom:5, letterSpacing:'.4px' }}>
                    FULL NAME <span style={{ color:'#f87171' }}>*</span>
                  </label>
                  <input
                    className="tr-input"
                    value={fname}
                    onChange={e => { setFname(e.target.value); if (e.target.value.trim()) setFnameErr(false); }}
                    placeholder="Enter your full name"
                    style={fnameErr ? { borderColor:'#e11d48' } : {}}
                  />
                  {fnameErr && (
                    <div style={{ marginTop:5, fontSize:12, color:'#f87171', fontWeight:600, display:'flex', alignItems:'center', gap:5 }}>
                      ⚠ Full name is required.
                    </div>
                  )}
                </div>

                {/* Email — fully editable */}
                <div>
                  <label style={{ fontSize:11.5, fontWeight:700, color:'rgba(255,255,255,0.45)', display:'block', marginBottom:5, letterSpacing:'.4px' }}>
                    EMAIL ADDRESS
                  </label>
                  <input
                    className="tr-input"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label style={{ fontSize:11.5, fontWeight:700, color:'rgba(255,255,255,0.45)', display:'block', marginBottom:5, letterSpacing:'.4px' }}>PHONE NUMBER</label>
                  <input className="tr-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. 09XX-XXX-XXXX" />
                </div>

                {/* Institution */}
                <div>
                  <label style={{ fontSize:11.5, fontWeight:700, color:'rgba(255,255,255,0.45)', display:'block', marginBottom:5, letterSpacing:'.4px' }}>INSTITUTION / ORGANIZATION</label>
                  <input className="tr-input" value={institution} onChange={e => setInstitution(e.target.value)} placeholder="e.g. University of the Philippines" />
                </div>

                {/* Account type — display only, fixed colors for dark bg */}
                <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'rgba(255,255,255,0.04)', borderRadius:10, border:'1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ fontSize:16 }}>🪪</span>
                  <div>
                    <div style={{ fontSize:10.5, color:'rgba(255,255,255,0.35)', fontWeight:700, letterSpacing:'.4px', marginBottom:2 }}>ACCOUNT TYPE</div>
                    <div style={{
                      fontSize:12.5, fontWeight:800,
                      color: user?.role === 'ADMIN' ? '#fca5a5' : user?.role === 'MEMBER' ? '#6ee7b7' : '#93c5fd',
                    }}>
                      {user?.role === 'ADMIN' ? '🛡 Administrator' : user?.role === 'MEMBER' ? '✓ Member' : '○ Guest'}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ height:1, background:'rgba(255,255,255,0.08)', margin:'18px 0' }} />
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setFormModal(null)} disabled={submitting} style={{
                  flex:1, background:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.6)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:12,
                  padding:'12px', fontSize:13.5, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
                }}>Cancel</button>
                <button onClick={submitEnrollment} disabled={submitting} style={{
                  flex:2, background: submitting ? '#94a3b8' : 'linear-gradient(90deg,#f97316,#e11d48)',
                  color:'#fff', border:'none', borderRadius:12,
                  padding:'12px', fontSize:14, fontWeight:800,
                  cursor: submitting ? 'not-allowed' : 'pointer', fontFamily:'inherit',
                }}>
                  {submitting ? '⏳ Submitting…' : '✅ Confirm Enrollment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 2: Success Modal ── */}
      {okModal && (
        <div onClick={() => setOkModal(null)} style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.6)',
          zIndex:9100, display:'flex', alignItems:'center', justifyContent:'center', padding:20,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background:'linear-gradient(180deg,#0f172a,#020817)', borderRadius:22, maxWidth:440, width:'100%',
            boxShadow:'0 32px 100px rgba(0,0,0,0.7)', overflow:'hidden',
            border:'1px solid rgba(255,255,255,0.1)',
            animation:'modalIn 0.24s cubic-bezier(.34,1.56,.64,1)',
          }}>
            <div style={{ background: s(okModal.training).accent, padding:'28px 24px 50px', textAlign:'center', position:'relative' }}>
              <div style={{ color:'#fff', fontSize:20, fontWeight:900 }}>Enrollment Confirmed! 🎉</div>
              <div style={{ color:'rgba(255,255,255,0.75)', fontSize:12.5, marginTop:4 }}>{okModal.training.title}</div>
              <div style={{
                position:'absolute', bottom:-34, left:'50%', transform:'translateX(-50%)',
                width:68, height:68, borderRadius:'50%',
                background:'linear-gradient(135deg,#f97316,#e11d48)',
                border:'4px solid #fff',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:28, fontWeight:900, color:'#fff',
                boxShadow:'0 4px 18px rgba(0,0,0,0.25)',
              }}>
                {(okModal.name || 'U')[0].toUpperCase()}
              </div>
            </div>

            <div style={{ paddingTop:46, paddingLeft:24, paddingRight:24, textAlign:'center' }}>
              <div style={{ fontWeight:900, fontSize:17, color:'#fff' }}>{okModal.name}</div>
              <div style={{ fontSize:12.5, color:'rgba(255,255,255,0.55)', marginTop:2 }}>{okModal.email}</div>
              {okModal.institution && <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginTop:2 }}>🏛 {okModal.institution}</div>}
              {okModal.phone && <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginTop:2 }}>📞 {okModal.phone}</div>}
              <span style={{
                display:'inline-block', marginTop:8,
                background: okModal.role==='ADMIN' ? 'rgba(225,29,72,0.18)' : okModal.role==='MEMBER' ? 'rgba(16,185,129,0.18)' : 'rgba(59,130,246,0.18)',
                color: okModal.role==='ADMIN' ? '#fca5a5' : okModal.role==='MEMBER' ? '#6ee7b7' : '#93c5fd',
                border: `1px solid ${okModal.role==='ADMIN' ? 'rgba(225,29,72,0.35)' : okModal.role==='MEMBER' ? 'rgba(16,185,129,0.35)' : 'rgba(59,130,246,0.35)'}`,
                borderRadius:20, padding:'3px 14px', fontSize:11.5, fontWeight:800,
              }}>
                {okModal.role === 'ADMIN' ? '🛡 Administrator' : okModal.role === 'MEMBER' ? '✓ Member' : '○ Guest'}
              </span>
            </div>

            <div style={{ height:1, background:'rgba(255,255,255,0.08)', margin:'16px 24px 0' }} />

            <div style={{ padding:'12px 24px 24px', display:'flex', flexDirection:'column', gap:8 }}>
              {[
                { icon:'🎓', label:'PROGRAM',    value: okModal.training.title },
                { icon:'🏛',  label:'ORG',        value: okModal.training.org },
                { icon:'⏱',  label:'DURATION',   value: okModal.training.duration },
                { icon:'📊', label:'LEVEL',       value: okModal.training.level },
                ...(okModal.training.schedule ? [{ icon:'📅', label:'SCHEDULE', value: okModal.training.schedule }] : []),
                { icon:'👥', label:'ENROLLMENT',  value: `${okModal.training.enrolled} / ${okModal.training.total} enrolled` },
              ].map(r => (
                <div key={r.label} style={{ display:'flex', alignItems:'center', gap:10, background:'rgba(255,255,255,0.06)', borderRadius:10, padding:'9px 14px', border:'1px solid rgba(255,255,255,0.07)' }}>
                  <span style={{ fontSize:16 }}>{r.icon}</span>
                  <div>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', fontWeight:700 }}>{r.label}</div>
                    <div style={{ fontSize:13, color:'#fff', fontWeight:700 }}>{r.value}</div>
                  </div>
                </div>
              ))}

              <div style={{
                background:'rgba(16,185,129,0.12)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:10,
                padding:'10px 14px', fontSize:12.5, color:'#34d399', fontWeight:600,
                display:'flex', alignItems:'center', gap:8, marginTop:4,
              }}>
                <span style={{ animation:'checkPop 0.4s 0.15s both', display:'inline-block' }}>✅</span>
                Your enrollment has been saved to the database.
              </div>

              <button onClick={() => setOkModal(null)} style={{
                width:'100%', background:'linear-gradient(90deg,#f97316,#e11d48)',
                color:'#fff', border:'none', borderRadius:12, padding:'13px',
                fontSize:14.5, fontWeight:800, cursor:'pointer', fontFamily:'inherit', marginTop:4,
              }}>Close</button>
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
            animation:'modalIn 0.22s cubic-bezier(.34,1.56,.64,1)',
          }}>
            {errModal === 'login' ? (
              <>
                <div style={{ background:'linear-gradient(135deg,#001d5c,#1a56db)', padding:'28px 24px 20px', textAlign:'center' }}>
                  <div style={{ fontSize:46 }}>🔐</div>
                  <div style={{ color:'#fff', fontSize:19, fontWeight:900, marginTop:8 }}>Login Required</div>
                  <div style={{ color:'rgba(255,255,255,0.75)', fontSize:12.5, marginTop:4 }}>Sign in to enroll in programs</div>
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
                  <div style={{ color:'#fff', fontSize:19, fontWeight:900, marginTop:8 }}>Already Enrolled!</div>
                  <div style={{ color:'rgba(255,255,255,0.8)', fontSize:12.5, marginTop:4 }}>You are already enrolled in this program</div>
                </div>
                <div style={{ padding:'20px 24px 24px' }}>
                  <p style={{ color:'rgba(255,255,255,0.65)', fontSize:13.5, textAlign:'center', marginBottom:16 }}>
                    Your enrollment is already confirmed for this program.
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
                  <div style={{ color:'#fff', fontSize:19, fontWeight:900, marginTop:8 }}>Enrollment Failed</div>
                </div>
                <div style={{ padding:'20px 24px 24px' }}>
                  <p style={{ color:'rgba(255,255,255,0.65)', fontSize:13.5, textAlign:'center', marginBottom:16 }}>{errModal}</p>
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

      <section style={{ padding:'40px 24px 80px' }}>
        <div style={{ maxWidth:1120, margin:'0 auto' }}>
          {loading ? (
            <div style={{ textAlign:'center', padding:'60px 0', color:'rgba(255,255,255,0.35)' }}>
              <div style={{ fontSize:36, marginBottom:12 }}>⏳</div>Loading programs…
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:18 }}>
              {trainings.map(t => (
                <TrainingCard key={t.id} t={{ ...t, ...STYLES[t.category] }} onEnroll={() => openForm(t)} />
              ))}
            </div>
          )}
        </div>
      </section>
      </div>
    </div>
  );
}

function TrainingCard({ t, onEnroll }) {
  const cardRef = useRef(null);
  const [tilt, setTilt]     = useState({ x:0, y:0 });
  const [shine, setShine]   = useState({ x:50, y:50 });
  const [hovered, setHov]   = useState(false);
  const pct  = Math.min(100, Math.round((t.enrolled / t.total) * 100));
  const full = t.enrolled >= t.total;

  function onMove(e) {
    const r  = cardRef.current.getBoundingClientRect();
    const cx = r.left + r.width  / 2;
    const cy = r.top  + r.height / 2;
    setTilt({ x: -((e.clientY - cy)/(r.height/2))*10, y: ((e.clientX - cx)/(r.width/2))*10 });
    setShine({ x:((e.clientX - r.left)/r.width)*100, y:((e.clientY - r.top)/r.height)*100 });
  }

  function onLeave() { setHov(false); setTilt({x:0,y:0}); setShine({x:50,y:50}); }

  return (
    <div style={{ perspective:'700px' }}>
      <div
        ref={cardRef}
        onMouseEnter={() => setHov(true)}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        style={{
          background:'rgba(15,23,42,0.88)', borderRadius:18, padding:24,
          border:'1px solid rgba(255,255,255,0.1)',
          transition: hovered ? 'box-shadow 0.1s' : 'transform 0.5s ease, box-shadow 0.5s ease',
          transform: hovered
            ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(8px) scale(1.02)`
            : 'rotateX(0deg) rotateY(0deg) translateZ(0px) scale(1)',
          boxShadow: hovered
            ? '0 28px 56px rgba(0,29,92,0.18), 0 8px 20px rgba(0,0,0,0.1)'
            : '0 2px 12px rgba(0,29,92,0.06)',
          position:'relative', overflow:'hidden', willChange:'transform',
          transformStyle:'preserve-3d',
        }}
      >
        {/* left accent bar */}
        <div style={{
          position:'absolute', left:0, top:0, bottom:0, width:4,
          background: t.accent, borderRadius:'2px 0 0 2px',
        }} />

        {/* shine overlay */}
        {hovered && (
          <div style={{
            position:'absolute', inset:0, pointerEvents:'none', zIndex:0, borderRadius:18,
            background:`radial-gradient(circle at ${shine.x}% ${shine.y}%, rgba(255,255,255,0.18) 0%, transparent 65%)`,
            transition:'background 0.05s',
          }} />
        )}

        {/* slots badge */}
        <div style={{
          position:'absolute', top:16, right:16, zIndex:2,
          background: t.catBg, borderRadius:8, padding:'5px 10px',
          transform: hovered ? 'translateZ(16px)' : 'translateZ(0)',
          transition:'transform 0.3s',
        }}>
          <div style={{ fontSize:10, color:t.catColor, fontWeight:700 }}>SLOTS LEFT</div>
          <div style={{ fontSize:14, color:t.catColor, fontWeight:900, textAlign:'center' }}>{t.total - t.enrolled}</div>
        </div>

        {/* header row */}
        <div style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom:16, position:'relative', zIndex:1 }}>
          <div style={{
            width:52, height:52, borderRadius:14, background: t.accent,
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0,
            boxShadow:'0 4px 14px rgba(0,0,0,0.15)',
            transform: hovered ? 'translateZ(18px) scale(1.08) rotate(-4deg)' : 'translateZ(0) scale(1) rotate(0deg)',
            transition:'transform 0.3s ease',
          }}>{t.icon}</div>
          <div style={{ flex:1, paddingRight:70 }}>
            <span style={{ background:t.catBg, color:t.catColor, borderRadius:5, padding:'3px 10px', fontSize:11, fontWeight:700 }}>{t.category}</span>
            <h3 style={{
              fontWeight:900, fontSize:15.5, lineHeight:1.3, marginTop:6, marginBottom:3,
              color: hovered ? '#f97316' : '#fff', transition:'color 0.2s',
              transform: hovered ? 'translateZ(10px)' : 'translateZ(0)',
            }}>{t.title}</h3>
            <div style={{ color:'rgba(255,255,255,0.55)', fontSize:12.5 }}>{t.org}</div>
          </div>
        </div>

        {/* meta row */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:12, marginBottom: t.schedule ? 10 : 16, position:'relative', zIndex:1 }}>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.55)', display:'flex', alignItems:'center', gap:4 }}>⏱ {t.duration}</div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.55)', display:'flex', alignItems:'center', gap:4 }}>📊 {t.level}</div>
        </div>
        {t.schedule && (
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.55)', display:'flex', alignItems:'center', gap:4, marginBottom:16, position:'relative', zIndex:1 }}>
            📅 {t.schedule}
          </div>
        )}

        {/* enrollment bar */}
        <div style={{ marginBottom:16, position:'relative', zIndex:1 }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:11.5, color:'rgba(255,255,255,0.5)', marginBottom:6 }}>
            <span>Enrollment</span>
            <span style={{ fontWeight:700 }}>{t.enrolled}/{t.total}</span>
          </div>
          <div style={{ height:7, background:'rgba(255,255,255,0.12)', borderRadius:4, overflow:'hidden' }}>
            <div style={{
              height:'100%', width:`${pct}%`,
              background:'linear-gradient(90deg,#f97316,#e11d48)',
              borderRadius:4, boxShadow:'0 1px 4px rgba(249,115,22,0.5)',
            }} />
          </div>
        </div>

        {/* button */}
        <button onClick={onEnroll} disabled={full}
          style={{
            width:'100%', position:'relative', zIndex:1,
            background: full ? 'rgba(255,255,255,0.1)' : 'linear-gradient(90deg,#f97316,#e11d48)',
            color: full ? 'rgba(255,255,255,0.35)' : '#fff',
            border:'none', borderRadius:12, padding:'11px', fontSize:13.5, fontWeight:800,
            cursor: full ? 'not-allowed' : 'pointer', fontFamily:'inherit',
            boxShadow: full ? 'none' : '0 4px 14px rgba(249,115,22,0.4)',
            transform: hovered && !full ? 'translateZ(16px)' : 'translateZ(0)',
            transition:'transform 0.2s, box-shadow 0.2s',
          }}
        >{full ? 'Fully Booked' : '✦ Enroll Now'}</button>
      </div>
    </div>
  );
}
