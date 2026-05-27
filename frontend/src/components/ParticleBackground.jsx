import { useEffect, useRef } from 'react';

export default function ParticleBackground({ density = 60 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;

    function resize() {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: density }, () => ({
      x:     Math.random() * canvas.width,
      y:     Math.random() * canvas.height,
      r:     Math.random() * 1.6 + 0.4,
      vx:    (Math.random() - 0.5) * 0.38,
      vy:    (Math.random() - 0.5) * 0.38,
      alpha: Math.random() * 0.45 + 0.12,
      pulse: Math.random() * Math.PI * 2,
    }));

    const orbs = [
      { x: canvas.width * 0.75, y: canvas.height * 0.25, r: 200, color: 'rgba(79,70,229,0.14)',  vx:  0.20, vy:  0.13 },
      { x: canvas.width * 0.15, y: canvas.height * 0.65, r: 150, color: 'rgba(249,115,22,0.10)', vx: -0.15, vy: -0.10 },
      { x: canvas.width * 0.50, y: canvas.height * 0.50, r: 120, color: 'rgba(225,29,72,0.07)',  vx:  0.11, vy: -0.14 },
    ];

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      orbs.forEach(o => {
        o.x += o.vx; o.y += o.vy;
        if (o.x < -o.r || o.x > canvas.width  + o.r) o.vx *= -1;
        if (o.y < -o.r || o.y > canvas.height + o.r) o.vy *= -1;
        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
        g.addColorStop(0, o.color);
        g.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      });

      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.pulse += 0.022;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width)  p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        const a = p.alpha * (0.7 + 0.3 * Math.sin(p.pulse));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(148,163,184,${a})`;
        ctx.fill();
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < 85) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(148,163,184,${0.11 * (1 - d / 85)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 0,
      }}
    />
  );
}
