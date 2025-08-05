import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@shared/schema';

console.log('=== DB CONNECTION DEBUG ===');
console.log('DATABASE_URL:', process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 10000,
});

// Test database connection on startup
pool.connect()
  .then(client => {
    console.log('✅ PostgreSQL connected successfully');
    return client.query('SELECT NOW()');
  })
  .then(result => {
    console.log('✅ Database query test:', result.rows[0]);
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
  });

export const db = drizzle(pool, { schema });
export { pool };