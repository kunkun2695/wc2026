const db = require('./config/db');

async function debug() {
  try {
    const matchesCols = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'matches'");
    console.log('--- Cột trong bảng MATCHES ---');
    console.log(matchesCols.rows.map(r => r.column_name).join(', '));

    const predCols = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'predictions'");
    console.log('\n--- Cột trong bảng PREDICTIONS ---');
    console.log(predCols.rows.map(r => r.column_name).join(', '));

    const sample = await db.query("SELECT * FROM matches LIMIT 1");
    console.log('\n--- Dữ liệu mẫu 1 trận ---');
    console.log(sample.rows[0]);

    process.exit(0);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

debug();
