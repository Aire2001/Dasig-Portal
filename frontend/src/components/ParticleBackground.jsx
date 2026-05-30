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

    // More vibrant particles — mix of blue/orange/white tones
    const particles = Array.from({ length: density }, () => {
      const hues = [
        `rgba(148,163,184,`,   // slate
        `rgba(99,102,241,`,    // indigo
        `rgba(249,115,22,`,    // orange
        `rgba(96,165,250,`,    // blue
        `rgba(255,255,255,`,   // white
      ];
      return {
        x:     Math.random() * canvas.width,
        y:     Math.random() * canvas.height,
        r:     Math.random() * 1.8 + 0.4,
        vx:    (Math.random() - 0.5) * 0.40,
        vy:    (Math.random() - 0.5) * 0.40,
        alpha: Math.random() * 0.55 + 0.15,
        pulse: Math.random() * Math.PI * 2,
        color: hues[Math.floor(Math.random() * hues.length)],
      };
    });

    // Brighter, more vibrant glowing orbs
    const orbs = [
      { x: canvas.width * 0.78, y: canvas.height * 0.22, r: 260, color: 'rgba(79,70,229,0.20)',  vx:  0.18, vy:  0.12 },
      { x: canvas.width * 0.12, y: canvas.height * 0.68, r: 200, color: 'rgba(249,115,22,0.15)', vx: -0.14, vy: -0.10 },
      { x: canvas.width * 0.52, y: canvas.height * 0.48, r: 180, color: 'rgba(225,29,72,0.10)',  vx:  0.10, vy: -0.13 },
      { x: canvas.width * 0.30, y: canvas.height * 0.25, r: 140, color: 'rgba(6,182,212,0.08)',  vx: -0.12, vy:  0.09 },
    ];

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw glowing orbs
      orbs.forEach(o => {
        o.x += o.vx; o.y += o.vy;
        if (o.x < -o.r || o.x > canvas.width  + o.r) o.vx *= -1;
        if (o.y < -o.r || o.y > canvas.height + o.r) o.vy *= -1;
        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
        g.addColorStop(0, o.color);
        g.addColorStop(0.5, o.color.replace(/[\d.]+\)$/, '0.04)'));
        g.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      });

      // Draw particles
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.pulse += 0.022;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width)  p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        const a = p.alpha * (0.65 + 0.35 * Math.sin(p.pulse));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${a.toFixed(2)})`;
        ctx.fill();
      });

      // Connecting lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < 90) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(148,163,184,${(0.13 * (1 - d / 90)).toFixed(3)})`;
            ctx.lineWidth = 0.65;
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
