import { useNavigate } from 'react-router-dom';
import HaribonFull from './HaribonFull';
import ParticleBackground from './ParticleBackground';

export default function PageHeader({ eyebrow, title, backTo }) {
  const navigate = useNavigate();

  return (
    <section style={{
      background: 'linear-gradient(135deg,#000d30 0%,#001d5c 50%,#1a3878 100%)',
      padding: '40px 24px 0',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <ParticleBackground density={50} />
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)',
        backgroundSize: '40px 40px', pointerEvents: 'none', zIndex: 0,
      }} />

      <div style={{
        maxWidth: 1120, margin: '0 auto',
        display: 'grid', gridTemplateColumns: '1fr 120px',
        gap: 24, alignItems: 'flex-end', position: 'relative', zIndex: 1,
      }}>
        <div style={{ paddingBottom: 32 }}>
          {/* Back button */}
          <button
            onClick={() => backTo ? navigate(backTo) : navigate(-1)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 8, padding: '5px 14px',
              color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
              marginBottom: 14, transition: 'all 0.18s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
          >
            ← Back
          </button>

          <p style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase',
            marginBottom: 8, color: 'rgba(255,255,255,0.5)',
          }}>{eyebrow}</p>
          <h1 style={{
            color: '#fff', fontSize: 38, fontWeight: 900,
            lineHeight: 1.1, letterSpacing: '-1.2px', margin: 0,
          }}>{title}</h1>
        </div>
        <HaribonFull width={90} style={{ alignSelf: 'flex-end' }} />
      </div>
    </section>
  );
}
