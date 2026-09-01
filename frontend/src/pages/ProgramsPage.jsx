import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/shift-away.css';
import { useState, useEffect, useCallback, useRef } from 'react';
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
  @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
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
// Returns all items active on a given calendar day
function itemsOnDay(items, day) {
  const dayStart = day.getTime();
  const dayEnd   = dayStart + DAY_MS - 1;
  return items.filter(it => {
    if (!it.startDate) return false;
    const end = it.endDate ? it.endDate.getTime() : it.startDate.getTime();
    return it.startDate.getTime() <= dayEnd && end >= dayStart;
  });
}

function OutlookCal({ items, onClickItem, onClickDay, conflictIds, getColors, onRefresh, refreshing }) {
  const todayDate = new Date();
  const [month, setMonth]         = useState(null);
  const [year,  setYear]          = useState(null);
  const [init,  setInit]          = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(todayDate.getFullYear());

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
    setPickerYear(base.getFullYear());
    setInit(true);
  }, [items.length]);

  const m = month ?? todayDate.getMonth();
  const y = year  ?? todayDate.getFullYear();

  function prevMon() {
    setShowPicker(false);
    if (m === 0) { setMonth(11); setYear(y - 1); setPickerYear(y - 1); }
    else setMonth(m - 1);
  }
  function nextMon() {
    setShowPicker(false);
    if (m === 11) { setMonth(0); setYear(y + 1); setPickerYear(y + 1); }
    else setMonth(m + 1);
  }
  function goToday() {
    setMonth(todayDate.getMonth()); setYear(todayDate.getFullYear());
    setPickerYear(todayDate.getFullYear()); setShowPicker(false);
  }

  function selectMonthYear(mon, yr) {
    setMonth(mon); setYear(yr); setShowPicker(false);
  }

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

      {/* ── Header with month/year picker ── */}
      <div style={{ padding:'14px 20px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', gap:10, position:'relative' }}>
        <button onClick={goToday} style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.14)', borderRadius:8, padding:'6px 14px', color:'rgba(255,255,255,0.75)', fontSize:12.5, fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'all .13s' }}
          onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.13)';}}
          onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.07)';}}
        >Today</button>
        <div style={{ display:'flex', gap:4 }}>
          {[['‹',prevMon],['›',nextMon]].map(([ch,fn])=>(
            <button key={ch} onClick={fn} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.55)', fontSize:18, cursor:'pointer', width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:6, transition:'all .12s' }}
              onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.08)';e.currentTarget.style.color='#fff';}}
              onMouseLeave={e=>{e.currentTarget.style.background='none';e.currentTarget.style.color='rgba(255,255,255,0.55)';}}
            >{ch}</button>
          ))}
        </div>

        {/* Clickable month/year → opens picker */}
        <button onClick={() => { setPickerYear(y); setShowPicker(s => !s); }} style={{ background: showPicker?'rgba(249,115,22,0.12)':'rgba(255,255,255,0.06)', border:`1px solid ${showPicker?'rgba(249,115,22,0.35)':'rgba(255,255,255,0.1)'}`, borderRadius:10, padding:'6px 14px', color:'#fff', fontWeight:900, fontSize:18, letterSpacing:'-0.3px', cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:6, transition:'all .13s' }}
          onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.12)'}
          onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.06)'}
        >
          {MONTH_NAMES[m]} {y}
          <span style={{ fontSize:10, opacity:0.6 }}>{showPicker ? '▲' : '▼'}</span>
        </button>

        {/* Month/Year picker dropdown */}
        {showPicker && (
          <div onClick={e=>e.stopPropagation()} style={{ position:'absolute', top:54, left:120, zIndex:9999, background:'#0d1424', border:'1px solid rgba(255,255,255,0.15)', borderRadius:16, padding:'16px', boxShadow:'0 20px 60px rgba(0,0,0,0.7)', minWidth:280 }}>
            {/* Year selector */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <button onClick={()=>setPickerYear(p=>Math.max(2020, p-1))} style={{ background:'rgba(255,255,255,0.07)', border:'none', borderRadius:8, width:32, height:32, color: pickerYear<=2020?'rgba(255,255,255,0.2)':'#fff', fontSize:16, cursor: pickerYear<=2020?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>
              <span style={{ color:'#fff', fontWeight:900, fontSize:16, minWidth:50, textAlign:'center' }}>{pickerYear}</span>
              <button onClick={()=>setPickerYear(p=>Math.min(2035, p+1))} style={{ background:'rgba(255,255,255,0.07)', border:'none', borderRadius:8, width:32, height:32, color: pickerYear>=2035?'rgba(255,255,255,0.2)':'#fff', fontSize:16, cursor: pickerYear>=2035?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>›</button>
            </div>
            {/* 12 months grid */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6 }}>
              {MONTH_NAMES.map((mn, mi) => {
                const isCurrent = mi === m && pickerYear === y;
                const isToday   = mi === todayDate.getMonth() && pickerYear === todayDate.getFullYear();
                return (
                  <button key={mi} onClick={() => selectMonthYear(mi, pickerYear)} style={{
                    padding:'8px 4px', borderRadius:9, border:'none', fontSize:12.5, fontWeight:700,
                    cursor:'pointer', fontFamily:'inherit', transition:'all .13s',
                    background: isCurrent ? 'linear-gradient(90deg,#f97316,#e11d48)' : isToday ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.05)',
                    color: isCurrent ? '#fff' : isToday ? '#fb923c' : 'rgba(255,255,255,0.72)',
                    boxShadow: isCurrent ? '0 3px 10px rgba(249,115,22,0.35)' : 'none',
                  }}
                  onMouseEnter={e=>{ if(!isCurrent) e.currentTarget.style.background='rgba(255,255,255,0.12)'; }}
                  onMouseLeave={e=>{ if(!isCurrent) e.currentTarget.style.background= isToday?'rgba(249,115,22,0.15)':'rgba(255,255,255,0.05)'; }}
                  >
                    {mn.slice(0,3)}
                  </button>
                );
              })}
            </div>
            <button onClick={()=>setShowPicker(false)} style={{ marginTop:12, width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:9, padding:'7px', color:'rgba(255,255,255,0.5)', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Close</button>
          </div>
        )}

        {/* Refresh + item count */}
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:12, color:'rgba(255,255,255,0.35)', fontWeight:500 }}>
            {items.filter(i=>{ const mo=i.startDate?.getMonth(), yr=i.startDate?.getFullYear(); return mo===m && yr===y; }).length} items in {MONTH_NAMES[m]}
          </span>
          {onRefresh && (
            <button onClick={onRefresh} disabled={refreshing} style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:8, padding:'5px 12px', color:'rgba(255,255,255,0.65)', fontSize:12, fontWeight:700, cursor: refreshing?'default':'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:5, transition:'all .13s' }}
              onMouseEnter={e=>{ if(!refreshing) e.currentTarget.style.background='rgba(255,255,255,0.13)'; }}
              onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.07)'}
            >
              <span style={{ display:'inline-block', animation: refreshing?'spin .7s linear infinite':'none' }}>↻</span>
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          )}
        </div>
      </div>

      {/* Close picker when clicking outside */}
      {showPicker && <div onClick={()=>setShowPicker(false)} style={{ position:'fixed', inset:0, zIndex:9998 }} />}

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

            {/* Day number cells — clickable */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)' }}>
              {week.days.map((day, di) => {
                const inMon    = day.getMonth() === m;
                const isToday  = sameDay(day, todayDate);
                const isWeekend = di === 0 || di === 6;
                const dayItems = inMon ? itemsOnDay(items, day) : [];
                const hasEvents = dayItems.length > 0;
                return (
                  <div
                    key={di}
                    className="cal-day-cell"
                    onClick={() => inMon && onClickDay && onClickDay(day, dayItems)}
                    style={{
                      borderLeft: di > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      background: isToday ? 'rgba(249,115,22,0.06)' : 'transparent',
                      cursor: inMon ? 'pointer' : 'default',
                      transition: 'background .12s',
                    }}
                    onMouseEnter={e => { if (inMon) e.currentTarget.style.background = isToday ? 'rgba(249,115,22,0.12)' : 'rgba(255,255,255,0.05)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = isToday ? 'rgba(249,115,22,0.06)' : 'transparent'; }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: isToday ? '#f97316' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12.5, fontWeight: isToday ? 900 : 400,
                      color: isToday ? '#fff' : inMon ? (isWeekend ? 'rgba(255,255,255,0.38)' : 'rgba(255,255,255,0.65)') : 'rgba(255,255,255,0.18)',
                      boxShadow: hasEvents && !isToday ? '0 0 0 2px rgba(249,115,22,0.4)' : 'none',
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
  const rawTab = searchParams.get('tab');
  const tab = ['events','training','calendar'].includes(rawTab) ? rawTab : 'events';
  const { user } = useAuth();
  const setTab = t => setSearchParams({ tab: t }, { replace: true });

  const isCalendar = tab === 'calendar';

  return (
    <div style={{ background:'linear-gradient(180deg,#000d30 0%,#020817 300px,#0f172a 100%)', minHeight:'100vh', position:'relative' }}>
      <ParticleBackground density={45} />
      <style>{CSS}</style>
      <div style={{ position:'relative', zIndex:1 }}>
        <PageHeader
          eyebrow={isCalendar ? 'DASIG Calendar' : 'DASIG Programs'}
          title={isCalendar ? 'Events & Training Calendar' : 'Events & Training'}
        />
        <div style={{ maxWidth: isCalendar ? '95%' : 1120, margin:'0 auto', padding:'0 24px 80px', transition: 'max-width 0.3s ease' }}>

          {/* Tab switcher — pill segmented control */}
          {!isCalendar && (
            <div style={{ marginBottom:28 }}>
              <div style={{
                display:'inline-flex', background:'rgba(255,255,255,0.05)',
                border:'1px solid rgba(255,255,255,0.1)', borderRadius:18,
                padding:5, gap:4, backdropFilter:'blur(12px)',
              }}>
                {[
                  { key:'events',   icon:'📅', label:'Events',           sub:'Summits, workshops & seminars' },
                  { key:'training', icon:'🎓', label:'Training Programs', sub:'Professional development' },
                ].map(t => {
                  const isActive = tab === t.key;
                  return (
                    <button key={t.key} onClick={() => setTab(t.key)} style={{
                      display:'flex', alignItems:'center', gap:10,
                      padding:'10px 20px', borderRadius:14,
                      background: isActive ? 'linear-gradient(135deg,#f97316,#e11d48)' : 'transparent',
                      border:'none', cursor:'pointer', fontFamily:'inherit',
                      transition:'all .2s cubic-bezier(.34,1.56,.64,1)',
                      boxShadow: isActive ? '0 4px 18px rgba(249,115,22,0.35)' : 'none',
                      transform: isActive ? 'scale(1.02)' : 'scale(1)',
                    }}>
                      <span style={{ fontSize:16 }}>{t.icon}</span>
                      <div style={{ textAlign:'left' }}>
                        <div style={{ fontSize:13.5, fontWeight:800, color: isActive ? '#fff' : 'rgba(255,255,255,0.6)', lineHeight:1.2, whiteSpace:'nowrap' }}>{t.label}</div>
                        <div style={{ fontSize:10.5, color: isActive ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.28)', fontWeight:500, whiteSpace:'nowrap' }}>{t.sub}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'events'   && <EventsTab   user={user} />}
          {tab === 'training' && <TrainingTab user={user} />}
          {tab === 'calendar' && <CalendarTab user={user} />}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CANCEL CONFIRMATION MODAL — replaces browser window.confirm
═══════════════════════════════════════════════════════════ */
function CancelConfirmModal({ title, subtitle, onConfirm, onCancel, confirming }) {
  return (
    <div onClick={onCancel} style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.72)', zIndex:9500,
      display:'flex', alignItems:'center', justifyContent:'center', padding:20,
      backdropFilter:'blur(4px)',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background:'linear-gradient(180deg,#0f172a,#020817)',
        border:'1px solid rgba(225,29,72,0.3)', borderRadius:22,
        maxWidth:'min(400px,calc(100vw - 32px))', width:'100%', padding:'32px 28px',
        boxShadow:'0 32px 80px rgba(0,0,0,0.8)', textAlign:'center',
      }}>
        <div style={{ fontSize:44, marginBottom:14 }}>⚠️</div>
        <div style={{ color:'#fff', fontWeight:900, fontSize:18, marginBottom:8 }}>{title}</div>
        <p style={{ color:'rgba(255,255,255,0.55)', fontSize:14, lineHeight:1.7, marginBottom:26 }}>{subtitle}</p>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onCancel} style={{
            flex:1, background:'rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.7)',
            border:'1px solid rgba(255,255,255,0.12)', borderRadius:12,
            padding:'13px', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
          }}
          onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.13)'}
          onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.07)'}
          >Keep It</button>
          <button onClick={onConfirm} disabled={confirming} style={{
            flex:1, background: confirming?'#475569':'linear-gradient(90deg,#e11d48,#be123c)',
            color:'#fff', border:'none', borderRadius:12, padding:'13px',
            fontSize:14, fontWeight:800, cursor: confirming?'not-allowed':'pointer',
            fontFamily:'inherit', boxShadow: confirming?'none':'0 4px 16px rgba(225,29,72,0.4)',
          }}>{confirming ? '⏳ Cancelling…' : 'Yes, Cancel'}</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CARD COMPONENTS (must be outside any map/render loop)
═══════════════════════════════════════════════════════════ */
function EvCard({ ev, idx, registered, onRegister, onCancel, cancelling }) {
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
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, rowGap:4 }}>
          <span style={{ color:'rgba(255,255,255,0.78)', fontSize:11.5 }}>📅 {ev.date}</span>
          <span style={{ color:'rgba(255,255,255,0.78)', fontSize:11.5 }}>📍 {ev.venue}</span>
          {ev.start_time && (
            <span style={{ color:'rgba(253,224,130,0.95)', fontSize:11.5, fontWeight:700 }}>
              🕐 {ev.start_time}{ev.end_time ? ` – ${ev.end_time}` : ''}
            </span>
          )}
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
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <span style={{ fontSize:12, color:'rgba(255,255,255,0.45)', flex:1 }}>🏛 {ev.organizer}</span>
            {!registered
              ? <button onClick={onRegister} disabled={full} style={{ background: full?'rgba(255,255,255,0.05)':'linear-gradient(90deg,#f97316,#e11d48)', color: full?'rgba(255,255,255,0.3)':'#fff', border: full?'1px solid rgba(255,255,255,0.08)':'none', borderRadius:10, padding:'8px 18px', fontSize:13, fontWeight:800, cursor: full?'not-allowed':'pointer', fontFamily:'inherit', boxShadow: full?'none':'0 4px 12px rgba(249,115,22,0.3)', whiteSpace:'nowrap' }}>
                  {full?'Fully Booked':'Register →'}
                </button>
              : <span style={{ background:'rgba(16,185,129,0.12)', color:'#34d399', borderRadius:10, padding:'7px 14px', fontSize:12.5, fontWeight:700, border:'1px solid rgba(16,185,129,0.22)', whiteSpace:'nowrap' }}>✓ Registered</span>
            }
          </div>
          {/* Cancel button — only shown when registered */}
          {registered && (
            <button
              onClick={onCancel}
              disabled={cancelling}
              style={{
                width:'100%', background:'transparent',
                border:'1.5px solid rgba(225,29,72,0.35)',
                borderRadius:10, padding:'8px', fontSize:12.5, fontWeight:700,
                color: cancelling ? 'rgba(255,255,255,0.3)' : 'rgba(244,63,94,0.9)',
                cursor: cancelling ? 'not-allowed' : 'pointer',
                fontFamily:'inherit', transition:'all .15s',
              }}
              onMouseEnter={e => { if (!cancelling) { e.currentTarget.style.background='rgba(225,29,72,0.12)'; e.currentTarget.style.borderColor='rgba(225,29,72,0.6)'; } }}
              onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor='rgba(225,29,72,0.35)'; }}
            >
              {cancelling ? '⏳ Cancelling…' : '✕ Cancel Registration'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function TrCard({ t, idx, registered, onRegister, onCancel, cancelling }) {
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
        {t.schedule && <div style={{ fontSize:11.5, color:'rgba(255,255,255,0.4)', marginBottom: t.session_start_time ? 4 : 10 }}>📅 {t.schedule.split('|')[0].trim()}</div>}
        {t.session_start_time && <div style={{ fontSize:11.5, color:'rgba(253,224,130,0.9)', fontWeight:700, marginBottom:10 }}>🕐 {t.session_start_time}{t.session_end_time ? ` – ${t.session_end_time}` : ''}</div>}
        <div style={{ marginBottom:10 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
            <span style={{ fontSize:11, color:'rgba(255,255,255,0.38)' }}>Registration</span>
            <span style={{ fontSize:11.5, color: full?'#f87171':'#6ee7b7', fontWeight:700 }}>{t.enrolled}/{t.total}</span>
          </div>
          <div style={{ height:5, background:'rgba(255,255,255,0.07)', borderRadius:3, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${pct}%`, background: s.accent, borderRadius:3, transition:'width .6s' }} />
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            {registered
              ? <span style={{ background:'rgba(16,185,129,0.12)', color:'#34d399', borderRadius:10, padding:'8px 14px', fontSize:12.5, fontWeight:700, border:'1px solid rgba(16,185,129,0.22)' }}>✓ Registered</span>
              : <button onClick={onRegister} disabled={full} style={{ background: full?'rgba(255,255,255,0.05)':s.accent, color: full?'rgba(255,255,255,0.3)':'#fff', border: full?'1px solid rgba(255,255,255,0.08)':'none', borderRadius:10, padding:'9px 20px', fontSize:13, fontWeight:800, cursor: full?'not-allowed':'pointer', fontFamily:'inherit', boxShadow: full?'none':`0 4px 12px ${s.color}40` }}>
                  {full?'Fully Booked':'Register →'}
                </button>
            }
          </div>
          {/* Cancel registration — shown for all registered users */}
          {registered && (
            <button
              onClick={onCancel}
              disabled={cancelling}
              style={{
                width:'100%', background:'transparent',
                border:'1.5px solid rgba(225,29,72,0.35)',
                borderRadius:10, padding:'8px', fontSize:12.5, fontWeight:700,
                color: cancelling ? 'rgba(255,255,255,0.3)' : 'rgba(244,63,94,0.9)',
                cursor: cancelling ? 'not-allowed' : 'pointer',
                fontFamily:'inherit', transition:'all .15s',
              }}
              onMouseEnter={e => { if (!cancelling) { e.currentTarget.style.background='rgba(225,29,72,0.12)'; e.currentTarget.style.borderColor='rgba(225,29,72,0.6)'; } }}
              onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor='rgba(225,29,72,0.35)'; }}
            >
              {cancelling ? '⏳ Cancelling…' : '✕ Cancel Registration'}
            </button>
          )}
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
  const [search, setSearch]       = useState('');
  const [events, setEvents]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [lastUpdated, setLastUp]  = useState(null);
  const [myRegs, setMyRegs]       = useState({});
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelConfirm, setCancelConfirm] = useState(null); // event to cancel
  const [detail, setDetail]       = useState(null);
  const [formModal, setFormModal] = useState(null);
  const [conflict, setConflict]   = useState(null);
  const [okModal, setOkModal]     = useState(null);
  const [errModal, setErrModal]   = useState('');
  const [submitting, setSub]      = useState(false);
  const [fname, setFname]         = useState('');
  const [phone, setPhone]         = useState('');
  const [email, setEmail]         = useState('');
  const [institution, setInst]    = useState('');
  const [position, setPosition]   = useState('');
  const [fnameErr, setFnameErr]   = useState(false);
  const navigate = useNavigate();

  const loadEvents = useCallback((showSpinner = false) => {
    if (showSpinner) setLoading(true);
    api.events.list({ limit: 1000 })
      .then(r => { setEvents(Array.isArray(r) ? r : (r?.data || [])); setLastUp(new Date()); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Initial load
  useEffect(() => { loadEvents(true); }, [loadEvents]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const id = setInterval(() => loadEvents(false), 30000);
    return () => clearInterval(id);
  }, [loadEvents]);

  // Refresh when user comes back to the tab
  useEffect(() => {
    function onVisible() { if (!document.hidden) loadEvents(false); }
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [loadEvents]);

  useEffect(() => {
    if (!user) return;
    api.auth.myRegistrations()
      .then(regs => {
        const m = {};
        regs.forEach(r => { m[+r.event_id] = { attended: r.attended }; });
        setMyRegs(m);
      })
      .catch(() => {});
  }, [user]);

  const filteredEvents = events.filter(ev =>
    (active === 'All' || ev.category === active) &&
    (!search.trim() || ev.title.toLowerCase().includes(search.trim().toLowerCase()) || ev.venue?.toLowerCase().includes(search.trim().toLowerCase()))
  );

  // Conflict IDs: registered events whose date ranges overlap each other
  const registeredEvItems = events.filter(ev => myRegs[ev.id]).map(ev => {
    const r = parseRange(ev.date);
    return { ...ev, startDate: r?.start||null, endDate: r?.end||null };
  });
  const conflictIds = new Set();
  for (let i = 0; i < registeredEvItems.length; i++) {
    for (let j = i+1; j < registeredEvItems.length; j++) {
      const a = registeredEvItems[i], b = registeredEvItems[j];
      if (!a.startDate || !b.startDate) continue;
      const aE = a.endDate||a.startDate, bE = b.endDate||b.startDate;
      if (a.startDate <= bE && b.startDate <= aE) { conflictIds.add(a.id); conflictIds.add(b.id); }
    }
  }

  // Check ALL conflicts before opening form
  function openForm(ev) {
    if (!user) { setErrModal('login'); return; }
    const range = parseRange(ev.date);
    if (range) {
      const allConflicts = Object.keys(myRegs)
        .map(id => events.find(e => e.id === +id))
        .filter(other => {
          if (!other || other.id === ev.id) return false;
          const oRange = parseRange(other.date);
          return oRange && range.start <= oRange.end && oRange.start <= range.end;
        });
      if (allConflicts.length > 0) {
        setConflict({ event: ev, conflictsWith: allConflicts });
        return;
      }
    }
    prefill(ev);
  }

  function prefill(ev) {
    setFname(user?.name || '');
    setEmail(user?.email || '');
    setPhone(user?.phone || '');
    setInst(user?.institution || '');
    setPosition(user?.campus || '');
    setFnameErr(false); setFormModal(ev); setConflict(null); setDetail(null);
  }

  async function cancelReg(ev) {
    setCancelConfirm(ev); // show custom modal instead of window.confirm
  }

  async function doCancelReg() {
    const ev = cancelConfirm;
    if (!ev) return;
    setCancelConfirm(null);
    setCancellingId(ev.id);
    try {
      await api.events.unregister(ev.id);
      setMyRegs(p => { const n = { ...p }; delete n[ev.id]; return n; });
      setEvents(p => p.map(e => e.id === ev.id ? { ...e, enrolled: Math.max(0, e.enrolled - 1) } : e));
    } catch (err) {
      setErrModal(err.message || 'Failed to cancel registration');
    } finally {
      setCancellingId(null);
    }
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
      setOkModal({ event: updated, name: fname, email: email || user?.email || '', phone, institution, position, role: user?.role || 'GUEST' });
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

      {/* Cancel registration confirmation */}
      {cancelConfirm && (
        <CancelConfirmModal
          title="Cancel Registration?"
          subtitle={`Are you sure you want to cancel your registration for "${cancelConfirm.title}"? Your slot will be released to other attendees.`}
          confirming={!!cancellingId}
          onConfirm={doCancelReg}
          onCancel={() => setCancelConfirm(null)}
        />
      )}

      {/* Conflict warning — shows ALL conflicting events */}
      {conflict && (
        <div onClick={() => setConflict(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.78)', zIndex:9300, display:'flex', alignItems:'center', justifyContent:'center', padding:20, backdropFilter:'blur(4px)', overflowY:'auto' }}>
          <div onClick={e => e.stopPropagation()} style={{ background:'linear-gradient(180deg,#0f1832,#080e1e)', border:'1px solid rgba(245,158,11,0.35)', borderRadius:24, maxWidth:'min(480px,calc(100vw - 32px))', width:'100%', overflow:'hidden', animation:'modalIn .22s ease', boxShadow:'0 32px 80px rgba(0,0,0,0.8)', margin:'auto' }}>
            {/* Header */}
            <div style={{ background:'linear-gradient(135deg,rgba(245,158,11,0.2),rgba(249,115,22,0.12))', padding:'22px 24px 18px', textAlign:'center', borderBottom:'1px solid rgba(245,158,11,0.2)' }}>
              <div style={{ fontSize:44, marginBottom:8 }}>⚠️</div>
              <div style={{ color:'#fbbf24', fontWeight:900, fontSize:19, letterSpacing:'-0.3px' }}>Scheduling Conflict Detected</div>
              <p style={{ color:'rgba(255,255,255,0.5)', fontSize:13, marginTop:5, lineHeight:1.5 }}>
                {conflict.conflictsWith.length === 1
                  ? 'You already have an event registered on the same dates.'
                  : `You have ${conflict.conflictsWith.length} registered events that overlap these dates.`}
              </p>
            </div>
            <div style={{ padding:'20px 24px', maxHeight:'65vh', overflowY:'auto' }}>
              {/* All conflicting registered events */}
              <div style={{ marginBottom:10 }}>
                <div style={{ fontSize:10.5, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:8 }}>
                  Already registered ({conflict.conflictsWith.length})
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {conflict.conflictsWith.map((ev, i) => (
                    <div key={ev.id} style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:12, padding:'12px 14px', display:'flex', gap:12, alignItems:'flex-start' }}>
                      <span style={{ fontSize:18, flexShrink:0, marginTop:1 }}>📅</span>
                      <div style={{ flex:1 }}>
                        <div style={{ color:'#fff', fontWeight:800, fontSize:13.5, marginBottom:2 }}>{ev.title}</div>
                        <div style={{ color:'rgba(255,255,255,0.55)', fontSize:12 }}>{ev.date}</div>
                        {ev.start_time && <div style={{ color:'rgba(239,68,68,0.85)', fontSize:12, fontWeight:700, marginTop:2 }}>🕐 {ev.start_time}{ev.end_time ? ` – ${ev.end_time}` : ''}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Arrow */}
              <div style={{ textAlign:'center', color:'rgba(245,158,11,0.7)', fontSize:20, margin:'8px 0' }}>⬇</div>
              {/* New event trying to register */}
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:10.5, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:8 }}>You're trying to register</div>
                <div style={{ background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:12, padding:'12px 14px', display:'flex', gap:12, alignItems:'flex-start' }}>
                  <span style={{ fontSize:18, flexShrink:0, marginTop:1 }}>🆕</span>
                  <div>
                    <div style={{ color:'#fff', fontWeight:800, fontSize:13.5, marginBottom:2 }}>{conflict.event.title}</div>
                    <div style={{ color:'rgba(255,255,255,0.55)', fontSize:12 }}>{conflict.event.date}</div>
                    {conflict.event.start_time && <div style={{ color:'rgba(245,158,11,0.85)', fontSize:12, fontWeight:700, marginTop:2 }}>🕐 {conflict.event.start_time}{conflict.event.end_time ? ` – ${conflict.event.end_time}` : ''}</div>}
                  </div>
                </div>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setConflict(null)} style={{ flex:1, background:'rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.7)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:13, padding:'13px', fontSize:13.5, fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'all .15s' }}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.12)'}
                  onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.07)'}
                >Go Back</button>
                <button onClick={() => prefill(conflict.event)} style={{ flex:1, background:'linear-gradient(90deg,#f59e0b,#f97316)', color:'#fff', border:'none', borderRadius:13, padding:'13px', fontSize:13.5, fontWeight:800, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 14px rgba(249,115,22,0.35)', transition:'all .15s' }}
                  onMouseEnter={e=>{e.currentTarget.style.opacity='.85'; e.currentTarget.style.transform='translateY(-1px)';}}
                  onMouseLeave={e=>{e.currentTarget.style.opacity='1'; e.currentTarget.style.transform='none';}}
                >Register Anyway →</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail panel overlay */}
      {detail && !formModal && (
        <div onClick={() => setDetail(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:9100, display:'flex', alignItems:'flex-start', justifyContent:'flex-end', padding:20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#0f172a', border:'1px solid rgba(255,255,255,0.12)', borderRadius:20, width:360, maxHeight:'80vh', overflow:'auto', animation:'panelIn .22s ease' }}>
            <div style={{ background: grad(detail), padding:'24px 22px 18px', position:'relative' }}>
              <button onClick={() => setDetail(null)} style={{ position:'absolute', top:12, right:12, background:'rgba(0,0,0,0.70)', border:'2px solid rgba(255,255,255,0.5)', backdropFilter:'blur(10px)', borderRadius:'50%', width:36, height:36, color:'#fff', fontSize:16, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(6px)', boxShadow:'0 2px 8px rgba(0,0,0,0.4)' }}>✕</button>
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
        <div onClick={() => !submitting && setFormModal(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:999999, display:'flex', alignItems:'center', justifyContent:'center', padding:'72px 20px 36px', overflowY:'auto', backdropFilter:'blur(10px)' }}>
          <div onClick={e => e.stopPropagation()} style={{ background:'linear-gradient(180deg,#0f172a,#020817)', borderRadius:22, maxWidth:'min(480px,calc(100vw - 32px))', width:'100%', position:'relative', border:'1px solid rgba(255,255,255,0.1)', maxHeight:'calc(100vh - 90px)', margin:'auto' }}>
            <div style={{ background: grad(formModal), padding:'22px 24px 18px', position:'relative' }}>
              <button onClick={() => setFormModal(null)} style={{ position:'absolute', top:14, right:14, background:'rgba(0,0,0,0.70)', border:'2px solid rgba(255,255,255,0.5)', backdropFilter:'blur(10px)', borderRadius:'50%', width:36, height:36, color:'#fff', fontSize:16, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(6px)', boxShadow:'0 2px 8px rgba(0,0,0,0.4)' }}>✕</button>
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
              {/* 2-column grid for compact layout */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                {/* Full Name */}
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={{ fontSize:10.5, fontWeight:700, color: fnameErr?'#f87171':'rgba(255,255,255,0.4)', display:'block', marginBottom:5, letterSpacing:'.5px', textTransform:'uppercase' }}>
                    Full Name <span style={{ color:'#e11d48' }}>*</span>
                  </label>
                  <input className="prog-input" value={fname} placeholder="Your full name"
                    onChange={e => { setFname(e.target.value); if (e.target.value.trim()) setFnameErr(false); }}
                    style={fnameErr ? { borderColor:'#e11d48' } : {}} />
                  {fnameErr && <div style={{ color:'#f87171', fontSize:12, marginTop:4 }}>⚠ Full name is required.</div>}
                </div>
                {/* Email */}
                <div>
                  <label style={{ fontSize:10.5, fontWeight:700, color:'rgba(255,255,255,0.4)', display:'block', marginBottom:5, letterSpacing:'.5px', textTransform:'uppercase' }}>
                    Email Address <span style={{ color:'rgba(255,255,255,0.25)', fontSize:10, fontWeight:400 }}>(for confirmation)</span>
                  </label>
                  <input className="prog-input" type="email" value={email} placeholder="your@email.com"
                    onChange={e => setEmail(e.target.value)} />
                </div>
                {/* Phone */}
                <div>
                  <label style={{ fontSize:10.5, fontWeight:700, color:'rgba(255,255,255,0.4)', display:'block', marginBottom:5, letterSpacing:'.5px', textTransform:'uppercase' }}>
                    Phone Number
                  </label>
                  <input className="prog-input" value={phone} placeholder="e.g. 09XX-XXX-XXXX"
                    onChange={e => setPhone(e.target.value)} />
                </div>
                {/* Institution */}
                <div>
                  <label style={{ fontSize:10.5, fontWeight:700, color:'rgba(255,255,255,0.4)', display:'block', marginBottom:5, letterSpacing:'.5px', textTransform:'uppercase' }}>
                    Institution / Organization
                  </label>
                  <input className="prog-input" value={institution} placeholder="Your institution"
                    onChange={e => setInst(e.target.value)} />
                </div>
                {/* Position */}
                <div>
                  <label style={{ fontSize:10.5, fontWeight:700, color:'rgba(255,255,255,0.4)', display:'block', marginBottom:5, letterSpacing:'.5px', textTransform:'uppercase' }}>
                    Position / Designation
                  </label>
                  <input className="prog-input" value={position} placeholder="e.g. Faculty, Researcher"
                    onChange={e => setPosition(e.target.value)} />
                </div>
              </div>

              {/* VIP Member Privileges vs Guest Comparison Banner */}
              {user?.role === 'MEMBER' || user?.role === 'ADMIN' ? (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.14) 0%, rgba(245,158,11,0.12) 100%)',
                  border: '1.5px solid rgba(16,185,129,0.38)',
                  borderRadius: 14, padding: '12px 16px',
                  boxShadow: '0 4px 20px rgba(16,185,129,0.12)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14 }}>👑</span>
                      <span style={{ fontSize: 12, fontWeight: 900, color: '#34d399', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                        VIP Consortium Member Perks
                      </span>
                    </div>
                    <span style={{ fontSize: 10.5, background: 'rgba(16,185,129,0.25)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.4)', padding: '2px 8px', borderRadius: 6, fontWeight: 800 }}>
                      100% Free Pass
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11, color: 'rgba(255,255,255,0.82)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span>⚡</span><span>Instant Priority Slot</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span>🎖️</span><span>Free Certificate</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span>📂</span><span>Workshop Materials</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span>✓</span><span>Fast-Track Pass</span></div>
                  </div>
                </div>
              ) : (
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  borderRadius: 14, padding: '12px 16px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14 }}>👤</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.75)' }}>
                        Standard Guest Registration
                      </span>
                    </div>
                    <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
                      Public Pass
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
                    Want instant priority seats, free certificates & workshop slides? <a href="/membership" target="_blank" rel="noreferrer" style={{ color: '#fb923c', fontWeight: 800, textDecoration: 'underline' }}>Apply for DASIG Membership →</a>
                  </div>
                </div>
              )}

              <div style={{ display:'flex', gap:10, marginTop:4 }}>
                <button onClick={() => setFormModal(null)} style={{ flex:1, background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.55)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:'12px', fontSize:13.5, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
                <button
                  onClick={submit}
                  disabled={submitting}
                  style={{
                    flex: 2,
                    background: submitting
                      ? '#475569'
                      : user?.role === 'MEMBER' || user?.role === 'ADMIN'
                      ? 'linear-gradient(90deg, #059669, #10b981)'
                      : 'linear-gradient(90deg, #f97316, #e11d48)',
                    color: '#fff', border: 'none', borderRadius: 12, padding: '12px',
                    fontSize: 14, fontWeight: 800, cursor: submitting ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                    boxShadow: submitting ? 'none' : user?.role === 'MEMBER' ? '0 4px 16px rgba(16,185,129,0.4)' : '0 4px 16px rgba(249,115,22,0.4)',
                  }}
                >
                  {submitting
                    ? '⏳ Submitting…'
                    : user?.role === 'MEMBER' || user?.role === 'ADMIN'
                    ? '⚡ Confirm VIP Member Registration'
                    : '✅ Confirm Guest Registration'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success modal */}
      {okModal && (
        <div onClick={() => setOkModal(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:9200, display:'flex', alignItems:'center', justifyContent:'center', padding:20, backdropFilter:'blur(8px)' }}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#0f172a', borderRadius:24, maxWidth:'min(460px,calc(100vw - 32px))', width:'100%', overflow:'hidden', border:'1px solid rgba(255,255,255,0.12)', animation:'modalIn .26s cubic-bezier(.34,1.56,.64,1)', boxShadow:'0 32px 80px rgba(0,0,0,0.85)' }}>
            <div style={{ background: grad(okModal.event), padding:'26px 24px 50px', textAlign:'center', position:'relative' }}>
              <div style={{ display:'flex', justifyContent:'center', marginBottom:6 }}>
                {okModal.role === 'MEMBER' || okModal.role === 'ADMIN' ? (
                  <span style={{ background:'rgba(0,0,0,0.4)', color:'#34d399', border:'1px solid rgba(52,211,153,0.4)', borderRadius:6, padding:'3px 10px', fontSize:11, fontWeight:900, letterSpacing:'0.6px', textTransform:'uppercase' }}>
                    👑 VIP Consortium Member Pass
                  </span>
                ) : (
                  <span style={{ background:'rgba(0,0,0,0.4)', color:'rgba(255,255,255,0.8)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:6, padding:'3px 10px', fontSize:11, fontWeight:800, textTransform:'uppercase' }}>
                    Standard Attendee Pass
                  </span>
                )}
              </div>
              <div style={{ color:'#fff', fontSize:19, fontWeight:900 }}>{okModal.event.title}</div>
              <div style={{ position:'absolute', bottom:-34, left:'50%', transform:'translateX(-50%)', width:68, height:68, borderRadius:'50%', background: grad(okModal.event), border:'4px solid #0f172a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, fontWeight:900, color:'#fff' }}>
                {(okModal.name || 'U')[0].toUpperCase()}
              </div>
            </div>
            <div style={{ paddingTop:46, paddingBottom:12, textAlign:'center', paddingLeft:24, paddingRight:24 }}>
              <div style={{ fontWeight:900, fontSize:17, color:'#fff' }}>{okModal.name}</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginTop:3 }}>{okModal.email}</div>
              {okModal.institution && <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:2 }}>🏛 {okModal.institution}</div>}
            </div>
            <div style={{ padding:'0 22px 22px', display:'flex', flexDirection:'column', gap:7 }}>
              {[
                {i:'📋',l:'EVENT',v:okModal.event.title},
                {i:'📅',l:'DATE',v:okModal.event.date||'TBA'},
                ...(okModal.event.start_time ? [{i:'🕐',l:'TIME',v:`${okModal.event.start_time}${okModal.event.end_time ? ` – ${okModal.event.end_time}` : ''}`}] : []),
                {i:'📍',l:'VENUE',v:okModal.event.venue||'TBA'},
                {i:'🏛',l:'ORGANIZER',v:okModal.event.organizer},
                {i:'🎫',l:'CATEGORY',v:okModal.event.category},
              ].filter(r=>r.v).map(r => (
                <div key={r.l} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', background:'rgba(255,255,255,0.04)', borderRadius:10 }}>
                  <span style={{ fontSize:14 }}>{r.i}</span>
                  <div><div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', fontWeight:700, letterSpacing:'.5px' }}>{r.l}</div><div style={{ fontSize:12.5, color:'#fff', fontWeight:700 }}>{r.v}</div></div>
                </div>
              ))}

              {/* Status Message */}
              <div style={{
                background: okModal.role === 'MEMBER' || okModal.role === 'ADMIN' ? 'rgba(16,185,129,0.14)' : 'rgba(59,130,246,0.12)',
                border: `1px solid ${okModal.role === 'MEMBER' || okModal.role === 'ADMIN' ? 'rgba(16,185,129,0.35)' : 'rgba(59,130,246,0.3)'}`,
                borderRadius: 12, padding: '11px 14px', marginTop: 4,
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                  <span style={{ fontSize:14 }}>{okModal.role === 'MEMBER' ? '👑' : '✅'}</span>
                  <span style={{ fontSize:12.5, color: okModal.role === 'MEMBER' ? '#34d399' : '#60a5fa', fontWeight:800 }}>
                    {okModal.role === 'MEMBER' ? 'VIP Member Registration Confirmed!' : 'Registration Confirmed!'}
                  </span>
                </div>
                <div style={{ fontSize:11.5, color:'rgba(255,255,255,0.7)', lineHeight:1.5 }}>
                  {okModal.role === 'MEMBER'
                    ? 'Your priority member slot and complimentary certificate eligibility are locked in. Confirmation email sent!'
                    : `Confirmation email sent to ${okModal.email}.`}
                </div>
              </div>

              <button onClick={() => setOkModal(null)} style={{ width:'100%', background:'linear-gradient(90deg,#f97316,#e11d48)', color:'#fff', border:'none', borderRadius:14, padding:'13px', fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:'inherit', marginTop:4 }}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search + Filter toolbar */}
      <div style={{
        background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)',
        borderRadius:18, padding:'14px 16px', marginBottom:22, backdropFilter:'blur(10px)',
        display:'flex', flexDirection:'column', gap:12,
      }}>
        {/* Search row */}
        <div style={{ position:'relative' }}>
          <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.3)', fontSize:15, pointerEvents:'none' }}>⌕</span>
          <input
            className="prog-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search events by title or venue…"
            style={{ paddingLeft:40, background:'rgba(255,255,255,0.05)', border:'1.5px solid rgba(255,255,255,0.1)', borderRadius:12, fontSize:13.5 }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'rgba(255,255,255,0.12)', border:'none', borderRadius:'50%', width:22, height:22, color:'rgba(255,255,255,0.7)', cursor:'pointer', fontSize:12, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'inherit' }}>✕</button>
          )}
        </div>
        {/* Filter + refresh row */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {EV_FILTERS.map(f => {
              const isActive = active === f;
              return (
                <button key={f} onClick={() => setActive(f)} style={{
                  background: isActive ? 'linear-gradient(90deg,#f97316,#e11d48)' : 'rgba(255,255,255,0.07)',
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                  border: isActive ? 'none' : '1px solid rgba(255,255,255,0.1)',
                  borderRadius:20, padding:'6px 16px', fontSize:12.5, fontWeight:700,
                  cursor:'pointer', fontFamily:'inherit', transition:'all .15s',
                  boxShadow: isActive ? '0 3px 12px rgba(249,115,22,0.35)' : 'none',
                  transform: isActive ? 'scale(1.04)' : 'scale(1)',
                }}>{f}</button>
              );
            })}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {lastUpdated && <span style={{ fontSize:11, color:'rgba(255,255,255,0.25)', fontWeight:500 }}>Updated {lastUpdated.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</span>}
            <button onClick={() => loadEvents(true)} disabled={loading} style={{
              background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)',
              borderRadius:9, padding:'6px 13px', color:'rgba(255,255,255,0.6)',
              fontSize:12, fontWeight:700, cursor: loading ? 'default' : 'pointer',
              fontFamily:'inherit', display:'flex', alignItems:'center', gap:5, transition:'all .14s',
            }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.background='rgba(255,255,255,0.13)'; e.currentTarget.style.color='#fff'; }}}
            onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.07)'; e.currentTarget.style.color='rgba(255,255,255,0.6)'; }}>
              <span style={{ display:'inline-block', animation: loading ? 'spin .7s linear infinite' : 'none' }}>↻</span>
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Event cards grid with Register buttons */}
      {!loading && filteredEvents.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:18 }}>
          {filteredEvents.map((ev, i) => (
            <EvCard key={ev.id} ev={ev} idx={i} registered={!!myRegs[ev.id]} onRegister={() => openForm(ev)} onCancel={() => cancelReg(ev)} cancelling={cancellingId === ev.id} />
          ))}
        </div>
      )}
      {!loading && search && (
        <div style={{ marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:12.5, color:'rgba(255,255,255,0.35)', fontWeight:600 }}>
            {filteredEvents.length > 0
              ? `${filteredEvents.length} result${filteredEvents.length > 1 ? 's' : ''} for "${search}"`
              : `No results for "${search}"`}
          </span>
          {filteredEvents.length > 0 && <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.06)' }} />}
        </div>
      )}
      {!loading && filteredEvents.length === 0 && (
        <div style={{ textAlign:'center', padding:'60px 0' }}>
          <div style={{ fontSize:42, marginBottom:14 }}>🔍</div>
          <div style={{ color:'rgba(255,255,255,0.55)', fontSize:16, fontWeight:800, marginBottom:8 }}>
            No events found
          </div>
          <div style={{ color:'rgba(255,255,255,0.3)', fontSize:13, marginBottom:20 }}>
            {search ? `No events match "${search}"` : 'No events available in this category.'}
          </div>
          {search && <button onClick={() => setSearch('')} style={{ background:'linear-gradient(90deg,#f97316,#e11d48)', color:'#fff', border:'none', borderRadius:10, padding:'9px 22px', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Clear Search</button>}
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
  const [lastUpdated, setLastUp]  = useState(null);
  const [catFilter, setCat]       = useState('All');
  const [search, setSearch]       = useState('');
  const [myEnr, setMyEnr]         = useState({});
  const [detail, setDetail]       = useState(null);
  const [formModal, setFormModal] = useState(null);
  const [okModal, setOkModal]     = useState(null);
  const [errModal, setErrModal]   = useState('');
  const [submitting, setSub]      = useState(false);
  const [cancellingEnrId, setCancellingEnrId] = useState(null);
  const [cancelEnrConfirm, setCancelEnrConfirm] = useState(null);
  const [conflictTr, setConflictTr] = useState(null); // { training, conflictsWith }
  const [fname, setFname]         = useState('');
  const [email, setEmail]         = useState('');
  const [phone, setPhone]         = useState('');
  const [institution, setInst]    = useState('');
  const [position, setPosition]   = useState('');
  const [fnameErr, setFnameErr]   = useState(false);
  const navigate = useNavigate();

  const loadTrainings = useCallback((showSpinner = false) => {
    if (showSpinner) setLoading(true);
    api.training.list().then(r => { setTrainings(r.data || []); setLastUp(new Date()); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadTrainings(true); }, [loadTrainings]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const id = setInterval(() => loadTrainings(false), 30000);
    return () => clearInterval(id);
  }, [loadTrainings]);

  // Refresh when tab regains focus
  useEffect(() => {
    function onVisible() { if (!document.hidden) loadTrainings(false); }
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [loadTrainings]);
  useEffect(() => {
    if (!user) return;
    api.auth.myEnrollments().then(enrs => {
      const m = {}; enrs.forEach(e => { m[+e.training_id] = true; }); setMyEnr(m);
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
    // Check ALL schedule conflicts with already-registered trainings
    const tRange = parseRange(t.schedule);
    if (tRange) {
      const allConflicts = Object.keys(myEnr)
        .map(id => trainings.find(tr => tr.id === +id))
        .filter(other => {
          if (!other || other.id === t.id) return false;
          const oRange = parseRange(other.schedule);
          return oRange && tRange.start <= oRange.end && oRange.start <= tRange.end;
        });
      if (allConflicts.length > 0) {
        setConflictTr({ training: t, conflictsWith: allConflicts });
        return;
      }
    }
    setFname(user.name || '');
    setEmail(user.email || '');
    setPhone(user.phone || '');
    setInst(user.institution || '');
    setPosition(user.campus || '');
    setFnameErr(false); setFormModal(t); setDetail(null);
  }

  async function cancelEnr(t) {
    setCancelEnrConfirm(t); // show custom modal
  }

  async function doCancelEnr() {
    const t = cancelEnrConfirm;
    if (!t) return;
    setCancelEnrConfirm(null);
    setCancellingEnrId(t.id);
    try {
      await api.training.unenroll(t.id);
      setMyEnr(p => { const n = { ...p }; delete n[t.id]; return n; });
      setTrainings(p => p.map(tr => tr.id === t.id ? { ...tr, enrolled: Math.max(0, tr.enrolled - 1) } : tr));
    } catch (err) {
      setErrModal(err.message || 'Failed to cancel enrollment');
    } finally {
      setCancellingEnrId(null);
    }
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
      setOkModal({ training: upd, name: fname, email, phone, institution, position, role: user?.role || 'GUEST' });
    } catch (err) {
      const msg = err.message || '';
      setFormModal(null);
      setErrModal(msg.toLowerCase().includes('already') ? 'already' : msg || 'Registration failed');
    } finally { setSub(false); }
  }

  const filtered = trainings.filter(t =>
    (catFilter === 'All' || t.category === catFilter) &&
    (!search.trim() || t.title.toLowerCase().includes(search.trim().toLowerCase()) || t.org?.toLowerCase().includes(search.trim().toLowerCase()))
  );

  return (
    <>
      <ErrModal err={errModal} onClose={() => setErrModal('')} />

      {/* Cancel registration confirmation */}
      {cancelEnrConfirm && (
        <CancelConfirmModal
          title="Cancel Registration?"
          subtitle={`Are you sure you want to cancel your registration in "${cancelEnrConfirm.title}"? Your slot will be returned to the available pool.`}
          confirming={!!cancellingEnrId}
          onConfirm={doCancelEnr}
          onCancel={() => setCancelEnrConfirm(null)}
        />
      )}

      {/* Training conflict warning modal — shows ALL conflicting programs */}
      {conflictTr && (
        <div onClick={() => setConflictTr(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.78)', zIndex:9300, display:'flex', alignItems:'center', justifyContent:'center', padding:20, backdropFilter:'blur(4px)', overflowY:'auto' }}>
          <div onClick={e => e.stopPropagation()} style={{ background:'linear-gradient(180deg,#0f1832,#080e1e)', border:'1px solid rgba(245,158,11,0.35)', borderRadius:24, maxWidth:'min(480px,calc(100vw - 32px))', width:'100%', overflow:'hidden', animation:'modalIn .22s ease', boxShadow:'0 32px 80px rgba(0,0,0,0.8)', margin:'auto' }}>
            <div style={{ background:'linear-gradient(135deg,rgba(245,158,11,0.2),rgba(249,115,22,0.12))', padding:'22px 24px 18px', textAlign:'center', borderBottom:'1px solid rgba(245,158,11,0.2)' }}>
              <div style={{ fontSize:44, marginBottom:8 }}>⚠️</div>
              <div style={{ color:'#fbbf24', fontWeight:900, fontSize:19, letterSpacing:'-0.3px' }}>Schedule Conflict Detected</div>
              <p style={{ color:'rgba(255,255,255,0.5)', fontSize:13, marginTop:5, lineHeight:1.5 }}>
                {conflictTr.conflictsWith.length === 1
                  ? 'You already have a program registered on overlapping dates.'
                  : `You have ${conflictTr.conflictsWith.length} registered programs that overlap these dates.`}
              </p>
            </div>
            <div style={{ padding:'20px 24px', maxHeight:'65vh', overflowY:'auto' }}>
              <div style={{ marginBottom:10 }}>
                <div style={{ fontSize:10.5, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:8 }}>
                  Already registered ({conflictTr.conflictsWith.length})
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {conflictTr.conflictsWith.map(t => (
                    <div key={t.id} style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:12, padding:'12px 14px', display:'flex', gap:12, alignItems:'flex-start' }}>
                      <span style={{ fontSize:18, flexShrink:0, marginTop:1 }}>🎓</span>
                      <div style={{ flex:1 }}>
                        <div style={{ color:'#fff', fontWeight:800, fontSize:13.5, marginBottom:2 }}>{t.title}</div>
                        <div style={{ color:'rgba(255,255,255,0.55)', fontSize:12 }}>{t.schedule?.split('|')[0]?.trim()}</div>
                        {t.session_start_time && <div style={{ color:'rgba(239,68,68,0.85)', fontSize:12, fontWeight:700, marginTop:2 }}>🕐 {t.session_start_time}{t.session_end_time ? ` – ${t.session_end_time}` : ''}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ textAlign:'center', color:'rgba(245,158,11,0.7)', fontSize:20, margin:'8px 0' }}>⬇</div>
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:10.5, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:8 }}>You're trying to register</div>
                <div style={{ background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:12, padding:'12px 14px', display:'flex', gap:12, alignItems:'flex-start' }}>
                  <span style={{ fontSize:18, flexShrink:0, marginTop:1 }}>🆕</span>
                  <div>
                    <div style={{ color:'#fff', fontWeight:800, fontSize:13.5, marginBottom:2 }}>{conflictTr.training.title}</div>
                    <div style={{ color:'rgba(255,255,255,0.55)', fontSize:12 }}>{conflictTr.training.schedule?.split('|')[0]?.trim()}</div>
                    {conflictTr.training.session_start_time && <div style={{ color:'rgba(245,158,11,0.85)', fontSize:12, fontWeight:700, marginTop:2 }}>🕐 {conflictTr.training.session_start_time}{conflictTr.training.session_end_time ? ` – ${conflictTr.training.session_end_time}` : ''}</div>}
                  </div>
                </div>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setConflictTr(null)} style={{ flex:1, background:'rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.7)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:12, padding:'11px', fontSize:13.5, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Go Back</button>
                <button onClick={() => { const t = conflictTr.training; setConflictTr(null); setFname(user?.name||''); setEmail(user?.email||''); setPhone(user?.phone||''); setInst(user?.institution||''); setPosition(user?.campus||''); setFnameErr(false); setFormModal(t); }} style={{ flex:2, background:'linear-gradient(90deg,#f97316,#e11d48)', color:'#fff', border:'none', borderRadius:12, padding:'11px', fontSize:13.5, fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}>Register Anyway</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail panel */}
      {detail && !formModal && (
        <div onClick={() => setDetail(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:9100, display:'flex', alignItems:'flex-start', justifyContent:'flex-end', padding:20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#0f172a', border:'1px solid rgba(255,255,255,0.12)', borderRadius:20, width:360, maxHeight:'80vh', overflow:'auto', animation:'panelIn .22s ease' }}>
            <div style={{ background: ts(detail).accent, padding:'22px 20px 18px', position:'relative' }}>
              <button onClick={() => setDetail(null)} style={{ position:'absolute', top:12, right:12, background:'rgba(0,0,0,0.70)', border:'2px solid rgba(255,255,255,0.5)', backdropFilter:'blur(10px)', borderRadius:'50%', width:36, height:36, color:'#fff', fontSize:16, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(6px)', boxShadow:'0 2px 8px rgba(0,0,0,0.4)' }}>✕</button>
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
                ? <div style={{ background:'rgba(16,185,129,0.12)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:12, padding:'12px 14px', textAlign:'center', color:'#34d399', fontWeight:700 }}>✓ You are registered</div>
                : detail.enrolled >= detail.total
                  ? <div style={{ background:'rgba(225,29,72,0.1)', border:'1px solid rgba(225,29,72,0.3)', borderRadius:12, padding:'12px', textAlign:'center', color:'#f87171', fontWeight:700 }}>Fully booked</div>
                  : <button onClick={() => openEnroll(detail)} style={{ width:'100%', background: ts(detail).accent, color:'#fff', border:'none', borderRadius:12, padding:'12px', fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}>
                      Register for this program →
                    </button>
              }
            </div>
          </div>
        </div>
      )}

      {/* Enrollment form */}
      {formModal && (
        <div onClick={() => !submitting && setFormModal(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:999999, display:'flex', alignItems:'center', justifyContent:'center', padding:'72px 20px 36px', overflowY:'auto', backdropFilter:'blur(10px)' }}>
          <div onClick={e => e.stopPropagation()} style={{ background:'linear-gradient(180deg,#0f172a,#020817)', borderRadius:22, maxWidth:'min(480px,calc(100vw - 32px))', width:'100%', position:'relative', border:'1px solid rgba(255,255,255,0.1)', maxHeight:'calc(100vh - 90px)', margin:'auto' }}>
            <div style={{ background: ts(formModal).accent, padding:'22px 24px 18px', position:'relative' }}>
              <button onClick={() => setFormModal(null)} style={{ position:'absolute', top:14, right:14, background:'rgba(0,0,0,0.70)', border:'2px solid rgba(255,255,255,0.5)', backdropFilter:'blur(10px)', borderRadius:'50%', width:36, height:36, color:'#fff', fontSize:16, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(6px)', boxShadow:'0 2px 8px rgba(0,0,0,0.4)' }}>✕</button>
              <div style={{ color:'rgba(255,255,255,0.65)', fontSize:10.5, fontWeight:700, letterSpacing:1, marginBottom:4 }}>PROGRAM REGISTRATION</div>
              <div style={{ color:'#fff', fontSize:17, fontWeight:900 }}>{formModal.title}</div>
              <div style={{ display:'flex', gap:12, marginTop:8, flexWrap:'wrap' }}>
                {[{i:'🏛',v:formModal.org},{i:'⏱',v:formModal.duration},{i:'📊',v:formModal.level}].map(r=>
                  <span key={r.v} style={{ color:'rgba(255,255,255,0.78)', fontSize:11.5 }}>{r.i} {r.v}</span>
                )}
              </div>
            </div>
            <div style={{ padding:'18px 24px 22px', display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                {/* Full Name */}
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={{ fontSize:10.5, fontWeight:700, color: fnameErr?'#f87171':'rgba(255,255,255,0.4)', display:'block', marginBottom:5, letterSpacing:'.5px', textTransform:'uppercase' }}>
                    Full Name <span style={{ color:'#e11d48' }}>*</span>
                  </label>
                  <input className="prog-input" value={fname} placeholder="Your full name"
                    onChange={e => { setFname(e.target.value); if (e.target.value.trim()) setFnameErr(false); }}
                    style={fnameErr ? { borderColor:'#e11d48' } : {}} />
                  {fnameErr && <div style={{ color:'#f87171', fontSize:12, marginTop:4 }}>⚠ Full name is required.</div>}
                </div>
                {/* Email */}
                <div>
                  <label style={{ fontSize:10.5, fontWeight:700, color:'rgba(255,255,255,0.4)', display:'block', marginBottom:5, letterSpacing:'.5px', textTransform:'uppercase' }}>Email Address</label>
                  <input className="prog-input" type="email" value={email} placeholder="your@email.com"
                    onChange={e => setEmail(e.target.value)} />
                </div>
                {/* Phone */}
                <div>
                  <label style={{ fontSize:10.5, fontWeight:700, color:'rgba(255,255,255,0.4)', display:'block', marginBottom:5, letterSpacing:'.5px', textTransform:'uppercase' }}>Phone Number</label>
                  <input className="prog-input" value={phone} placeholder="e.g. 09XX-XXX-XXXX"
                    onChange={e => setPhone(e.target.value)} />
                </div>
                {/* Institution */}
                <div>
                  <label style={{ fontSize:10.5, fontWeight:700, color:'rgba(255,255,255,0.4)', display:'block', marginBottom:5, letterSpacing:'.5px', textTransform:'uppercase' }}>Institution</label>
                  <input className="prog-input" value={institution} placeholder="Your institution"
                    onChange={e => setInst(e.target.value)} />
                </div>
                {/* Position */}
                <div>
                  <label style={{ fontSize:10.5, fontWeight:700, color:'rgba(255,255,255,0.4)', display:'block', marginBottom:5, letterSpacing:'.5px', textTransform:'uppercase' }}>Position / Designation</label>
                  <input className="prog-input" value={position} placeholder="e.g. Faculty, Researcher"
                    onChange={e => setPosition(e.target.value)} />
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'rgba(255,255,255,0.04)', borderRadius:10, border:'1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontSize:16 }}>🪪</span>
                <div>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', fontWeight:700, letterSpacing:'.5px', textTransform:'uppercase', marginBottom:2 }}>Account Type</div>
                  <div style={{ fontSize:12.5, fontWeight:800, color: user?.role==='ADMIN'?'#fca5a5':user?.role==='MEMBER'?'#6ee7b7':'#93c5fd' }}>
                    {user?.role==='ADMIN'?'🛡 Administrator':user?.role==='MEMBER'?'✓ Member':'○ Guest'}
                  </div>
                </div>
              </div>
              <div style={{ display:'flex', gap:10, marginTop:4 }}>
                <button onClick={() => setFormModal(null)} style={{ flex:1, background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.55)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:'12px', fontSize:13.5, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
                <button onClick={submitEnroll} disabled={submitting} style={{ flex:2, background: submitting?'#475569':ts(formModal).accent, color:'#fff', border:'none', borderRadius:12, padding:'12px', fontSize:14, fontWeight:800, cursor: submitting?'not-allowed':'pointer', fontFamily:'inherit' }}>
                  {submitting ? '⏳ Registering…' : '✅ Confirm Registration'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success */}
      {okModal && (
        <div onClick={() => setOkModal(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', zIndex:9200, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#0f172a', borderRadius:24, maxWidth:'min(420px,calc(100vw - 32px))', width:'100%', overflow:'hidden', border:'1px solid rgba(255,255,255,0.1)', animation:'modalIn .26s cubic-bezier(.34,1.56,.64,1)' }}>
            <div style={{ background: ts(okModal.training).accent, padding:'26px 26px 48px', textAlign:'center', position:'relative' }}>
              <div style={{ color:'rgba(255,255,255,0.6)', fontSize:10.5, fontWeight:700, letterSpacing:1, textTransform:'uppercase', marginBottom:6 }}>Registration Confirmed</div>
              <div style={{ color:'#fff', fontSize:18, fontWeight:900 }}>{okModal.training.title}</div>
              <div style={{ position:'absolute', bottom:-32, left:'50%', transform:'translateX(-50%)', width:64, height:64, borderRadius:'50%', background: ts(okModal.training).accent, border:'4px solid #0f172a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:900, color:'#fff' }}>
                {(okModal.name||'U')[0].toUpperCase()}
              </div>
            </div>
            <div style={{ paddingTop:44, paddingBottom:10, textAlign:'center', paddingLeft:22, paddingRight:22 }}>
              <div style={{ fontWeight:900, fontSize:16, color:'#fff' }}>{okModal.name}</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.38)', marginTop:3 }}>{okModal.email}</div>
              {okModal.position && <div style={{ fontSize:12, color:'rgba(255,255,255,0.32)', marginTop:2 }}>{okModal.position}</div>}
              {okModal.institution && <div style={{ fontSize:12, color:'rgba(255,255,255,0.32)', marginTop:2 }}>🏛 {okModal.institution}</div>}
            </div>
            <div style={{ padding:'0 22px 22px', display:'flex', flexDirection:'column', gap:7 }}>
              {[
                {i:'🎓',l:'PROGRAM',v:okModal.training.title},
                {i:'🏛',l:'ORGANIZER',v:okModal.training.org},
                {i:'⏱',l:'DURATION',v:okModal.training.duration},
                {i:'📊',l:'LEVEL',v:okModal.training.level},
                {i:'📅',l:'SCHEDULE',v:okModal.training.schedule?.split('|')[0]?.trim()},
                {i:'👥',l:'SLOTS',v:`${okModal.training.enrolled}/${okModal.training.total} registered`},
              ].filter(r=>r.v).map(r => (
                <div key={r.l} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', background:'rgba(255,255,255,0.04)', borderRadius:10 }}>
                  <span style={{ fontSize:14 }}>{r.i}</span>
                  <div><div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', fontWeight:700, letterSpacing:'.5px' }}>{r.l}</div><div style={{ fontSize:12.5, color:'#fff', fontWeight:700 }}>{r.v}</div></div>
                </div>
              ))}
              <div style={{ background:'rgba(16,185,129,0.12)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:12, padding:'11px 14px', marginTop:4 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}><span style={{ animation:'checkPop 0.4s 0.15s both', display:'inline-block', fontSize:14 }}>✅</span><span style={{ fontSize:12.5, color:'#34d399', fontWeight:700 }}>You&apos;re registered!</span></div>
                <div style={{ fontSize:11.5, color:'rgba(52,211,153,0.8)', lineHeight:1.5 }}>Confirmation email sent to <strong style={{ color:'#34d399' }}>{okModal.email}</strong>.</div>
              </div>
              <button onClick={() => setOkModal(null)} style={{ width:'100%', background: ts(okModal.training).accent, color:'#fff', border:'none', borderRadius:14, padding:'12px', fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:'inherit', marginTop:4 }}>Done</button>
            </div>
          </div>
        </div>
      )}

      {loading && <div style={{ textAlign:'center', padding:'60px 0', color:'rgba(255,255,255,0.3)' }}><div style={{ fontSize:32, marginBottom:10 }}>⏳</div>Loading…</div>}

      {/* Search + Filter toolbar */}
      <div style={{
        background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)',
        borderRadius:18, padding:'14px 16px', marginBottom:22, backdropFilter:'blur(10px)',
        display:'flex', flexDirection:'column', gap:12,
      }}>
        {/* Search row */}
        <div style={{ position:'relative' }}>
          <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.3)', fontSize:15, pointerEvents:'none' }}>⌕</span>
          <input
            className="prog-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search programs by title or organizer…"
            style={{ paddingLeft:40, background:'rgba(255,255,255,0.05)', border:'1.5px solid rgba(255,255,255,0.1)', borderRadius:12, fontSize:13.5 }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'rgba(255,255,255,0.12)', border:'none', borderRadius:'50%', width:22, height:22, color:'rgba(255,255,255,0.7)', cursor:'pointer', fontSize:12, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'inherit' }}>✕</button>
          )}
        </div>
        {/* Filter + refresh row */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
            {TR_CATS.map(c => {
              const isActive = catFilter === c;
              return (
                <button key={c} onClick={() => setCat(c)} style={{
                  background: isActive ? 'linear-gradient(90deg,#f97316,#e11d48)' : 'rgba(255,255,255,0.07)',
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                  border: isActive ? 'none' : '1px solid rgba(255,255,255,0.1)',
                  borderRadius:20, padding:'6px 16px', fontSize:12.5, fontWeight:700,
                  cursor:'pointer', fontFamily:'inherit', transition:'all .15s',
                  boxShadow: isActive ? '0 3px 12px rgba(249,115,22,0.35)' : 'none',
                  transform: isActive ? 'scale(1.04)' : 'scale(1)',
                }}>{c}</button>
              );
            })}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {lastUpdated && <span style={{ fontSize:11, color:'rgba(255,255,255,0.25)', fontWeight:500 }}>Updated {lastUpdated.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</span>}
            <button onClick={() => loadTrainings(true)} disabled={loading} style={{
              background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)',
              borderRadius:9, padding:'6px 13px', color:'rgba(255,255,255,0.6)',
              fontSize:12, fontWeight:700, cursor: loading ? 'default' : 'pointer',
              fontFamily:'inherit', display:'flex', alignItems:'center', gap:5, transition:'all .14s',
            }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.background='rgba(255,255,255,0.13)'; e.currentTarget.style.color='#fff'; }}}
            onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.07)'; e.currentTarget.style.color='rgba(255,255,255,0.6)'; }}>
              <span style={{ display:'inline-block', animation: loading ? 'spin .7s linear infinite' : 'none' }}>↻</span>
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Training cards */}
      {!loading && filtered.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:18 }}>
          {filtered.map((t, idx) => (
            <TrCard key={t.id} t={t} idx={idx} registered={!!myEnr[t.id]} onRegister={() => openEnroll(t)} onCancel={() => cancelEnr(t)} cancelling={cancellingEnrId === t.id} />
          ))}
        </div>
      )}
      {!loading && search && (
        <div style={{ marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:12.5, color:'rgba(255,255,255,0.35)', fontWeight:600 }}>
            {filtered.length > 0
              ? `${filtered.length} result${filtered.length > 1 ? 's' : ''} for "${search}"`
              : `No results for "${search}"`}
          </span>
          {filtered.length > 0 && <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.06)' }} />}
        </div>
      )}
      {!loading && filtered.length === 0 && (
        <div style={{ textAlign:'center', padding:'60px 0' }}>
          <div style={{ fontSize:42, marginBottom:14 }}>🔍</div>
          <div style={{ color:'rgba(255,255,255,0.55)', fontSize:16, fontWeight:800, marginBottom:8 }}>
            No programs found
          </div>
          <div style={{ color:'rgba(255,255,255,0.3)', fontSize:13, marginBottom:20 }}>
            {search ? `No programs match "${search}"` : 'No programs available in this category.'}
          </div>
          {search && <button onClick={() => setSearch('')} style={{ background:'linear-gradient(90deg,#f97316,#e11d48)', color:'#fff', border:'none', borderRadius:10, padding:'9px 22px', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Clear Search</button>}
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   CALENDAR TAB — Outlook calendar only, no cards below
   Shows BOTH events and training. Click bar or date = detail.
═══════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════
   CALENDAR TAB — FullCalendar implementation
═══════════════════════════════════════════════════════════ */

const CAT_META = {
  'All':         { icon:'📂', color:'#94a3b8', bg:'rgba(148,163,184,0.15)' },
  'Summit':      { icon:'🏛', color:'#818cf8', bg:'rgba(129,140,248,0.15)' },
  'Workshop':    { icon:'🔬', color:'#34d399', bg:'rgba(52,211,153,0.15)' },
  'Seminar':     { icon:'📢', color:'#f9a8d4', bg:'rgba(249,168,212,0.15)' },
  'Funding':     { icon:'💰', color:'#fcd34d', bg:'rgba(252,211,77,0.15)' },
  'Technology':  { icon:'💻', color:'#60a5fa', bg:'rgba(96,165,250,0.15)' },
  'Research':    { icon:'🔭', color:'#6ee7b7', bg:'rgba(110,231,183,0.15)' },
  'Leadership':  { icon:'🎯', color:'#fbbf24', bg:'rgba(251,191,36,0.15)' },
  'Governance':  { icon:'📋', color:'#c4b5fd', bg:'rgba(196,181,253,0.15)' },
};

function getUniqueEventColor(stringId) {
  let hash = 0;
  for (let i = 0; i < stringId.length; i++) {
    hash = stringId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return {
    bg: `hsl(${h}, 85%, 55%)`,
    border: `hsl(${h}, 85%, 40%)`, 
    text: '#ffffff'
  };
}

function CalendarTab({ user }) {
  const [events, setEvents]     = useState([]);
  const [trainings, setTrain]   = useState([]);
  const [myRegs, setMyRegs]     = useState({});
  const [myEnr, setMyEnr]       = useState({});
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detail, setDetail]       = useState(null);
  
  const [searchQuery, setSearchQuery]   = useState('');
  const [selectedCat, setSelectedCat]   = useState('All');
  const [filterOpen, setFilterOpen]     = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [pickerYear, setPickerYear]   = useState(new Date().getFullYear());
  const [pickerMonth, setPickerMonth] = useState(new Date().getMonth());
  const [pickerView, setPickerView]   = useState('month'); // 'month' | 'day'
  const calendarRef = useRef(null);
  const navigate = useNavigate();

  function loadData(isRefresh = false) {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    Promise.all([
      api.events.list({ limit: 1000 }),
      api.training.list({ limit: 1000 }),
    ]).then(([ev, tr]) => {
      setEvents(Array.isArray(ev) ? ev : (ev?.data || []));
      setTrain(Array.isArray(tr) ? tr : (tr?.data || []));
    }).catch(() => {}).finally(() => { setLoading(false); setRefreshing(false); });
  }

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (!user) return;
    api.auth.myRegistrations().then(r => {
      const m = {}; r.forEach(x => { m[+x.event_id] = true; }); setMyRegs(m);
    }).catch(() => {});
    api.auth.myEnrollments().then(r => {
      const m = {}; r.forEach(x => { m[+x.training_id] = true; }); setMyEnr(m);
    }).catch(() => {});
  }, [user]);

  // Combine all items
  const calItems = [
    ...events.map(ev => {
      const r = parseRange(ev.date);
      return { ...ev, startDate: r?.start||null, endDate: r?.end||null, _type:'event' };
    }),
    ...trainings.map(t => {
      const r = parseRange(t.schedule);
      return { ...t, startDate: r?.start||null, endDate: r?.end||null, _type:'training' };
    }),
  ];

  const allCategories = Array.from(new Set(calItems.map(it => it.category))).filter(Boolean).sort();

  // Date picker: jump FullCalendar to selected month/year
  function jumpToDate(year, month) {
    // Month selected → switch to day view
    setPickerYear(year);
    setPickerMonth(month);
    setPickerView('day');
  }

  function jumpToMonthYear(year, month) {
    setPickerYear(year);
    setPickerMonth(month);
    setDatePickerOpen(false);
    setPickerView('month');
    const calApi = calendarRef.current?.getApi();
    if (calApi) {
      const target = new Date(year, month, 1);
      calApi.gotoDate(target);
      calApi.changeView('dayGridMonth', target);
    }
  }

  // Auto-jump to the first month with scheduled events on load (e.g. June 2026)
  useEffect(() => {
    if (events.length > 0) {
      const sorted = [...events].map(e => ({ ...e, r: parseRange(e.date) })).filter(e => e.r?.start).sort((a, b) => a.r.start - b.r.start);
      if (sorted.length > 0 && sorted[0].r.start) {
        const d = sorted[0].r.start;
        setPickerMonth(d.getMonth());
        setPickerYear(d.getFullYear());
        const calApi = calendarRef.current?.getApi();
        if (calApi) {
          calApi.gotoDate(d);
        }
      }
    }
  }, [events.length]);

  function jumpToDay(day) {
    const calApi = calendarRef.current?.getApi();
    if (calApi) {
      const target = new Date(pickerYear, pickerMonth, day);
      calApi.gotoDate(target);
      // Switch to day view in FullCalendar so the selected day is focused
      calApi.changeView('timeGridDay', target);
    }
    setDatePickerOpen(false);
    setPickerView('month');
  }

  function jumpToToday() {
    const calApi = calendarRef.current?.getApi();
    if (calApi) calApi.today();
    const now = new Date();
    setPickerYear(now.getFullYear());
    setPickerMonth(now.getMonth());
    setDatePickerOpen(false);
    setPickerView('month');
  }

  // Conflict check logic
  const myIds = new Set([...Object.keys(myRegs).map(id => +id), ...Object.keys(myEnr).map(id => +id)]);
  const enrolled = calItems.filter(it => myIds.has(it.id));
  const conflictIds = new Set();
  for (let i = 0; i < enrolled.length; i++) {
    for (let j = i+1; j < enrolled.length; j++) {
      const a = enrolled[i], b = enrolled[j];
      if (!a.startDate || !b.startDate) continue;
      const aE = a.endDate||a.startDate, bE = b.endDate||b.startDate;
      if (a.startDate <= bE && b.startDate <= aE) { conflictIds.add(a.id); conflictIds.add(b.id); }
    }
  }

  // Map to FullCalendar format
  const fcEvents = calItems
    .filter(it => it.startDate)
    .filter(it => selectedCat === 'All' || it.category === selectedCat)
    .filter(it => !searchQuery || it.title.toLowerCase().includes(searchQuery.toLowerCase())) 
    .map(it => {
      const colors = getUniqueEventColor(it.title + it.id);
      const isConflict = conflictIds.has(it.id);

      const start = new Date(it.startDate);
      start.setHours(9, 0, 0); 
      const end = it.endDate ? new Date(it.endDate) : new Date(it.startDate);
      end.setHours(16, 0, 0); 

      return {
        id: String(it.id),
        title: it.title,
        start: start,
        end: end,
        backgroundColor: isConflict ? '#dc2626' : colors.bg,
        borderColor: isConflict ? '#991b1b' : colors.border,
        textColor: colors.text,
        extendedProps: { originalData: it }
      };
    });

  // NEW: Function to generate and download an .ics calendar file
  function generateICS(detailData) {
    const formatICSDate = (dateObj) => {
      return dateObj.toISOString().replace(/-|:|\.\d+/g, '').substring(0, 15) + 'Z';
    };

    const start = new Date(detailData.startDate || new Date());
    start.setHours(9, 0, 0);
    const end = detailData.endDate ? new Date(detailData.endDate) : new Date(start);
    end.setHours(16, 0, 0);

    const title = detailData.title || 'DASIG Event';
    const location = detailData.venue || detailData.org || 'TBA';
    const description = `Category: ${detailData.category}\\nView more details on the DASIG Portal.`;

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//DASIG Portal//EN',
      'BEGIN:VEVENT',
      `DTSTART:${formatICSDate(start)}`,
      `DTEND:${formatICSDate(end)}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${location}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <>
      {/* Item detail panel */}
      {detail && (
        <div onClick={() => setDetail(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:9100, display:'flex', alignItems:'flex-start', justifyContent:'flex-end', padding:20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#0f172a', border:'1px solid rgba(255,255,255,0.1)', borderRadius:20, width:340, maxHeight:'80vh', overflow:'auto', animation:'panelIn .22s ease' }}>
            <div style={{ background: getUniqueEventColor(detail.title + detail.id).bg, padding:'20px 18px 16px', position:'relative' }}>
              <button onClick={() => setDetail(null)} style={{ position:'absolute', top:12, right:12, background:'rgba(0,0,0,0.70)', border:'2px solid rgba(255,255,255,0.5)', backdropFilter:'blur(10px)', borderRadius:'50%', width:36, height:36, color:'#fff', fontSize:16, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.4)' }}>✕</button>
              <span style={{ background:'rgba(0,0,0,0.3)', color:'#fff', borderRadius:5, padding:'2px 9px', fontSize:10.5, fontWeight:700 }}>{detail.category}</span>
              <div style={{ color:'#fff', fontSize:16, fontWeight:900, lineHeight:1.35, marginTop:6 }}>{detail.title}</div>
            </div>
            <div style={{ padding:'16px 18px' }}>
              {detail._type === 'event'
                ? [['📅','Date',detail.date],['📍','Venue',detail.venue],['🏛','Organizer',detail.organizer],['👥','Seats',`${detail.enrolled}/${detail.total}`]]
                    .map(([i,l,v]) => v && (
                      <div key={l} style={{ display:'flex', gap:10, marginBottom:9 }}>
                        <span style={{ fontSize:15, flexShrink:0 }}>{i}</span>
                        <div><div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', fontWeight:700, letterSpacing:'.5px', textTransform:'uppercase' }}>{l}</div><div style={{ fontSize:13, color:'#fff', fontWeight:600 }}>{v}</div></div>
                      </div>
                    ))
                : [['🏛','Organizer',detail.org],['⏱','Duration',detail.duration],['📊','Level',detail.level],['📅','Schedule',detail.schedule],['👥','Enrollment',`${detail.enrolled}/${detail.total}`]]
                    .map(([i,l,v]) => v && (
                      <div key={l} style={{ display:'flex', gap:10, marginBottom:9 }}>
                        <span style={{ fontSize:15, flexShrink:0 }}>{i}</span>
                        <div><div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', fontWeight:700, letterSpacing:'.5px', textTransform:'uppercase' }}>{l}</div><div style={{ fontSize:13, color:'#fff', fontWeight:600 }}>{v}</div></div>
                      </div>
                    ))
              }
              {conflictIds.has(detail.id) && (
                <div style={{ background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.35)', borderRadius:10, padding:'10px 12px', marginBottom:12 }}>
                  <div style={{ color:'#fbbf24', fontWeight:700, fontSize:12.5 }}>⚠️ Scheduling conflict detected</div>
                </div>
              )}
              
              <button onClick={() => { setDetail(null); navigate(`/programs?tab=${detail._type==='event'?'events':'training'}`); }} style={{ width:'100%', background:'linear-gradient(90deg,#f97316,#e11d48)', color:'#fff', border:'none', borderRadius:11, padding:'11px', fontSize:13.5, fontWeight:800, cursor:'pointer', fontFamily:'inherit', marginTop:6 }}>
                {detail._type === 'event' ? 'Register in Programs →' : 'Enroll in Programs →'}
              </button>

              {/* NEW: Add to Calendar Button */}
              <button onClick={() => generateICS(detail)} style={{ width:'100%', background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', color:'#fff', borderRadius:11, padding:'10px', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', marginTop:10, display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition: 'all 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
              >
                📅 Add to Calendar (.ics)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main UI */}
      <div style={{ background:'linear-gradient(180deg,rgba(10,17,42,0.95),rgba(8,13,32,0.95))', border:'1px solid rgba(255,255,255,0.08)', borderRadius:20, padding:'20px 22px 22px', marginBottom:28, boxShadow:'0 16px 48px rgba(0,0,0,0.4)', backdropFilter:'blur(10px)' }}>
        
        {/* ── Top Controls Row ── */}
        <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:16, flexWrap:'wrap' }}>

          {/* Search */}
          <div style={{ position:'relative', flex:'1', minWidth:180, maxWidth:280 }}>
            <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:14, pointerEvents:'none' }}>🔍</span>
            <input type="text" placeholder="Search events or training…" value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="prog-input" style={{ paddingLeft:38, height:40 }} />
          </div>

          {/* ── Custom Category Filter Dropdown ── */}
          <div style={{ position:'relative', minWidth:210 }}>
            {/* Trigger */}
            <button
              onClick={() => { setFilterOpen(o => !o); setDatePickerOpen(false); }}
              style={{
                width:'100%', height:42,
                background: filterOpen ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)',
                border: `1.5px solid ${filterOpen ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.12)'}`,
                borderRadius:12, padding:'0 14px', cursor:'pointer', fontFamily:'inherit',
                display:'flex', alignItems:'center', gap:9, transition:'all .15s',
              }}
              onMouseEnter={e => { if (!filterOpen) { e.currentTarget.style.background='rgba(255,255,255,0.09)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.2)'; } }}
              onMouseLeave={e => { if (!filterOpen) { e.currentTarget.style.background='rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.12)'; } }}
            >
              <span style={{ fontSize:16, flexShrink:0 }}>{(CAT_META[selectedCat]||CAT_META.All).icon}</span>
              <span style={{ flex:1, textAlign:'left', fontSize:13.5, fontWeight:700, color: selectedCat==='All'?'rgba(255,255,255,0.75)':'#fff' }}>
                {selectedCat === 'All' ? 'All Categories' : selectedCat}
              </span>
              {selectedCat !== 'All' && (
                <span style={{
                  background: (CAT_META[selectedCat]||CAT_META.All).bg,
                  color: (CAT_META[selectedCat]||CAT_META.All).color,
                  borderRadius:20, padding:'2px 8px', fontSize:11, fontWeight:800,
                }}>
                  {fcEvents.length}
                </span>
              )}
              <span style={{ fontSize:10, color:'rgba(255,255,255,0.4)', transition:'transform .2s', transform: filterOpen?'rotate(180deg)':'rotate(0)', flexShrink:0 }}>▼</span>
            </button>

            {/* Dropdown menu */}
            {filterOpen && (
              <div onClick={e => e.stopPropagation()} style={{
                position:'absolute', top:48, left:0, zIndex:9999, width:240,
                background:'linear-gradient(180deg,#0f1832,#0a1020)',
                border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, overflow:'hidden',
                boxShadow:'0 24px 60px rgba(0,0,0,0.75)',
                animation:'dropIn .16s ease',
              }}>
                {/* All Categories */}
                {['All', ...allCategories].map((cat, idx) => {
                  const meta = CAT_META[cat] || { icon:'📁', color:'#94a3b8', bg:'rgba(148,163,184,0.1)' };
                  const isActive = selectedCat === cat;
                  const count = cat === 'All'
                    ? calItems.filter(it => it.startDate).length
                    : calItems.filter(it => it.startDate && it.category === cat).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => { setSelectedCat(cat); setFilterOpen(false); }}
                      style={{
                        width:'100%', display:'flex', alignItems:'center', gap:11,
                        padding:'11px 16px',
                        background: isActive ? `${meta.bg}` : 'transparent',
                        border:'none', borderBottom: idx < allCategories.length ? '1px solid rgba(255,255,255,0.04)' : 'none',
                        cursor:'pointer', fontFamily:'inherit', transition:'background .13s',
                        borderLeft: isActive ? `3px solid ${meta.color}` : '3px solid transparent',
                      }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background='rgba(255,255,255,0.05)'; }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background='transparent'; }}
                    >
                      {/* Icon circle */}
                      <div style={{ width:32, height:32, borderRadius:9, background: isActive ? meta.bg : 'rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0, border: isActive ? `1px solid ${meta.color}40` : '1px solid rgba(255,255,255,0.06)' }}>
                        {meta.icon}
                      </div>
                      {/* Label */}
                      <div style={{ flex:1, textAlign:'left' }}>
                        <div style={{ fontSize:13.5, fontWeight: isActive ? 800 : 600, color: isActive ? '#fff' : 'rgba(255,255,255,0.75)', lineHeight:1.2 }}>{cat === 'All' ? 'All Categories' : cat}</div>
                        {cat !== 'All' && <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginTop:1 }}>{cat.includes('Summit')||cat.includes('Workshop')||cat.includes('Seminar')||cat.includes('Funding') ? 'Event' : 'Training'}</div>}
                      </div>
                      {/* Count badge */}
                      <span style={{
                        background: isActive ? meta.bg : 'rgba(255,255,255,0.06)',
                        color: isActive ? meta.color : 'rgba(255,255,255,0.45)',
                        border: isActive ? `1px solid ${meta.color}40` : '1px solid rgba(255,255,255,0.08)',
                        borderRadius:20, padding:'2px 9px', fontSize:12, fontWeight:800, flexShrink:0,
                      }}>{count}</span>
                    </button>
                  );
                })}
              </div>
            )}
            {/* Backdrop close */}
            {filterOpen && <div onClick={() => setFilterOpen(false)} style={{ position:'fixed', inset:0, zIndex:9998 }} />}
          </div>

          {/* Date Picker Shortcut */}
          <div style={{ position:'relative' }}>
            {/* ── Premium Date Picker Trigger Button ── */}
            <button
              onClick={() => { setPickerYear(pickerYear); setDatePickerOpen(o => !o); }}
              style={{
                height:42,
                background: datePickerOpen
                  ? 'linear-gradient(135deg,rgba(249,115,22,0.25),rgba(225,29,72,0.18))'
                  : 'rgba(255,255,255,0.07)',
                border: `1.5px solid ${datePickerOpen ? 'rgba(249,115,22,0.55)' : 'rgba(255,255,255,0.14)'}`,
                borderRadius:12, padding:'0 18px',
                color: datePickerOpen ? '#f97316' : 'rgba(255,255,255,0.8)',
                fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:'inherit',
                display:'flex', alignItems:'center', gap:8, transition:'all .18s',
                boxShadow: datePickerOpen ? '0 4px 20px rgba(249,115,22,0.25)' : 'none',
              }}
              onMouseEnter={e => { if (!datePickerOpen) { e.currentTarget.style.background='rgba(255,255,255,0.11)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.25)'; } }}
              onMouseLeave={e => { if (!datePickerOpen) { e.currentTarget.style.background='rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.14)'; } }}
            >
              <span style={{ fontSize:16 }}>📅</span>
              <span>{MONTH_NAMES[pickerMonth]?.slice(0,3)} {pickerYear}</span>
              <span style={{ fontSize:9, opacity:.7, transition:'transform .2s', transform: datePickerOpen ? 'rotate(180deg)' : 'rotate(0)' }}>▼</span>
            </button>

            {/* ── Premium Date Picker Dropdown ── */}
            {datePickerOpen && (
              <div onClick={e => e.stopPropagation()} style={{
                position: 'absolute', top: 50, left: 0, zIndex: 9999,
                background: 'rgba(8, 14, 28, 0.96)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 22, overflow: 'hidden',
                boxShadow: '0 32px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(249,115,22,0.15)',
                width: 320,
                animation: 'dropIn .18s ease',
              }}>
                {/* Header bar */}
                <div style={{
                  background: 'linear-gradient(135deg,rgba(249,115,22,0.14),rgba(225,29,72,0.08))',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(249,115,22,0.85)', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 2 }}>
                      {pickerView === 'day' ? `Select Day · ${MONTH_NAMES[pickerMonth].slice(0,3)} ${pickerYear}` : 'Calendar Navigation'}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', letterSpacing: '-0.3px' }}>
                      {MONTH_NAMES[pickerMonth]} {pickerYear}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {pickerView === 'day' && (
                      <button onClick={() => setPickerView('month')} style={{
                        background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: 8, padding: '4px 10px', color: 'rgba(255,255,255,0.8)',
                        fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                      }}>‹ Months</button>
                    )}
                    <button onClick={() => setDatePickerOpen(false)} style={{
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '50%', width: 26, height: 26, color: 'rgba(255,255,255,0.5)',
                      fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>✕</button>
                  </div>
                </div>

                <div style={{ padding: '16px' }}>
                  {/* Year navigation */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: 16, background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 12, padding: '6px 10px',
                  }}>
                    <button
                      onClick={() => setPickerYear(y => Math.max(2020, y-1))}
                      disabled={pickerYear <= 2020}
                      style={{
                        width: 32, height: 32, borderRadius: 8, border: 'none',
                        background: pickerYear <= 2020 ? 'transparent' : 'rgba(255,255,255,0.06)',
                        color: pickerYear <= 2020 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.8)',
                        fontSize: 16, cursor: pickerYear <= 2020 ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .14s',
                      }}
                      onMouseEnter={e => { if (pickerYear > 2020) e.currentTarget.style.background = 'rgba(249,115,22,0.2)'; }}
                      onMouseLeave={e => { if (pickerYear > 2020) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                    >‹</button>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: '#fff', fontWeight: 900, fontSize: 20, letterSpacing: '-0.5px', lineHeight: 1 }}>{pickerYear}</div>
                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10.5, fontWeight: 600, marginTop: 2 }}>
                        {pickerYear === new Date().getFullYear() ? 'Current Year' : pickerYear < new Date().getFullYear() ? `${new Date().getFullYear() - pickerYear}y ago` : `in ${pickerYear - new Date().getFullYear()}y`}
                      </div>
                    </div>
                    <button
                      onClick={() => setPickerYear(y => Math.min(2035, y+1))}
                      disabled={pickerYear >= 2035}
                      style={{
                        width: 32, height: 32, borderRadius: 8, border: 'none',
                        background: pickerYear >= 2035 ? 'transparent' : 'rgba(255,255,255,0.06)',
                        color: pickerYear >= 2035 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.8)',
                        fontSize: 16, cursor: pickerYear >= 2035 ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .14s',
                      }}
                      onMouseEnter={e => { if (pickerYear < 2035) e.currentTarget.style.background = 'rgba(249,115,22,0.2)'; }}
                      onMouseLeave={e => { if (pickerYear < 2035) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                    >›</button>
                  </div>

                  {pickerView === 'month' ? (
                    /* ── Month grid 4×3 ── */
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginBottom: 14 }}>
                      {MONTH_NAMES.map((mn, mi) => {
                        const isSelected = mi === pickerMonth;
                        const isCurrentMonth = mi === new Date().getMonth() && pickerYear === new Date().getFullYear();
                        const isUpcomingEventMonth = pickerYear === 2026 && (mi === 8 || mi === 9 || mi === 10 || mi === 11);
                        return (
                          <button key={mi} onClick={() => jumpToDate(pickerYear, mi)} style={{
                            padding: '10px 4px', borderRadius: 11,
                            border: isSelected
                              ? '1px solid rgba(249,115,22,0.6)'
                              : isCurrentMonth
                                ? '1.5px solid rgba(249,115,22,0.45)'
                                : '1px solid rgba(255,255,255,0.06)',
                            fontSize: 12.5, fontWeight: isSelected || isCurrentMonth || isUpcomingEventMonth ? 800 : 600,
                            cursor: 'pointer', fontFamily: 'inherit', transition: 'all .14s',
                            background: isSelected
                              ? 'linear-gradient(135deg,#f97316,#e11d48)'
                              : isCurrentMonth
                                ? 'rgba(249,115,22,0.1)'
                                : 'rgba(255,255,255,0.03)',
                            color: isSelected
                              ? '#fff'
                              : isCurrentMonth
                                ? '#fb923c'
                                : 'rgba(255,255,255,0.8)',
                            boxShadow: isSelected ? '0 4px 14px rgba(249,115,22,0.4)' : 'none',
                            transform: isSelected ? 'scale(1.04)' : 'scale(1)',
                            position: 'relative',
                          }}
                          onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; } }}
                          onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.background = isCurrentMonth ? 'rgba(249,115,22,0.1)' : 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = isCurrentMonth ? '#fb923c' : 'rgba(255,255,255,0.8)'; } }}
                          >
                            <span>{mn.slice(0,3)}</span>
                            {isUpcomingEventMonth && !isSelected && (
                              <span style={{ position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: '50%', background: '#f97316' }} />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    /* ── Day grid ── */
                    (() => {
                      const today = new Date();
                      const daysInMonth = new Date(pickerYear, pickerMonth + 1, 0).getDate();
                      const firstDow = new Date(pickerYear, pickerMonth, 1).getDay();
                      const cells = [];
                      for (let i = 0; i < firstDow; i++) cells.push(null);
                      for (let d = 1; d <= daysInMonth; d++) cells.push(d);
                      while (cells.length % 7 !== 0) cells.push(null);

                      return (
                        <div style={{ marginBottom: 14 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 4 }}>
                            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                              <div key={d} style={{ textAlign: 'center', fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,0.3)', padding: '3px 0' }}>{d}</div>
                            ))}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
                            {cells.map((d, i) => {
                              if (!d) return <div key={i} />;
                              const isToday = d === today.getDate() && pickerMonth === today.getMonth() && pickerYear === today.getFullYear();
                              const isPast = new Date(pickerYear, pickerMonth, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                              return (
                                <button key={i} onClick={() => jumpToDay(d)} style={{
                                  width: '100%', aspectRatio: '1', borderRadius: 8, border: 'none',
                                  fontSize: 12, fontWeight: isToday ? 900 : 600,
                                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all .13s',
                                  background: isToday ? 'linear-gradient(135deg,#f97316,#e11d48)' : 'rgba(255,255,255,0.04)',
                                  color: isToday ? '#fff' : isPast ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.82)',
                                  boxShadow: isToday ? '0 3px 10px rgba(249,115,22,0.5)' : 'none',
                                }}
                                onMouseEnter={e => { if (!isToday) { e.currentTarget.style.background = 'rgba(249,115,22,0.22)'; e.currentTarget.style.color = '#f97316'; } }}
                                onMouseLeave={e => { if (!isToday) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = isPast ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.82)'; } }}
                                >{d}</button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()
                  )}

                  {/* Footer action */}
                  <button
                    onClick={jumpToToday}
                    style={{
                      width: '100%', background: 'linear-gradient(90deg,#f97316,#e11d48)',
                      border: 'none', borderRadius: 12, padding: '10px',
                      color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer',
                      fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(249,115,22,0.35)',
                      transition: 'all .15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '.9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'none'; }}
                  >
                    📍 Jump to Today ({MONTH_NAMES[new Date().getMonth()].slice(0,3)} {new Date().getFullYear()})
                  </button>
                </div>
              </div>
            )}
            {/* Close picker on outside click */}
            {datePickerOpen && <div onClick={() => setDatePickerOpen(false)} style={{ position:'fixed', inset:0, zIndex:9998 }} />}
          </div>

          {/* Quick Month Shortcuts bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.6px' }}>Quick Jump:</span>
            <button
              onClick={() => jumpToMonthYear(2026, 8)}
              style={{
                background: pickerMonth === 8 && pickerYear === 2026 ? 'linear-gradient(90deg,#f97316,#e11d48)' : 'rgba(255,255,255,0.06)',
                color: pickerMonth === 8 && pickerYear === 2026 ? '#fff' : 'rgba(255,255,255,0.85)',
                border: `1px solid ${pickerMonth === 8 && pickerYear === 2026 ? 'transparent' : 'rgba(255,255,255,0.12)'}`,
                borderRadius: 9, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all .14s',
              }}
            >
              🗓️ Sep 2026 · Summit
            </button>
            <button
              onClick={() => jumpToMonthYear(2026, 9)}
              style={{
                background: pickerMonth === 9 && pickerYear === 2026 ? 'linear-gradient(90deg,#f97316,#e11d48)' : 'rgba(255,255,255,0.06)',
                color: pickerMonth === 9 && pickerYear === 2026 ? '#fff' : 'rgba(255,255,255,0.85)',
                border: `1px solid ${pickerMonth === 9 && pickerYear === 2026 ? 'transparent' : 'rgba(255,255,255,0.12)'}`,
                borderRadius: 9, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all .14s',
              }}
            >
              🗓️ Oct 2026 · Symposium
            </button>
            <button
              onClick={() => jumpToMonthYear(2026, 10)}
              style={{
                background: pickerMonth === 10 && pickerYear === 2026 ? 'linear-gradient(90deg,#f97316,#e11d48)' : 'rgba(255,255,255,0.06)',
                color: pickerMonth === 10 && pickerYear === 2026 ? '#fff' : 'rgba(255,255,255,0.85)',
                border: `1px solid ${pickerMonth === 10 && pickerYear === 2026 ? 'transparent' : 'rgba(255,255,255,0.12)'}`,
                borderRadius: 9, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all .14s',
              }}
            >
              🗓️ Nov 2026 · ICT Forum
            </button>
            <button
              onClick={() => jumpToMonthYear(2026, 11)}
              style={{
                background: pickerMonth === 11 && pickerYear === 2026 ? 'linear-gradient(90deg,#f97316,#e11d48)' : 'rgba(255,255,255,0.06)',
                color: pickerMonth === 11 && pickerYear === 2026 ? '#fff' : 'rgba(255,255,255,0.85)',
                border: `1px solid ${pickerMonth === 11 && pickerYear === 2026 ? 'transparent' : 'rgba(255,255,255,0.12)'}`,
                borderRadius: 9, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all .14s',
              }}
            >
              🗓️ Dec 2026 · Grants
            </button>
            <button
              onClick={jumpToToday}
              style={{
                background: pickerMonth === new Date().getMonth() && pickerYear === new Date().getFullYear() ? 'linear-gradient(90deg,#10b981,#059669)' : 'rgba(255,255,255,0.06)',
                color: pickerMonth === new Date().getMonth() && pickerYear === new Date().getFullYear() ? '#fff' : 'rgba(255,255,255,0.7)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 9, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all .14s',
              }}
            >
              📍 Today
            </button>
          </div>

          {/* Refresh */}
          <button onClick={() => loadData(true)} disabled={refreshing} style={{ height:40, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, padding:'0 16px', color:'rgba(255,255,255,0.65)', fontSize:13, fontWeight:700, cursor: refreshing?'default':'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:6, transition:'all .13s', marginLeft:'auto' }}
            onMouseEnter={e => { if (!refreshing) e.currentTarget.style.background='rgba(255,255,255,0.12)'; }}
            onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.07)'}
          >
            <span style={{ display:'inline-block', animation: refreshing?'spin .7s linear infinite':'none' }}>↻</span>
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {/* Active filter badge */}
        {selectedCat !== 'All' && (
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
            <span style={{ fontSize:12.5, color:'rgba(255,255,255,0.45)', fontWeight:600 }}>Showing:</span>
            <span style={{ background:'rgba(249,115,22,0.18)', border:'1px solid rgba(249,115,22,0.4)', borderRadius:20, padding:'4px 14px', fontSize:13, fontWeight:800, color:'#f97316' }}>
              {selectedCat}
            </span>
            <button onClick={() => setSelectedCat('All')} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', fontSize:12.5, cursor:'pointer', fontFamily:'inherit', fontWeight:600, transition:'color .13s' }}
              onMouseEnter={e => e.currentTarget.style.color='#f43f5e'}
              onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.4)'}
            >✕ Clear filter</button>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign:'center', padding:'80px 0', color:'rgba(255,255,255,0.3)' }}><div style={{ fontSize:36, marginBottom:12 }}>⏳</div>Loading calendar…</div>
        ) : fcEvents.length === 0 && !loading ? (
          /* ── Not Available state ── */
          <div style={{ textAlign:'center', padding:'80px 24px', background:'rgba(255,255,255,0.02)', borderRadius:16, border:'1px dashed rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize:56, marginBottom:16 }}>📭</div>
            <div style={{ color:'#fff', fontWeight:900, fontSize:20, marginBottom:8 }}>
              No events available{selectedCat !== 'All' ? ` for "${selectedCat}"` : ''}
            </div>
            <p style={{ color:'rgba(255,255,255,0.45)', fontSize:14, lineHeight:1.7, maxWidth:380, margin:'0 auto 24px' }}>
              {selectedCat !== 'All'
                ? `There are currently no scheduled events or training programs in the "${selectedCat}" category.`
                : searchQuery
                  ? `No results matching "${searchQuery}". Try a different search term.`
                  : 'No events or training programs are currently scheduled.'}
            </p>
            <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
              {selectedCat !== 'All' && (
                <button onClick={() => setSelectedCat('All')} style={{ background:'linear-gradient(90deg,#f97316,#e11d48)', color:'#fff', border:'none', borderRadius:11, padding:'10px 22px', fontSize:13.5, fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}>
                  Show All Categories
                </button>
              )}
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{ background:'rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.75)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:11, padding:'10px 22px', fontSize:13.5, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                  Clear Search
                </button>
              )}
            </div>
          </div>
        ) : (
          /* ── FullCalendar with vibrant dark theme ── */
          <div className="fc-dark-theme" style={{
            background: 'linear-gradient(180deg,#08112a 0%,#0d1424 100%)',
            borderRadius: 16, padding: '12px 8px 8px',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
          }}>
            <FullCalendar
              ref={calendarRef}
              plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay',
              }}
              slotMinTime="08:00:00"
              slotMaxTime="20:00:00"
              allDaySlot={false}
              events={fcEvents}
              height="75vh"
              eventDisplay="block"
              nowIndicator={true}
              dayMaxEvents={3}
              moreLinkClick="popover"
              /* Custom event content — icon prefix + title */
              eventContent={(arg) => {
                const it = arg.event.extendedProps.originalData;
                const icon = it._type === 'event' ? '📅' : '🎓';
                return (
                  <div style={{ display:'flex', alignItems:'center', gap:4, overflow:'hidden', padding:'1px 2px' }}>
                    <span style={{ fontSize:10, flexShrink:0 }}>{icon}</span>
                    <span style={{ fontSize:11.5, fontWeight:800, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', lineHeight:1.3 }}>
                      {arg.event.title}
                    </span>
                  </div>
                );
              }}
              eventClick={(info) => {
                setDetail(info.event.extendedProps.originalData);
                info.jsEvent.preventDefault();
              }}
              dateClick={(info) => {
                const calApi = calendarRef.current?.getApi();
                if (calApi) { calApi.changeView('timeGridDay', info.date); }
              }}
              eventDidMount={(info) => {
                const it = info.event.extendedProps.originalData;
                const isEv = it._type === 'event';
                const icon = isEv ? '📅' : '🎓';
                const d1   = isEv ? `📍 ${it.venue}` : `🏛 ${it.org}`;
                const d2   = isEv ? `👥 ${it.enrolled}/${it.total} seats` : `⏱ ${it.duration} · 📊 ${it.level}`;
                const isConflict = conflictIds.has(it.id);

                tippy(info.el, {
                  content: `
                    <div style="font-family:inherit;min-width:220px">
                      <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
                        <span style="font-size:14px">${icon}</span>
                        <span style="font-size:10px;font-weight:800;color:#f97316;text-transform:uppercase;letter-spacing:.5px">${it.category}</span>
                        ${isConflict ? '<span style="font-size:10px;background:rgba(245,158,11,0.2);color:#fbbf24;border-radius:5px;padding:1px 6px;font-weight:800">⚠ Conflict</span>' : ''}
                      </div>
                      <div style="font-size:14px;font-weight:900;color:#fff;margin-bottom:8px;line-height:1.35">${it.title}</div>
                      <div style="font-size:12px;color:rgba(255,255,255,0.65);margin-bottom:3px">${d1}</div>
                      <div style="font-size:12px;color:rgba(255,255,255,0.65);margin-bottom:10px">${d2}</div>
                      <div style="font-size:11px;font-weight:700;color:#f97316;background:rgba(249,115,22,0.1);border-radius:6px;padding:5px 8px;text-align:center">
                        Click to view details →
                      </div>
                    </div>`,
                  allowHTML: true,
                  theme: 'dasig',
                  placement: 'auto',
                  animation: 'shift-away',
                  arrow: true,
                  delay: [200, 0],
                  maxWidth: 280,
                });
                info.el.style.cursor = 'pointer';
              }}
            />
          </div>
        )}

        {/* ── Scheduled Consortium Agenda (Below Calendar) ── */}
        <div style={{ marginTop: 28, paddingTop: 22, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>📋</span>
              <span>Scheduled Consortium Agenda</span>
            </div>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
              {calItems.length} active scheduled items
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: 14 }}>
            {calItems.slice(0, 6).map(it => {
              const isEvent = it._type === 'event';
              const catTheme = {
                Summit:   { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)', color: '#60a5fa', icon: '🏛️' },
                Workshop: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', color: '#34d399', icon: '🔬' },
                Seminar:  { bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.3)', color: '#c084fc', icon: '📢' },
                Funding:  { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', color: '#fbbf24', icon: '💰' },
              }[it.category] || { bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)', color: '#fb923c', icon: isEvent ? '📅' : '🎓' };

              return (
                <div
                  key={it.id}
                  onClick={() => setDetail(it)}
                  style={{
                    background: 'rgba(15,23,42,0.7)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 16, padding: '16px 18px', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    gap: 12, backdropFilter: 'blur(10px)',
                    transition: 'all 0.18s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.borderColor = 'rgba(249,115,22,0.45)';
                    e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.5)';
                    e.currentTarget.style.background = 'rgba(15,23,42,0.92)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.background = 'rgba(15,23,42,0.7)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{
                      background: catTheme.bg, border: `1px solid ${catTheme.border}`,
                      color: catTheme.color, borderRadius: 6, padding: '2px 8px',
                      fontSize: 11, fontWeight: 800, letterSpacing: '.3px',
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                    }}>
                      <span>{catTheme.icon}</span>
                      <span>{it.category || 'General'}</span>
                    </span>
                    <span style={{ fontSize: 11.5, color: '#f97316', fontWeight: 700 }}>
                      {it.date || it.schedule}
                    </span>
                  </div>

                  <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', lineHeight: 1.35 }}>
                    {it.title}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10, marginTop: 2 }}>
                    <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                      <span>📍</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.venue || it.org || 'Region VII'}</span>
                    </div>
                    <span style={{ fontSize: 11.5, fontWeight: 800, color: '#f97316', display: 'flex', alignItems: 'center', gap: 3 }}>
                      Details →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </>
  );
}