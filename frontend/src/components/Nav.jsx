import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SunSeal from './SunSeal';
import HaribonFace from './HaribonFace';

const NAV_CSS = `
  @keyframes sealSpin   { from { transform: rotateY(0deg) rotateZ(0deg); } to { transform: rotateY(360deg) rotateZ(15deg); } }
  @keyframes sealGlow   { 0%,100%{ filter: drop-shadow(0 0 6px #f97316aa); } 50%{ filter: drop-shadow(0 0 14px #f97316ff) drop-shadow(0 0 28px #f9731644); } }
  @keyframes hariFloat  { 0%,100%{ transform: translateY(0px) rotateZ(-2deg); } 50%{ transform: translateY(-5px) rotateZ(2deg); } }
  @keyframes hariGlow   { 0%,100%{ filter: drop-shadow(0 2px 6px rgba(255,184,0,0.3)); } 50%{ filter: drop-shadow(0 4px 14px rgba(255,184,0,0.7)); } }
  @keyframes navShimmer { 0%{ background-position: -200% center; } 100%{ background-position: 200% center; } }
  @keyframes borderPulse{ 0%,100%{ opacity:0.07; } 50%{ opacity:0.18; } }
  @keyframes textShine  { 0%{ background-position: -200% center; } 100%{ background-position: 200% center; } }
  @keyframes ringPulse  { 0%{ transform:scale(1); opacity:0.6; } 100%{ transform:scale(1.9); opacity:0; } }
  @keyframes dropIn     { from{transform:translateY(-8px);opacity:0} to{transform:translateY(0);opacity:1} }
  @keyframes slideInRight { from{transform:translateX(110%);opacity:0} to{transform:translateX(0);opacity:1} }
  @keyframes fadeOut    { from{opacity:1;transform:translateX(0)} to{opacity:0;transform:translateX(60px)} }
  @keyframes toastDeplete { from{transform:scaleX(1)} to{transform:scaleX(0)} }
  @keyframes modalIn    { from{transform:scale(0.88);opacity:0} to{transform:scale(1);opacity:1} }

  .nav-link {
    background: transparent; color: rgba(255,255,255,0.65);
    border: none; border-radius: 8px; padding: 6px 14px;
    font-size: 13px; cursor: pointer; font-family: inherit;
    transition: all 0.18s; position: relative; overflow: hidden;
  }
  .nav-link::after {
    content:''; position:absolute; bottom:3px; left:50%; transform:translateX(-50%);
    width:0; height:2px; border-radius:2px;
    background:linear-gradient(90deg,#f97316,#e11d48);
    transition: width 0.2s;
  }
  .nav-link:hover { color:#fff; background: rgba(255,255,255,0.09); }
  .nav-link:hover::after { width: 60%; }
`;

const navLinks = [
  { label: 'Programs', to: '/programs'              },
  { label: 'Calendar', to: '/programs?tab=calendar' },
  { label: 'News',     to: '/news'                  },
  { label: 'Members',  to: '/members'               },
  { label: '🦅 Haribon AI', to: '/chatbot', highlight: true },
];

const moreLinks = [
  { label: '👥 Membership',    to: '/membership'   },
  { label: '📋 Policies',      to: '/policies'     },
  { label: '💰 Funding',       to: '/funding'      },
  { label: '🤝 Partnerships',  to: '/partnerships' },
];

