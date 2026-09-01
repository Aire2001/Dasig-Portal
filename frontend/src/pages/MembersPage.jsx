import { useState, useEffect, useCallback } from 'react';
import PageHeader from '../components/PageHeader';
import ParticleBackground from '../components/ParticleBackground';
import { api } from '../api';

const MEMBER_GRADS = [
  'linear-gradient(135deg,#1e3a8a,#3b82f6)',
  'linear-gradient(135deg,#78350f,#b45309)',
  'linear-gradient(135deg,#065f46,#10b981)',
  'linear-gradient(135deg,#4c1d95,#8b5cf6)',
  'linear-gradient(135deg,#be123c,#f43f5e)',
  'linear-gradient(135deg,#0369a1,#0ea5e9)',
];

const INSTITUTION_ABOUT = {
  UP: {
    about: 'The University of the Philippines Visayas (UPV) is a premier state university under the UP System, located in Miagao, Iloilo. It is the only constituent university of UP in Western Visayas, offering undergraduate and graduate programs in fisheries, science, management, and the arts. As a national research university, UPV leads in marine science and aquatic research for the Visayas region.',
    founded: '1979',
    website: 'upv.up.edu.ph',
    email: 'ovc@upv.edu.ph',
    role: 'State University — Research & Academic Leadership',
  },
  USa: {
    about: 'The University of San Agustin (USa) is a private Catholic institution in Iloilo City, run by the Order of Saint Augustine. Established in 1904, it is one of the oldest universities in Western Visayas. USa offers programs across engineering, nursing, business, education, and the arts, and actively participates in community development and research partnerships.',
    founded: '1904',
    website: 'usa.edu.ph',
    email: 'registrar@usa.edu.ph',
    role: 'Private University — Catholic Augustinian Institution',
  },
  DOST: {
    about: 'The Department of Science and Technology (DOST) Region VII is the government\'s primary agency for scientific and technological development in Central Visayas. It provides funding for research, scholarships, and technology transfer programs. DOST Region VII supports startups and local industries through its SETUP program and administers the DOST scholarship for deserving students in the region.',
    founded: '1987',
    website: 'region7.dost.gov.ph',
    email: 'ro7@dost.gov.ph',
    role: 'Government Agency — Science & Technology',
  },
  DICT: {
    about: 'The Department of Information and Communications Technology (DICT) Region VII drives digital transformation and ICT development across Central Visayas. It implements national ICT programs including the Free Wi-Fi for All initiative, National Broadband Plan, and e-Government systems. DICT Region VII also provides digital literacy training and cybersecurity assistance to local government units.',
    founded: '2016',
    website: 'dict.gov.ph',
    email: 'ro7@dict.gov.ph',
    role: 'Government Agency — Information & Communications Technology',
  },
  DTI: {
    about: 'The Department of Trade and Industry (DTI) Region VII promotes business development, consumer protection, and trade facilitation across Central Visayas. It supports micro, small, and medium enterprises (MSMEs) through One Town One Product (OTOP) programs, Negosyo Centers, and investment promotion. DTI Region VII also enforces fair trade and consumer laws across the region.',
    founded: '1987',
    website: 'dti.gov.ph',
    email: 'ro7@dti.gov.ph',
    role: 'Government Agency — Trade & Industry Promotion',
  },
  DepEd: {
    about: 'The Department of Education (DepEd) Region VII oversees basic education — kindergarten through senior high school — across Central Visayas. It manages thousands of public schools and teachers serving millions of learners in Cebu, Bohol, Negros Oriental, and Siquijor. DepEd Region VII leads education policy implementation, curriculum delivery, and the K-12 program in the region.',
    founded: '1901',
    website: 'region7.deped.gov.ph',
    email: 'ro7@deped.gov.ph',
    role: 'Government Agency — Basic Education',
  },
  CIT: {
    about: 'Cebu Institute of Technology – University (CIT-U) is a premier autonomous higher education institution in Cebu City recognized for engineering excellence, computing, and technological innovation. CIT-U serves as a foundational academic cornerstone for regional research commercialization, software development, and industry-aligned capstone initiatives.',
    founded: '1946',
    website: 'cit.edu',
    email: 'info@cit.edu',
    role: 'Autonomous Private University — Engineering & Computing Excellence',
  },
};

