const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.ewdydbelhhwszpzknjwm:3lvRLZWFnHAK8bPn@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres',
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
