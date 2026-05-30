import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import ParticleBackground from '../components/ParticleBackground';
import { api } from '../api';

const FIELDS = [
  { key: 'name',    label: 'Full Name',     type: 'text',  placeholder: 'Your full name',    required: true },
  { key: 'email',   label: 'Email Address', type: 'email', placeholder: 'your@email.com',    required: true },
  { key: 'subject', label: 'Subject',       type: 'text',  placeholder: 'Brief subject line', required: true },
];

const CATEGORIES = ['General Inquiry', 'Membership Issue', 'Technical Support', 'Event Concern', 'Funding Query', 'Other'];

const CONTACT_INFO = [
  { icon: '📧', label: 'Email',         val: 'admin@dasig.ph'                        },
  { icon: '📍', label: 'Address',       val: 'DASIG Secretariat, Cebu City, Region VII' },
  { icon: '🕐', label: 'Response Time', val: '1–2 Business Days'                    },
];

const CSS = `
  @keyframes slideIn  { from{transform:translateY(18px);opacity:0} to{transform:translateY(0);opacity:1} }
  @keyframes checkPop { 0%{transform:scale(0)} 70%{transform:scale(1.2)} 100%{transform:scale(1)} }
  .ca-input {
    width:100%; box-sizing:border-box;
    border:1.5px solid rgba(255,255,255,0.15); border-radius:12px;
    padding:12px 15px; font-size:14px; font-family:inherit; color:#fff;
    outline:none; transition:border-color 0.15s, background 0.15s;
    background:rgba(255,255,255,0.07);
  }
  .ca-input::placeholder { color:rgba(255,255,255,0.35); }
  .ca-input:focus { border-color:#f97316; background:rgba(255,255,255,0.12); }
  .ca-input option { background:#1e3a8a; color:#fff; }
`;

