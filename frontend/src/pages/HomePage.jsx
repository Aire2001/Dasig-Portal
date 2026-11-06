import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import HaribonFull from '../components/HaribonFull';
import ParticleBackground from '../components/ParticleBackground';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

// ── Animated particle canvas ──────────────────────────────────
function ParticleCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;
    function resize() { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; }
    resize();
    window.addEventListener('resize', resize);
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      r: Math.random() * 1.8 + 0.4, vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
      alpha: Math.random() * 0.5 + 0.15, pulse: Math.random() * Math.PI * 2,
    }));
    const orbs = [
      { x: canvas.width * 0.75, y: canvas.height * 0.2, r: 220, color: 'rgba(79,70,229,0.13)', vx: 0.18, vy: 0.12 },
      { x: canvas.width * 0.15, y: canvas.height * 0.7, r: 160, color: 'rgba(249,115,22,0.10)', vx: -0.14, vy: -0.09 },
      { x: canvas.width * 0.5, y: canvas.height * 0.5, r: 130, color: 'rgba(225,29,72,0.07)', vx: 0.10, vy: -0.13 },
    ];
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      orbs.forEach(o => {
        o.x += o.vx; o.y += o.vy;
        if (o.x < -o.r || o.x > canvas.width + o.r) o.vx *= -1;
        if (o.y < -o.r || o.y > canvas.height + o.r) o.vy *= -1;
        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
        g.addColorStop(0, o.color); g.addColorStop(1, 'transparent');
        ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fillStyle = g; ctx.fill();
      });
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.pulse += 0.02;
        if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
        const a = p.alpha * (0.7 + 0.3 * Math.sin(p.pulse));
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(148,163,184,${a})`; ctx.fill();
      });
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 90) {
            ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(148,163,184,${0.12 * (1 - dist / 90)})`; ctx.lineWidth = 0.7; ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    }
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />;
}

const HOME_CSS = `
  @keyframes dasig-ring {
    0%   { transform: scale(1);   opacity: 0.18; }
    100% { transform: scale(2.4); opacity: 0; }
  }
  @keyframes dasig-float {
    0%,100% { transform: translateY(0px); }
    50%      { transform: translateY(-18px); }
  }
  @keyframes fadeUp {
    from { transform: translateY(22px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  @keyframes shimmerBg {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  .haribon-float { animation: dasig-float 5s ease-in-out infinite; }
  .dasig-ring {
    position: absolute; border-radius: 50%;
    border: 1px solid rgba(249,115,22,0.35);
    animation: dasig-ring 3.5s ease-out infinite;
    pointer-events: none;
  }
  .mod-card {
    border-radius: 18px; padding: 22px;
    cursor: pointer; position: relative; overflow: hidden;
    transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
    border: 1px solid rgba(255,255,255,0.08);
  }
  .mod-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 16px 36px rgba(0,0,0,0.5);
    border-color: rgba(249,115,22,0.4);
  }
  .mod-card::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 55%);
    pointer-events: none;
  }
  .news-mini:hover { transform: translateY(-3px); box-shadow: 0 10px 32px rgba(0,0,0,0.35); border-color: rgba(249,115,22,0.35); }
  .news-mini { transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease; }

  @media (max-width: 860px) {
    .home-hero-grid {
      grid-template-columns: 1fr !important;
      gap: 28px !important;
      text-align: center;
    }
    .home-hero-content {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .home-hero-illustration {
      margin: 0 auto;
      max-width: 240px;
    }
    .home-stats-bar {
      display: grid !important;
      grid-template-columns: 1fr 1fr !important;
      gap: 14px !important;
      width: 100% !important;
    }
    .home-stats-item {
      border-right: none !important;
      padding: 10px !important;
      text-align: center !important;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .home-cta-card {
      grid-template-columns: 1fr !important;
    }
    .home-cta-left {
      padding: 32px 20px !important;
      text-align: center;
    }
    .home-cta-actions {
      justify-content: center !important;
    }
    .home-cta-right {
      border-left: none !important;
      border-top: 1px solid rgba(255,255,255,0.1) !important;
      padding: 24px 20px !important;
    }
  }

  @media (max-width: 480px) {
    .home-hero-title {
      font-size: 34px !important;
      letter-spacing: -1px !important;
    }
    .home-cta-actions {
      flex-direction: column !important;
      width: 100% !important;
    }
    .home-cta-actions button {
      width: 100% !important;
    }
  }
`;

const modules = [
  {
    title: 'Membership',
    tag: 'Tiers 1–3',
    desc: 'Institutional membership management, tier-based access, renewals & status tracking.',
    icon: '👥',
    color: '#3b82f6',
    route: '/membership',
  },
  {
    title: 'Events & Summits',
    tag: 'Summits & Workshops',
    desc: 'Regional workshop and summit discovery, attendee registration, and calendar sync.',
    icon: '📅',
    color: '#8b5cf6',
    route: '/programs?tab=events',
  },
  {
    title: 'News & Releases',
    tag: 'Official Press',
    desc: 'Consortium announcements, policy updates, and regional academic publications archive.',
    icon: '📰',
    color: '#10b981',
    route: '/news',
  },
  {
    title: 'Governance Policies',
    tag: 'Official Charter',
    desc: 'Consortium charters, governance frameworks, and regional compliance guidelines.',
    icon: '📋',
    color: '#f59e0b',
    route: '/policies',
  },
  {
    title: 'Funding & Grants',
    tag: 'DOST & Research',
    desc: 'Government research grants, scholarship programs, and institutional funding opportunities.',
    icon: '💰',
    color: '#10b981',
    route: '/funding',
  },
  {
    title: 'Training Programs',
    tag: 'Professional Dev',
    desc: 'Accredited technical bootcamps and executive leadership development programs.',
    icon: '🎓',
    color: '#ec4899',
    route: '/programs?tab=training',
  },
  {
    title: 'Partnerships',
    tag: 'Academe & Industry',
    desc: 'Regional academic, government, and industry cross-institutional collaboration explorer.',
    icon: '🤝',
    color: '#06b6d4',
    route: '/partnerships',
  },
  {
    title: 'Member Directory',
    tag: 'Region VII',
    desc: 'Browse all Region VII consortium state universities, agencies, and regional campuses.',
    icon: '🏛️',
    color: '#a855f7',
    route: '/members',
  },
  {
    title: 'Haribon AI Assistant',
    tag: 'Consortium AI',
    desc: 'AI Assistant scoped to DASIG regional knowledge — ask about events, training & policies.',
    icon: '🦅',
    color: '#f97316',
    route: '/chatbot',
  },
];

