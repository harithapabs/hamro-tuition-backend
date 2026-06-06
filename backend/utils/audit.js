async function logAction(req, { userId = null, action, target = null, metadata = {} } = {}) {
  try {
    if (!req.db?.auditLogs) return;
    await req.db.auditLogs.insert({
      userId,
      action,
      target,
      metadata,
      ip: req.ip || req.headers['x-forwarded-for'] || '',
      userAgent: (req.headers['user-agent'] || '').slice(0, 500),
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
}

module.exports = { logAction };