export default function ContactAdminPage() {
  const [form, setForm]       = useState({ name:'', email:'', subject:'', category:'General Inquiry', message:'' });
  const [errors, setErrors]   = useState({});
  const [sent, setSent]       = useState(false);
  const [sending, setSending] = useState(false);

  function validate() {
    const e = {};
    if (!form.name.trim())    e.name    = 'Full name is required.';
    if (!form.email.trim())   e.email   = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email.';
    if (!form.subject.trim()) e.subject = 'Subject is required.';
    if (!form.message.trim()) e.message = 'Please describe your concern.';
    return e;
  }

  function handleChange(k, v) {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: undefined }));
  }

  const [submitErr, setSubmitErr] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSending(true);
    setSubmitErr('');
    try {
      await api.contact.send(form);
      setSent(true);
    } catch (err) {
      setSubmitErr(err.message || 'Failed to send message. Please try again or email admin@dasig.ph directly.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ background:'linear-gradient(180deg,#000d30 0%,#020817 300px,#0f172a 100%)', minHeight:'100vh', position:'relative' }}>
      <ParticleBackground density={45} />
      <div style={{ position:'relative', zIndex:1 }}>
      <style>{CSS}</style>
      <PageHeader eyebrow="Support" title="Contact Admin" backTo="/" />

      <section style={{ padding:'48px 24px 80px' }}>
        <div style={{ maxWidth:720, margin:'0 auto' }}>

          {sent ? (
            <div style={{
              background:'linear-gradient(135deg,rgba(5,150,105,0.15),rgba(8,145,178,0.1))',
              border:'1px solid rgba(16,185,129,0.3)',
              borderRadius:24, padding:'56px 36px', textAlign:'center',
              animation:'slideIn 0.4s ease',
              backdropFilter:'blur(10px)',
            }}>
              <div style={{ fontSize:72, marginBottom:18, animation:'checkPop 0.5s ease' }}>✅</div>
              <h2 style={{ fontWeight:900, fontSize:24, color:'#fff', marginBottom:10 }}>Message Sent!</h2>
              <p style={{ color:'rgba(255,255,255,0.6)', fontSize:14.5, lineHeight:1.7, maxWidth:400, margin:'0 auto 32px' }}>
                Thank you for reaching out. The DASIG Admin team will respond to{' '}
                <strong style={{ color:'#f97316' }}>{form.email}</strong> within 1–2 business days.
              </p>
              <button
                onClick={() => { setSent(false); setForm({ name:'', email:'', subject:'', category:'General Inquiry', message:'' }); }}
                style={{
                  background:'linear-gradient(90deg,#f97316,#e11d48)', color:'#fff',
                  border:'none', borderRadius:12, padding:'13px 32px', fontSize:14, fontWeight:800,
                  cursor:'pointer', fontFamily:'inherit',
                  boxShadow:'0 6px 20px rgba(249,115,22,0.4)',
                }}>Send Another Message</button>
            </div>
          ) : (
            <div style={{
              background:'rgba(255,255,255,0.04)',
              border:'1px solid rgba(255,255,255,0.1)',
              borderRadius:24, overflow:'hidden',
              backdropFilter:'blur(12px)',
              boxShadow:'0 24px 64px rgba(0,0,0,0.4)',
            }}>
              {/* Header */}
              <div style={{
                background:'linear-gradient(135deg,#001d5c,#1a56db)',
                padding:'28px 32px', position:'relative', overflow:'hidden',
              }}>
                <div style={{
                  position:'absolute', top:-40, right:-40, width:200, height:200,
                  borderRadius:'50%', background:'radial-gradient(circle,rgba(249,115,22,0.2),transparent 70%)',
                }} />
                <div style={{ fontSize:36, marginBottom:10 }}>📬</div>
                <h2 style={{ color:'#fff', fontWeight:900, fontSize:22, margin:'0 0 6px' }}>Get in Touch with DASIG Admin</h2>
                <p style={{ color:'rgba(255,255,255,0.6)', fontSize:13.5, margin:0 }}>
                  Questions about membership, events, training, or technical issues? We're here to help.
                </p>
              </div>

              <form onSubmit={handleSubmit} style={{ padding:'28px 32px 32px' }}>
                {/* Name + Email */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                  {FIELDS.slice(0,2).map(f => (
                    <Field key={f.key} f={f} value={form[f.key]} error={errors[f.key]}
                      onChange={v => handleChange(f.key, v)} />
                  ))}
                </div>

                {/* Category */}
                <div style={{ marginBottom:16 }}>
                  <label style={{ fontSize:11.5, fontWeight:800, color:'rgba(255,255,255,0.5)', display:'block', marginBottom:6, letterSpacing:'0.5px', textTransform:'uppercase' }}>Category</label>
                  <select className="ca-input" value={form.category} onChange={e => handleChange('category', e.target.value)}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>

                {/* Subject */}
                <div style={{ marginBottom:16 }}>
                  <Field f={FIELDS[2]} value={form.subject} error={errors.subject}
                    onChange={v => handleChange('subject', v)} />
                </div>

                {/* Message */}
                <div style={{ marginBottom:24 }}>
                  <label style={{
                    fontSize:11.5, fontWeight:800,
                    color: errors.message ? '#f87171' : 'rgba(255,255,255,0.5)',
                    display:'block', marginBottom:6, letterSpacing:'0.5px', textTransform:'uppercase',
                  }}>
                    Message <span style={{ color:'#f43f5e' }}>*</span>
                  </label>
                  <textarea className="ca-input" rows={5}
                    placeholder="Describe your concern or question in detail…"
                    value={form.message}
                    onChange={e => handleChange('message', e.target.value)}
                    style={{
                      resize:'vertical', minHeight:120,
                      borderColor: errors.message ? '#f43f5e' : undefined,
                    }}
                  />
                  {errors.message && <div style={{ marginTop:5, fontSize:12, color:'#f87171', fontWeight:700 }}>⚠ {errors.message}</div>}
                </div>

                <button type="submit" disabled={sending} style={{
                  width:'100%',
                  background: sending ? 'rgba(255,255,255,0.1)' : 'linear-gradient(90deg,#f97316,#e11d48)',
                  color: sending ? 'rgba(255,255,255,0.5)' : '#fff',
                  border:'none', borderRadius:14, padding:'14px',
                  fontSize:15, fontWeight:900, cursor: sending ? 'not-allowed' : 'pointer',
                  fontFamily:'inherit', boxShadow: sending ? 'none' : '0 6px 24px rgba(249,115,22,0.4)',
                  transition:'all 0.2s',
                }}>
                  {sending ? '⏳ Sending…' : '📨 Send Message'}
                </button>

                {submitErr && (
                  <div style={{ marginTop:12, background:'rgba(225,29,72,0.1)', border:'1px solid rgba(225,29,72,0.3)', borderRadius:10, padding:'12px 16px', color:'#f87171', fontSize:13.5, fontWeight:600 }}>
                    ⚠️ {submitErr}
                  </div>
                )}

                {/* Contact info */}
                <div style={{
                  marginTop:24, paddingTop:22,
                  borderTop:'1px solid rgba(255,255,255,0.08)',
                  display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14,
                }}>
                  {CONTACT_INFO.map(r => (
                    <div key={r.label} style={{
                      background:'rgba(255,255,255,0.05)',
                      borderRadius:12, padding:'14px',
                      border:'1px solid rgba(255,255,255,0.07)',
                    }}>
                      <div style={{ fontSize:20, marginBottom:6 }}>{r.icon}</div>
                      <div style={{ fontSize:10.5, color:'rgba(255,255,255,0.4)', fontWeight:800, marginBottom:4, textTransform:'uppercase', letterSpacing:'0.5px' }}>{r.label}</div>
                      <div style={{ fontSize:12.5, color:'rgba(255,255,255,0.75)', fontWeight:600 }}>{r.val}</div>
                    </div>
                  ))}
                </div>
              </form>
            </div>
          )}
        </div>
      </section>
      </div>
    </div>
  );
}

function Field({ f, value, error, onChange }) {
  return (
    <div>
      <label style={{
        fontSize:11.5, fontWeight:800,
        color: error ? '#f87171' : 'rgba(255,255,255,0.5)',
        display:'block', marginBottom:6, letterSpacing:'0.5px', textTransform:'uppercase',
      }}>
        {f.label} {f.required && <span style={{ color:'#f43f5e' }}>*</span>}
      </label>
      <input className="ca-input" type={f.type} placeholder={f.placeholder}
        value={value} onChange={e => onChange(e.target.value)}
        style={{ borderColor: error ? '#f43f5e' : undefined }}
      />
      {error && <div style={{ marginTop:5, fontSize:12, color:'#f87171', fontWeight:700 }}>⚠ {error}</div>}
    </div>
  );
}