// Institution logos — local SVG files in /public/logos/ (always work, no internet needed)
const MEMBER_ASSETS = {
  UP: {
    logo:  '/logos/up.svg',
    logo2: null,
    bg: 'linear-gradient(135deg,#6b1010 0%,#9b2020 60%,#7b1212 100%)',
    accent: '#ef4444', emoji: '🎓',
  },
  USa: {
    logo:  '/logos/usa.svg',
    logo2: null,
    bg: 'linear-gradient(135deg,#0f2d5c 0%,#1e4a9e 60%,#163880 100%)',
    accent: '#d4af37', emoji: '✝️',
  },
  DOST: {
    logo:  '/logos/dost.svg',
    logo2: null,
    bg: 'linear-gradient(135deg,#053d18 0%,#0a6b2e 60%,#074f22 100%)',
    accent: '#34d399', emoji: '🔬',
  },
  DICT: {
    logo:  '/logos/dict.svg',
    logo2: null,
    bg: 'linear-gradient(135deg,#041f5c 0%,#0a3a9e 60%,#082e80 100%)',
    accent: '#93c5fd', emoji: '💻',
  },
  DTI: {
    logo:  '/logos/dti.svg',
    logo2: null,
    bg: 'linear-gradient(135deg,#6b0a0a 0%,#b01e1e 60%,#8b1010 100%)',
    accent: '#fca5a5', emoji: '💼',
  },
  DepEd: {
    logo:  '/logos/deped.svg',
    logo2: null,
    bg: 'linear-gradient(135deg,#0b2d6c 0%,#1546b4 60%,#0d3892 100%)',
    accent: '#fbbf24', emoji: '📚',
  },
  CIT: {
    logo:  '/logos/cit.svg',
    logo2: null,
    bg: 'linear-gradient(135deg,#78350f 0%,#b45309 60%,#92400e 100%)',
    accent: '#fbbf24', emoji: '🦁',
  },
};

const MEMBERS_CSS = `
  .member-card {
    border-radius: 20px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: transform 0.22s cubic-bezier(0.4,0,0.2,1), border-color 0.22s ease, box-shadow 0.22s ease;
    border: 1px solid rgba(255,255,255,0.09);
    background: rgba(10,16,32,0.95);
  }
  .member-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 48px rgba(0,0,0,0.65);
  }
  .member-filter-pill {
    border-radius: 10px;
    padding: 7px 15px;
    font-size: 12.5px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.15s ease;
    display: inline-flex;
    align-items: center;
    gap: 7px;
  }
`;

