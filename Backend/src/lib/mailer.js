const nodemailer = require('nodemailer');

// Creates a transporter using SMTP settings from environment variables.
// For Gmail: enable 2FA and create an App Password at myaccount.google.com/apppasswords
// Then set SMTP_USER=your@gmail.com and SMTP_PASS=your-app-password in .env
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // STARTTLS
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

const PORTAL_URL = process.env.PORTAL_URL || 'http://localhost:5173';
const FROM = `"DASIG Portal" <${process.env.SMTP_USER || 'noreply@dasig.ph'}>`;

async function sendPasswordResetEmail(toEmail, resetToken) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    // Email not configured — skip silently (token is returned in API response for demo)
    console.warn('[mailer] SMTP not configured — skipping password reset email');
    return;
  }

  const resetUrl = `${PORTAL_URL}/forgot-password?token=${resetToken}`;
  const transporter = createTransporter();

  await transporter.sendMail({
    from: FROM,
    to: toEmail,
    subject: 'DASIG Portal — Password Reset Request',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #f1f5f9; margin: 0; padding: 32px 0; }
          .card { background: #fff; max-width: 480px; margin: 0 auto; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
          .header { background: linear-gradient(135deg,#001d5c,#1a56db); padding: 32px; text-align: center; }
          .header h1 { color: #fff; margin: 0; font-size: 22px; font-weight: 900; }
          .header p  { color: rgba(255,255,255,0.65); margin: 6px 0 0; font-size: 13px; }
          .body { padding: 32px; color: #334155; }
          .body p { line-height: 1.7; font-size: 14px; margin: 0 0 16px; }
          .btn { display: block; text-align: center; background: linear-gradient(90deg,#f97316,#e11d48); color: #fff !important;
                 text-decoration: none; border-radius: 10px; padding: 14px 24px; font-weight: 700; font-size: 15px; margin: 24px 0; }
          .token-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px;
                       font-family: monospace; font-size: 12px; word-break: break-all; color: #475569; margin: 16px 0; }
          .footer { text-align: center; padding: 20px; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h1>🦅 DASIG Portal</h1>
            <p>Region VII Consortium · Password Reset</p>
          </div>
          <div class="body">
            <p>We received a request to reset the password for your DASIG Portal account.</p>
            <p>Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
            <a href="${resetUrl}" class="btn">Reset my password →</a>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <div class="token-box">${resetUrl}</div>
            <p style="font-size:12px;color:#94a3b8;">If you did not request a password reset, you can safely ignore this email. Your account remains secure.</p>
          </div>
          <div class="footer">
            DASIG Portal · Cebu Institute of Technology – University · IT332 Capstone Project<br>
            This is an automated message — please do not reply.
          </div>
        </div>
      </body>
      </html>
    `,
    text: `DASIG Portal — Password Reset\n\nReset your password here:\n${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you did not request this, ignore this email.`,
  });
}

async function sendEventRegistrationEmail(toEmail, userName, event) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;
  const transporter = createTransporter();
  await transporter.sendMail({
    from: FROM,
    to: toEmail,
    subject: `✅ Registration Confirmed — ${event.title}`,
    html: `
      <!DOCTYPE html><html><head><meta charset="utf-8">
      <style>
        body{font-family:'Segoe UI',Arial,sans-serif;background:#f1f5f9;margin:0;padding:32px 0;}
        .card{background:#fff;max-width:520px;margin:0 auto;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);}
        .header{background:linear-gradient(135deg,#001d5c,#1a56db 55%,#4f46e5);padding:36px 32px;text-align:center;}
        .header h1{color:#fff;margin:0 0 6px;font-size:24px;font-weight:900;}
        .header p{color:rgba(255,255,255,0.65);margin:0;font-size:13px;}
        .body{padding:32px;}
        .body p{line-height:1.7;font-size:14px;color:#334155;margin:0 0 12px;}
        .badge{display:inline-block;background:#eff6ff;color:#1e40af;border-radius:20px;padding:4px 12px;font-size:12px;font-weight:700;margin-bottom:20px;}
        .details{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px 24px;margin:20px 0;}
        .row{display:flex;align-items:flex-start;gap:12px;padding:8px 0;border-bottom:1px solid #f1f5f9;}
        .row:last-child{border-bottom:none;}
        .row-icon{font-size:18px;width:24px;flex-shrink:0;}
        .row-label{font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.4px;margin-bottom:2px;}
        .row-val{font-size:14px;color:#1e293b;font-weight:600;}
        .btn{display:block;text-align:center;background:linear-gradient(90deg,#f97316,#e11d48);color:#fff !important;text-decoration:none;border-radius:10px;padding:14px 24px;font-weight:700;font-size:15px;margin:24px 0;}
        .footer{text-align:center;padding:20px;font-size:11px;color:#94a3b8;border-top:1px solid #f1f5f9;}
      </style></head><body>
      <div class="card">
        <div class="header">
          <div style="font-size:44px;margin-bottom:10px;">🎉</div>
          <h1>You're Registered!</h1>
          <p>DASIG Portal · Region VII Consortium</p>
        </div>
        <div class="body">
          <p>Hi <strong>${userName}</strong>,</p>
          <p>Your registration has been confirmed. Here are your event details:</p>
          <span class="badge">${event.category || 'Event'}</span>
          <div class="details">
            <div class="row"><span class="row-icon">📋</span><div><div class="row-label">Event</div><div class="row-val">${event.title}</div></div></div>
            <div class="row"><span class="row-icon">📅</span><div><div class="row-label">Date</div><div class="row-val">${event.date || 'TBA'}</div></div></div>
            ${event.venue ? `<div class="row"><span class="row-icon">📍</span><div><div class="row-label">Venue</div><div class="row-val">${event.venue}</div></div></div>` : ''}
            ${event.organizer ? `<div class="row"><span class="row-icon">🏛️</span><div><div class="row-label">Organizer</div><div class="row-val">${event.organizer}</div></div></div>` : ''}
          </div>
          <p style="font-size:13px;color:#64748b;">Please bring this confirmation to the event. Attendance will be recorded by the DASIG administrator.</p>
          <a href="${PORTAL_URL}/events" class="btn">View Event Details →</a>
        </div>
        <div class="footer">DASIG Portal · Cebu Institute of Technology – University · IT332 Capstone<br>This is an automated message — please do not reply.</div>
      </div>
      </body></html>
    `,
    text: `Hi ${userName},\n\nYour registration for "${event.title}" is confirmed!\n\nDate: ${event.date || 'TBA'}\nVenue: ${event.venue || 'TBA'}\nOrganizer: ${event.organizer || 'DASIG'}\n\nView event: ${PORTAL_URL}/events`,
  });
}

async function sendTrainingEnrollmentEmail(toEmail, userName, training) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;
  const transporter = createTransporter();
  await transporter.sendMail({
    from: FROM,
    to: toEmail,
    subject: `✅ Enrollment Confirmed — ${training.title}`,
    html: `
      <!DOCTYPE html><html><head><meta charset="utf-8">
      <style>
        body{font-family:'Segoe UI',Arial,sans-serif;background:#f1f5f9;margin:0;padding:32px 0;}
        .card{background:#fff;max-width:520px;margin:0 auto;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);}
        .header{background:linear-gradient(135deg,#064e3b,#059669 55%,#0891b2);padding:36px 32px;text-align:center;}
        .header h1{color:#fff;margin:0 0 6px;font-size:24px;font-weight:900;}
        .header p{color:rgba(255,255,255,0.65);margin:0;font-size:13px;}
        .body{padding:32px;}
        .body p{line-height:1.7;font-size:14px;color:#334155;margin:0 0 12px;}
        .badge{display:inline-block;border-radius:20px;padding:4px 12px;font-size:12px;font-weight:700;margin-bottom:20px;background:#ecfdf5;color:#065f46;}
        .details{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px 24px;margin:20px 0;}
        .row{display:flex;align-items:flex-start;gap:12px;padding:8px 0;border-bottom:1px solid #f1f5f9;}
        .row:last-child{border-bottom:none;}
        .row-icon{font-size:18px;width:24px;flex-shrink:0;}
        .row-label{font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.4px;margin-bottom:2px;}
        .row-val{font-size:14px;color:#1e293b;font-weight:600;}
        .btn{display:block;text-align:center;background:linear-gradient(90deg,#059669,#0891b2);color:#fff !important;text-decoration:none;border-radius:10px;padding:14px 24px;font-weight:700;font-size:15px;margin:24px 0;}
        .footer{text-align:center;padding:20px;font-size:11px;color:#94a3b8;border-top:1px solid #f1f5f9;}
      </style></head><body>
      <div class="card">
        <div class="header">
          <div style="font-size:44px;margin-bottom:10px;">🎓</div>
          <h1>Enrollment Confirmed!</h1>
          <p>DASIG Portal · Professional Development</p>
        </div>
        <div class="body">
          <p>Hi <strong>${userName}</strong>,</p>
          <p>You are now enrolled in the following training program:</p>
          <span class="badge">${training.category || 'Training'}</span>
          <div class="details">
            <div class="row"><span class="row-icon">📚</span><div><div class="row-label">Program</div><div class="row-val">${training.title}</div></div></div>
            <div class="row"><span class="row-icon">🏛️</span><div><div class="row-label">Organizer</div><div class="row-val">${training.org}</div></div></div>
            <div class="row"><span class="row-icon">⏱️</span><div><div class="row-label">Duration</div><div class="row-val">${training.duration}</div></div></div>
            <div class="row"><span class="row-icon">📊</span><div><div class="row-label">Level</div><div class="row-val">${training.level}</div></div></div>
            ${training.schedule ? `<div class="row"><span class="row-icon">📅</span><div><div class="row-label">Start Date</div><div class="row-val">${training.schedule}</div></div></div>` : ''}
          </div>
          <p style="font-size:13px;color:#64748b;">A certificate of completion will be issued by the organizing agency upon finishing the program.</p>
          <a href="${PORTAL_URL}/training" class="btn">View Training Details →</a>
        </div>
        <div class="footer">DASIG Portal · Cebu Institute of Technology – University · IT332 Capstone<br>This is an automated message — please do not reply.</div>
      </div>
      </body></html>
    `,
    text: `Hi ${userName},\n\nYou are now enrolled in "${training.title}"!\n\nOrganizer: ${training.org}\nDuration: ${training.duration}\nLevel: ${training.level}\n${training.schedule ? 'Start Date: ' + training.schedule + '\n' : ''}\nView training: ${PORTAL_URL}/training`,
  });
}

module.exports = { sendPasswordResetEmail, sendEventRegistrationEmail, sendTrainingEnrollmentEmail };
