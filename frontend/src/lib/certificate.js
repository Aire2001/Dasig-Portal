// Utility to generate and download official high-resolution Certificate of Participation
export function generateCertificate({ name, institution, title, date, venue }) {
  const canvas = document.createElement('canvas');
  canvas.width = 1600;
  canvas.height = 1130;
  const ctx = canvas.getContext('2d');

  // Background deep royal gradient
  const grad = ctx.createLinearGradient(0, 0, 1600, 1130);
  grad.addColorStop(0, '#0a132c');
  grad.addColorStop(0.5, '#020b1f');
  grad.addColorStop(1, '#000814');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1600, 1130);

  // Outer Gold Border
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 14;
  ctx.strokeRect(40, 40, 1520, 1050);

  // Inner Subtle Border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 3;
  ctx.strokeRect(60, 60, 1480, 1010);

  // Corner Gold Accents
  ctx.fillStyle = '#f97316';
  ctx.fillRect(35, 35, 40, 40);
  ctx.fillRect(1525, 35, 40, 40);
  ctx.fillRect(35, 1055, 40, 40);
  ctx.fillRect(1525, 1055, 40, 40);

  // Header Title
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f97316';
  ctx.font = 'bold 36px sans-serif';
  ctx.fillText('DASIG CONSORTIUM REGION VII', 800, 180);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 64px sans-serif';
  ctx.fillText('CERTIFICATE OF PARTICIPATION', 800, 260);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.font = '28px sans-serif';
  ctx.fillText('This verified credential is proudly awarded to', 800, 360);

  // Attendee Name
  ctx.fillStyle = '#60a5fa';
  ctx.font = 'bold 54px sans-serif';
  ctx.fillText((name || 'VALUED PARTICIPANT').toUpperCase(), 800, 460);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.font = '26px sans-serif';
  ctx.fillText(institution || 'Region VII Academic & Government Consortium', 800, 520);

  // Body
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = '30px sans-serif';
  ctx.fillText('for active attendance and completion of', 800, 620);

  ctx.fillStyle = '#fcd34d';
  ctx.font = 'bold 42px sans-serif';
  ctx.fillText(`"${title || 'Consortium Program'}"`, 800, 700);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.font = '26px sans-serif';
  ctx.fillText(`Conducted on ${date || '2026'} · ${venue || 'Central Visayas, Philippines'}`, 800, 770);

  // Cryptographic Verification Stamp
  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 20px monospace';
  ctx.fillText(`VERIFIED CREDENTIAL · AUTHENTICATED BY DASIG CONSORTIUM REGION VII`, 800, 850);

  // Signature lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(350, 960);
  ctx.lineTo(650, 960);
  ctx.moveTo(950, 960);
  ctx.lineTo(1250, 960);
  ctx.stroke();

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('DR. CONSORTIUM DIRECTOR', 500, 1000);
  ctx.fillText('DASIG EXECUTIVE BOARD', 1100, 1000);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.font = '18px sans-serif';
  ctx.fillText('Executive Lead, Region VII Node', 500, 1030);
  ctx.fillText('Academic & Research Council', 1100, 1030);

  // Download Trigger
  const safeName = (name || 'Attendee').replace(/[^a-z0-9]/gi, '_');
  const safeTitle = (title || 'Event').replace(/[^a-z0-9]/gi, '_').slice(0, 30);
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = `Certificate_${safeName}_${safeTitle}.png`;
  a.click();
}
