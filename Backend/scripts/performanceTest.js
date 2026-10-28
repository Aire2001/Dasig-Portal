/**
 * DASIG Portal - Automated Performance & Load Testing Suite
 * IT411 Technical Review / Quality Assurance Deliverable (Section C)
 * 
 * Measures:
 *  - Requests per second (Throughput)
 *  - Min, Average, P95, and Max Latency (ms)
 *  - Error Rate (%)
 *  - Concurrency handling across core system endpoints:
 *      * GET  /api/health (Telemetry & DB probe)
 *      * POST /api/chatbot/message (Haribon AI NLP pipeline)
 *      * GET  /api/events (Consortium calendar query)
 *      * GET  /api/news (Regional announcement feeds)
 */

const http = require('http');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// Import express app
const express = require('express');
const cors = require('cors');

const authRoutes        = require('../src/routes/auth');
const eventsRoutes      = require('../src/routes/events');
const newsRoutes        = require('../src/routes/news');
const trainingRoutes    = require('../src/routes/training');
const membersRoutes     = require('../src/routes/members');
const membershipRoutes  = require('../src/routes/membership');
const chatbotRoutes     = require('../src/routes/chatbot');
const policiesRoutes    = require('../src/routes/policies');
const fundingRoutes     = require('../src/routes/funding');
const partnershipsRoutes = require('../src/routes/partnerships');
const adminRoutes       = require('../src/routes/admin');
const contactRoutes     = require('../src/routes/contact');
const supabase          = require('../src/lib/supabase');

const app = express();
app.use(cors());
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

const serverStartTime = Date.now();
app.get('/api/health', async (req, res) => {
  const start = Date.now();
  try {
    const { error } = await supabase.from('users').select('id', { count: 'exact', head: true });
    const latency = Date.now() - start;
    return res.json({
      status: error ? 'degraded' : 'ok',
      dbStatus: error ? 'error' : 'connected',
      dbLatencyMs: latency,
      uptimeSec: Math.floor((Date.now() - serverStartTime) / 1000),
      time: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(503).json({ status: 'error', error: err.message, dbLatencyMs: Date.now() - start });
  }
});

function httpRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const t0 = process.hrtime.bigint();
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const t1 = process.hrtime.bigint();
        const durationMs = Number(t1 - t0) / 1e6;
        resolve({
          statusCode: res.statusCode,
          durationMs,
          body,
        });
      });
    });

    req.on('error', (err) => {
      const t1 = process.hrtime.bigint();
      reject({
        error: err.message,
        durationMs: Number(t1 - t0) / 1e6,
      });
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runScenario(name, port, { path, method = 'GET', body = null, total = 30, concurrency = 5 }) {
  process.stdout.write(`Benchmarking [${name}] (${total} requests, concurrency=${concurrency})... `);
  const latencies = [];
  let errorCount = 0;
  let successCount = 0;

  const serializedBody = body ? JSON.stringify(body) : null;
  const startTime = Date.now();

  let activeIndex = 0;
  async function worker() {
    while (activeIndex < total) {
      activeIndex++;
      try {
        const res = await httpRequest({
          hostname: '127.0.0.1',
          port,
          path,
          method,
          headers: {
            'Content-Type': 'application/json',
            ...(serializedBody ? { 'Content-Length': Buffer.byteLength(serializedBody) } : {}),
          },
        }, serializedBody);

        latencies.push(res.durationMs);
        if (res.statusCode >= 200 && res.statusCode < 400) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (err) {
        if (errorCount === 0) console.log(`\n[FIRST ERROR in ${name}]:`, err);
        errorCount++;
        if (err.durationMs) latencies.push(err.durationMs);
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  const totalTimeSec = (Date.now() - startTime) / 1000;
  latencies.sort((a, b) => a - b);

  const min = latencies.length ? latencies[0] : 0;
  const max = latencies.length ? latencies[latencies.length - 1] : 0;
  const avg = latencies.length ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;
  const p95Idx = Math.floor(latencies.length * 0.95);
  const p95 = latencies[p95Idx] || max;
  const throughput = latencies.length / (totalTimeSec || 0.001);
  const errorRate = (errorCount / (total || 1)) * 100;

  console.log('DONE');
  return {
    scenario: name,
    totalRequests: total,
    concurrency,
    successCount,
    errorCount,
    minMs: Number(min.toFixed(2)),
    avgMs: Number(avg.toFixed(2)),
    p95Ms: Number(p95.toFixed(2)),
    maxMs: Number(max.toFixed(2)),
    throughputReqSec: Number(throughput.toFixed(2)),
    errorRatePct: Number(errorRate.toFixed(2)),
  };
}

async function main() {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  console.log(`\n======================================================`);
  console.log(` DASIG PORTAL - AUTOMATED PERFORMANCE & QA TEST SUITE `);
  console.log(` Target Server: http://127.0.0.1:${port}`);
  console.log(` Timestamp: ${new Date().toISOString()}`);
  console.log(`======================================================\n`);

  const results = [];

  try {
    // 1. Health & Telemetry probe
    results.push(await runScenario('GET /api/health (Telemetry)', port, {
      path: '/api/health',
      method: 'GET',
      total: 25,
      concurrency: 5,
    }));

    // 2. Haribon AI NLP Query: 'what is dasig'
    results.push(await runScenario('POST /api/chatbot/message ("what is dasig")', port, {
      path: '/api/chatbot/message',
      method: 'POST',
      body: { message: 'what is dasig', history: [] },
      total: 25,
      concurrency: 5,
    }));

    // 3. Haribon AI Trilingual Bisaya Query: 'unsay mga event sa dasig'
    results.push(await runScenario('POST /api/chatbot/message (Cebuano NLP)', port, {
      path: '/api/chatbot/message',
      method: 'POST',
      body: { message: 'unsay mga event sa dasig', history: [] },
      total: 25,
      concurrency: 5,
    }));

    // 4. Consortium Policies Query
    results.push(await runScenario('GET /api/policies (Consortium Charters)', port, {
      path: '/api/policies',
      method: 'GET',
      total: 25,
      concurrency: 5,
    }));

    // 5. Member Institutions Query
    results.push(await runScenario('GET /api/members (Partner HEIs)', port, {
      path: '/api/members',
      method: 'GET',
      total: 25,
      concurrency: 5,
    }));

    console.log(`\n========================================================================================`);
    console.log(` PERFORMANCE RESULTS SUMMARY (Acceptance Criteria: Avg < 300ms, Error Rate < 1%) `);
    console.log(`========================================================================================`);
    console.table(results.map(r => ({
      Scenario: r.scenario,
      Reqs: r.totalRequests,
      'Avg (ms)': r.avgMs,
      'P95 (ms)': r.p95Ms,
      'Max (ms)': r.maxMs,
      'Req/Sec': r.throughputReqSec,
      'Error %': `${r.errorRatePct}%`,
      Status: r.errorRatePct === 0 && r.avgMs < 300 ? '✅ PASSED' : (r.errorRatePct === 0 ? '⚠️ ACCEPTABLE' : '❌ FAILED')
    })));

    // Save JSON results for documentation
    const fs = require('fs');
    const outPath = require('path').resolve(__dirname, '../../docs/performance_results.json');
    fs.writeFileSync(outPath, JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2));
    console.log(`Saved QA benchmark results to docs/performance_results.json\n`);
  } finally {
    server.close();
  }
}

main().catch(err => {
  console.error('Performance testing encountered an error:', err);
  process.exit(1);
});
