function sanitize(obj) {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(sanitize);
  if (typeof obj !== 'object') return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith('$') || k.startsWith('_') || k.includes('.')) continue;
    out[k] = sanitize(v);
  }
  return out;
}

function noSqlSanitize(req, res, next) {
  if (req.body) req.body = sanitize(req.body);
  if (req.params) {
    for (const k of Object.keys(req.params)) {
      req.params[k] = String(req.params[k]);
    }
  }
  if (req.query) {
    for (const k of Object.keys(req.query)) {
      const v = req.query[k];
      if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') continue;
      delete req.query[k];
    }
  }
  next();
}

module.exports = { noSqlSanitize, sanitize };
