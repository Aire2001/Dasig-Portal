import { useNavigate } from 'react-router-dom';
import ParticleBackground from '../components/ParticleBackground';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(180deg,#000d30 0%,#020817 100%)', display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
      <ParticleBackground density={40} />
      <div style={{ position:'relative', zIndex:1, textAlign:'center', padding:'0 24px' }}>
        <div style={{ fontSize:96, fontWeight:900, background:'linear-gradient(90deg,#f97316,#e11d48)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', lineHeight:1, marginBottom:8 }}>404</div>
        <div style={{ color:'rgba(255,255,255,0.9)', fontSize:24, fontWeight:800, marginBottom:12 }}>Page Not Found</div>
        <p style={{ color:'rgba(255,255,255,0.4)', fontSize:14.5, lineHeight:1.7, maxWidth:380, margin:'0 auto 32px' }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          <button onClick={() => navigate(-1)} style={{ background:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.75)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:12, padding:'12px 24px', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.14)'; }}
            onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.08)'; }}>
            ← Go Back
          </button>
          <button onClick={() => navigate('/')} style={{ background:'linear-gradient(90deg,#f97316,#e11d48)', color:'#fff', border:'none', borderRadius:12, padding:'12px 24px', fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 18px rgba(249,115,22,0.4)', transition:'opacity .15s' }}
            onMouseEnter={e => { e.currentTarget.style.opacity='.88'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity='1'; }}>
            🏠 Go to Home
          </button>
        </div>
        <div style={{ marginTop:40, color:'rgba(255,255,255,0.2)', fontSize:12 }}>DASIG Portal · Region VII Consortium</div>
      </div>
    </div>
  );
}
