import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SunSeal from './SunSeal';

const FOOTER_CSS = `
  @keyframes socialPop { from{transform:scale(0.85);opacity:0} to{transform:scale(1);opacity:1} }
  .footer-link {
    color: rgba(255,255,255,0.42); font-size: 12.5px;
    display: block; margin-bottom: 8px; cursor: pointer;
    text-decoration: none; transition: color 0.18s, padding-left 0.18s;
  }
  .footer-link:hover { color: #f97316; padding-left: 4px; }
`;

/* SVG icons for real social platforms */
function IconInstagram() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="ig" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f09433"/>
          <stop offset="25%" stopColor="#e6683c"/>
          <stop offset="50%" stopColor="#dc2743"/>
          <stop offset="75%" stopColor="#cc2366"/>
          <stop offset="100%" stopColor="#bc1888"/>
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="url(#ig)" strokeWidth="2" fill="none"/>
      <circle cx="12" cy="12" r="4" stroke="url(#ig)" strokeWidth="2" fill="none"/>
      <circle cx="17.5" cy="6.5" r="1.2" fill="url(#ig)"/>
    </svg>
  );
}

function IconFacebook() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073C24 5.404 18.627 0 12 0S0 5.404 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
    </svg>
  );
}

function IconYouTube() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#FF0000">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

const SOCIAL = [
  { label: 'Instagram', url: 'https://www.instagram.com', Icon: IconInstagram, hoverBg: 'linear-gradient(135deg,#f09433,#dc2743,#bc1888)' },
  { label: 'Facebook',  url: 'https://www.facebook.com',  Icon: IconFacebook,  hoverBg: '#1877F2' },
  { label: 'YouTube',   url: 'https://www.youtube.com',   Icon: IconYouTube,   hoverBg: '#FF0000' },
];

const MODULE_LINKS = [
  { label: 'Membership',   to: '/membership'   },
  { label: 'Events',       to: '/events'       },
  { label: 'News',         to: '/news'         },
  { label: 'Training',     to: '/training'     },
  { label: 'Policies',     to: '/policies'     },
  { label: 'Funding',      to: '/funding'      },
  { label: 'Partnerships', to: '/partnerships' },
  { label: 'AI Chatbot',   to: '/chatbot'      },
];

const MEMBER_LINKS = [
  { label: 'UP Visayas',       url: 'https://www.upv.edu.ph'     },
  { label: 'Univ. San Agustin',url: 'https://www.usa.edu.ph'     },
  { label: 'DOST Region VII',  url: 'https://region7.dost.gov.ph'},
  { label: 'DICT Region VII',  url: 'https://dict.gov.ph'        },
  { label: 'DTI Region VII',   url: 'https://www.dti.gov.ph'     },
  { label: 'DepEd Region VII', url: 'https://region7.deped.gov.ph'},
];

const SUPPORT_LINKS = [
  { label: 'Help Center',    to: '/'              },
  { label: 'Contact Admin',  to: '/contact-admin' },
  { label: 'Membership',     to: '/membership'    },
  { label: 'Privacy Policy', to: '/policies'      },
  { label: 'Terms of Use',   to: '/terms'         },
];

export default function Footer() {
  const navigate = useNavigate();

  return (
    <>
      <style>{FOOTER_CSS}</style>
      <div style={{ height: 3, background: 'linear-gradient(90deg,#f97316,#e11d48)' }} />
      <footer style={{ background: '#020817', padding: '48px 24px 26px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.8fr 1fr 1fr 1fr',
            gap: 32, marginBottom: 36,
          }}>

            {/* Col 1 — Brand */}
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10, cursor:'pointer' }}
                onClick={() => navigate('/')}>
                <SunSeal size={24} />
                <span style={{ color:'#fff', fontWeight:800, fontSize:14 }}>DASIG Portal</span>
              </div>
              <p style={{ color:'rgba(255,255,255,0.38)', fontSize:12.5, lineHeight:1.75, margin:'10px 0 18px' }}>
                Dynamic Alliance for Science, Innovation &amp; Governance — Central Visayas, Region VII.
                Connecting six institutions for a smarter, more coordinated region.
              </p>

              {/* Social icons */}
              <div style={{ display:'flex', gap:10 }}>
                {SOCIAL.map(({ label, url, Icon, hoverBg }) => (
                  <SocialBtn key={label} label={label} url={url} Icon={Icon} hoverBg={hoverBg} />
                ))}
              </div>
            </div>

            {/* Col 2 — Modules */}
            <div>
              <div style={{ color:'rgba(255,255,255,0.85)', fontSize:11.5, fontWeight:700, letterSpacing:'0.5px', marginBottom:14, textTransform:'uppercase' }}>
                Modules
              </div>
              {MODULE_LINKS.map(({ label, to }) => (
                <span key={label} className="footer-link" onClick={() => navigate(to)}>{label}</span>
              ))}
            </div>

            {/* Col 3 — Members */}
            <div>
              <div style={{ color:'rgba(255,255,255,0.85)', fontSize:11.5, fontWeight:700, letterSpacing:'0.5px', marginBottom:14, textTransform:'uppercase' }}>
                Region VII Members
              </div>
              {MEMBER_LINKS.map(({ label, url }) => (
                <a key={label} className="footer-link" href={url} target="_blank" rel="noreferrer">{label}</a>
              ))}
            </div>

            {/* Col 4 — Support */}
            <div>
              <div style={{ color:'rgba(255,255,255,0.85)', fontSize:11.5, fontWeight:700, letterSpacing:'0.5px', marginBottom:14, textTransform:'uppercase' }}>
                Support
              </div>
              {SUPPORT_LINKS.map(({ label, to }) => (
                <span key={label} className="footer-link" onClick={() => navigate(to)}>{label}</span>
              ))}
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:18, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
            <span style={{ color:'rgba(255,255,255,0.27)', fontSize:11.5 }}>
              © 2026 DASIG Consortium · Region VII, Central Visayas, Philippines
            </span>
            <span style={{ color:'rgba(255,255,255,0.27)', fontSize:11.5 }}>
              Team 40 · CIT-U IT332 Capstone &amp; Research 1
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}

function SocialBtn({ label, url, Icon, hoverBg }) {
  const [hov, setHov] = useState(false);
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width:36, height:36, borderRadius:10,
        background: hov ? hoverBg : 'rgba(255,255,255,0.07)',
        border: `1px solid ${hov ? 'transparent' : 'rgba(255,255,255,0.12)'}`,
        display:'flex', alignItems:'center', justifyContent:'center',
        cursor:'pointer', textDecoration:'none',
        transition:'all 0.2s',
        transform: hov ? 'translateY(-3px) scale(1.12)' : 'translateY(0) scale(1)',
        boxShadow: hov ? '0 6px 18px rgba(0,0,0,0.35)' : 'none',
      }}
    >
      <Icon />
    </a>
  );
}

