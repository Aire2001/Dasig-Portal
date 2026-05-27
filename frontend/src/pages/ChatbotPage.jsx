import { useState, useRef, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import ParticleBackground from '../components/ParticleBackground';
import HaribonFace from '../components/HaribonFace';
import { api } from '../api';

const QUICK_CHIPS = [
  { label: '📅 Upcoming Events',        q: 'What events are coming up?' },
  { label: '🎓 Training Programs',      q: 'What training programs are available?' },
  { label: '👥 How to become a member', q: 'How do I become a DASIG member?' },
  { label: '💰 Funding Opportunities',  q: 'What funding opportunities are available?' },
  { label: '📰 News & Announcements',   q: 'What are the latest news and announcements?' },
  { label: '📋 Policies',               q: 'Where can I find the DASIG policies?' },
  { label: '🤝 Partnerships',           q: 'Tell me about DASIG partnerships' },
  { label: '🏛 Member Institutions',    q: 'Who are the DASIG member institutions?' },
  { label: '🦅 About Haribon',          q: 'Who are you and what can you do?' },
];

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
    border-radius: 20px; padding: 7px 14px; font-size: 12px; font-weight: 700;
    cursor: pointer; font-family: inherit; white-space: nowrap;
    background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.75);
    border: 1px solid rgba(255,255,255,0.14);
    transition: all 0.18s;
  }
  .chip-btn:hover {
    background: rgba(249,115,22,0.18); color: #f97316;
    border-color: rgba(249,115,22,0.4);
    transform: translateY(-2px);
  }
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

const INIT_MSG = {
  from: 'bot',
  text: "Kumusta! I'm Haribon 🦅 — your DASIG AI Assistant.\n\nI can answer questions about consortium events, training programs, membership, policies, funding opportunities, partnerships, and more.\n\nWhat would you like to know?",
  time: new Date(),
};

function formatTime(d) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState([INIT_MSG]);
  const [input, setInput]       = useState('');
  const [thinking, setThinking] = useState(false);
  const [matchRate, setMatchRate] = useState(null);
  const [totalAsked, setTotalAsked] = useState(0);
  const [totalMatched, setTotalMatched] = useState(0);
  const [ended, setEnded] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
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
      setMessages(prev => [...prev, {
        from: 'bot',
        text: res.reply,
        intent: res.intent,
        matched: res.matched,
        followups: res.followups || [],
        time: new Date(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        from: 'bot',
        text: 'I could not connect to the DASIG knowledge base right now. Please make sure the API server is running on port 4000.',
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
    setMessages([INIT_MSG]);
    setTotalAsked(0);
    setTotalMatched(0);
    setMatchRate(null);
    setEnded(false);
    setTimeout(() => inputRef.current?.focus(), 50);
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
                  <HaribonFace size={38} />
                </div>
                <div>
                  <div style={{ color: '#fff', fontWeight: 800, fontSize: 13 }}>Haribon · DASIG NLP Engine</div>
                  <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block', flexShrink: 0 }} />
                    Online · Scoped to DASIG knowledge base
                  </div>
                </div>
              </div>
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
                    {msg.from === 'bot' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                        <div style={{ width: 22, height: 22, borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
                          <HaribonFace size={22} />
                        </div>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Haribon</span>
                        {msg.intent && (
                          <span style={{
                            background: 'rgba(79,70,229,0.2)', color: '#a5b4fc',
                            border: '1px solid rgba(79,70,229,0.3)', borderRadius: 5,
                            padding: '1px 7px', fontSize: 10, fontWeight: 700,
                          }}>{msg.intent.replace(/_/g, ' ')}</span>
                        )}
                        {msg.matched === false && msg.from === 'bot' && i > 0 && (
                          <span style={{
                            background: 'rgba(245,158,11,0.15)', color: '#fbbf24',
                            border: '1px solid rgba(245,158,11,0.25)', borderRadius: 5,
                            padding: '1px 7px', fontSize: 10, fontWeight: 700,
                          }}>unmatched</span>
                        )}
                      </div>
                    )}
                    <div style={{
                      maxWidth: '78%', padding: '12px 16px', borderRadius: 16, fontSize: 13.5, lineHeight: 1.65,
                      ...(msg.from === 'bot' ? {
                        background: 'rgba(30,41,59,0.95)', color: 'rgba(255,255,255,0.85)',
                        borderBottomLeftRadius: 4, border: '1px solid rgba(255,255,255,0.08)',
                        whiteSpace: 'pre-line',
                      } : {
                        background: 'linear-gradient(135deg,#001d5c,#1a56db)',
                        color: '#fff', borderBottomRightRadius: 4,
                        boxShadow: '0 4px 16px rgba(0,29,92,0.35)',
                      }),
                    }}>{msg.text}</div>
                    {msg.time && (
                      <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>
                        {formatTime(msg.time)}
                      </div>
                    )}
                    {msg.from === 'bot' && msg.followups && msg.followups.length > 0 && i === messages.length - 1 && !thinking && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8, maxWidth: '80%' }}>
                        {msg.followups.map(f => (
                          <button key={f} className="chip-btn" onClick={() => send(f)} disabled={thinking}>{f}</button>
                        ))}
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

              {/* Quick chips */}
              {!ended && messages.length <= 2 && (
                <div style={{ padding: '0 24px 14px' }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Quick questions
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                    {QUICK_CHIPS.map(c => (
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
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={onKey}
                  placeholder="Ask Haribon about events, membership, training, policies…"
                  disabled={thinking}
                  style={{ maxHeight: 100 }}
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