function ModuleCard({ mod }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={() => navigate(mod.route)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'rgba(8, 14, 28, 0.75)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${hovered ? mod.color : 'rgba(255, 255, 255, 0.08)'}`,
        borderRadius: 18,
        padding: '22px 24px',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: hovered ? `0 16px 40px rgba(0,0,0,0.6), 0 0 20px ${mod.color}25` : '0 4px 16px rgba(0,0,0,0.3)',
        transform: hovered ? 'translateY(-4px)' : 'none',
        transition: 'all 0.18s cubic-bezier(.34,1.2,.64,1)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Ambient background glow */}
      <div style={{
        position: 'absolute', top: -30, right: -30, width: 100, height: 100,
        borderRadius: '50%', background: `radial-gradient(circle, ${mod.color}20, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* Top row: Icon + Tag */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `${mod.color}15`,
          border: `1px solid ${mod.color}35`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, flexShrink: 0,
        }}>
          {mod.icon}
        </div>
        <span style={{
          background: `${mod.color}12`,
          color: mod.color,
          border: `1px solid ${mod.color}30`,
          borderRadius: 20, padding: '3px 10px',
          fontSize: 10.5, fontWeight: 800, letterSpacing: '.4px',
        }}>
          {mod.tag}
        </span>
      </div>

      {/* Title */}
      <div style={{ fontWeight: 800, fontSize: 16, color: '#fff', marginBottom: 6 }}>
        {mod.title}
      </div>

      {/* Description */}
      <div style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.55)', lineHeight: 1.6, flex: 1, marginBottom: 14 }}>
        {mod.desc}
      </div>

      {/* Footer Link */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        fontSize: 12.5, fontWeight: 700,
        color: hovered ? mod.color : 'rgba(255, 255, 255, 0.45)',
        transition: 'color 0.15s ease',
      }}>
        <span>Explore module</span>
        <span style={{ transform: hovered ? 'translateX(3px)' : 'none', transition: 'transform 0.15s ease' }}>→</span>
      </div>
    </div>
  );
}

const ADMIN_MODULES = [
  {
    title: 'Manage Users',
    shortTitle: 'Users Directory',
    desc: 'Audit consortium user accounts, verify institutional faculty, and grant membership role clearances.',
    tags: ['Role ACLs', 'Faculty Verification', 'Audit Trail'],
    icon: '👥',
    tab: 'users',
    color: '#f43f5e',
    gradient: 'linear-gradient(135deg, #e11d48, #9f1239)',
    countKey: 'users',
    countLabel: 'Accounts Registered',
    actionText: 'Manage Users',
  },
  {
    title: 'Manage Events',
    shortTitle: 'Summits & Symposia',
    desc: 'Schedule regional summits, coordinate host venues, track participant capacities, and manage QR registrations.',
    tags: ['Cebu Summits', '560 Seats', 'RSVP Roster'],
    icon: '📅',
    tab: 'events',
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #7c3aed, #4c1d95)',
    countKey: 'events',
    countLabel: 'Active Summits',
    actionText: 'Manage Events',
  },
  {
    title: 'Manage News',
    shortTitle: 'Bulletins & Press',
    desc: 'Draft, publish, and archive official consortium press releases, institutional bulletins, and policy memorandums.',
    tags: ['Press Releases', 'HEI Circulars', 'Public Feed'],
    icon: '📰',
    tab: 'news',
    color: '#0ea5e9',
    gradient: 'linear-gradient(135deg, #0284c7, #0369a1)',
    countKey: 'news',
    countLabel: 'Published Bulletins',
    actionText: 'Manage News',
  },
  {
    title: 'Manage Training',
    shortTitle: 'Faculty Bootcamps',
    desc: 'Organize faculty development bootcamps, publish training syllabi, track enrollments, and verify certifications.',
    tags: ['Faculty Tracks', 'DICT Bootcamps', 'Certificates'],
    icon: '🎓',
    tab: 'training',
    color: '#f97316',
    gradient: 'linear-gradient(135deg, #ea580c, #c2410c)',
    countKey: 'training',
    countLabel: 'Capacity Courses',
    actionText: 'Manage Training',
  },
  {
    title: 'Manage Policies',
    shortTitle: 'Governance & Charters',
    desc: 'Upload and maintain consortium governance charters, institutional by-laws, and open data sharing frameworks.',
    tags: ['By-Laws', 'IP Framework', 'Statutory Rules'],
    icon: '📋',
    tab: 'policies',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #d97706, #b45309)',
    countKey: 'policies',
    countLabel: 'Active Charters',
    actionText: 'Manage Policies',
  },
  {
    title: 'Manage Funding',
    shortTitle: 'Grants & Scholarships',
    desc: 'Post research funding opportunities, DOST scholarship windows, and monitor grant application deadlines.',
    tags: ['DOST Grants', 'DICT Bayanihan', '₱2.9M Total'],
    icon: '💰',
    tab: 'funding',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #059669, #047857)',
    countKey: 'funding',
    countLabel: 'Grant Windows',
    actionText: 'Manage Funding',
  },
  {
    title: 'Manage Partnerships',
    shortTitle: 'Institutional Alliances',
    desc: 'Track formal inter-institutional agreements, academic exchange MOUs, and multilateral research alliances.',
    tags: ['CHED', 'DOST', 'ADB', 'UP ITDC'],
    icon: '🤝',
    tab: 'partnerships',
    color: '#06b6d4',
    gradient: 'linear-gradient(135deg, #0891b2, #0e7490)',
    countKey: 'partnerships',
    countLabel: 'Active MOUs',
    actionText: 'Manage Partnerships',
  },
  {
    title: 'Reports & Analytics',
    shortTitle: 'Haribon & Audit Logs',
    desc: 'Inspect consortium telemetry, Haribon AI query performance, event utilization, and regional growth metrics.',
    tags: ['91% Accuracy', 'Central Visayas', 'Live Telemetry'],
    icon: '📊',
    tab: 'reports',
    color: '#a855f7',
    gradient: 'linear-gradient(135deg, #9333ea, #6b21a8)',
    countKey: 'accuracy',
    countLabel: 'Consortium KPIs',
    actionText: 'Inspect Analytics',
  },
];

const ADMIN_CSS = `
  @keyframes adminPulse {
    0%,100% { box-shadow: 0 0 6px rgba(225,29,72,0.6); }
    50%      { box-shadow: 0 0 16px rgba(225,29,72,1); }
  }
  @keyframes adminGlow {
    0%,100% { transform: scale(1); opacity: 0.5; }
    50%     { transform: scale(1.08); opacity: 0.8; }
  }
  @keyframes adminShimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(200%); }
  }
  .admin-pulse { animation: adminPulse 2s ease-in-out infinite; }
  .admin-card {
    transition: all 0.24s cubic-bezier(0.16, 1, 0.3, 1);
    position: relative;
    overflow: hidden;
  }
  .admin-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 22px 48px rgba(0,0,0,0.65);
  }
  .admin-card:hover .admin-arrow-btn {
    transform: translateX(4px);
    opacity: 1 !important;
  }
  .admin-bento-tile {
    transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
    position: relative;
    overflow: hidden;
    cursor: pointer;
  }
  .admin-bento-tile:hover {
    transform: translateY(-3px);
    box-shadow: 0 14px 32px rgba(0,0,0,0.55);
  }
  .admin-btn-shimmer {
    position: relative;
    overflow: hidden;
  }
  .admin-btn-shimmer::after {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    animation: adminShimmer 3s infinite;
  }

  @media (max-width: 960px) {
    .admin-hero-grid {
      grid-template-columns: 1fr !important;
      gap: 32px !important;
    }
    .admin-modules-grid {
      grid-template-columns: repeat(2, 1fr) !important;
    }
    .admin-nodes-grid {
      grid-template-columns: repeat(2, 1fr) !important;
    }
  }
  @media (max-width: 600px) {
    .admin-modules-grid {
      grid-template-columns: 1fr !important;
    }
    .admin-bento-grid {
      grid-template-columns: 1fr !important;
    }
    .admin-nodes-grid {
      grid-template-columns: 1fr !important;
    }
  }
`;

function AdminHomePage({ navigate, user }) {
  const [adminStats, setAdminStats] = useState({
    users: 41,
    events: 7,
    training: 4,
    news: 8,
    policies: 4,
    funding: 4,
    partnerships: 4,
    pendingApps: 0,
    accuracy: '91%',
  });

  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' PHT');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof api.admin?.stats === 'function') {
      api.admin.stats().then(statsData => {
        if (!statsData) return;
        setAdminStats(prev => ({
          ...prev,
          users: statsData.users?.total ?? prev.users,
          events: statsData.events?.total ?? prev.events,
          training: statsData.trainings?.total ?? prev.training,
          news: statsData.news?.total ?? prev.news,
          pendingApps: statsData.applications?.pending ?? prev.pendingApps,
          policies: statsData.policies?.total ?? prev.policies,
          funding: statsData.funding?.total ?? prev.funding,
          partnerships: statsData.partnerships?.total ?? prev.partnerships,
        }));
      }).catch(() => {});
    }
  }, []);

  const consortiumNodes = [
    { name: 'Cebu Inst. of Technology - University', code: 'CIT-U', role: 'Central Host Node', status: 'Online · Host', ping: '12ms', color: '#f97316' },
    { name: 'University of the Philippines Cebu', code: 'UP Cebu', role: 'Data Science & Research', status: 'Online · Node', ping: '18ms', color: '#8b5cf6' },
    { name: 'University of San Carlos', code: 'USC', role: 'Applied Physics & STEM', status: 'Online · Node', ping: '24ms', color: '#0ea5e9' },
    { name: 'DOST Region VII Regional Office', code: 'DOST-VII', role: 'Government Research', status: 'Connected', ping: '31ms', color: '#10b981' },
    { name: 'DICT Region VII Cluster', code: 'DICT-VII', role: 'ICT Infrastructure', status: 'Connected', ping: '16ms', color: '#06b6d4' },
    { name: 'DTI Region VII Innovation', code: 'DTI-VII', role: 'Enterprise & MSME', status: 'Connected', ping: '27ms', color: '#f59e0b' },
    { name: 'DepEd Region VII Regional', code: 'DepEd-VII', role: 'K-12 Pipeline', status: 'Connected', ping: '22ms', color: '#f43f5e' },
  ];

  return (
    <div style={{ background: 'linear-gradient(180deg,#000924 0%,#020817 320px,#070d1e 100%)', minHeight: '100vh', position: 'relative' }}>
      <style>{ADMIN_CSS}</style>
      <ParticleBackground density={45} />
      <div style={{ position: 'relative', zIndex: 1 }}>

      {/* ── EXECUTIVE ADMIN HERO ── */}
      <section style={{
        background: 'linear-gradient(135deg,#000a26 0%,#001338 45%,#071947 80%,#0a1d52 100%)',
        padding: '52px 24px 44px', position: 'relative', overflow: 'hidden',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
      }}>
        {/* Ambient lighting glows */}
        <div style={{ position: 'absolute', width: 640, height: 640, borderRadius: '50%', background: 'radial-gradient(circle, rgba(249,115,22,0.14) 0%, transparent 68%)', right: -120, top: -160, pointerEvents: 'none', animation: 'adminGlow 9s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 68%)', left: -100, bottom: -120, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', left: '40%', top: -80, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)', backgroundSize: '44px 44px', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1220, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div className="admin-hero-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.3fr) minmax(0,1fr)', gap: 40, alignItems: 'center' }}>
            <div>
              {/* Executive Telemetry Badges Strip */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  background: 'rgba(225,29,72,0.14)', border: '1px solid rgba(225,29,72,0.38)',
                  borderRadius: 20, padding: '4px 14px',
                  boxShadow: '0 2px 12px rgba(225,29,72,0.18)'
                }}>
                  <div className="admin-pulse" style={{ width: 7, height: 7, borderRadius: '50%', background: '#f43f5e', flexShrink: 0 }} />
                  <span style={{ color: '#f43f5e', fontSize: 11, fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                    Executive Command Center
                  </span>
                </div>

                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.28)',
                  borderRadius: 20, padding: '4px 12px', color: '#34d399', fontSize: 11, fontWeight: 700
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                  CIT-U Central Node · Active
                </div>

                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.25)',
                  borderRadius: 20, padding: '4px 12px', color: '#38bdf8', fontSize: 11, fontWeight: 700
                }}>
                  <span>⚡</span> PostgreSQL Live Sync
                </div>

                {currentTime && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 20, padding: '4px 11px', color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 600
                  }}>
                    <span>🕒</span> {currentTime}
                  </div>
                )}
              </div>

              {/* Title & Clearances */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                <span style={{
                  background: 'linear-gradient(90deg, #f97316, #ef4444)',
                  color: '#fff', fontSize: 10.5, fontWeight: 900, textTransform: 'uppercase',
                  padding: '3px 9px', borderRadius: 6, letterSpacing: '0.6px',
                  boxShadow: '0 2px 8px rgba(249,115,22,0.35)'
                }}>
                  Superadmin Clearance
                </span>
                <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 600 }}>
                  Institutional Authority: Region VII Academic Consortium
                </span>
              </div>

              <h1 style={{ color: '#fff', fontSize: 40, fontWeight: 900, lineHeight: 1.15, letterSpacing: '-1.2px', marginBottom: 14 }}>
                Welcome back,{' '}
                <span style={{ background: 'linear-gradient(90deg,#f97316 0%,#fb7185 50%,#e11d48 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  {user?.name || 'DASIG Admin'}
                </span>
              </h1>
              
              <p style={{ color: 'rgba(255,255,255,0.68)', fontSize: 14.5, lineHeight: 1.7, marginBottom: 28, maxWidth: 560 }}>
                Consortium governance administration, institutional member approvals, event participant registries, and multi-HEI research orchestration across Central Visayas.
              </p>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  onClick={() => navigate('/admin?tab=dashboard')}
                  className="admin-btn-shimmer"
                  style={{
                    background: 'linear-gradient(90deg,#ea580c 0%,#f97316 40%,#e11d48 100%)',
                    color: '#fff', border: 'none', borderRadius: 12, padding: '13px 26px',
                    fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                    boxShadow: '0 8px 24px rgba(249,115,22,0.45)', transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', gap: 9,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(249,115,22,0.6)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(249,115,22,0.45)'; }}
                >
                  <span style={{ fontSize: 15 }}>⚡</span>
                  <span>Launch Admin Console</span>
                  <span style={{ fontSize: 16 }}>→</span>
                </button>

                <button
                  onClick={() => navigate('/admin?tab=reports')}
                  style={{
                    color: '#c084fc', background: 'rgba(168,85,247,0.12)',
                    border: '1px solid rgba(168,85,247,0.3)', borderRadius: 12, padding: '13px 20px',
                    fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.18s',
                    display: 'flex', alignItems: 'center', gap: 7,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(168,85,247,0.22)'; e.currentTarget.style.borderColor = 'rgba(168,85,247,0.5)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(168,85,247,0.12)'; e.currentTarget.style.borderColor = 'rgba(168,85,247,0.3)'; }}
                >
                  <span>📊</span>
                  <span>Executive Analytics</span>
                </button>

                <button
                  onClick={() => navigate('/programs')}
                  style={{
                    color: 'rgba(255,255,255,0.85)', background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.14)', borderRadius: 12, padding: '13px 20px',
                    fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.18s',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.28)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'; }}
                >
                  <span>🏛️</span>
                  <span>Browse Public Portal</span>
                </button>

                {adminStats.pendingApps > 0 && (
                  <button
                    onClick={() => navigate('/admin?tab=applications')}
                    style={{
                      color: '#fbbf24', background: 'rgba(245,158,11,0.14)',
                      border: '1px solid rgba(245,158,11,0.4)', borderRadius: 12, padding: '13px 20px',
                      fontSize: 13.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.18s',
                      display: 'flex', alignItems: 'center', gap: 7,
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,158,11,0.24)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(245,158,11,0.14)'}
                  >
                    <span>⏳</span>
                    <span>Review Pending ({adminStats.pendingApps})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick KPI Interactive Bento Grid */}
            <div className="admin-bento-grid" style={{
              background: 'linear-gradient(135deg, rgba(10, 18, 38, 0.85) 0%, rgba(13, 23, 48, 0.75) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 22, padding: '20px',
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14,
              boxShadow: '0 24px 60px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.12)',
              position: 'relative',
            }}>
              {[
                { label: 'Consortium Events', val: adminStats.events, icon: '📅', color: '#8b5cf6', sub: 'Active Summits', target: 'events', detail: '560 seats capacity · Roster active' },
                { label: 'Faculty Training', val: adminStats.training, icon: '🎓', color: '#10b981', sub: 'Capacity Courses', target: 'training', detail: '4 bootcamps · 90 participant cap' },
                { label: 'Registered Users', val: adminStats.users, icon: '👥', color: '#38bdf8', sub: 'Members & Guests', target: 'users', detail: '14 verified members · 7 HEIs' },
                { label: 'Consortium AI', val: adminStats.accuracy || '91%', icon: '🦅', color: '#f97316', sub: 'Haribon NLP', target: 'reports', detail: 'Central Visayas Model · Live' },
              ].map((kpi, idx) => (
                <div
                  key={idx}
                  className="admin-bento-tile"
                  onClick={() => navigate(`/admin?tab=${kpi.target}`)}
                  style={{
                    background: 'rgba(255,255,255,0.035)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 16, padding: '16px 18px',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = kpi.color + '70';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.boxShadow = `0 10px 24px rgba(0,0,0,0.4), 0 0 18px ${kpi.color}25`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.035)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                    background: `linear-gradient(90deg, transparent, ${kpi.color}, transparent)`
                  }} />

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 10,
                      background: `${kpi.color}18`, border: `1px solid ${kpi.color}40`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18,
                    }}>
                      {kpi.icon}
                    </div>
                    <span style={{
                      fontSize: 10.5, color: kpi.color, background: `${kpi.color}15`,
                      border: `1px solid ${kpi.color}35`, borderRadius: 6,
                      padding: '2px 7px', fontWeight: 800
                    }}>
                      {kpi.sub}
                    </span>
                  </div>

                  <div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: '-0.8px', lineHeight: 1.1 }}>
                      {kpi.val}
                    </div>
                    <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.85)', marginTop: 4, fontWeight: 700 }}>
                      {kpi.label}
                    </div>
                    <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.45)', marginTop: 2, fontWeight: 500 }}>
                      {kpi.detail}
                    </div>
                  </div>

                  <div style={{
                    marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8
                  }}>
                    <span style={{ fontSize: 11, color: kpi.color, fontWeight: 800 }}>Manage Module</span>
                    <span style={{ fontSize: 12, color: kpi.color, fontWeight: 800 }}>→</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── REGIONAL OPERATIONS SHORTCUTS ── */}
      <section style={{ padding: '24px 24px 0', maxWidth: 1220, margin: '0 auto' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(14, 23, 48, 0.8) 0%, rgba(10, 16, 35, 0.9) 100%)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 18, padding: '16px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 14,
          boxShadow: '0 10px 30px rgba(0,0,0,0.35)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15
            }}>
              ⚡
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>Executive Quick Actions</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Direct creation shortcuts for administrators</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/admin?tab=events&action=new')}
              style={{
                background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)',
                color: '#c084fc', borderRadius: 9, padding: '7px 13px', fontSize: 12,
                fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.22)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(139,92,246,0.12)'}
            >
              + New Event Summit
            </button>

            <button
              onClick={() => navigate('/admin?tab=news&action=new')}
              style={{
                background: 'rgba(14,165,233,0.12)', border: '1px solid rgba(14,165,233,0.3)',
                color: '#38bdf8', borderRadius: 9, padding: '7px 13px', fontSize: 12,
                fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(14,165,233,0.22)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(14,165,233,0.12)'}
            >
              + Post Bulletin
            </button>

            <button
              onClick={() => navigate('/admin?tab=training&action=new')}
              style={{
                background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.3)',
                color: '#fb923c', borderRadius: 9, padding: '7px 13px', fontSize: 12,
                fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(249,115,22,0.22)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(249,115,22,0.12)'}
            >
              + Add Training Cohort
            </button>

            <button
              onClick={() => navigate('/admin?tab=funding&action=new')}
              style={{
                background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
                color: '#34d399', borderRadius: 9, padding: '7px 13px', fontSize: 12,
                fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,0.22)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(16,185,129,0.12)'}
            >
              + Grant Window
            </button>

            <button
              onClick={() => navigate('/admin?tab=partnerships&action=new')}
              style={{
                background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.3)',
                color: '#22d3ee', borderRadius: 9, padding: '7px 13px', fontSize: 12,
                fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(6,182,212,0.22)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(6,182,212,0.12)'}
            >
              + Register MOU
            </button>
          </div>
        </div>
      </section>

      {/* ── CONSORTIUM CONTROL MODULES ── */}
      <section style={{ padding: '36px 24px 48px' }}>
        <div style={{ maxWidth: 1220, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#f97316' }}>
                  🏛️ Executive Governance
                </span>
                <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>
                  8 Operational Modules · 100% Online
                </span>
              </div>
              <h2 style={{ fontSize: 32, fontWeight: 900, color: '#fff', letterSpacing: '-0.8px', margin: 0 }}>
                Consortium Control Panel
              </h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={() => navigate('/admin?tab=dashboard')}
                style={{
                  color: '#fff', background: 'linear-gradient(90deg, #ea580c, #f97316)',
                  border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 13,
                  fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.18s',
                  boxShadow: '0 4px 14px rgba(249,115,22,0.35)',
                  display: 'flex', alignItems: 'center', gap: 7,
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(249,115,22,0.5)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(249,115,22,0.35)'; }}
              >
                <span>Full Command Center</span>
                <span>→</span>
              </button>
            </div>
          </div>

          {/* 8 Modular Cards Grid */}
          <div className="admin-modules-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18 }}>
            {ADMIN_MODULES.map((m) => {
              const countVal = adminStats[m.countKey] ?? null;
              return (
                <div
                  key={m.tab}
                  className="admin-card"
                  onClick={() => navigate(`/admin?tab=${m.tab}`)}
                  style={{
                    background: 'linear-gradient(135deg, rgba(10, 18, 38, 0.85) 0%, rgba(13, 22, 45, 0.78) 100%)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.09)',
                    borderRadius: 20, padding: '22px 22px', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column',
                    boxShadow: '0 10px 28px rgba(0,0,0,0.4)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = m.color + '85';
                    e.currentTarget.style.boxShadow = `0 18px 42px rgba(0,0,0,0.6), 0 0 24px ${m.color}22`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)';
                    e.currentTarget.style.boxShadow = '0 10px 28px rgba(0,0,0,0.4)';
                  }}
                >
                  {/* Glowing Top Accent Bar */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                    background: `linear-gradient(90deg, transparent, ${m.color}, transparent)`
                  }} />

                  {/* Header Row: 3D Icon & Live Count Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{
                      width: 46, height: 46, borderRadius: 13,
                      background: m.gradient,
                      border: `1px solid ${m.color}60`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 22, flexShrink: 0,
                      boxShadow: `0 6px 16px ${m.color}35`,
                    }}>
                      {m.icon}
                    </div>

                    {countVal !== null && (
                      <span style={{
                        fontSize: 11, fontWeight: 800, color: m.color,
                        background: m.color + '18', border: `1px solid ${m.color}35`,
                        borderRadius: 7, padding: '3px 9px',
                        display: 'inline-flex', alignItems: 'center', gap: 5
                      }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: m.color }} />
                        {countVal} {m.countLabel.split(' ')[0]}
                      </span>
                    )}
                  </div>

                  {/* Module Title & Short Descriptor */}
                  <div style={{ fontWeight: 900, fontSize: 17, color: '#fff', marginBottom: 4, letterSpacing: '-0.3px' }}>
                    {m.title}
                  </div>
                  <div style={{ fontSize: 11, color: m.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                    {m.shortTitle}
                  </div>

                  {/* Module Description */}
                  <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: 14, flex: 1 }}>
                    {m.desc}
                  </div>

                  {/* Tags Pill Row */}
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 14 }}>
                    {m.tags.slice(0, 2).map((tg, i) => (
                      <span key={i} style={{
                        fontSize: 10, color: 'rgba(255,255,255,0.5)',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 5, padding: '1px 6px', fontWeight: 600
                      }}>
                        {tg}
                      </span>
                    ))}
                  </div>
                  
                  {/* Action Link Footer */}
                  <div style={{
                    fontSize: 12.5, color: m.color, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 12
                  }}>
                    <span>{m.actionText}</span>
                    <span className="admin-arrow-btn" style={{ fontSize: 14, transition: 'transform 0.2s', opacity: 0.85 }}>→</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── REGIONAL INSTITUTIONAL NODES STRIP ── */}
      <section style={{ padding: '0 24px 64px', maxWidth: 1220, margin: '0 auto' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(8, 14, 30, 0.85) 0%, rgba(11, 19, 40, 0.9) 100%)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 22, padding: '24px 26px',
          boxShadow: '0 16px 40px rgba(0,0,0,0.45)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17
              }}>
                🌐
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', letterSpacing: '-0.3px' }}>
                  Region VII Consortium Node Grid
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                  Inter-institutional academic connectivity & secure data mesh
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontSize: 11, color: '#34d399', background: 'rgba(16,185,129,0.12)',
                border: '1px solid rgba(16,185,129,0.3)', borderRadius: 7, padding: '3px 10px', fontWeight: 800
              }}>
                ● 7 Nodes Connected
              </span>
              <span style={{
                fontSize: 11, color: '#38bdf8', background: 'rgba(14,165,233,0.12)',
                border: '1px solid rgba(14,165,233,0.3)', borderRadius: 7, padding: '3px 10px', fontWeight: 800
              }}>
                🔒 Strict TLS 1.3
              </span>
            </div>
          </div>

          <div className="admin-nodes-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {consortiumNodes.map((nd, idx) => (
              <div key={idx} style={{
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12, padding: '12px 14px',
                display: 'flex', flexDirection: 'column', gap: 4,
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = nd.color + '60';
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.025)';
              }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{
                    fontSize: 11, fontWeight: 900, color: nd.color,
                    background: nd.color + '15', borderRadius: 4, padding: '1px 6px'
                  }}>
                    {nd.code}
                  </span>
                  <span style={{ fontSize: 10, color: '#34d399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981' }} />
                    {nd.ping}
                  </span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {nd.name}
                </div>
                <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>
                  {nd.role}
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


export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ctaToast, setCtaToast] = useState('');
  const [stats, setStats] = useState({ members: 6, events: 4, trainings: 4, news: 8 });

  // Fetch live stats for homepage counters
  useEffect(() => {
    Promise.allSettled([
      api.events.list({ limit: 1 }),
      api.training.list({ limit: 1 }),
      api.news.list({ limit: 1 }),
    ]).then(([ev, tr, nw]) => {
      setStats({
        members: 7, // 7 consortium partner institutions & government agencies
        events:   ev.status === 'fulfilled' ? (ev.value.total ?? 4) : 4,
        trainings: tr.status === 'fulfilled' ? (tr.value.total ?? 4) : 4,
        news:     nw.status === 'fulfilled' ? (nw.value.total ?? 8) : 8,
      });
    }).catch(() => {});
  }, []);

  function showToast(msg) {
    setCtaToast(msg);
    setTimeout(() => setCtaToast(''), 3000);
  }

  function handleCtaClick(route) {
    if (route === '/admin') {
      if (user?.role === 'ADMIN') { navigate('/admin?tab=reports'); return; }
      showToast('📊 Live Analytics is available to DASIG Administrators only.');
      return;
    }
    if (route === '/login') {
      if (user) { navigate('/membership'); return; }
      navigate('/login');
      return;
    }
    navigate(route);
  }

  if (user?.role === 'ADMIN') return <AdminHomePage navigate={navigate} user={user} />;

  return (
    <div style={{ background: 'linear-gradient(180deg,#000d30 0%,#020817 100%)', minHeight: '100vh', position: 'relative' }}>
      <style>{HOME_CSS}</style>
      <ParticleBackground density={55} />
      <div style={{ position: 'relative', zIndex: 1 }}>

      {/* ── MEMBER STATUS BANNER ── */}
      {user?.role === 'MEMBER' && (
        <div style={{
          background: 'linear-gradient(90deg,rgba(16,185,129,0.12),rgba(5,150,105,0.08))',
          borderBottom: '1px solid rgba(16,185,129,0.2)',
          padding: '9px 24px',
        }}>
          <div style={{ maxWidth: 1120, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px rgba(16,185,129,0.8)', flexShrink: 0 }} />
            <span style={{ color: '#10b981', fontSize: 12.5, fontWeight: 700 }}>
              ✓ Member Access — {user?.name || user?.email}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>·</span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
              {user?.institution || 'DASIG Consortium'} · Full module access unlocked
            </span>
            <div style={{ flex: 1 }} />
            <button onClick={() => navigate('/membership')} style={{
              background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
              color: '#10b981', borderRadius: 7, padding: '4px 12px', fontSize: 13,
              fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}>My Card →</button>
          </div>
        </div>
      )}

      {/* ── HERO ── */}
      <section style={{
        background: 'linear-gradient(135deg,#000d30 0%,#001d5c 50%,#1a3878 100%)',
        padding: '0 24px', position: 'relative', overflow: 'hidden', minHeight: 530,
      }}>
        <ParticleCanvas />
        {[0, 1.2, 2.4].map(d => (
          <div key={d} className="dasig-ring" style={{ width: 140, height: 140, right: 90, bottom: 60, animationDelay: `${d}s` }} />
        ))}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)',
          backgroundSize: '40px 40px', pointerEvents: 'none',
        }} />
        <div className="home-hero-grid" style={{
          maxWidth: 1120, margin: '0 auto',
          display: 'grid', gridTemplateColumns: '1fr 300px',
          gap: 40, alignItems: 'flex-end',
          padding: '64px 0 0', position: 'relative', zIndex: 1,
        }}>
          <div className="home-hero-content">
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: 24, padding: '5px 14px 5px 5px', marginBottom: 20,
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: 11,
                background: 'linear-gradient(90deg,#f97316,#e11d48)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
              }}>🏛</div>
              <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: 600, letterSpacing: '0.5px' }}>
                CENTRAL VISAYAS CONSORTIUM · REGION VII · 7 INSTITUTIONS &amp; AGENCIES
              </span>
            </div>
            <h1 className="home-hero-title" style={{ color: '#fff', fontSize: 50, fontWeight: 900, lineHeight: 1.07, letterSpacing: '-2px', marginBottom: 18 }}>
              The Smarter Way to{' '}
              <span style={{
                background: 'linear-gradient(90deg,#f97316,#e11d48)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>Run Your Consortium</span>
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.62)', fontSize: 15.5, lineHeight: 1.75, marginBottom: 32, maxWidth: 500 }}>
              DASIG unifies membership, events, funding, training, and governance for CIT-U, UP Cebu, University of San Carlos (USC), DOST, DICT, DTI, and DepEd Region VII — all in one secure, role-based platform.
            </p>
            <div style={{ display: 'flex', gap: 12, marginBottom: 40, flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/membership')} style={{
                background: 'linear-gradient(90deg,#f97316,#e11d48)', color: '#fff',
                border: 'none', borderRadius: 10, padding: '13px 26px', fontSize: 14.5, fontWeight: 700,
                cursor: 'pointer', boxShadow: '0 4px 20px rgba(249,115,22,0.42)', transition: 'all 0.2s', fontFamily: 'inherit',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(249,115,22,0.55)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(249,115,22,0.42)'; }}
              >Get Started Free →</button>
              <button onClick={() => navigate('/members')} style={{
                color: 'rgba(255,255,255,0.82)', background: 'rgba(255,255,255,0.07)',
                border: '1.5px solid rgba(255,255,255,0.18)', borderRadius: 10, padding: '13px 26px',
                fontSize: 14.5, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.14)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
              >View all modules</button>
            </div>
            <div className="home-stats-bar" style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.09)', paddingTop: 26 }}>
              {[
                { v: String(stats.members), l: 'Institutions' },
                { v: String(stats.events), l: 'Events' },
                { v: String(stats.trainings), l: 'Programs' },
                { v: String(stats.news), l: 'Articles' },
              ].map((s, i) => (
                <div key={i} className="home-stats-item" style={{
                  flex: 1,
                  borderRight: i < 3 ? '1px solid rgba(255,255,255,0.09)' : 'none',
                  padding: i === 0 ? '0 20px 0 0' : '0 20px',
                }}>
                  <div style={{
                    fontSize: 30, fontWeight: 900, letterSpacing: '-1px',
                    background: 'linear-gradient(90deg,#f97316,#e11d48)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                  }}>{s.v}</div>
                  <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12.5, marginTop: 4 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="haribon-float home-hero-illustration"><HaribonFull width={280} /></div>
        </div>
      </section>

      {/* ── MEMBER STRIP ── */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0 24px',
      }}>
        <div style={{
          maxWidth: 1120, margin: '0 auto', minHeight: 52, padding: '10px 0',
          display: 'flex', alignItems: 'center', gap: 14, overflowX: 'auto', WebkitOverflowScrolling: 'touch',
        }}>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            Region VII Members
          </span>
          <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {['CIT-University', 'University of the Philippines Cebu', 'University of San Carlos', 'DOST Region VII', 'DICT Region VII', 'DTI Region VII', 'DepEd Region VII'].map(m => (
              <div key={m} style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6, padding: '4px 12px', fontSize: 13,
                color: 'rgba(255,255,255,0.6)', fontWeight: 600, whiteSpace: 'nowrap',
              }}>{m}</div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FEATURE HIGHLIGHTS ── */}
      <section style={{ padding: '56px 24px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18 }}>
          {[
            {
              icon: '🦅', title: 'Powered by Haribon AI',
              desc: 'Our intelligent NLP assistant handles consortium queries scoped directly to official DASIG knowledge. Ask Haribon anything about events, training, funding, or membership.',
              grad: 'linear-gradient(135deg,#000d30,#001d5c)', border: 'rgba(79,70,229,0.25)',
              iconGrad: 'linear-gradient(135deg,rgba(249,115,22,0.25),rgba(225,29,72,0.15))',
            },
            {
              icon: '🏛', title: 'Built for 7 Region VII Institutions',
              desc: 'One platform connecting CIT-University (Host), UP Cebu, USC, CTU, DOST-7, DICT-7, DTI-7, and DepEd-7 with unified RBAC.',
              grad: 'linear-gradient(135deg,#0d1445,#1a3878)', border: 'rgba(59,130,246,0.25)',
              iconGrad: 'linear-gradient(135deg,rgba(79,70,229,0.25),rgba(125,211,252,0.15))',
            },
            {
              icon: '🔐', title: 'Enterprise-grade security',
              desc: 'OAuth 2.0 RFC 6749, JWT authentication, and RBAC middleware — every access point is verified, auditable, and secure.',
              grad: 'linear-gradient(135deg,#1e1b4b,#312e81)', border: 'rgba(139,92,246,0.25)',
              iconGrad: 'linear-gradient(135deg,rgba(139,92,246,0.25),rgba(99,102,241,0.15))',
            },
          ].map((f, i) => (
            <div key={i}
              onClick={() => i === 0 && navigate('/chatbot')}
              style={{
                background: f.grad, borderRadius: 20, padding: 28,
                border: `1px solid ${f.border}`,
                position: 'relative', overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                animation: `fadeUp 0.5s ease ${i * 0.1}s both`,
                cursor: i === 0 ? 'pointer' : 'default',
                transition: 'transform 0.22s, box-shadow 0.22s',
              }}
              onMouseEnter={e => { if (i === 0) { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 20px 48px rgba(0,0,0,0.5)'; } }}
              onMouseLeave={e => { if (i === 0) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)'; } }}
            >
              <div style={{ position: 'absolute', top: -30, right: -20, fontSize: 100, opacity: 0.05, lineHeight: 1 }}>{f.icon}</div>
              <div style={{
                width: 48, height: 48, borderRadius: 14, background: f.iconGrad,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, marginBottom: 18, border: '1px solid rgba(255,255,255,0.1)',
              }}>{f.icon}</div>
              <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 10, letterSpacing: '-0.3px', color: '#fff' }}>{f.title}</div>
              <div style={{ fontSize: 13.5, lineHeight: 1.7, color: 'rgba(255,255,255,0.58)' }}>{f.desc}</div>
              {i === 0 && (
                <div style={{ marginTop: 14, fontSize: 12, color: 'rgba(249,115,22,0.8)', fontWeight: 700 }}>Try Haribon →</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── PLATFORM MODULES ── */}
      <section style={{ padding: '8px 24px 60px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div style={{ marginBottom: 36 }}>
            <p style={{
              fontSize: 13, fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 8,
              background: 'linear-gradient(90deg,#f97316,#e11d48)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>Platform Modules</p>
            <h2 style={{
              fontSize: 34, fontWeight: 900, letterSpacing: '-1px', marginBottom: 10,
              background: 'linear-gradient(90deg,#fff 40%,rgba(255,255,255,0.5))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>Everything your consortium needs</h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, lineHeight: 1.65, maxWidth: 520 }}>
              Nine integrated modules — unified under one secure, role-based platform built on clean architecture.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
            {modules.map(mod => <ModuleCard key={mod.title} mod={mod} />)}
          </div>
        </div>
      </section>

      {/* ── NEWS ── */}
      <section style={{ padding: '8px 24px 60px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
            <div>
              <p style={{
                fontSize: 13, fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 8,
                background: 'linear-gradient(90deg,#f97316,#e11d48)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>Consortium News</p>
              <h2 style={{
                fontSize: 34, fontWeight: 900, letterSpacing: '-1px',
                background: 'linear-gradient(90deg,#fff 40%,rgba(255,255,255,0.5))',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>Stay informed</h2>
            </div>
            <button onClick={() => navigate('/news')} style={{
              color: '#f97316', background: 'rgba(249,115,22,0.1)',
              border: '1px solid rgba(249,115,22,0.25)',
              borderRadius: 9, padding: '8px 18px',
              fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all 0.18s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(249,115,22,0.18)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(249,115,22,0.1)'}
            >All news →</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.75fr 1fr', gap: 16 }}>
            {/* Feature card */}
            <div onClick={() => navigate('/news?title=' + encodeURIComponent('DASIG Annual Summit 2026 Registration Now Open'))} style={{
              borderRadius: 20, overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.08)',
              cursor: 'pointer', transition: 'all 0.22s',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 48px rgba(0,0,0,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)'; }}
            >
              <div style={{
                height: 210, position: 'relative',
                background: 'linear-gradient(135deg,#001d5c,#1a56db 55%,#4f46e5)',
                display: 'flex', alignItems: 'flex-end', padding: 22,
              }}>
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.15)' }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <span style={{
                    background: 'rgba(255,255,255,0.15)', color: '#fff',
                    border: '1px solid rgba(255,255,255,0.25)',
                    borderRadius: 5, padding: '3px 9px', fontSize: 12, fontWeight: 700,
                    display: 'block', width: 'fit-content', marginBottom: 7,
                  }}>📣 Announcement</span>
                  <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, marginBottom: 4 }}>May 20, 2026</div>
                  <h3 style={{ color: '#fff', fontWeight: 800, fontSize: 19, lineHeight: 1.22, maxWidth: 360, letterSpacing: '-0.3px' }}>
                    DASIG Annual Summit 2026 Registration Now Open
                  </h3>
                </div>
              </div>
              <div style={{ padding: 22, background: 'rgba(255,255,255,0.04)' }}>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.75, marginBottom: 16 }}>
                  The annual summit gathers all six Region VII consortium institutions for a three-day innovation forum, research showcase, and networking event in Cebu City.
                </p>
                <button onClick={e => { e.stopPropagation(); navigate('/news?title=' + encodeURIComponent('DASIG Annual Summit 2026 Registration Now Open')); }} style={{
                  background: 'linear-gradient(90deg,#f97316,#e11d48)', color: '#fff',
                  border: 'none', borderRadius: 10, padding: '8px 18px',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                }}>Read more →</button>
              </div>
            </div>

            {/* Mini cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { icon: '📋', grad: 'linear-gradient(135deg,#78350f,#b45309)', badge: 'Policy', date: 'May 14, 2026',
                  title: 'Updated Membership Renewal Guidelines for AY 2026–2027', excerpt: 'Revised criteria now available for institutional review.' },
                { icon: '💰', grad: 'linear-gradient(135deg,#064e3b,#059669)', badge: 'Funding', date: 'May 8, 2026',
                  title: 'DOST Region VII Scholarship Window Now Open', excerpt: 'Apply via the Funding portal before June 15.' },
              ].map((n, i) => (
                <div key={i} className="news-mini" onClick={() => navigate('/news?title=' + encodeURIComponent(n.title))} style={{
                  background: n.grad, borderRadius: 18, padding: 18,
                  cursor: 'pointer', border: '1px solid rgba(255,255,255,0.08)',
                  position: 'relative', overflow: 'hidden', flex: 1,
                }}>
                  <div style={{ position: 'absolute', bottom: -10, right: -5, fontSize: 60, opacity: 0.1, lineHeight: 1 }}>{n.icon}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span style={{
                      background: 'rgba(255,255,255,0.2)', color: '#fff',
                      borderRadius: 5, padding: '3px 10px', fontSize: 12, fontWeight: 800,
                    }}>{n.badge}</span>
                    <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.45)' }}>{n.date}</span>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: '#fff', lineHeight: 1.35, marginBottom: 6 }}>{n.title}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.55 }}>{n.excerpt}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '8px 24px 80px' }}>
        <div className="home-cta-card" style={{
          background: 'linear-gradient(135deg,#001d5c,#1a56db 55%,#4f46e5)',
          borderRadius: 22, overflow: 'hidden', position: 'relative',
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          maxWidth: 1120, margin: '0 auto',
          boxShadow: '0 24px 64px rgba(0,29,92,0.6)',
        }}>
          <div style={{ position: 'absolute', width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(rgba(79,70,229,0.3),transparent 70%)', right: -80, top: -100, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(rgba(249,115,22,0.2),transparent 70%)', left: -40, bottom: -60, pointerEvents: 'none' }} />
          <div className="home-cta-left" style={{ padding: 48, position: 'relative', zIndex: 1 }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12.5, fontWeight: 700, letterSpacing: '1px', marginBottom: 10, textTransform: 'uppercase' }}>
              Join Region VII Consortium
            </p>
            <h2 style={{ color: '#fff', fontSize: 32, fontWeight: 900, lineHeight: 1.1, letterSpacing: '-1px', marginBottom: 13 }}>
              Ready to connect your institution?
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, lineHeight: 1.75, marginBottom: 28 }}>
              Register and unlock all nine modules, events, funding, and governance tools. Free to start.
            </p>
            <div className="home-cta-actions" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/membership')} style={{
                background: 'linear-gradient(90deg,#f97316,#e11d48)', color: '#fff',
                border: 'none', borderRadius: 10, padding: '12px 24px',
                fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 4px 20px rgba(249,115,22,0.4)', transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >Apply for Membership</button>
              <button onClick={() => navigate('/contact-admin')} style={{
                color: 'rgba(255,255,255,0.82)', background: 'rgba(255,255,255,0.07)',
                border: '1.5px solid rgba(255,255,255,0.18)',
                borderRadius: 10, padding: '12px 24px', fontSize: 14,
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.14)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
              >Contact Admin</button>
            </div>
          </div>
          <div className="home-cta-right" style={{
            borderLeft: '1px solid rgba(255,255,255,0.1)',
            padding: 36, display: 'flex', flexDirection: 'column',
            gap: 10, justifyContent: 'center', position: 'relative', zIndex: 1,
          }}>
            {ctaToast && (
              <div style={{
                position: 'absolute', top: 12, left: 12, right: 12,
                background: 'rgba(15,23,42,0.97)', border: '1px solid rgba(16,185,129,0.35)',
                borderRadius: 10, padding: '10px 16px', fontSize: 12.5, fontWeight: 600,
                color: 'rgba(255,255,255,0.85)', zIndex: 10,
                animation: 'fadeUp 0.25s ease',
              }}>{ctaToast}</div>
            )}
            {[
              { icon: '🦅', title: 'Ask Haribon',       sub: 'NLP AI chatbot, 100% accuracy',    route: '/chatbot',    accent: 'rgba(249,115,22,0.2)',  border: 'rgba(249,115,22,0.4)',  adminOnly: false },
              { icon: '🔒', title: 'Role-Based Access',  sub: 'GUEST · MEMBER · ADMIN',            route: '/membership', accent: 'rgba(79,70,229,0.2)',   border: 'rgba(79,70,229,0.4)',   adminOnly: false },
              { icon: '📊', title: 'Live Analytics',     sub: 'Real-time dashboards',               route: '/admin',      accent: 'rgba(16,185,129,0.2)',  border: 'rgba(16,185,129,0.4)',  adminOnly: true  },
              { icon: '🌐', title: 'OAuth 2.0 SSO',      sub: 'RFC 6749 compliant',                route: '/login',      accent: 'rgba(96,165,250,0.2)',  border: 'rgba(96,165,250,0.4)',  adminOnly: false },
            ].map(f => (
              <div key={f.title}
                onClick={() => handleCtaClick(f.route)}
                style={{
                  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12, padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12,
                  transition: 'all 0.2s', cursor: 'pointer',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = f.accent;
                  e.currentTarget.style.borderColor = f.border;
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <div style={{
                  width: 34, height: 34, borderRadius: 8, background: 'rgba(255,255,255,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0,
                }}>{f.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ color: 'rgba(255,255,255,0.88)', fontSize: 13, fontWeight: 700 }}>{f.title}</span>
                    {f.adminOnly && (
                      <span style={{
                        fontSize: 9, fontWeight: 800, letterSpacing: '0.6px',
                        background: 'rgba(225,29,72,0.2)', color: '#fca5a5',
                        border: '1px solid rgba(225,29,72,0.3)', borderRadius: 4,
                        padding: '1px 6px', textTransform: 'uppercase',
                      }}>Admin</span>
                    )}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.42)', fontSize: 13, marginTop: 2 }}>{f.sub}</div>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                  {f.adminOnly && user?.role !== 'ADMIN' ? '🔒' : '→'}
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
