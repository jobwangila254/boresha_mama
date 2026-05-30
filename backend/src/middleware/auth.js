const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../config/logger');
const db = require('../config/database');

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    const result = await db.query(
      'SELECT id, role, is_active FROM users WHERE id = $1',
      [decoded.id]
    );
    if (result.rows.length === 0) {
      logger.warn(`Authenticate: user ${decoded.id} not found in DB`);
      return res.status(401).json({ error: 'User no longer exists.' });
    }
    if (!result.rows[0].is_active) {
      logger.warn(`Authenticate: user ${decoded.id} is deactivated`);
      return res.status(403).json({ error: 'Account is deactivated.' });
    }
    req.user = { id: decoded.id, role: result.rows[0].role };
    next();
  } catch (err) {
    logger.warn('Invalid token attempt:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }
    next();
  };
}

module.exports = { authenticate, authorize };
