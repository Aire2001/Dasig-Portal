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
        <div style={{ maxWidth:1120, margin:'0 auto', padding:'0 24px 80px' }}>

          {/* Tab switcher — only show on Programs (not Calendar) */}
          {!isCalendar && (
            <div style={{ display:'flex', gap:10, marginBottom:28, flexWrap:'wrap' }}>
              {[
                { key:'events',   label:'📅 Events',           sub:'Summits, workshops & seminars' },
                { key:'training', label:'🎓 Training Programs', sub:'Professional development programs' },
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

function TrCard({ t, idx, enrolled, onEnroll, onCancel, cancelling }) {
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
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            {enrolled
              ? <span style={{ background:'rgba(16,185,129,0.12)', color:'#34d399', borderRadius:10, padding:'8px 14px', fontSize:12.5, fontWeight:700, border:'1px solid rgba(16,185,129,0.22)' }}>✓ Enrolled</span>
              : <button onClick={onEnroll} disabled={full} style={{ background: full?'rgba(255,255,255,0.05)':s.accent, color: full?'rgba(255,255,255,0.3)':'#fff', border: full?'1px solid rgba(255,255,255,0.08)':'none', borderRadius:10, padding:'9px 20px', fontSize:13, fontWeight:800, cursor: full?'not-allowed':'pointer', fontFamily:'inherit', boxShadow: full?'none':`0 4px 12px ${s.color}40` }}>
                  {full?'Fully Booked':'Enroll →'}
                </button>
            }
          </div>
          {/* Cancel enrollment — shown for all enrolled users */}
          {enrolled && (
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
              {cancelling ? '⏳ Cancelling…' : '✕ Cancel Enrollment'}
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
      .then(r => { setEvents(r.data || []); setLastUp(new Date()); })
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
        regs.forEach(r => { m[r.event_id] = { attended: r.attended }; });
        setMyRegs(m);
      })
      .catch(() => {});
  }, [user]);

  const filteredEvents = active === 'All' ? events : events.filter(ev => ev.category === active);

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

      {/* Conflict warning */}
      {conflict && (
        <div onClick={() => setConflict(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.72)', zIndex:9300, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#0f172a', border:'1px solid rgba(245,158,11,0.4)', borderRadius:22, maxWidth:'min(420px,calc(100vw - 32px))', width:'100%', padding:'32px', animation:'modalIn .22s ease' }}>
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
        <div onClick={() => !submitting && setFormModal(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', zIndex:9200, display:'flex', alignItems:'center', justifyContent:'center', padding:20, overflowY:'auto' }}>
          <div onClick={e => e.stopPropagation()} style={{ background:'linear-gradient(180deg,#0f172a,#020817)', borderRadius:22, maxWidth:'min(480px,calc(100vw - 32px))', width:'100%', position:'relative', border:'1px solid rgba(255,255,255,0.1)', animation:'modalIn .24s cubic-bezier(.34,1.56,.64,1)', margin:'auto' }}>
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
              {/* Role badge */}
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
          <div onClick={e => e.stopPropagation()} style={{ background:'#0f172a', borderRadius:24, maxWidth:'min(440px,calc(100vw - 32px))', width:'100%', overflow:'hidden', border:'1px solid rgba(255,255,255,0.1)', animation:'modalIn .26s cubic-bezier(.34,1.56,.64,1)' }}>
            <div style={{ background: grad(okModal.event), padding:'28px 28px 52px', textAlign:'center', position:'relative' }}>
              <div style={{ color:'rgba(255,255,255,0.6)', fontSize:10.5, fontWeight:700, letterSpacing:1, textTransform:'uppercase', marginBottom:6 }}>Registration Confirmed</div>
              <div style={{ color:'#fff', fontSize:19, fontWeight:900 }}>{okModal.event.title}</div>
              <div style={{ position:'absolute', bottom:-34, left:'50%', transform:'translateX(-50%)', width:68, height:68, borderRadius:'50%', background: grad(okModal.event), border:'4px solid #0f172a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, fontWeight:900, color:'#fff' }}>
                {(okModal.name || 'U')[0].toUpperCase()}
              </div>
            </div>
            <div style={{ paddingTop:46, paddingBottom:12, textAlign:'center', paddingLeft:24, paddingRight:24 }}>
              <div style={{ fontWeight:900, fontSize:17, color:'#fff' }}>{okModal.name}</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.38)', marginTop:3 }}>{okModal.email}</div>
              {okModal.position && <div style={{ fontSize:12, color:'rgba(255,255,255,0.32)', marginTop:2 }}>{okModal.position}</div>}
              {okModal.institution && <div style={{ fontSize:12, color:'rgba(255,255,255,0.32)', marginTop:2 }}>🏛 {okModal.institution}</div>}
              {okModal.phone && <div style={{ fontSize:12, color:'rgba(255,255,255,0.32)', marginTop:2 }}>📞 {okModal.phone}</div>}
            </div>
            <div style={{ padding:'0 22px 22px', display:'flex', flexDirection:'column', gap:7 }}>
              {[
                {i:'📋',l:'EVENT',v:okModal.event.title},
                {i:'📅',l:'DATE',v:okModal.event.date||'TBA'},
                {i:'📍',l:'VENUE',v:okModal.event.venue||'TBA'},
                {i:'🏛',l:'ORGANIZER',v:okModal.event.organizer},
                {i:'🎫',l:'CATEGORY',v:okModal.event.category},
                {i:'👥',l:'SEATS',v:`${okModal.event.enrolled}/${okModal.event.total} filled`},
              ].filter(r=>r.v).map(r => (
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

      {/* Filter chips + live refresh bar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:10, marginTop:4 }}>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
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
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {lastUpdated && (
            <span style={{ fontSize:11.5, color:'rgba(255,255,255,0.3)', fontWeight:500 }}>
              Updated {lastUpdated.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
            </span>
          )}
          <button onClick={() => loadEvents(true)} disabled={loading} style={{
            background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)',
            borderRadius:9, padding:'6px 13px', color:'rgba(255,255,255,0.65)',
            fontSize:12, fontWeight:700, cursor: loading ? 'default' : 'pointer',
            fontFamily:'inherit', display:'flex', alignItems:'center', gap:6,
            transition:'all .14s',
          }}
          onMouseEnter={e => { if (!loading) { e.currentTarget.style.background='rgba(255,255,255,0.12)'; e.currentTarget.style.color='#fff'; } }}
          onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.07)'; e.currentTarget.style.color='rgba(255,255,255,0.65)'; }}
          >
            <span style={{ display:'inline-block', animation: loading ? 'spin .7s linear infinite' : 'none' }}>↻</span>
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
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
      {!loading && filteredEvents.length === 0 && (
        <div style={{ textAlign:'center', padding:'40px 0', color:'rgba(255,255,255,0.28)', fontSize:14 }}>No events found.</div>
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
  const [myEnr, setMyEnr]         = useState({});
  const [detail, setDetail]       = useState(null);
  const [formModal, setFormModal] = useState(null);
  const [okModal, setOkModal]     = useState(null);
  const [errModal, setErrModal]   = useState('');
  const [submitting, setSub]      = useState(false);
  const [cancellingEnrId, setCancellingEnrId] = useState(null);
  const [cancelEnrConfirm, setCancelEnrConfirm] = useState(null); // training to cancel
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
      setErrModal(msg.toLowerCase().includes('already') ? 'already' : msg || 'Enrollment failed');
    } finally { setSub(false); }
  }

  const filtered = catFilter === 'All' ? trainings : trainings.filter(t => t.category === catFilter);

  return (
    <>
      <ErrModal err={errModal} onClose={() => setErrModal('')} />

      {/* Cancel enrollment confirmation */}
      {cancelEnrConfirm && (
        <CancelConfirmModal
          title="Cancel Enrollment?"
          subtitle={`Are you sure you want to cancel your enrollment in "${cancelEnrConfirm.title}"? Your slot will be returned to the available pool.`}
          confirming={!!cancellingEnrId}
          onConfirm={doCancelEnr}
          onCancel={() => setCancelEnrConfirm(null)}
        />
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
          <div onClick={e => e.stopPropagation()} style={{ background:'linear-gradient(180deg,#0f172a,#020817)', borderRadius:22, maxWidth:'min(480px,calc(100vw - 32px))', width:'100%', position:'relative', border:'1px solid rgba(255,255,255,0.1)', animation:'modalIn .24s cubic-bezier(.34,1.56,.64,1)', margin:'auto' }}>
            <div style={{ background: ts(formModal).accent, padding:'22px 24px 18px', position:'relative' }}>
              <button onClick={() => setFormModal(null)} style={{ position:'absolute', top:14, right:14, background:'rgba(0,0,0,0.70)', border:'2px solid rgba(255,255,255,0.5)', backdropFilter:'blur(10px)', borderRadius:'50%', width:36, height:36, color:'#fff', fontSize:16, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(6px)', boxShadow:'0 2px 8px rgba(0,0,0,0.4)' }}>✕</button>
              <div style={{ color:'rgba(255,255,255,0.65)', fontSize:10.5, fontWeight:700, letterSpacing:1, marginBottom:4 }}>PROGRAM ENROLLMENT</div>
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
          <div onClick={e => e.stopPropagation()} style={{ background:'#0f172a', borderRadius:24, maxWidth:'min(420px,calc(100vw - 32px))', width:'100%', overflow:'hidden', border:'1px solid rgba(255,255,255,0.1)', animation:'modalIn .26s cubic-bezier(.34,1.56,.64,1)' }}>
            <div style={{ background: ts(okModal.training).accent, padding:'26px 26px 48px', textAlign:'center', position:'relative' }}>
              <div style={{ color:'rgba(255,255,255,0.6)', fontSize:10.5, fontWeight:700, letterSpacing:1, textTransform:'uppercase', marginBottom:6 }}>Enrollment Confirmed</div>
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
                {i:'👥',l:'SLOTS',v:`${okModal.training.enrolled}/${okModal.training.total} enrolled`},
              ].filter(r=>r.v).map(r => (
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

      {loading && <div style={{ textAlign:'center', padding:'60px 0', color:'rgba(255,255,255,0.3)' }}><div style={{ fontSize:32, marginBottom:10 }}>⏳</div>Loading…</div>}

      {/* Category filters + refresh */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:10, marginTop:4 }}>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
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
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {lastUpdated && (
            <span style={{ fontSize:11.5, color:'rgba(255,255,255,0.3)', fontWeight:500 }}>
              Updated {lastUpdated.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
            </span>
          )}
          <button onClick={() => loadTrainings(true)} disabled={loading} style={{
            background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)',
            borderRadius:9, padding:'6px 13px', color:'rgba(255,255,255,0.65)',
            fontSize:12, fontWeight:700, cursor: loading ? 'default' : 'pointer',
            fontFamily:'inherit', display:'flex', alignItems:'center', gap:6, transition:'all .14s',
          }}
          onMouseEnter={e => { if (!loading) { e.currentTarget.style.background='rgba(255,255,255,0.12)'; e.currentTarget.style.color='#fff'; } }}
          onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.07)'; e.currentTarget.style.color='rgba(255,255,255,0.65)'; }}
          >
            <span style={{ display:'inline-block', animation: loading ? 'spin .7s linear infinite' : 'none' }}>↻</span>
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Training cards */}
      {!loading && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:18 }}>
          {filtered.map((t, idx) => (
            <TrCard key={t.id} t={t} idx={idx} enrolled={!!myEnr[t.id]} onEnroll={() => openEnroll(t)} onCancel={() => cancelEnr(t)} cancelling={cancellingEnrId === t.id} />
          ))}
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   CALENDAR TAB — Outlook calendar only, no cards below
   Shows BOTH events and training. Click bar or date = detail.
═══════════════════════════════════════════════════════════ */
function CalendarTab({ user }) {
  const [events, setEvents]     = useState([]);
  const [trainings, setTrain]   = useState([]);
  const [myRegs, setMyRegs]     = useState({});
  const [myEnr, setMyEnr]       = useState({});
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detail, setDetail]       = useState(null);
  const [dayPanel, setDayPanel]   = useState(null); // { date, items }
  const navigate = useNavigate();

  function loadData(isRefresh = false) {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    Promise.all([
      api.events.list({ limit: 1000 }),
      api.training.list({ limit: 1000 }),
    ]).then(([ev, tr]) => {
      setEvents(ev.data || []);
      setTrain(tr.data || []);
    }).catch(() => {}).finally(() => { setLoading(false); setRefreshing(false); });
  }

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (!user) return;
    api.auth.myRegistrations().then(r => {
      const m = {}; r.forEach(x => { m[x.event_id] = true; }); setMyRegs(m);
    }).catch(() => {});
    api.auth.myEnrollments().then(r => {
      const m = {}; r.forEach(x => { m[x.training_id] = true; }); setMyEnr(m);
    }).catch(() => {});
  }, [user]);

  // Combine all items for calendar
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

  function getColors(it) {
    if (it._type === 'training') {
      const s = TR_STYLES[it.category] || TR_STYLES.Technology;
      return { bg: s.calBg, border: s.calBorder, text: s.calText };
    }
    return EV_COLORS[it.category] || EV_COLORS.Summit;
  }

  // Registered/enrolled item IDs for conflict check
  const myIds = new Set([
    ...Object.keys(myRegs).map(id => +id),
    ...Object.keys(myEnr).map(id => +id),
  ]);
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

  function handleClickItem(it) { setDetail(it); setDayPanel(null); }
  // Always show day panel — even for empty dates (shows "No events" message)
  function handleClickDay(date, its) { setDayPanel({ date, items: its }); setDetail(null); }

  return (
    <>
      {/* Day panel */}
      {dayPanel && !detail && (
        <div onClick={() => setDayPanel(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:9100, display:'flex', alignItems:'flex-start', justifyContent:'flex-end', padding:20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#0d1424', border:'1px solid rgba(255,255,255,0.12)', borderRadius:20, width:380, maxHeight:'82vh', overflow:'auto', animation:'panelIn .22s ease', boxShadow:'0 24px 80px rgba(0,0,0,0.7)' }}>
            <div style={{ padding:'18px 20px 14px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ color:'rgba(255,255,255,0.4)', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.5px', marginBottom:3 }}>
                  {DAY_ABBR[dayPanel.date.getDay()]}, {MONTH_NAMES[dayPanel.date.getMonth()]} {dayPanel.date.getDate()}, {dayPanel.date.getFullYear()}
                </div>
                <div style={{ color:'#fff', fontWeight:900, fontSize:15 }}>
                  {dayPanel.items.length === 0 ? 'No events on this day' : `${dayPanel.items.length} item${dayPanel.items.length !== 1 ? 's' : ''} scheduled`}
                </div>
              </div>
              <button onClick={() => setDayPanel(null)} style={{ background:'rgba(255,255,255,0.07)', border:'none', borderRadius:'50%', width:32, height:32, color:'rgba(255,255,255,0.6)', fontSize:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
            </div>
            <div style={{ padding:'12px 14px', display:'flex', flexDirection:'column', gap:10 }}>
              {dayPanel.items.length === 0 && (
                <div style={{ textAlign:'center', padding:'24px 16px' }}>
                  <div style={{ fontSize:40, marginBottom:10 }}>📅</div>
                  <div style={{ color:'rgba(255,255,255,0.55)', fontSize:14, fontWeight:600, marginBottom:16 }}>No events or training scheduled on this date.</div>
                  <button onClick={() => { setDayPanel(null); }} style={{ background:'linear-gradient(90deg,#f97316,#e11d48)', color:'#fff', border:'none', borderRadius:10, padding:'9px 20px', fontSize:13, fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}>
                    Browse Programs →
                  </button>
                </div>
              )}
              {dayPanel.items.map(it => {
                const isEv = it._type === 'event';
                const grad  = isEv ? (EV_GRADS[it.category]||EV_GRADS.Summit) : (TR_STYLES[it.category]||TR_STYLES.Technology).accent;
                const reged = isEv ? !!myRegs[it.id] : !!myEnr[it.id];
                const full  = it.total > 0 && it.enrolled >= it.total;
                return (
                  <div key={it.id} style={{ borderRadius:13, overflow:'hidden', border:'1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ background: grad, padding:'12px 14px 10px', position:'relative', overflow:'hidden' }}>
                      <div style={{ position:'absolute', right:-4, bottom:-6, fontSize:48, opacity:0.12 }}>
                        {isEv ? (EV_ICONS[it.category]||'📅') : (TR_ICONS[it.category]||'🎓')}
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                        <span style={{ background:'rgba(255,255,255,0.2)', color:'#fff', borderRadius:5, padding:'2px 8px', fontSize:10, fontWeight:700 }}>
                          {isEv ? it.category : `🎓 ${it.category}`}
                        </span>
                        {reged && <span style={{ background:'rgba(16,185,129,0.25)', color:'#34d399', borderRadius:5, padding:'2px 8px', fontSize:10, fontWeight:700 }}>✓ {isEv?'Registered':'Enrolled'}</span>}
                        {full && !reged && <span style={{ background:'rgba(225,29,72,0.25)', color:'#f87171', borderRadius:5, padding:'2px 8px', fontSize:10, fontWeight:700 }}>Full</span>}
                      </div>
                      <div style={{ color:'#fff', fontSize:14, fontWeight:900, lineHeight:1.3 }}>{it.title}</div>
                      {isEv && <div style={{ color:'rgba(255,255,255,0.75)', fontSize:11, marginTop:3 }}>📍 {it.venue}</div>}
                      {!isEv && <div style={{ color:'rgba(255,255,255,0.75)', fontSize:11, marginTop:3 }}>⏱ {it.duration} · {it.level}</div>}
                    </div>
                    <div style={{ padding:'10px 14px', background:'rgba(15,23,42,0.9)' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                        <span style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>{isEv ? `🏛 ${it.organizer}` : `🏛 ${it.org}`}</span>
                        <span style={{ fontSize:11, color: full?'#f87171':'rgba(255,255,255,0.4)' }}>{it.enrolled}/{it.total} {isEv?'seats':'enrolled'}</span>
                      </div>
                      {!reged && !full
                        ? <button onClick={() => { setDayPanel(null); navigate(`/programs?tab=${isEv?'events':'training'}`); }} style={{ width:'100%', background: grad, color:'#fff', border:'none', borderRadius:9, padding:'9px', fontSize:13, fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}>
                            {isEv ? 'Go to Events to register →' : 'Go to Training to enroll →'}
                          </button>
                        : reged
                          ? <div style={{ textAlign:'center', padding:'9px', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.22)', borderRadius:9, color:'#34d399', fontWeight:700, fontSize:12.5 }}>✓ {isEv?'Registered':'Enrolled'}</div>
                          : <div style={{ textAlign:'center', padding:'9px', background:'rgba(225,29,72,0.08)', border:'1px solid rgba(225,29,72,0.2)', borderRadius:9, color:'#f87171', fontWeight:700, fontSize:12.5 }}>Fully Booked</div>
                      }
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Item detail panel */}
      {detail && (
        <div onClick={() => setDetail(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:9100, display:'flex', alignItems:'flex-start', justifyContent:'flex-end', padding:20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#0f172a', border:'1px solid rgba(255,255,255,0.1)', borderRadius:20, width:340, maxHeight:'80vh', overflow:'auto', animation:'panelIn .22s ease' }}>
            <div style={{ background: detail._type==='event' ? (EV_GRADS[detail.category]||EV_GRADS.Summit) : (TR_STYLES[detail.category]||TR_STYLES.Technology).accent, padding:'20px 18px 16px', position:'relative' }}>
              <button onClick={() => setDetail(null)} style={{ position:'absolute', top:12, right:12, background:'rgba(0,0,0,0.70)', border:'2px solid rgba(255,255,255,0.5)', backdropFilter:'blur(10px)', borderRadius:'50%', width:36, height:36, color:'#fff', fontSize:16, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(6px)', boxShadow:'0 2px 8px rgba(0,0,0,0.4)' }}>✕</button>
              <span style={{ background:'rgba(255,255,255,0.2)', color:'#fff', borderRadius:5, padding:'2px 9px', fontSize:10.5, fontWeight:700 }}>{detail.category}</span>
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
              <button onClick={() => { setDetail(null); navigate(`/programs?tab=${detail._type==='event'?'events':'training'}`); }} style={{ width:'100%', background:'linear-gradient(90deg,#f97316,#e11d48)', color:'#fff', border:'none', borderRadius:11, padding:'11px', fontSize:13.5, fontWeight:800, cursor:'pointer', fontFamily:'inherit', marginTop:6 }}>
                {detail._type === 'event' ? 'Register in Programs →' : 'Enroll in Programs →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign:'center', padding:'80px 0', color:'rgba(255,255,255,0.3)' }}><div style={{ fontSize:36, marginBottom:12 }}>⏳</div>Loading calendar…</div>
      ) : (
        <OutlookCal
          items={calItems}
          onClickItem={handleClickItem}
          onClickDay={handleClickDay}
          conflictIds={conflictIds}
          getColors={getColors}
          onRefresh={() => loadData(true)}
          refreshing={refreshing}
        />
      )}
    </>
  );
}
