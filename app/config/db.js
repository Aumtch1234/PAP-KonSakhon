import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

let pool;

if (process.env.SKIP_DB_INIT === 'true' || !process.env.DATABASE_URL) {
  console.log('⚠️  Database initialization skipped');
  pool = null;
} else {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  pool.connect()
    .then(() => console.log('✅ PostgreSQL connected successfully'))
    .catch(err => console.error('❌ PostgreSQL connection error:', err));
}

export default pool;