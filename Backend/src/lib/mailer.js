const nodemailer = require('nodemailer');
const QRCode = require('qrcode');

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

const PORTAL_URL = process.env.PORTAL_URL || 'https://dasig-portal.vercel.app';
// For scannable QR codes and mobile devices, use public cloud URL or specified public IP
const PORTAL_PUBLIC_URL = process.env.PORTAL_PUBLIC_URL || (PORTAL_URL.includes('localhost') ? 'https://dasig-portal.vercel.app' : PORTAL_URL);
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

// Helper to normalize attendee object whether called with (attendeeObj, itemObj) or (email, name, itemObj)
function resolveAttendee(arg1, arg2, arg3) {
  if (typeof arg1 === 'object' && arg1 !== null) {
    return {
      attendee: {
        name: arg1.name || 'Valued Attendee',
        email: arg1.email || '',
        role: arg1.role || 'GUEST',
        institution: arg1.institution || arg1.campus || '',
        position: arg1.position || arg1.campus || '',
        phone: arg1.phone || '',
      },
      item: arg2 || {},
    };
  }
  return {
    attendee: {
      name: arg2 || 'Valued Attendee',
      email: arg1 || '',
      role: (arg3 && arg3.role) || 'GUEST',
      institution: (arg3 && arg3.institution) || '',
      position: '',
      phone: '',
    },
    item: arg3 || {},
  };
}

