const db = require('./config/db');

async function finalFix() {
  try {
    console.log('Đang đồng bộ hóa Database...');
    
    // 1. Thêm cột avatar
    await db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT DEFAULT '👤'");
    
    // 2. Thêm cột points cho predictions
    await db.query("ALTER TABLE predictions ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0");

    console.log('✅ DATABASE ĐÃ ĐƯỢC SỬA LỖI THÀNH CÔNG!');
  } catch (err) {
    console.error('❌ LỖI KHI SỬA DATABASE:', err.message);
  } finally {
    process.exit();
  }
}

finalFix();
