import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HaribonFace from './HaribonFace';
import { api } from '../api';

const QUICK = [
  'What events are upcoming?',
  'How do I become a member?',
  'What training is available?',
  'Tell me about funding',
  'Latest news and announcements',
  'What policies are available?',
  'Tell me about partnerships',
  'Who are the consortium members?',
];

const WIDGET_CSS = `
  @keyframes widgetIn {
    from { transform: scale(0.88) translateY(16px); opacity: 0; }
    to   { transform: scale(1) translateY(0); opacity: 1; }
  }
  @keyframes blink {
    0%,80%,100% { opacity: 0; }
    40%          { opacity: 1; }
  }
  .w-dot { animation: blink 1.2s infinite; display: inline-block; width: 5px; height: 5px; border-radius: 50%; background: #94a3b8; margin: 0 1.5px; }
  .w-dot:nth-child(2) { animation-delay: 0.2s; }
  .w-dot:nth-child(3) { animation-delay: 0.4s; }
  .w-chip {
    border-radius: 14px; padding: 5px 10px; font-size: 11px; font-weight: 700;
    cursor: pointer; font-family: inherit; white-space: nowrap;
    background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.65);
    border: 1px solid rgba(255,255,255,0.12); transition: all 0.15s;
  }
  .w-chip:hover { background: rgba(249,115,22,0.18); color: #f97316; border-color: rgba(249,115,22,0.35); }
  .w-input {
    flex: 1; background: rgba(255,255,255,0.07); border: 1.5px solid rgba(255,255,255,0.15);
    border-radius: 10px; padding: 9px 12px; font-size: 12.5px;
    color: #fff; font-family: inherit; outline: none;
  }
  .w-input::placeholder { color: rgba(255,255,255,0.3); }
  .w-input:focus { border-color: #f97316; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
`;

const INIT = [{ from: 'bot', text: "Hi! I'm Haribon 🦅 — DASIG AI. Ask me about events, training, membership, or policies!" }];

export default function Chatbot() {
  const navigate = useNavigate();
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState(INIT);
  const [input, setInput]       = useState('');
  const [thinking, setThinking] = useState(false);
  const msgsRef = useRef(null);

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [messages, thinking]);

  async function send(text) {
    const t = (text || input).trim();
    if (!t || thinking) return;
    setInput('');
    setMessages(prev => [...prev, { from: 'user', text: t }]);
    setThinking(true);
    try {
      const res = await api.chatbot.send(t);
      setMessages(prev => [...prev, { from: 'bot', text: res.reply, followups: res.followups || [] }]);
    } catch {
      setMessages(prev => [...prev, { from: 'bot', text: 'Sorry, I could not reach the DASIG knowledge base right now.', followups: [] }]);
    } finally {
      setThinking(false);
    }
  }

  return (
    <>
      <style>{WIDGET_CSS}</style>

      {open && (
        <div style={{
          position: 'fixed', bottom: 90, right: 22, width: 330,
          borderRadius: 20, overflow: 'hidden',
          background: 'linear-gradient(180deg,#0f172a,#020817)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          zIndex: 9998, border: '1px solid rgba(255,255,255,0.1)',
          animation: 'widgetIn 0.24s cubic-bezier(.34,1.3,.64,1)',
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg,#001d5c,#1a56db 55%,#4f46e5)',
            padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(rgba(249,115,22,0.3),transparent)', right: -20, top: -20, pointerEvents: 'none' }} />
            <div style={{ width: 36, height: 36, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
              <HaribonFace size={36} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 13 }}>Haribon · DASIG AI</div>
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10.5, display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
                Online · NLP-powered
              </div>
            </div>
            <button onClick={() => navigate('/chatbot')} style={{
              background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 7, padding: '4px 9px', fontSize: 10.5, fontWeight: 700,
              color: '#fff', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
            }}>Full →</button>
          </div>

          {/* Messages */}
          <div ref={msgsRef} style={{ height: 220, overflowY: 'auto', padding: '14px 14px 8px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.from === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '88%', padding: '8px 12px', borderRadius: 12, fontSize: 12, lineHeight: 1.55,
                  whiteSpace: 'pre-line',
                  ...(msg.from === 'bot'
                    ? { background: 'rgba(30,41,59,0.9)', color: 'rgba(255,255,255,0.82)', borderBottomLeftRadius: 4, border: '1px solid rgba(255,255,255,0.08)' }
                    : { background: 'linear-gradient(135deg,#001d5c,#1a56db)', color: '#fff', borderBottomRightRadius: 4 }
                  ),
                }}>{msg.text}</div>
                {msg.from === 'bot' && msg.followups && msg.followups.length > 0 && i === messages.length - 1 && !thinking && (
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 6, maxWidth: '95%' }}>
                    {msg.followups.map(f => (
                      <button key={f} className="w-chip" onClick={() => send(f)} disabled={thinking}>{f}</button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {thinking && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, borderBottomLeftRadius: 4, padding: '10px 14px', display: 'flex', alignItems: 'center' }}>
                  <span className="w-dot" /><span className="w-dot" /><span className="w-dot" />
                </div>
              </div>
            )}
          </div>

          {/* Quick chips */}
          {messages.length <= 2 && (
            <div style={{ padding: '4px 12px 8px', display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {QUICK.map(q => (
                <button key={q} className="w-chip" onClick={() => send(q)} disabled={thinking}>{q}</button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: '8px 12px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 7 }}>
            <input
              className="w-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !thinking && send()}
              placeholder="Ask Haribon…"
              disabled={thinking}
            />
            <button onClick={() => send()} disabled={thinking || !input.trim()} style={{
              background: thinking || !input.trim() ? 'rgba(255,255,255,0.08)' : 'linear-gradient(90deg,#f97316,#e11d48)',
              color: thinking || !input.trim() ? 'rgba(255,255,255,0.3)' : '#fff',
              border: 'none', borderRadius: 10, padding: '9px 14px',
              fontSize: 13, fontWeight: 800, cursor: thinking || !input.trim() ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', transition: 'all 0.15s',
            }}>→</button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button onClick={() => setOpen(o => !o)} title="Chat with Haribon"
        style={{
          position: 'fixed', bottom: 22, right: 22,
          width: 56, height: 56, borderRadius: '50%',
          border: 'none', cursor: 'pointer', zIndex: 9999,
          overflow: 'hidden', boxShadow: '0 4px 20px rgba(249,115,22,0.45)',
          padding: 0, background: 'transparent', transition: 'all 0.22s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.12)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        {open ? (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#001d5c,#1a56db)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 22, fontWeight: 700 }}>✕</div>
        ) : (
          <HaribonFace size={56} style={{ borderRadius: '50%' }} />
        )}
      </button>
    </>
  );
}
