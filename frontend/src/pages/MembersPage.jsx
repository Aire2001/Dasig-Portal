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
};

// Official institution logos/seals from Wikimedia Commons + official websites
const MEMBER_ASSETS = {
  UP: {
    logo: 'https://upload.wikimedia.org/wikipedia/en/b/b7/UP_seal.png',
    bg: 'linear-gradient(135deg,#7b1113 0%,#a82323 60%,#8B1a1a 100%)',
    accent: '#c0392b',
    emoji: '🎓',
  },
  USa: {
    logo: 'https://upload.wikimedia.org/wikipedia/en/d/d8/Coat_of_arms_of_the_University_of_San_Agustin.png',
    bg: 'linear-gradient(135deg,#1a3a6c 0%,#2a5298 60%,#1e4080 100%)',
    accent: '#3b82f6',
    emoji: '🏫',
  },
  DOST: {
    logo: 'https://upload.wikimedia.org/wikipedia/commons/8/8d/DOST_seal.png',
    bg: 'linear-gradient(135deg,#064e1e 0%,#0d7a3a 60%,#065f46 100%)',
    accent: '#10b981',
    emoji: '🔬',
  },
  DICT: {
    logo: 'https://upload.wikimedia.org/wikipedia/en/0/0c/DICT_logo.png',
    bg: 'linear-gradient(135deg,#003087 0%,#0052cc 60%,#1a4fcc 100%)',
    accent: '#3b82f6',
    emoji: '💻',
  },
  DTI: {
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/DTI_Logo_%282022%29.svg/300px-DTI_Logo_%282022%29.svg.png',
    bg: 'linear-gradient(135deg,#8B0000 0%,#c0392b 60%,#a01f1f 100%)',
    accent: '#ef4444',
    emoji: '💼',
  },
  DepEd: {
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/DepEd-Seal.svg/300px-DepEd-Seal.svg.png',
    bg: 'linear-gradient(135deg,#0f3d7a 0%,#1a56db 60%,#154987 100%)',
    accent: '#3b82f6',
    emoji: '📚',
  },
};

const MEMBERS_CSS = `
  @keyframes cardUp {
    from { transform: translateY(20px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  @keyframes modalIn {
    from { transform: scale(0.88) translateY(20px); opacity: 0; }
    to   { transform: scale(1) translateY(0); opacity: 1; }
  }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .member-card {
    border-radius: 20px;
    padding: 26px 22px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: transform 0.22s cubic-bezier(.34,1.56,.64,1), box-shadow 0.22s;
    border: 1px solid rgba(255,255,255,0.1);
  }
  .member-card:hover {
    transform: translateY(-6px) scale(1.025);
    box-shadow: 0 20px 48px rgba(0,0,0,0.4);
  }
  .member-card::after {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 55%);
    pointer-events: none;
  }
`;

