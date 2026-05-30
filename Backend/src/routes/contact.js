const express = require('express');
const nodemailer = require('nodemailer');

const router = express.Router();
const PORTAL_URL = process.env.PORTAL_URL || 'http://localhost:5173';
const FROM = `"DASIG Portal" <${process.env.SMTP_USER || 'noreply@dasig.ph'}>`;

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

// POST /api/contact — send message to admin
router.post('/', async (req, res) => {
  const { name, email, subject, category, message } = req.body;
  if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
    return res.status(400).json({ error: 'name, email, subject and message are required' });
  }
  if (!/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  // If SMTP is not configured, log and return success (dev mode)
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('[contact] SMTP not configured — message received from', email, ':', subject);
    return res.json({ message: 'Message received' });
  }

  const transporter = createTransporter();

  try {
    // Notify admin
    await transporter.sendMail({
      from: FROM,
      to: process.env.SMTP_USER,
      replyTo: email,
      subject: `[DASIG Portal Contact] ${subject}`,
      html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;background:#f1f5f9;padding:32px 0">
          <div style="background:#fff;max-width:560px;margin:0 auto;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
            <div style="background:linear-gradient(135deg,#001d5c,#1a56db);padding:28px 32px">
              <h2 style="color:#fff;margin:0;font-size:20px;font-weight:900">📬 New Contact Message</h2>
              <p style="color:rgba(255,255,255,0.65);margin:6px 0 0;font-size:13px">DASIG Portal · Support Request</p>
            </div>
            <div style="padding:28px 32px">
              <table style="width:100%;border-collapse:collapse">
                <tr><td style="padding:8px 0;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;width:100px">From</td><td style="padding:8px 0;color:#1e293b;font-weight:600">${name} &lt;${email}&gt;</td></tr>
                <tr><td style="padding:8px 0;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase">Category</td><td style="padding:8px 0;color:#1e293b;font-weight:600">${category || 'General Inquiry'}</td></tr>
                <tr><td style="padding:8px 0;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase">Subject</td><td style="padding:8px 0;color:#1e293b;font-weight:700">${subject}</td></tr>
              </table>
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0">
              <p style="color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;margin:0 0 8px">Message</p>
              <p style="color:#334155;font-size:14px;line-height:1.7;white-space:pre-wrap;background:#f8fafc;border-radius:8px;padding:14px;margin:0">${message}</p>
              <p style="margin:20px 0 0;font-size:13px;color:#94a3b8">Reply directly to this email to respond to ${name}.</p>
            </div>
          </div>
        </div>`,
      text: `Contact from: ${name} <${email}>\nCategory: ${category}\nSubject: ${subject}\n\n${message}`,
    });

    // Auto-reply to sender
    await transporter.sendMail({
      from: FROM,
      to: email,
      subject: `We received your message — DASIG Portal`,
      html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;background:#f1f5f9;padding:32px 0">
          <div style="background:#fff;max-width:520px;margin:0 auto;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
            <div style="background:linear-gradient(135deg,#001d5c,#1a56db);padding:28px 32px;text-align:center">
              <div style="font-size:40px;margin-bottom:8px">✅</div>
              <h2 style="color:#fff;margin:0;font-size:20px;font-weight:900">Message Received!</h2>
              <p style="color:rgba(255,255,255,0.65);margin:6px 0 0;font-size:13px">DASIG Portal · Support</p>
            </div>
            <div style="padding:28px 32px">
              <p style="color:#334155;font-size:14px;line-height:1.7">Hi <strong>${name}</strong>,</p>
              <p style="color:#334155;font-size:14px;line-height:1.7">We've received your message regarding: <strong>${subject}</strong></p>
              <p style="color:#334155;font-size:14px;line-height:1.7">The DASIG admin team will review your inquiry and respond within <strong>1–2 business days</strong>.</p>
              <p style="color:#64748b;font-size:13px;margin-top:20px">If urgent, email us directly at <a href="mailto:admin@dasig.ph" style="color:#1a56db">admin@dasig.ph</a>.</p>
            </div>
            <div style="padding:16px 32px;border-top:1px solid #f1f5f9;text-align:center;font-size:11px;color:#94a3b8">
              DASIG Portal · Region VII Consortium · This is an automated acknowledgement.
            </div>
          </div>
        </div>`,
      text: `Hi ${name},\n\nWe received your message: "${subject}".\nWe'll respond within 1–2 business days.\n\nDASIG Portal`,
    });

    res.json({ message: 'Message sent successfully' });
  } catch (err) {
    console.error('[contact] Email error:', err.message);
    res.status(500).json({ error: 'Failed to send message. Please try again.' });
  }
});

module.exports = router;
