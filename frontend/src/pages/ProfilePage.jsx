import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import ParticleBackground from '../components/ParticleBackground';

// Compress & crop image to 240×240 JPEG, returns base64 data URI
function compressAvatar(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = e => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const SIZE = 240;
        const canvas = document.createElement('canvas');
        canvas.width = SIZE; canvas.height = SIZE;
        const ctx = canvas.getContext('2d');
        // Center-crop the image
        const scale = Math.max(SIZE / img.width, SIZE / img.height);
        const w = img.width * scale, h = img.height * scale;
        ctx.drawImage(img, (SIZE - w) / 2, (SIZE - h) / 2, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

const CSS = `
  @keyframes fadeIn  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes toastIn { from{transform:translateX(70px);opacity:0} to{transform:translateX(0);opacity:1} }
  @keyframes toastOut{ from{opacity:1} to{opacity:0} }

  .pf-input {
    width: 100%; box-sizing: border-box;
    background: rgba(255,255,255,0.06);
    border: 1.5px solid rgba(255,255,255,0.12);
    border-radius: 12px; padding: 12px 16px;
    font-size: 14px; font-family: inherit; color: #fff;
    outline: none; transition: border-color .15s, background .15s;
  }
  .pf-input:focus  { border-color:#f97316; background:rgba(255,255,255,0.1); }
  .pf-input:disabled { opacity:.45; cursor:default; }
  .pf-input::placeholder { color:rgba(255,255,255,0.3); }

  .pf-tab {
    flex:1; padding:12px 8px; border:none; border-radius:12px;
    background:transparent; color:rgba(255,255,255,0.48);
    font-family:inherit; font-size:13px; font-weight:700;
    cursor:pointer; transition:all .16s; border-bottom:2px solid transparent;
  }
  .pf-tab.active {
    color:#f97316;
    border-bottom-color:#f97316;
    background:rgba(249,115,22,0.07);
  }
  .pf-tab:hover:not(.active) {
    color:rgba(255,255,255,0.75);
    background:rgba(255,255,255,0.05);
  }

  .pf-label {
    display:block; font-size:12px; font-weight:700;
    color:rgba(255,255,255,0.55); letter-spacing:.4px;
    text-transform:uppercase; margin-bottom:8px;
  }
  .pf-save {
    background:linear-gradient(90deg,#f97316,#e11d48);
    color:#fff; border:none; border-radius:12px;
    padding:12px 28px; font-size:14px; font-weight:800;
    cursor:pointer; font-family:inherit;
    transition:opacity .15s, transform .15s;
    box-shadow:0 4px 16px rgba(249,115,22,0.35);
  }
  .pf-save:hover   { opacity:.88; transform:translateY(-1px); }
  .pf-save:disabled{ opacity:.45; cursor:not-allowed; transform:none; }
`;

const ROLE_COLORS = {
  ADMIN:  { bg:'rgba(225,29,72,0.18)',   color:'#f43f5e', label:'Administrator', icon:'🛡' },
  MEMBER: { bg:'rgba(16,185,129,0.15)',  color:'#34d399', label:'Member',        icon:'✓' },
  GUEST:  { bg:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.5)', label:'Guest', icon:'○' },
};

const STATUS_COLORS = {
  ACTIVE:   { bg:'rgba(16,185,129,0.15)',  color:'#34d399' },
  INACTIVE: { bg:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.4)' },
  GUEST:    { bg:'rgba(59,130,246,0.15)',  color:'#60a5fa' },
};

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('profile');
  const [toast, setToast] = useState(null); // { msg, ok }

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user]);

  function showToast(msg, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  if (!user) return null;

  const rc = ROLE_COLORS[user.role] || ROLE_COLORS.GUEST;
  const sc = STATUS_COLORS[user.status] || STATUS_COLORS.GUEST;
  const initials = (user.name || 'U').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast('Image must be under 5 MB', false); return; }
    if (!file.type.startsWith('image/')) { showToast('Please select an image file', false); return; }
    try {
      showToast('Uploading photo…', true);
      const dataUri = await compressAvatar(file);
      await api.auth.updateProfile({ avatar_url: dataUri });
      await refreshUser();
      showToast('Profile photo updated!');
    } catch (err) {
      showToast(err.message || 'Upload failed', false);
    }
  }

  async function removeAvatar() {
    try {
      await api.auth.updateProfile({ avatar_url: null });
      await refreshUser();
      showToast('Profile photo removed');
    } catch (err) {
      showToast(err.message || 'Failed to remove photo', false);
    }
  }

  return (
    <div style={{ background:'linear-gradient(180deg,#000d30 0%,#020817 280px,#0f172a 100%)', minHeight:'100vh', position:'relative' }}>
      <ParticleBackground density={35} />
      <style>{CSS}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position:'fixed', bottom:28, right:28, zIndex:9999,
          background: toast.ok ? 'linear-gradient(135deg,#065f46,#059669)' : 'linear-gradient(135deg,#9f1239,#e11d48)',
          color:'#fff', borderRadius:14, padding:'14px 20px',
          display:'flex', alignItems:'center', gap:10,
          animation:'toastIn .3s cubic-bezier(.34,1.56,.64,1)',
          boxShadow:'0 12px 40px rgba(0,0,0,0.55)',
          border: toast.ok ? '1px solid rgba(52,211,153,0.35)' : '1px solid rgba(252,165,165,0.3)',
          minWidth:240, maxWidth:340,
        }}>
          <div style={{ width:30, height:30, borderRadius:8, background:'rgba(255,255,255,0.18)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:900, flexShrink:0 }}>
            {toast.ok ? '✓' : '✕'}
          </div>
          <span style={{ fontWeight:700, fontSize:13.5 }}>{toast.msg}</span>
        </div>
      )}

      <div style={{ maxWidth:760, margin:'0 auto', padding:'48px 24px 80px', position:'relative', zIndex:1, animation:'fadeIn .3s ease' }}>

        {/* ── Page header ── */}
        <div style={{ marginBottom:32, display:'flex', alignItems:'center', gap:18 }}>
          <button onClick={() => navigate('/')} style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, padding:'7px 14px', color:'rgba(255,255,255,0.6)', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all .14s' }}
            onMouseEnter={e => { e.currentTarget.style.color='#fff'; e.currentTarget.style.background='rgba(255,255,255,0.12)'; }}
            onMouseLeave={e => { e.currentTarget.style.color='rgba(255,255,255,0.6)'; e.currentTarget.style.background='rgba(255,255,255,0.07)'; }}
          >← Back</button>
          <div>
            <div style={{ color:'rgba(255,255,255,0.55)', fontSize:12, fontWeight:700, letterSpacing:'.8px', textTransform:'uppercase', marginBottom:4 }}>Account Management</div>
            <h1 style={{ color:'#fff', fontSize:24, fontWeight:900, margin:0, letterSpacing:'-0.4px' }}>My Profile</h1>
          </div>
        </div>

        {/* ── Profile card ── */}
        <div style={{ background:'rgba(15,23,42,0.85)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:22, overflow:'hidden', marginBottom:24, boxShadow:'0 8px 32px rgba(0,0,0,0.4)' }}>
          <div style={{ background:'linear-gradient(135deg,#001d5c,#1a3a8a 60%,#1e40af)', padding:'28px 28px 22px', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', right:-12, bottom:-16, fontSize:110, opacity:0.07, lineHeight:1 }}>👤</div>
            <div style={{ display:'flex', alignItems:'center', gap:18 }}>
              {/* Avatar — click to upload */}
              <div style={{ position:'relative', flexShrink:0 }}>
                <label htmlFor="avatar-upload" style={{ cursor:'pointer', display:'block' }} title="Click to change photo">
                  <div style={{ width:72, height:72, borderRadius:20, overflow:'hidden', border:'3px solid rgba(255,255,255,0.25)', boxShadow:'0 6px 20px rgba(0,0,0,0.4)', position:'relative' }}>
                    {user.avatar_url
                      ? <img src={user.avatar_url} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                      : <div style={{ width:'100%', height:'100%', background:'linear-gradient(135deg,#f97316,#e11d48)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:900, color:'#fff' }}>{initials}</div>
                    }
                    {/* Hover overlay */}
                    <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.55)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:3, opacity:0, transition:'opacity .18s' }}
                      onMouseEnter={e => e.currentTarget.style.opacity=1}
                      onMouseLeave={e => e.currentTarget.style.opacity=0}
                    >
                      <span style={{ fontSize:18 }}>📷</span>
                      <span style={{ fontSize:11, color:'#fff', fontWeight:800 }}>CHANGE</span>
                    </div>
                  </div>
                </label>
                <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display:'none' }} />
                {/* Remove button */}
                {user.avatar_url && (
                  <button onClick={removeAvatar} title="Remove photo" style={{ position:'absolute', top:-6, right:-6, width:20, height:20, borderRadius:'50%', background:'#e11d48', border:'2px solid #0f172a', color:'#fff', fontSize:10, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, lineHeight:1 }}>✕</button>
                )}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ color:'#fff', fontSize:20, fontWeight:900, marginBottom:4, letterSpacing:'-0.3px' }}>{user.name}</div>
                <div style={{ color:'rgba(255,255,255,0.6)', fontSize:13.5, marginBottom:10 }}>{user.email}</div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  <span style={{ background: rc.bg, color: rc.color, border:`1px solid ${rc.color}40`, borderRadius:20, padding:'3px 12px', fontSize:11.5, fontWeight:800 }}>
                    {rc.icon} {rc.label}
                  </span>
                  <span style={{ background: sc.bg, color: sc.color, border:`1px solid ${sc.color}40`, borderRadius:20, padding:'3px 12px', fontSize:11.5, fontWeight:800 }}>
                    ● {user.status}
                  </span>
                  {user.institution && (
                    <span style={{ background:'rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.75)', borderRadius:20, padding:'3px 12px', fontSize:11.5, fontWeight:700 }}>
                      🏛 {user.institution}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Tab switcher ── */}
          <div style={{ display:'flex', padding:'4px 8px 0', borderBottom:'1px solid rgba(255,255,255,0.07)', background:'rgba(0,0,0,0.2)' }}>
            {[
              { key:'profile',  label:'👤 Profile Info' },
              { key:'security', label:'🔐 Change Password' },
              { key:'status',   label:'📋 Account Status' },
            ].map(t => (
              <button key={t.key} className={`pf-tab${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Tab content ── */}
          <div style={{ padding:'28px 28px 24px' }}>
            {tab === 'profile'  && <ProfileTab  user={user} showToast={showToast} onSaved={refreshUser} />}
            {tab === 'security' && <SecurityTab user={user} showToast={showToast} />}
            {tab === 'status'   && <StatusTab   user={user} navigate={navigate} />}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── PROFILE TAB ─────────────────────────────────────────────── */
function ProfileTab({ user, showToast, onSaved }) {
  const [name,        setName]        = useState(user.name        || '');
  const [institution, setInstitution] = useState(user.institution || '');
  const [campus,      setCampus]      = useState(user.campus      || '');
  const [phone,       setPhone]       = useState(user.phone       || '');
  const [saving,      setSaving]      = useState(false);
  const [nameErr,     setNameErr]     = useState('');

  async function save() {
    if (!name.trim()) { setNameErr('Display name is required.'); return; }
    setSaving(true);
    try {
      await api.auth.updateProfile({ name: name.trim(), institution, campus, phone });
      await onSaved?.();
      showToast('Profile updated successfully!');
    } catch (err) {
      showToast(err.message || 'Update failed', false);
    } finally { setSaving(false); }
  }

  const changed = name !== (user.name||'') || institution !== (user.institution||'') || campus !== (user.campus||'') || phone !== (user.phone||'');

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20, maxWidth:520 }}>
      {/* Name */}
      <div>
        <label className="pf-label">Display Name <span style={{ color:'#e11d48' }}>*</span></label>
        <input className="pf-input" value={name} placeholder="Your full name"
          onChange={e => { setName(e.target.value); if (e.target.value.trim()) setNameErr(''); }}
          style={nameErr ? { borderColor:'#e11d48' } : {}} />
        {nameErr && <div style={{ color:'#f87171', fontSize:12, marginTop:5 }}>⚠ {nameErr}</div>}
      </div>

      {/* Email — read only */}
      <div>
        <label className="pf-label">Email Address <span style={{ color:'rgba(255,255,255,0.45)', fontSize:12, fontWeight:400, textTransform:'none' }}>— cannot be changed</span></label>
        <input className="pf-input" value={user.email} disabled style={{ opacity:.5, cursor:'not-allowed' }} />
      </div>

      {/* Phone */}
      <div>
        <label className="pf-label">Phone Number</label>
        <input className="pf-input" value={phone} placeholder="e.g. 09XX-XXX-XXXX"
          onChange={e => setPhone(e.target.value)} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {/* Institution */}
        <div>
          <label className="pf-label">Institution / Organization</label>
          <input className="pf-input" value={institution} placeholder="e.g. University of the Philippines"
            onChange={e => setInstitution(e.target.value)} />
        </div>
        {/* Campus */}
        <div>
          <label className="pf-label">Campus / Branch</label>
          <input className="pf-input" value={campus} placeholder="e.g. UP Visayas"
            onChange={e => setCampus(e.target.value)} />
        </div>
      </div>

      <div style={{ display:'flex', gap:12, alignItems:'center', paddingTop:4, borderTop:'1px solid rgba(255,255,255,0.07)' }}>
        <button className="pf-save" onClick={save} disabled={saving || !changed}>
          {saving ? '⏳ Saving…' : '✅ Save Profile'}
        </button>
        {!changed && <span style={{ fontSize:12.5, color:'rgba(255,255,255,0.3)' }}>No unsaved changes</span>}
      </div>
    </div>
  );
}

/* ─── SECURITY TAB ────────────────────────────────────────────── */
function SecurityTab({ showToast }) {
  const [current,  setCurrent]  = useState('');
  const [next,     setNext]     = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [saving,   setSaving]   = useState(false);
  const [errors,   setErrors]   = useState({});
  const [showPw,   setShowPw]   = useState({ c:false, n:false, cf:false });

  function validate() {
    const e = {};
    if (!current.trim())  e.current  = 'Current password is required.';
    if (next.length < 8)  e.next     = 'New password must be at least 8 characters.';
    if (next !== confirm)  e.confirm  = 'Passwords do not match.';
    if (next === current && next) e.next = 'New password must differ from current password.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function save() {
    if (!validate()) return;
    setSaving(true);
    try {
      await api.auth.changePassword({ current_password: current, new_password: next });
      showToast('Password changed successfully!');
      setCurrent(''); setNext(''); setConfirm(''); setErrors({});
    } catch (err) {
      const msg = err.message || 'Password change failed';
      if (msg.toLowerCase().includes('current') || msg.toLowerCase().includes('incorrect')) {
        setErrors(e => ({ ...e, current: 'Current password is incorrect.' }));
      } else {
        showToast(msg, false);
      }
    } finally { setSaving(false); }
  }

  const pwField = (key, label, val, setter, showKey) => (
    <div>
      <label className="pf-label">{label}</label>
      <div style={{ position:'relative' }}>
        <input className="pf-input"
          type={showPw[showKey] ? 'text' : 'password'}
          value={val}
          placeholder={key === 'current' ? 'Enter current password' : key === 'next' ? 'At least 8 characters' : 'Repeat new password'}
          onChange={e => { setter(e.target.value); setErrors(p => ({ ...p, [key]:'' })); }}
          style={errors[key] ? { borderColor:'#e11d48', paddingRight:44 } : { paddingRight:44 }}
        />
        <button
          type="button"
          onClick={() => setShowPw(p => ({ ...p, [showKey]: !p[showKey] }))}
          style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontSize:16, lineHeight:1 }}
        >{showPw[showKey] ? '🙈' : '👁'}</button>
      </div>
      {errors[key] && <div style={{ color:'#f87171', fontSize:12, marginTop:5 }}>⚠ {errors[key]}</div>}
    </div>
  );

  // Password strength indicator
  function strength(pw) {
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  }
  const str = strength(next);
  const strLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strColor = ['', '#ef4444', '#f59e0b', '#3b82f6', '#10b981'];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20, maxWidth:440 }}>
      <div style={{ background:'rgba(59,130,246,0.07)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:12, padding:'12px 16px', display:'flex', gap:10, alignItems:'flex-start' }}>
        <span style={{ fontSize:16, flexShrink:0 }}>ℹ️</span>
        <p style={{ color:'rgba(255,255,255,0.6)', fontSize:13, margin:0, lineHeight:1.6 }}>
          Your password must be at least <strong style={{ color:'#fff' }}>8 characters</strong>. Use a mix of letters, numbers and symbols for a stronger password.
        </p>
      </div>

      {pwField('current', 'Current Password', current, setCurrent, 'c')}

      <div>
        {pwField('next', 'New Password', next, setNext, 'n')}
        {next && (
          <div style={{ marginTop:8, display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ flex:1, height:4, background:'rgba(255,255,255,0.08)', borderRadius:2, overflow:'hidden' }}>
              {[1,2,3,4].map(i => (
                <div key={i} style={{ display:'inline-block', width:'25%', height:'100%', background: i <= str ? strColor[str] : 'transparent', borderRadius:2 }} />
              ))}
            </div>
            {str > 0 && <span style={{ fontSize:11.5, fontWeight:700, color: strColor[str], flexShrink:0 }}>{strLabel[str]}</span>}
          </div>
        )}
      </div>

      {pwField('confirm', 'Confirm New Password', confirm, setConfirm, 'cf')}

      {confirm && next && confirm === next && (
        <div style={{ color:'#34d399', fontSize:12.5, fontWeight:600, display:'flex', alignItems:'center', gap:6 }}>
          ✅ Passwords match
        </div>
      )}

      <div style={{ paddingTop:4, borderTop:'1px solid rgba(255,255,255,0.07)' }}>
        <button className="pf-save" onClick={save} disabled={saving}>
          {saving ? '⏳ Changing…' : '🔐 Change Password'}
        </button>
      </div>
    </div>
  );
}

/* ─── STATUS TAB ──────────────────────────────────────────────── */
function StatusTab({ user, navigate }) {
  const rc = ROLE_COLORS[user.role] || ROLE_COLORS.GUEST;

  const infoRows = [
    { icon:'👤', label:'Display Name',     value: user.name },
    { icon:'📧', label:'Email Address',    value: user.email },
    { icon:'🪪', label:'Account Role',     value: `${rc.icon} ${rc.label}`, color: rc.color },
    { icon:'🟢', label:'Account Status',   value: user.status, color: STATUS_COLORS[user.status]?.color },
    { icon:'🏛', label:'Institution',      value: user.institution || '—' },
    { icon:'📍', label:'Campus',           value: user.campus || '—' },
    { icon:'📞', label:'Phone',            value: user.phone || '—' },
    { icon:'🎫', label:'Membership Tier',  value: user.tier || '—' },
    { icon:'📅', label:'Member Since',     value: user.member_since || '—' },
    { icon:'🔄', label:'Renewal Due',      value: user.renewal_due || '—' },
  ].filter(r => r.value && r.value !== '—' || ['Email Address','Account Role','Account Status'].includes(r.label));

  return (
    <div style={{ maxWidth:560 }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:24 }}>
        {infoRows.map(r => (
          <div key={r.label} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'12px 16px' }}>
            <div style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.55)', textTransform:'uppercase', letterSpacing:'.4px', marginBottom:5 }}>
              <span style={{ marginRight:6 }}>{r.icon}</span>{r.label}
            </div>
            <div style={{ fontSize:13.5, fontWeight:700, color: r.color || '#fff', lineHeight:1.35 }}>
              {r.value}
            </div>
          </div>
        ))}
      </div>

      {/* Role-based actions */}
      <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'18px 20px' }}>
        <div style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'.6px', marginBottom:14 }}>Quick Actions</div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          {user.role === 'GUEST' && (
            <button onClick={() => navigate('/membership')} style={{ background:'linear-gradient(90deg,#f97316,#e11d48)', color:'#fff', border:'none', borderRadius:10, padding:'10px 18px', fontSize:13, fontWeight:800, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 14px rgba(249,115,22,0.35)' }}>
              Apply for Membership →
            </button>
          )}
          {user.role === 'MEMBER' && (
            <button onClick={() => navigate('/membership')} style={{ background:'rgba(16,185,129,0.12)', color:'#34d399', border:'1px solid rgba(16,185,129,0.3)', borderRadius:10, padding:'10px 18px', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
              View Membership Card
            </button>
          )}
          {user.role === 'ADMIN' && (
            <button onClick={() => navigate('/admin')} style={{ background:'rgba(225,29,72,0.12)', color:'#fca5a5', border:'1px solid rgba(225,29,72,0.3)', borderRadius:10, padding:'10px 18px', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
              Open Admin Panel
            </button>
          )}
          <button onClick={() => navigate('/programs')} style={{ background:'rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.65)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, padding:'10px 18px', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
            Browse Programs
          </button>
        </div>
      </div>
    </div>
  );
}
