import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import HaribonFull from '../components/HaribonFull';
import PageHeader from '../components/PageHeader';

function CertificateModal({ user, status, onClose }) {
  function handlePrint() {
    const w = window.open('', '_blank', 'width=800,height=600');
    w.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <title>DASIG Membership Certificate</title>
        <style>
          body { margin:0; font-family:'Segoe UI',sans-serif; background:#fff; }
          .cert { max-width:720px; margin:40px auto; padding:60px; border:3px solid #1a56db;
                  border-radius:12px; text-align:center; position:relative; }
          .cert::before { content:''; position:absolute; inset:10px; border:1px solid #1a56db44;
                          border-radius:8px; pointer-events:none; }
          .logo { font-size:36px; margin-bottom:8px; }
          .org { font-size:12px; letter-spacing:2px; color:#64748b; text-transform:uppercase; margin-bottom:32px; }
          h1 { font-size:28px; color:#001d5c; font-weight:900; margin:0 0 4px; letter-spacing:-0.5px; }
          .sub { font-size:13px; color:#64748b; margin-bottom:32px; }
          .name { font-size:32px; color:#e11d48; font-weight:900; border-bottom:2px solid #e11d48;
                  display:inline-block; padding-bottom:6px; margin-bottom:8px; }
          .inst { font-size:16px; color:#374151; margin-bottom:32px; }
          .details { display:flex; justify-content:center; gap:48px; margin:24px 0 36px; }
          .detail-item { text-align:center; }
          .detail-label { font-size:10px; text-transform:uppercase; letter-spacing:1px; color:#94a3b8; font-weight:700; margin-bottom:4px; }
          .detail-value { font-size:14px; color:#1e293b; font-weight:700; }
          .footer { font-size:11px; color:#94a3b8; margin-top:40px; padding-top:16px; border-top:1px solid #e2e8f0; }
          @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
        </style>
      </head>
      <body>
        <div class="cert">
          <div class="logo">🏛️</div>
          <div class="org">Dynamic Academic and Scientific Information Group · Region VII</div>
          <h1>Certificate of Membership</h1>
          <div class="sub">This is to certify that</div>
          <div class="name">${user.name}</div>
          <div class="inst">${status.institution || user.institution || '—'}</div>
          <div class="details">
            <div class="detail-item">
              <div class="detail-label">Membership Tier</div>
              <div class="detail-value">${status.tier || '—'}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Member Since</div>
              <div class="detail-value">${status.memberSince || '—'}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Valid Until</div>
              <div class="detail-value">${status.renewalDue || '—'}</div>
            </div>
          </div>
          <div style="font-size:13px;color:#475569;line-height:1.7">
            is a duly recognized <strong>${status.tier || 'member'}</strong> of the DASIG Consortium
            and is entitled to all privileges and responsibilities thereto.
          </div>
          <div class="footer">
            © 2026 DASIG Consortium · Region VII, Central Visayas, Philippines
          </div>
        </div>
        <script>window.onload=function(){window.print();}<\/script>
      </body>
      </html>
    `);
    w.document.close();
    onClose();
  }

  return (
    <div onClick={onClose} style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:9100,
      display:'flex', alignItems:'center', justifyContent:'center', padding:20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background:'#0f1629', border:'1px solid rgba(255,255,255,0.1)', borderRadius:20,
        padding:'28px 32px', maxWidth:420, width:'100%',
        boxShadow:'0 40px 100px rgba(0,0,0,0.8)',
      }}>
        <div style={{ fontSize:40, textAlign:'center', marginBottom:12 }}>🏅</div>
        <h3 style={{ color:'#fff', fontWeight:900, fontSize:18, textAlign:'center', margin:'0 0 8px' }}>
          Membership Certificate
        </h3>
        <p style={{ color:'rgba(255,255,255,0.5)', fontSize:13, textAlign:'center', lineHeight:1.6, margin:'0 0 24px' }}>
          Your certificate will open in a new window ready to print or save as PDF.
        </p>
        <div style={{ display:'flex', gap:12 }}>
          <button onClick={onClose} style={{
            flex:1, background:'rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.6)',
            border:'1px solid rgba(255,255,255,0.12)', borderRadius:12, padding:'12px',
            fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
          }}>Cancel</button>
          <button onClick={handlePrint} style={{
            flex:2, background:'linear-gradient(90deg,#f97316,#e11d48)', color:'#fff',
            border:'none', borderRadius:12, padding:'12px', fontSize:13.5, fontWeight:800,
            cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 16px rgba(249,115,22,0.4)',
          }}>🖨️ Print / Save PDF</button>
        </div>
      </div>
    </div>
  );
}

const MEMBERSHIP_CSS = `
  .ms-input {
    width: 100%; box-sizing: border-box;
    border: 1.5px solid rgba(255,255,255,0.15); border-radius: 12px;
    padding: 12px 14px; font-size: 14px; font-family: inherit; color: #fff;
    outline: none; transition: border-color 0.15s, background 0.15s;
    background: rgba(255,255,255,0.07);
  }
  .ms-input::placeholder { color: rgba(255,255,255,0.35); }
  .ms-input:focus { border-color: #f97316; background: rgba(255,255,255,0.12); }
  .ms-input option { background: #1e3a8a; color: #fff; }
`;

export default function MembershipPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [applyForm, setApplyForm] = useState({ institution: '', campus: '', tier: 'Tier 2' });
  const [applyMsg, setApplyMsg]   = useState('');
  const [applying, setApplying]   = useState(false);
  const [showCert, setShowCert]   = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    api.membership.status()
      .then(setStatus)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div style={{ background: 'linear-gradient(180deg,#000d30 0%,#020817 300px,#0f172a 100%)', minHeight: '100vh' }}>
        <PageHeader eyebrow="Consortium" title="Membership" backTo="/" />
        <div style={{ minHeight: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <div style={{ fontSize: 48 }}>🦅</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>Sign in to view your membership</div>
          <button onClick={() => navigate('/login')} style={{
            background: 'linear-gradient(90deg,#f97316,#e11d48)', color: '#fff',
            border: 'none', borderRadius: 12, padding: '13px 32px', fontSize: 14, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 20px rgba(249,115,22,0.4)',
          }}>Log in →</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ background: 'linear-gradient(180deg,#000d30 0%,#020817 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
          Loading membership status…
        </div>
      </div>
    );
  }

  const isMember = status?.role === 'MEMBER' || status?.role === 'ADMIN';

  async function handleApply(e) {
    e.preventDefault();
    setApplying(true);
    try {
      const res = await api.membership.apply(applyForm);
      setApplyMsg(res.message);
    } catch (err) {
      setApplyMsg(err.message);
    } finally {
      setApplying(false);
    }
  }

  const dataRows = isMember ? [
    { label: 'Institution',    value: status.institution || user.institution, icon: '🏛️' },
    { label: 'Campus',         value: status.campus || user.campus,            icon: '📍' },
    { label: 'Tier',           value: status.tier,                             icon: '⭐' },
    { label: 'Member Since',   value: status.memberSince,                      icon: '📅' },
    { label: 'Renewal Due',    value: status.renewalDue,                       icon: '🔄' },
    { label: 'Modules Access', value: status.modulesAccess,                    icon: '🔓' },
  ] : [];

  return (
    <div style={{ background: 'linear-gradient(180deg,#000d30 0%,#020817 300px,#0f172a 100%)', minHeight: '100vh' }}>
      <style>{MEMBERSHIP_CSS}</style>
      {showCert && <CertificateModal user={user} status={status} onClose={() => setShowCert(false)} />}
      <PageHeader eyebrow="Consortium" title="Membership" backTo="/" />

      <section style={{ padding: '48px 24px 80px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>

          {/* Main card */}
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 24, overflow: 'hidden',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
          }}>
            {/* Header banner */}
            <div style={{
              background: 'linear-gradient(135deg,#001d5c,#1a56db 55%,#4f46e5)',
              padding: '32px 28px', position: 'relative', overflow: 'hidden',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div style={{ position: 'absolute', width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(rgba(249,115,22,0.25),transparent)', right: -50, top: -70, pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(rgba(79,70,229,0.2),transparent)', left: -30, bottom: -60, pointerEvents: 'none' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  background: isMember ? 'rgba(74,222,128,0.15)' : 'rgba(245,158,11,0.15)',
                  border: `1px solid ${isMember ? 'rgba(74,222,128,0.35)' : 'rgba(245,158,11,0.35)'}`,
                  borderRadius: 20, padding: '5px 14px', marginBottom: 14,
                }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: isMember ? '#4ade80' : '#fbbf24', display: 'inline-block' }} />
                  <span style={{ color: isMember ? '#4ade80' : '#fbbf24', fontSize: 12, fontWeight: 800 }}>{isMember ? 'Active Member' : 'Guest Access'}</span>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 6 }}>DASIG Membership Status</div>
                <div style={{ color: '#fff', fontSize: 32, fontWeight: 900, letterSpacing: '-1px' }}>{isMember ? 'Active' : 'Guest'}</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12.5, marginTop: 4 }}>{isMember ? '2026 Membership Year' : 'Apply to become a member'}</div>
              </div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <HaribonFull width={85} />
              </div>
            </div>

            {/* Welcome strip */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '16px 24px',
              background: 'rgba(255,255,255,0.03)',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
            }}>
              <div style={{ fontSize: 28 }}>🦅</div>
              <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                <strong style={{ color: '#fff' }}>Kumusta, {user.name}!</strong>{' '}
                {isMember
                  ? 'Your membership is active and all modules are accessible.'
                  : 'Your account is active as a guest. Apply below to become a consortium member.'}
              </div>
            </div>

            {isMember ? (
              <>
                <div style={{ padding: '8px 0' }}>
                  {dataRows.map((row, i) => (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '15px 26px',
                      borderBottom: i < dataRows.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <span style={{ fontSize: 16 }}>{row.icon}</span>
                        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>{row.label}</span>
                      </div>
                      <span style={{ fontSize: 13.5, color: '#fff', fontWeight: 700, textAlign: 'right', maxWidth: '55%' }}>{row.value}</span>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '20px 24px' }}>
                  <button style={{
                    width: '100%',
                    background: 'linear-gradient(90deg,#f97316,#e11d48)', color: '#fff',
                    border: 'none', borderRadius: 14, padding: '14px', fontSize: 14.5, fontWeight: 800,
                    cursor: 'pointer', fontFamily: 'inherit',
                    boxShadow: '0 6px 20px rgba(249,115,22,0.4)', transition: 'all 0.2s',
                  }}
                  onClick={() => setShowCert(true)}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                  >📄 Download Membership Certificate</button>
                </div>
              </>
            ) : (
              <div style={{ padding: '26px 26px 28px' }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 18 }}>Apply for Institutional Membership</div>

                {applyMsg && (
                  <div style={{
                    background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
                    borderRadius: 10, padding: '12px 16px', marginBottom: 18,
                    fontSize: 13.5, color: '#34d399',
                  }}>{applyMsg}</div>
                )}

                <form onSubmit={handleApply}>
                  <ApplyField label="Institution" value={applyForm.institution}
                    onChange={e => setApplyForm(f => ({ ...f, institution: e.target.value }))}
                    placeholder="University / Agency name" />
                  <ApplyField label="Campus / City" value={applyForm.campus}
                    onChange={e => setApplyForm(f => ({ ...f, campus: e.target.value }))}
                    placeholder="e.g. Cebu City" />
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: 'rgba(255,255,255,0.5)', marginBottom: 7, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Membership Tier</label>
                    <select className="ms-input" value={applyForm.tier}
                      onChange={e => setApplyForm(f => ({ ...f, tier: e.target.value }))}>
                      <option value="Tier 1">Tier 1 — Full Member</option>
                      <option value="Tier 2">Tier 2 — Associate Member</option>
                      <option value="Tier 3">Tier 3 — Observer</option>
                    </select>
                  </div>
                  <button type="submit" disabled={applying} style={{
                    width: '100%',
                    background: applying ? 'rgba(255,255,255,0.1)' : 'linear-gradient(90deg,#f97316,#e11d48)',
                    color: applying ? 'rgba(255,255,255,0.5)' : '#fff',
                    border: 'none', borderRadius: 14, padding: '14px', fontSize: 14.5, fontWeight: 800,
                    cursor: applying ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                    boxShadow: applying ? 'none' : '0 6px 20px rgba(249,115,22,0.4)',
                    transition: 'all 0.2s',
                  }}>{applying ? '⏳ Submitting…' : '📨 Submit Application'}</button>
                </form>
              </div>
            )}
          </div>

          {/* Tier info cards */}
          <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {[
              { tier: 'Tier 1', label: 'Full Member', icon: '⭐', grad: 'linear-gradient(135deg,#1e3a8a,#3b82f6)', perks: 'All modules, voting rights' },
              { tier: 'Tier 2', label: 'Associate',   icon: '🔷', grad: 'linear-gradient(135deg,#065f46,#10b981)', perks: 'All modules, no voting'   },
              { tier: 'Tier 3', label: 'Observer',    icon: '👁️', grad: 'linear-gradient(135deg,#374151,#6b7280)', perks: 'Read-only access'          },
            ].map(t => (
              <div key={t.tier} style={{
                background: t.grad, borderRadius: 14, padding: '16px 14px',
                border: '1px solid rgba(255,255,255,0.1)',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', bottom: -8, right: -2, fontSize: 48, opacity: 0.1 }}>{t.icon}</div>
                <div style={{ fontSize: 18, marginBottom: 6 }}>{t.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 900, color: '#fff', marginBottom: 2 }}>{t.tier}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600, marginBottom: 4 }}>{t.label}</div>
                <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.5)' }}>{t.perks}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function ApplyField({ label, value, onChange, placeholder }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: 'rgba(255,255,255,0.5)', marginBottom: 7, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{label}</label>
      <input className="ms-input" value={value} onChange={onChange} placeholder={placeholder} required />
    </div>
  );
}
