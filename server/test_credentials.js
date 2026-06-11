const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const db = require('./config/db');

async function getCredentials() {
  try {
    const users = await db.query(`SELECT id, username, password FROM users`);
    console.log("USERS AND PASSWORDS:");
    console.log(JSON.stringify(users.rows, null, 2));
  } catch (err) {
    console.error("DB QUERY ERROR:", err.message);
  }
  process.exit(0);
}

getCredentials();
