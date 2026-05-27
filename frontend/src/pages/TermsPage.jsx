import PageHeader from '../components/PageHeader';
import ParticleBackground from '../components/ParticleBackground';

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    icon: '📜',
    grad: 'linear-gradient(135deg,#1e3a8a,#3b82f6)',
    content: `By accessing and using the DASIG Portal, you agree to be bound by these Terms of Use and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this portal. These terms apply to all users, including Guests, Members, and Administrators.`,
  },
  {
    title: '2. Use of the Portal',
    icon: '🖥️',
    grad: 'linear-gradient(135deg,#7c3aed,#a855f7)',
    content: `The DASIG Portal is provided exclusively for consortium-related activities including event registration, training enrollment, news access, funding discovery, and member communication. You agree not to use this portal for any unlawful purpose, to transmit harmful content, to attempt unauthorized access, or to misrepresent your identity or institutional affiliation.`,
  },
  {
    title: '3. User Accounts and Roles',
    icon: '👤',
    grad: 'linear-gradient(135deg,#0f766e,#14b8a6)',
    content: `Account access is governed by role assignments: Guest (limited public access), Member (full consortium access upon approval), and Admin (system management). You are responsible for maintaining the confidentiality of your account credentials. Any activity occurring under your account is your responsibility. Report unauthorized access immediately to admin@dasig.ph.`,
  },
  {
    title: '4. Membership and Institutional Data',
    icon: '🏛️',
    grad: 'linear-gradient(135deg,#b45309,#f59e0b)',
    content: `Membership data submitted through the portal is used solely for consortium administration. Institutional information is verified against CHED and DASIG records. Misrepresentation of institutional affiliation may result in immediate account suspension and reporting to the relevant institution.`,
  },
  {
    title: '5. Intellectual Property',
    icon: '💡',
    grad: 'linear-gradient(135deg,#be123c,#f43f5e)',
    content: `All content on the DASIG Portal — including text, graphics, logos, and software — is the property of the DASIG Consortium or its content providers and is protected under applicable intellectual property laws. Research outputs and publications shared through the portal are subject to the DASIG Intellectual Property and Research Output Policy.`,
  },
  {
    title: '6. Data Privacy',
    icon: '🔒',
    grad: 'linear-gradient(135deg,#065f46,#10b981)',
    content: `The DASIG Portal collects personal information in compliance with the Data Privacy Act of 2012 (Republic Act 10173). Personal data is collected only for consortium management purposes and is not shared with third parties without consent. You have the right to access, correct, and request deletion of your personal data. Contact our Data Privacy Officer at privacy@dasig.ph.`,
  },
  {
    title: '7. Disclaimer of Warranties',
    icon: '⚠️',
    grad: 'linear-gradient(135deg,#0369a1,#0ea5e9)',
    content: `The portal is provided "as is" without warranties of any kind. The DASIG Consortium does not warrant that the portal will be uninterrupted, error-free, or free of viruses. We reserve the right to modify, suspend, or discontinue any aspect of the portal at any time without notice.`,
  },
  {
    title: '8. Limitation of Liability',
    icon: '🛡️',
    grad: 'linear-gradient(135deg,#4c1d95,#8b5cf6)',
    content: `The DASIG Consortium shall not be liable for any indirect, incidental, special, or consequential damages arising from the use of or inability to use the portal, including loss of data, institutional reputation, or business opportunities.`,
  },
  {
    title: '9. Modifications to Terms',
    icon: '✏️',
    grad: 'linear-gradient(135deg,#9a3412,#f97316)',
    content: `The DASIG Consortium reserves the right to revise these Terms of Use at any time. Changes will be posted on this page with an updated effective date. Continued use of the portal after changes are posted constitutes acceptance of the revised terms.`,
  },
  {
    title: '10. Governing Law',
    icon: '⚖️',
    grad: 'linear-gradient(135deg,#1e3a8a,#4f46e5)',
    content: `These Terms of Use are governed by the laws of the Republic of the Philippines. Any disputes arising from the use of this portal shall be resolved under Philippine jurisdiction, with venue in Cebu City, Central Visayas.`,
  },
  {
    title: '11. Contact',
    icon: '📬',
    grad: 'linear-gradient(135deg,#064e3b,#059669)',
    content: `For questions about these Terms of Use, contact the DASIG Secretariat at:\nEmail: legal@dasig.ph\nAddress: DASIG Consortium Secretariat, Cebu City, Region VII, Philippines\nBusiness Hours: Monday–Friday, 8:00 AM – 5:00 PM`,
  },
];

