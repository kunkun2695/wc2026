const db = require('./config/db');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkPushTables() {
  try {
    const tables = await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log('--- Tables in DB ---');
    console.log(tables.rows.map(r => r.table_name).join(', '));

    const pushSubExists = tables.rows.some(r => r.table_name === 'push_subscriptions');
    const notifExists = tables.rows.some(r => r.table_name === 'notifications');

    if (pushSubExists) {
      const count = await db.query("SELECT COUNT(*) FROM push_subscriptions");
      console.log(`\npush_subscriptions count: ${count.rows[0].count}`);
    } else {
      console.log('\npush_subscriptions table does NOT exist!');
    }

    if (notifExists) {
      const count = await db.query("SELECT COUNT(*) FROM notifications");
      console.log(`notifications count: ${count.rows[0].count}`);
    } else {
      console.log('notifications table does NOT exist!');
    }

    process.exit(0);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

checkPushTables();
