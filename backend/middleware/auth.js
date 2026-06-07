const cookies = require('cookie-parser');
const csrf = require('csrf');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const tokens = new csrf();
const SECRET = process.env.CSRF_SECRET || crypto.randomBytes(32).toString('hex');

const COOKIE_NAME = 'ht_token';
const CSRF_COOKIE = 'ht_csrf';
const REFRESH_COOKIE = 'ht_refresh';

const isProduction = process.env.NODE_ENV === 'production';
const cookieOptions = {
  httpOnly: true,
  sameSite: isProduction ? 'none' : 'lax',
  secure: isProduction,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000
};

function cookieParserMiddleware() {
  return cookies();
}

async function signToken(req, user) {
  const jti = crypto.randomBytes(16).toString('hex');
  const token = jwt.sign(
    { id: user._id, role: user.role, jti },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  if (req?.db?.users) {
    await req.db.users.update({ _id: user._id }, { $set: { currentSessionId: jti } });
  }
  return { token, jti, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 };
}

function refreshSignToken(user, jti) {
  const token = jwt.sign(
    { id: user._id, role: user.role, jti },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  return { token, jti, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 };
}

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, cookieOptions);
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, cookieOptions);
}

function setCsrfCookie(res, token) {
  res.cookie(CSRF_COOKIE, token, {
    ...cookieOptions,
    httpOnly: false
  });
}

function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE, token, {
    ...cookieOptions,
    maxAge: 30 * 24 * 60 * 60 * 1000
  });
}

function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE, cookieOptions);
}

function newCsrfToken() {
  return tokens.create(SECRET);
}

function verifyCsrf(token) {
  return tokens.verify(SECRF_SECRET, token);
}

const CSRF_SECRET = SECRET;

const auth = async (req, res, next) => {
  try {
    const token = req.cookies?.[COOKIE_NAME] ||
      (req.header('Authorization')?.startsWith('Bearer ') ? req.header('Authorization').replace('Bearer ', '') : null);
    if (!token) return res.status(401).json({ message: 'No auth token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.jti) {
      const { isRevoked, isUserRevoked } = require('../utils/tokenRevocation');
      if (await isRevoked(req.db, decoded.jti)) {
        return res.status(401).json({ message: 'Token revoked' });
      }
      if (await isUserRevoked(req.db, decoded.id)) {
        return res.status(401).json({ message: 'Session terminated. Please log in again.' });
      }
    }
    const user = await req.db.users.findOne({ _id: decoded.id });
    if (!user) return res.status(401).json({ message: 'User not found' });
    if (user.isBlocked) return res.status(403).json({ message: 'Account blocked' });

    if (decoded.jti && user.currentSessionId && decoded.jti !== user.currentSessionId && user.role !== 'admin') {
      return res.status(401).json({ message: 'Session ended. Logged in from another device.' });
    }

    req.user = user;
    req.userId = user._id;
    req.tokenJti = decoded.jti;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const adminAuth = async (req, res, next) => {
  await auth(req, res, () => {
    if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
    next();
  });
};

const csrfProtection = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const headerToken = req.header('X-CSRF-Token');
  if (!headerToken || !tokens.verify(SECRET, headerToken)) {
    return res.status(403).json({ message: 'Invalid CSRF token' });
  }
  next();
};

module.exports = {
  auth,
  adminAuth,
  csrfProtection,
  cookieParserMiddleware,
  signToken,
  refreshSignToken,
  setAuthCookie,
  clearAuthCookie,
  setCsrfCookie,
  newCsrfToken,
  verifyCsrf,
  setRefreshCookie,
  clearRefreshCookie,
  COOKIE_NAME,
  CSRF_COOKIE,
  REFRESH_COOKIE,
  CSRF_SECRET
};
