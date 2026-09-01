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

// Autocomplete suggestions
const SUGGESTIONS = [
  'What events are coming up?',
  'How do I become a DASIG member?',
  'What training programs are available?',
  'What if the event I want is full?',
  'How do I register for an event?',
  'What funding opportunities are open?',
  'Tell me about DASIG partnerships',
  'What governance policies are available?',
  'How do I check my event registrations?',
  'How do I reset my password?',
  'What are the membership fees?',
  'How many events are available?',
  'What are the upcoming events?',
  'How do I cancel my registration?',
  'Who are the DASIG member institutions?',
  'What can the admin panel do?',
  'What is DASIG?',
  'How do I create a DASIG account?',
  'What is my membership status?',
  'How do I update my profile?',
];

// Role-based quick chips (Trilingual: English, Bisaya, Tagalog)
const QUICK_CHIPS_BY_ROLE = {
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

const CATEGORIZED_CHIPS = {
  ALL: [
    { label: '📅 September 2026 Schedule', q: 'What events and trainings are scheduled in September 2026?' },
    { label: '🏛 CIT-U Host Node Role',   q: 'What is CIT-University\'s role as the Central Host Node?' },
    { label: '💰 DOST-7 Grants & Funding', q: 'How can academic researchers apply for DOST-7 Grants-In-Aid?' },
    { label: '🎓 Faculty GenAI Bootcamps',  q: 'What training bootcamps are available for faculty development?' },
    { label: '👥 Join Consortium',         q: 'How does an institution apply for DASIG membership?' },
    { label: '🇵🇭 (Bisaya) Mga Events',     q: 'Maayong adlaw! Unsay mga umaabot nga events sa DASIG?' },
  ],
  EVENTS: [
    { label: '📅 September 2026 Schedule', q: 'What events are scheduled in September 2026?' },
    { label: '🤖 Regional AI Summit 2026', q: 'Tell me about the Regional AI Research & Innovation Summit 2026' },
    { label: '📝 How to Register',        q: 'How do I register for an upcoming consortium event?' },
    { label: '📊 Check Seat Capacities',  q: 'How many events are active and what are their capacities?' },
  ],
  TRAINING: [
    { label: '🎓 Faculty Development',     q: 'What faculty training bootcamps are available?' },
    { label: '🤖 Applied GenAI Course',    q: 'Tell me about the Applied Generative AI & LLM Systems bootcamp' },
    { label: '📜 Digital Certificates',    q: 'How are Certificates of Completion issued and verified?' },
    { label: '💻 DICT-7 Technical Tracks', q: 'What ICT and cybersecurity tracks are offered with DICT-7?' },
  ],
  GRANTS: [
    { label: '💰 DOST-7 Grants-In-Aid',   q: 'What are the eligibility requirements for DOST GIA funding?' },
    { label: '🏢 SETUP Enterprise Grants', q: 'How does the DOST SETUP program assist MSMEs and innovators?' },
    { label: '🤝 Joint HEI Proposals',    q: 'How do partner universities co-author collaborative research grants?' },
  ],
  MEMBERS: [
    { label: '🏛 CIT-University',          q: 'Tell me about Cebu Institute of Technology – University in DASIG' },
    { label: '🌊 UP Visayas',              q: 'What is UP Visayas\' specialization in marine science research?' },
    { label: '🏛 University of San Agustin', q: 'What is University of San Agustin\'s role in consortium governance?' },
    { label: '📋 Membership Tiers',        q: 'What is the difference between Tier 1 and Tier 2 membership?' },
  ],
  DIALECTS: [
    { label: '🇵🇭 (Bisaya) Mga Kalihokan', q: 'Maayong adlaw! Unsay mga umaabot nga kalihokan sa DASIG karon?' },
    { label: '🇵🇭 (Bisaya) Unsaon Pag-apil', q: 'Unsaon pag-apil sa DASIG isip bag-ong miyembro?' },
    { label: '🇵🇭 (Tagalog) Mga Kaganapan', q: 'Magandang araw! May mga paparating bang event sa konsorsyum?' },
    { label: '🇵🇭 (Tagalog) Pondo ng DOST', q: 'Paano mag-aplay sa DOST research grants para sa unibersidad?' },
  ],
};

// Role-based greeting
function makeInitMsg(user) {
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

const CHAT_CSS = `
  @keyframes msgIn {
    from { transform: translateY(10px) scale(0.97); opacity: 0; }
    to   { transform: translateY(0) scale(1); opacity: 1; }
  }
  @keyframes endedIn {
    from { transform: scale(0.92) translateY(12px); opacity: 0; }
    to   { transform: scale(1) translateY(0); opacity: 1; }
  }
  @keyframes metaPulse {
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(249,115,22,0.45), 0 0 16px rgba(59,130,246,0.3);
    }
    50% {
      box-shadow: 0 0 0 7px rgba(249,115,22,0), 0 0 28px rgba(225,29,72,0.45);
    }
  }
  @keyframes blink {
    0%,80%,100% { opacity: 0; }
    40%          { opacity: 1; }
  }
  @keyframes pulseGlow {
    0%,100% { box-shadow: 0 0 0 0 rgba(249,115,22,0.25); }
    50%     { box-shadow: 0 0 0 10px rgba(249,115,22,0); }
  }
  @keyframes micPulse {
    0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.6); transform: scale(1); }
    50%     { box-shadow: 0 0 0 12px rgba(239,68,68,0); transform: scale(1.05); }
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
  .msg-wrapper:hover .msg-actions { opacity: 1; }
  .msg-actions {
    display: flex;
    gap: 6px;
    margin-top: 6px;
    opacity: 0;
    transition: opacity 0.18s;
  }
  .action-btn {
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 7px;
    padding: 3px 9px;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
    color: rgba(255,255,255,0.5);
    font-family: inherit;
    transition: all 0.15s;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .action-btn:hover { background: rgba(249,115,22,0.15); border-color: rgba(249,115,22,0.3); color: #f97316; }
  .action-btn.rated-up { background: rgba(16,185,129,0.15); border-color: rgba(16,185,129,0.3); color: #34d399; }
  .action-btn.rated-down { background: rgba(225,29,72,0.15); border-color: rgba(225,29,72,0.3); color: #f87171; }
  @keyframes waveBar {
    0%   { height: 4px; opacity: 0.45; }
    50%  { height: 18px; opacity: 1; }
    100% { height: 6px; opacity: 0.55; }
  }
  .voicemail-bar {
    width: 2.5px;
    background: linear-gradient(180deg, #f97316 0%, #fb923c 100%);
    border-radius: 3px;
    height: 6px;
    transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .voicemail-bar.active {
    animation: waveBar 0.75s ease-in-out infinite alternate;
  }
  .voicemail-card {
    background: linear-gradient(135deg, rgba(249,115,22,0.11) 0%, rgba(30,58,138,0.12) 100%);
    border: 1px solid rgba(249,115,22,0.28);
    box-shadow: 0 4px 16px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.08);
    backdrop-filter: blur(12px);
    border-radius: 12px;
    padding: 7px 12px;
    margin-bottom: 9px;
    display: flex;
    align-items: center;
    gap: 10px;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    user-select: none;
  }
  .voicemail-card:hover {
    background: linear-gradient(135deg, rgba(249,115,22,0.18) 0%, rgba(30,58,138,0.20) 100%);
    border-color: rgba(249,115,22,0.5);
    box-shadow: 0 6px 20px rgba(249,115,22,0.2), inset 0 1px 0 rgba(255,255,255,0.14);
  }
`;

function formatTime(d) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const NAV_CARD_INFO = {
  '/events':       { icon: '📅', title: 'Events & Summits', desc: 'Browse scheduled summits, seminars, and seat capacities' },
  '/programs':     { icon: '📅', title: 'Consortium Calendar', desc: 'Explore the full schedule and monthly calendar view' },
  '/training':     { icon: '🎓', title: 'Training & Development', desc: 'Enroll in professional development tracks and workshops' },
  '/membership':   { icon: '👥', title: 'Institutional Membership', desc: 'Learn about membership tiers and apply for institutional affiliation' },
  '/policies':     { icon: '📜', title: 'Policies & Governance', desc: 'Review official consortium charters, rules and guidelines' },
  '/funding':      { icon: '💰', title: 'Funding Opportunities', desc: 'Explore government and research grants from DOST & DICT' },
  '/partnerships': { icon: '🤝', title: 'Strategic Partnerships', desc: 'Discover collaborative initiatives across Region VII' },
  '/news':         { icon: '📰', title: 'Press & Announcements', desc: 'Read the latest consortium news, press releases, and updates' },
  '/members':      { icon: '🏛️', title: 'Member Institutions', desc: 'Explore Region VII universities, campuses and government agencies' },
  '/admin':        { icon: '🛡️', title: 'Admin Command Center', desc: 'Open executive portal administration and control modules' },
};

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

  const userKey = user ? `user_${user.id}` : 'guest';
  const storageKey = `haribon_sessions_${userKey}`;

  const [sessions, setSessions] = useState(() => {
    try {
      const saved = localStorage.getItem(`haribon_sessions_${user ? `user_${user.id}` : 'guest'}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (_) {}
    return [];
  });

  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [showHistory, setShowHistory] = useState(true);

  const initMsg = { from:'bot', text: makeInitMsg(user), time: new Date() };

  // Resume chat from mini widget if available, otherwise fresh start
  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem('haribon_resume');
      if (saved) {
        sessionStorage.removeItem('haribon_resume');
        const msgs = JSON.parse(saved);
        if (Array.isArray(msgs) && msgs.length > 0) {
          // Re-attach time objects (JSON loses Date type)
          return msgs.map(m => ({ ...m, time: m.time ? new Date(m.time) : new Date() }));
        }
      }
    } catch (_) {}
    return [initMsg];
  });
  const [input, setInput]             = useState('');
  const [thinking, setThinking]       = useState(false);
  const [matchRate, setMatchRate]     = useState(null);
  const [totalAsked, setTotalAsked]   = useState(0);
  const [totalMatched, setTotalMatched] = useState(0);
  const [ended, setEnded]             = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [hasReplied, setHasReplied]   = useState(() => {
    try {
      const saved = sessionStorage.getItem('haribon_resume');
      return saved ? true : false;
    } catch { return false; }
  });
  const [suggestions, setSuggestions] = useState([]);
  const [resumed, setResumed]         = useState(() => {
    try { return !!sessionStorage.getItem('haribon_resume'); } catch { return false; }
  });
  const [atBottom, setAtBottom]       = useState(true);
  const [ratings, setRatings]   = useState({});   // {[msgIndex]: 'up'|'down'}
  const [copied,  setCopied]    = useState(null);  // message index recently copied
  const [listening, setListening] = useState(false);
  const [autoVoicemail, setAutoVoicemail] = useState(false);
  const [activeCat, setActiveCat] = useState('ALL');
  const recognitionRef = useRef(null);
  const msgsContainerRef              = useRef(null);

  // Sync sessions when user changes (login/logout)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      setSessions(saved ? JSON.parse(saved) : []);
    } catch (_) {
      setSessions([]);
    }
    setMessages([{ from:'bot', text: makeInitMsg(user), time: new Date() }]);
    setCurrentSessionId(null);
    setTotalAsked(0); setTotalMatched(0); setMatchRate(null);
    setEnded(false); setHasReplied(false); setInput('');
    setSuggestions([]); setResumed(false);
  }, [user?.id]);

  // Persist session whenever messages update beyond initial greeting
  useEffect(() => {
    if (messages.length <= 1) return;
    const firstUserMsg = messages.find(m => m.from === 'user');
    const title = firstUserMsg
      ? (firstUserMsg.text.length > 26 ? firstUserMsg.text.slice(0, 26) + '…' : firstUserMsg.text)
      : 'Inquiry Conversation';

    setSessions(prev => {
      const sId = currentSessionId || `sess_${Date.now()}`;
      if (!currentSessionId) setCurrentSessionId(sId);

      const existingIndex = prev.findIndex(s => s.id === sId);
      const sessionObj = {
        id: sId,
        title,
        updatedAt: new Date().toISOString(),
        messages: messages.map(m => ({ ...m, time: m.time ? new Date(m.time).toISOString() : new Date().toISOString() })),
      };

      let updated;
      if (existingIndex >= 0) {
        updated = [...prev];
        updated[existingIndex] = sessionObj;
      } else {
        updated = [sessionObj, ...prev].slice(0, 25);
      }

      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
  }, [messages]);

  function selectSession(sess) {
    setCurrentSessionId(sess.id);
    setMessages((sess.messages || []).map(m => ({ ...m, time: m.time ? new Date(m.time) : new Date() })));
    setEnded(false);
    setHasReplied(true);
    setThinking(false);
  }

  function startNewChat() {
    setCurrentSessionId(null);
    setMessages([{ from:'bot', text: makeInitMsg(user), time: new Date() }]);
    setTotalAsked(0);
    setTotalMatched(0);
    setMatchRate(null);
    setEnded(false);
    setHasReplied(false);
    setSuggestions([]);
    setResumed(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function deleteSession(e, sessId) {
    e.stopPropagation();
    setSessions(prev => {
      const updated = prev.filter(s => s.id !== sessId);
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
    if (currentSessionId === sessId) {
      startNewChat();
    }
  }

  function clearAllSessions() {
    if (!window.confirm('Clear all your chat history with Haribon?')) return;
    setSessions([]);
    try {
      localStorage.removeItem(storageKey);
    } catch (_) {}
    startNewChat();
  }

  const msgsEnd = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    msgsEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  async function send(text) {
    const trimmed = (text || input).trim();
    if (!trimmed || thinking) return;
    setInput('');
    setSuggestions([]);
    setResumed(false);
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
      const botMsg = {
        from: 'bot',
        text: res.reply,
        intent: res.intent,
        matched: res.matched,
        followups: res.followups || [],
        suggestions: res.suggestions || [],
        navigate_to: res.navigate_to || null,
        time: new Date(),
      };
      setMessages(prev => {
        const next = [...prev, botMsg];
        if (autoVoicemail) {
          setTimeout(() => speakMessage(next.length - 1, res.reply), 200);
        }
        return next;
      });
    } catch (err) {
      console.warn('[chatbot] Backend offline or waking up, using Client High-IQ Synthesis:', err);
      const fallback = resolveClientHighIQ(trimmed);
      setHasReplied(true);
      const botMsg = {
        from: 'bot',
        text: fallback.reply,
        intent: fallback.intent,
        matched: true,
        followups: fallback.followups || [],
        suggestions: [],
        navigate_to: fallback.navigate_to || null,
        time: new Date(),
      };
      setMessages(prev => {
        const next = [...prev, botMsg];
        if (autoVoicemail) {
          setTimeout(() => speakMessage(next.length - 1, fallback.reply), 200);
        }
        return next;
      });
    } finally {
      setThinking(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function resolveClientHighIQ(query) {
    const q = query.toLowerCase();
    
    // 1. Month queries (e.g. september, october, setyembre)
    if (q.includes('september') || q.includes('setyembre') || q.includes('sep')) {
      return {
        reply: `📅 **Consortium Schedule for September 2026:**\n\n### 🏛️ Active Events & Summits:\n• **Regional AI Research & Innovation Summit 2026**\n  📅 **Date:** September 18, 2026\n  📍 **Venue:** CIT-University Main Auditorium, Cebu City\n  👥 **Capacity:** 18/50 registered\n\n• **Inter-HEI Academic Computing Symposium**\n  📅 **Date:** September 25, 2026\n  📍 **Venue:** UP Visayas Performing Arts Hall\n  👥 **Capacity:** 15/50 registered\n\n### 🎓 Faculty Bootcamps:\n• **Applied Generative AI & LLM Systems for Faculty** (4 Weeks · Advanced)\n• **STEM Research Methodologies & Grants Writing** (2 Weeks · Intermediate)\n\n👉 *You can register directly in the [Programs Module](/programs?tab=events)!*`,
        intent: 'events_month',
        navigate_to: '/programs?tab=events',
        followups: ['How do I register for an event?', 'What training programs are available?', 'Tell me about DOST grants']
      };
    }

    if (q.includes('october') || q.includes('oktubre') || q.includes('oct')) {
      return {
        reply: `📅 **Consortium Schedule for October 2026:**\n\n### 🏛️ Upcoming Events:\n• **Central Visayas EdTech & STEM Leadership Conference**\n  📅 **Date:** October 12, 2026\n  📍 **Venue:** University of San Agustin Auditorium, Iloilo\n  👥 **Capacity:** 10/60 registered\n\n👉 *Reserve your slot in the [Programs Module](/programs?tab=events)!*`,
        intent: 'events_month',
        navigate_to: '/programs?tab=events',
        followups: ['How do I register for an event?', 'What is DASIG?']
      };
    }

    // 2. Events & Summits
    if (q.includes('event') || q.includes('summit') || q.includes('conference') || q.includes('kalihokan') || q.includes('kaganapan')) {
      return {
        reply: `📅 **DASIG Consortium Events & Summits:**\n\nDASIG organizes annual research symposiums and technology conferences across Central Visayas:\n\n• **Regional AI Research & Innovation Summit 2026** (Sept 18 · CIT-U)\n• **Inter-HEI Academic Computing Symposium** (Sept 25 · UP Visayas)\n• **Central Visayas EdTech Leadership Conference** (Oct 12 · USa)\n\n👉 *Explore schedules and reserve slots in the [Programs Module](/programs?tab=events)!*`,
        intent: 'events',
        navigate_to: '/programs?tab=events',
        followups: ['How do I register?', 'What training programs are available?']
      };
    }

    // 3. Training & Faculty Development
    if (q.includes('training') || q.includes('bootcamp') || q.includes('course') || q.includes('upskill') || q.includes('kurso')) {
      return {
        reply: `🎓 **Faculty Development & Technical Bootcamps:**\n\nDASIG offers certified upskilling bootcamps alongside DICT-7, DOST-7, and CIT-University:\n\n• **Applied Generative AI & LLM Systems** (4 Weeks · Advanced)\n• **STEM Research Methodologies & Grants Writing** (2 Weeks · Intermediate)\n• **Cybersecurity & Data Privacy Governance** (3 Weeks · Advanced)\n\n👉 *Enroll directly in the [Training Module](/programs?tab=training)!*`,
        intent: 'training',
        navigate_to: '/programs?tab=training',
        followups: ['How do I become a member?', 'What funding is available?']
      };
    }

    // 4. Membership & Joining
    if (q.includes('membership') || q.includes('join') || q.includes('apply') || q.includes('apil') || q.includes('sumali')) {
      return {
        reply: `👥 **How to Join the DASIG Consortium:**\n\n1. Sign in to your account.\n2. Navigate to the **Membership** module.\n3. Click **"Apply for Membership"** and specify Tier 1 (Full Autonomous HEI) or Tier 2 (Associate College).\n4. Submit for executive board accreditation and charter onboarding.`,
        intent: 'membership',
        navigate_to: '/membership',
        followups: ['Who are the member institutions?', 'What events are coming up?']
      };
    }

    // 5. DOST Research Grants & Funding
    if (q.includes('grant') || q.includes('funding') || q.includes('dost') || q.includes('pondo') || q.includes('budget')) {
      return {
        reply: `💰 **DOST-7 Research Grants & Funding Framework:**\n\nDOST Region VII provides robust financial grant mechanisms for academic researchers:\n\n1. **Grants-In-Aid (GIA):** Direct funding for high-impact R&D projects aligning with regional priorities.\n2. **SETUP Program:** Tech upgrading and enterprise innovation assistance for MSMEs.\n3. **Consortium Collaborative Grants:** Joint inter-HEI research grant proposals.\n\n👉 *Track open calls in the [Funding Module](/funding)!*`,
        intent: 'funding',
        navigate_to: '/funding',
        followups: ['What training programs exist?', 'Who are member institutions?']
      };
    }

    // 6. Member Institutions (CIT-U, UPV, USA)
    if (q.includes('cit') || q.includes('upv') || q.includes('san agustin') || q.includes('member institution')) {
      return {
        reply: `🏛️ **DASIG Consortium Member Institutions:**\n\n• **CIT-University** (Cebu City — Central Host Node & Engineering Hub)\n• **UP Visayas** (Marine Science, Fisheries & Coastal Resource Management)\n• **University of San Agustin** (Governance, Ethics & Health Sciences)\n• **DOST Region VII** (Science, Technology & Research Grants)\n• **DICT Region VII** (Digital Transformation & ICT Bootcamps)\n• **DTI Region VII** (Trade & Commercialization)\n• **DepEd Region VII** (Basic Education & EdTech)`,
        intent: 'members',
        navigate_to: '/members',
        followups: ['What events are coming up?', 'How to apply for membership?']
      };
    }

    // 7. Capstone & IT411 Guidance
    if (q.includes('capstone') || q.includes('it411') || q.includes('validation') || q.includes('iso 25010') || q.includes('tam')) {
      return {
        reply: `🎓 **IT411 Capstone & MVP Validation Framework:**\n\n• **ISO/IEC 25010:** Evaluates Functional Suitability, Usability, Performance, Security, and Reliability.\n• **Technology Acceptance Model (TAM):** Measures Perceived Usefulness (PU) and Perceived Ease of Use (PEOU).\n• **Target Demographic:** 30 stakeholders across Students (Guests), Faculty (Members), IT Experts (SMEs), and Admins.`,
        intent: 'capstone',
        navigate_to: null,
        followups: ['What events are coming up?', 'How does Haribon AI work?']
      };
    }

    // 8. General High-IQ fallback
    return {
      reply: `🦅 **Haribon AI — DASIG Consortium Assistant:**\n\nI understand your inquiry regarding **"${query}"**.\n\nAs the intelligent assistant for the **DASIG Regional Academic Consortium (Region VII)**, I can assist you with:\n\n• 📅 **Events & Summits:** Schedules, venues, and real-time seat reservation.\n• 🎓 **Faculty Development:** Technical training courses and certificates.\n• 💰 **Research Grants:** DOST-7 GIA, SETUP, and institutional funding.\n• 👥 **Consortium Membership:** Application procedures and partner universities (CIT-U, UPV, USA).\n\n💡 *What specific area would you like to explore?*`,
      intent: 'general_help',
      navigate_to: null,
      followups: ['What events are coming up?', 'What training programs are available?', 'How do I join DASIG?']
    };
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
    setSuggestions([]);
    setResumed(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function exportTranscript() {
    if (!messages || messages.length === 0) return;
    const formatted = messages.map(m => {
      const speaker = m.from === 'user' ? '👤 User' : '🦅 Haribon AI';
      const time = m.time ? new Date(m.time).toLocaleString() : '';
      return `### ${speaker} (${time})\n\n${m.text}\n\n---\n`;
    }).join('\n');

    const header = `# 🦅 Haribon AI — Conversation Transcript\n**DASIG Regional Academic Consortium (Region VII)**\n*Exported: ${new Date().toLocaleString()}*\n\n---\n\n`;
    const fullDoc = header + formatted;

    const blob = new Blob([fullDoc], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `haribon_transcript_${Date.now()}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function handleInputChange(e) {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
    const q = e.target.value.trim().toLowerCase();
    if (q.length >= 2) {
      setSuggestions(SUGGESTIONS.filter(s => s.toLowerCase().includes(q)).slice(0, 4));
    } else {
      setSuggestions([]);
    }
  }

  function handleScroll(e) {
    const el = e.currentTarget;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setAtBottom(distFromBottom < 200);
  }

  function jumpToBottom() {
    msgsContainerRef.current?.scrollTo({ top: msgsContainerRef.current.scrollHeight, behavior: 'smooth' });
    setAtBottom(true);
  }

  function rateMessage(idx, vote) {
    setRatings(prev => ({ ...prev, [idx]: prev[idx] === vote ? null : vote }));
  }

  const [speakingIdx, setSpeakingIdx] = useState(null);
  const [voiceSpeed, setVoiceSpeed]   = useState(1.0);

  // Intelligently select the most realistic natural / neural human voice on the system
  function getBestHumanVoice() {
    if (!window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices() || [];
    if (!voices.length) return null;

    // 1. Prioritize Microsoft Natural / Neural voices (Jenny, Guy, Aria, Ryan, Christopher)
    const natural = voices.find(v =>
      /natural|neural|online/i.test(v.name) && (/english|en[-_]/i.test(v.lang) || /en[-_]us|en[-_]ph|en[-_]gb/i.test(v.lang))
    );
    if (natural) return natural;

    // 2. Google High Quality US / UK / PH English
    const google = voices.find(v =>
      /google/i.test(v.name) && /en[-_]/i.test(v.lang)
    );
    if (google) return google;

    // 3. Apple Enhanced / Premium voices (Samantha, Ava, Alex, Daniel)
    const apple = voices.find(v =>
      /enhanced|premium|samantha|ava|daniel|karen|moira/i.test(v.name) && /en[-_]/i.test(v.lang)
    );
    if (apple) return apple;

    // 4. Default high-compatibility English voice
    const english = voices.find(v => /en[-_]ph|en[-_]us|en[-_]gb/i.test(v.lang)) || voices.find(v => v.lang.startsWith('en'));
    return english || voices[0];
  }

  function cleanSpeechText(text) {
    if (!text) return '';
    return text
      .replace(/https?:\/\/\S+/gi, '') // Remove URLs
      .replace(/[\*\_\~`#]/g, '') // Remove markdown formatting
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '') // Remove emojis to avoid robotic symbol reading
      .replace(/^[•▸\-\*\d+\.]\s*/gm, '') // Remove bullets
      .replace(/\s+/g, ' ')
      .trim();
  }

  const audioPlayerRef = useRef(null);

  async function speakMessage(idx, text, overrideSpeed) {
    if (speakingIdx === idx && !overrideSpeed) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      setSpeakingIdx(null);
      return;
    }

    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    if (window.speechSynthesis) window.speechSynthesis.cancel();

    const cleanText = cleanSpeechText(text);
    if (!cleanText) return;

    setSpeakingIdx(idx);
    const speed = overrideSpeed || voiceSpeed || 1.0;

    try {
      // 1. Attempt ElevenLabs Neural Audio Generation via Backend API
      const res = await api.chatbot.tts(cleanText, 'Adam');
      const contentType = res.headers?.get('content-type') || '';

      if (res.ok && contentType.includes('audio/mpeg')) {
        const blob = await res.blob();
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        audio.playbackRate = speed;
        audio.onended = () => { setSpeakingIdx(null); audioPlayerRef.current = null; };
        audio.onerror = () => { fallbackSpeak(idx, cleanText, speed); };
        audioPlayerRef.current = audio;
        await audio.play();
        return;
      }
    } catch (e) {
      console.warn('[tts] Backend streaming fallback:', e.message);
    }

    // 2. High-fidelity Client Neural Synthesis Fallback
    fallbackSpeak(idx, cleanText, speed);
  }

  function fallbackSpeak(idx, cleanText, speed) {
    if (!window.speechSynthesis) {
      setSpeakingIdx(null);
      return;
    }
    const utter = new SpeechSynthesisUtterance(cleanText);
    const bestVoice = getBestHumanVoice();
    if (bestVoice) utter.voice = bestVoice;
    utter.rate = (speed || 1.0) * 0.96;
    utter.pitch = 1.0;
    utter.volume = 1.0;
    utter.onend = () => setSpeakingIdx(null);
    utter.onerror = () => setSpeakingIdx(null);
    setSpeakingIdx(idx);
    window.speechSynthesis.speak(utter);
  }

  async function copyMessage(idx, text) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(idx);
      setTimeout(() => setCopied(c => c === idx ? null : c), 2000);
    } catch (_) {}
  }

  function regenerateResponse(idx) {
    if (thinking || idx <= 0) return;
    for (let i = idx - 1; i >= 0; i--) {
      if (messages[i].from === 'user') {
        send(messages[i].text);
        break;
      }
    }
  }

  function toggleVoiceInput() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
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
          setTimeout(() => inputRef.current?.focus(), 50);
        }
      };
      recognitionRef.current = recognition;
      recognition.start();
    } catch (_) {
      setListening(false);
    }
  }

  return (
    <div style={{ background: 'linear-gradient(180deg,#000d30 0%,#020817 300px,#0f172a 100%)', minHeight: '100vh', position: 'relative' }}>
      <ParticleBackground density={40} />
      <style>{CHAT_CSS}</style>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <PageHeader eyebrow="DASIG AI Assistant" title="Ask Haribon" />

        <section style={{ padding: '24px 24px 80px' }}>
          <div style={{ maxWidth: 1080, margin: '0 auto' }}>

            {/* Status bar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18,
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
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setAutoVoicemail(!autoVoicemail)}
                  style={{
                    background: autoVoicemail ? 'rgba(249,115,22,0.22)' : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${autoVoicemail ? 'rgba(249,115,22,0.5)' : 'rgba(255,255,255,0.12)'}`,
                    borderRadius: 8, padding: '5px 12px', fontSize: 11.5, fontWeight: 700,
                    color: autoVoicemail ? '#fb923c' : 'rgba(255,255,255,0.7)', cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}
                  title="Automatically speak out responses like an audio voice message"
                >
                  <span>{autoVoicemail ? '🔊' : '🔈'}</span>
                  <span>Natural Voice: {autoVoicemail ? 'ON' : 'OFF'}</span>
                </button>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  style={{
                    background: showHistory ? 'rgba(249,115,22,0.18)' : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${showHistory ? 'rgba(249,115,22,0.4)' : 'rgba(255,255,255,0.12)'}`,
                    borderRadius: 8, padding: '5px 12px', fontSize: 11.5, fontWeight: 700,
                    color: showHistory ? '#fb923c' : 'rgba(255,255,255,0.7)', cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}
                >
                  <span>💬</span>
                  <span>History ({sessions.length})</span>
                </button>
                {matchRate !== null && (
                  <div style={{
                    background: matchRate >= 80
                      ? 'rgba(16,185,129,0.15)' : matchRate >= 60
                      ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                    border: `1px solid ${matchRate >= 80 ? 'rgba(16,185,129,0.3)' : matchRate >= 60 ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    borderRadius: 8, padding: '5px 12px', fontSize: 11.5, fontWeight: 800,
                    color: matchRate >= 80 ? '#34d399' : matchRate >= 60 ? '#fbbf24' : '#f87171',
                  }}>
                    🎯 {matchRate}% accuracy
                  </div>
                )}
                <button onClick={startNewChat} style={{
                  background: 'linear-gradient(90deg,#f97316,#e11d48)',
                  border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 11.5, fontWeight: 800,
                  color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: '0 2px 8px rgba(249,115,22,0.35)',
                }}>＋ New Chat</button>
                <button onClick={exportTranscript} style={{
                  background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)',
                  borderRadius: 8, padding: '5px 12px', fontSize: 11.5, fontWeight: 700,
                  color: '#60a5fa', cursor: 'pointer', fontFamily: 'inherit',
                }} title="Download conversation as Markdown for thesis or validation">📥 Export</button>
                <button onClick={() => setShowEndConfirm(true)} style={{
                  background: 'rgba(225,29,72,0.08)', border: '1px solid rgba(225,29,72,0.22)',
                  borderRadius: 8, padding: '5px 12px', fontSize: 11.5, fontWeight: 700,
                  color: '#f43f5e', cursor: 'pointer', fontFamily: 'inherit',
                }}>End Chat</button>
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
                    Your active conversation will be concluded. You can start a new one anytime.
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

            {/* ── 2-Column Chat & History Container ── */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'stretch' }}>

              {/* Left Column: Chat History Sidebar */}
              {showHistory && (
                <aside style={{
                  width: 260, background: 'rgba(10,16,32,0.85)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 20, padding: '16px 14px',
                  display: 'flex', flexDirection: 'column',
                  flexShrink: 0,
                  boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '0 4px' }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '.6px' }}>
                      💬 Chat History
                    </span>
                    <button
                      onClick={startNewChat}
                      style={{
                        background: 'linear-gradient(90deg,#f97316,#e11d48)',
                        border: 'none', borderRadius: 8, padding: '4px 10px',
                        color: '#fff', fontSize: 11.5, fontWeight: 800,
                        cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      ＋ New
                    </button>
                  </div>

                  {/* Sessions list */}
                  <div style={{ flex: 1, overflowY: 'auto', maxHeight: 460, display: 'flex', flexDirection: 'column', gap: 6, paddingRight: 2 }}>
                    {sessions.length === 0 ? (
                      <div style={{ padding: '36px 10px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 12, lineHeight: 1.5 }}>
                        No saved sessions yet.<br />Ask Haribon a question to start your history!
                      </div>
                    ) : (
                      sessions.map(s => {
                        const isActive = s.id === currentSessionId;
                        return (
                          <div
                            key={s.id}
                            onClick={() => selectSession(s)}
                            style={{
                              padding: '10px 12px', borderRadius: 10,
                              background: isActive ? 'rgba(249,115,22,0.18)' : 'rgba(255,255,255,0.03)',
                              border: `1px solid ${isActive ? 'rgba(249,115,22,0.4)' : 'rgba(255,255,255,0.06)'}`,
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              gap: 8, transition: 'all .14s',
                            }}
                            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
                            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                          >
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.85)', fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {s.title}
                              </div>
                              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10.5, marginTop: 2 }}>
                                {s.messages?.length || 0} msgs · {new Date(s.updatedAt).toLocaleDateString([], { month:'short', day:'numeric' })}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={e => deleteSession(e, s.id)}
                              title="Delete conversation"
                              style={{
                                background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)',
                                cursor: 'pointer', fontSize: 12, padding: '2px 4px', borderRadius: 4,
                              }}
                              onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {sessions.length > 0 && (
                    <button
                      onClick={clearAllSessions}
                      style={{
                        marginTop: 12, background: 'none', border: 'none',
                        color: 'rgba(255,255,255,0.35)', fontSize: 11.5,
                        cursor: 'pointer', padding: '6px 0', textAlign: 'center',
                        fontFamily: 'inherit', transition: 'color .15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
                    >
                      🗑️ Clear all history
                    </button>
                  )}
                </aside>
              )}

              {/* Right Column: Chat window */}
              <div style={{
                flex: 1, minWidth: 0,
                background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 20, overflow: 'hidden',
                boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
              }}>
                {/* Messages area */}
                <div ref={msgsContainerRef} onScroll={handleScroll} style={{ height: 460, overflowY: 'auto', padding: ended ? 0 : '24px 24px 16px', display: 'flex', flexDirection: 'column', gap: ended ? 0 : 14, position: 'relative' }}>
                {/* Jump to bottom button */}
                {!ended && !atBottom && (
                  <div style={{ position: 'sticky', bottom: 8, zIndex: 5, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
                    <button onClick={jumpToBottom} style={{ pointerEvents: 'all', background: 'rgba(249,115,22,0.85)', border: 'none', borderRadius: 20, padding: '6px 16px', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
                      ↓ Jump to latest
                    </button>
                  </div>
                )}
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
                {/* Resumed from mini-widget banner */}
                {resumed && (
                  <div style={{ textAlign: 'center', padding: '8px 16px', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 10, margin: '0 0 12px', fontSize: 12, color: 'rgba(249,115,22,0.8)' }}>
                    ↩ Resumed from mini chat
                  </div>
                )}
                {messages.map((msg, i) => {
                  // Timestamp divider between messages more than 5 minutes apart
                  const prevMsg = messages[i - 1];
                  const showDivider = prevMsg && msg.time && prevMsg.time &&
                    (new Date(msg.time) - new Date(prevMsg.time)) > 5 * 60 * 1000;
                  return (
                  <div key={i}>
                    {showDivider && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0 8px' }}>
                        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {formatTime(new Date(msg.time))}
                        </span>
                        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                      </div>
                    )}
                  <div className="chat-msg msg-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: msg.from === 'user' ? 'flex-end' : 'flex-start' }}>

                    {/* Bot avatar row with Meta AI glowing halo */}
                    {msg.from === 'bot' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6 }}>
                        <div style={{ position: 'relative', width: 28, height: 28 }}>
                          <div style={{
                            position: 'absolute', inset: -2.5, borderRadius: '50%',
                            background: 'linear-gradient(135deg,#f97316,#e11d48,#3b82f6)',
                            animation: 'metaPulse 3s ease-in-out infinite',
                          }} />
                          <div style={{ position: 'relative', width: 28, height: 28, borderRadius: '50%', overflow: 'hidden', zIndex: 1 }}>
                            <HaribonFace size={28} />
                          </div>
                        </div>
                        <span style={{ fontSize: 12.5, color: '#fff', fontWeight: 800, letterSpacing: '0.2px' }}>Haribon AI</span>
                        <span style={{ fontSize: 10, background: 'rgba(249,115,22,0.18)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 5, padding: '1px 6px', fontWeight: 800 }}>NLP</span>
                        {!msg.matched && msg.matched !== undefined && (
                          <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.35)', fontStyle: 'italic' }}>fuzzy suggestion</span>
                        )}
                      </div>
                    )}

                    {/* Message bubble */}
                    <div style={{
                      maxWidth: '82%', padding: msg.from === 'bot' ? '14px 18px' : '11px 16px',
                      borderRadius: 18, fontSize: 13.5,
                      ...(msg.from === 'bot' ? {
                        background: 'rgba(12,20,38,0.96)',
                        borderBottomLeftRadius: 5,
                        border: '1px solid rgba(255,255,255,0.09)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
                      } : {
                        background: 'linear-gradient(135deg,#1e3a8a,#1a56db)',
                        color: '#fff', borderBottomRightRadius: 5,
                        boxShadow: '0 4px 16px rgba(30,58,138,0.4)',
                      }),
                    }}>
                      {msg.from === 'bot' ? (
                        <>
                          {/* Studio Neural Audio Note Player */}
                          <div
                            className="voicemail-card"
                            onClick={() => speakMessage(i, msg.text)}
                            style={{ cursor: 'pointer' }}
                            title="Click to play realistic human voice note"
                          >
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); speakMessage(i, msg.text); }}
                              style={{
                                width: 28, height: 28, borderRadius: '50%',
                                background: speakingIdx === i ? 'linear-gradient(135deg, #e11d48, #f43f5e)' : 'linear-gradient(135deg, #f97316, #ea580c)',
                                border: 'none', color: '#fff', fontSize: 11,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', flexShrink: 0,
                                boxShadow: speakingIdx === i ? '0 0 0 3px rgba(225,29,72,0.35)' : '0 2px 8px rgba(249,115,22,0.45)',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              {speakingIdx === i ? '⏸' : '▶'}
                            </button>

                            {/* Soundwave equalizer */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 2.5, flex: 1, minWidth: 70, height: 20 }}>
                              {[6, 12, 18, 10, 15, 20, 8, 14, 19, 11, 16, 22, 13, 8, 17, 21, 12, 16, 9, 14].map((h, bi) => (
                                <div
                                  key={bi}
                                  className={`voicemail-bar${speakingIdx === i ? ' active' : ''}`}
                                  style={{
                                    height: speakingIdx === i ? undefined : `${Math.max(4, h * 0.55)}px`,
                                    animationDelay: `${bi * 0.05}s`
                                  }}
                                />
                              ))}
                            </div>

                            {/* Natural Voice badge & Speed button */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                              <span style={{ fontSize: 10.5, fontWeight: 800, color: speakingIdx === i ? '#fb923c' : 'rgba(255,255,255,0.7)', letterSpacing: '0.2px' }}>
                                {speakingIdx === i ? 'Playing Voice…' : '🎙️ Natural Voice'}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const nextSpeed = voiceSpeed === 1.0 ? 1.25 : voiceSpeed === 1.25 ? 0.9 : 1.0;
                                  setVoiceSpeed(nextSpeed);
                                  if (speakingIdx === i) speakMessage(i, msg.text, nextSpeed);
                                }}
                                style={{
                                  background: 'rgba(255,255,255,0.08)',
                                  border: '1px solid rgba(255,255,255,0.15)',
                                  borderRadius: 5,
                                  padding: '1px 5px',
                                  fontSize: 9.5,
                                  fontWeight: 800,
                                  color: '#fb923c',
                                  cursor: 'pointer'
                                }}
                                title="Click to toggle playback speed (1.0x, 1.25x, 0.9x)"
                              >
                                {voiceSpeed}x
                              </button>
                            </div>
                          </div>
                          <BotText text={msg.text} />
                        </>
                      ) : (
                        <span style={{ lineHeight: 1.55 }}>{msg.text}</span>
                      )}
                    </div>

                    {/* Timestamp */}
                    {msg.time && (
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.42)', marginTop: 4, fontWeight: 500 }}>
                        {formatTime(msg.time)}
                      </div>
                    )}

                    {/* Meta AI Rating, Copy & Read Aloud actions — shown on hover via CSS */}
                    {msg.from === 'bot' && i > 0 && (
                      <div className="msg-actions">
                        <button
                          className={`action-btn${ratings[i] === 'up' ? ' rated-up' : ''}`}
                          onClick={() => rateMessage(i, 'up')}
                        >
                          👍{ratings[i] === 'up' ? ' Helpful' : ''}
                        </button>
                        <button
                          className={`action-btn${ratings[i] === 'down' ? ' rated-down' : ''}`}
                          onClick={() => rateMessage(i, 'down')}
                          title="Not helpful"
                        >
                          👎{ratings[i] === 'down' ? ' Not helpful' : ''}
                        </button>
                        <button
                          className={`action-btn${copied === i ? ' copied' : ''}`}
                          onClick={() => copyMessage(i, msg.text)}
                          title="Copy response"
                        >
                          {copied === i ? '✓ Copied' : '⧉ Copy'}
                        </button>
                        <button
                          className={`action-btn${speakingIdx === i ? ' rated-up' : ''}`}
                          onClick={() => speakMessage(i, msg.text)}
                          title="Read aloud"
                        >
                          {speakingIdx === i ? '⏹ Stop' : '🔊 Read'}
                        </button>
                        <button
                          className="action-btn"
                          onClick={() => regenerateResponse(i)}
                          title="Regenerate response"
                          disabled={thinking}
                        >
                          🔄 Retry
                        </button>
                      </div>
                    )}

                    {/* Did you mean? suggestions when unmatched */}
                    {msg.from === 'bot' && i === messages.length - 1 && !thinking && msg.matched === false && msg.suggestions?.length > 0 && (
                      <div style={{ marginTop: 10, padding: '12px 16px', background: 'rgba(249,115,22,0.07)', border: '1px solid rgba(249,115,22,0.22)', borderRadius: 12, maxWidth: '84%' }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#fb923c', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.5px' }}>
                          💡 Did you mean one of these?
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {msg.suggestions.map((s, si) => (
                            <button
                              key={si}
                              className="chip-btn"
                              onClick={() => send(s.sample)}
                              style={{ fontSize: 12, padding: '6px 12px' }}
                            >
                              {s.sample}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Follow-up suggestions + In-Chat Direct Navigation Card — only on last bot message */}
                    {msg.from === 'bot' && i === messages.length - 1 && !thinking && (
                      <div style={{ marginTop: 10, maxWidth: '84%', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {msg.navigate_to && (() => {
                          const card = NAV_CARD_INFO[msg.navigate_to] || { icon: '🚀', title: 'Open Portal Page', desc: 'Click to view related module details' };
                          return (
                            <div
                              onClick={() => navigate(msg.navigate_to)}
                              style={{
                                background: 'rgba(8,14,28,0.85)',
                                backdropFilter: 'blur(12px)',
                                border: '1px solid rgba(249,115,22,0.35)',
                                borderRadius: 14, padding: '14px 18px',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14,
                                transition: 'all 0.18s ease',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.35), 0 0 16px rgba(249,115,22,0.1)',
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.borderColor = 'rgba(249,115,22,0.7)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.5), 0 0 20px rgba(249,115,22,0.2)';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.borderColor = 'rgba(249,115,22,0.35)';
                                e.currentTarget.style.transform = 'none';
                                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.35), 0 0 16px rgba(249,115,22,0.1)';
                              }}
                            >
                              <div style={{
                                width: 40, height: 40, borderRadius: 11,
                                background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.35)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 20, flexShrink: 0,
                              }}>{card.icon}</div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ color: '#fff', fontWeight: 800, fontSize: 13.5, marginBottom: 2 }}>{card.title}</div>
                                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11.5 }}>{card.desc}</div>
                              </div>
                              <div style={{
                                color: '#f97316', fontWeight: 800, fontSize: 12.5,
                                display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
                              }}>
                                <span>Open</span>
                                <span>→</span>
                              </div>
                            </div>
                          );
                        })()}
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
                  </div>
                  );
                })}

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

              {/* Quick chips & Category Navigator — show until first bot reply arrives */}
              {!ended && !hasReplied && (
                <div style={{ padding: '0 24px 14px' }}>
                  {/* Category Pills Bar */}
                  <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 8 }}>
                    {[
                      { id: 'ALL', label: '✨ All Questions' },
                      { id: 'EVENTS', label: '📅 Events & Dates' },
                      { id: 'TRAINING', label: '🎓 Bootcamps' },
                      { id: 'GRANTS', label: '💰 DOST Grants' },
                      { id: 'MEMBERS', label: '🏛 Partner HEIs' },
                      { id: 'DIALECTS', label: '🇵🇭 Bisaya / Tagalog' },
                    ].map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCat(cat.id)}
                        style={{
                          background: activeCat === cat.id ? 'rgba(249,115,22,0.22)' : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${activeCat === cat.id ? 'rgba(249,115,22,0.5)' : 'rgba(255,255,255,0.1)'}`,
                          borderRadius: 20, padding: '4px 12px', fontSize: 11.5, fontWeight: 700,
                          color: activeCat === cat.id ? '#fb923c' : 'rgba(255,255,255,0.65)',
                          cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                          transition: 'all .14s',
                        }}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: 9 }}>
                    {(CATEGORIZED_CHIPS[activeCat] || CATEGORIZED_CHIPS.ALL).map(({ label, q }) => (
                      <button key={label} className="chip-btn" onClick={() => send(q)} disabled={thinking}>{label}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input row */}
              {!ended && <div style={{
                padding: '14px 20px 18px',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.02)',
              }}>
                {/* Autocomplete dropdown + textarea wrapper */}
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', position: 'relative' }}>
                  {/* Autocomplete suggestions dropdown */}
                  {suggestions.length > 0 && (
                    <div style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, marginBottom: 6, background: 'rgba(10,16,32,0.98)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 -16px 48px rgba(0,0,0,0.6)', zIndex: 10 }}>
                      {suggestions.map(s => (
                        <button key={s} onClick={() => { setInput(s); setSuggestions([]); setTimeout(() => inputRef.current?.focus(), 10); }}
                          style={{ width: '100%', padding: '11px 18px', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.78)', fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'background .12s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(249,115,22,0.1)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <span style={{ color: 'rgba(255,255,255,0.35)', marginRight: 8 }}>🔍</span>{s}
                        </button>
                      ))}
                    </div>
                  )}
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
                  {/* Character count when over 80 chars */}
                  {input.length > 80 && (
                    <div style={{ position: 'absolute', bottom: '100%', right: 0, marginBottom: 4, fontSize: 11, color: input.length > 200 ? '#f87171' : 'rgba(255,255,255,0.35)', fontWeight: 600, background: 'rgba(10,16,32,0.85)', borderRadius: 6, padding: '2px 7px', pointerEvents: 'none' }}>
                      {input.length}/400
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={toggleVoiceInput}
                    title={listening ? 'Listening... click to stop' : 'Speak to Haribon (Voice input)'}
                    style={{
                      background: listening ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'rgba(255,255,255,0.08)',
                      color: listening ? '#fff' : 'rgba(255,255,255,0.7)',
                      border: `1px solid ${listening ? '#ef4444' : 'rgba(255,255,255,0.12)'}`,
                      borderRadius: 12, padding: '13px 15px',
                      fontSize: 16, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      animation: listening ? 'micPulse 1.4s infinite' : 'none',
                      transition: 'all 0.15s',
                      flexShrink: 0,
                    }}
                  >
                    {listening ? '🔴' : '🎙️'}
                  </button>
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
                </div>
                {/* Disclaimer */}
                <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 8 }}>
                  Haribon is scoped to DASIG knowledge · Not a general-purpose AI
                </div>
              </div>}
            </div>
            </div>

            {/* Info strip */}
            <div style={{
              marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10,
            }}>
              {[
                { icon: '🎯', title: '100% Accuracy', desc: 'Precision NLP intent recognition scoped to DASIG knowledge' },
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
