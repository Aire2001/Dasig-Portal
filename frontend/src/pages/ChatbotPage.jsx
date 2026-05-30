import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import ParticleBackground from '../components/ParticleBackground';
import HaribonFace from '../components/HaribonFace';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

// Renders bot reply text with formatted bullets, numbered lists, and section headers
function BotText({ text }) {
  const blocks = text.split('\n\n').filter(Boolean);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {blocks.map((block, bi) => {
        const lines = block.split('\n').filter(l => l.trim());
        return (
          <div key={bi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {lines.map((line, li) => {
              const t = line.trim();
              // Bullet point
              if (t.startsWith('•')) {
                return (
                  <div key={li} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                    <span style={{ color: '#f97316', flexShrink: 0, fontSize: 12, marginTop: 3 }}>▸</span>
                    <span style={{ color: 'rgba(255,255,255,0.88)', lineHeight: 1.6 }}>{t.slice(1).trim()}</span>
                  </div>
                );
              }
              // Numbered list
              if (/^\d+\./.test(t)) {
                const num = t.match(/^(\d+)\./)[1];
                const content = t.replace(/^\d+\.\s*/, '');
                return (
                  <div key={li} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                    <span style={{ color: '#f97316', flexShrink: 0, fontWeight: 800, minWidth: 18, lineHeight: 1.6 }}>{num}.</span>
                    <span style={{ color: 'rgba(255,255,255,0.88)', lineHeight: 1.6 }}>{content}</span>
                  </div>
                );
              }
              // Section header (short line ending with colon, or starts with emoji)
              if ((t.endsWith(':') && t.length < 60) || /^[\u{1F300}-\u{1FAFF}]/u.test(t)) {
                return (
                  <div key={li} style={{ fontWeight: 800, color: '#fff', fontSize: 13, marginTop: li > 0 ? 4 : 0 }}>
                    {t}
                  </div>
                );
              }
              return (
                <div key={li} style={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.65 }}>{t}</div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// Role-based quick chips
const QUICK_CHIPS_BY_ROLE = {
  GUEST: [
    { label: '📅 Upcoming Events',        q: 'What events are coming up?' },
    { label: '🎓 Training Programs',      q: 'What training programs are available?' },
    { label: '👥 How to become a member', q: 'How do I become a DASIG member?' },
    { label: '💰 Funding Opportunities',  q: 'What funding opportunities are available?' },
    { label: '📰 News & Announcements',   q: 'What are the latest news and announcements?' },
    { label: '🏛 Member Institutions',    q: 'Who are the DASIG member institutions?' },
    { label: '🦅 About Haribon',          q: 'Who are you and what can you do?' },
    { label: '🔐 How to register',        q: 'How do I create a DASIG account?' },
  ],
  MEMBER: [
    { label: '📅 Upcoming Events',        q: 'What events are coming up?' },
    { label: '🎓 Enroll in Training',     q: 'What training programs can I enroll in?' },
    { label: '💰 Open Funding',           q: 'What funding opportunities are open?' },
    { label: '🤝 Partnerships',           q: 'Tell me about DASIG partnerships' },
    { label: '📋 View Policies',          q: 'What governance policies are available?' },
    { label: '📰 Latest News',            q: 'What are the latest news and announcements?' },
    { label: '📊 My Membership Status',   q: 'What is my membership status?' },
    { label: '🏛 Member Institutions',    q: 'Who are the DASIG member institutions?' },
  ],
  ADMIN: [
    { label: '📅 All Events',             q: 'What events are coming up?' },
    { label: '🎓 Training Programs',      q: 'What training programs are available?' },
    { label: '👥 Member Management',      q: 'What can the admin panel manage?' },
    { label: '🤖 Chatbot Accuracy',       q: 'How is the chatbot performing?' },
    { label: '💰 Funding Opportunities',  q: 'What funding opportunities exist?' },
    { label: '📋 Governance Policies',    q: 'What governance policies are available?' },
    { label: '🤝 Partnerships',           q: 'Tell me about DASIG partnerships' },
    { label: '🦅 What can Haribon do',    q: 'What topics can Haribon answer?' },
  ],
};

// Role-based greeting
function makeInitMsg(user) {
  if (!user) {
    return "Hi! I'm Haribon 🦅 — the DASIG AI Assistant.\n\nI can answer questions about consortium events, training programs, membership, policies, funding opportunities, partnerships, and more.\n\nWhat would you like to know?";
  }
  const first = (user.name || '').split(' ')[0];
  if (user.role === 'ADMIN') {
    return `Hello, ${first}! I'm Haribon 🦅 — the DASIG AI Assistant.\n\nAs an administrator, I can help with portal information, event details, training programs, member management guidance, and system queries.\n\nWhat do you need?`;
  }
  if (user.role === 'MEMBER') {
    return `Welcome back, ${first}! 🦅 I'm Haribon — your DASIG AI Assistant.\n\nYou have full member access. Ask me about upcoming events, training enrollments, funding opportunities, partnerships, or governance policies.\n\nHow can I help you today?`;
  }
  return `Hi, ${first}! I'm Haribon 🦅 — the DASIG AI Assistant.\n\nI can help you learn about DASIG events, training programs, and how to become a member.\n\nWhat would you like to know?`;
}

const CHAT_CSS = `
  @keyframes msgIn {
    from { transform: translateY(10px) scale(0.97); opacity: 0; }
    to   { transform: translateY(0) scale(1); opacity: 1; }
  }
  @keyframes endedIn {
    from { transform: scale(0.92) translateY(12px); opacity: 0; }
    to   { transform: scale(1) translateY(0); opacity: 1; }
  }
  @keyframes blink {
    0%,80%,100% { opacity: 0; }
    40%          { opacity: 1; }
  }
  @keyframes pulseGlow {
    0%,100% { box-shadow: 0 0 0 0 rgba(249,115,22,0.25); }
    50%     { box-shadow: 0 0 0 10px rgba(249,115,22,0); }
  }
  .chat-msg { animation: msgIn 0.22s ease both; }
  .typing-dot { animation: blink 1.2s infinite; display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #94a3b8; }
  .typing-dot:nth-child(2) { animation-delay: 0.2s; }
  .typing-dot:nth-child(3) { animation-delay: 0.4s; }
  .chip-btn {
    border-radius: 10px; padding: 8px 14px; font-size: 12.5px; font-weight: 600;
    cursor: pointer; font-family: inherit; white-space: nowrap;
    background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.72);
    border: 1px solid rgba(255,255,255,0.12);
    transition: all 0.16s; text-align: left;
  }
  .chip-btn:hover {
    background: rgba(249,115,22,0.15); color: #fb923c;
    border-color: rgba(249,115,22,0.35);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(249,115,22,0.15);
  }
  .chip-btn:active { transform: translateY(0); }
  .chat-input {
    flex: 1; background: rgba(255,255,255,0.07); border: 1.5px solid rgba(255,255,255,0.15);
    border-radius: 14px; padding: 13px 18px; font-size: 14px;
    color: #fff; font-family: inherit; outline: none; resize: none;
    transition: border-color 0.15s, background 0.15s;
    line-height: 1.5;
  }
  .chat-input::placeholder { color: rgba(255,255,255,0.3); }
  .chat-input:focus { border-color: #f97316; background: rgba(255,255,255,0.1); }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: rgba(255,255,255,0.03); }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 3px; }
`;

function formatTime(d) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const ROLE_BADGE = {
  ADMIN:  { bg:'rgba(225,29,72,0.18)',   color:'#f43f5e', label:'Administrator' },
  MEMBER: { bg:'rgba(16,185,129,0.15)',  color:'#34d399', label:'Member'        },
  GUEST:  { bg:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.5)', label:'Guest' },
};

export default function ChatbotPage() {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const role      = user?.role || 'GUEST';
  const quickChips = QUICK_CHIPS_BY_ROLE[role] || QUICK_CHIPS_BY_ROLE.GUEST;
  const rb        = ROLE_BADGE[role] || ROLE_BADGE.GUEST;

  const initMsg = { from:'bot', text: makeInitMsg(user), time: new Date() };
  const [messages, setMessages] = useState([initMsg]);

  // Reset chat when user changes (login/logout)
  useEffect(() => {
    setMessages([{ from:'bot', text: makeInitMsg(user), time: new Date() }]);
    setTotalAsked(0); setTotalMatched(0); setMatchRate(null);
    setEnded(false); setHasReplied(false); setInput('');
  }, [user?.id]);
  const [input, setInput]       = useState('');
  const [thinking, setThinking] = useState(false);
  const [matchRate, setMatchRate] = useState(null);
  const [totalAsked, setTotalAsked] = useState(0);
  const [totalMatched, setTotalMatched] = useState(0);
  const [ended, setEnded] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [hasReplied, setHasReplied] = useState(false);
  const msgsEnd = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    msgsEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  async function send(text) {
    const trimmed = (text || input).trim();
    if (!trimmed || thinking) return;
    setInput('');
    const userMsg = { from: 'user', text: trimmed, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setThinking(true);

    try {
      const res = await api.chatbot.send(trimmed);
      const newTotal = totalAsked + 1;
      const newMatched = totalMatched + (res.matched ? 1 : 0);
      setTotalAsked(newTotal);
      setTotalMatched(newMatched);
      setMatchRate(Math.round((newMatched / newTotal) * 100));
      setHasReplied(true);
      setMessages(prev => [...prev, {
        from: 'bot',
        text: res.reply,
        intent: res.intent,
        matched: res.matched,
        followups: res.followups || [],
        navigate_to: res.navigate_to || null,
        time: new Date(),
      }]);
    } catch {
      setHasReplied(true);
      setMessages(prev => [...prev, {
        from: 'bot',
        text: 'I could not reach the DASIG knowledge base right now. Please check your connection or try again in a moment.',
        matched: false,
        followups: [],
        time: new Date(),
      }]);
    } finally {
      setThinking(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  function endChat() {
    setShowEndConfirm(false);
    setEnded(true);
  }

  function newChat() {
    setMessages([{ from:'bot', text: makeInitMsg(user), time: new Date() }]);
    setTotalAsked(0);
    setTotalMatched(0);
    setMatchRate(null);
    setEnded(false);
    setHasReplied(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function handleInputChange(e) {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  }

  return (
    <div style={{ background: 'linear-gradient(180deg,#000d30 0%,#020817 300px,#0f172a 100%)', minHeight: '100vh', position: 'relative' }}>
      <ParticleBackground density={40} />
      <style>{CHAT_CSS}</style>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <PageHeader eyebrow="DASIG AI Assistant" title="Ask Haribon" />

        <section style={{ padding: '24px 24px 80px' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>

            {/* Status bar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 14, padding: '12px 18px', flexWrap: 'wrap',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, overflow: 'hidden', flexShrink: 0, border: '2px solid rgba(249,115,22,0.3)' }}>
                  <HaribonFace size={40} />
                </div>
                <div>
                  <div style={{ color: '#fff', fontWeight: 900, fontSize: 14 }}>Haribon · DASIG NLP Engine</div>
                  <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block', flexShrink: 0, boxShadow:'0 0 5px rgba(74,222,128,0.8)' }} />
                    Online · Scoped to DASIG knowledge base
                  </div>
                </div>
              </div>
              {/* User badge */}
              {user && (
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:32, height:32, borderRadius:9, overflow:'hidden', flexShrink:0 }}>
                    {user.avatar_url
                      ? <img src={user.avatar_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                      : <div style={{ width:'100%', height:'100%', background:'linear-gradient(135deg,#f97316,#e11d48)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900, color:'#fff' }}>
                          {(user.name||'U').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()}
                        </div>
                    }
                  </div>
                  <div>
                    <div style={{ color:'rgba(255,255,255,0.75)', fontSize:12.5, fontWeight:700 }}>{user.name}</div>
                    <span style={{ background: rb.bg, color: rb.color, border:`1px solid ${rb.color}30`, borderRadius:5, padding:'1px 8px', fontSize:10, fontWeight:800 }}>{rb.label}</span>
                  </div>
                </div>
              )}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
                {matchRate !== null && (
                  <div style={{
                    background: matchRate >= 80
                      ? 'rgba(16,185,129,0.15)' : matchRate >= 60
                      ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                    border: `1px solid ${matchRate >= 80 ? 'rgba(16,185,129,0.3)' : matchRate >= 60 ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    borderRadius: 8, padding: '5px 12px', fontSize: 11.5, fontWeight: 800,
                    color: matchRate >= 80 ? '#34d399' : matchRate >= 60 ? '#fbbf24' : '#f87171',
                  }}>
                    🎯 {matchRate}% intent accuracy
                  </div>
                )}
                <div style={{
                  background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)',
                  borderRadius: 8, padding: '5px 12px', fontSize: 11.5, fontWeight: 700, color: '#f97316',
                }}>
                  {totalAsked} queries
                </div>
                {ended ? (
                  <button onClick={newChat} style={{
                    background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.3)',
                    borderRadius: 8, padding: '5px 12px', fontSize: 11.5, fontWeight: 700,
                    color: '#f97316', cursor: 'pointer', fontFamily: 'inherit',
                  }}>New Chat</button>
                ) : (
                  <button onClick={() => setShowEndConfirm(true)} style={{
                    background: 'rgba(225,29,72,0.08)', border: '1px solid rgba(225,29,72,0.22)',
                    borderRadius: 8, padding: '5px 12px', fontSize: 11.5, fontWeight: 700,
                    color: '#f43f5e', cursor: 'pointer', fontFamily: 'inherit',
                  }}>End Chat</button>
                )}
              </div>
            </div>

            {/* End-chat confirmation modal */}
            {showEndConfirm && (
              <div style={{
                position: 'fixed', inset: 0, zIndex: 200,
                background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
              }}>
                <div style={{
                  background: 'linear-gradient(180deg,#0f172a,#020817)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 20, padding: '32px 28px', maxWidth: 360, width: '100%',
                  textAlign: 'center', animation: 'msgIn 0.2s ease both',
                }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>👋</div>
                  <div style={{ color: '#fff', fontWeight: 900, fontSize: 18, marginBottom: 8 }}>End this session?</div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.65, marginBottom: 24 }}>
                    Your chat history will be cleared. You can start a new conversation anytime.
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setShowEndConfirm(false)} style={{
                      flex: 1, padding: '11px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                      color: 'rgba(255,255,255,0.6)', fontSize: 13.5, fontWeight: 700,
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}>Cancel</button>
                    <button onClick={endChat} style={{
                      flex: 1, padding: '11px', borderRadius: 10,
                      background: 'linear-gradient(90deg,#e11d48,#be123c)',
                      border: 'none', color: '#fff', fontSize: 13.5, fontWeight: 700,
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}>Yes, End Chat</button>
                  </div>
                </div>
              </div>
            )}

            {/* Chat window */}
            <div style={{
              background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 20, overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            }}>
              {/* Messages area */}
              <div style={{ height: 460, overflowY: 'auto', padding: ended ? 0 : '24px 24px 16px', display: 'flex', flexDirection: 'column', gap: ended ? 0 : 14 }}>
                {ended ? (
                  <div style={{
                    height: '100%', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 12, padding: '24px',
                    animation: 'endedIn 0.35s ease both',
                  }}>
                    <div style={{ fontSize: 54, lineHeight: 1 }}>👋</div>
                    <div style={{ color: '#fff', fontWeight: 900, fontSize: 18 }}>Chat Session Ended</div>
                    <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, textAlign: 'center', lineHeight: 1.65, maxWidth: 280 }}>
                      You asked <strong style={{ color: 'rgba(255,255,255,0.7)' }}>{totalAsked}</strong> {totalAsked === 1 ? 'question' : 'questions'} this session
                      {matchRate !== null && <>, with <strong style={{ color: 'rgba(255,255,255,0.7)' }}>{matchRate}%</strong> intent accuracy</>}.
                    </div>
                    <button onClick={newChat} style={{
                      marginTop: 8, padding: '12px 28px', borderRadius: 12,
                      background: 'linear-gradient(90deg,#f97316,#e11d48)',
                      border: 'none', color: '#fff', fontSize: 14, fontWeight: 800,
                      cursor: 'pointer', fontFamily: 'inherit',
                      boxShadow: '0 4px 16px rgba(249,115,22,0.4)',
                    }}>Start New Conversation →</button>
                  </div>
                ) : (
                  <>
                {messages.map((msg, i) => (
                  <div key={i} className="chat-msg" style={{ display: 'flex', flexDirection: 'column', alignItems: msg.from === 'user' ? 'flex-end' : 'flex-start' }}>

                    {/* Bot avatar row */}
                    {msg.from === 'bot' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                        <div style={{ width: 26, height: 26, borderRadius: 8, overflow: 'hidden', flexShrink: 0, border: '1.5px solid rgba(249,115,22,0.3)' }}>
                          <HaribonFace size={26} />
                        </div>
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: 700, letterSpacing: '0.2px' }}>Haribon</span>
                        {!msg.matched && msg.matched !== undefined && (
                          <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>no exact match</span>
                        )}
                      </div>
                    )}

                    {/* Message bubble */}
                    <div style={{
                      maxWidth: '80%', padding: msg.from === 'bot' ? '14px 18px' : '11px 16px',
                      borderRadius: 18, fontSize: 13.5,
                      ...(msg.from === 'bot' ? {
                        background: 'rgba(20,30,50,0.96)',
                        borderBottomLeftRadius: 5,
                        border: '1px solid rgba(255,255,255,0.09)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                      } : {
                        background: 'linear-gradient(135deg,#1e3a8a,#1a56db)',
                        color: '#fff', borderBottomRightRadius: 5,
                        boxShadow: '0 4px 16px rgba(30,58,138,0.4)',
                      }),
                    }}>
                      {msg.from === 'bot'
                        ? <BotText text={msg.text} />
                        : <span style={{ lineHeight: 1.55 }}>{msg.text}</span>
                      }
                    </div>

                    {/* Timestamp */}
                    {msg.time && (
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.42)', marginTop: 4, fontWeight: 500 }}>
                        {formatTime(msg.time)}
                      </div>
                    )}

                    {/* Follow-up suggestions + navigation CTA — only on last bot message */}
                    {msg.from === 'bot' && i === messages.length - 1 && !thinking && (
                      <div style={{ marginTop: 10, maxWidth: '84%', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {msg.navigate_to && (
                          <button
                            onClick={() => navigate(msg.navigate_to)}
                            style={{
                              alignSelf: 'flex-start',
                              background: 'linear-gradient(90deg,rgba(249,115,22,0.18),rgba(225,29,72,0.14))',
                              border: '1px solid rgba(249,115,22,0.4)',
                              borderRadius: 10, padding: '9px 16px',
                              color: '#fb923c', fontSize: 13, fontWeight: 800,
                              cursor: 'pointer', fontFamily: 'inherit',
                              display: 'flex', alignItems: 'center', gap: 7,
                              transition: 'all .15s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(90deg,rgba(249,115,22,0.28),rgba(225,29,72,0.22))'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(90deg,rgba(249,115,22,0.18),rgba(225,29,72,0.14))'; e.currentTarget.style.transform = 'none'; }}
                          >
                            <span>↗</span>
                            Open page
                          </button>
                        )}
                        {msg.followups?.length > 0 && (
                          <>
                            <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.48)', fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                              Suggested follow-ups
                            </div>
                            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                              {msg.followups.map(f => (
                                <button key={f} className="chip-btn" onClick={() => send(f)} disabled={thinking}>{f}</button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {thinking && (
                  <div className="chat-msg" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                      <div style={{ width: 22, height: 22, borderRadius: 6, overflow: 'hidden' }}>
                        <HaribonFace size={22} />
                      </div>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Haribon is thinking…</span>
                    </div>
                    <div style={{
                      background: 'rgba(30,41,59,0.95)', border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 16, borderBottomLeftRadius: 4, padding: '13px 18px',
                      display: 'flex', gap: 5, alignItems: 'center',
                    }}>
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                    </div>
                  </div>
                )}
                <div ref={msgsEnd} />
                  </>
                )}
              </div>

              {/* Quick chips — show until first bot reply arrives */}
              {!ended && !hasReplied && (
                <div style={{ padding: '0 24px 14px' }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Quick questions
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                    {quickChips.map(c => (
                      <button key={c.label} className="chip-btn" onClick={() => send(c.q)} disabled={thinking}>
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input row */}
              {!ended && <div style={{
                padding: '14px 20px 18px',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.02)',
                display: 'flex', gap: 10, alignItems: 'flex-end',
              }}>
                <textarea
                  ref={inputRef}
                  className="chat-input"
                  rows={1}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={onKey}
                  placeholder={user ? `Ask Haribon, ${(user.name || 'there').split(' ')[0]}…` : 'Ask Haribon about events, membership, training, policies…'}
                  disabled={thinking}
                  style={{ maxHeight: 120, overflowY: 'auto' }}
                />
                <button
                  onClick={() => send()}
                  disabled={thinking || !input.trim()}
                  style={{
                    background: thinking || !input.trim()
                      ? 'rgba(255,255,255,0.08)'
                      : 'linear-gradient(135deg,#f97316,#e11d48)',
                    color: thinking || !input.trim() ? 'rgba(255,255,255,0.3)' : '#fff',
                    border: 'none', borderRadius: 12, padding: '13px 20px',
                    fontSize: 15, fontWeight: 800, cursor: thinking || !input.trim() ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit', flexShrink: 0, transition: 'all 0.18s',
                    boxShadow: thinking || !input.trim() ? 'none' : '0 4px 16px rgba(249,115,22,0.4)',
                    animation: !thinking && input.trim() ? 'pulseGlow 2s infinite' : 'none',
                  }}
                >→</button>
              </div>}
            </div>

            {/* Info strip */}
            <div style={{
              marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10,
            }}>
              {[
                { icon: '🎯', title: '80%+ Accuracy', desc: 'NLP intent recognition scoped to DASIG knowledge' },
                { icon: '⚡', title: 'Instant Replies', desc: 'Powered by a scored keyword-matching NLP engine' },
                { icon: '🔒', title: 'DASIG-Scoped', desc: 'Only answers consortium-related queries' },
              ].map(s => (
                <div key={s.title} style={{
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 14, padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'flex-start',
                }}>
                  <span style={{ fontSize: 22 }}>{s.icon}</span>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 800, fontSize: 12.5, marginBottom: 3 }}>{s.title}</div>
                    <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11.5, lineHeight: 1.5 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>
      </div>
    </div>
  );
}