export default function MembersPage() {
  const [members, setMembers]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.members.list()
      .then(setMembers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 9100,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
              animation: 'fadeIn 0.18s ease', backdropFilter: 'blur(4px)', overflowY: 'auto',
            }}>
              <div onClick={e => e.stopPropagation()} style={{
                background: '#0d1424', borderRadius: 24, maxWidth: 580, width: '100%',
                boxShadow: '0 40px 120px rgba(0,0,0,0.85)', overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.1)',
                animation: 'modalIn 0.26s cubic-bezier(.34,1.3,.64,1)',
                maxHeight: '92vh', display: 'flex', flexDirection: 'column', margin: 'auto',
              }}>

                {/* ── Hero: institution logo on official-color background ── */}
                <div style={{ background: asset.bg, padding: '32px 24px 24px', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.15) 0%, transparent 65%)', pointerEvents: 'none' }} />

                  {/* Close */}
                  <button onClick={() => setSelected(null)} style={{
                    position: 'absolute', top: 14, right: 14,
                    background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.25)',
                    backdropFilter: 'blur(8px)', borderRadius: '50%', width: 34, height: 34,
                    color: '#fff', fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>✕</button>

                  {/* Type badge */}
                  <div style={{ position: 'absolute', top: 14, left: 14 }}>
                    <span style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)', color: '#fff', borderRadius: 7, padding: '4px 12px', fontSize: 11, fontWeight: 800, border: '1px solid rgba(255,255,255,0.25)' }}>
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
                  </div>
                </div>

                {/* ── Details ── */}
                <div style={{ overflowY: 'auto', flex: 1, padding: '22px 26px 26px' }}>
                  {/* About */}
                  {info && (
                    <p style={{ color: 'rgba(255,255,255,0.68)', fontSize: 13.5, lineHeight: 1.8, marginBottom: 20, borderLeft: '3px solid rgba(249,115,22,0.6)', paddingLeft: 14, background: 'rgba(255,255,255,0.03)', borderRadius: '0 8px 8px 0', padding: '12px 14px' }}>
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
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{r.l}</div>
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
            <div style={{ display: 'flex', gap: 14, marginBottom: 36 }}>
              {[
                { label: 'Member Institutions', value: members.length || 6, icon: '🏛️', grad: 'linear-gradient(135deg,#1e3a8a,#3b82f6)' },
                { label: 'Region VII',           value: 'VII',              icon: '📍', grad: 'linear-gradient(135deg,#7c3aed,#a855f7)' },
                { label: 'Active Since',         value: '2022',             icon: '📅', grad: 'linear-gradient(135deg,#065f46,#10b981)' },
              ].map(s => (
                <div key={s.label} style={{
                  flex: 1, background: s.grad, borderRadius: 16, padding: '18px 20px',
                  display: 'flex', alignItems: 'center', gap: 14,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                  position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{ position: 'absolute', bottom: -10, right: 5, fontSize: 56, opacity: 0.1, lineHeight: 1 }}>{s.icon}</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#fff' }}>{s.value}</div>
                  <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{s.label}</div>
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
                    fontSize: 10.5, fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 8,
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
                        <div style={{ fontSize: 10.5, fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>{item.label}</div>
                        <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.72)', lineHeight: 1.5 }}>{item.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Section heading */}
            <div style={{ marginBottom: 20 }}>
              <div style={{
                fontSize: 10.5, fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 6,
                background: 'linear-gradient(90deg,#f97316,#e11d48)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>Member Institutions</div>
              <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0 }}>
                Click any institution to learn more
              </h3>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.35)' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>Loading members…
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18 }}>
                {members.map((m, i) => (
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

function ModalLogo({ asset, abbr, name }) {
  const [ok, setOk] = useState(true);
  return ok ? (
    <img
      src={asset.logo}
      alt={name}
      onError={() => setOk(false)}
      style={{ width: 110, height: 110, objectFit: 'contain', filter: 'drop-shadow(0 6px 20px rgba(0,0,0,0.55))', display: 'block' }}
    />
  ) : (
    <div style={{ width: 100, height: 100, borderRadius: 24, background: 'rgba(255,255,255,0.18)', border: '2px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>
      {abbr}
    </div>
  );
}

function MemberCard({ member: m, grad, index, onClick }) {
  const [hov, setHov] = useState(false);
  const [logoOk, setLogoOk] = useState(true);
  const asset = MEMBER_ASSETS[m.abbr] || { bg: grad, emoji: '🏛️', accent: '#f97316' };

  return (
    <div
      className="member-card"
      style={{
        background: 'rgba(12,18,36,0.96)',
        animationDelay: `${index * 0.07}s`, animation: 'cardUp 0.5s ease both',
        padding: 0, overflow: 'hidden', cursor: 'pointer',
        border: `1.5px solid ${hov ? asset.accent + '80' : 'rgba(255,255,255,0.08)'}`,
        boxShadow: hov ? `0 20px 50px ${asset.accent}25` : '0 4px 20px rgba(0,0,0,0.35)',
        transform: hov ? 'translateY(-7px) scale(1.02)' : 'none',
        transition: 'all 0.24s cubic-bezier(.34,1.56,.64,1)',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
    >
      {/* ── Institution header with official logo ── */}
      <div style={{ background: asset.bg, height: 170, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        {/* Subtle radial glow */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        {/* Type badge top-right */}
        <div style={{ position: 'absolute', top: 12, right: 12 }}>
          <span style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)', color: '#fff', borderRadius: 7, padding: '4px 11px', fontSize: 10.5, fontWeight: 800, border: '1px solid rgba(255,255,255,0.25)' }}>{m.type}</span>
        </div>
        {/* Official logo / seal */}
        {logoOk ? (
          <img
            src={asset.logo}
            alt={m.full_name}
            onError={() => setLogoOk(false)}
            style={{ width: 90, height: 90, objectFit: 'contain', filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.6))', transition: 'transform .3s ease', transform: hov ? 'scale(1.08)' : 'scale(1)', position: 'relative', zIndex: 1 }}
          />
        ) : (
          /* Fallback: styled abbreviation badge */
          <div style={{ width: 86, height: 86, borderRadius: 22, background: 'rgba(255,255,255,0.18)', border: '2px solid rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', boxShadow: '0 6px 20px rgba(0,0,0,0.4)', position: 'relative', zIndex: 1 }}>
            {m.abbr}
          </div>
        )}
        {/* Abbr label below logo */}
        <div style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 900, fontSize: 14, letterSpacing: '0.5px', marginTop: 10, textShadow: '0 1px 6px rgba(0,0,0,0.7)', position: 'relative', zIndex: 1 }}>
          {m.abbr}
        </div>
        {/* Bottom gradient fade into card body */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, background: 'linear-gradient(to bottom, transparent, rgba(12,18,36,0.6))' }} />
      </div>

      {/* ── Card body ── */}
      <div style={{ padding: '14px 18px 17px' }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: '#fff', lineHeight: 1.35, marginBottom: 5 }}>{m.full_name}</div>
        <div style={{ color: 'rgba(255,255,255,0.42)', fontSize: 12.5, marginBottom: 14 }}>📍 {m.campus}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ background: `${asset.accent}18`, color: asset.accent, border: `1px solid ${asset.accent}40`, borderRadius: 7, padding: '4px 11px', fontSize: 11.5, fontWeight: 700 }}>{m.type}</span>
          <span style={{ fontSize: 12.5, color: hov ? asset.accent : 'rgba(255,255,255,0.35)', fontWeight: 700, transition: 'color .15s' }}>View details →</span>
        </div>
      </div>
    </div>
  );
}
