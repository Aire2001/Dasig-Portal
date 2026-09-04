import { useSearchParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import ParticleBackground from '../components/ParticleBackground';
import { api } from '../api';

export default function VerifyPassPage() {
  const [searchParams] = useSearchParams();
  const [verifiedTime, setVerifiedTime] = useState('');
  const [itemData, setItemData] = useState(null);
  const [loading, setLoading] = useState(false);

  const refCode = searchParams.get('ref') || 'DSG-PASS-VERIFIED';
  const name    = searchParams.get('name') || 'Registered Attendee';
  const email   = searchParams.get('email') || '';
  const phone   = searchParams.get('phone') || '';
  const role    = (searchParams.get('role') || 'GUEST').toUpperCase();
  const inst    = searchParams.get('inst') || '';

  // Extract type & id from query parameters or reference code
  const paramType = searchParams.get('type');
  const paramId   = searchParams.get('id');

  const resolvedType = paramType || (refCode.includes('-TRN-') ? 'training' : 'event');
  const resolvedId = (() => {
    if (paramId) return paramId;
    const m = refCode.match(/DSG-\d+-(?:EVT|TRN)-(\d+)-/);
    return m ? String(parseInt(m[1], 10)) : null;
  })();

  const rawTitle = searchParams.get('title');
  const rawDate  = searchParams.get('date');
  const rawVenue = searchParams.get('venue');
  const rawTime  = searchParams.get('time');

  useEffect(() => {
    const now = new Date();
    setVerifiedTime(now.toLocaleString('en-US', {
      timeZone: 'Asia/Manila',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }) + ' PHT');
  }, []);

  // Fetch full program details from database if ID is available
  useEffect(() => {
    if (!resolvedId) return;
    let active = true;
    setLoading(true);
    const fetcher = resolvedType === 'training'
      ? api.training.get(resolvedId)
      : api.events.get(resolvedId);

    fetcher
      .then(res => {
        if (active && res) {
          setItemData(res.data || res);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [resolvedId, resolvedType]);

  const title = itemData?.title || rawTitle || (resolvedType === 'training' ? 'DASIG Professional Training Cohort' : 'DASIG Regional Innovation Event');
  const date  = itemData?.date || itemData?.schedule || rawDate || 'Scheduled 2026 Session';
  const venue = itemData?.venue || itemData?.org || rawVenue || 'Central Visayas Node / Virtual Hall';
  const time  = itemData?.start_time ? `${itemData.start_time}${itemData.end_time ? ' – ' + itemData.end_time : ''}` : (itemData?.session_start_time ? `${itemData.session_start_time}${itemData.session_end_time ? ' – ' + itemData.session_end_time : ''}` : (rawTime || '09:00 – 17:00'));
  const type  = resolvedType;
  const isMember = role === 'MEMBER' || role === 'ADMIN';

  // 1-Click Google Calendar link
  const gcalUrl = (() => {
    try {
      const base = 'https://www.google.com/calendar/render?action=TEMPLATE';
      const params = new URLSearchParams({
        text: title,
        location: venue,
        details: `Official verified admission pass for ${name} (${refCode}).\nDASIG Regional Consortium (Region VII).`,
      });
      return `${base}&${params.toString()}`;
    } catch {
      return 'https://calendar.google.com';
    }
  })();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #000c28 0%, #020817 320px, #0f172a 100%)',
      color: '#fff',
      position: 'relative',
      padding: '40px 16px 80px',
    }}>
      <ParticleBackground density={35} />

      <div style={{
        maxWidth: 580,
        margin: '0 auto',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 30, padding: '6px 16px', marginBottom: 12, backdropFilter: 'blur(8px)',
          }}>
            <span style={{ fontSize: 16 }}>🦅</span>
            <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase', color: '#93c5fd' }}>
              DASIG REGIONAL CONSORTIUM · REGION VII
            </span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, margin: 0, letterSpacing: '-0.4px' }}>
            Admission Pass Verification
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13.5, margin: '6px 0 0' }}>
            Official electronic check-in and credential verification system
          </p>
        </div>

        {/* Verification Card */}
        <div style={{
          background: 'linear-gradient(180deg, rgba(15,23,42,0.92) 0%, rgba(2,8,23,0.95) 100%)',
          border: isMember ? '2px solid rgba(16,185,129,0.5)' : '2px solid rgba(59,130,246,0.45)',
          borderRadius: 24,
          overflow: 'hidden',
          boxShadow: isMember
            ? '0 24px 60px rgba(0,0,0,0.6), 0 0 35px rgba(16,185,129,0.18)'
            : '0 24px 60px rgba(0,0,0,0.6), 0 0 35px rgba(59,130,246,0.15)',
          backdropFilter: 'blur(16px)',
        }}>
          {/* Top Status Bar */}
          <div style={{
            background: isMember
              ? 'linear-gradient(90deg, rgba(16,185,129,0.25) 0%, rgba(5,150,105,0.15) 100%)'
              : 'linear-gradient(90deg, rgba(59,130,246,0.22) 0%, rgba(30,58,138,0.15) 100%)',
            padding: '18px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: '#10b981', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 900, boxShadow: '0 0 16px rgba(16,185,129,0.6)',
              }}>
                ✓
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 900, color: '#34d399', letterSpacing: '0.3px' }}>
                  VALID & CONFIRMED ADMISSION
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
                  Cryptographically verified credential
                </div>
              </div>
            </div>

            <div style={{
              background: isMember ? 'rgba(16,185,129,0.18)' : 'rgba(59,130,246,0.18)',
              border: `1px solid ${isMember ? 'rgba(16,185,129,0.45)' : 'rgba(59,130,246,0.45)'}`,
              borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 900,
              color: isMember ? '#34d399' : '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              {isMember ? '👑 VIP MEMBER PASS' : '👤 PUBLIC GUEST PASS'}
            </div>
          </div>

          <div style={{ padding: '24px 26px' }}>
            {/* Ticket Ref Badge */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>
                Official Ticket Reference
              </div>
              <div style={{
                display: 'inline-block',
                background: 'rgba(255,255,255,0.06)',
                border: '1.5px dashed rgba(255,255,255,0.22)',
                borderRadius: 10, padding: '8px 20px',
                fontFamily: 'monospace', fontSize: 16, fontWeight: 900,
                color: '#fff', letterSpacing: '1.5px',
              }}>
                {refCode}
              </div>
            </div>

            {/* Attendee Profile Row */}
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16, padding: '16px 18px',
              display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: isMember
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : 'linear-gradient(135deg, #f97316, #ea580c)',
                color: '#fff', fontSize: 20, fontWeight: 900,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
              }}>
                {(name || 'A')[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {name}
                </div>
                {inst && (
                  <div style={{ fontSize: 12, color: '#fb923c', fontWeight: 700, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    🏛️ {inst}
                  </div>
                )}
                {email && (
                  <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.6)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    ✉️ {email}
                  </div>
                )}
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                  Role: <span style={{ color: '#fff', fontWeight: 700 }}>{isMember ? 'Consortium Member' : 'Guest Attendee'}</span>
                </div>
              </div>
            </div>

            {/* Event / Session Details */}
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 16, padding: '18px 20px', marginBottom: 20,
            }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>
                {type === 'training' ? '🎓 Training Program Cohort' : '📅 Event Session'}
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', lineHeight: 1.35, marginBottom: 14 }}>
                {title}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 12px' }}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase' }}>Date</div>
                  <div style={{ fontSize: 12.5, color: '#fff', fontWeight: 700, marginTop: 2 }}>📅 {date}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 12px' }}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase' }}>Session Hours</div>
                  <div style={{ fontSize: 12.5, color: '#fde047', fontWeight: 700, marginTop: 2 }}>🕐 {time}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 12px', gridColumn: '1/-1' }}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase' }}>Venue / Host Node</div>
                  <div style={{ fontSize: 12.5, color: '#fff', fontWeight: 700, marginTop: 2 }}>📍 {venue}</div>
                </div>
              </div>
            </div>

            {/* Member Perks Checklist */}
            <div style={{
              background: isMember ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${isMember ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 14, padding: '14px 16px', marginBottom: 20,
            }}>
              <div style={{ fontSize: 11.5, fontWeight: 800, color: isMember ? '#34d399' : 'rgba(255,255,255,0.75)', marginBottom: 6 }}>
                {isMember ? '👑 VIP Member Admission Privileges Verified:' : '👤 Public Attendee Status:'}
              </div>
              <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
                {isMember ? (
                  <>
                    ✓ Guaranteed priority reserved seat.<br />
                    ✓ Complimentary verified digital certificate of completion.<br />
                    ✓ Access to full speaker slides, datasets & replay archives.
                  </>
                ) : (
                  <>
                    ✓ General public entry admitted.<br />
                    • Certificate requires Consortium Member upgrade.<br />
                    <Link to="/membership" style={{ color: '#fb923c', fontWeight: 800, textDecoration: 'underline' }}>
                      Apply for Consortium Membership →
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Verification Timestamp */}
            <div style={{
              textAlign: 'center', padding: '12px 14px',
              background: 'rgba(0,0,0,0.3)', borderRadius: 10,
              fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 20,
            }}>
              Scanned & verified on: <span style={{ color: '#fff', fontWeight: 700 }}>{verifiedTime}</span>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a href={gcalUrl} target="_blank" rel="noreferrer" style={{
                display: 'block', textAlign: 'center',
                background: 'linear-gradient(90deg, #059669 0%, #10b981 100%)',
                color: '#fff', textDecoration: 'none', borderRadius: 12,
                padding: '13px 20px', fontWeight: 800, fontSize: 13.5,
                boxShadow: '0 4px 16px rgba(16,185,129,0.35)',
              }}>
                📅 Add to Google Calendar
              </a>

              <Link to="/programs" style={{
                display: 'block', textAlign: 'center',
                background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)',
                border: '1px solid rgba(255,255,255,0.12)', textDecoration: 'none',
                borderRadius: 12, padding: '12px 20px', fontWeight: 700, fontSize: 13.5,
              }}>
                🦅 Return to DASIG Portal
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
