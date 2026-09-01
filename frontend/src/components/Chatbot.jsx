import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import HaribonFace from './HaribonFace';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

/* ── Role-based quick chips (Trilingual: English, Bisaya, Tagalog) ─ */
const QUICK_BY_ROLE = {
  GUEST: [
    { label: '📅 Upcoming Events',          q: 'What events are coming up?' },
    { label: '🇵🇭 (Bisaya) Mga Events',      q: 'Maayong adlaw! Unsay mga umaabot nga events sa DASIG?' },
    { label: '🇵🇭 (Tagalog) Mga Kaganapan',   q: 'Magandang araw! May mga paparating bang event sa DASIG?' },
    { label: '🎓 Training Programs',        q: 'What training programs are available?' },
    { label: '🇵🇭 (Bisaya) Unsaon Pag-apil', q: 'Unsaon pag-apil sa DASIG membership?' },
    { label: '💰 Funding Grants',           q: 'What funding opportunities are available?' },
    { label: '🏛 Member Institutions',      q: 'Who are the DASIG member institutions?' },
    { label: '🦅 About Haribon',            q: 'Who are you and what languages can you speak?' },
  ],
  MEMBER: [
    { label: '📅 Upcoming Events',          q: 'What events are coming up?' },
    { label: '🇵🇭 (Bisaya) Mga Events',      q: 'Unsay mga umaabot nga kalihokan sa DASIG?' },
    { label: '🎓 Enroll in Training',       q: 'What training programs can I enroll in?' },
    { label: '💰 Open Funding',             q: 'What funding opportunities are open?' },
    { label: '🤝 Partnerships',             q: 'Tell me about DASIG partnerships' },
    { label: '📋 View Policies',            q: 'What governance policies are available?' },
    { label: '🇵🇭 (Tagalog) Research Grants', q: 'May available bang research grants para sa unibersidad?' },
    { label: '🏛 Member Institutions',      q: 'Who are the DASIG member institutions?' },
  ],
  ADMIN: [
    { label: '📅 All Events',               q: 'What events are coming up?' },
    { label: '🎓 Training Programs',        q: 'What training programs are available?' },
    { label: '👥 Member Management',        q: 'What can the admin panel manage?' },
    { label: '🤖 Trilingual AI Engine',     q: 'What languages can Haribon understand?' },
    { label: '💰 Funding Opportunities',    q: 'What funding opportunities exist?' },
    { label: '📋 Governance Policies',      q: 'What governance policies are available?' },
    { label: '🤝 Partnerships',             q: 'Tell me about DASIG partnerships' },
    { label: '🦅 Haribon Capabilities',     q: 'How does the trilingual Haribon AI work?' },
  ],
};

/* ── Role-based greeting ──────────────────────────────────────── */
function getGreeting(user) {
  if (!user) {
    return "Hi! I'm Haribon 🦅 — the DASIG AI Assistant.\n\nI am fluent in **English**, **Bisaya (Cebuano)**, and **Tagalog (Filipino)**.\n\nAsk me anything about events, faculty training, membership, research grants, and governance policies. Pwede kang mangutana sa Bisaya o Tagalog!";
  }
  const first = (user.name || '').split(' ')[0];
  if (user.role === 'ADMIN') {
    return `Hello, ${first}! I'm Haribon 🦅 — the DASIG AI Assistant.\n\nAs an administrator, I can assist you in English, Bisaya, or Tagalog with portal metrics, event capacities, training courses, and governance management.\n\nUnsay akong ikatabang kanimo karon?`;
  }
  if (user.role === 'MEMBER') {
    return `Welcome back, ${first}! 🦅 I'm Haribon — your DASIG AI Assistant.\n\nYou have full member access. Ask me in English, Bisaya, or Tagalog about upcoming conferences, training enrollments, DOST grants, or governance policies.\n\nHow can I help you today?`;
  }
  return `Hi, ${first}! I'm Haribon 🦅 — the DASIG AI Assistant.\n\nI can help you in English, Bisaya, or Tagalog. What would you like to know?`;
}

