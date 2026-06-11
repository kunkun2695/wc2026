const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const db = require('./config/db');

const parseMatchTimeToVnDate = (timeStr) => {
  if (!timeStr) return new Date(0);
  try {
    let day, month, hour, min;
    if (timeStr.includes('/')) {
      const [datePart, timePart] = timeStr.split(' - ');
      [day, month] = datePart.split('/');
      [hour, min] = timePart.split(':');
    } else if (timeStr.includes('.')) {
      const [datePart, timePart] = timeStr.split(' - ');
      [day, month] = datePart.split('.');
      [hour, min] = timePart.split(':');
    } else {
      const parts = timeStr.split(/[\s-]/);
      const [time, d, m] = parts.filter(Boolean);
      [hour, min] = time.split(':');
      day = d;
      month = m;
    }
    const pad = (n) => String(n).padStart(2, '0');
    const isoString = `2026-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(min)}:00+07:00`;
    return new Date(isoString);
  } catch (e) {
    return new Date(0);
  }
};

async function testDates() {
  const matchesRes = await db.query("SELECT id, team1_name, team2_name, status, match_time FROM matches");
  const now = new Date();
  console.log("Current server time:", now.toISOString());
  console.log("Current server time local (VN):", new Date(now.getTime() + 7 * 60 * 60 * 1000).toISOString(), "(Offset: +7)");
  
  for (const m of matchesRes.rows) {
    const matchTime = parseMatchTimeToVnDate(m.match_time);
    const isClosed = m.status !== 'UPCOMING' || now >= matchTime;
    console.log(`Match ${m.id} (${m.team1_name} vs ${m.team2_name}): timeStr="${m.match_time}", parsedDate="${matchTime.toISOString()}", isClosed=${isClosed}`);
  }
  process.exit(0);
}

testDates();
