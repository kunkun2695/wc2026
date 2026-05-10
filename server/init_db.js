const { execSync } = require('child_process');
const path = require('path');

async function init() {
  console.log('🚀 Bắt đầu quá trình kiểm tra và cập nhật Database...');
  
  const scripts = [
    'setup_chat.js',
    'setup_dm.js',
    // Sau này bạn có thêm bảng nào thì cứ thêm tên file vào đây
  ];

  for (const script of scripts) {
    try {
      console.log(`--- Chạy script: ${script} ---`);
      execSync(`node ${path.join(__dirname, script)}`, { stdio: 'inherit' });
    } catch (err) {
      console.warn(`⚠️ Cảnh báo: Script ${script} có thể đã chạy trước đó hoặc có lỗi nhỏ (không sao).`);
    }
  }

  console.log('✅ Hoàn tất kiểm tra Database.');
  process.exit(0);
}

init();
