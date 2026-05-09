const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = process.env.DATABASE_URL 
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false })
  : new Pool({
      user: process.env.DB_USER || 'macbook',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'worldcup2026',
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT || 5432,
    });

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
