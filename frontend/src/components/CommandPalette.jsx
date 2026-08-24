import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MODULE_ITEMS = [
  { id: 'prog', title: 'Events & Programs', desc: 'Browse summits, workshops, and seminars', path: '/programs?tab=events', icon: '📅', category: 'Modules' },
  { id: 'tr', title: 'Training Programs', desc: 'Professional development and IT tracks', path: '/programs?tab=training', icon: '🎓', category: 'Modules' },
  { id: 'cal', title: 'Portal Calendar', desc: 'Interactive monthly consortium calendar', path: '/programs?tab=calendar', icon: '🗓️', category: 'Modules' },
  { id: 'news', title: 'News & Announcements', desc: 'Latest updates and research news', path: '/news', icon: '📰', category: 'Modules' },
  { id: 'mem', title: 'Member Institutions', desc: 'Directory of Region VII HEIs and agencies', path: '/members', icon: '🏛️', category: 'Modules' },
  { id: 'ai', title: 'Haribon AI Assistant', desc: 'Ask questions about DASIG and programs', path: '/chatbot', icon: '🦅', category: 'AI Tools' },
  { id: 'mship', title: 'Membership Application', desc: 'Join or renew institutional membership', path: '/membership', icon: '👥', category: 'Modules' },
  { id: 'fund', title: 'Funding Opportunities', desc: 'Grants, scholarships, and funds', path: '/funding', icon: '💰', category: 'Modules' },
  { id: 'pol', title: 'Consortium Policies', desc: 'Guidelines, charters, and governance documents', path: '/policies', icon: '📋', category: 'Modules' },
  { id: 'part', title: 'Partnerships', desc: 'Strategic collaborations and MoUs', path: '/partnerships', icon: '🤝', category: 'Modules' },
  { id: 'prof', title: 'User Profile & Registrations', desc: 'Manage account, view bookings and certificates', path: '/profile', icon: '👤', category: 'Account' },
];

const ADMIN_ITEMS = [
  { id: 'adm-dash', title: 'Admin: Dashboard Overview', desc: 'System stats and activity metrics', path: '/admin?tab=dashboard', icon: '📊', category: 'Admin' },
  { id: 'adm-users', title: 'Admin: User Management', desc: 'Manage roles, activate, or suspend users', path: '/admin?tab=users', icon: '👥', category: 'Admin' },
  { id: 'adm-apps', title: 'Admin: Membership Applications', desc: 'Review and approve/reject applications', path: '/admin?tab=applications', icon: '📝', category: 'Admin' },
  { id: 'adm-events', title: 'Admin: Events Management', desc: 'Create events and track attendees', path: '/admin?tab=events', icon: '📅', category: 'Admin' },
  { id: 'adm-news', title: 'Admin: News Management', desc: 'Publish and archive news articles', path: '/admin?tab=news', icon: '📰', category: 'Admin' },
  { id: 'adm-tr', title: 'Admin: Training Management', desc: 'Manage training programs and enrollees', path: '/admin?tab=training', icon: '🎓', category: 'Admin' },
  { id: 'adm-rep', title: 'Admin: Analytics & Reports', desc: 'Charts, fill rates, and chatbot accuracy', path: '/admin?tab=reports', icon: '📈', category: 'Admin' },
  { id: 'adm-msgs', title: 'Admin: Contact Messages', desc: 'Inbox of inquiries and feedback', path: '/admin?tab=messages', icon: '✉️', category: 'Admin' },
];

export default function CommandPalette({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef(null);

  const allItems = user?.role === 'ADMIN' ? [...MODULE_ITEMS, ...ADMIN_ITEMS] : MODULE_ITEMS;

  const filtered = query.trim() === ''
    ? allItems
    : allItems.filter(item =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.desc.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
      );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx(prev => (prev + 1) % Math.max(1, filtered.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx(prev => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[activeIdx]) {
          navigate(filtered[activeIdx].path);
          onClose();
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, activeIdx, navigate, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '12vh 20px 20px',
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0d1424',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          borderRadius: 20,
          width: '100%',
          maxWidth: 620,
          boxShadow: '0 32px 100px rgba(0,0,0,0.85), 0 0 0 1px rgba(249,115,22,0.2)',
          overflow: 'hidden',
          animation: 'modalIn 0.22s cubic-bezier(0.34, 1.3, 0.64, 1)',
        }}
      >
        {/* Search header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <span style={{ fontSize: 18, color: '#f97316' }}>🔍</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search modules... (e.g. events, news, admin)"
            value={query}
            onChange={e => { setQuery(e.target.value); setActiveIdx(0); }}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: 15,
              fontWeight: 600,
              fontFamily: 'inherit',
              outline: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: 4 }}>
            <span style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 5, padding: '2px 6px', fontSize: 10.5, color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>ESC</span>
          </div>
        </div>

        {/* Results List */}
        <div style={{ maxHeight: 360, overflowY: 'auto', padding: '8px' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 0', color: 'rgba(255,255,255,0.4)', fontSize: 13.5 }}>
              No matches found for "{query}"
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === activeIdx;
              return (
                <div
                  key={item.id}
                  onClick={() => { navigate(item.path); onClose(); }}
                  onMouseEnter={() => setActiveIdx(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '11px 14px',
                    borderRadius: 12,
                    background: isSelected ? 'rgba(249,115,22,0.14)' : 'transparent',
                    border: `1px solid ${isSelected ? 'rgba(249,115,22,0.3)' : 'transparent'}`,
                    cursor: 'pointer',
                    transition: 'all 0.1s',
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 9,
                      background: isSelected ? 'linear-gradient(135deg,#f97316,#e11d48)' : 'rgba(255,255,255,0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 17,
                      flexShrink: 0,
                    }}
                  >
                    {item.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 800, color: '#fff', fontSize: 13.5 }}>{item.title}</span>
                      <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: 4 }}>{item.category}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                      {item.desc}
                    </div>
                  </div>
                  {isSelected && (
                    <span style={{ fontSize: 12, color: '#fb923c', fontWeight: 800 }}>Jump ↵</span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts info */}
        <div style={{ padding: '10px 16px', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11.5, color: 'rgba(255,255,255,0.35)' }}>
          <div style={{ display: 'flex', gap: 14 }}>
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span>DASIG Quick Search</span>
        </div>
      </div>
    </div>
  );
}

