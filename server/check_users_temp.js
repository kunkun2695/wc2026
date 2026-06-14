const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('./config/db');

async function run() {
  try {
    const dbInfo = await db.query('SELECT current_database(), current_user');
    console.log('Connected to DB info:', dbInfo.rows[0]);
    const res = await db.query('SELECT * FROM system_config');
    console.log('Config in DB:');
    console.log(res.rows);
    process.exit(0);
  } catch (err) {
    console.error('Error running DB query:', err);
    process.exit(1);
  }
}

run();
