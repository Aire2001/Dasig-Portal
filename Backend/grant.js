const { Client } = require('pg');

if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL in the environment before running this script (never commit it).');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const sql = `
  GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
  GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
  GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
`;

client.connect()
  .then(() => { console.log('Connected'); return client.query(sql); })
  .then(() => { console.log('Grants applied successfully'); return client.end(); })
  .catch(err => { console.error('Error:', err.message); client.end(); });
