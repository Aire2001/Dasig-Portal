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

const app = express();

app.use(cors({ origin: /^http:\/\/localhost(:\d+)?$/, credentials: true }));
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

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`DASIG API running on http://localhost:${PORT}`));