const TERMS_CSS = `
  @keyframes cardSlide {
    from { transform: translateY(20px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  .terms-card {
    border-radius: 18px;
    padding: 22px 24px;
    cursor: default;
    transition: transform 0.22s cubic-bezier(.34,1.56,.64,1), box-shadow 0.22s;
    position: relative;
    overflow: hidden;
  }
  .terms-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 40px rgba(0,0,0,0.35);
  }
  .terms-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%);
    pointer-events: none;
  }
`;

export default function TermsPage() {
  return (
    <div style={{ background:'linear-gradient(180deg,#000d30 0%,#020817 300px,#0f172a 100%)', minHeight:'100vh', position:'relative' }}>
      <ParticleBackground density={45} />
      <div style={{ position:'relative', zIndex:1 }}>
      <style>{TERMS_CSS}</style>
      <PageHeader eyebrow="Legal" title="Terms of Use" backTo="/" />

      <section style={{ padding:'48px 24px 80px' }}>
        <div style={{ maxWidth:860, margin:'0 auto' }}>

          {/* Intro card */}
          <div style={{
            background:'linear-gradient(135deg,#001d5c 0%,#1a3878 50%,#4f46e5 100%)',
            borderRadius:22, padding:'28px 32px', marginBottom:28,
            position:'relative', overflow:'hidden',
            boxShadow:'0 16px 48px rgba(0,29,92,0.5)',
          }}>
            <div style={{
              position:'absolute', top:-30, right:-30, width:200, height:200,
              borderRadius:'50%',
              background:'radial-gradient(circle,rgba(249,115,22,0.2),transparent 70%)',
            }} />
            <div style={{ position:'absolute', bottom:-40, left:'30%', width:180, height:180, borderRadius:'50%', background:'radial-gradient(circle,rgba(99,102,241,0.2),transparent 70%)' }} />
            <div style={{ fontSize:36, marginBottom:12 }}>⚖️</div>
            <h2 style={{ fontWeight:900, fontSize:20, color:'#fff', margin:'0 0 8px' }}>DASIG Portal — Terms of Use</h2>
            <p style={{ color:'rgba(255,255,255,0.6)', fontSize:13, lineHeight:1.7, margin:'0 0 10px' }}>
              Effective Date: <strong style={{ color:'#fff' }}>January 1, 2026</strong> · Last Updated: <strong style={{ color:'#fff' }}>May 26, 2026</strong>
            </p>
            <p style={{ color:'rgba(255,255,255,0.55)', fontSize:13, lineHeight:1.75, margin:0 }}>
              These Terms of Use govern your access to and use of the DASIG Portal operated by the Data Analytics and Systems Integration Group (DASIG) Region VII Consortium.
            </p>
          </div>

          {/* Sections grid */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:24 }}>
            {SECTIONS.map((s, i) => (
              <div key={i} className="terms-card"
                style={{
                  background: s.grad,
                  animation: `cardSlide 0.4s ease ${i * 0.05}s both`,
                  gridColumn: i === SECTIONS.length - 1 && SECTIONS.length % 2 !== 0 ? 'span 2' : undefined,
                }}
              >
                <div style={{ position:'absolute', bottom:-20, right:-10, fontSize:72, opacity:0.08, lineHeight:1 }}>{s.icon}</div>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                  <div style={{
                    width:36, height:36, borderRadius:10,
                    background:'rgba(255,255,255,0.18)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:18, flexShrink:0,
                  }}>{s.icon}</div>
                  <h3 style={{ fontWeight:900, fontSize:14, color:'#fff', margin:0, lineHeight:1.3 }}>{s.title}</h3>
                </div>
                <p style={{ color:'rgba(255,255,255,0.75)', fontSize:12.5, lineHeight:1.85, margin:0, whiteSpace:'pre-line' }}>{s.content}</p>
              </div>
            ))}
          </div>

          {/* Footer note */}
          <div style={{
            background:'rgba(255,255,255,0.04)',
            border:'1px solid rgba(255,255,255,0.1)',
            borderRadius:18, padding:'24px 28px', textAlign:'center',
            backdropFilter:'blur(10px)',
          }}>
            <p style={{ color:'rgba(255,255,255,0.45)', fontSize:13, margin:'0 0 18px', lineHeight:1.7 }}>
              By using the DASIG Portal, you acknowledge that you have read, understood, and agree to these Terms of Use.
            </p>
            <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
              <a href="mailto:legal@dasig.ph" style={{
                background:'linear-gradient(90deg,#f97316,#e11d48)', color:'#fff',
                borderRadius:12, padding:'11px 26px', fontSize:13.5, fontWeight:800,
                textDecoration:'none', display:'inline-block',
                boxShadow:'0 6px 20px rgba(249,115,22,0.4)',
                transition:'all 0.2s',
              }}
              onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'}
              onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}
              >📧 Contact Legal Team</a>
            </div>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}