const roleColors = {
  ADMIN:  { bg: 'rgba(225,29,72,0.18)',   color: '#f43f5e', text: 'Admin'  },
  MEMBER: { bg: 'rgba(74,222,128,0.15)',  color: '#4ade80', text: 'Member' },
  GUEST:  { bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', text: 'Guest' },
};

export default function Nav() {
  const navigate    = useNavigate();
  const { user, logout } = useAuth();
  const logoRef     = useRef(null);
  const moreRef     = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [logoHover, setLogoHover] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [welcome, setWelcome] = useState(null);   // {name, role} | null
  const welcomeTimer = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Show welcome toast on fresh login (sessionStorage flag set by AuthContext.login/register)
  useEffect(() => {
    if (user) {
      const name = sessionStorage.getItem('dasig_welcome');
      if (name) {
        sessionStorage.removeItem('dasig_welcome');
        setWelcome({ name, role: user.role });
        clearTimeout(welcomeTimer.current);
        welcomeTimer.current = setTimeout(() => setWelcome(null), 3000);
      }
    }
    return () => clearTimeout(welcomeTimer.current);
  }, [user]);

  function onLogoMove(e) {
    const r  = logoRef.current.getBoundingClientRect();
    const cx = r.left + r.width  / 2;
    const cy = r.top  + r.height / 2;
    setTilt({
      x: -((e.clientY - cy) / (r.height / 2)) * 18,
      y:  ((e.clientX - cx) / (r.width  / 2)) * 18,
    });
  }

  function onLogoLeave() {
    setLogoHover(false);
    setTilt({ x: 0, y: 0 });
  }

  function handleLogout() { setLogoutConfirm(true); }
  function confirmLogout() { setLogoutConfirm(false); logout(); navigate('/'); }

  const roleLabel = { ADMIN: 'Administrator', MEMBER: 'Member', GUEST: 'Guest' };
  const roleIcon  = { ADMIN: '🛡️', MEMBER: '🎓', GUEST: '👤' };

  return (
    <>
      <style>{NAV_CSS}</style>

      {/* ── Logout Confirmation Modal ── */}
      {logoutConfirm && (
        <div onClick={() => setLogoutConfirm(false)} style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.65)',
          zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center',
          padding:24, backdropFilter:'blur(6px)',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background:'linear-gradient(180deg,#0f172a 0%,#020817 100%)',
            border:'1px solid rgba(255,255,255,0.1)', borderRadius:22, maxWidth:380, width:'100%',
            boxShadow:'0 32px 100px rgba(0,0,0,0.8)',
            animation:'modalIn 0.22s cubic-bezier(.34,1.56,.64,1)',
            overflow:'hidden',
          }}>
            {/* top band */}
            <div style={{
              background:'linear-gradient(135deg,#1e1b4b,#312e81)',
              padding:'28px 24px 22px', textAlign:'center',
            }}>
              <div style={{ fontSize:48, marginBottom:8 }}>🚪</div>
              <div style={{ color:'#fff', fontSize:20, fontWeight:900 }}>Log Out?</div>
              <div style={{ color:'rgba(255,255,255,0.6)', fontSize:13, marginTop:4 }}>
                You're logged in as <strong style={{ color:'#c7d2fe' }}>{user?.name}</strong>
              </div>
            </div>
            {/* body */}
            <div style={{ padding:'20px 24px 26px' }}>
              <p style={{ color:'rgba(255,255,255,0.5)', fontSize:13.5, textAlign:'center', marginBottom:20, lineHeight:1.6 }}>
                Are you sure you want to log out of the DASIG Portal?
              </p>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setLogoutConfirm(false)} style={{
                  flex:1, background:'rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.65)',
                  border:'1px solid rgba(255,255,255,0.13)', borderRadius:12,
                  padding:'12px', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
                  transition:'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.13)'; e.currentTarget.style.color='#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.07)'; e.currentTarget.style.color='rgba(255,255,255,0.65)'; }}
                >Stay</button>
                <button onClick={confirmLogout} style={{
                  flex:1, background:'linear-gradient(90deg,#e11d48,#7c3aed)',
                  color:'#fff', border:'none', borderRadius:12,
                  padding:'12px', fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:'inherit',
                  boxShadow:'0 4px 16px rgba(225,29,72,0.4)', transition:'all 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity='0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity='1'}
                >Yes, Log Out</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Welcome Toast ── */}
      {welcome && (
        <div style={{
          position:'fixed', top:80, right:24, zIndex:9998,
          background:'linear-gradient(135deg,rgba(0,13,40,0.97),rgba(0,30,80,0.97))',
          border:'1px solid rgba(249,115,22,0.3)',
          borderRadius:16, padding:'14px 18px',
          boxShadow:'0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(249,115,22,0.1)',
          display:'flex', alignItems:'center', gap:14, maxWidth:320,
          animation:'slideInRight 0.35s cubic-bezier(.34,1.56,.64,1)',
        }}>
          {/* icon */}
          <div style={{
            width:44, height:44, borderRadius:12, flexShrink:0,
            background:'linear-gradient(135deg,#f97316,#e11d48)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:22, boxShadow:'0 4px 14px rgba(249,115,22,0.45)',
          }}>
            {roleIcon[welcome.role] || '👋'}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ color:'rgba(255,255,255,0.5)', fontSize:11, fontWeight:700, marginBottom:2 }}>
              WELCOME BACK
            </div>
            <div style={{ color:'#fff', fontSize:14, fontWeight:900, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {welcome.name}
            </div>
            <div style={{ color:'rgba(249,115,22,0.85)', fontSize:11.5, fontWeight:600, marginTop:1 }}>
              {roleLabel[welcome.role] || welcome.role} — DASIG Portal
            </div>
          </div>
          {/* progress bar */}
          <div style={{ position:'absolute', bottom:0, left:0, right:0, height:3, borderRadius:'0 0 16px 16px', background:'rgba(255,255,255,0.08)', overflow:'hidden' }}>
            <div style={{
              height:'100%', background:'linear-gradient(90deg,#f97316,#e11d48)',
              animation:'toastDeplete 3s linear forwards',
              transformOrigin:'left',
              width:'100%',
            }} />
          </div>
          <button onClick={() => setWelcome(null)} style={{
            position:'absolute', top:8, right:10,
            background:'none', border:'none', color:'rgba(255,255,255,0.3)',
            fontSize:14, cursor:'pointer', lineHeight:1, padding:4,
          }}>✕</button>
        </div>
      )}

      <nav style={{
        background: 'linear-gradient(90deg,rgba(0,10,40,0.97) 0%,rgba(0,20,70,0.97) 50%,rgba(0,10,40,0.97) 100%)',
        backdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 999,
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 2px 30px rgba(0,0,0,0.4), 0 0 0 1px rgba(249,115,22,0.06)',
      }}>

        {/* animated bottom border glow */}
        <div style={{
          position:'absolute', bottom:0, left:0, right:0, height:1,
          background:'linear-gradient(90deg,transparent,#f97316,#e11d48,#f97316,transparent)',
          animation:'borderPulse 3s ease-in-out infinite',
        }} />

        <div style={{
          maxWidth: 1120, margin: '0 auto', padding: '0 24px',
          height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'relative',
        }}>

          {/* ── 3D Logo ── */}
          <div
            ref={logoRef}
            onMouseEnter={() => setLogoHover(true)}
            onMouseMove={onLogoMove}
            onMouseLeave={onLogoLeave}
            onClick={() => navigate('/')}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              cursor: 'pointer', textDecoration: 'none',
              perspective: '400px',
              transition: logoHover ? 'none' : 'transform 0.5s ease',
            }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) ${logoHover ? 'scale(1.08)' : 'scale(1)'}`,
              transition: logoHover ? 'transform 0.05s' : 'transform 0.5s ease',
              transformStyle: 'preserve-3d',
            }}>
              {/* spinning sun seal with 3D depth rings */}
              <div style={{ position: 'relative', width: 36, height: 36 }}>
                {/* pulsing rings behind */}
                <div style={{
                  position:'absolute', inset:-4, borderRadius:'50%',
                  border:'1.5px solid rgba(249,115,22,0.4)',
                  animation:'ringPulse 2s ease-out infinite',
                  pointerEvents:'none',
                }} />
                <div style={{
                  position:'absolute', inset:-4, borderRadius:'50%',
                  border:'1.5px solid rgba(249,115,22,0.3)',
                  animation:'ringPulse 2s ease-out 0.7s infinite',
                  pointerEvents:'none',
                }} />
                {/* spinning seal */}
                <div style={{
                  animation: 'sealSpin 8s linear infinite, sealGlow 3s ease-in-out infinite',
                  transformStyle: 'preserve-3d',
                  display: 'flex',
                }}>
                  <SunSeal size={36} />
                </div>
              </div>

              {/* floating Haribon */}
              <div style={{
                animation: 'hariFloat 2.8s ease-in-out infinite, hariGlow 2.8s ease-in-out infinite',
                transformStyle: 'preserve-3d',
                display: 'flex',
              }}>
                <HaribonFace size={30} />
              </div>

              {/* 3D text block */}
              <div style={{ transformStyle: 'preserve-3d' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 0 }}>
                  <span style={{
                    fontWeight: 900, fontSize: 18, letterSpacing: '-0.3px',
                    background: 'linear-gradient(90deg,#fff 0%,#f97316 40%,#fff 60%,#fff 100%)',
                    backgroundSize: '200% auto',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    animation: 'textShine 4s linear infinite',
                    textShadow: 'none',
                    transform: 'translateZ(6px)',
                    display: 'inline-block',
                  }}>DASIG</span>
                  <span style={{
                    color: 'rgba(255,255,255,0.38)', fontSize: 11, fontWeight: 400, marginLeft: 4,
                    transform: 'translateZ(3px)',
                    display: 'inline-block',
                  }}>Portal</span>
                </div>
                {/* 3D shadow bar below text */}
                <div style={{
                  height: 2, borderRadius: 2, marginTop: 2,
                  background: 'linear-gradient(90deg,#f97316,#e11d48)',
                  transform: `scaleX(${logoHover ? 1 : 0.4}) translateZ(-2px)`,
                  transition: 'transform 0.3s ease',
                  boxShadow: '0 0 8px rgba(249,115,22,0.7)',
                }} />
              </div>
            </div>
          </div>

          {/* ── Nav Links ── */}
          <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {navLinks.map(link => (
              <button key={link.label} className="nav-link" onClick={() => navigate(link.to)} style={link.highlight ? {
                background: 'rgba(249,115,22,0.1)', color: '#f97316',
                border: '1px solid rgba(249,115,22,0.25)', borderRadius: 8,
              } : {}}>
                {link.label}
              </button>
            ))}

            {/* More dropdown */}
            <div ref={moreRef} style={{ position: 'relative' }}>
              <button
                className="nav-link"
                onClick={() => setMoreOpen(o => !o)}
                style={{ display: 'flex', alignItems: 'center', gap: 4 }}
              >
                More
                <span style={{
                  fontSize: 9, marginTop: 1, display: 'inline-block',
                  transform: moreOpen ? 'rotate(180deg)' : 'rotate(0)',
                  transition: 'transform 0.18s',
                }}>▼</span>
              </button>
              {moreOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', left: 0,
                  background: 'rgba(0,13,40,0.98)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12, padding: '6px', minWidth: 180,
                  boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
                  animation: 'dropIn 0.18s ease', zIndex: 1000,
                }}>
                  {moreLinks.map(link => (
                    <button key={link.label} onClick={() => { navigate(link.to); setMoreOpen(false); }} style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      background: 'transparent', border: 'none', borderRadius: 8,
                      padding: '9px 14px', fontSize: 13, color: 'rgba(255,255,255,0.7)',
                      cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
                      transition: 'all 0.14s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
                    >
                      {link.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Auth area ── */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {user ? (
              <>
                {/* Role badge — only for GUEST and MEMBER, not ADMIN (admin has its own button) */}
                {user.role !== 'ADMIN' && (
                  <div style={{
                    background: roleColors[user.role]?.bg,
                    border: `1px solid ${roleColors[user.role]?.color}40`,
                    borderRadius: 20, padding: '3px 10px',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: roleColors[user.role]?.color,
                      display: 'inline-block',
                      boxShadow: `0 0 6px ${roleColors[user.role]?.color}`,
                    }} />
                    <span style={{ color: roleColors[user.role]?.color, fontSize: 11, fontWeight: 700 }}>
                      {roleColors[user.role]?.text}
                    </span>
                  </div>
                )}

                {/* Name + avatar — clickable, opens profile page */}
                {user.role !== 'ADMIN' && (() => {
                  const initials = (user.name || 'U').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
                  return (
                    <button onClick={() => navigate('/profile')} style={{
                      color: 'rgba(255,255,255,0.75)', background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
                      padding: '4px 10px 4px 4px', fontSize: 13, fontWeight: 600,
                      cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color='#fff'; e.currentTarget.style.background='rgba(255,255,255,0.12)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color='rgba(255,255,255,0.75)'; e.currentTarget.style.background='rgba(255,255,255,0.06)'; }}
                    title="My Profile">
                      {/* Mini avatar */}
                      <div style={{ width:28, height:28, borderRadius:8, overflow:'hidden', flexShrink:0 }}>
                        {user.avatar_url
                          ? <img src={user.avatar_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                          : <div style={{ width:'100%', height:'100%', background:'linear-gradient(135deg,#f97316,#e11d48)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900, color:'#fff' }}>{initials}</div>
                        }
                      </div>
                      <span style={{ maxWidth:100, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.name}</span>
                    </button>
                  );
                })()}

                {/* My Card — members only */}
                {user.role === 'MEMBER' && (
                  <button onClick={() => navigate('/membership')} style={{
                    color: 'rgba(255,255,255,0.65)', background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8,
                    padding: '5px 13px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color='#fff'; e.currentTarget.style.borderColor='rgba(255,255,255,0.5)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color='rgba(255,255,255,0.65)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.2)'; }}
                  >My Card</button>
                )}

                {/* Profile link for Admin — with avatar */}
                {user.role === 'ADMIN' && (() => {
                  const initials = (user.name || 'A').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
                  return (
                    <button onClick={() => navigate('/profile')} style={{
                      background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)',
                      borderRadius:10, padding:'4px 10px 4px 4px',
                      color:'rgba(255,255,255,0.75)', fontSize:13, fontWeight:600,
                      cursor:'pointer', fontFamily:'inherit', transition:'all .15s',
                      display:'flex', alignItems:'center', gap:8,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color='#fff'; e.currentTarget.style.background='rgba(255,255,255,0.12)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color='rgba(255,255,255,0.75)'; e.currentTarget.style.background='rgba(255,255,255,0.06)'; }}
                    title="My Profile">
                      <div style={{ width:28, height:28, borderRadius:8, overflow:'hidden', flexShrink:0 }}>
                        {user.avatar_url
                          ? <img src={user.avatar_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                          : <div style={{ width:'100%', height:'100%', background:'linear-gradient(135deg,#e11d48,#9f1239)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900, color:'#fff' }}>{initials}</div>
                        }
                      </div>
                      <span style={{ maxWidth:100, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.name}</span>
                    </button>
                  );
                })()}
                {/* Admin panel button */}
                {user.role === 'ADMIN' && (
                  <button onClick={() => navigate('/admin')} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    color: '#fff', background: 'rgba(225,29,72,0.14)',
                    border: '1px solid rgba(225,29,72,0.3)', borderRadius: 10,
                    padding: '6px 14px', fontSize: 13, fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(225,29,72,0.26)'}
                  onMouseLeave={e => e.currentTarget.style.background='rgba(225,29,72,0.14)'}
                  >
                    <span style={{ width:7, height:7, borderRadius:'50%', background:'#e11d48', boxShadow:'0 0 7px rgba(225,29,72,0.9)', display:'inline-block' }} />
                    {user.name || 'Admin'}
                    <span style={{ fontSize:10, fontWeight:800, background:'rgba(225,29,72,0.35)', color:'#fca5a5', borderRadius:5, padding:'1px 7px' }}>ADMIN</span>
                  </button>
                )}

                <button onClick={handleLogout} style={{
                  color: 'rgba(255,255,255,0.55)', background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8,
                  padding: '6px 13px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color='#fff'; e.currentTarget.style.borderColor='rgba(255,255,255,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.color='rgba(255,255,255,0.55)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.12)'; }}
                >Log out</button>
              </>
            ) : (
              <>
                <button onClick={() => navigate('/login')} style={{
                  color: 'rgba(255,255,255,0.75)', background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.22)', borderRadius: 8,
                  padding: '6px 15px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color='#fff'; e.currentTarget.style.borderColor='rgba(255,255,255,0.5)'; }}
                onMouseLeave={e => { e.currentTarget.style.color='rgba(255,255,255,0.75)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.22)'; }}
                >Log in</button>
                <button onClick={() => navigate('/login')} style={{
                  background: 'linear-gradient(90deg,#f97316,#e11d48)', color: '#fff',
                  border: 'none', borderRadius: 8, padding: '7px 18px', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                  boxShadow: '0 2px 14px rgba(249,115,22,0.45)',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px) scale(1.04)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(249,115,22,0.6)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform='translateY(0) scale(1)'; e.currentTarget.style.boxShadow='0 2px 14px rgba(249,115,22,0.45)'; }}
                >Register free →</button>
              </>
            )}
          </div>

        </div>
      </nav>
    </>
  );
}