/* ── Bot-text formatter ───────────────────────────────────────── */
function WBotText({ text }) {
  const blocks = (text || '').split('\n\n').filter(Boolean);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      {blocks.map((block, bi) => {
        const lines = block.split('\n').filter(l => l.trim());
        return (
          <div key={bi} style={{ display:'flex', flexDirection:'column', gap:2 }}>
            {lines.map((line, li) => {
              const t = line.trim();
              if (t.startsWith('•') || t.startsWith('-')) {
                return (
                  <div key={li} style={{ display:'flex', gap:7, alignItems:'flex-start' }}>
                    <span style={{ color:'#f97316', fontSize:10, marginTop:3, flexShrink:0 }}>▸</span>
                    <span style={{ color:'rgba(255,255,255,0.85)', fontSize:12, lineHeight:1.55 }}>{t.replace(/^[•\-]\s*/, '')}</span>
                  </div>
                );
              }
              if (/^\d+\./.test(t)) {
                const num = t.match(/^(\d+)\./)[1];
                const body = t.replace(/^\d+\.\s*/, '');
                return (
                  <div key={li} style={{ display:'flex', gap:7, alignItems:'flex-start' }}>
                    <span style={{ color:'#f97316', fontSize:11, fontWeight:800, flexShrink:0, minWidth:14 }}>{num}.</span>
                    <span style={{ color:'rgba(255,255,255,0.85)', fontSize:12, lineHeight:1.55 }}>{body}</span>
                  </div>
                );
              }
              if (t.endsWith(':') && t.length < 50) {
                return <div key={li} style={{ color:'#fff', fontWeight:800, fontSize:12, marginTop: li > 0 ? 3 : 0 }}>{t}</div>;
              }
              return <div key={li} style={{ color:'rgba(255,255,255,0.85)', fontSize:12, lineHeight:1.55 }}>{t}</div>;
            })}
          </div>
        );
      })}
    </div>
  );
}

const WIDGET_CSS = `
  @keyframes widgetIn { from{transform:scale(0.88) translateY(16px);opacity:0} to{transform:scale(1) translateY(0);opacity:1} }
  @keyframes wEndIn   { from{transform:scale(0.92) translateY(8px);opacity:0} to{transform:scale(1) translateY(0);opacity:1} }
  @keyframes blink    { 0%,80%,100%{opacity:0} 40%{opacity:1} }
  @keyframes badgePop { from{transform:scale(0)} to{transform:scale(1)} }
  @keyframes pulse    { 0%,100%{box-shadow:0 0 0 0 rgba(249,115,22,0.55)} 50%{box-shadow:0 0 0 8px rgba(249,115,22,0)} }
  @keyframes micPulse { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.6); transform:scale(1)} 50%{box-shadow:0 0 0 10px rgba(239,68,68,0); transform:scale(1.06)} }

  .w-dot { animation:blink 1.2s infinite; display:inline-block; width:5px; height:5px; border-radius:50%; background:#94a3b8; margin:0 1.5px; }
  .w-dot:nth-child(2){animation-delay:.2s} .w-dot:nth-child(3){animation-delay:.4s}

  .w-chip {
    border-radius:10px; padding:6px 11px; font-size:11.5px; font-weight:700;
    cursor:pointer; font-family:inherit; white-space:nowrap;
    background:rgba(255,255,255,0.07); color:rgba(255,255,255,0.72);
    border:1px solid rgba(255,255,255,0.12); transition:all .15s;
    text-align:left;
  }
  .w-chip:hover { background:rgba(249,115,22,0.16); color:#fb923c; border-color:rgba(249,115,22,0.35); transform:translateY(-1px); }

  .w-nav-btn {
    display:inline-flex; align-items:center; gap:5px;
    border-radius:9px; padding:6px 12px; font-size:11.5px; font-weight:800;
    cursor:pointer; font-family:inherit;
    background:linear-gradient(135deg,rgba(249,115,22,0.2),rgba(225,29,72,0.14));
    color:#fb923c; border:1px solid rgba(249,115,22,0.4); transition:all .15s;
  }
  .w-nav-btn:hover { background:linear-gradient(135deg,rgba(249,115,22,0.3),rgba(225,29,72,0.22)); transform:translateY(-1px); }

  .w-input {
    flex:1; background:rgba(255,255,255,0.07); border:1.5px solid rgba(255,255,255,0.14);
    border-radius:11px; padding:9px 13px; font-size:12.5px; color:#fff; font-family:inherit; outline:none;
    transition:border-color .15s, background .15s;
  }
  .w-input::placeholder{color:rgba(255,255,255,0.3)} .w-input:focus{border-color:#f97316; background:rgba(255,255,255,0.1)}
  ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1); border-radius:2px}

  .w-msg-wrapper:hover .w-msg-actions { opacity: 1; }
  .w-msg-actions {
    display: flex;
    gap: 4px;
    margin-top: 4px;
    opacity: 0;
    transition: opacity 0.18s;
  }
  .w-action-btn {
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 6px;
    padding: 2px 7px;
    font-size: 10px;
    font-weight: 700;
    cursor: pointer;
    color: rgba(255,255,255,0.5);
    font-family: inherit;
    transition: all 0.15s;
  }
  .w-action-btn:hover { background: rgba(249,115,22,0.15); border-color: rgba(249,115,22,0.3); color: #f97316; }
  .w-action-btn.rated-up { background: rgba(16,185,129,0.15); border-color: rgba(16,185,129,0.3); color: #34d399; }
  .w-action-btn.rated-down { background: rgba(225,29,72,0.15); border-color: rgba(225,29,72,0.3); color: #f87171; }
  .w-action-btn.copied { background: rgba(16,185,129,0.15); border-color: rgba(16,185,129,0.3); color: #34d399; }
`;

