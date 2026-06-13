const { Pool } = require('pg');

const pool = process.env.DATABASE_URL 
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false })
  : new Pool({
      user: process.env.DB_USER || 'macbook',
      host: process.env.DB_HOST || 'db', // Ưu tiên 'db' cho Docker
      database: process.env.DB_NAME || 'worldcup2026',
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT || 5432,
    });

// Thiết lập múi giờ Việt Nam cho mọi kết nối trong Pool
pool.on('connect', (client) => {
  client.query("SET TIME ZONE 'Asia/Ho_Chi_Minh'").catch(err => {
    console.error('Lỗi thiết lập múi giờ Asia/Ho_Chi_Minh cho kết nối DB:', err.message);
  });
});

// Hàm query có cơ chế tự thử lại nếu mất kết nối
const query = async (text, params) => {
  try {
    return await pool.query(text, params);
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.code === '57P01') {
      console.log('🔄 Đang thử lại kết nối Database...');
      await new Promise(res => setTimeout(res, 2000));
      return await pool.query(text, params);
    }
    throw err;
  }
};

module.exports = {
  query,
  pool
};
