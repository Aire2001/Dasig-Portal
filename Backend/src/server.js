require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes        = require('./routes/auth');
const eventsRoutes      = require('./routes/events');
const newsRoutes        = require('./routes/news');
const trainingRoutes    = require('./routes/training');
const membersRoutes     = require('./routes/members');
const membershipRoutes  = require('./routes/membership');
const chatbotRoutes     = require('./routes/chatbot');
const policiesRoutes    = require('./routes/policies');
const fundingRoutes     = require('./routes/funding');
const partnershipsRoutes = require('./routes/partnerships');
const adminRoutes       = require('./routes/admin');
const contactRoutes     = require('./routes/contact');
const supabase          = require('./lib/supabase');

const serverStartTime = Date.now();

const app = express();

// Production-ready permissive CORS allowing localhost, Vercel, Netlify, Render, and custom client domains
app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server, mobile, curl, or any browser origin
    callback(null, true);
  },
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth',         authRoutes);
app.use('/api/events',       eventsRoutes);
app.use('/api/news',         newsRoutes);
app.use('/api/training',     trainingRoutes);
app.use('/api/members',      membersRoutes);
app.use('/api/membership',   membershipRoutes);
app.use('/api/chatbot',      chatbotRoutes);
app.use('/api/policies',     policiesRoutes);
app.use('/api/funding',      fundingRoutes);
app.use('/api/partnerships', partnershipsRoutes);
app.use('/api/admin',        adminRoutes);
app.use('/api/contact',      contactRoutes);

app.get('/', (req, res) => res.json({
  name: 'DASIG Portal API',
  version: '1.0.0',
  status: 'running',
  docs: 'Use /api/* endpoints to interact with the API',
  endpoints: [
    'GET  /api/health',
    'POST /api/auth/login',
    'POST /api/auth/register',
    'GET  /api/auth/me',
    'GET  /api/events',
    'GET  /api/news',
    'GET  /api/training',
    'GET  /api/members',
    'GET  /api/funding',
    'GET  /api/policies',
    'GET  /api/partnerships',
    'POST /api/chatbot/message',
  ],
}));

app.get('/api/health', async (req, res) => {
  const start = Date.now();
  try {
    const { count, error } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true });

    const latency = Date.now() - start;
    if (error) {
      return res.status(503).json({
        status: 'degraded',
        dbStatus: 'error',
        error: error.message,
        dbLatencyMs: latency,
        uptimeSec: Math.floor((Date.now() - serverStartTime) / 1000),
        time: new Date().toISOString(),
      });
    }

    return res.json({
      status: 'ok',
      dbStatus: 'connected',
      dbLatencyMs: latency,
      uptimeSec: Math.floor((Date.now() - serverStartTime) / 1000),
      time: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(503).json({
      status: 'error',
      dbStatus: 'unreachable',
      error: err.message,
      dbLatencyMs: Date.now() - start,
      uptimeSec: Math.floor((Date.now() - serverStartTime) / 1000),
      time: new Date().toISOString(),
    });
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Safety net (INC-01): log async errors that escape a route instead of letting
// Node terminate the whole API on an unhandled promise rejection.
process.on('unhandledRejection', (reason) => {
  console.error('[server] Unhandled promise rejection:', reason && reason.stack ? reason.stack : reason);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`DASIG API running on http://localhost:${PORT}`));
