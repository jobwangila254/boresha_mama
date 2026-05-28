const db = require('../config/database');

async function auditLog({ userId, action, resourceType, resourceId, details, ipAddress, userAgent }) {
  try {
    await db.query(
      `INSERT INTO audit_log (user_id, action, resource_type, resource_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, action, resourceType, resourceId, details ? JSON.stringify(details) : null, ipAddress, userAgent]
    );
  } catch (err) {
    // Silently fail — audit logging should never break the main flow
    console.error('Audit log write failed:', err.message);
  }
}

function audit(action, resourceType) {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = function (body) {
      if (res.statusCode < 400) {
        const resourceId = req.params.id || body?.id || null;
        auditLog({
          userId: req.user?.id,
          action,
          resourceType,
          resourceId,
          details: { method: req.method, path: req.originalUrl },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });
      }
      return originalJson(body);
    };
    next();
  };
}

module.exports = { auditLog, audit };
