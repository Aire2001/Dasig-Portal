import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import ParticleBackground from '../components/ParticleBackground';
import HaribonFace from '../components/HaribonFace';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { solveClientQuery } from '../lib/haribonEngine';
import { SUPPORTED_LANGUAGES, getLangByKey, translateMessageText, getLocalizedGreeting, getLocalizedUI, LANG_CHIPS } from '../lib/languages';
import { voicePlayer } from '../lib/audioPlayer.js';

// Renders bot reply text with formatted markdown, headings, bullets, numbered lists, and inline code
function BotText({ text, isStreaming = false }) {
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
            padding: '1.5px 6px',
            borderRadius: 6,
            fontSize: '0.88em',
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
          <a key={i} href={href} onClick={e => { e.preventDefault(); navigate(href); }} style={linkStyle}>{label}</a>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {blocks.map((block, bi) => {
        const lines = block.split('\n').filter(l => l.trim());
        return (
          <div key={bi} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {lines.map((line, li) => {
              const t = line.trim();

              // Markdown H3: ### Title
              if (t.startsWith('### ')) {
                return (
                  <div key={li} style={{ fontWeight: 900, color: '#fff', fontSize: 14.5, marginTop: li > 0 ? 6 : 0, letterSpacing: '-0.2px' }}>
                    {renderInline(t.slice(4))}
                  </div>
                );
              }

              // Markdown H2: ## Title
              if (t.startsWith('## ')) {
                return (
                  <div key={li} style={{ fontWeight: 900, color: '#fff', fontSize: 16, marginTop: li > 0 ? 8 : 0, letterSpacing: '-0.3px' }}>
                    {renderInline(t.slice(3))}
                  </div>
                );
              }

              // Bullet point: • or -
              if (t.startsWith('•') || t.startsWith('- ')) {
                const bulletContent = t.startsWith('•') ? t.slice(1).trim() : t.slice(2).trim();
                return (
                  <div key={li} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                    <span style={{ color: '#f97316', flexShrink: 0, fontSize: 11, marginTop: 4 }}>▸</span>
                    <span style={{ color: 'rgba(255,255,255,0.9)', lineHeight: 1.65 }}>{renderInline(bulletContent)}</span>
                  </div>
                );
              }

              // Numbered list: 1. 2.
              if (/^\d+\./.test(t)) {
                const num = t.match(/^(\d+)\./)[1];
                const content = t.replace(/^\d+\.\s*/, '');
                return (
                  <div key={li} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                    <span style={{ color: '#f97316', flexShrink: 0, fontWeight: 800, minWidth: 18, lineHeight: 1.65 }}>{num}.</span>
                    <span style={{ color: 'rgba(255,255,255,0.9)', lineHeight: 1.65 }}>{renderInline(content)}</span>
                  </div>
                );
              }

              // Section header (short line ending with colon, or starts with emoji)
              if ((t.endsWith(':') && t.length < 65) || /^[\u{1F300}-\u{1FAFF}]/u.test(t)) {
                return (
                  <div key={li} style={{ fontWeight: 800, color: '#fff', fontSize: 13.5, marginTop: li > 0 ? 4 : 0 }}>
                    {renderInline(t)}
                  </div>
                );
              }

              return (
                <div key={li} style={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.7 }}>
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
          width: 8,
          height: 16,
          background: 'linear-gradient(180deg,#f97316,#ea580c)',
          marginLeft: 4,
          verticalAlign: 'text-bottom',
          animation: 'blink 0.75s infinite',
          borderRadius: 2,
          boxShadow: '0 0 10px rgba(249,115,22,0.9)',
        }} />
      )}
    </div>
  );
}

// Slash commands for developer/power-user UX
const SLASH_COMMANDS = [
  { cmd: '/events', label: 'View upcoming consortium summits & conferences', q: 'What events are coming up in Region VII?' },
  { cmd: '/training', label: 'View accredited faculty training programs', q: 'What faculty training bootcamps are open for enrollment?' },
  { cmd: '/grants', label: 'Query open DOST-7 research grants & calls', q: 'What funding opportunities and research grants exist?' },
  { cmd: '/members', label: 'List partner HEIs (CIT-U, UP Cebu, USC)', q: 'Who are the DASIG member institutions?' },
  { cmd: '/policies', label: 'Show Data Privacy & IP sharing accords', q: 'What governance policies and charters are active?' },
  { cmd: '/clear', label: 'Clear current conversation and reset', q: '__CLEAR__' },
];


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
    { label: '🎓 UP Cebu',                 q: 'What programs and research specializations does UP Cebu lead?' },
    { label: '🦅 University of San Carlos', q: 'What is University of San Carlos (USC)\'s role in the consortium?' },
    { label: '📋 Membership Tiers',        q: 'What is the difference between Tier 1 and Tier 2 membership?' },
  ],
  DIALECTS: [
    { label: '🇵🇭 (Bisaya) Mga Kalihokan', q: 'Maayong adlaw! Unsay mga umaabot nga kalihokan sa DASIG karon?' },
    { label: '🇵🇭 (Bisaya) Unsaon Pag-apil', q: 'Unsaon pag-apil sa DASIG isip bag-ong miyembro?' },
    { label: '🇵🇭 (Tagalog) Mga Kaganapan', q: 'Magandang araw! May mga paparating bang event sa konsorsyum?' },
    { label: '🇵🇭 (Tagalog) Pondo ng DOST', q: 'Paano mag-aplay sa DOST research grants para sa unibersidad?' },
  ],
};


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
    opacity: 0.7;
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
  .action-btn.speaking-btn {
    background: rgba(249,115,22,0.2) !important;
    border-color: rgba(249,115,22,0.5) !important;
    color: #fb923c !important;
  }
  @keyframes voicePulse {
    0%, 100% { transform: scale(0.8); opacity: 0.5; }
    50% { transform: scale(1.3); opacity: 1; }
  }
  .voice-dot {
    width: 4px; height: 4px; border-radius: 50%;
    background: #f97316; display: inline-block;
    animation: voicePulse 0.8s infinite ease-in-out;
  }
  .starter-card {
    background: rgba(15,23,42,0.75);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px; padding: 14px 16px;
    cursor: pointer; transition: all 0.2s cubic-bezier(0.34, 1.2, 0.64, 1);
    display: flex; flex-direction: column; gap: 4px;
    text-align: left;
  }
  .starter-card:hover {
    background: rgba(15,23,42,0.95);
    border-color: rgba(249,115,22,0.4);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.4), 0 0 16px rgba(249,115,22,0.12);
  }

  @media (max-width: 768px) {
    .chat-header-bar {
      flex-direction: column !important;
      align-items: stretch !important;
      gap: 12px !important;
    }
    .chat-header-actions {
      margin-left: 0 !important;
      justify-content: flex-start !important;
      width: 100% !important;
    }
    .chat-main-container {
      flex-direction: column !important;
    }
    .chat-history-sidebar {
      width: 100% !important;
      max-height: 250px !important;
    }
    .chat-bubble-user {
      max-width: 92% !important;
    }
    .chat-bubble-bot {
      max-width: 95% !important;
    }
    .chat-quick-grid {
      grid-template-columns: 1fr !important;
    }
    .chat-msgs-area {
      height: 400px !important;
      padding: 16px 14px !important;
    }
  }
