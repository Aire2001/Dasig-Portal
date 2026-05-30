import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import ParticleBackground from '../components/ParticleBackground';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

/* ═══════════════════════════════════════════════════════════
   DATE UTILITIES
═══════════════════════════════════════════════════════════ */
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_ABBR    = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const M2I = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 };
const DAY_MS = 24 * 60 * 60 * 1000;

// Parse a date-range string like:
//   "Jun 18–20, 2026"          → {start: Jun 18, end: Jun 20}
//   "Jul 7 – Aug 15, 2026 | X" → {start: Jul 7,  end: Aug 15}
//   "May 27, 2026"             → {start: May 27,  end: May 27}
function parseRange(str) {
  if (!str) return null;
  const yMatch = str.match(/\b(\d{4})\b/);
  if (!yMatch) return null;
  const yr = +yMatch[1];

  // Cross-month: "Jul 7 – Aug 15" or "Jul 7-Aug 15"
  const cross = str.match(/([A-Z][a-z]{2})\s+(\d+)\s*[–\-]\s*([A-Z][a-z]{2})\s+(\d+)/);
  if (cross && M2I[cross[1]] !== undefined && M2I[cross[3]] !== undefined) {
    return { start: new Date(yr, M2I[cross[1]], +cross[2]), end: new Date(yr, M2I[cross[3]], +cross[4]) };
  }
  // Same-month: "Jun 18–20" or "Aug 3-16"
  const same = str.match(/([A-Z][a-z]{2})\s+(\d+)[–\-](\d+)/);
  if (same && M2I[same[1]] !== undefined) {
    return { start: new Date(yr, M2I[same[1]], +same[2]), end: new Date(yr, M2I[same[1]], +same[3]) };
  }
  // Single: "May 27, 2026"
  const single = str.match(/([A-Z][a-z]{2})\s+(\d+)/);
  if (single && M2I[single[1]] !== undefined) {
    const d = new Date(yr, M2I[single[1]], +single[2]);
    return { start: d, end: d };
  }
  return null;
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/* ═══════════════════════════════════════════════════════════
   STYLE CONSTANTS
═══════════════════════════════════════════════════════════ */
const EV_GRADS = {
  Summit:   'linear-gradient(135deg,#001d5c,#1a56db 55%,#4f46e5)',
  Workshop: 'linear-gradient(135deg,#0891b2,#059669)',
  Seminar:  'linear-gradient(135deg,#7c3aed,#ec4899)',
  Funding:  'linear-gradient(135deg,#f59e0b,#f97316)',
};
const EV_COLORS = {
  Summit:   { bg:'rgba(26,86,219,0.35)',  border:'rgba(79,70,229,0.6)',  text:'#a5b4fc' },
  Workshop: { bg:'rgba(8,145,178,0.35)',  border:'rgba(5,150,105,0.6)',  text:'#6ee7b7' },
  Seminar:  { bg:'rgba(124,58,237,0.35)', border:'rgba(236,72,153,0.6)', text:'#f9a8d4' },
  Funding:  { bg:'rgba(245,158,11,0.35)', border:'rgba(249,115,22,0.6)', text:'#fcd34d' },
};
const TR_STYLES = {
  Technology: { accent:'linear-gradient(135deg,#1a56db,#4f46e5)', color:'#60a5fa', bg:'rgba(59,130,246,0.08)', calBg:'rgba(59,130,246,0.3)', calBorder:'rgba(99,102,241,0.6)', calText:'#a5b4fc' },
  Research:   { accent:'linear-gradient(135deg,#059669,#0891b2)', color:'#34d399', bg:'rgba(16,185,129,0.08)', calBg:'rgba(5,150,105,0.3)',  calBorder:'rgba(16,185,129,0.6)', calText:'#6ee7b7' },
  Leadership: { accent:'linear-gradient(135deg,#f59e0b,#f97316)', color:'#fcd34d', bg:'rgba(245,158,11,0.08)', calBg:'rgba(245,158,11,0.3)', calBorder:'rgba(249,115,22,0.6)', calText:'#fcd34d' },
  Governance: { accent:'linear-gradient(135deg,#7c3aed,#1a56db)', color:'#c4b5fd', bg:'rgba(124,58,237,0.08)', calBg:'rgba(124,58,237,0.3)', calBorder:'rgba(139,92,246,0.6)', calText:'#c4b5fd' },
};
const EV_ICONS = { Summit:'🏛', Workshop:'🔬', Seminar:'📢', Funding:'💰' };
const TR_ICONS = { Technology:'💻', Research:'🔬', Leadership:'🏛', Governance:'📋' };

const CSS = `
  @keyframes cardIn  { from{transform:translateY(14px);opacity:0} to{transform:translateY(0);opacity:1} }
  @keyframes modalIn { from{transform:scale(.88);opacity:0} to{transform:scale(1);opacity:1} }
  @keyframes panelIn { from{transform:translateX(24px);opacity:0} to{transform:translateX(0);opacity:1} }
  @keyframes checkPop{ 0%{transform:scale(0)} 60%{transform:scale(1.3)} 100%{transform:scale(1)} }
  .prog-input {
    width:100%; box-sizing:border-box;
    border:1.5px solid rgba(255,255,255,0.15); border-radius:10px;
    padding:10px 14px; font-size:13.5px; font-family:inherit;
    color:#fff; outline:none; transition:border-color .15s;
    background:rgba(255,255,255,0.07);
  }
  .prog-input::placeholder { color:rgba(255,255,255,0.35); }
  .prog-input:focus { border-color:#f97316; background:rgba(255,255,255,0.11); }
  .cal-event-bar {
    border-radius: 5px; padding: 2px 8px;
    display: flex; align-items: center; gap: 4px;
    cursor: pointer; overflow: hidden;
    transition: filter .12s, transform .1s;
    height: 22px;
  }
  .cal-event-bar:hover { filter: brightness(1.2); transform: translateY(-1px); }
  .cal-day-cell {
    border-left: 1px solid rgba(255,255,255,0.04);
    min-height: 48px; padding: 6px 8px;
    transition: background .12s;
    cursor: default;
  }
  .cal-day-cell:first-child { border-left: none; }
`;

/* ═══════════════════════════════════════════════════════════
   SHARED SMALL COMPONENTS
═══════════════════════════════════════════════════════════ */
function ErrModal({ err, onClose }) {
  const navigate = useNavigate();
  if (!err) return null;
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', zIndex:9300, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#0f172a', border:'1px solid rgba(225,29,72,0.3)', borderRadius:22, maxWidth:360, width:'100%', padding:'32px', textAlign:'center', animation:'modalIn .22s ease' }}>
        <div style={{ fontSize:40, marginBottom:10 }}>{err==='login'?'🔐':err==='already'?'ℹ️':'⚠️'}</div>
        <div style={{ color:'#fff', fontWeight:900, fontSize:17, marginBottom:8 }}>
          {err==='login'?'Sign in required':err==='already'?'Already registered':'Error'}
        </div>
        <p style={{ color:'rgba(255,255,255,0.5)', fontSize:13.5, marginBottom:20, lineHeight:1.6 }}>
          {err==='login'?'You need to log in first.':err==='already'?'You are already registered / enrolled.':err}
        </p>
        {err==='login'
          ? <button onClick={()=>{onClose();navigate('/login');}} style={{ width:'100%', background:'linear-gradient(90deg,#f97316,#e11d48)', color:'#fff', border:'none', borderRadius:12, padding:'12px', fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}>Log in</button>
          : <button onClick={onClose} style={{ width:'100%', background:'rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.65)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:12, padding:'12px', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>OK</button>
        }
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   OUTLOOK-STYLE CALENDAR COMPONENT
═══════════════════════════════════════════════════════════ */
function OutlookCal({ items, onClickItem, conflictIds, getColors }) {
  const todayDate = new Date();
  const [month, setMonth] = useState(null);
  const [year,  setYear]  = useState(null);
  const [init,  setInit]  = useState(false);

  // Auto-jump to earliest month with items
  useEffect(() => {
    if (!items.length || init) return;
    let earliest = null;
    items.forEach(it => {
      if (it.startDate && (!earliest || it.startDate < earliest)) earliest = it.startDate;
    });
    const base = earliest || todayDate;
    setMonth(base.getMonth());
    setYear(base.getFullYear());
    setInit(true);
  }, [items.length]);

  const m = month ?? todayDate.getMonth();
  const y = year  ?? todayDate.getFullYear();

  function prevMon() {
    if (m === 0) { setMonth(11); setYear(y - 1); }
    else setMonth(m - 1);
  }
  function nextMon() {
    if (m === 11) { setMonth(0); setYear(y + 1); }
    else setMonth(m + 1);
  }
  function goToday() { setMonth(todayDate.getMonth()); setYear(todayDate.getFullYear()); }

  // Build 6-week grid
  const firstDow   = new Date(y, m, 1).getDay();
  const daysInMon  = new Date(y, m + 1, 0).getDate();
  const weeks = [];
  let cursor = new Date(y, m, 1 - firstDow);
  for (let w = 0; w < 6; w++) {
    const days = [];
    for (let d = 0; d < 7; d++) {
      days.push(new Date(cursor));
      cursor = new Date(cursor.getTime() + DAY_MS);
    }
    const weekStart = days[0];
    const weekEnd   = new Date(days[6].getTime() + DAY_MS - 1);
    weeks.push({ weekStart, weekEnd, days });
    if (days[6].getMonth() > m && days[6].getFullYear() >= y && w >= 3) break;
  }

  // Compute per-week event bars with row assignments (greedy interval scheduling)
  function getWeekItems(weekStart, weekEnd) {
    const wsMs = weekStart.getTime();
    const weMs = weekEnd.getTime();
    const active = items
      .filter(it => {
        if (!it.startDate) return false;
        const endMs = it.endDate ? it.endDate.getTime() : it.startDate.getTime();
        return it.startDate.getTime() <= weMs && endMs >= wsMs;
      })
      .map(it => {
        const endMs  = it.endDate ? it.endDate.getTime() : it.startDate.getTime();
        const sCol   = Math.max(0, Math.floor((it.startDate.getTime() - wsMs) / DAY_MS));
        const eCol   = Math.min(6, Math.floor((endMs - wsMs) / DAY_MS));
        const isStart = it.startDate.getTime() >= wsMs;
        const isEnd   = endMs <= weMs;
        return { ...it, sCol, eCol, isStart, isEnd };
      })
      .sort((a, b) => a.sCol - b.sCol);

    // Greedy row assignment
    const rowEnds = [];
    return active.map(it => {
      let row = rowEnds.findIndex(end => end < it.sCol);
      if (row === -1) { row = rowEnds.length; rowEnds.push(it.eCol); }
      else rowEnds[row] = it.eCol;
      return { ...it, row };
    });
  }

  return (
    <div style={{ background:'rgba(13,20,40,0.85)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:20, overflow:'hidden', marginBottom:28 }}>

      {/* Header */}
      <div style={{ padding:'14px 20px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={goToday} style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.14)', borderRadius:8, padding:'6px 14px', color:'rgba(255,255,255,0.75)', fontSize:12.5, fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'all .13s' }}
          onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.13)';}}
          onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.07)';}}
        >Today</button>
        <div style={{ display:'flex', gap:4 }}>
          <button onClick={prevMon} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.55)', fontSize:18, cursor:'pointer', width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:6, transition:'all .12s' }}
            onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.08)';e.currentTarget.style.color='#fff';}}
            onMouseLeave={e=>{e.currentTarget.style.background='none';e.currentTarget.style.color='rgba(255,255,255,0.55)';}}
          >‹</button>
          <button onClick={nextMon} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.55)', fontSize:18, cursor:'pointer', width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:6, transition:'all .12s' }}
            onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.08)';e.currentTarget.style.color='#fff';}}
            onMouseLeave={e=>{e.currentTarget.style.background='none';e.currentTarget.style.color='rgba(255,255,255,0.55)';}}
          >›</button>
        </div>
        <span style={{ color:'#fff', fontWeight:900, fontSize:18, letterSpacing:'-0.3px' }}>{MONTH_NAMES[m]} {y}</span>
        {items.length > 0 && (
          <span style={{ marginLeft:'auto', fontSize:11.5, color:'rgba(255,255,255,0.3)', fontWeight:500 }}>
            {items.length} program{items.length !== 1 ? 's' : ''} this view
          </span>
        )}
      </div>

      {/* Day-of-week headers */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        {DAY_ABBR.map((d, i) => (
          <div key={d} style={{ textAlign:'center', padding:'8px 0', fontSize:11.5, fontWeight:700, color: i === 0 || i === 6 ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.4)', letterSpacing:'.5px', textTransform:'uppercase' }}>{d}</div>
        ))}
      </div>

      {/* Week rows */}
      {weeks.map((week, wi) => {
        const wItems  = getWeekItems(week.weekStart, week.weekEnd);
        const maxRow  = wItems.reduce((mx, it) => Math.max(mx, it.row), -1);
        const nRows   = maxRow + 1;

        return (
          <div key={wi} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>

            {/* Event bars grid */}
            {nRows > 0 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gridTemplateRows: `repeat(${nRows}, 24px)`,
                gap: 2,
                padding: '5px 8px',
                minHeight: nRows * 26 + 10,
              }}>
                {wItems.map(it => {
                  const { bg, border, text } = getColors(it);
                  const isConflict = conflictIds?.has(it.id);
                  const lRadius = it.isStart ? 5 : 0;
                  const rRadius = it.isEnd   ? 5 : 0;
                  return (
                    <div
                      key={`${it.id}-w${wi}`}
                      className="cal-event-bar"
                      onClick={() => onClickItem(it)}
                      title={it.title}
                      style={{
                        gridColumnStart: it.sCol + 1,
                        gridColumnEnd:   it.eCol + 2,
                        gridRowStart:    it.row  + 1,
                        background: isConflict ? 'rgba(245,158,11,0.38)' : bg,
                        border: isConflict ? '2px solid rgba(245,158,11,0.9)' : `1px solid ${border}`,
                        borderRadius: `${lRadius}px ${rRadius}px ${rRadius}px ${lRadius}px`,
                        paddingLeft: it.isStart ? 8 : 4,
                      }}
                    >
                      {isConflict && <span style={{ fontSize:10, flexShrink:0 }}>⚠️</span>}
                      {!it.isStart && <span style={{ fontSize:9, color: text, opacity:0.6, flexShrink:0 }}>◀</span>}
                      <span style={{ fontSize:11, fontWeight:700, color: text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>
                        {it.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            {nRows === 0 && <div style={{ height: 8 }} />}

            {/* Day number cells */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)' }}>
              {week.days.map((day, di) => {
                const inMon  = day.getMonth() === m;
                const isToday = sameDay(day, todayDate);
                const isWeekend = di === 0 || di === 6;
                return (
                  <div key={di} className="cal-day-cell" style={{ borderLeft: di > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none', background: isToday ? 'rgba(249,115,22,0.06)' : 'transparent' }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: '50%',
                      background: isToday ? '#f97316' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12.5, fontWeight: isToday ? 900 : 400,
                      color: isToday ? '#fff' : inMon ? (isWeekend ? 'rgba(255,255,255,0.38)' : 'rgba(255,255,255,0.6)') : 'rgba(255,255,255,0.18)',
                    }}>
                      {day.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════ */
export default function ProgramsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'training' ? 'training' : 'events';
  const { user } = useAuth();
  const setTab = t => setSearchParams({ tab: t }, { replace: true });

  return (
    <div style={{ background:'linear-gradient(180deg,#000d30 0%,#020817 300px,#0f172a 100%)', minHeight:'100vh', position:'relative' }}>
      <ParticleBackground density={45} />
      <style>{CSS}</style>
      <div style={{ position:'relative', zIndex:1 }}>
        <PageHeader eyebrow="DASIG Programs" title="Events & Training" />
        <div style={{ maxWidth:1120, margin:'0 auto', padding:'0 24px 80px' }}>

          {/* Tab switcher */}
          <div style={{ display:'flex', gap:10, marginBottom:28, flexWrap:'wrap' }}>
            {[
              { key:'events',   label:'📅 Events',            sub:'Summits, workshops & seminars' },
              { key:'training', label:'🎓 Training Programs',  sub:'Professional development calendar' },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                flex:'0 0 auto', minWidth:220, padding:'14px 22px', borderRadius:16,
                background: tab === t.key ? 'linear-gradient(135deg,rgba(249,115,22,0.18),rgba(225,29,72,0.12))' : 'rgba(255,255,255,0.04)',
                border: tab === t.key ? '1.5px solid rgba(249,115,22,0.45)' : '1.5px solid rgba(255,255,255,0.08)',
                cursor:'pointer', fontFamily:'inherit', textAlign:'left', transition:'all .18s',
                boxShadow: tab === t.key ? '0 4px 20px rgba(249,115,22,0.13)' : 'none',
              }}>
                <div style={{ fontSize:14.5, fontWeight:800, color: tab === t.key ? '#fb923c' : 'rgba(255,255,255,0.72)', marginBottom:3 }}>{t.label}</div>
                <div style={{ fontSize:11.5, color:'rgba(255,255,255,0.35)', fontWeight:500 }}>{t.sub}</div>
              </button>
            ))}
          </div>

          {tab === 'events'   && <EventsTab   user={user} />}
          {tab === 'training' && <TrainingTab user={user} />}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CARD COMPONENTS (must be outside any map/render loop)
═══════════════════════════════════════════════════════════ */
function EvCard({ ev, idx, registered, onRegister }) {
  const [hov, setHov] = useState(false);
  const pct  = ev.total > 0 ? Math.min(100, Math.round((ev.enrolled / ev.total) * 100)) : 0;
  const full = ev.total > 0 && ev.enrolled >= ev.total;
  const grad = EV_GRADS[ev?.category] || EV_GRADS.Summit;
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ borderRadius:18, overflow:'hidden', background:'rgba(15,23,42,0.9)', border:`1px solid ${hov?'rgba(249,115,22,0.4)':'rgba(255,255,255,0.07)'}`, boxShadow: hov?'0 14px 40px rgba(249,115,22,0.12)':'0 4px 16px rgba(0,0,0,0.3)', transform: hov?'translateY(-4px)':'none', transition:'all .22s cubic-bezier(.34,1.56,.64,1)', animation:`cardIn .35s ease ${idx*0.05}s both` }}>
      <div style={{ background: grad, padding:'18px 20px 14px', position:'relative', overflow:'hidden', minHeight:100 }}>
        <div style={{ position:'absolute', right:-8, bottom:-10, fontSize:70, opacity:0.12 }}>{EV_ICONS[ev.category]||'📅'}</div>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
          <span style={{ background:'rgba(255,255,255,0.22)', color:'#fff', borderRadius:6, padding:'3px 10px', fontSize:10.5, fontWeight:700 }}>{ev.category}</span>
          {registered && <span style={{ background:'rgba(16,185,129,0.28)', color:'#34d399', borderRadius:6, padding:'3px 10px', fontSize:10.5, fontWeight:700, border:'1px solid rgba(16,185,129,0.4)' }}>✓ Registered</span>}
          {full && !registered && <span style={{ background:'rgba(225,29,72,0.28)', color:'#f87171', borderRadius:6, padding:'3px 10px', fontSize:10.5, fontWeight:700 }}>Full</span>}
        </div>
        <div style={{ color:'#fff', fontSize:15, fontWeight:900, lineHeight:1.3, marginBottom:5 }}>{ev.title}</div>
        <div style={{ display:'flex', gap:10 }}>
          <span style={{ color:'rgba(255,255,255,0.78)', fontSize:11.5 }}>📅 {ev.date}</span>
          <span style={{ color:'rgba(255,255,255,0.78)', fontSize:11.5 }}>📍 {ev.venue}</span>
        </div>
      </div>
      <div style={{ padding:'12px 16px' }}>
        <div style={{ marginBottom:10 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
            <span style={{ fontSize:11, color:'rgba(255,255,255,0.38)' }}>Seats</span>
            <span style={{ fontSize:11.5, color: full?'#f87171':pct>80?'#fcd34d':'#6ee7b7', fontWeight:700 }}>{ev.enrolled}/{ev.total}</span>
          </div>
          <div style={{ height:5, background:'rgba(255,255,255,0.07)', borderRadius:3, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${pct}%`, background: full?'linear-gradient(90deg,#e11d48,#f97316)':pct>80?'linear-gradient(90deg,#f59e0b,#f97316)':'linear-gradient(90deg,#059669,#0891b2)', borderRadius:3, transition:'width .6s' }} />
          </div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <span style={{ fontSize:11, color:'rgba(255,255,255,0.3)', flex:1 }}>🏛 {ev.organizer}</span>
          {!registered
            ? <button onClick={onRegister} disabled={full} style={{ background: full?'rgba(255,255,255,0.05)':'linear-gradient(90deg,#f97316,#e11d48)', color: full?'rgba(255,255,255,0.3)':'#fff', border: full?'1px solid rgba(255,255,255,0.08)':'none', borderRadius:10, padding:'7px 16px', fontSize:12.5, fontWeight:800, cursor: full?'not-allowed':'pointer', fontFamily:'inherit', boxShadow: full?'none':'0 4px 12px rgba(249,115,22,0.3)', whiteSpace:'nowrap' }}>
                {full?'Fully Booked':'Register →'}
              </button>
            : <span style={{ background:'rgba(16,185,129,0.12)', color:'#34d399', borderRadius:10, padding:'7px 14px', fontSize:12, fontWeight:700, border:'1px solid rgba(16,185,129,0.22)' }}>✓ Registered</span>
          }
        </div>
      </div>
    </div>
  );
}

function TrCard({ t, idx, enrolled, onEnroll }) {
  const [hov, setHov] = useState(false);
  const pct  = t.total > 0 ? Math.min(100, Math.round(t.enrolled / t.total * 100)) : 0;
  const full = t.total > 0 && t.enrolled >= t.total;
  const s    = TR_STYLES[t?.category] || TR_STYLES.Technology;
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ borderRadius:18, overflow:'hidden', background:'rgba(15,23,42,0.9)', border:`1px solid ${hov?s.color+'50':'rgba(255,255,255,0.07)'}`, boxShadow: hov?`0 14px 40px ${s.color}20`:'0 4px 16px rgba(0,0,0,0.3)', transform: hov?'translateY(-4px)':'none', transition:'all .22s cubic-bezier(.34,1.56,.64,1)', animation:`cardIn .35s ease ${idx*0.05}s both` }}>
      <div style={{ background: s.accent, padding:'18px 20px 14px', position:'relative', overflow:'hidden', minHeight:100 }}>
        <div style={{ position:'absolute', right:-8, bottom:-10, fontSize:70, opacity:0.12 }}>{TR_ICONS[t.category]||'🎓'}</div>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
          <span style={{ background:'rgba(255,255,255,0.22)', color:'#fff', borderRadius:6, padding:'3px 10px', fontSize:10.5, fontWeight:700 }}>{t.category}</span>
          <span style={{ background:'rgba(255,255,255,0.18)', color:'#fff', borderRadius:6, padding:'3px 10px', fontSize:10.5, fontWeight:700 }}>{t.level}</span>
        </div>
        <div style={{ color:'#fff', fontSize:15, fontWeight:900, lineHeight:1.3, marginBottom:5 }}>{t.title}</div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <span style={{ color:'rgba(255,255,255,0.78)', fontSize:11.5 }}>🏛 {t.org}</span>
          <span style={{ color:'rgba(255,255,255,0.78)', fontSize:11.5 }}>⏱ {t.duration}</span>
        </div>
      </div>
      <div style={{ padding:'12px 16px' }}>
        {t.schedule && <div style={{ fontSize:11.5, color:'rgba(255,255,255,0.4)', marginBottom:10 }}>📅 {t.schedule.split('|')[0].trim()}</div>}
        <div style={{ marginBottom:10 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
            <span style={{ fontSize:11, color:'rgba(255,255,255,0.38)' }}>Enrollment</span>
            <span style={{ fontSize:11.5, color: full?'#f87171':'#6ee7b7', fontWeight:700 }}>{t.enrolled}/{t.total}</span>
          </div>
          <div style={{ height:5, background:'rgba(255,255,255,0.07)', borderRadius:3, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${pct}%`, background: s.accent, borderRadius:3, transition:'width .6s' }} />
          </div>
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end' }}>
          {enrolled
            ? <span style={{ background:'rgba(16,185,129,0.12)', color:'#34d399', borderRadius:10, padding:'8px 14px', fontSize:12, fontWeight:700, border:'1px solid rgba(16,185,129,0.22)' }}>✓ Enrolled</span>
            : <button onClick={onEnroll} disabled={full} style={{ background: full?'rgba(255,255,255,0.05)':s.accent, color: full?'rgba(255,255,255,0.3)':'#fff', border: full?'1px solid rgba(255,255,255,0.08)':'none', borderRadius:10, padding:'9px 20px', fontSize:13, fontWeight:800, cursor: full?'not-allowed':'pointer', fontFamily:'inherit', boxShadow: full?'none':`0 4px 12px ${s.color}40` }}>
                {full?'Fully Booked':'Enroll →'}
              </button>
          }
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   EVENTS TAB
═══════════════════════════════════════════════════════════ */
const EV_FILTERS = ['All','Summit','Workshop','Seminar','Funding'];

function EventsTab({ user }) {
  const [active, setActive]       = useState('All');
  const [events, setEvents]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [myRegs, setMyRegs]       = useState({});
  const [detail, setDetail]       = useState(null);   // clicked calendar item
  const [formModal, setFormModal] = useState(null);
  const [conflict, setConflict]   = useState(null);
  const [okModal, setOkModal]     = useState(null);
  const [errModal, setErrModal]   = useState('');
  const [submitting, setSub]      = useState(false);
  const [fname, setFname]         = useState('');
  const [phone, setPhone]         = useState('');
  const [institution, setInst]    = useState('');
  const [fnameErr, setFnameErr]   = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    api.events.list({ category: active })
      .then(r => setEvents(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [active]);

  useEffect(() => {
    if (!user) return;
    api.auth.myRegistrations()
      .then(regs => {
        const m = {};
        regs.forEach(r => { m[r.event_id] = { attended: r.attended }; });
        setMyRegs(m);
      })
      .catch(() => {});
  }, [user]);

  // Attach parsed date range to each event
  const calItems = events.map(ev => {
    const range = parseRange(ev.date);
    return { ...ev, startDate: range?.start || null, endDate: range?.end || null, _type: 'event' };
  });

  // Conflict IDs: events the user is registered for that overlap with others they're registered for
  const registeredItems = calItems.filter(ev => myRegs[ev.id]);
  const conflictIds = new Set();
  for (let i = 0; i < registeredItems.length; i++) {
    for (let j = i + 1; j < registeredItems.length; j++) {
      const a = registeredItems[i], b = registeredItems[j];
      if (!a.startDate || !b.startDate) continue;
      const aEnd = a.endDate || a.startDate, bEnd = b.endDate || b.startDate;
      if (a.startDate <= bEnd && b.startDate <= aEnd) {
        conflictIds.add(a.id); conflictIds.add(b.id);
      }
    }
  }

  function evColors(it) {
    return EV_COLORS[it.category] || EV_COLORS.Summit;
  }

  // Check conflict before opening form
  function openForm(ev) {
    if (!user) { setErrModal('login'); return; }
    // Find conflicting registered event
    const range = parseRange(ev.date);
    if (range) {
      for (const id of Object.keys(myRegs)) {
        const other = events.find(e => e.id === +id);
        if (!other || other.id === ev.id) continue;
        const oRange = parseRange(other.date);
        if (oRange && range.start <= oRange.end && oRange.start <= range.end) {
          setConflict({ event: ev, conflictsWith: other });
          return;
        }
      }
    }
    prefill(ev);
  }

  function prefill(ev) {
    setFname(user?.name || ''); setPhone(user?.phone || ''); setInst(user?.institution || '');
    setFnameErr(false); setFormModal(ev); setConflict(null); setDetail(null);
  }

  async function submit() {
    if (!fname.trim()) { setFnameErr(true); return; }
    setSub(true);
    try {
      const res = await api.events.register(formModal.id);
      const updated = { ...formModal, enrolled: res.enrolled ?? formModal.enrolled + 1 };
      setEvents(p => p.map(e => e.id === formModal.id ? updated : e));
      setMyRegs(p => ({ ...p, [formModal.id]: { attended: false } }));
      setFormModal(null);
      setOkModal({ event: updated, name: fname, email: user.email, role: user.role });
    } catch (err) {
      const msg = err.message || '';
      setFormModal(null);
      setErrModal(msg.toLowerCase().includes('already') ? 'already' : msg || 'Registration failed');
    } finally { setSub(false); }
  }

  const grad = ev => EV_GRADS[ev?.category] || EV_GRADS.Summit;

  return (
    <>
      <ErrModal err={errModal} onClose={() => setErrModal('')} />

      {/* Conflict warning */}
      {conflict && (
        <div onClick={() => setConflict(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.72)', zIndex:9300, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#0f172a', border:'1px solid rgba(245,158,11,0.4)', borderRadius:22, maxWidth:420, width:'100%', padding:'32px', animation:'modalIn .22s ease' }}>
            <div style={{ fontSize:42, textAlign:'center', marginBottom:12 }}>⚠️</div>
            <div style={{ color:'#fbbf24', fontWeight:900, fontSize:17, textAlign:'center', marginBottom:8 }}>Scheduling Conflict</div>
            <p style={{ color:'rgba(255,255,255,0.6)', fontSize:13.5, textAlign:'center', lineHeight:1.65, marginBottom:6 }}>
              You're registered for <strong style={{ color:'#fff' }}>{conflict.conflictsWith.title}</strong> which overlaps with <strong style={{ color:'#fff' }}>{conflict.event.title}</strong>.
            </p>
            <p style={{ color:'rgba(245,158,11,0.8)', fontSize:12.5, textAlign:'center', marginBottom:24 }}>📅 {conflict.conflictsWith.date}</p>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setConflict(null)} style={{ flex:1, background:'rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.65)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:12, padding:'12px', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
              <button onClick={() => prefill(conflict.event)} style={{ flex:1, background:'linear-gradient(90deg,#f59e0b,#f97316)', color:'#fff', border:'none', borderRadius:12, padding:'12px', fontSize:13, fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}>Register Anyway</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail panel overlay */}
      {detail && !formModal && (
        <div onClick={() => setDetail(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:9100, display:'flex', alignItems:'flex-start', justifyContent:'flex-end', padding:20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#0f172a', border:'1px solid rgba(255,255,255,0.12)', borderRadius:20, width:360, maxHeight:'80vh', overflow:'auto', animation:'panelIn .22s ease' }}>
            <div style={{ background: grad(detail), padding:'24px 22px 18px', position:'relative' }}>
              <button onClick={() => setDetail(null)} style={{ position:'absolute', top:12, right:12, background:'rgba(255,255,255,0.2)', border:'none', borderRadius:'50%', width:28, height:28, color:'#fff', fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
              <div style={{ color:'rgba(255,255,255,0.65)', fontSize:10.5, fontWeight:700, letterSpacing:1, marginBottom:4 }}>{detail.category}</div>
              <div style={{ color:'#fff', fontSize:17, fontWeight:900, lineHeight:1.35 }}>{detail.title}</div>
            </div>
            <div style={{ padding:'16px 20px' }}>
              {[
                { i:'📅', l:'Date',      v: detail.date },
                { i:'📍', l:'Venue',     v: detail.venue },
                { i:'🏛', l:'Organizer', v: detail.organizer },
                { i:'👥', l:'Seats',     v: `${detail.enrolled}/${detail.total} enrolled` },
              ].map(r => r.v && (
                <div key={r.l} style={{ display:'flex', gap:10, marginBottom:10 }}>
                  <span style={{ fontSize:15, flexShrink:0 }}>{r.i}</span>
                  <div>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', fontWeight:700, letterSpacing:'.5px', textTransform:'uppercase' }}>{r.l}</div>
                    <div style={{ fontSize:13, color:'#fff', fontWeight:600 }}>{r.v}</div>
                  </div>
                </div>
              ))}
              {conflictIds.has(detail.id) && (
                <div style={{ background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.35)', borderRadius:10, padding:'10px 12px', marginBottom:12 }}>
                  <div style={{ color:'#fbbf24', fontWeight:700, fontSize:12.5 }}>⚠️ Scheduling conflict detected</div>
                  <div style={{ color:'rgba(255,255,255,0.5)', fontSize:11.5, marginTop:3 }}>This event overlaps with another event you registered for.</div>
                </div>
              )}
              {detail.description && (
                <p style={{ color:'rgba(255,255,255,0.5)', fontSize:12.5, lineHeight:1.65, marginBottom:14 }}>{detail.description}</p>
              )}
              {myRegs[detail.id]
                ? <div style={{ background:'rgba(16,185,129,0.12)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:12, padding:'12px 14px', textAlign:'center', color:'#34d399', fontWeight:700 }}>✓ You are registered</div>
                : detail.enrolled >= detail.total
                  ? <div style={{ background:'rgba(225,29,72,0.1)', border:'1px solid rgba(225,29,72,0.3)', borderRadius:12, padding:'12px 14px', textAlign:'center', color:'#f87171', fontWeight:700 }}>This event is fully booked</div>
                  : <button onClick={() => openForm(detail)} style={{ width:'100%', background: grad(detail), color:'#fff', border:'none', borderRadius:12, padding:'12px', fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 16px rgba(0,0,0,0.3)' }}>
                      Register for this event →
                    </button>
              }
            </div>
          </div>
        </div>
      )}

      {/* Registration form */}
      {formModal && (
        <div onClick={() => !submitting && setFormModal(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', zIndex:9200, display:'flex', alignItems:'center', justifyContent:'center', padding:20, overflowY:'auto' }}>
          <div onClick={e => e.stopPropagation()} style={{ background:'linear-gradient(180deg,#0f172a,#020817)', borderRadius:22, maxWidth:480, width:'100%', overflow:'hidden', border:'1px solid rgba(255,255,255,0.1)', animation:'modalIn .24s cubic-bezier(.34,1.56,.64,1)', margin:'auto' }}>
            <div style={{ background: grad(formModal), padding:'22px 24px 18px', position:'relative' }}>
              <button onClick={() => setFormModal(null)} style={{ position:'absolute', top:14, right:14, background:'rgba(255,255,255,0.2)', border:'none', borderRadius:'50%', width:30, height:30, color:'#fff', fontSize:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
              <div style={{ color:'rgba(255,255,255,0.65)', fontSize:10.5, fontWeight:700, letterSpacing:1, marginBottom:4 }}>EVENT REGISTRATION</div>
              <div style={{ color:'#fff', fontSize:17, fontWeight:900 }}>{formModal.title}</div>
              <div style={{ display:'flex', gap:14, marginTop:8, flexWrap:'wrap' }}>
                <span style={{ color:'rgba(255,255,255,0.8)', fontSize:12 }}>📅 {formModal.date}</span>
                <span style={{ color:'rgba(255,255,255,0.8)', fontSize:12 }}>📍 {formModal.venue}</span>
              </div>
              <div style={{ marginTop:8, background:'rgba(255,255,255,0.15)', borderRadius:8, padding:'4px 12px', display:'inline-flex', gap:6 }}>
                <span style={{ color:'rgba(255,255,255,0.65)', fontSize:11 }}>Slots left:</span>
                <span style={{ color:'#fff', fontWeight:800, fontSize:12 }}>{formModal.total - formModal.enrolled}</span>
              </div>
            </div>
            <div style={{ padding:'18px 24px 22px', display:'flex', flexDirection:'column', gap:12 }}>
              {[
                { label:'FULL NAME', val:fname, set:setFname, err:fnameErr, setErr:setFnameErr, req:true, ph:'Your full name' },
                { label:'PHONE', val:phone, set:setPhone, ph:'e.g. 09XX-XXX-XXXX' },
                { label:'INSTITUTION', val:institution, set:setInst, ph:'Your organization' },
              ].map(f => (
                <div key={f.label}>
                  <label style={{ fontSize:10.5, fontWeight:700, color: f.err ? '#f87171' : 'rgba(255,255,255,0.4)', display:'block', marginBottom:5, letterSpacing:'.5px', textTransform:'uppercase' }}>
                    {f.label}{f.req && <span style={{ color:'#e11d48' }}> *</span>}
                  </label>
                  <input className="prog-input" value={f.val} placeholder={f.ph}
                    onChange={e => { f.set(e.target.value); if (f.setErr && e.target.value.trim()) f.setErr(false); }}
                    style={f.err ? { borderColor:'#e11d48' } : {}} />
                  {f.err && <div style={{ color:'#f87171', fontSize:12, marginTop:4 }}>⚠ Required.</div>}
                </div>
              ))}
              <div style={{ display:'flex', gap:10, marginTop:4 }}>
                <button onClick={() => setFormModal(null)} style={{ flex:1, background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.55)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:'12px', fontSize:13.5, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
                <button onClick={submit} disabled={submitting} style={{ flex:2, background: submitting ? '#475569' : 'linear-gradient(90deg,#f97316,#e11d48)', color:'#fff', border:'none', borderRadius:12, padding:'12px', fontSize:14, fontWeight:800, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily:'inherit' }}>
                  {submitting ? '⏳ Submitting…' : '✅ Confirm Registration'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success modal */}
      {okModal && (
        <div onClick={() => setOkModal(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', zIndex:9200, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#0f172a', borderRadius:24, maxWidth:440, width:'100%', overflow:'hidden', border:'1px solid rgba(255,255,255,0.1)', animation:'modalIn .26s cubic-bezier(.34,1.56,.64,1)' }}>
            <div style={{ background: grad(okModal.event), padding:'28px 28px 52px', textAlign:'center', position:'relative' }}>
              <div style={{ color:'rgba(255,255,255,0.6)', fontSize:10.5, fontWeight:700, letterSpacing:1, textTransform:'uppercase', marginBottom:6 }}>Registration Confirmed</div>
              <div style={{ color:'#fff', fontSize:19, fontWeight:900 }}>{okModal.event.title}</div>
              <div style={{ position:'absolute', bottom:-34, left:'50%', transform:'translateX(-50%)', width:68, height:68, borderRadius:'50%', background: grad(okModal.event), border:'4px solid #0f172a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, fontWeight:900, color:'#fff' }}>
                {(okModal.name || 'U')[0].toUpperCase()}
              </div>
            </div>
            <div style={{ paddingTop:46, paddingBottom:12, textAlign:'center' }}>
              <div style={{ fontWeight:900, fontSize:17, color:'#fff', paddingLeft:24, paddingRight:24 }}>{okModal.name}</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.38)', marginTop:3 }}>{okModal.email}</div>
            </div>
            <div style={{ padding:'0 22px 22px', display:'flex', flexDirection:'column', gap:7 }}>
              {[{i:'📋',l:'EVENT',v:okModal.event.title},{i:'📅',l:'DATE',v:okModal.event.date||'TBA'},{i:'📍',l:'VENUE',v:okModal.event.venue||'TBA'}].map(r => (
                <div key={r.l} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', background:'rgba(255,255,255,0.04)', borderRadius:10 }}>
                  <span style={{ fontSize:15 }}>{r.i}</span>
                  <div><div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', fontWeight:700, letterSpacing:'.5px' }}>{r.l}</div><div style={{ fontSize:12.5, color:'#fff', fontWeight:700 }}>{r.v}</div></div>
                </div>
              ))}
              <div style={{ background:'rgba(16,185,129,0.12)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:12, padding:'11px 14px', marginTop:4 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}><span style={{ animation:'checkPop 0.4s 0.15s both', display:'inline-block', fontSize:14 }}>✅</span><span style={{ fontSize:12.5, color:'#34d399', fontWeight:700 }}>You&apos;re registered!</span></div>
                <div style={{ fontSize:11.5, color:'rgba(52,211,153,0.8)', lineHeight:1.5 }}>Confirmation email sent to <strong style={{ color:'#34d399' }}>{okModal.email}</strong>.</div>
              </div>
              <button onClick={() => setOkModal(null)} style={{ width:'100%', background:'linear-gradient(90deg,#f97316,#e11d48)', color:'#fff', border:'none', borderRadius:14, padding:'13px', fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:'inherit', marginTop:4 }}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* Outlook Calendar */}
      {!loading && (
        <OutlookCal
          items={calItems}
          onClickItem={setDetail}
          conflictIds={conflictIds}
          getColors={evColors}
        />
      )}
      {loading && <div style={{ textAlign:'center', padding:'60px 0', color:'rgba(255,255,255,0.3)' }}><div style={{ fontSize:32, marginBottom:10 }}>⏳</div>Loading…</div>}

      {/* Filter chips */}
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap', marginTop:4 }}>
        {EV_FILTERS.map(f => (
          <button key={f} onClick={() => setActive(f)} style={{
            background: active === f ? 'linear-gradient(90deg,#f97316,#e11d48)' : 'rgba(255,255,255,0.06)',
            color: active === f ? '#fff' : 'rgba(255,255,255,0.6)',
            border: active === f ? 'none' : '1px solid rgba(255,255,255,0.12)',
            borderRadius:20, padding:'7px 18px', fontSize:12.5, fontWeight:700,
            cursor:'pointer', fontFamily:'inherit', transition:'all .15s',
            boxShadow: active === f ? '0 4px 14px rgba(249,115,22,0.3)' : 'none',
          }}>{f}</button>
        ))}
      </div>

      {/* Event cards grid */}
      {!loading && events.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:18 }}>
          {events.map((ev, i) => (
            <EvCard key={ev.id} ev={ev} idx={i} registered={!!myRegs[ev.id]} onRegister={() => openForm(ev)} />
          ))}
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   TRAINING TAB
═══════════════════════════════════════════════════════════ */
const TR_CATS = ['All','Technology','Research','Leadership','Governance'];

function TrainingTab({ user }) {
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [catFilter, setCat]       = useState('All');
  const [myEnr, setMyEnr]         = useState({});
  const [detail, setDetail]       = useState(null);
  const [formModal, setFormModal] = useState(null);
  const [okModal, setOkModal]     = useState(null);
  const [errModal, setErrModal]   = useState('');
  const [submitting, setSub]      = useState(false);
  const [fname, setFname]         = useState('');
  const [email, setEmail]         = useState('');
  const [institution, setInst]    = useState('');
  const [fnameErr, setFnameErr]   = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.training.list().then(r => setTrainings(r.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    if (!user) return;
    api.auth.myEnrollments().then(enrs => {
      const m = {}; enrs.forEach(e => { m[e.training_id] = true; }); setMyEnr(m);
    }).catch(() => {});
  }, [user]);

  const calItems = trainings.map(t => {
    const range = parseRange(t.schedule);
    return { ...t, startDate: range?.start || null, endDate: range?.end || null, _type: 'training' };
  });

  // Detect conflicts among enrolled trainings
  const enrolledItems = calItems.filter(t => myEnr[t.id]);
  const conflictIds = new Set();
  for (let i = 0; i < enrolledItems.length; i++) {
    for (let j = i + 1; j < enrolledItems.length; j++) {
      const a = enrolledItems[i], b = enrolledItems[j];
      if (!a.startDate || !b.startDate) continue;
      const aEnd = a.endDate || a.startDate, bEnd = b.endDate || b.startDate;
      if (a.startDate <= bEnd && b.startDate <= aEnd) {
        conflictIds.add(a.id); conflictIds.add(b.id);
      }
    }
  }

  const ts = t => TR_STYLES[t?.category] || TR_STYLES.Technology;
  function trColors(it) {
    const s = ts(it);
    return { bg: s.calBg, border: s.calBorder, text: s.calText };
  }

  function openEnroll(t) {
    if (!user) { setErrModal('login'); return; }
    setFname(user.name || ''); setEmail(user.email || ''); setInst(user.institution || '');
    setFnameErr(false); setFormModal(t); setDetail(null);
  }

  async function submitEnroll() {
    if (!fname.trim()) { setFnameErr(true); return; }
    setSub(true);
    try {
      const res = await api.training.enroll(formModal.id);
      const upd = { ...formModal, enrolled: res.enrolled ?? formModal.enrolled + 1 };
      setTrainings(p => p.map(t => t.id === formModal.id ? upd : t));
      setMyEnr(p => ({ ...p, [formModal.id]: true }));
      setFormModal(null);
      setOkModal({ training: upd, name: fname, email, institution, role: user.role });
    } catch (err) {
      const msg = err.message || '';
      setFormModal(null);
      setErrModal(msg.toLowerCase().includes('already') ? 'already' : msg || 'Enrollment failed');
    } finally { setSub(false); }
  }

  const filtered = catFilter === 'All' ? trainings : trainings.filter(t => t.category === catFilter);

  return (
    <>
      <ErrModal err={errModal} onClose={() => setErrModal('')} />

      {/* Detail panel */}
      {detail && !formModal && (
        <div onClick={() => setDetail(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:9100, display:'flex', alignItems:'flex-start', justifyContent:'flex-end', padding:20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#0f172a', border:'1px solid rgba(255,255,255,0.12)', borderRadius:20, width:360, maxHeight:'80vh', overflow:'auto', animation:'panelIn .22s ease' }}>
            <div style={{ background: ts(detail).accent, padding:'22px 20px 18px', position:'relative' }}>
              <button onClick={() => setDetail(null)} style={{ position:'absolute', top:12, right:12, background:'rgba(255,255,255,0.2)', border:'none', borderRadius:'50%', width:28, height:28, color:'#fff', fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
              <span style={{ background:'rgba(255,255,255,0.2)', color:'#fff', borderRadius:5, padding:'2px 8px', fontSize:10, fontWeight:700 }}>{detail.category}</span>
              <div style={{ color:'#fff', fontSize:16, fontWeight:900, lineHeight:1.35, marginTop:6 }}>{detail.title}</div>
            </div>
            <div style={{ padding:'16px 20px' }}>
              {[
                { i:'🏛', l:'Organizer', v: detail.org },
                { i:'⏱', l:'Duration',  v: detail.duration },
                { i:'📊', l:'Level',     v: detail.level },
                { i:'📅', l:'Schedule',  v: detail.schedule },
                { i:'👥', l:'Enrollment',v: `${detail.enrolled}/${detail.total}` },
              ].map(r => r.v && (
                <div key={r.l} style={{ display:'flex', gap:10, marginBottom:10 }}>
                  <span style={{ fontSize:14, flexShrink:0 }}>{r.i}</span>
                  <div>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', fontWeight:700, letterSpacing:'.5px', textTransform:'uppercase' }}>{r.l}</div>
                    <div style={{ fontSize:13, color:'#fff', fontWeight:600 }}>{r.v}</div>
                  </div>
                </div>
              ))}
              {conflictIds.has(detail.id) && (
                <div style={{ background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.35)', borderRadius:10, padding:'10px 12px', marginBottom:12 }}>
                  <div style={{ color:'#fbbf24', fontWeight:700, fontSize:12.5 }}>⚠️ Schedule conflict with another enrolled program</div>
                </div>
              )}
              {detail.description && <p style={{ color:'rgba(255,255,255,0.5)', fontSize:12.5, lineHeight:1.65, marginBottom:14 }}>{detail.description}</p>}
              {myEnr[detail.id]
                ? <div style={{ background:'rgba(16,185,129,0.12)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:12, padding:'12px 14px', textAlign:'center', color:'#34d399', fontWeight:700 }}>✓ You are enrolled</div>
                : detail.enrolled >= detail.total
                  ? <div style={{ background:'rgba(225,29,72,0.1)', border:'1px solid rgba(225,29,72,0.3)', borderRadius:12, padding:'12px', textAlign:'center', color:'#f87171', fontWeight:700 }}>Fully booked</div>
                  : <button onClick={() => openEnroll(detail)} style={{ width:'100%', background: ts(detail).accent, color:'#fff', border:'none', borderRadius:12, padding:'12px', fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}>
                      Enroll in this program →
                    </button>
              }
            </div>
          </div>
        </div>
      )}

      {/* Enrollment form */}
      {formModal && (
        <div onClick={() => !submitting && setFormModal(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', zIndex:9200, display:'flex', alignItems:'center', justifyContent:'center', padding:20, overflowY:'auto' }}>
          <div onClick={e => e.stopPropagation()} style={{ background:'linear-gradient(180deg,#0f172a,#020817)', borderRadius:22, maxWidth:480, width:'100%', overflow:'hidden', border:'1px solid rgba(255,255,255,0.1)', animation:'modalIn .24s cubic-bezier(.34,1.56,.64,1)', margin:'auto' }}>
            <div style={{ background: ts(formModal).accent, padding:'22px 24px 18px', position:'relative' }}>
              <button onClick={() => setFormModal(null)} style={{ position:'absolute', top:14, right:14, background:'rgba(255,255,255,0.2)', border:'none', borderRadius:'50%', width:30, height:30, color:'#fff', fontSize:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
              <div style={{ color:'rgba(255,255,255,0.65)', fontSize:10.5, fontWeight:700, letterSpacing:1, marginBottom:4 }}>PROGRAM ENROLLMENT</div>
              <div style={{ color:'#fff', fontSize:17, fontWeight:900 }}>{formModal.title}</div>
              <div style={{ display:'flex', gap:12, marginTop:8, flexWrap:'wrap' }}>
                {[{i:'🏛',v:formModal.org},{i:'⏱',v:formModal.duration},{i:'📊',v:formModal.level}].map(r=>
                  <span key={r.v} style={{ color:'rgba(255,255,255,0.78)', fontSize:11.5 }}>{r.i} {r.v}</span>
                )}
              </div>
            </div>
            <div style={{ padding:'18px 24px 22px', display:'flex', flexDirection:'column', gap:12 }}>
              {[
                { label:'FULL NAME', val:fname, set:setFname, err:fnameErr, setErr:setFnameErr, req:true, ph:'Your full name' },
                { label:'EMAIL',     val:email, set:setEmail, ph:'your@email.com' },
                { label:'INSTITUTION', val:institution, set:setInst, ph:'Your organization' },
              ].map(f => (
                <div key={f.label}>
                  <label style={{ fontSize:10.5, fontWeight:700, color: f.err?'#f87171':'rgba(255,255,255,0.4)', display:'block', marginBottom:5, letterSpacing:'.5px', textTransform:'uppercase' }}>
                    {f.label}{f.req&&<span style={{ color:'#e11d48' }}> *</span>}
                  </label>
                  <input className="prog-input" value={f.val} placeholder={f.ph}
                    onChange={e => { f.set(e.target.value); if (f.setErr && e.target.value.trim()) f.setErr(false); }}
                    style={f.err ? { borderColor:'#e11d48' } : {}} />
                  {f.err && <div style={{ color:'#f87171', fontSize:12, marginTop:4 }}>⚠ Required.</div>}
                </div>
              ))}
              <div style={{ display:'flex', gap:10, marginTop:4 }}>
                <button onClick={() => setFormModal(null)} style={{ flex:1, background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.55)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:'12px', fontSize:13.5, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
                <button onClick={submitEnroll} disabled={submitting} style={{ flex:2, background: submitting?'#475569':ts(formModal).accent, color:'#fff', border:'none', borderRadius:12, padding:'12px', fontSize:14, fontWeight:800, cursor: submitting?'not-allowed':'pointer', fontFamily:'inherit' }}>
                  {submitting ? '⏳ Enrolling…' : '✅ Confirm Enrollment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success */}
      {okModal && (
        <div onClick={() => setOkModal(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', zIndex:9200, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#0f172a', borderRadius:24, maxWidth:420, width:'100%', overflow:'hidden', border:'1px solid rgba(255,255,255,0.1)', animation:'modalIn .26s cubic-bezier(.34,1.56,.64,1)' }}>
            <div style={{ background: ts(okModal.training).accent, padding:'26px 26px 48px', textAlign:'center', position:'relative' }}>
              <div style={{ color:'rgba(255,255,255,0.6)', fontSize:10.5, fontWeight:700, letterSpacing:1, textTransform:'uppercase', marginBottom:6 }}>Enrollment Confirmed</div>
              <div style={{ color:'#fff', fontSize:18, fontWeight:900 }}>{okModal.training.title}</div>
              <div style={{ position:'absolute', bottom:-32, left:'50%', transform:'translateX(-50%)', width:64, height:64, borderRadius:'50%', background: ts(okModal.training).accent, border:'4px solid #0f172a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:900, color:'#fff' }}>
                {(okModal.name||'U')[0].toUpperCase()}
              </div>
            </div>
            <div style={{ paddingTop:44, paddingBottom:10, textAlign:'center', paddingLeft:22, paddingRight:22 }}>
              <div style={{ fontWeight:900, fontSize:16, color:'#fff' }}>{okModal.name}</div>
            </div>
            <div style={{ padding:'0 22px 22px', display:'flex', flexDirection:'column', gap:7 }}>
              {[{i:'🎓',l:'PROGRAM',v:okModal.training.title},{i:'🏛',l:'ORGANIZER',v:okModal.training.org},{i:'⏱',l:'DURATION',v:okModal.training.duration}].map(r => (
                <div key={r.l} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', background:'rgba(255,255,255,0.04)', borderRadius:10 }}>
                  <span style={{ fontSize:14 }}>{r.i}</span>
                  <div><div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', fontWeight:700, letterSpacing:'.5px' }}>{r.l}</div><div style={{ fontSize:12.5, color:'#fff', fontWeight:700 }}>{r.v}</div></div>
                </div>
              ))}
              <div style={{ background:'rgba(16,185,129,0.12)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:12, padding:'11px 14px', marginTop:4 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}><span style={{ animation:'checkPop 0.4s 0.15s both', display:'inline-block', fontSize:14 }}>✅</span><span style={{ fontSize:12.5, color:'#34d399', fontWeight:700 }}>You&apos;re enrolled!</span></div>
                <div style={{ fontSize:11.5, color:'rgba(52,211,153,0.8)', lineHeight:1.5 }}>Confirmation email sent to <strong style={{ color:'#34d399' }}>{okModal.email}</strong>.</div>
              </div>
              <button onClick={() => setOkModal(null)} style={{ width:'100%', background: ts(okModal.training).accent, color:'#fff', border:'none', borderRadius:14, padding:'12px', fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:'inherit', marginTop:4 }}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* Outlook Calendar */}
      {!loading && (
        <OutlookCal
          items={calItems}
          onClickItem={setDetail}
          conflictIds={conflictIds}
          getColors={trColors}
        />
      )}
      {loading && <div style={{ textAlign:'center', padding:'60px 0', color:'rgba(255,255,255,0.3)' }}><div style={{ fontSize:32, marginBottom:10 }}>⏳</div>Loading…</div>}

      {/* Category filters */}
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap', alignItems:'center', marginTop:4 }}>
        <span style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.35)' }}>Filter:</span>
        {TR_CATS.map(c => (
          <button key={c} onClick={() => setCat(c)} style={{
            background: catFilter === c ? 'linear-gradient(90deg,#f97316,#e11d48)' : 'rgba(255,255,255,0.06)',
            color: catFilter === c ? '#fff' : 'rgba(255,255,255,0.6)',
            border: catFilter === c ? 'none' : '1px solid rgba(255,255,255,0.12)',
            borderRadius:20, padding:'7px 18px', fontSize:12.5, fontWeight:700,
            cursor:'pointer', fontFamily:'inherit', transition:'all .15s',
            boxShadow: catFilter === c ? '0 4px 14px rgba(249,115,22,0.3)' : 'none',
          }}>{c}</button>
        ))}
      </div>

      {/* Training cards */}
      {!loading && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:18 }}>
          {filtered.map((t, idx) => (
            <TrCard key={t.id} t={t} idx={idx} enrolled={!!myEnr[t.id]} onEnroll={() => openEnroll(t)} />
          ))}
        </div>
      )}
    </>
  );
}
