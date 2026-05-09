const db = require('./config/db');

async function migrate() {
  try {
    console.log('--- Đang bắt đầu nâng cấp Database ---');
    await db.query('ALTER TABLE users ALTER COLUMN avatar TYPE TEXT;');
    console.log('✅ Thành công: Cột avatar đã được chuyển sang kiểu TEXT để lưu ảnh.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
    process.exit(1);
  }
}

migrate();