const ROLE_BADGE = {
  ADMIN:  { bg:'rgba(225,29,72,0.2)',   color:'#f43f5e', label:'Admin'  },
  MEMBER: { bg:'rgba(16,185,129,0.18)', color:'#34d399', label:'Member' },
  GUEST:  { bg:'rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.45)', label:'Guest' },
};

export default function Chatbot() {
  const { user }     = useAuth();
  const navigate     = useNavigate();
  const location     = useLocation();

  const role         = user?.role || 'GUEST';
  const quick        = QUICK_BY_ROLE[role] || QUICK_BY_ROLE.GUEST;
  const rb           = ROLE_BADGE[role] || ROLE_BADGE.GUEST;

  // All hooks MUST be declared before any conditional return
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState(() => [{ from:'bot', text: getGreeting(user) }]);
  const [input, setInput]       = useState('');
  const [thinking, setThinking] = useState(false);
  const [ended, setEnded]       = useState(false);
  const [unread, setUnread]     = useState(0);
  const [hasReplied, setHasReplied] = useState(false);
  const [ratings, setRatings]   = useState({});
  const [copied, setCopied]     = useState(null);
  const [listening, setListening] = useState(false);
  const recognitionRef          = useRef(null);
  const msgsRef                 = useRef(null);

  // Reset chat when user changes (login/logout)
  useEffect(() => {
    setMessages([{ from:'bot', text: getGreeting(user) }]);
    setEnded(false); setInput(''); setHasReplied(false); setUnread(0);
  }, [user?.id]);

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [messages, thinking]);

  // Increment unread badge only when widget is closed and a new bot reply arrives
  useEffect(() => {
    if (!open && messages.length > 1 && messages[messages.length - 1]?.from === 'bot') {
      setUnread(u => u + 1);
    }
  }, [messages.length, open]);

  function openWidget() { setOpen(true); setUnread(0); }
  function newChat()    { setMessages([{ from:'bot', text: getGreeting(user) }]); setEnded(false); setInput(''); setHasReplied(false); }

  function rateMessage(idx, vote) {
    setRatings(prev => ({ ...prev, [idx]: prev[idx] === vote ? null : vote }));
  }

  async function copyMessage(idx, text) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(idx);
      setTimeout(() => setCopied(c => c === idx ? null : c), 2000);
    } catch (_) {}
  }

  function toggleVoiceInput() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-PH';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onstart = () => setListening(true);
      recognition.onend = () => setListening(false);
      recognition.onerror = () => setListening(false);
      recognition.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        if (transcript) {
          setInput(prev => (prev ? `${prev} ${transcript}` : transcript));
        }
      };
      recognitionRef.current = recognition;
      recognition.start();
    } catch (_) {
      setListening(false);
    }
  }

  async function send(text) {
    const t = (text || input).trim();
    if (!t || thinking) return;
    setInput('');
    setMessages(prev => [...prev, { from:'user', text:t }]);
    setThinking(true);
    try {
      const res = await api.chatbot.send(t);
      setHasReplied(true);
      setMessages(prev => [...prev, {
        from:'bot',
        text: res.reply,
        followups: res.followups || [],
        navigate_to: res.navigate_to || null,
        matched: res.matched,
        suggestions: res.suggestions || [],
      }]);
    } catch {
      setHasReplied(true);
      setMessages(prev => [...prev, { from:'bot', text: 'Sorry, I could not reach the DASIG knowledge base right now.', followups:[] }]);
    } finally {
      setThinking(false);
    }
  }

  const initials = user ? (user.name || 'U').split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase() : null;

  // Hide widget on the full chatbot page — AFTER all hooks
  if (location.pathname === '/chatbot') return null;

  return (
    <>
      <style>{WIDGET_CSS}</style>

      {/* ── Chat window ── */}
      {open && (
        <div style={{
          position:'fixed', bottom:88, right:20, width:380,
          borderRadius:22, overflow:'hidden',
          background:'linear-gradient(180deg,#0b1120,#040a1a)',
          boxShadow:'0 24px 72px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.07)',
          zIndex:9998, display:'flex', flexDirection:'column',
          animation:'widgetIn .24s cubic-bezier(.34,1.3,.64,1)',
          maxHeight:'calc(100vh - 110px)',
        }}>

          {/* ── Header ── */}
          <div style={{
            background:'linear-gradient(135deg,#001233,#0f2d6b 55%,#1e40af)',
            padding:'13px 15px', display:'flex', alignItems:'center', gap:10,
            position:'relative', overflow:'hidden', flexShrink:0,
          }}>
            <div style={{ position:'absolute', right:-14, top:-14, width:80, height:80, borderRadius:'50%', background:'radial-gradient(rgba(249,115,22,0.25),transparent)', pointerEvents:'none' }} />
            <div style={{ position:'absolute', left:'30%', bottom:-20, width:60, height:60, borderRadius:'50%', background:'radial-gradient(rgba(99,102,241,0.2),transparent)', pointerEvents:'none' }} />

            {/* Haribon avatar */}
            <div style={{ width:38, height:38, borderRadius:11, overflow:'hidden', flexShrink:0, border:'2px solid rgba(255,255,255,0.2)', boxShadow:'0 2px 10px rgba(0,0,0,0.4)' }}>
              <HaribonFace size={38} />
            </div>

            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                <span style={{ color:'#fff', fontWeight:900, fontSize:13.5 }}>Haribon</span>
                <span style={{ color:'#38bdf8', fontSize:11, fontWeight:700 }}>Trilingual AI</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:7, marginTop:2 }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:'#4ade80', display:'inline-block', boxShadow:'0 0 5px rgba(74,222,128,0.8)' }} />
                <span style={{ color:'rgba(255,255,255,0.7)', fontSize:10.5 }}>English · Bisaya · Tagalog</span>
              </div>
            </div>

            {/* User role badge */}
            {user && (
              <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
                <div style={{ width:26, height:26, borderRadius:7, overflow:'hidden', flexShrink:0 }}>
                  {user.avatar_url
                    ? <img src={user.avatar_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                    : <div style={{ width:'100%', height:'100%', background:'linear-gradient(135deg,#f97316,#e11d48)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:900, color:'#fff' }}>{initials}</div>
                  }
                </div>
                <span style={{ background: rb.bg, color: rb.color, border:`1px solid ${rb.color}30`, borderRadius:6, padding:'2px 8px', fontSize:10, fontWeight:800 }}>
                  {rb.label}
                </span>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display:'flex', gap:5, flexShrink:0 }}>
              <button onClick={() => {
                sessionStorage.setItem('haribon_resume', JSON.stringify(messages));
                setOpen(false);
                navigate('/chatbot');
              }} style={{
                background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)',
                borderRadius:7, padding:'5px 11px', fontSize:11, fontWeight:700,
                color:'#fff', cursor:'pointer', fontFamily:'inherit',
                transition:'all .13s',
              }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.22)'}
              onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.12)'}
              >Full ↗</button>
              {ended
                ? <button onClick={newChat} style={{ background:'rgba(249,115,22,0.2)', border:'1px solid rgba(249,115,22,0.4)', borderRadius:7, padding:'4px 9px', fontSize:10.5, fontWeight:700, color:'#f97316', cursor:'pointer', fontFamily:'inherit' }}>New</button>
                : <button onClick={() => setEnded(true)} style={{ background:'rgba(225,29,72,0.15)', border:'1px solid rgba(225,29,72,0.3)', borderRadius:7, padding:'4px 9px', fontSize:10.5, fontWeight:700, color:'#f43f5e', cursor:'pointer', fontFamily:'inherit' }}>End</button>
              }
            </div>
          </div>

          {/* ── Messages area ── */}
          <div ref={msgsRef} style={{ flex:1, overflowY:'auto', padding: ended ? 0 : '14px 14px 8px', display:'flex', flexDirection:'column', gap: ended ? 0 : 10, minHeight:260, maxHeight:340 }}>
            {ended ? (
              <div style={{ height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, padding:'20px 16px', animation:'wEndIn .28s ease both' }}>
                <div style={{ fontSize:40 }}>🦅</div>
                <div style={{ color:'#fff', fontWeight:900, fontSize:14 }}>Chat ended</div>
                <div style={{ color:'rgba(255,255,255,0.42)', fontSize:12, textAlign:'center', lineHeight:1.6 }}>
                  Thanks for chatting with Haribon!<br />Your questions help improve DASIG services.
                </div>
                <button onClick={newChat} style={{ marginTop:6, padding:'9px 22px', borderRadius:12, background:'linear-gradient(90deg,#f97316,#e11d48)', border:'none', color:'#fff', fontSize:13, fontWeight:800, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 14px rgba(249,115,22,0.35)' }}>
                  Start New Chat →
                </button>
              </div>
            ) : (
              <>
                {messages.map((msg, i) => (
                  <div key={i} className="w-msg-wrapper" style={{ display:'flex', flexDirection:'column', alignItems: msg.from === 'user' ? 'flex-end' : 'flex-start' }}>
                    {/* Bot name */}
                    {msg.from === 'bot' && (
                      <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:4 }}>
                        <div style={{ width:18, height:18, borderRadius:5, overflow:'hidden', flexShrink:0 }}><HaribonFace size={18} /></div>
                        <span style={{ fontSize:10, color:'rgba(255,255,255,0.38)', fontWeight:700 }}>Haribon</span>
                      </div>
                    )}
                    {/* Bubble */}
                    <div style={{
                      maxWidth:'88%',
                      padding: msg.from === 'bot' ? '10px 13px' : '8px 12px',
                      borderRadius:14, fontSize:12,
                      ...(msg.from === 'bot'
                        ? { background:'rgba(20,30,52,0.96)', borderBottomLeftRadius:4, border:'1px solid rgba(255,255,255,0.08)', boxShadow:'0 3px 12px rgba(0,0,0,0.25)' }
                        : { background:'linear-gradient(135deg,#1e3a8a,#1a56db)', color:'#fff', borderBottomRightRadius:4, boxShadow:'0 3px 12px rgba(30,58,138,0.4)' }
                      ),
                    }}>
                      {msg.from === 'bot' ? <WBotText text={msg.text} /> : <span style={{ lineHeight:1.55 }}>{msg.text}</span>}
                    </div>

                    {/* Rating & Copy actions for bot messages */}
                    {msg.from === 'bot' && i > 0 && (
                      <div className="w-msg-actions">
                        <button
                          className={`w-action-btn${ratings[i] === 'up' ? ' rated-up' : ''}`}
                          onClick={() => rateMessage(i, 'up')}
                        >
                          👍{ratings[i] === 'up' ? ' Helpful' : ''}
                        </button>
                        <button
                          className={`w-action-btn${ratings[i] === 'down' ? ' rated-down' : ''}`}
                          onClick={() => rateMessage(i, 'down')}
                        >
                          👎
                        </button>
                        <button
                          className={`w-action-btn${copied === i ? ' copied' : ''}`}
                          onClick={() => copyMessage(i, msg.text)}
                        >
                          {copied === i ? '✓ Copied' : '⧉'}
                        </button>
                      </div>
                    )}

                    {/* Related suggestions when no intent match found */}
                    {i === messages.length - 1 && msg.from === 'bot' && !ended && msg.matched === false && msg.suggestions?.length > 0 && (
                      <div style={{ marginTop: 8, padding: '8px 10px', background: 'rgba(249,115,22,0.07)', border: '1px solid rgba(249,115,22,0.18)', borderRadius: 10, maxWidth: '92%' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(249,115,22,0.8)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.4px' }}>💡 Did you mean?</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {msg.suggestions.map((s, si) => (
                            <button key={si} className="w-chip" onClick={() => send(s.sample)} style={{ fontSize: 11 }}>
                              {s.sample}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Navigate CTA + follow-up chips — last bot message only */}
                    {msg.from === 'bot' && i === messages.length - 1 && !thinking && (
                      <div style={{ marginTop:7, maxWidth:'92%', display:'flex', flexDirection:'column', gap:7 }}>
                        {msg.navigate_to && (
                          <button className="w-nav-btn" onClick={() => { navigate(msg.navigate_to); setOpen(false); }}>
                            ↗ Open page
                          </button>
                        )}
                        {msg.followups?.length > 0 && (
                          <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                            {msg.followups.slice(0, 3).map(f => (
                              <button key={f} className="w-chip" onClick={() => send(f)} disabled={thinking}>{f}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {thinking && (
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-start' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:4 }}>
                      <div style={{ width:18, height:18, borderRadius:5, overflow:'hidden', flexShrink:0 }}><HaribonFace size={18} /></div>
                      <span style={{ fontSize:10, color:'rgba(255,255,255,0.38)', fontWeight:700 }}>Haribon is thinking…</span>
                    </div>
                    <div style={{ background:'rgba(20,30,52,0.96)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, borderBottomLeftRadius:4, padding:'10px 14px', display:'flex', alignItems:'center' }}>
                      <span className="w-dot" /><span className="w-dot" /><span className="w-dot" />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Quick chips (until first reply) ── */}
          {!ended && !hasReplied && (
            <div style={{ padding:'6px 12px 8px', display:'flex', gap:5, flexWrap:'wrap', borderTop:'1px solid rgba(255,255,255,0.05)', maxHeight: 110, overflowY: 'auto' }}>
              {quick.map(({ label, q }) => (
                <button key={label} className="w-chip" onClick={() => send(q)} disabled={thinking}>{label}</button>
              ))}
            </div>
          )}

          {/* ── Input ── */}
          {!ended && (
            <div style={{ padding:'8px 12px 14px', borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', gap:7, flexShrink:0, alignItems: 'center' }}>
              <input
                className="w-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !thinking && send()}
                placeholder={user ? `Ask Haribon, ${(user.name || 'there').split(' ')[0]}…` : 'Ask Haribon…'}
                disabled={thinking}
              />
              <button
                type="button"
                onClick={toggleVoiceInput}
                title={listening ? 'Listening... click to stop' : 'Speak (Voice input)'}
                style={{
                  background: listening ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'rgba(255,255,255,0.08)',
                  color: listening ? '#fff' : 'rgba(255,255,255,0.7)',
                  border: `1px solid ${listening ? '#ef4444' : 'rgba(255,255,255,0.12)'}`,
                  borderRadius: 11, padding: '8px 10px',
                  fontSize: 14, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  animation: listening ? 'micPulse 1.4s infinite' : 'none',
                  transition: 'all 0.15s',
                  flexShrink: 0,
                }}
              >
                {listening ? '🔴' : '🎙️'}
              </button>
              <button onClick={() => send()} disabled={thinking || !input.trim()} style={{
                background: thinking || !input.trim() ? 'rgba(255,255,255,0.07)' : 'linear-gradient(90deg,#f97316,#e11d48)',
                color: thinking || !input.trim() ? 'rgba(255,255,255,0.28)' : '#fff',
                border:'none', borderRadius:11, padding:'9px 14px',
                fontSize:14, fontWeight:900, cursor: thinking || !input.trim() ? 'not-allowed' : 'pointer',
                fontFamily:'inherit', transition:'all .15s',
                boxShadow: !thinking && input.trim() ? '0 4px 12px rgba(249,115,22,0.35)' : 'none',
                flexShrink: 0,
              }}>→</button>
            </div>
          )}
        </div>
      )}

      {/* ── Meta AI-style Floating Toggle Button ── */}
      <button
        onClick={() => open ? setOpen(false) : openWidget()}
        title="Chat with Haribon AI"
        style={{
          position:'fixed', bottom:20, right:20,
          width:58, height:58, borderRadius:'50%',
          border:'none', cursor:'pointer', zIndex:9999,
          overflow:'visible', padding:0, background:'transparent',
          transition:'transform .22s cubic-bezier(.34,1.56,.64,1)',
          boxShadow: open ? 'none' : '0 0 0 2px rgba(249,115,22,0.4), 0 8px 32px rgba(225,29,72,0.45), 0 0 24px rgba(59,130,246,0.3)',
        }}
        onMouseEnter={e => e.currentTarget.style.transform='scale(1.12)'}
        onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
      >
        {/* Glowing Meta AI Pulse Halo Ring */}
        {!open && (
          <div style={{
            position:'absolute', inset:-4, borderRadius:'50%',
            background:'linear-gradient(135deg,#f97316,#e11d48,#3b82f6)',
            zIndex:0, opacity:0.75, filter:'blur(4px)',
            animation:'wDotBlink 2.5s ease-in-out infinite alternate',
          }} />
        )}
        <div style={{ position:'relative', zIndex:1, width:'100%', height:'100%', borderRadius:'50%', overflow:'hidden' }}>
          {open
            ? <div style={{ width:'100%', height:'100%', background:'linear-gradient(135deg,#0f2d6b,#1e40af)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:20, fontWeight:700 }}>✕</div>
            : <HaribonFace size={58} style={{ borderRadius:'50%' }} />
          }
        </div>
        {/* Unread badge */}
        {!open && unread > 0 && (
          <div style={{
            position:'absolute', top:-2, right:-2,
            width:20, height:20, borderRadius:'50%',
            background:'linear-gradient(135deg,#e11d48,#f97316)',
            border:'2px solid #0d1424', zIndex:2,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:10, fontWeight:900, color:'#fff',
            animation:'badgePop .3s cubic-bezier(.34,1.56,.64,1)',
            boxShadow:'0 2px 8px rgba(225,29,72,0.6)',
          }}>
            {unread > 9 ? '9+' : unread}
          </div>
        )}
      </button>
    </>
  );
}
