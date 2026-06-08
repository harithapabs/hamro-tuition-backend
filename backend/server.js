const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');

dotenv.config();

const db = require('./config/db');
const { cookieParserMiddleware, newCsrfToken, setCsrfCookie } = require('./middleware/auth');

if (process.env.SENTRY_DSN) {
  try {
    const Sentry = require('@sentry/node');
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: 0.2
    });
  } catch (e) { console.warn('Sentry init failed:', e.message); }
}

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret.length < 32) {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: JWT_SECRET must be at least 32 characters in production');
    process.exit(1);
  } else {
    console.warn('WARNING: JWT_SECRET is missing or weak. Using a random fallback for dev only.');
  }
}
const effectiveSecret = jwtSecret && jwtSecret.length >= 32
  ? jwtSecret
  : (process.env.JWT_SECRET = crypto.randomBytes(48).toString('hex'));

const app = express();

if (process.env.SENTRY_DSN) {
  try { app.use(require('@sentry/node').Handlers.requestHandler()); } catch {}
}

app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      'img-src': ["'self'", 'data:', 'blob:', 'https:'],
      'media-src': ["'self'", 'blob:', 'https:'],
      'script-src': ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdnjs.cloudflare.com'],
      'font-src': ["'self'", 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com', 'data:'],
      'connect-src': ["'self'", 'http://localhost:3000', 'http://localhost:5000', 'https:'],
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

const defaultOrigins = process.env.NODE_ENV === 'production'
  ? ''
  : 'http://localhost:3000,http://localhost:4173';
const allowedOrigins = (process.env.ALLOWED_ORIGINS || defaultOrigins)
  .split(',').map(s => s.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.length === 0) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    if (process.env.NODE_ENV !== 'production' && /^http:\/\/localhost(:\d+)?$/.test(origin)) {
      return cb(null, true);
    }
    return cb(new Error('CORS: origin not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));

app.use(cookieParserMiddleware());

app.use((req, res, next) => {
  if (!req.cookies?.ht_csrf) {
    const token = newCsrfToken();
    setCsrfCookie(req, res, token);
  }
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(require('./middleware/sanitize').noSqlSanitize);
const compression = require('compression');
app.use(compression({ level: 6, threshold: 512 }));
app.set('etag', 'strong');
app.set('x-powered-by', false);

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  message: { message: 'Too many login/register attempts. Please try again in 15 minutes.' }
});

const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many payment requests. Please try again later.' }
});

const captchaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many captcha requests. Please try again later.' }
});

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many password reset attempts. Please try again in 15 minutes.' }
});

app.use('/api/', generalLimiter);
app.use('/api/auth/captcha', captchaLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', passwordResetLimiter);
app.use('/api/auth/reset-password', passwordResetLimiter);
app.use('/api/payments/', paymentLimiter);

app.use((req, res, next) => {
  req.db = db;
  next();
});

app.get('/', (req, res) => {
  res.json({
    message: 'Hamro Tuition API',
    version: '1.0.0',
    env: process.env.NODE_ENV || 'development',
    docs: '/api/health'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/diag', async (req, res) => {
  const results = { db: !!req.db, collections: {} };
  try {
    await req.db.users.findOne({});
    results.collections.users = 'ok';
  } catch (e) { results.collections.users = e.message; }
  try {
    await req.db.refreshTokens.insert({ test: true, createdAt: new Date().toISOString() });
    results.collections.refreshTokens = 'insert ok';
  } catch (e) { results.collections.refreshTokens = e.message; }
  try {
    await req.db.auditLogs.insert({ test: true, createdAt: new Date().toISOString() });
    results.collections.auditLogs = 'insert ok';
  } catch (e) { results.collections.auditLogs = e.message; }
  res.json(results);
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  index: false,
  setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff')
}));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/student', require('./routes/student'));
app.use('/api/notices', require('./routes/notices'));
app.use('/api/doubts', require('./routes/doubts'));
app.use('/api/payment-settings', require('./routes/payment-settings'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/certificates', require('./routes/certificates'));
app.use('/api/live-sessions', require('./routes/livesessions'));

app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

if (process.env.SENTRY_DSN) {
  try { app.use(require('@sentry/node').Handlers.errorHandler()); } catch {}
}

app.use((err, req, res, next) => {
  console.error('GLOBAL ERROR:', err);
  if (err.message && err.message.startsWith('CORS:')) {
    return res.status(403).json({ message: 'Origin not allowed' });
  }
  res.status(err.status || 500).json({
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : (err.message || 'Internal server error'),
    _debug: err.message || String(err),
    _type: err.constructor?.name || 'Error'
  });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT} (${process.env.NODE_ENV || 'development'})`));

app.get('/api/health', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ ok: true, ts: Date.now() });
});

app.get('/api/cache-stats', (req, res) => {
  const { getStats } = require('./middleware/cache');
  res.json(getStats());
});

function shutdown(signal) {
  console.log(`${signal} received, shutting down gracefully...`);
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = app;
