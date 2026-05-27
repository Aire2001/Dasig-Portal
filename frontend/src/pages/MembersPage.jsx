import { useState, useEffect } from 'react';
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
        {selected && (
          <div onClick={() => setSelected(null)} style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 9100,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
            animation: 'fadeIn 0.18s ease',
          }}>
            <div onClick={e => e.stopPropagation()} style={{
              background: 'linear-gradient(180deg,#0f172a,#020817)', borderRadius: 22, maxWidth: 520, width: '100%',
              boxShadow: '0 32px 100px rgba(0,0,0,0.75)', overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.1)',
              animation: 'modalIn 0.26s cubic-bezier(.34,1.3,.64,1)',
            }}>
              {/* banner */}
              <div style={{ background: selectedGrad, padding: '30px 28px 24px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', bottom: -24, right: -12, fontSize: 110, opacity: 0.08, lineHeight: 1 }}>🏛️</div>
                <button onClick={() => setSelected(null)} style={{
                  position: 'absolute', top: 14, right: 14,
                  background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%',
                  width: 32, height: 32, color: '#fff', fontSize: 16, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>✕</button>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 64, height: 64, borderRadius: 18,
                  background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.3)',
                  fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px',
                  marginBottom: 14,
                }}>{selected.abbr}</div>
                <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 900, margin: '0 0 6px', lineHeight: 1.25 }}>{selected.full_name}</h2>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600 }}>📍 {selected.campus}</div>
              </div>

              {/* details */}
              <div style={{ padding: '24px 28px 30px', maxHeight: '60vh', overflowY: 'auto' }}>
                {/* About description */}
                {(() => {
                  const info = INSTITUTION_ABOUT[selected.abbr];
                  return info ? (
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>About</div>
                      <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 13, lineHeight: 1.8, margin: 0 }}>{info.about}</p>
                    </div>
                  ) : null;
                })()}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                  {[
                    { label: 'Abbreviation', value: selected.abbr },
                    { label: 'Type',         value: selected.type },
                    { label: 'Campus',       value: selected.campus },
                    { label: 'Region',       value: 'Region VII' },
                    ...(INSTITUTION_ABOUT[selected.abbr] ? [
                      { label: 'Founded',    value: INSTITUTION_ABOUT[selected.abbr].founded },
                      { label: 'Role',       value: INSTITUTION_ABOUT[selected.abbr].role },
                    ] : []),
                  ].map(r => (
                    <div key={r.label} style={{
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 12, padding: '12px 14px',
                    }}>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{r.label}</div>
                      <div style={{ fontSize: 13, color: '#fff', fontWeight: 700, lineHeight: 1.4 }}>{r.value}</div>
                    </div>
                  ))}
                </div>

                {/* Contact links from lookup or DB */}
                {(() => {
                  const info = INSTITUTION_ABOUT[selected.abbr];
                  const email = selected.email || (info?.email);
                  const website = selected.website || (info?.website);
                  return (
                    <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
                      {email && (
                        <div style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)', borderRadius: 9, padding: '7px 13px', fontSize: 12.5, color: '#60a5fa', fontWeight: 600 }}>
                          ✉️ {email}
                        </div>
                      )}
                      {website && (
                        <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: 9, padding: '7px 13px', fontSize: 12.5, color: '#34d399', fontWeight: 600 }}>
                          🌐 {website}
                        </div>
                      )}
                    </div>
                  );
                })()}

                <button onClick={() => setSelected(null)} style={{
                  width: '100%', background: selectedGrad, color: '#fff', border: 'none',
                  borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 800,
                  cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                }}>Close</button>
              </div>
            </div>
          </div>
        )}

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

function MemberCard({ member: m, grad, index, onClick }) {
  return (
    <div className="member-card"
      style={{ background: grad, animationDelay: `${index * 0.07}s`, animation: 'cardUp 0.5s ease both' }}
      onClick={onClick}
    >
      <div style={{ position: 'absolute', bottom: -20, right: -10, fontSize: 90, opacity: 0.08, lineHeight: 1 }}>🏛️</div>

      {/* Abbr badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 52, height: 52, borderRadius: 15,
        background: 'rgba(255,255,255,0.18)',
        fontWeight: 900, fontSize: 14, color: '#fff',
        marginBottom: 14, letterSpacing: '-0.5px',
        border: '1px solid rgba(255,255,255,0.25)',
      }}>{m.abbr}</div>

      <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 4, letterSpacing: '-0.5px' }}>{m.abbr}</div>
      <div style={{ fontWeight: 700, fontSize: 13.5, color: 'rgba(255,255,255,0.85)', marginBottom: 6, lineHeight: 1.4 }}>{m.full_name}</div>
      <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12.5, marginBottom: 14 }}>📍 {m.campus}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          background: 'rgba(255,255,255,0.2)', color: '#fff',
          border: '1px solid rgba(255,255,255,0.25)',
          borderRadius: 8, padding: '4px 12px', fontSize: 11.5, fontWeight: 700,
        }}>{m.type}</span>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>View →</span>
      </div>
    </div>
  );
}
