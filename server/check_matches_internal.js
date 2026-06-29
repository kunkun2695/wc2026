const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('./config/db');

async function check() {
  try {
    const res = await db.query("SELECT status, count(*) FROM matches WHERE is_knockout = false GROUP BY status");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

check();
