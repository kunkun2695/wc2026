const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('./config/db');

async function check() {
  try {
    const res = await db.query(
      "SELECT id, team1_name, team2_name, competition_name, status, is_knockout FROM matches WHERE competition_name LIKE 'Bảng%' ORDER BY id"
    );
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

check();
