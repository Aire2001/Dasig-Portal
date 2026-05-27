const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const sql = fs.readFileSync(path.join(__dirname, 'supabase-migration.sql'), 'utf8');
const REF = 'ewdydbelhhwszpzknjwm';
const PASS = '3lvRLZWFnHAK8bPn';

const attempts = [
  `postgresql://postgres.${REF}:${PASS}@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres`,
  `postgresql://postgres.${REF}:${PASS}@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres`,
];

(async () => {
  for (const cs of attempts) {
    const label = cs.replace(PASS, '***').split('@')[1];
    const client = new Client({ connectionString: cs, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000 });
    try {
      process.stdout.write(`Trying ${label}... `);
      await client.connect();
      console.log('Connected!');
      await client.query(sql);
      console.log('Migration complete.');
      await client.end();
      process.exit(0);
    } catch (err) {
      console.log(`Failed: ${err.message}`);
      try { await client.end(); } catch {}
    }
  }
  console.log('\nAll attempts exhausted.');
  console.log('Please get the exact connection string from:');
  console.log('Supabase Dashboard -> Settings -> Database -> Connection string -> URI');
})();
