const NodeCache = require('node-cache');

const cache = new NodeCache({
  stdTTL: 60,
  checkperiod: 30,
  maxKeys: 500,
  useClones: false,
});

const stats = { hits: 0, misses: 0, sets: 0 };

function makeKey(req) {
  const userId = req.userId || req.user?._id || 'anon';
  return `${req.method}:${req.originalUrl}:u=${userId}`;
}

function cacheMiddleware(opts = {}) {
  const ttl = opts.ttl || 60;
  const varyByUser = opts.varyByUser || false;

  return (req, res, next) => {
    if (req.method !== 'GET') return next();
    if (req.headers['cache-control'] === 'no-cache') return next();

    const key = makeKey(req);
    const cached = cache.get(key);
    if (cached) {
      stats.hits++;
      res.set('X-Cache', 'HIT');
      res.set('X-Cache-TTL', String(cache.getTtl(key) ? Math.round((cache.getTtl(key) - Date.now()) / 1000) : 0));
      return res.status(200).json(cached);
    }

    stats.misses++;
    res.set('X-Cache', 'MISS');
    const origJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode === 200 && body) {
        cache.set(key, body, ttl);
        stats.sets++;
      }
      return origJson(body);
    };
    next();
  };
}

function invalidateByPattern(pattern) {
  const keys = cache.keys();
  const re = new RegExp(pattern);
  let count = 0;
  for (const k of keys) {
    if (re.test(k)) {
      cache.del(k);
      count++;
    }
  }
  return count;
}

function getStats() {
  return {
    ...stats,
    keys: cache.keys().length,
    hitRate: stats.hits + stats.misses > 0
      ? (stats.hits / (stats.hits + stats.misses) * 100).toFixed(1) + '%'
      : '0%'
  };
}

module.exports = { cache, cacheMiddleware, invalidateByPattern, getStats };
