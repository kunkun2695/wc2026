const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET || 'worldcup2026-secret-key';

const authenticateUser = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Unauthorized' });
  }
};

module.exports = { authenticateUser };
