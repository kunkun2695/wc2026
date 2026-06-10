const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const appJsxPath = path.join(__dirname, '../src/App.jsx');

try {
  let content = fs.readFileSync(appJsxPath, 'utf8');
  
  // Tìm mẫu phiên bản dạng v1.1.0
  const match = content.match(/v(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    console.error('Không tìm thấy chuỗi version trong App.jsx');
    process.exit(1);
  }
  
  const major = parseInt(match[1], 10);
  const minor = parseInt(match[2], 10);
  const patch = parseInt(match[3], 10);
  
  const nextPatch = patch + 1;
  const oldVersion = `v${major}.${minor}.${patch}`;
  const newVersion = `v${major}.${minor}.${nextPatch}`;
  
  console.log(`Đang tự động tăng phiên bản từ ${oldVersion} lên ${newVersion}...`);
  
  // Thay thế tất cả các xuất hiện của version cũ bằng version mới
  const updatedContent = content.replace(new RegExp(oldVersion, 'g'), newVersion);
  fs.writeFileSync(appJsxPath, updatedContent, 'utf8');
  
  // Thực hiện git add để đưa file App.jsx cập nhật vào commit hiện tại
  execSync(`git add src/App.jsx`);
  console.log('Đã cập nhật và stage file App.jsx thành công.');
} catch (err) {
  console.error('Lỗi khi tự động tăng phiên bản:', err.message);
  process.exit(1);
}
