# Code Refactoring Evidence — DASIG Portal
**Course:** IT411 Capstone & Research 2 | CIT-University  
**Team Code:** `2627-sem1-it411-40` | Group 40 (Section G6)  
**System:** Digital Alliance for Sustainable Innovation and Growth (DASIG) Portal  
**Repository:** [https://github.com/Aire2001/Dasig-Portal](https://github.com/Aire2001/Dasig-Portal)

---

## 1. Summary of Significant Code Refactoring

During the development and testing cycles, multiple critical refactoring initiatives were undertaken to transition the application from an initial prototype to a robust, fault-tolerant, and secure enterprise-grade platform. The following table highlights the core improvements backed by git commits:

| Refactoring Area | Git Commit | Subsystem / File | Before Refactoring | After Refactoring |
| :--- | :--- | :--- | :--- | :--- |
| **Server Crash Protection (INC-01)** | `52abb59`, `83c632c` | `Backend/src/server.js`, `Backend/src/routes/chatbot.js` | Missing error handlers and helper functions in chatbot route led to unhandled promise rejections that terminated the entire Node.js server. | Implemented centralized `process.on('unhandledRejection')` trap, restored missing helper functions (`detectMonthQuery`, `MULTI_FOLLOWUPS`), and encapsulated async handlers in try-catch blocks. |
| **NLP Intent Disambiguation Engine (INC-11)** | `6ff5a61`, `24ea4a1`, `e3c8e1c` | `Backend/src/lib/intentMatcher.js`, `frontend/src/lib/haribonEngine.js` | Chatbot used naive substring matching. A query mentioning a place or university falsely triggered event database lookups or fallback errors. | Extracted intent logic into an independent tokenized, stemmed matcher module with phrase-boundary checks and weighted scoring. |
| **Real Health Telemetry & DB Probe** | `328c523` | `Backend/src/server.js`, `frontend/src/pages/AdminPage.jsx`, `frontend/src/api.js` | Admin dashboard rendered hardcoded static latency (`· 18ms`) and static "100% Ready" indicators. | Replaced static strings with real live round-trip PostgreSQL database probes via `/api/health`, measuring actual latency and server uptime dynamically. |
| **Mobile UX & Responsive Fluid Grids** | `068d85b`, `a930703` | `frontend/src/components/Chatbot.jsx`, `frontend/src/pages/AdminPage.jsx` | Fixed absolute coordinates caused header badges ("High-IQ", user avatar) to overlap on mobile viewports (< 480px). | Replaced absolute layout with fluid flexbox, added 44px minimum touch targets, dynamic mobile calculation (`max-width: calc(100vw - 16px)`), and a responsive slide-out admin drawer. |
| **Official SRS Acronym Alignment** | `4609d68`, `f57bde6`, `328c523` | `frontend/src/components/Footer.jsx`, `haribonEngine.js`, `MembershipPage.jsx` | Inconsistent naming across components (e.g. "Dynamic Alliance for Science, Innovation & Governance"). | Synchronized all components to the official SRS acronym: *"Digital Alliance for Sustainable Innovation and Growth"*. |
| **Email Deliverability & QR Verification** | `eba7854` | `Backend/src/lib/mailer.js`, `Backend/src/routes/events.js` | Raw HTML emails without MIME headers were flagged by spam filters; attendee check-in lacked QR cryptographic check. | Added RFC-compliant MIME headers, DKIM/SPF-friendly envelope formatting, and automated QR code generation with high error-correction levels (`M`). |

---

## 2. Before-and-After Code Comparisons

### Refactoring 1: Server Crash Protection (INC-01)
**File:** `Backend/src/server.js`

#### Before:
```javascript
// Express application without process-level async rejection trap
app.use('/api/chatbot', chatbotRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
// When an async handler threw an error outside a middleware catch block,
// Node.js v16+ emitted unhandledRejection and crashed the process immediately.
```

#### After:
```javascript
// Robust production process guard
app.use('/api/chatbot', chatbotRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Safety net: log async errors that escape a route instead of letting
// Node terminate the whole API process on an unhandled promise rejection.
process.on('unhandledRejection', (reason) => {
  console.error('[server] Unhandled promise rejection:', reason && reason.stack ? reason.stack : reason);
});
```

---

### Refactoring 2: Real Database Telemetry (Replacing Fake Static Metrics)
**Files:** `Backend/src/server.js` and `frontend/src/pages/AdminPage.jsx`

#### Before:
```javascript
// Backend:
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Frontend (AdminPage.jsx):
<div className="ap-system-health">
  <span className="ap-health-dot" />
  <span>Live Node VII</span>
  <span style={{ opacity: 0.65, fontSize: 10.5 }}>· 18ms</span> {/* Fake hardcoded */}
</div>
```

#### After:
```javascript
// Backend: Real round-trip database query measuring Supabase PostgreSQL ping
app.get('/api/health', async (req, res) => {
  const start = Date.now();
  try {
    const { count, error } = await supabase.from('users').select('id', { count: 'exact', head: true });
    const latency = Date.now() - start;
    if (error) {
      return res.status(503).json({ status: 'degraded', dbStatus: 'error', dbLatencyMs: latency });
    }
    return res.json({ status: 'ok', dbStatus: 'connected', dbLatencyMs: latency, uptimeSec: Math.floor((Date.now() - serverStartTime) / 1000) });
  } catch (err) {
    return res.status(503).json({ status: 'error', dbStatus: 'unreachable', error: err.message });
  }
});

// Frontend: Dynamic telemetry polling
const [telemetry, setTelemetry] = useState({ latency: null, status: 'checking', dbStatus: 'checking' });
useEffect(() => {
  async function probe() {
    const t0 = performance.now();
    try {
      const res = await api.health();
      setTelemetry({ latency: Math.round(performance.now() - t0), status: res.status, dbStatus: res.dbStatus });
    } catch {
      setTelemetry({ latency: null, status: 'offline', dbStatus: 'unreachable' });
    }
  }
  probe();
  const timer = setInterval(probe, 25000);
  return () => clearInterval(timer);
}, []);

// Dynamic top bar badge:
<span style={{ opacity: 0.65, fontSize: 10.5 }}>
  · {telemetry.latency !== null ? `${telemetry.latency}ms` : 'Offline'}
</span>
```

---

### Refactoring 3: Chatbot Mobile Header Overlap Fix
**File:** `frontend/src/components/Chatbot.jsx`

#### Before:
```jsx
{/* Absolute floating badge caused collision with user avatar & buttons */}
<div style={{ position: 'absolute', top: 8, right: 90 }}>
  <span className="high-iq-badge">🧠 High-IQ</span>
</div>
<div style={{ display: 'flex', alignItems: 'center' }}>
  <img src={user.avatar} />
  <span>{user.role}</span>
</div>
```

#### After:
```jsx
{/* Fluid layout with clean right-aligned badge grouping */}
<div style={{
  background: 'linear-gradient(135deg,#001233,#0f2d6b 55%,#1e40af)',
  padding: '11px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  position: 'relative', overflow: 'hidden', flexShrink: 0,
  borderBottom: '1px solid rgba(255,255,255,0.08)',
}}>
  {/* Left: Haribon Identity */}
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
    <HaribonFace size={36} />
    <div style={{ minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: '#fff', fontWeight: 900, fontSize: 13.5 }}>Haribon AI</span>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
      </div>
      <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 10.5 }}>Trilingual AI · Eng / Bis / Tag</div>
    </div>
  </div>

  {/* Right: User Status & Actions */}
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
    {user && (
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: rb.bg, borderRadius: 20, padding: '2px 8px 2px 3px' }}>
        <img src={user.avatar_url} style={{ width: 19, height: 19, borderRadius: '50%' }} />
        <span style={{ color: rb.color, fontSize: 9.5, fontWeight: 800 }}>{rb.label}</span>
      </div>
    )}
    <button className="full-btn" onClick={goToFull}>Full ↗</button>
    <button className="close-btn" onClick={() => setOpen(false)}>✕</button>
  </div>
</div>
```

