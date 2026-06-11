const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const db = require('./config/db');
const { syncMatches } = require('./services/syncService');

async function verifySyncTranslation() {
  try {
    console.log("1. Resetting matches table and seeding Mexico vs Nam Phi...");
    await db.query('DELETE FROM predictions');
    await db.query('DELETE FROM comments');
    await db.query('DELETE FROM notifications');
    await db.query('DELETE FROM matches');
    
    // Seed the match using the Vietnamese name "Nam Phi"
    await db.query(`
      INSERT INTO matches (team1_name, team1_flag, team2_name, team2_flag, match_time, group_name, status, team1_score, team2_score, competition_name)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, ['Mexico', '🇲🇽', 'Nam Phi', '🇿🇦', '12/06 - 02:00', 'A', 'UPCOMING', 0, 0, 'Bảng A']);
    
    const countBefore = await db.query('SELECT COUNT(*) FROM matches');
    console.log("Matches count before sync:", countBefore.rows[0].count);
    
    console.log("2. Running syncMatches()...");
    await syncMatches();
    
    console.log("3. Verifying database matches and team entries...");
    const matchesRes = await db.query('SELECT id, team1_name, team2_name, status, match_time FROM matches');
    console.log("Matches in database after sync:", matchesRes.rows.length);
    console.log(JSON.stringify(matchesRes.rows, null, 2));
    
    const teamsRes = await db.query('SELECT name FROM teams WHERE name = $1 OR name = $2', ['Nam Phi', 'South Africa']);
    console.log("Teams found in database:", teamsRes.rows.map(r => r.name));
    
    if (matchesRes.rows.length === 1 && matchesRes.rows[0].team2_name === 'Nam Phi') {
      console.log("✅ SUCCESS: The match was updated in-place and translated to Nam Phi! No duplicates created.");
    } else {
      console.error("❌ FAILURE: Duplication or translation error!");
    }
  } catch (err) {
    console.error("Verification error:", err.message);
  }
  process.exit(0);
}

verifySyncTranslation();
