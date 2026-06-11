const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const db = require('./config/db');

async function listMatches() {
  try {
    const matches = await db.query('SELECT id, team1_name, team2_name FROM matches ORDER BY id');
    console.log("MATCHES IN DATABASE:");
    console.log(JSON.stringify(matches.rows, null, 2));
  } catch (err) {
    console.error("DB QUERY ERROR:", err.message);
  }
  process.exit(0);
}

listMatches();
