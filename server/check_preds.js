const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const db = require('./config/db');
async function test() {
  try {
    const matchesRes = await db.query("SELECT id, team1_name, team2_name, status, match_time FROM matches LIMIT 15");
    console.log("MATCHES:", JSON.stringify(matchesRes.rows, null, 2));
  } catch (err) {
    console.error("ERROR:", err.message);
  }
  process.exit(0);
}
test();