`;

function formatTime(d) {
  if (!d) return '';
  const dateObj = d instanceof Date ? d : new Date(d);
  if (isNaN(dateObj.getTime())) return '';
  return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

  const [activeLang, setActiveLang] = useState(() => {
    try {
      return localStorage.getItem('dasig_lang') || 'en';
    } catch {
      return 'en';
    }
  });

  // Resume chat from mini widget if available, otherwise fresh start
  const [messages, setMessages] = useState(() => {
    let initialLang = 'en';
    try {
      initialLang = localStorage.getItem('dasig_lang') || 'en';
    } catch (_) {}
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
    return [{ from:'bot', text: getLocalizedGreeting(user, initialLang), time: new Date() }];
  });
  const [translations, setTranslations] = useState({});
  const [translatingIdx, setTranslatingIdx] = useState(null);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const ui = getLocalizedUI(activeLang, user?.name);

  const handleLanguageChange = async (newLang) => {
    setActiveLang(newLang);
    try {
      localStorage.setItem('dasig_lang', newLang);
    } catch {
      // Ignore storage errors
    }
    setActiveCat('ALL');
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

    // 2. Clear translations if returning to English
    if (newLang === 'en') {
      setTranslations({});
      return;
    }

    // 3. Auto-translate subsequent bot messages into newLang
    messages.forEach(async (m, idx) => {
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
  };
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
    setMessages([{ from:'bot', text: getLocalizedGreeting(user, activeLang), time: new Date() }]);
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
    setMessages([{ from:'bot', text: getLocalizedGreeting(user, activeLang), time: new Date() }]);
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
  const streamIntervalRef = useRef(null);

  useEffect(() => {
    return () => {
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    msgsEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  function streamBotResponse(botTemplate, fullReply) {
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }

    if (!fullReply) {
      setMessages(prev => [...prev, { ...botTemplate, text: '', isStreaming: false }]);
      return;
    }

    // Append initial bot message in streaming state
    setMessages(prev => [...prev, { ...botTemplate, text: '', isStreaming: true }]);

    let currentLength = 0;
    const step = Math.max(3, Math.ceil(fullReply.length / 50));
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
          if (autoVoicemail) {
            setTimeout(() => speakMessage(lastIdx, fullReply, activeLang), 200);
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

  async function send(text, isRegenerate = false) {
    const trimmed = (text || input).trim();
    if (!trimmed || thinking) return;

    if (trimmed === '/clear' || trimmed === '__CLEAR__') {
      startNewChat();
      setInput('');
      return;
    }

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
    if (inputRef.current) inputRef.current.style.height = 'auto';
    setSuggestions([]);
    setResumed(false);

    if (!isRegenerate) {
      const userMsg = { from: 'user', text: trimmed, time: new Date() };
      setMessages(prev => [...prev, userMsg]);
    }
    setThinking(true);

    // Prepare multi-turn history payload
    const historyPayload = messages
      .filter(m => m.text)
      .slice(-8)
      .map(m => ({
        role: m.from === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

    try {
      const res = await api.chatbot.send(trimmed, historyPayload, activeLang);
      const newTotal = totalAsked + 1;
      const newMatched = totalMatched + (res.matched ? 1 : 0);
      setTotalAsked(newTotal);
      setTotalMatched(newMatched);
      setMatchRate(Math.round((newMatched / newTotal) * 100));
      setHasReplied(true);
      setThinking(false);

      let replyText = res.reply;
      if (activeLang !== 'en') {
        try {
          replyText = await translateMessageText(res.reply, activeLang);
        } catch (e) {
          console.warn('[chatbot-page] Auto-translation to activeLang failed:', e);
        }
      }

      const botTemplate = {
        from: 'bot',
        intent: res.intent,
        matched: res.matched,
        followups: res.followups || [],
        suggestions: res.suggestions || [],
        navigate_to: res.navigate_to || null,
        time: new Date(),
      };

      streamBotResponse(botTemplate, replyText);
    } catch (err) {
      console.warn('[chatbot] Backend offline or waking up, using Client High-IQ Engine:', err);
      const fallback = solveClientQuery(trimmed, historyPayload, user);
      setHasReplied(true);
      setThinking(false);

      let replyText = fallback.reply;
      if (activeLang !== 'en') {
        try {
          replyText = await translateMessageText(fallback.reply, activeLang);
        } catch (e) {
          console.warn('[chatbot-page] Auto-translation to activeLang fallback failed:', e);
        }
      }

      const botTemplate = {
        from: 'bot',
        intent: fallback.intent,
        matched: true,
        followups: fallback.followups || [],
        suggestions: fallback.suggestions || [],
        navigate_to: fallback.navigate_to || null,
        time: new Date(),
      };

      streamBotResponse(botTemplate, replyText);
    } finally {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.startsWith('/')) {
        const matchedCmd = SLASH_COMMANDS.find(s => s.cmd.toLowerCase() === input.trim().toLowerCase())
          || SLASH_COMMANDS.find(s => s.cmd.toLowerCase().startsWith(input.trim().toLowerCase()));
        if (matchedCmd) {
          if (matchedCmd.cmd === '/clear') {
            startNewChat();
            setInput('');
          } else {
            send(matchedCmd.q);
          }
          return;
        }
      }
      send();
    }
  }

  function endChat() {
    setShowEndConfirm(false);
    setEnded(true);
  }

  function newChat() {
    setMessages([{ from:'bot', text: getLocalizedGreeting(user, activeLang), time: new Date() }]);
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

  const [speakingIdx, setSpeakingIdx] = useState(null);
  const [voiceSpeed, setVoiceSpeed]   = useState(1.0);

  function speakMessage(idx, text, langKey = activeLang) {
    voicePlayer.play(idx, text, langKey, (sIdx) => setSpeakingIdx(sIdx), voiceSpeed);
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
        const userPrompt = messages[i].text;
        setMessages(prev => prev.slice(0, i + 1));
        send(userPrompt, true);
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
      const langObj = getLangByKey(activeLang);
      recognition.lang = langObj.bcp47 || 'en-US';
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
            <div className="chat-header-bar" style={{
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
              <div className="chat-header-actions" style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
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
            <div className="chat-main-container" style={{ display: 'flex', gap: 16, alignItems: 'stretch' }}>

              {/* Left Column: Chat History Sidebar */}
              {showHistory && (
                <aside className="chat-history-sidebar" style={{
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
                <div ref={msgsContainerRef} className="chat-msgs-area" onScroll={handleScroll} style={{ height: 460, overflowY: 'auto', padding: ended ? 0 : '24px 24px 16px', display: 'flex', flexDirection: 'column', gap: ended ? 0 : 14, position: 'relative' }}>
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
                        <span style={{ fontSize: 13, color: '#fff', fontWeight: 800, letterSpacing: '0.2px' }}>Haribon AI</span>
                        <span style={{ fontSize: 10, background: 'rgba(249,115,22,0.18)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 5, padding: '1px 7px', fontWeight: 800 }}>
                          🧠 High-IQ Assistant
                        </span>
                      </div>
                    )}

                    {/* Message bubble */}
                    <div className={msg.from === 'bot' ? 'chat-bubble-bot' : 'chat-bubble-user'} style={{
                      maxWidth: '82%', padding: msg.from === 'bot' ? '16px 20px' : '12px 18px',
                      borderRadius: 18, fontSize: 13.5,
                      ...(msg.from === 'bot' ? {
                        background: 'rgba(12,20,38,0.92)',
                        borderBottomLeftRadius: 5,
                        border: '1px solid rgba(255,255,255,0.09)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
                      } : {
                        background: 'linear-gradient(135deg,#f97316,#ea580c)',
                        color: '#fff', borderBottomRightRadius: 5,
                        boxShadow: '0 4px 16px rgba(249,115,22,0.35)',
                      }),
                    }}>
                      {msg.from === 'bot' ? (
                        <>
                          {translations[i]?.isShowingTranslated && translations[i]?.translatedText && (
                            <div style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              background: 'rgba(249, 115, 22, 0.15)', border: '1px solid rgba(249, 115, 22, 0.35)',
                              borderRadius: 8, padding: '4px 10px', marginBottom: 10, fontSize: 11, color: '#f97316', fontWeight: 800,
                            }}>
                              <span>🌐 {ui.translatedTo} {getLangByKey(translations[i].targetLang).name}</span>
                              <button
                                onClick={() => toggleTranslate(i, msg.text)}
                                style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', padding: 0, fontSize: 11, textDecoration: 'underline', fontWeight: 700 }}
                              >
                                Show original
                              </button>
                            </div>
                          )}
                          <BotText text={translations[i]?.isShowingTranslated && translations[i]?.translatedText ? translations[i].translatedText : msg.text} isStreaming={msg.isStreaming} />
                        </>
                      ) : (
                        <span style={{ lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{msg.text}</span>
                      )}
                    </div>

                    {/* Timestamp */}
                    {msg.time && (
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.42)', marginTop: 4, fontWeight: 500 }}>
                        {formatTime(msg.time)}
                      </div>
                    )}

                    {/* Modern Action Bar: Copy, Voice Read, Feedback, Retry */}
                    {msg.from === 'bot' && !msg.isStreaming && (
                      <div className="msg-actions">
                        {i > 0 && (
                          <>
                            <button
                              className={`action-btn${ratings[i] === 'up' ? ' rated-up' : ''}`}
                              onClick={() => rateMessage(i, 'up')}
                            >
                              👍{ratings[i] === 'up' ? ` ${ui.helpful}` : ''}
                            </button>
                            <button
                              className={`action-btn${ratings[i] === 'down' ? ' rated-down' : ''}`}
                              onClick={() => rateMessage(i, 'down')}
                              title="Not helpful"
                            >
                              👎{ratings[i] === 'down' ? ` ${ui.notHelpful}` : ''}
                            </button>
                          </>
                        )}
                        <button
                          className={`action-btn${copied === i ? ' copied' : ''}`}
                          onClick={() => copyMessage(i, msg.text)}
                          title="Copy response"
                        >
                          {copied === i ? ui.copied : ui.copy}
                        </button>
                        {i > 0 && (
                          <button
                            className={`action-btn${translations[i]?.isShowingTranslated ? ' active-translate' : ''}`}
                            onClick={() => toggleTranslate(i, msg.text)}
                            title={translations[i]?.isShowingTranslated ? 'Revert to original text' : `Translate to ${getLangByKey(activeLang).name}`}
                            style={translations[i]?.isShowingTranslated ? { color: '#f97316', borderColor: 'rgba(249,115,22,0.4)', background: 'rgba(249,115,22,0.12)' } : undefined}
                          >
                            {translatingIdx === i ? '⏳ Translating…' : translations[i]?.isShowingTranslated ? ui.original : ui.translate}
                          </button>
                        )}
                        <button
                          className={`action-btn${speakingIdx === i ? ' speaking-btn' : ''}`}
                          onClick={() => {
                            const textToSpeak = (translations[i]?.isShowingTranslated && translations[i]?.translatedText) ? translations[i].translatedText : msg.text;
                            const langToSpeak = (translations[i]?.isShowingTranslated && translations[i]?.targetLang) ? translations[i].targetLang : activeLang;
                            speakMessage(i, textToSpeak, langToSpeak);
                          }}
                          title={speakingIdx === i ? 'Pause voice playback' : 'Listen with high-fidelity voice'}
                        >
                          {speakingIdx === i ? (
                            <>
                              <span style={{ display: 'inline-flex', gap: 2, alignItems: 'center' }}>
                                <span className="voice-wave-dot" style={{ animationDelay: '0s' }} />
                                <span className="voice-wave-dot" style={{ animationDelay: '0.2s' }} />
                                <span className="voice-wave-dot" style={{ animationDelay: '0.4s' }} />
                              </span>
                              <span>Stop</span>
                            </>
                          ) : (
                            <>🔊 {ui.read}</>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Did you mean? suggestions when unmatched */}
                    {msg.from === 'bot' && i === messages.length - 1 && !thinking && !msg.isStreaming && msg.matched === false && msg.suggestions?.length > 0 && (
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
                    {msg.from === 'bot' && i === messages.length - 1 && !thinking && !msg.isStreaming && (
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
                  {/* Natural Language Switcher */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 6, position: 'relative' }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.5px', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span>🌐</span> {ui.language} / Pinulongan:
                    </div>
                    <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
                      {SUPPORTED_LANGUAGES.slice(0, 5).map(l => (
                        <button
                          key={l.key}
                          onClick={() => handleLanguageChange(l.key)}
                          style={{
                            background: activeLang === l.key ? 'rgba(249,115,22,0.22)' : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${activeLang === l.key ? 'rgba(249,115,22,0.55)' : 'rgba(255,255,255,0.08)'}`,
                            color: activeLang === l.key ? '#fb923c' : 'rgba(255,255,255,0.7)',
                            borderRadius: 8, padding: '4px 10px', fontSize: 11.5, fontWeight: 800,
                            cursor: 'pointer', fontFamily: 'inherit', transition: 'all .14s',
                            display: 'flex', alignItems: 'center', gap: 4,
                          }}
                        >
                          <span>{l.flag}</span>
                          <span>{l.short}</span>
                        </button>
                      ))}

                      {/* More Languages Dropdown Trigger */}
                      <button
                        onClick={() => setShowLangMenu(m => !m)}
                        style={{
                          background: showLangMenu || !SUPPORTED_LANGUAGES.slice(0, 5).some(l => l.key === activeLang) ? 'rgba(249,115,22,0.25)' : 'rgba(255,255,255,0.06)',
                          border: `1px solid ${showLangMenu || !SUPPORTED_LANGUAGES.slice(0, 5).some(l => l.key === activeLang) ? '#f97316' : 'rgba(255,255,255,0.14)'}`,
                          color: '#fff',
                          borderRadius: 8, padding: '4px 11px', fontSize: 11.5, fontWeight: 800,
                          cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5,
                        }}
                      >
                        <span>{getLangByKey(activeLang).flag}</span>
                        <span>{getLangByKey(activeLang).short} ({SUPPORTED_LANGUAGES.length}+)</span>
                        <span style={{ fontSize: 9 }}>{showLangMenu ? '▲' : '▼'}</span>
                      </button>
                    </div>

                    {/* All Languages Popover Menu */}
                    {showLangMenu && (
                      <div style={{
                        position: 'absolute', bottom: '100%', right: 0, left: 0, marginBottom: 8,
                        background: 'rgba(11, 19, 41, 0.98)', backdropFilter: 'blur(16px)',
                        border: '1px solid rgba(249,115,22,0.3)', borderRadius: 14,
                        padding: 12, boxShadow: '0 16px 40px rgba(0,0,0,0.85)', zIndex: 120,
                        maxHeight: 220, overflowY: 'auto',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: '#f97316', textTransform: 'uppercase', letterSpacing: '.5px' }}>
                            {ui.allLanguages} ({SUPPORTED_LANGUAGES.length} Available)
                          </span>
                          <button onClick={() => setShowLangMenu(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 14 }}>✕</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 6 }}>
                          {SUPPORTED_LANGUAGES.map(l => (
                            <button
                              key={l.key}
                              onClick={() => handleLanguageChange(l.key)}
                              style={{
                                background: activeLang === l.key ? 'rgba(249,115,22,0.25)' : 'rgba(255,255,255,0.04)',
                                border: `1px solid ${activeLang === l.key ? 'rgba(249,115,22,0.5)' : 'rgba(255,255,255,0.07)'}`,
                                color: activeLang === l.key ? '#fb923c' : 'rgba(255,255,255,0.8)',
                                borderRadius: 8, padding: '7px 10px', fontSize: 12, fontWeight: 700,
                                cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                                display: 'flex', alignItems: 'center', gap: 8,
                              }}
                            >
                              <span style={{ fontSize: 15 }}>{l.flag}</span>
                              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

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
                  <div className="chat-quick-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: 9 }}>
                    {(activeCat === 'ALL' && activeLang !== 'en'
                      ? (LANG_CHIPS[activeLang] || LANG_CHIPS.en)
                      : (CATEGORIZED_CHIPS[activeCat] || CATEGORIZED_CHIPS.ALL)
                    ).map(({ label, q }) => (
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
                  {/* Slash command popover */}
                  {input.startsWith('/') && (
                    <div style={{
                      position: 'absolute', bottom: '100%', left: 0, right: 0, marginBottom: 8,
                      background: 'rgba(10,16,32,0.98)', border: '1px solid rgba(249,115,22,0.4)',
                      borderRadius: 14, overflow: 'hidden', boxShadow: '0 -16px 48px rgba(0,0,0,0.7)',
                      zIndex: 20, padding: 6, display: 'flex', flexDirection: 'column', gap: 4,
                    }}>
                      <div style={{ fontSize: 11, color: '#fb923c', fontWeight: 800, padding: '4px 10px', textTransform: 'uppercase', letterSpacing: '.5px' }}>
                        ⚡ Haribon Slash Commands
                      </div>
                      {SLASH_COMMANDS.filter(s => s.cmd.startsWith(input.toLowerCase())).map(sc => (
                        <div
                          key={sc.cmd}
                          onClick={() => {
                            if (sc.cmd === '/clear') {
                              startNewChat();
                              setInput('');
                            } else {
                              send(sc.q);
                            }
                          }}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                            background: 'rgba(255,255,255,0.03)',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(249,115,22,0.15)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                        >
                          <span style={{ color: '#fb923c', fontWeight: 900, fontSize: 13 }}>{sc.cmd}</span>
                          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{sc.label}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Autocomplete suggestions dropdown (when not typing slash command) */}
                  {!input.startsWith('/') && suggestions.length > 0 && (
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
                    placeholder={ui.placeholder}
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
