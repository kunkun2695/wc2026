const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const db = require('./config/db');

async function listTeams() {
  try {
    const teams = await db.query('SELECT name FROM teams ORDER BY name');
    console.log("TEAMS IN DATABASE:");
    console.log(teams.rows.map(r => r.name));
  } catch (err) {
    console.error("DB QUERY ERROR:", err.message);
  }
  process.exit(0);
}

listTeams();
