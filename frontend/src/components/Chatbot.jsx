import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import HaribonFace from './HaribonFace';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { solveClientQuery } from '../lib/haribonEngine';
import { SUPPORTED_LANGUAGES, getLangByKey, translateMessageText, getLocalizedGreeting, getLocalizedUI, LANG_CHIPS } from '../lib/languages';


/* ── Slash commands for developer/power-user UX ─ */
const SLASH_COMMANDS = [
  { cmd: '/events', label: 'View upcoming consortium summits & conferences', q: 'What events are coming up in Region VII?' },
  { cmd: '/training', label: 'View accredited faculty training programs', q: 'What faculty training bootcamps are open for enrollment?' },
  { cmd: '/grants', label: 'Query open DOST-7 research grants & calls', q: 'What funding opportunities and research grants exist?' },
  { cmd: '/members', label: 'List partner HEIs (CIT-U, UPV, USA)', q: 'Who are the DASIG member institutions?' },
  { cmd: '/policies', label: 'Show Data Privacy & IP sharing accords', q: 'What governance policies and charters are active?' },
  { cmd: '/clear', label: 'Clear current conversation and reset', q: '__CLEAR__' },
];

/* ── Rich navigation card metadata for interactive deep links ─ */
const NAV_CARD_INFO = {
  '/events':       { icon: '📅', title: 'Upcoming Events', desc: 'Browse summits, conferences, and technical symposiums' },
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
function formatTime(d) {
  if (!d) return '';
  const dateObj = d instanceof Date ? d : new Date(d);
  if (isNaN(dateObj.getTime())) return '';
  return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}


/* ── Bot-text formatter (Rich Markdown, Headings, Code, Bullets) ─ */
function WBotText({ text, onNavigate, isStreaming = false }) {
  const navigate = useNavigate();
  if (!text && !isStreaming) return null;

  function renderInline(str) {
    if (!str) return '';
    const parts = str.split(/(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|\*[^*]+\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
        return (
          <code key={i} style={{
            background: 'rgba(255,255,255,0.08)',
            color: '#fb923c',
            border: '1px solid rgba(249,115,22,0.25)',
            padding: '1px 5px',
            borderRadius: 5,
            fontSize: '0.85em',
            fontFamily: 'monospace',
          }}>
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return <strong key={i} style={{ color: '#fff', fontWeight: 800 }}>{part.slice(2, -2)}</strong>;
      }
      // Markdown link: [label](url) — internal app paths navigate via the
      // router instead of a full page reload; external URLs open in a new tab.
      const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
      if (linkMatch) {
        const [, label, href] = linkMatch;
        const isInternal = href.startsWith('/');
        const linkStyle = { color: '#fb923c', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer' };
        return isInternal ? (
          <a key={i} href={href} onClick={e => { e.preventDefault(); navigate(href); onNavigate && onNavigate(); }} style={linkStyle}>{label}</a>
        ) : (
          <a key={i} href={href} target="_blank" rel="noopener noreferrer" style={linkStyle}>{label}</a>
        );
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
        return <em key={i} style={{ fontStyle: 'italic' }}>{part.slice(1, -1)}</em>;
      }
      return part;
    });
  }

  const blocks = text.split('\n\n').filter(Boolean);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {blocks.map((block, bi) => {
        const lines = block.split('\n').filter(l => l.trim());
        return (
          <div key={bi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {lines.map((line, li) => {
              const t = line.trim();

              // Markdown H3: ### Title
              if (t.startsWith('### ')) {
                return (
                  <div key={li} style={{ fontWeight: 800, color: '#fff', fontSize: 13, marginTop: li > 0 ? 4 : 0 }}>
                    {renderInline(t.slice(4))}
                  </div>
                );
              }

              // Markdown H2: ## Title
              if (t.startsWith('## ')) {
                return (
                  <div key={li} style={{ fontWeight: 900, color: '#fff', fontSize: 13.5, marginTop: li > 0 ? 5 : 0 }}>
                    {renderInline(t.slice(3))}
                  </div>
                );
              }

              // Bullet list: • or -
              if (t.startsWith('•') || t.startsWith('- ')) {
                const bulletContent = t.startsWith('•') ? t.slice(1).trim() : t.slice(2).trim();
                return (
                  <div key={li} style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                    <span style={{ color: '#f97316', flexShrink: 0, fontSize: 10, marginTop: 3 }}>▸</span>
                    <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12, lineHeight: 1.55 }}>
                      {renderInline(bulletContent)}
                    </span>
                  </div>
                );
              }

              // Numbered list: 1. 2.
              if (/^\d+\./.test(t)) {
                const num = t.match(/^(\d+)\./)[1];
                const content = t.replace(/^\d+\.\s*/, '');
                return (
                  <div key={li} style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                    <span style={{ color: '#f97316', flexShrink: 0, fontWeight: 800, minWidth: 14, fontSize: 11.5, lineHeight: 1.55 }}>
                      {num}.
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12, lineHeight: 1.55 }}>
                      {renderInline(content)}
                    </span>
                  </div>
                );
              }

              // Section header
              if ((t.endsWith(':') && t.length < 55) || /^[\u{1F300}-\u{1FAFF}]/u.test(t)) {
                return (
                  <div key={li} style={{ fontWeight: 800, color: '#fff', fontSize: 12.5, marginTop: li > 0 ? 3 : 0 }}>
                    {renderInline(t)}
                  </div>
                );
              }

              return (
                <div key={li} style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, lineHeight: 1.55 }}>
                  {renderInline(t)}
                </div>
              );
            })}
          </div>
        );
      })}
      {isStreaming && (
        <span style={{
          display: 'inline-block',
          width: 7,
          height: 14,
          background: 'linear-gradient(180deg,#f97316,#ea580c)',
          marginLeft: 3,
          verticalAlign: 'text-bottom',
          animation: 'blink 0.75s infinite',
          borderRadius: 2,
          boxShadow: '0 0 8px rgba(249,115,22,0.9)',
        }} />
      )}
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
    opacity: 0.65;
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
  .w-action-btn.speaking { background: rgba(249,115,22,0.2) !important; border-color: rgba(249,115,22,0.4) !important; color: #fb923c !important; }
  .w-voice-dot { display: inline-block; width: 3px; height: 3px; border-radius: 50%; background: #fb923c; animation: blink 0.9s infinite; }

  @media (max-width: 480px) {
    .w-chat-container {
      bottom: 74px !important;
      right: 8px !important;
      left: 8px !important;
      width: auto !important;
      max-width: calc(100vw - 16px) !important;
      max-height: calc(100vh - 86px) !important;
      border-radius: 18px !important;
    }
    .w-launcher-btn {
      bottom: 16px !important;
      right: 14px !important;
      width: 52px !important;
      height: 52px !important;
    }
  }
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
  const rb           = ROLE_BADGE[role] || ROLE_BADGE.GUEST;

  // All hooks MUST be declared before any conditional return
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState(() => [{ from:'bot', text: getLocalizedGreeting(user, 'en'), time: new Date() }]);
  const [input, setInput]       = useState('');
  const [thinking, setThinking] = useState(false);
  const [ended, setEnded]       = useState(false);
  const [unread, setUnread]     = useState(0);
  const [hasReplied, setHasReplied] = useState(false);
  const [ratings, setRatings]   = useState({});
  const [copied, setCopied]     = useState(null);
  const [speakingIdx, setSpeakingIdx] = useState(null);
  const [listening, setListening] = useState(false);
  const [activeLang, setActiveLang] = useState('en');
  const [translations, setTranslations] = useState({});
  const [translatingIdx, setTranslatingIdx] = useState(null);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const ui = getLocalizedUI(activeLang, user?.name);

  const handleLanguageChange = async (newLang) => {
    setActiveLang(newLang);
    setShowLangMenu(false);

    // 1. Immediately update initial greeting in messages[0]
    setMessages(prev => {
      if (!prev || prev.length === 0) return prev;
      const updated = [...prev];
      if (updated[0]?.from === 'bot') {
        updated[0] = {
          ...updated[0],
          text: getLocalizedGreeting(user, newLang),
        };
      }
      return updated;
    });

    // 2. Auto-translate subsequent bot messages into newLang
    setMessages(currentMsgs => {
      currentMsgs.forEach(async (m, idx) => {
        if (idx > 0 && m.from === 'bot' && m.text) {
          try {
            setTranslatingIdx(idx);
            const res = await translateMessageText(m.text, newLang);
            setTranslations(prev => ({
              ...prev,
              [idx]: {
                translatedText: res,
                targetLang: newLang,
                isShowingTranslated: true,
              }
            }));
          } catch (err) {
            console.warn('Auto translation failed for msg', idx, err);
          } finally {
            setTranslatingIdx(null);
          }
        }
      });
      return currentMsgs;
    });
  };
  const recognitionRef          = useRef(null);
  const msgsRef                 = useRef(null);
  const streamIntervalRef       = useRef(null);

  useEffect(() => {
    return () => {
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
    };
  }, []);

  // Reset chat when user changes (login/logout)
  useEffect(() => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setSpeakingIdx(null);
    setMessages([{ from:'bot', text: getLocalizedGreeting(user, activeLang), time: new Date() }]);
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
  function newChat() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setSpeakingIdx(null);
    setMessages([{ from:'bot', text: getLocalizedGreeting(user, activeLang), time: new Date() }]);
    setEnded(false); setInput(''); setHasReplied(false);
  }

  async function toggleTranslate(idx, originalText) {
    const current = translations[idx];
    if (current?.isShowingTranslated) {
      setTranslations(prev => ({
        ...prev,
        [idx]: { ...prev[idx], isShowingTranslated: false },
      }));
      return;
    }

    if (current?.translatedText && current?.targetLang === activeLang) {
      setTranslations(prev => ({
        ...prev,
        [idx]: { ...prev[idx], isShowingTranslated: true },
      }));
      return;
    }

    setTranslatingIdx(idx);
    try {
      const res = await translateMessageText(originalText, activeLang);
      setTranslations(prev => ({
        ...prev,
        [idx]: {
          translatedText: res,
          targetLang: activeLang,
          isShowingTranslated: true,
        },
      }));
    } catch (err) {
      console.warn('Translation error:', err);
    } finally {
      setTranslatingIdx(null);
    }
  }

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

  function speakMessage(idx, text) {
    if (!('speechSynthesis' in window)) return;
    if (speakingIdx === idx) {
      window.speechSynthesis.cancel();
      setSpeakingIdx(null);
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = (text || '').replace(/[*_#`[\]()]/g, '');
    const utter = new SpeechSynthesisUtterance(cleanText);
    const voices = window.speechSynthesis.getVoices() || [];
    const isPH = /maayong|salamat|unsa|kinsa|kanus|daghan|kamusta|kumusta|magandang|po|opo|kailan|paano|sumali|miyembro/i.test(cleanText);
    const phVoice = isPH ? voices.find(v => /fil|tl|ceb|tgl|tagalog/i.test(v.lang) || /filipino|tagalog/i.test(v.name)) : null;
    const best = phVoice ||
                 voices.find(v => /natural|neural|online/i.test(v.name) && /en/i.test(v.lang)) ||
                 voices.find(v => /google/i.test(v.name) && /en/i.test(v.lang)) ||
                 voices.find(v => /en[-_]us|en[-_]ph|en[-_]gb/i.test(v.lang));
    if (best) utter.voice = best;
    utter.rate = 1.0;
    utter.onend = () => setSpeakingIdx(null);
    utter.onerror = () => setSpeakingIdx(null);
    setSpeakingIdx(idx);
    window.speechSynthesis.speak(utter);
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

  function streamBotResponse(botTemplate, fullReply) {
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }

    if (!fullReply) {
      setMessages(prev => [...prev, { ...botTemplate, text: '', isStreaming: false }]);
      return;
    }

    setMessages(prev => [...prev, { ...botTemplate, text: '', isStreaming: true }]);

    let currentLength = 0;
    const step = Math.max(3, Math.ceil(fullReply.length / 45));
    streamIntervalRef.current = setInterval(() => {
      currentLength += step;
      if (currentLength >= fullReply.length) {
        clearInterval(streamIntervalRef.current);
        streamIntervalRef.current = null;
        setMessages(prev => {
          const next = [...prev];
          const lastIdx = next.length - 1;
          if (lastIdx >= 0 && next[lastIdx].from === 'bot') {
            next[lastIdx] = { ...next[lastIdx], text: fullReply, isStreaming: false };
          }
          return next;
        });
      } else {
        const slice = fullReply.slice(0, currentLength);
        setMessages(prev => {
          const next = [...prev];
          const lastIdx = next.length - 1;
          if (lastIdx >= 0 && next[lastIdx].from === 'bot') {
            next[lastIdx] = { ...next[lastIdx], text: slice, isStreaming: true };
          }
          return next;
        });
      }
    }, 20);
  }

  function exportSummary() {
    const transcript = messages.map(m => `[${m.from === 'bot' ? 'Haribon AI' : 'User'}]: ${m.text}`).join('\n\n');
    navigator.clipboard.writeText(transcript).then(() => {
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    }).catch(() => {});
  }

  async function send(text) {
    const rawText = (text || input).trim();
    if (!rawText || thinking) return;

    if (rawText === '/clear' || rawText === '__CLEAR__') {
      newChat();
      setInput('');
      return;
    }

    const t = rawText;

    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
      setMessages(prev => {
        const next = [...prev];
        const lastIdx = next.length - 1;
        if (lastIdx >= 0 && next[lastIdx].from === 'bot' && next[lastIdx].isStreaming) {
          next[lastIdx] = { ...next[lastIdx], isStreaming: false };
        }
        return next;
      });
    }

    setInput('');
    setMessages(prev => [...prev, { from:'user', text:t, time: new Date() }]);
    setThinking(true);

    const historyPayload = messages
      .filter(m => m.text)
      .slice(-8)
      .map(m => ({
        role: m.from === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

    try {
      const res = await api.chatbot.send(t, historyPayload, activeLang);
      setHasReplied(true);
      setThinking(false);

      let replyText = res.reply;
      if (activeLang !== 'en') {
        try {
          replyText = await translateMessageText(res.reply, activeLang);
        } catch (e) {
          console.warn('[chatbot] Auto-translation to activeLang failed:', e);
        }
      }

      const botTemplate = {
        from: 'bot',
        followups: res.followups || [],
        navigate_to: res.navigate_to || null,
        matched: res.matched,
        suggestions: res.suggestions || [],
        time: new Date(),
      };

      streamBotResponse(botTemplate, replyText);
    } catch (err) {
      console.warn('[chatbot-widget] Backend unavailable, using client high-IQ engine:', err);
      const fallback = solveClientQuery(t, historyPayload, user);
      setHasReplied(true);
      setThinking(false);

      let replyText = fallback.reply;
      if (activeLang !== 'en') {
        try {
          replyText = await translateMessageText(fallback.reply, activeLang);
        } catch (e) {
          console.warn('[chatbot] Auto-translation to activeLang fallback failed:', e);
        }
      }

      const botTemplate = {
        from: 'bot',
        followups: fallback.followups || [],
        navigate_to: fallback.navigate_to || null,
        matched: true,
        suggestions: fallback.suggestions || [],
        time: new Date(),
      };

      streamBotResponse(botTemplate, replyText);
    } finally {
      setTimeout(() => msgsRef.current && (msgsRef.current.scrollTop = msgsRef.current.scrollHeight), 50);
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
        <div className="w-chat-container" style={{
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
            background: 'linear-gradient(135deg,#001233,#0f2d6b 55%,#1e40af)',
            padding: '11px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            position: 'relative', overflow: 'hidden', flexShrink: 0,
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ position:'absolute', right:-14, top:-14, width:80, height:80, borderRadius:'50%', background:'radial-gradient(rgba(249,115,22,0.25),transparent)', pointerEvents:'none' }} />

            {/* Left: Haribon Identity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, overflow: 'hidden', flexShrink: 0, border: '2px solid rgba(255,255,255,0.25)', boxShadow: '0 2px 10px rgba(0,0,0,0.4)' }}>
                <HaribonFace size={36} />
              </div>

              <div style={{ minWidth: 0, lineHeight: 1.25 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#fff', fontWeight: 900, fontSize: 13.5, letterSpacing: '-0.2px' }}>Haribon AI</span>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block', boxShadow: '0 0 6px #4ade80' }} />
                </div>
                <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 10.5, fontWeight: 600, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Trilingual AI · Eng / Bis / Tag
                </div>
              </div>
            </div>

            {/* Right: User Status & Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              {user && (
                <div
                  title={`Logged in as ${user.name} (${rb.label})`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    background: rb.bg, border: `1px solid ${rb.color}40`,
                    borderRadius: 20, padding: '2px 8px 2px 3px',
                  }}
                >
                  <div style={{ width: 19, height: 19, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                    {user.avatar_url
                      ? <img src={user.avatar_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                      : <div style={{ width:'100%', height:'100%', background:'linear-gradient(135deg,#f97316,#e11d48)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8.5, fontWeight:900, color:'#fff' }}>{initials}</div>
                    }
                  </div>
                  <span style={{ color: rb.color, fontSize: 9.5, fontWeight: 800 }}>{rb.label}</span>
                </div>
              )}

              <button onClick={exportSummary} style={{
                background: copiedSummary ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.08)',
                border: `1px solid ${copiedSummary ? 'rgba(16,185,129,0.45)' : 'rgba(255,255,255,0.18)'}`,
                borderRadius:8, padding:'4px 8px', fontSize:11, fontWeight:700,
                color: copiedSummary ? '#34d399' : '#fff', cursor:'pointer', fontFamily:'inherit',
                transition:'all .13s',
              }}
              title="Copy entire chat transcript"
              >{copiedSummary ? ui.copied : ui.copy}</button>

              <button onClick={newChat} style={{
                background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.18)',
                borderRadius:8, padding:'4px 8px', fontSize:11, fontWeight:700,
                color:'rgba(255,255,255,0.85)', cursor:'pointer', fontFamily:'inherit',
                transition:'all .13s',
              }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.18)'}
              onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.08)'}
              title="Start a fresh chat"
              >{ui.reset}</button>

              <button onClick={() => {
                sessionStorage.setItem('haribon_resume', JSON.stringify(messages));
                setOpen(false);
                navigate('/chatbot');
              }} style={{
                background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.22)',
                borderRadius:8, padding:'4px 9px', fontSize:11, fontWeight:700,
                color:'#fff', cursor:'pointer', fontFamily:'inherit',
                transition:'all .13s',
              }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.22)'}
              onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.12)'}
              title="Expand to Full Chatbot Page"
              >{ui.full}</button>

              {ended ? (
                <button onClick={newChat} style={{ background:'rgba(249,115,22,0.2)', border:'1px solid rgba(249,115,22,0.4)', borderRadius:8, padding:'4px 9px', fontSize:10.5, fontWeight:700, color:'#f97316', cursor:'pointer', fontFamily:'inherit' }}>New</button>
              ) : (
                <button
                  onClick={() => setOpen(false)}
                  style={{
                    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 8, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
                    transition: 'all .13s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background='rgba(239,68,68,0.2)'; e.currentTarget.style.color='#f87171'; }}
                  onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.08)'; e.currentTarget.style.color='rgba(255,255,255,0.7)'; }}
                  title="Minimize Chat"
                >✕</button>
              )}
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
                      padding: msg.from === 'bot' ? '11px 14px' : '9px 13px',
                      borderRadius:15, fontSize:12.5,
                      lineHeight:1.6,
                      ...(msg.from === 'bot'
                        ? { background:'rgba(16,24,44,0.95)', borderBottomLeftRadius:4, border:'1px solid rgba(255,255,255,0.09)', boxShadow:'0 4px 16px rgba(0,0,0,0.3)' }
                        : { background:'linear-gradient(135deg,#f97316,#ea580c)', color:'#fff', borderBottomRightRadius:4, boxShadow:'0 4px 16px rgba(249,115,22,0.32)' }
                      ),
                    }}>
                      {msg.from === 'bot' ? (
                        <>
                          {translations[i]?.isShowingTranslated && translations[i]?.translatedText && (
                            <div style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              background: 'rgba(249, 115, 22, 0.15)', border: '1px solid rgba(249, 115, 22, 0.35)',
                              borderRadius: 7, padding: '3px 8px', marginBottom: 8, fontSize: 10, color: '#f97316', fontWeight: 800,
                            }}>
                              <span>🌐 {ui.translatedTo} {getLangByKey(translations[i].targetLang).name}</span>
                              <button
                                onClick={() => toggleTranslate(i, msg.text)}
                                style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', padding: 0, fontSize: 10, textDecoration: 'underline', fontWeight: 700 }}
                              >
                                Show original
                              </button>
                            </div>
                          )}
                          <WBotText text={translations[i]?.isShowingTranslated && translations[i]?.translatedText ? translations[i].translatedText : msg.text} onNavigate={() => setOpen(false)} isStreaming={msg.isStreaming} />
                        </>
                      ) : <span style={{ lineHeight:1.55 }}>{msg.text}</span>}
                    </div>
                    {msg.time && (
                      <div style={{
                        fontSize: 9.5,
                        color: 'rgba(255,255,255,0.38)',
                        marginTop: 3,
                        paddingLeft: msg.from === 'bot' ? 4 : 0,
                        paddingRight: msg.from === 'user' ? 4 : 0,
                        fontWeight: 500,
                      }}>
                        {formatTime(msg.time)}
                      </div>
                    )}

                    {/* Rating, Copy & Voice Read actions for bot messages */}
                    {msg.from === 'bot' && i > 0 && !msg.isStreaming && (
                      <div className="w-msg-actions">
                        <button
                          className={`w-action-btn${ratings[i] === 'up' ? ' rated-up' : ''}`}
                          onClick={() => rateMessage(i, 'up')}
                        >
                          👍{ratings[i] === 'up' ? ` ${ui.helpful}` : ''}
                        </button>
                        <button
                          className={`w-action-btn${ratings[i] === 'down' ? ' rated-down' : ''}`}
                          onClick={() => rateMessage(i, 'down')}
                        >
                          👎{ratings[i] === 'down' ? ` ${ui.notHelpful}` : ''}
                        </button>
                        <button
                          className={`w-action-btn${copied === i ? ' copied' : ''}`}
                          onClick={() => copyMessage(i, msg.text)}
                          title="Copy response"
                        >
                          {copied === i ? '✓ Copied' : '⧉'}
                        </button>
                        <button
                          className={`w-action-btn${translations[i]?.isShowingTranslated ? ' active-translate' : ''}`}
                          onClick={() => toggleTranslate(i, msg.text)}
                          title={translations[i]?.isShowingTranslated ? 'Revert to original text' : `Translate to ${getLangByKey(activeLang).name}`}
                          style={translations[i]?.isShowingTranslated ? { color: '#f97316', borderColor: 'rgba(249,115,22,0.4)', background: 'rgba(249,115,22,0.12)' } : undefined}
                        >
                          {translatingIdx === i ? '⏳ Translating…' : translations[i]?.isShowingTranslated ? ui.original : ui.translate}
                        </button>
                        <button
                          className={`w-action-btn${speakingIdx === i ? ' speaking' : ''}`}
                          onClick={() => speakMessage(i, msg.text)}
                          title={speakingIdx === i ? 'Stop voice playback' : 'Read aloud with voice'}
                        >
                          {speakingIdx === i ? (
                            <>
                              <span style={{ display: 'inline-flex', gap: 1.5, alignItems: 'center', marginRight: 2 }}>
                                <span className="w-voice-dot" style={{ animationDelay: '0s' }} />
                                <span className="w-voice-dot" style={{ animationDelay: '0.2s' }} />
                                <span className="w-voice-dot" style={{ animationDelay: '0.4s' }} />
                              </span>
                              <span>⏹</span>
                            </>
                          ) : (
                            <span>🔊</span>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Related suggestions when no intent match found */}
                    {i === messages.length - 1 && msg.from === 'bot' && !ended && !msg.isStreaming && msg.matched === false && msg.suggestions?.length > 0 && (
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
                    {msg.from === 'bot' && i === messages.length - 1 && !thinking && !msg.isStreaming && (
                      <div style={{ marginTop:7, maxWidth:'92%', display:'flex', flexDirection:'column', gap:7 }}>
                        {msg.navigate_to && (() => {
                          const card = NAV_CARD_INFO[msg.navigate_to] || { icon: '🚀', title: 'Open Portal Page', desc: 'Click to view related module details' };
                          return (
                            <div
                              onClick={() => { navigate(msg.navigate_to); setOpen(false); }}
                              style={{
                                background: 'rgba(15,23,42,0.92)',
                                border: '1px solid rgba(249,115,22,0.35)',
                                borderRadius: 10, padding: '8px 12px',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                                transition: 'all 0.16s ease',
                                boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.borderColor = 'rgba(249,115,22,0.7)';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.borderColor = 'rgba(249,115,22,0.35)';
                                e.currentTarget.style.transform = 'none';
                              }}
                            >
                              <div style={{
                                width: 28, height: 28, borderRadius: 7,
                                background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.35)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 15, flexShrink: 0,
                              }}>{card.icon}</div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ color: '#fff', fontWeight: 800, fontSize: 11.5 }}>{card.title}</div>
                                <div style={{ color: 'rgba(255,255,255,0.48)', fontSize: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{card.desc}</div>
                              </div>
                              <div style={{ color: '#f97316', fontWeight: 800, fontSize: 11, display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                                <span>Open</span>
                                <span>→</span>
                              </div>
                            </div>
                          );
                        })()}
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

          {/* ── Language Switcher Bar & Quick Prompts ── */}
          {!ended && (
            <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', background:'rgba(0,0,0,0.2)', padding:'6px 12px' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 4, position: 'relative' }}>
                <span style={{ fontSize:10, color:'rgba(255,255,255,0.45)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.5px', display:'flex', alignItems:'center', gap:4 }}>
                  <span>🌐</span> {ui.language}:
                </span>
                <div style={{ display:'flex', gap:3, alignItems:'center', flexWrap:'wrap' }}>
                  {SUPPORTED_LANGUAGES.slice(0, 4).map(l => (
                    <button
                      key={l.key}
                      onClick={() => handleLanguageChange(l.key)}
                      style={{
                        background: activeLang === l.key ? 'rgba(249,115,22,0.22)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${activeLang === l.key ? 'rgba(249,115,22,0.5)' : 'rgba(255,255,255,0.08)'}`,
                        color: activeLang === l.key ? '#fb923c' : 'rgba(255,255,255,0.55)',
                        borderRadius: 6, padding: '2px 6px', fontSize: 9.5, fontWeight: 800,
                        cursor: 'pointer', fontFamily: 'inherit', display:'flex', alignItems:'center', gap:3,
                      }}
                      title={l.name}
                    >
                      <span>{l.flag}</span>
                      <span>{l.short}</span>
                    </button>
                  ))}

                  <button
                    onClick={() => setShowLangMenu(m => !m)}
                    style={{
                      background: showLangMenu || !SUPPORTED_LANGUAGES.slice(0, 4).some(l => l.key === activeLang) ? 'rgba(249,115,22,0.25)' : 'rgba(255,255,255,0.06)',
                      border: `1px solid ${showLangMenu || !SUPPORTED_LANGUAGES.slice(0, 4).some(l => l.key === activeLang) ? '#f97316' : 'rgba(255,255,255,0.12)'}`,
                      color: '#fff',
                      borderRadius: 6, padding: '2px 7px', fontSize: 9.5, fontWeight: 800,
                      cursor: 'pointer', fontFamily: 'inherit', display:'flex', alignItems:'center', gap:3,
                    }}
                    title="Select from all 14+ languages"
                  >
                    <span>{getLangByKey(activeLang).flag}</span>
                    <span>{getLangByKey(activeLang).short}</span>
                    <span style={{ fontSize: 8 }}>{showLangMenu ? '▲' : '▼'}</span>
                  </button>
                </div>

                {/* All Languages Popover Menu */}
                {showLangMenu && (
                  <div style={{
                    position: 'absolute', bottom: '100%', right: 0, left: 0, marginBottom: 8,
                    background: 'rgba(11, 19, 41, 0.98)', backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(249,115,22,0.3)', borderRadius: 12,
                    padding: 10, boxShadow: '0 12px 36px rgba(0,0,0,0.85)', zIndex: 120,
                    maxHeight: 190, overflowY: 'auto',
                  }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 8, paddingBottom: 4, borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: '#f97316', textTransform: 'uppercase', letterSpacing: '.5px' }}>
                        {ui.allLanguages} ({SUPPORTED_LANGUAGES.length})
                      </span>
                      <button onClick={() => setShowLangMenu(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 12 }}>✕</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 5 }}>
                      {SUPPORTED_LANGUAGES.map(l => (
                        <button
                          key={l.key}
                          onClick={() => handleLanguageChange(l.key)}
                          style={{
                            background: activeLang === l.key ? 'rgba(249,115,22,0.25)' : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${activeLang === l.key ? 'rgba(249,115,22,0.5)' : 'rgba(255,255,255,0.07)'}`,
                            color: activeLang === l.key ? '#fb923c' : 'rgba(255,255,255,0.8)',
                            borderRadius: 6, padding: '5px 8px', fontSize: 10.5, fontWeight: 700,
                            cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                            display: 'flex', alignItems: 'center', gap: 6,
                          }}
                        >
                          <span style={{ fontSize: 13 }}>{l.flag}</span>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {!hasReplied && (
                <div style={{ display:'flex', gap:5, flexWrap:'wrap', maxHeight: 85, overflowY: 'auto', paddingTop: 2 }}>
                  {(LANG_CHIPS[activeLang] || LANG_CHIPS.en).map(({ label, q }) => (
                    <button key={label} className="w-chip" onClick={() => send(q)} disabled={thinking}>{label}</button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Input ── */}
          {!ended && (
            <div style={{ padding:'8px 12px 14px', borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', gap:7, flexShrink:0, alignItems: 'center' }}>
              <div style={{ position:'relative', flex:1, display:'flex' }}>
                {input.startsWith('/') && (
                  <div style={{
                    position:'absolute', bottom:'100%', left:0, right:0, marginBottom:8,
                    background:'#0a1329', border:'1px solid rgba(249,115,22,0.3)',
                    borderRadius:12, padding:'6px', display:'flex', flexDirection:'column', gap:3,
                    boxShadow:'0 16px 40px rgba(0,0,0,0.85)', zIndex:999,
                  }}>
                    <div style={{ fontSize:10, color:'rgba(249,115,22,0.8)', fontWeight:800, padding:'2px 6px', textTransform:'uppercase' }}>
                      ⚡ Haribon Slash Commands
                    </div>
                    {SLASH_COMMANDS.filter(s => s.cmd.startsWith(input.toLowerCase())).map(sc => (
                      <div
                        key={sc.cmd}
                        onClick={() => {
                          if (sc.cmd === '/clear') {
                            newChat();
                            setInput('');
                          } else {
                            send(sc.q);
                          }
                        }}
                        style={{
                          display:'flex', alignItems:'center', justifyContent:'space-between',
                          padding:'6px 8px', borderRadius:8, cursor:'pointer',
                          background:'rgba(255,255,255,0.03)',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background='rgba(249,115,22,0.15)'}
                        onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.03)'}
                      >
                        <span style={{ color:'#fb923c', fontWeight:900, fontSize:12 }}>{sc.cmd}</span>
                        <span style={{ color:'rgba(255,255,255,0.6)', fontSize:11 }}>{sc.label}</span>
                      </div>
                    ))}
                  </div>
                )}
                <input
                  className="w-input"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !thinking && send()}
                  placeholder={ui.placeholder}
                  disabled={thinking}
                />
              </div>
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
        className="w-launcher-btn"
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
