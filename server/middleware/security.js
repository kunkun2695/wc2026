const rateLimit = require('express-rate-limit');
const db = require('../config/db');

const bannedIpsSet = new Set();
const activeVisitorsMap = new Map();

// Cleanup inactive visitors (inactive > 15 minutes), runs every 5 minutes
setInterval(() => {
  const cutoff = Date.now() - 15 * 60 * 1000;
  for (const [ip, visitor] of activeVisitorsMap.entries()) {
    if (visitor.last_seen < cutoff) {
      activeVisitorsMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);

// Load banned IPs from DB
async function loadBannedIps() {
  try {
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'banned_ips'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      const res = await db.query('SELECT ip_address FROM banned_ips');
      bannedIpsSet.clear();
      res.rows.forEach(row => bannedIpsSet.add(row.ip_address));
      console.log(`🛡️ [Security] Loaded ${bannedIpsSet.size} banned IPs into memory.`);
    }
  } catch (err) {
    console.error('⚠️ [Security Error] Failed to load banned IPs:', err.message);
  }
}

// Automatically load on startup
setTimeout(loadBannedIps, 1500); // delay slightly to let DB initialize

// Middleware to block banned IPs
const ipBanMiddleware = (req, res, next) => {
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || req.ip;
  if (bannedIpsSet.has(ip)) {
    console.warn(`🛡️ [Security Block] Request blocked from banned IP: ${ip} for path ${req.path}`);
    return res.status(403).json({ error: 'IP của bạn đã bị cấm khỏi hệ thống do vi phạm bảo mật.' });
  }
  next();
};

// Middleware to track active visitors in memory
const activeVisitorMiddleware = (req, res, next) => {
  // Only track actual page loads and API requests, skip static assets with extensions (.js, .css, etc.)
  if (req.path.startsWith('/api') || req.path === '/' || !req.path.includes('.')) {
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || req.ip;
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const now = Date.now();

    if (activeVisitorsMap.has(ip)) {
      const visitor = activeVisitorsMap.get(ip);
      visitor.last_seen = now;
      visitor.request_count += 1;
      visitor.last_path = `${req.method} ${req.path}`;
      visitor.user_agent = userAgent;
    } else {
      activeVisitorsMap.set(ip, {
        ip_address: ip,
        first_seen: now,
        last_seen: now,
        request_count: 1,
        last_path: `${req.method} ${req.path}`,
        user_agent: userAgent
      });
    }
  }
  next();
};

const banIp = (ip) => {
  bannedIpsSet.add(ip);
};

const unbanIp = (ip) => {
  bannedIpsSet.delete(ip);
};

// Log suspicious activity helper
const logSuspiciousActivity = async (ip, type, details) => {
  try {
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'suspicious_activities'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      await db.query(
        'INSERT INTO suspicious_activities (ip_address, activity_type, details) VALUES ($1, $2, $3)',
        [ip, type, details || '']
      );
    }
  } catch (err) {
    console.error('⚠️ [Security Log Error]', err.message);
  }
};

// General API Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  message: { error: 'Quá nhiều yêu cầu từ IP của bạn. Vui lòng thử lại sau 15 phút.' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: async (req, res, next, options) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || req.ip;
    await logSuspiciousActivity(ip, 'RATE_LIMIT_EXCEEDED', `Vượt giới hạn API thông thường: ${req.method} ${req.path}`);
    res.status(options.statusCode).json(options.message);
  }
});

// Strict Limiter for Auth and Payments
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 15,
  message: { error: 'Phát hiện nhiều yêu cầu đáng ngờ. Vui lòng thử lại sau 10 phút.' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: async (req, res, next, options) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || req.ip;
    await logSuspiciousActivity(ip, 'RATE_LIMIT_EXCEEDED', `Vượt giới hạn API nhạy cảm: ${req.method} ${req.path}`);
    res.status(options.statusCode).json(options.message);
  }
});

// Helper function to escape HTML special characters
const escapeHtml = (text) => {
  if (typeof text !== 'string') return text;
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Middleware to recursively escape strings in request body
const escapeBodyData = (req, res, next) => {
  if (req.body) {
    const escapeObject = (obj) => {
      for (const key in obj) {
        if (typeof obj[key] === 'string') {
          if (
            key === 'image_url' ||
            key === 'avatar' ||
            obj[key].startsWith('data:image/') ||
            obj[key].length > 10000
          ) {
            continue;
          }
          obj[key] = escapeHtml(obj[key]);
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          escapeObject(obj[key]);
        }
      }
    };
    escapeObject(req.body);
  }
  next();
};

module.exports = {
  apiLimiter,
  authLimiter,
  escapeBodyData,
  escapeHtml,
  ipBanMiddleware,
  activeVisitorMiddleware,
  logSuspiciousActivity,
  banIp,
  unbanIp,
  loadBannedIps,
  activeVisitorsMap,
  bannedIpsSet
};
