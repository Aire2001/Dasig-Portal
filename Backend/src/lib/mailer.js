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

module.exports = { sendPasswordResetEmail };
