const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'worldcup2026-secret-key';

const bannedIpsSet = new Set();
const whitelistedIpsSet = new Set(); // IPs được miễn trừ hoàn toàn (không chặn, không rate limit)
const activeVisitorsMap = new Map();

/**
 * Normalize an IP address:
 * - Strips the IPv6-mapped IPv4 prefix "::ffff:" so LAN addresses like
 *   "::ffff:192.168.1.5" are stored/compared as "192.168.1.5".
 * - Converts the IPv6 loopback "::1" to "127.0.0.1".
 */
const normalizeIp = (raw) => {
  if (!raw) return 'unknown';
  let ip = raw.trim();
  // Handle comma-separated list from x-forwarded-for
  if (ip.includes(',')) ip = ip.split(',')[0].trim();
  // IPv6-mapped IPv4: ::ffff:192.168.x.x
  if (ip.startsWith('::ffff:')) ip = ip.slice(7);
  // IPv6 loopback → standard localhost
  if (ip === '::1') ip = '127.0.0.1';
  return ip;
};

/**
 * Extract and normalize the real client IP from a request.
 * Checks (in order): x-forwarded-for, x-real-ip, socket.remoteAddress, req.ip
 */
const getClientIp = (req) => {
  const raw =
    req.headers['x-forwarded-for'] ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    req.ip ||
    'unknown';
  return normalizeIp(raw);
};

// Cleanup inactive visitors (inactive > 15 minutes), runs every 5 minutes
setInterval(() => {
  const cutoff = Date.now() - 15 * 60 * 1000;
  for (const [ip, visitor] of activeVisitorsMap.entries()) {
    if (visitor.last_seen < cutoff) {
      activeVisitorsMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);

/**
 * Check if the incoming request carries a valid Admin JWT.
 * Returns true → bypass ban & rate limit for admin accounts from any IP.
 */
const isAdminToken = (req) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded?.role === 'admin';
  } catch {
    return false; // Invalid/expired token → treat as normal user
  }
};

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

// Load whitelisted IPs from DB
async function loadWhitelistedIps() {
  try {
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'whitelisted_ips'
      );
    `);
    if (tableCheck.rows[0].exists) {
      const res = await db.query('SELECT ip_address FROM whitelisted_ips');
      whitelistedIpsSet.clear();
      res.rows.forEach(row => whitelistedIpsSet.add(row.ip_address));
      console.log(`✅ [Security] Loaded ${whitelistedIpsSet.size} whitelisted IPs into memory.`);
    } else {
      // Tự động tạo bảng nếu chưa có
      await db.query(`
        CREATE TABLE IF NOT EXISTS whitelisted_ips (
          id          SERIAL PRIMARY KEY,
          ip_address  VARCHAR(45) NOT NULL UNIQUE,
          reason      TEXT,
          added_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('✅ [Security] Đã tạo bảng whitelisted_ips.');
    }
  } catch (err) {
    console.error('⚠️ [Security Error] Failed to load whitelisted IPs:', err.message);
  }
}

// Automatically load on startup
setTimeout(loadBannedIps, 1500); // delay slightly to let DB initialize
setTimeout(loadWhitelistedIps, 2000);

// Middleware to block banned IPs (priority: Admin token > Whitelist > Ban check)
const ipBanMiddleware = (req, res, next) => {
  // 1. Admin token → luôn cho qua dù IP nào
  if (isAdminToken(req)) return next();
  const ip = getClientIp(req);
  // 2. IP nằm trong whitelist → cho qua
  if (whitelistedIpsSet.has(ip)) return next();
  // 3. IP bị ban → chặn
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
    const ip = getClientIp(req);
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
  whitelistedIpsSet.delete(ip); // Nếu ban thì tự động xóa khỏi whitelist
};

const unbanIp = (ip) => {
  bannedIpsSet.delete(ip);
};

const addToWhitelist = (ip) => {
  whitelistedIpsSet.add(ip);
  bannedIpsSet.delete(ip); // Whitelist tự động gỡ ban nếu đang bị chặn
};

const removeFromWhitelist = (ip) => {
  whitelistedIpsSet.delete(ip);
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

// IPs exempt from rate limiting (localhost + private LAN ranges)
const isInternalIp = (ip) => {
  if (!ip || ip === 'unknown') return false;
  if (ip === '127.0.0.1' || ip === 'localhost' || ip === '::1') return true;
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  const [a, b] = parts.map(Number);
  return (
    a === 10 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
};

// General API Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  skip: (req) => {
    if (isAdminToken(req)) return true; // Admin luôn được bỏ qua rate limit
    const ip = getClientIp(req);
    return isInternalIp(ip) || whitelistedIpsSet.has(ip);
  },
  message: { error: 'Quá nhiều yêu cầu từ IP của bạn. Vui lòng thử lại sau 15 phút.' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: async (req, res, next, options) => {
    const ip = getClientIp(req);
    await logSuspiciousActivity(ip, 'RATE_LIMIT_EXCEEDED', `Vượt giới hạn API thông thường: ${req.method} ${req.path}`);
    res.status(options.statusCode).json(options.message);
  }
});

// Strict Limiter for Auth and Payments
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 15,
  skip: (req) => {
    if (isAdminToken(req)) return true; // Admin luôn được bỏ qua rate limit
    const ip = getClientIp(req);
    return isInternalIp(ip) || whitelistedIpsSet.has(ip);
  },
  message: { error: 'Phát hiện nhiều yêu cầu đáng ngờ. Vui lòng thử lại sau 10 phút.' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: async (req, res, next, options) => {
    const ip = getClientIp(req);
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
  addToWhitelist,
  removeFromWhitelist,
  loadBannedIps,
  loadWhitelistedIps,
  activeVisitorsMap,
  bannedIpsSet,
  whitelistedIpsSet,
  normalizeIp,
  getClientIp
};