export default function MembersPage() {
  const [members, setMembers]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch]     = useState('');
  const [typeF, setTypeF]       = useState('All');
  const [readingId, setReadingId] = useState(null);

  useEffect(() => {
    api.members.list()
      .then(setMembers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function cleanSpeechText(text) {
    if (!text) return '';
    return text
      .replace(/https?:\/\/\S+/gi, '')
      .replace(/[\*\_\~`#]/g, '')
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/^[•▸\-\*\d+\.]\s*/gm, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function getBestVoice() {
    if (!window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices() || [];
    const natural = voices.find(v => /natural|neural|online/i.test(v.name) && (/english|en[-_]/i.test(v.lang)));
    if (natural) return natural;
    const google = voices.find(v => /google/i.test(v.name) && /en[-_]/i.test(v.lang));
    if (google) return google;
    return voices.find(v => v.lang?.startsWith('en')) || voices[0];
  }

  async function speakInstitutionAudio(m) {
    if (readingId === m.abbr) {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      setReadingId(null);
      return;
    }

    if (window.speechSynthesis) window.speechSynthesis.cancel();
    const info = INSTITUTION_ABOUT[m.abbr];
    const speech = `${m.full_name}, ${m.campus}. ${info ? info.about : ''}`;
    const clean = cleanSpeechText(speech);
    if (!clean) return;

    setReadingId(m.abbr);

    try {
      const res = await api.chatbot.tts(clean, 'Adam');
      const contentType = res.headers?.get('content-type') || '';
      if (res.ok && contentType.includes('audio/mpeg')) {
        const blob = await res.blob();
        const audio = new Audio(URL.createObjectURL(blob));
        audio.onended = () => setReadingId(null);
        audio.onerror = () => fallbackSpeak(m.abbr, clean);
        await audio.play();
        return;
      }
    } catch (_) {}

    fallbackSpeak(m.abbr, clean);
  }

  function fallbackSpeak(id, clean) {
    if (!window.speechSynthesis) {
      setReadingId(null);
      return;
    }
    const utter = new SpeechSynthesisUtterance(clean);
    const bestVoice = getBestVoice();
    if (bestVoice) utter.voice = bestVoice;
    utter.rate = 0.96;
    utter.pitch = 1.0;
    utter.onend = () => setReadingId(null);
    utter.onerror = () => setReadingId(null);
    setReadingId(id);
    window.speechSynthesis.speak(utter);
  }

  const TYPES = ['All', 'State University', 'Private University', 'Government Agency'];

  const filteredMembers = members.filter(m => {
    const matchSearch = !search.trim() ||
      m.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      m.abbr?.toLowerCase().includes(search.toLowerCase()) ||
      m.campus?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeF === 'All' || m.type === typeF;
    return matchSearch && matchType;
  });

  const selectedGrad = selected
    ? MEMBER_GRADS[members.indexOf(selected) % MEMBER_GRADS.length]
    : MEMBER_GRADS[0];

  return (
    <div style={{ background: 'linear-gradient(180deg,#000d30 0%,#020817 300px,#0f172a 100%)', minHeight: '100vh', position: 'relative' }}>
      <ParticleBackground density={45} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <style>{MEMBERS_CSS}</style>
        <PageHeader eyebrow="Consortium Members" title="Region VII Institutions" />

        {/* Member detail modal */}
        {selected && (() => {
          const info = INSTITUTION_ABOUT[selected.abbr];
          const asset = MEMBER_ASSETS[selected.abbr] || { bg: selectedGrad, emoji: '🏛️', accent: '#f97316' };
          const email = selected.email || info?.email;
          const website = selected.website || info?.website;
          return (
            <div onClick={() => setSelected(null)} style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 999999,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '72px 20px 36px',
              backdropFilter: 'blur(10px)', overflowY: 'auto',
            }}>
              <div onClick={e => e.stopPropagation()} style={{
                background: '#0d1424', borderRadius: 24, maxWidth: 'min(580px,calc(100vw - 32px))', width: '100%',
                boxShadow: '0 40px 120px rgba(0,0,0,0.95), 0 0 0 1px rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.1)',
                maxHeight: 'calc(100vh - 90px)', display: 'flex', flexDirection: 'column', margin: 'auto',
                position: 'relative',
              }}>
                {/* ── ✕ always-visible close button — outside overflow:hidden ── */}
                <button onClick={() => setSelected(null)} style={{
                  position: 'absolute', top: 14, right: 14, zIndex: 100,
                  background: 'rgba(0,0,0,0.70)', border: '2px solid rgba(255,255,255,0.5)',
                  backdropFilter: 'blur(10px)', borderRadius: '50%', width: 40, height: 40,
                  color: '#fff', fontSize: 18, fontWeight: 900, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.6)', transition: 'all .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background='rgba(225,29,72,0.85)'; e.currentTarget.style.borderColor='rgba(225,29,72,0.7)'; e.currentTarget.style.transform='scale(1.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.background='rgba(0,0,0,0.70)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.5)'; e.currentTarget.style.transform='scale(1)'; }}
                >✕</button>

                {/* ── Hero: institution logo on official-color background ── */}
                <div style={{ background: asset.bg, padding: '32px 24px 24px', position: 'relative', overflow: 'hidden', flexShrink: 0, borderRadius: '24px 24px 0 0' }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.15) 0%, transparent 65%)', pointerEvents: 'none' }} />

                  {/* Type badge — left side only */}
                  <div style={{ position: 'absolute', top: 14, left: 14 }}>
                    <span style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)', color: '#fff', borderRadius: 7, padding: '5px 13px', fontSize: 12, fontWeight: 800, border: '1px solid rgba(255,255,255,0.3)' }}>
                      {selected.type}
                    </span>
                  </div>

                  {/* Official logo centered */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                    <ModalLogo asset={asset} abbr={selected.abbr} name={selected.full_name} />
                    <div>
                      <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 900, margin: '0 0 6px', lineHeight: 1.25, textAlign: 'center', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>{selected.full_name}</h2>
                      <div style={{ color: 'rgba(255,255,255,0.78)', fontSize: 13, textAlign: 'center', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>📍 {selected.campus}</div>
                    </div>

                    {/* Audio Narration Button */}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); speakInstitutionAudio(selected); }}
                      style={{
                        background: readingId === selected.abbr ? 'rgba(225,29,72,0.35)' : 'rgba(0,0,0,0.45)',
                        border: `1px solid ${readingId === selected.abbr ? 'rgba(225,29,72,0.6)' : 'rgba(255,255,255,0.25)'}`,
                        borderRadius: 20, padding: '6px 14px',
                        color: readingId === selected.abbr ? '#fca5a5' : '#fff',
                        fontSize: 12, fontWeight: 800, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 7, backdropFilter: 'blur(8px)',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.4)',
                      }}
                    >
                      <span>{readingId === selected.abbr ? '⏸' : '🎧'}</span>
                      <span>{readingId === selected.abbr ? 'Playing Overview…' : 'Listen to Overview (AI Voice)'}</span>
                    </button>
                  </div>
                </div>

                {/* ── Details ── */}
                <div style={{ overflowY: 'auto', flex: 1, padding: '22px 26px 26px' }}>
                  {/* About */}
                  {info && (
                    <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 13.5, lineHeight: 1.8, marginBottom: 20, borderLeft: '3px solid rgba(249,115,22,0.6)', paddingLeft: 14, background: 'rgba(255,255,255,0.03)', borderRadius: '0 8px 8px 0', padding: '12px 14px' }}>
                      {info.about}
                    </p>
                  )}

                  {/* Info grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
                    {[
                      { l: 'Abbreviation', v: selected.abbr },
                      { l: 'Type',         v: selected.type },
                      { l: 'Campus',       v: selected.campus },
                      { l: 'Region',       v: 'Region VII' },
                      ...(info ? [{ l: 'Founded', v: info.founded }, { l: 'Role', v: info.role }] : []),
                    ].map(r => (
                      <div key={r.l} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 14px' }}>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: 700, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{r.l}</div>
                        <div style={{ fontSize: 13.5, color: '#fff', fontWeight: 700, lineHeight: 1.4 }}>{r.v}</div>
                      </div>
                    ))}
                  </div>

                  {/* Contact links */}
                  {(email || website) && (
                    <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                      {email && (
                        <a href={`mailto:${email}`} style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)', borderRadius: 9, padding: '8px 14px', fontSize: 12.5, color: '#60a5fa', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                          ✉️ {email}
                        </a>
                      )}
                      {website && (
                        <a href={`https://${website}`} target="_blank" rel="noopener noreferrer" style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: 9, padding: '8px 14px', fontSize: 12.5, color: '#34d399', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                          🌐 {website}
                        </a>
                      )}
                    </div>
                  )}

                  <button onClick={() => setSelected(null)} style={{
                    width: '100%', background: selectedGrad, color: '#fff', border: 'none',
                    borderRadius: 13, padding: '13px', fontSize: 14.5, fontWeight: 800,
                    cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 18px rgba(0,0,0,0.35)',
                    transition: 'opacity .15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >Close</button>
                </div>
              </div>
            </div>
          );
        })()}

        <section style={{ padding: '40px 24px 80px' }}>
          <div style={{ maxWidth: 1120, margin: '0 auto' }}>

            {/* Stats bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 32 }}>
              {[
                { label: 'Member Institutions', value: members.length || 6, icon: '🏛️', color: '#60a5fa' },
                { label: 'Regional Scope',       value: 'Region VII',       icon: '📍', color: '#34d399' },
                { label: 'Consortium Active',    value: 'Since 2022',       icon: '📅', color: '#a78bfa' },
              ].map(s => (
                <div key={s.label} style={{
                  background: 'rgba(8, 14, 28, 0.75)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 16, padding: '18px 20px',
                  display: 'flex', alignItems: 'center', gap: 14,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                  position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: `${s.color}15`, border: `1px solid ${s.color}35`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, flexShrink: 0,
                  }}>{s.icon}</div>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 600, marginTop: 3 }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* About the Consortium */}
            <div style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 20, padding: '28px 32px', marginBottom: 32,
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: -30, right: -20, fontSize: 120, opacity: 0.04, lineHeight: 1 }}>🏛️</div>
              <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ flex: 2, minWidth: 260 }}>
                  <div style={{
                    fontSize: 12, fontWeight: 800, letterSpacing: '.8px', textTransform: 'uppercase', marginBottom: 9,
                    background: 'linear-gradient(90deg,#f97316,#e11d48)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                  }}>About the Consortium</div>
                  <h3 style={{ color: '#fff', fontSize: 20, fontWeight: 900, marginBottom: 12, letterSpacing: '-0.3px', lineHeight: 1.3 }}>
                    DASIG — Dynamic Academic and Scientific Information Group
                  </h3>
                  <p style={{ color: 'rgba(255,255,255,0.62)', fontSize: 13.5, lineHeight: 1.8, marginBottom: 16 }}>
                    DASIG is a Region VII consortium of higher education institutions and government agencies in the Philippines,
                    united under a shared mission of collaborative research, governance innovation, and knowledge sharing.
                    Established in 2022, the consortium fosters inter-institutional cooperation across Central and Western Visayas.
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.75, margin: 0 }}>
                    Member institutions span state universities, private universities, and key government agencies —
                    all working together to advance digital transformation, research excellence, and public service delivery
                    across the Visayas region.
                  </p>
                </div>
                <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { icon: '🎯', label: 'Mission', text: 'Collaborative research and governance innovation for Region VII institutions.' },
                    { icon: '🌐', label: 'Coverage', text: 'Central & Western Visayas — Cebu, Iloilo, Bacolod and surrounding areas.' },
                    { icon: '📅', label: 'Founded', text: 'Established 2022 with six founding member institutions.' },
                    { icon: '🔐', label: 'Platform', text: 'Secure role-based portal: Guest, Member, and Admin access levels.' },
                  ].map(item => (
                    <div key={item.label} style={{
                      display: 'flex', gap: 10, alignItems: 'flex-start',
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 12, padding: '11px 14px',
                    }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 3 }}>{item.label}</div>
                        <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.72)', lineHeight: 1.5 }}>{item.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Section heading & Filter Bar */}
            <div style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16, padding: '12px 18px', marginBottom: 28,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
              backdropFilter: 'blur(8px)',
            }}>
              {/* Category Pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: 1 }}>
                {TYPES.map(t => {
                  const count = t === 'All' ? members.length : members.filter(m => m.type === t).length;
                  const isActive = typeF === t;
                  return (
                    <button
                      key={t}
                      className="member-filter-pill"
                      onClick={() => setTypeF(t)}
                      style={{
                        background: isActive ? 'linear-gradient(90deg,#f97316,#e11d48)' : 'rgba(255,255,255,0.06)',
                        color: isActive ? '#fff' : 'rgba(255,255,255,0.65)',
                        border: `1px solid ${isActive ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
                        boxShadow: isActive ? '0 4px 12px rgba(249,115,22,0.35)' : 'none',
                      }}
                    >
                      <span>{t === 'All' ? 'All Institutions' : t}</span>
                      <span style={{
                        fontSize: 10,
                        background: isActive ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.1)',
                        borderRadius: 10,
                        padding: '1px 6px',
                        fontWeight: 800,
                      }}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Search input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="text"
                  placeholder="Search institution, campus…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{
                    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)',
                    borderRadius: 10, padding: '8px 14px', color: '#fff', fontSize: 13,
                    fontFamily: 'inherit', outline: 'none', width: 220,
                  }}
                  onFocus={e => e.target.style.borderColor = '#f97316'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.14)'}
                />
                {search && (
                  <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 13 }}>✕</button>
                )}
                <button
                  onClick={() => { setLoading(true); api.members.list().then(setMembers).catch(()=>{}).finally(()=>setLoading(false)); }}
                  title="Refresh member list"
                  style={{
                    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)',
                    borderRadius: 10, padding: '8px 13px', color: 'rgba(255,255,255,0.7)',
                    fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  ↻
                </button>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.35)' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>Loading consortium members…
              </div>
            ) : filteredMembers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.4)' }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>🏛️</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>No institutions match your search</div>
                <button onClick={() => { setSearch(''); setTypeF('All'); }} style={{ marginTop: 14, background:'rgba(249,115,22,0.2)', color:'#fb923c', border:'1px solid rgba(249,115,22,0.4)', borderRadius:12, padding:'8px 18px', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                  Clear Filters
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 20 }}>
                {filteredMembers.map((m, i) => (
                  <MemberCard
                    key={m.id}
                    member={m}
                    grad={MEMBER_GRADS[i % MEMBER_GRADS.length]}
                    index={i}
                    onClick={() => setSelected(m)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

// Logo with 3-tier fallback
function LogoImg({ asset, abbr, name, size = 100, style = {} }) {
  const [src, setSrc] = useState(asset.logo);
  const [tried, setTried] = useState(0);

  function handleError() {
    if (tried === 0 && asset.logo2) { setSrc(asset.logo2); setTried(1); }
    else setSrc(null);
  }

  if (!src) {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)',
        border: '2px solid rgba(255,255,255,0.35)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: size * 0.04, ...style,
      }}>
        <span style={{ fontSize: size * 0.32 }}>{asset.emoji || '🏛️'}</span>
        <span style={{ fontSize: size * 0.14, fontWeight: 900, color: '#fff', letterSpacing: '0.5px', textAlign: 'center', lineHeight: 1, padding: '0 4px' }}>{abbr}</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={name}
      onError={handleError}
      style={{ width: size, height: size, objectFit: 'contain', display: 'block', ...style }}
    />
  );
}

function ModalLogo({ asset, abbr, name }) {
  return <LogoImg asset={asset} abbr={abbr} name={name} size={110} style={{ filter: 'drop-shadow(0 6px 20px rgba(0,0,0,0.55))' }} />;
}

function MemberCard({ member: m, grad, index, onClick }) {
  const [hov, setHov] = useState(false);
  const asset = MEMBER_ASSETS[m.abbr] || { logo: null, logo2: null, bg: grad, accent: '#f97316', emoji: '🏛️' };
  const info = INSTITUTION_ABOUT[m.abbr];

  return (
    <div
      className="member-card"
      style={{
        background: 'rgba(10,16,32,0.96)',
        border: `1.5px solid ${hov ? asset.accent + '80' : 'rgba(255,255,255,0.08)'}`,
        boxShadow: hov ? `0 20px 48px ${asset.accent}20, 0 0 20px ${asset.accent}15` : '0 4px 20px rgba(0,0,0,0.4)',
        transform: hov ? 'translateY(-5px)' : 'none',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
    >
      {/* ── Logo on institution-color header ── */}
      <div style={{ background: asset.bg, height: 175, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10 }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 35%, rgba(255,255,255,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
        
        {/* Type Badge top-right */}
        <div style={{ position: 'absolute', top: 12, right: 12 }}>
          <span style={{
            background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)',
            color: '#fff', borderRadius: 7, padding: '4px 10px',
            fontSize: 11.5, fontWeight: 800, border: '1px solid rgba(255,255,255,0.25)',
          }}>
            {m.type}
          </span>
        </div>

        {/* Logo container */}
        <div style={{ position: 'relative', zIndex: 1, transition: 'transform .3s ease', transform: hov ? 'scale(1.08)' : 'scale(1)' }}>
          <LogoImg
            asset={asset}
            abbr={m.abbr}
            name={m.full_name}
            size={84}
            style={{ filter: 'drop-shadow(0 6px 18px rgba(0,0,0,0.6))' }}
          />
        </div>

        {/* Abbreviation label */}
        <div style={{ color: '#fff', fontWeight: 900, fontSize: 15, letterSpacing: '0.6px', textShadow: '0 2px 8px rgba(0,0,0,0.8)', position: 'relative', zIndex: 1 }}>
          {m.abbr}
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 36, background: 'linear-gradient(to bottom, transparent, rgba(10,16,32,0.85))' }} />
      </div>

      {/* ── Card body ── */}
      <div style={{ padding: '16px 18px 18px' }}>
        <div style={{ fontWeight: 800, fontSize: 14.5, color: '#fff', lineHeight: 1.35, marginBottom: 5 }}>
          {m.full_name}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12.5, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span>📍</span>
          <span>{m.campus}</span>
        </div>

        {/* Bottom meta row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)', fontWeight: 700 }}>
            {info?.founded ? `🏛️ Est. ${info.founded}` : '✓ Region VII Member'}
          </span>
          <span style={{ fontSize: 12.5, color: hov ? '#f97316' : 'rgba(255,255,255,0.4)', fontWeight: 700, transition: 'color .15s' }}>
            View details →
          </span>
        </div>
      </div>
    </div>
  );
}
