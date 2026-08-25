import { useNavigate } from 'react-router-dom';
import SunSeal from './SunSeal';
import ParticleBackground from './ParticleBackground';

export default function PageHeader({ eyebrow, title, backTo }) {
  const navigate = useNavigate();

  return (
    <section style={{
      background: 'linear-gradient(135deg,#000d30 0%,#001848 50%,#0f2b66 100%)',
      padding: '36px 24px 28px',
      position: 'relative',
      overflow: 'hidden',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
    }}>
      <ParticleBackground density={40} />
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)',
        backgroundSize: '28px 28px', pointerEvents: 'none', zIndex: 0, opacity: 0.7,
      }} />

      <div style={{
        maxWidth: 1120, margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 20, position: 'relative', zIndex: 1,
      }}>
        <div>
          {/* Back button */}
          <button
            onClick={() => backTo ? navigate(backTo) : navigate(-1)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 8, padding: '5px 13px',
              color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
              marginBottom: 12, transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
          >
            ← Back
          </button>

          <p style={{
            fontSize: 11.5, fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase',
            marginBottom: 6, color: '#f97316',
          }}>{eyebrow}</p>
          <h1 style={{
            color: '#fff', fontSize: 34, fontWeight: 900,
            lineHeight: 1.15, letterSpacing: '-0.8px', margin: 0,
          }}>{title}</h1>
        </div>

        {/* Dignified Institutional Seal Badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16, padding: '12px 18px', backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        }}>
          <div style={{ filter: 'drop-shadow(0 0 12px rgba(249,115,22,0.4))' }}>
            <SunSeal size={38} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.9)', letterSpacing: '.4px' }}>
              REGION VII CONSORTIUM
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 600, marginTop: 2 }}>
              Academic &amp; Government Network
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