// Generate a 1-click Google Calendar URL for inclusion in confirmation emails
function getGoogleCalendarLink(title, dateStr, startTime, endTime, venue, description) {
  try {
    const base = 'https://www.google.com/calendar/render?action=TEMPLATE';
    const yMatch = (dateStr || '').match(/\b(\d{4})\b/);
    const yr = yMatch ? yMatch[1] : '2026';
    const months = { Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12' };
    const mMatch = (dateStr || '').match(/([A-Z][a-z]{2})\s+(\d+)/);

    let datesParam = '';
    if (mMatch && months[mMatch[1]]) {
      const mo = months[mMatch[1]];
      const da = String(mMatch[2]).padStart(2, '0');
      const stNum = (startTime || '').match(/(\d+):(\d+)/);
      const enNum = (endTime || '').match(/(\d+):(\d+)/);
      const stHour = stNum ? String(stNum[1]).padStart(2, '0') + String(stNum[2]).padStart(2, '0') + '00' : '010000';
      const enHour = enNum ? String(enNum[1]).padStart(2, '0') + String(enNum[2]).padStart(2, '0') + '00' : '090000';
      datesParam = `&dates=${yr}${mo}${da}T${stHour}Z/${yr}${mo}${da}T${enHour}Z`;
    }
    const params = new URLSearchParams({
      text: title || 'DASIG Consortium Event',
      location: venue || 'Region VII / Central Visayas',
      details: `${description || ''}\n\nOfficial admission pass confirmed via DASIG Regional Portal: ${PORTAL_URL}`,
    });
    return `${base}&${params.toString()}${datesParam}`;
  } catch {
    return 'https://calendar.google.com';
  }
}

async function sendEventRegistrationEmail(arg1, arg2, arg3) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[mailer] SMTP not configured — skipping event registration email');
    return;
  }
  const { attendee, item: event } = resolveAttendee(arg1, arg2, arg3);
  const toEmail = attendee.email;
  if (!toEmail) return;

  const isMember = attendee.role === 'MEMBER' || attendee.role === 'ADMIN';
  const refCode = `DSG-2026-EVT-${String(event.id || 1).padStart(4, '0')}-${(attendee.name || 'GST').replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase()}`;

  const dateStr = event.date || 'TBA';
  const timeStr = `${event.start_time || '09:00'}${event.end_time ? ` – ${event.end_time}` : ' – 17:00'}`;
  const venueStr = event.venue || 'Central Visayas Node / Virtual Hall';
  const verifyParams = new URLSearchParams({
    ref: refCode,
    name: attendee.name || 'Registered Attendee',
    role: attendee.role || 'GUEST',
    type: 'event',
    id: String(event.id || 1),
  });
  if (attendee.institution) verifyParams.set('inst', attendee.institution.slice(0, 30));
  const verifyUrl = `${PORTAL_PUBLIC_URL}/verify-pass?${verifyParams.toString()}`;

  // Generate QR Code PNG buffer for inline CID attachment encoding the live verification URL
  let qrAttachment = null;
  try {
    const qrBuffer = await QRCode.toBuffer(verifyUrl, {
      width: 320,
      margin: 3,
      color: { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    });
    qrAttachment = {
      filename: 'ticket-qr.png',
      content: qrBuffer,
      cid: 'ticketqr@dasig',
    };
  } catch (err) {
    console.warn('[mailer] Failed to generate event QR buffer:', err.message);
  }

  const gcalUrl = getGoogleCalendarLink(event.title, event.date, event.start_time, event.end_time, event.venue, event.description);
  const portalUrl = `${PORTAL_URL}/programs?tab=events`;
  const transporter = createTransporter();

  await transporter.sendMail({
    from: FROM,
    to: toEmail,
    subject: isMember
      ? `👑 VIP Member Pass & QR Code — ${event.title}`
      : `🎟️ Admission Pass & QR Code — ${event.title}`,
    attachments: qrAttachment ? [qrAttachment] : [],
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0b1329; margin: 0; padding: 30px 12px; }
          .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 16px 40px rgba(0,0,0,0.3); }
          .header { background: linear-gradient(135deg, #001233 0%, #0f172a 50%, #1e3a8a 100%); padding: 32px 28px; text-align: center; color: #ffffff; }
          .header-brand { font-size: 11px; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase; color: #93c5fd; margin-bottom: 8px; }
          .header h1 { font-size: 22px; font-weight: 900; margin: 0 0 6px; line-height: 1.3; }
          .header-sub { font-size: 13px; color: rgba(255,255,255,0.7); margin: 0; }
          .badge-tier { display: inline-block; padding: 5px 14px; border-radius: 20px; font-size: 11.5px; font-weight: 900; letter-spacing: 0.5px; margin-top: 14px; }
          .body { padding: 28px 26px; color: #1e293b; }
          .greeting { font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 20px; }
          .qr-box { background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 16px; padding: 20px; text-align: center; margin: 20px 0; }
          .ticket-ref { font-family: 'Courier New', Courier, monospace; font-size: 15px; font-weight: 900; color: #0f172a; letter-spacing: 1px; margin-top: 10px; }
          .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .info-table td { padding: 10px 0; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
          .info-label { font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; width: 110px; }
          .info-value { font-size: 13.5px; font-weight: 700; color: #0f172a; }
          .perks-card { background: ${isMember ? '#ecfdf5' : '#f8fafc'}; border: 1px solid ${isMember ? '#a7f3d0' : '#e2e8f0'}; border-radius: 12px; padding: 14px 16px; margin: 18px 0; font-size: 12px; color: ${isMember ? '#065f46' : '#475569'}; line-height: 1.6; }
          .btn-primary { display: block; text-align: center; background: linear-gradient(90deg, #f97316 0%, #ea580c 100%); color: #ffffff !important; text-decoration: none; border-radius: 12px; padding: 13px 20px; font-weight: 800; font-size: 14px; margin: 10px 0; box-shadow: 0 4px 12px rgba(249,115,22,0.3); }
          .btn-secondary { display: block; text-align: center; background: #0f172a; color: #ffffff !important; text-decoration: none; border-radius: 12px; padding: 13px 20px; font-weight: 800; font-size: 14px; margin: 10px 0; }
          .footer { background: #f8fafc; text-align: center; padding: 20px 24px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="header-brand">🦅 DASIG REGIONAL CONSORTIUM (REGION VII)</div>
            <h1>Official Admission Pass</h1>
            <p class="header-sub">${event.title}</p>
            <div class="badge-tier" style="background:${isMember ? '#059669' : '#1e40af'};color:#ffffff;">
              ${isMember ? '👑 VIP CONSORTIUM MEMBER PASS' : '👤 STANDARD GUEST ATTENDEE PASS'}
            </div>
          </div>
          <div class="body">
            <div class="greeting">
              Dear <strong>${attendee.name}</strong>,<br>
              Your registration is officially confirmed! Below is your digital admission pass and check-in QR code.
            </div>

            <!-- QR Code Ticket Stub -->
            <div class="qr-box">
              <div style="font-size:11px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:12px;">
                Rapid Check-In Barcode / QR
              </div>
              <a href="${verifyUrl}" target="_blank" style="display:inline-block;text-decoration:none;">
                ${qrAttachment
                  ? `<img src="cid:ticketqr@dasig" width="160" height="160" alt="Admission QR Code" style="display:block;margin:0 auto;border-radius:12px;border:1px solid #e2e8f0;box-shadow:0 4px 12px rgba(0,0,0,0.08);" />`
                  : `<img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(verifyUrl)}" width="160" height="160" alt="Admission QR Code" style="display:block;margin:0 auto;border-radius:12px;border:1px solid #e2e8f0;" />`
                }
              </a>
              <div class="ticket-ref">${refCode}</div>
              <div style="font-size:11.5px;color:#64748b;margin-top:8px;line-height:1.4;">
                Point your phone camera at this QR code to view and verify your official pass credentials anytime.
              </div>
              <div style="margin-top:10px;">
                <a href="${verifyUrl}" target="_blank" style="display:inline-block;font-size:12px;font-weight:800;color:#2563eb;text-decoration:underline;">
                  🔍 Click here to test pass verification page directly →
                </a>
              </div>
            </div>

            <!-- Attendee & Event Metadata -->
            <table class="info-table">
              <tr>
                <td class="info-label">Attendee</td>
                <td class="info-value">${attendee.name}</td>
              </tr>
              <tr>
                <td class="info-label">Email</td>
                <td class="info-value">${toEmail}</td>
              </tr>
              ${attendee.institution ? `<tr><td class="info-label">Institution</td><td class="info-value">${attendee.institution}</td></tr>` : ''}
              <tr>
                <td class="info-label">Date</td>
                <td class="info-value">📅 ${event.date || 'TBA'}</td>
              </tr>
              <tr>
                <td class="info-label">Hours</td>
                <td class="info-value">🕐 ${event.start_time || '09:00'}${event.end_time ? ` – ${event.end_time}` : ' – 17:00'}</td>
              </tr>
              <tr>
                <td class="info-label">Venue</td>
                <td class="info-value">📍 ${event.venue || 'Central Visayas Node / Virtual Hall'}</td>
              </tr>
              <tr>
                <td class="info-label">Organizer</td>
                <td class="info-value">🏛️ ${event.organizer || 'DASIG Consortium'}</td>
              </tr>
            </table>

            <!-- Perks Summary -->
            <div class="perks-card">
              ${isMember ? `
                <div style="font-weight:800;color:#065f46;margin-bottom:4px;">👑 VIP Consortium Member Privileges Active:</div>
                • Guaranteed priority reserved slot.<br>
                • Complimentary official certificate of participation.<br>
                • Full access to session toolkit, slides & replay archives.
              ` : `
                <div style="font-weight:800;color:#334155;margin-bottom:4px;">👤 Standard Public Pass:</div>
                General admission pass confirmed. Need verified certificates, free masterclasses, and priority seats? <a href="${PORTAL_URL}/membership" style="color:#ea580c;font-weight:800;text-decoration:none;">Apply for Consortium Membership →</a>
              `}
            </div>

            <!-- Action Buttons -->
            <a href="${verifyUrl}" target="_blank" class="btn-primary">🎟️ View Verified Admission Pass</a>
            <a href="${gcalUrl}" target="_blank" class="btn-secondary">📅 Add to Google Calendar</a>
          </div>
          <div class="footer">
            DASIG Regional Higher Education Innovation Consortium · Region VII<br>
            Cebu Institute of Technology – University · IT332 Capstone Project<br>
            This is an automated admission pass — please present this message at check-in.
          </div>
        </div>
      </body>
      </html>
    `,
    text: `DASIG PORTAL — OFFICIAL ADMISSION PASS\n\nEvent: ${event.title}\nTicket Ref: ${refCode}\nAttendee: ${attendee.name} (${toEmail})\nDate: ${event.date || 'TBA'}\nVenue: ${event.venue || 'TBA'}\nPass Tier: ${isMember ? 'VIP Consortium Member Pass' : 'Standard Guest Pass'}\n\nVerify Pass: ${verifyUrl}\nAdd to calendar: ${gcalUrl}\nView in portal: ${portalUrl}`,
  });
  console.log(`[mailer] Sent event registration pass to ${toEmail} (Ref: ${refCode})`);
}

async function sendTrainingEnrollmentEmail(arg1, arg2, arg3) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[mailer] SMTP not configured — skipping training enrollment email');
    return;
  }
  const { attendee, item: training } = resolveAttendee(arg1, arg2, arg3);
  const toEmail = attendee.email;
  if (!toEmail) return;

  const isMember = attendee.role === 'MEMBER' || attendee.role === 'ADMIN';
  const refCode = `DSG-2026-TRN-${String(training.id || 1).padStart(4, '0')}-${(attendee.name || 'GST').replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase()}`;

  const dateStr = training.schedule || 'Scheduled Session';
  const timeStr = `${training.session_start_time || '09:00'}${training.session_end_time ? ` – ${training.session_end_time}` : ' – 17:00'}`;
  const venueStr = training.org || 'Central Visayas Node / Virtual Hall';
  const verifyParams = new URLSearchParams({
    ref: refCode,
    name: attendee.name || 'Registered Attendee',
    role: attendee.role || 'GUEST',
    type: 'training',
    id: String(training.id || 1),
  });
  if (attendee.institution) verifyParams.set('inst', attendee.institution.slice(0, 30));
  const verifyUrl = `${PORTAL_PUBLIC_URL}/verify-pass?${verifyParams.toString()}`;

  // Generate QR Code PNG buffer for inline CID attachment encoding the live verification URL
  let qrAttachment = null;
  try {
    const qrBuffer = await QRCode.toBuffer(verifyUrl, {
      width: 320,
      margin: 3,
      color: { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    });
    qrAttachment = {
      filename: 'training-qr.png',
      content: qrBuffer,
      cid: 'ticketqr@dasig',
    };
  } catch (err) {
    console.warn('[mailer] Failed to generate training QR buffer:', err.message);
  }

  const gcalUrl = getGoogleCalendarLink(training.title, training.schedule, training.session_start_time, training.session_end_time, training.org, training.description);
  const portalUrl = `${PORTAL_URL}/programs?tab=training`;
  const transporter = createTransporter();

  await transporter.sendMail({
    from: FROM,
    to: toEmail,
    subject: isMember
      ? `👑 VIP Member Cohort Pass & QR Code — ${training.title}`
      : `🎓 Training Cohort Admission Pass & QR Code — ${training.title}`,
    attachments: qrAttachment ? [qrAttachment] : [],
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #042f2e; margin: 0; padding: 30px 12px; }
          .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 16px 40px rgba(0,0,0,0.3); }
          .header { background: linear-gradient(135deg, #064e3b 0%, #059669 50%, #0d9488 100%); padding: 32px 28px; text-align: center; color: #ffffff; }
          .header-brand { font-size: 11px; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase; color: #a7f3d0; margin-bottom: 8px; }
          .header h1 { font-size: 22px; font-weight: 900; margin: 0 0 6px; line-height: 1.3; }
          .header-sub { font-size: 13px; color: rgba(255,255,255,0.8); margin: 0; }
          .badge-tier { display: inline-block; padding: 5px 14px; border-radius: 20px; font-size: 11.5px; font-weight: 900; letter-spacing: 0.5px; margin-top: 14px; }
          .body { padding: 28px 26px; color: #1e293b; }
          .greeting { font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 20px; }
          .qr-box { background: #f0fdf4; border: 1.5px solid #bbf7d0; border-radius: 16px; padding: 20px; text-align: center; margin: 20px 0; }
          .ticket-ref { font-family: 'Courier New', Courier, monospace; font-size: 15px; font-weight: 900; color: #064e3b; letter-spacing: 1px; margin-top: 10px; }
          .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .info-table td { padding: 10px 0; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
          .info-label { font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; width: 110px; }
          .info-value { font-size: 13.5px; font-weight: 700; color: #0f172a; }
          .perks-card { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 14px 16px; margin: 18px 0; font-size: 12px; color: #065f46; line-height: 1.6; }
          .btn-primary { display: block; text-align: center; background: linear-gradient(90deg, #059669 0%, #0d9488 100%); color: #ffffff !important; text-decoration: none; border-radius: 12px; padding: 13px 20px; font-weight: 800; font-size: 14px; margin: 10px 0; box-shadow: 0 4px 12px rgba(5,150,105,0.3); }
          .btn-secondary { display: block; text-align: center; background: #0f172a; color: #ffffff !important; text-decoration: none; border-radius: 12px; padding: 13px 20px; font-weight: 800; font-size: 14px; margin: 10px 0; }
          .footer { background: #f8fafc; text-align: center; padding: 20px 24px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="header-brand">🦅 DASIG PROFESSIONAL DEVELOPMENT COHORT</div>
            <h1>Training Admission Pass</h1>
            <p class="header-sub">${training.title}</p>
            <div class="badge-tier" style="background:#0f172a;color:#34d399;border:1px solid #059669;">
              ${isMember ? '👑 VIP MEMBER COHORT PASS' : '🎓 PUBLIC TRAINING ENROLLMENT'}
            </div>
          </div>
          <div class="body">
            <div class="greeting">
              Dear <strong>${attendee.name}</strong>,<br>
              You are officially enrolled in this professional training program! Below are your cohort admission pass and check-in QR code.
            </div>

            <!-- QR Code Ticket Stub -->
            <div class="qr-box">
              <div style="font-size:11px;font-weight:800;color:#064e3b;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:12px;">
                Cohort Check-In Barcode / QR
              </div>
              <a href="${verifyUrl}" target="_blank" style="display:inline-block;text-decoration:none;">
                ${qrAttachment
                  ? `<img src="cid:ticketqr@dasig" width="160" height="160" alt="Training QR Code" style="display:block;margin:0 auto;border-radius:12px;border:1px solid #bbf7d0;box-shadow:0 4px 12px rgba(0,0,0,0.08);" />`
                  : `<img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(verifyUrl)}" width="160" height="160" alt="Training QR Code" style="display:block;margin:0 auto;border-radius:12px;border:1px solid #bbf7d0;" />`
                }
              </a>
              <div class="ticket-ref">${refCode}</div>
              <div style="font-size:11.5px;color:#047857;margin-top:8px;line-height:1.4;">
                Point your phone camera at this QR code for instant electronic attendance tracking and credential verification.
              </div>
              <div style="margin-top:10px;">
                <a href="${verifyUrl}" target="_blank" style="display:inline-block;font-size:12px;font-weight:800;color:#059669;text-decoration:underline;">
                  🔍 Click here to test pass verification page directly →
                </a>
              </div>
            </div>

            <!-- Program Metadata -->
            <table class="info-table">
              <tr>
                <td class="info-label">Enrollee</td>
                <td class="info-value">${attendee.name}</td>
              </tr>
              <tr>
                <td class="info-label">Email</td>
                <td class="info-value">${toEmail}</td>
              </tr>
              ${attendee.institution ? `<tr><td class="info-label">Institution</td><td class="info-value">${attendee.institution}</td></tr>` : ''}
              <tr>
                <td class="info-label">Schedule</td>
                <td class="info-value">📅 ${training.schedule || 'Scheduled Session'}</td>
              </tr>
              <tr>
                <td class="info-label">Hours</td>
                <td class="info-value">🕐 ${training.session_start_time || '09:00'}${training.session_end_time ? ` – ${training.session_end_time}` : ' – 17:00'}</td>
              </tr>
              <tr>
                <td class="info-label">Duration</td>
                <td class="info-value">⏱️ ${training.duration || 'Full Module'}</td>
              </tr>
              <tr>
                <td class="info-label">Organizer</td>
                <td class="info-value">🏛️ ${training.org || 'Central Visayas Agency'}</td>
              </tr>
              <tr>
                <td class="info-label">Level</td>
                <td class="info-value">📊 ${training.level || 'Professional'}</td>
              </tr>
            </table>

            <!-- Certificate Notice -->
            <div class="perks-card">
              <div style="font-weight:800;color:#065f46;margin-bottom:4px;">🎖️ Certificate Completion Tracking:</div>
              Your attendance and module completion will be logged. A verified certificate of completion and digital badge will be issued upon finishing all required cohort sessions.
            </div>

            <!-- Action Buttons -->
            <a href="${verifyUrl}" target="_blank" class="btn-primary">🎓 View Verified Cohort Pass</a>
            <a href="${gcalUrl}" target="_blank" class="btn-secondary">📅 Add to Google Calendar</a>
          </div>
          <div class="footer">
            DASIG Regional Higher Education Innovation Consortium · Region VII<br>
            Cebu Institute of Technology – University · IT332 Capstone Project<br>
            Automated cohort enrollment notification — please keep for your records.
          </div>
        </div>
      </body>
      </html>
    `,
    text: `DASIG PORTAL — TRAINING ENROLLMENT CONFIRMATION\n\nProgram: ${training.title}\nTicket Ref: ${refCode}\nEnrollee: ${attendee.name} (${toEmail})\nSchedule: ${training.schedule || 'TBA'}\nOrganizer: ${training.org || 'DASIG'}\n\nVerify Pass: ${verifyUrl}\nAdd to calendar: ${gcalUrl}\nView in portal: ${portalUrl}`,
  });
  console.log(`[mailer] Sent training enrollment pass to ${toEmail} (Ref: ${refCode})`);
}

async function sendEventCancellationEmail(arg1, arg2, arg3) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[mailer] SMTP not configured — skipping event cancellation email');
    return;
  }
  const { attendee, item: event } = resolveAttendee(arg1, arg2, arg3);
  const toEmail = attendee.email;
  if (!toEmail) return;

  const cancellationTime = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Manila',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const portalUrl = `${PORTAL_URL}/programs?tab=events`;
  const transporter = createTransporter();

  await transporter.sendMail({
    from: FROM,
    to: toEmail,
    subject: `❌ Registration Cancelled — ${event.title}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #180509; margin: 0; padding: 30px 12px; }
          .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 16px 40px rgba(0,0,0,0.3); }
          .header { background: linear-gradient(135deg, #881337 0%, #be123c 50%, #0f172a 100%); padding: 32px 28px; text-align: center; color: #ffffff; }
          .header-brand { font-size: 11px; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase; color: #fecdd3; margin-bottom: 8px; }
          .header h1 { font-size: 22px; font-weight: 900; margin: 0 0 6px; line-height: 1.3; }
          .header-sub { font-size: 13px; color: rgba(255,255,255,0.8); margin: 0; }
          .body { padding: 28px 26px; color: #1e293b; }
          .cancel-box { background: #fff1f2; border: 1.5px solid #fecdd3; border-radius: 14px; padding: 16px 18px; margin: 18px 0; }
          .info-table { width: 100%; border-collapse: collapse; margin: 18px 0; }
          .info-table td { padding: 9px 0; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
          .info-label { font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; width: 120px; }
          .info-value { font-size: 13.5px; font-weight: 700; color: #0f172a; }
          .btn { display: block; text-align: center; background: #0f172a; color: #ffffff !important; text-decoration: none; border-radius: 12px; padding: 13px 20px; font-weight: 800; font-size: 14px; margin: 20px 0 10px; }
          .footer { background: #f8fafc; text-align: center; padding: 20px 24px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="header-brand">🦅 DASIG REGIONAL CONSORTIUM (REGION VII)</div>
            <h1>Registration Cancelled</h1>
            <p class="header-sub">${event.title}</p>
          </div>
          <div class="body">
            <p style="font-size:15px;line-height:1.6;color:#334155;margin-top:0;">
              Hi <strong>${attendee.name}</strong>,
            </p>
            <p style="font-size:14px;line-height:1.6;color:#475569;">
              This confirms that your registration for the event below has been <strong>successfully cancelled</strong>.
            </p>

            <div class="cancel-box">
              <div style="font-weight:800;color:#9f1239;font-size:13px;display:flex;align-items:center;gap:6px;">
                <span>✓</span> Reserved Slot Released
              </div>
              <div style="font-size:12px;color:#881337;margin-top:4px;line-height:1.5;">
                Your seat has been released back to the consortium pool for other attendees. Your digital pass and check-in QR code have been deactivated.
              </div>
            </div>

            <table class="info-table">
              <tr>
                <td class="info-label">Event</td>
                <td class="info-value">${event.title}</td>
              </tr>
              <tr>
                <td class="info-label">Scheduled Date</td>
                <td class="info-value">📅 ${event.date || 'TBA'}</td>
              </tr>
              ${event.venue ? `<tr><td class="info-label">Venue</td><td class="info-value">📍 ${event.venue}</td></tr>` : ''}
              ${event.organizer ? `<tr><td class="info-label">Organizer</td><td class="info-value">🏛️ ${event.organizer}</td></tr>` : ''}
              <tr>
                <td class="info-label">Cancelled On</td>
                <td class="info-value">${cancellationTime} PHT</td>
              </tr>
            </table>

            <p style="font-size:13px;color:#64748b;line-height:1.6;">
              If you cancelled by mistake or your schedule opens up, you may browse upcoming events and re-register at any time.
            </p>

            <a href="${portalUrl}" class="btn">Browse Available Events →</a>
          </div>
          <div class="footer">
            DASIG Regional Higher Education Innovation Consortium · Region VII<br>
            Cebu Institute of Technology – University · IT332 Capstone Project<br>
            This is an automated cancellation notice.
          </div>
        </div>
      </body>
      </html>
    `,
    text: `DASIG PORTAL — REGISTRATION CANCELLED\n\nHi ${attendee.name},\nYour registration for "${event.title}" has been cancelled.\nDate: ${event.date || 'TBA'}\nVenue: ${event.venue || 'TBA'}\nCancelled on: ${cancellationTime} PHT\n\nBrowse other events: ${portalUrl}`,
  });
  console.log(`[mailer] Sent event cancellation email to ${toEmail}`);
}

async function sendTrainingCancellationEmail(arg1, arg2, arg3) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[mailer] SMTP not configured — skipping training cancellation email');
    return;
  }
  const { attendee, item: training } = resolveAttendee(arg1, arg2, arg3);
  const toEmail = attendee.email;
  if (!toEmail) return;

  const cancellationTime = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Manila',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const portalUrl = `${PORTAL_URL}/programs?tab=training`;
  const transporter = createTransporter();

  await transporter.sendMail({
    from: FROM,
    to: toEmail,
    subject: `❌ Enrollment Cancelled — ${training.title}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #180509; margin: 0; padding: 30px 12px; }
          .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 16px 40px rgba(0,0,0,0.3); }
          .header { background: linear-gradient(135deg, #881337 0%, #be123c 50%, #0f172a 100%); padding: 32px 28px; text-align: center; color: #ffffff; }
          .header-brand { font-size: 11px; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase; color: #fecdd3; margin-bottom: 8px; }
          .header h1 { font-size: 22px; font-weight: 900; margin: 0 0 6px; line-height: 1.3; }
          .header-sub { font-size: 13px; color: rgba(255,255,255,0.8); margin: 0; }
          .body { padding: 28px 26px; color: #1e293b; }
          .cancel-box { background: #fff1f2; border: 1.5px solid #fecdd3; border-radius: 14px; padding: 16px 18px; margin: 18px 0; }
          .info-table { width: 100%; border-collapse: collapse; margin: 18px 0; }
          .info-table td { padding: 9px 0; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
          .info-label { font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; width: 120px; }
          .info-value { font-size: 13.5px; font-weight: 700; color: #0f172a; }
          .btn { display: block; text-align: center; background: #0f172a; color: #ffffff !important; text-decoration: none; border-radius: 12px; padding: 13px 20px; font-weight: 800; font-size: 14px; margin: 20px 0 10px; }
          .footer { background: #f8fafc; text-align: center; padding: 20px 24px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="header-brand">🦅 DASIG PROFESSIONAL DEVELOPMENT</div>
            <h1>Cohort Enrollment Cancelled</h1>
            <p class="header-sub">${training.title}</p>
          </div>
          <div class="body">
            <p style="font-size:15px;line-height:1.6;color:#334155;margin-top:0;">
              Hi <strong>${attendee.name}</strong>,
            </p>
            <p style="font-size:14px;line-height:1.6;color:#475569;">
              This confirms that your enrollment in the training program below has been <strong>successfully cancelled</strong>.
            </p>

            <div class="cancel-box">
              <div style="font-weight:800;color:#9f1239;font-size:13px;display:flex;align-items:center;gap:6px;">
                <span>✓</span> Training Seat Released
              </div>
              <div style="font-size:12px;color:#881337;margin-top:4px;line-height:1.5;">
                Your seat has been released back to the pool. Your cohort check-in QR code has been cancelled.
              </div>
            </div>

            <table class="info-table">
              <tr>
                <td class="info-label">Program</td>
                <td class="info-value">${training.title}</td>
              </tr>
              <tr>
                <td class="info-label">Schedule</td>
                <td class="info-value">📅 ${training.schedule || 'Scheduled Session'}</td>
              </tr>
              ${training.org ? `<tr><td class="info-label">Organizer</td><td class="info-value">🏛️ ${training.org}</td></tr>` : ''}
              ${training.duration ? `<tr><td class="info-label">Duration</td><td class="info-value">⏱️ ${training.duration}</td></tr>` : ''}
              <tr>
                <td class="info-label">Cancelled On</td>
                <td class="info-value">${cancellationTime} PHT</td>
              </tr>
            </table>

            <p style="font-size:13px;color:#64748b;line-height:1.6;">
              If you cancelled by mistake, you may explore our catalogue of upcoming programs and enroll again at any time.
            </p>

            <a href="${portalUrl}" class="btn">Browse Training Programs →</a>
          </div>
          <div class="footer">
            DASIG Regional Higher Education Innovation Consortium · Region VII<br>
            Cebu Institute of Technology – University · IT332 Capstone Project<br>
            This is an automated cancellation notice.
          </div>
        </div>
      </body>
      </html>
    `,
    text: `DASIG PORTAL — TRAINING ENROLLMENT CANCELLED\n\nHi ${attendee.name},\nYour enrollment in "${training.title}" has been cancelled.\nSchedule: ${training.schedule || 'TBA'}\nOrganizer: ${training.org || 'DASIG'}\nCancelled on: ${cancellationTime} PHT\n\nBrowse training programs: ${portalUrl}`,
  });
  console.log(`[mailer] Sent training cancellation email to ${toEmail}`);
}

async function sendMembershipApplicationNotification(applicant) {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS || !adminEmail) {
    console.warn('[mailer] SMTP not configured — skipping membership notification');
    return;
  }
  const transporter = createTransporter();
  await transporter.sendMail({
    from: FROM,
    to: adminEmail,
    subject: `[DASIG Portal] New Membership Application — ${applicant.name}`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;background:#f1f5f9;padding:32px 0">
        <div style="background:#fff;max-width:540px;margin:0 auto;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
          <div style="background:linear-gradient(135deg,#001d5c,#1a56db);padding:28px 32px">
            <h2 style="color:#fff;margin:0;font-size:20px;font-weight:900">🦅 New Membership Application</h2>
            <p style="color:rgba(255,255,255,0.65);margin:6px 0 0;font-size:13px">Action required · DASIG Portal Admin</p>
          </div>
          <div style="padding:28px 32px">
            <p style="color:#334155;font-size:14px;line-height:1.7;margin:0 0 18px">A new membership application has been submitted and is awaiting your review.</p>
            <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
              <tr><td style="padding:8px 0;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;width:120px">Applicant</td><td style="padding:8px 0;color:#1e293b;font-weight:700">${applicant.name}</td></tr>
              <tr><td style="padding:8px 0;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase">Email</td><td style="padding:8px 0;color:#1e293b">${applicant.email}</td></tr>
              <tr><td style="padding:8px 0;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase">Institution</td><td style="padding:8px 0;color:#1e293b;font-weight:600">${applicant.institution}</td></tr>
              ${applicant.campus ? `<tr><td style="padding:8px 0;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase">Campus</td><td style="padding:8px 0;color:#1e293b">${applicant.campus}</td></tr>` : ''}
              <tr><td style="padding:8px 0;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase">Tier</td><td style="padding:8px 0;color:#1e293b">${applicant.tier || 'Tier 2'}</td></tr>
            </table>
            <a href="${PORTAL_URL}/admin?tab=applications" style="display:inline-block;background:linear-gradient(90deg,#f97316,#e11d48);color:#fff;text-decoration:none;border-radius:10px;padding:12px 24px;font-size:14px;font-weight:800">Review Application →</a>
          </div>
          <div style="padding:14px 32px;border-top:1px solid #f1f5f9;font-size:11px;color:#94a3b8">DASIG Portal · Automated notification — do not reply.</div>
        </div>
      </div>`,
    text: `New membership application from ${applicant.name} (${applicant.email})\nInstitution: ${applicant.institution}\nTier: ${applicant.tier || 'Tier 2'}\n\nReview at: ${PORTAL_URL}/admin?tab=applications`,
  });
}

module.exports = { sendPasswordResetEmail, sendEventRegistrationEmail, sendTrainingEnrollmentEmail, sendEventCancellationEmail, sendTrainingCancellationEmail, sendMembershipApplicationNotification };
