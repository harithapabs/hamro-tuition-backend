const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { auth, setAuthCookie, clearAuthCookie, newCsrfToken, setRefreshCookie, clearRefreshCookie, signToken, refreshSignToken, REFRESH_COOKIE, COOKIE_NAME } = require('../middleware/auth');
const { revokeJti, revokeAllForUser } = require('../utils/tokenRevocation');
const { sendWelcomeEmail, send2FAEmail, sendVerificationEmail, sendPasswordResetEmail } = require('../utils/email');
const { generateReferralCode } = require('../utils/referral');
const { logAction } = require('../utils/audit');

const router = express.Router();

function isStrongPassword(p) {
  if (typeof p !== 'string' || p.length < 8) return false;
  if (p.length > 128) return false;
  if (!/[A-Za-z]/.test(p)) return false;
  if (!/[0-9]/.test(p)) return false;
  return true;
}

function isValidEmail(e) {
  return typeof e === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 254;
}

const captchaStore = new Map();
function makeCaptcha() {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  const id = crypto.randomBytes(12).toString('hex');
  captchaStore.set(id, { a, b, expires: Date.now() + 5 * 60 * 1000 });
  for (const [k, v] of captchaStore) if (v.expires < Date.now()) captchaStore.delete(k);
  return { id, question: `What is ${a} + ${b}?` };
}
function checkCaptcha(id, answer) {
  const c = captchaStore.get(id);
  if (!c) return false;
  captchaStore.delete(id);
  if (c.expires < Date.now()) return false;
  return parseInt(answer, 10) === c.a + c.b;
}

async function issueRefreshToken(req, res, userId) {
  const raw = crypto.randomBytes(48).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(raw).digest('hex');
  await req.db.refreshTokens.insert({
    userId, tokenHash,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    userAgent: req.headers['user-agent'] || '',
    ip: req.ip
  });
  setRefreshCookie(res, raw);
  return raw;
}

async function consumeRefreshToken(req, userId, rawToken) {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const stored = await req.db.refreshTokens.findOne({ userId, tokenHash });
  if (!stored) return false;
  if (new Date(stored.expiresAt) < new Date()) {
    await req.db.refreshTokens.remove({ _id: stored._id }, {});
    return false;
  }
  await req.db.refreshTokens.remove({ _id: stored._id }, {});
  return true;
}

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function ensureReferralCode(req, user) {
  if (!user.referralCode) {
    let code = generateReferralCode(user.name);
    for (let i = 0; i < 5; i++) {
      const exists = await req.db.users.findOne({ referralCode: code });
      if (!exists) break;
      code = generateReferralCode(user.name);
    }
    await req.db.users.update({ _id: user._id }, { $set: { referralCode: code } });
    user.referralCode = code;
  }
  return user;
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, referralCode, captchaId, captchaAnswer } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'All fields required' });
    if (!checkCaptcha(captchaId, captchaAnswer)) {
      return res.status(400).json({ message: 'Incorrect captcha answer' });
    }
    if (typeof name !== 'string' || name.trim().length < 2 || name.length > 100) {
      return res.status(400).json({ message: 'Invalid name' });
    }
    if (!isValidEmail(email)) return res.status(400).json({ message: 'Invalid email' });
    if (!isStrongPassword(password)) {
      return res.status(400).json({ message: 'Password must be 8+ chars with letters and numbers' });
    }
    if (role && !['student', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const exists = await req.db.users.findOne({ email: email.toLowerCase() });
    if (exists) {
      await bcrypt.compare(password, exists.password || '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalid');
      return res.status(400).json({ message: 'Could not create account with these details' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await req.db.users.insert({
      name: name.trim(), email: email.toLowerCase(), password: hashed,
      role: role || 'student', enrolledCourses: [], profilePic: '',
      referredBy: referralCode ? escapeRegex(referralCode).toUpperCase().trim() : '',
      createdAt: new Date().toISOString()
    });

    await ensureReferralCode(req, user);

    const verificationToken = crypto.randomBytes(32).toString('hex');
    await req.db.users.update({ _id: user._id }, { $set: {
      emailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }});
    sendVerificationEmail({ ...user, verificationToken });

    const { token } = await signToken(req, { ...user, emailVerified: false });
    setAuthCookie(res, token);
    await issueRefreshToken(req, res, user._id);
    const { password: _, ...userData } = user;
    sendWelcomeEmail(userData);
    logAction(req, { userId: user._id, action: 'user.register', target: user._id });
    res.status(201).json({ user: userData, csrfToken: newCsrfToken() });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password, twoFactorCode, captchaId, captchaAnswer } = req.body;
    if (!isValidEmail(email) || typeof password !== 'string') {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    if (captchaId && !checkCaptcha(captchaId, captchaAnswer)) {
      return res.status(400).json({ message: 'Incorrect captcha answer' });
    }

    const user = await req.db.users.findOne({ email: email.toLowerCase() });
    const fakeHash = '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalid';
    const hashToCheck = user ? user.password : fakeHash;
    const match = await bcrypt.compare(password, hashToCheck);

    if (!user || !match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: 'Account has been blocked. Contact support.' });
    }

    if (user.twoFactorEnabled) {
      if (!twoFactorCode) {
        const tempToken = crypto.randomBytes(24).toString('hex');
        await req.db.users.update({ _id: user._id }, { $set: {
          twoFactorTempToken: tempToken,
          twoFactorTempExpires: new Date(Date.now() + 10 * 60 * 1000).toISOString()
        }});
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        await req.db.users.update({ _id: user._id }, { $set: { twoFactorCode: otp } });
        send2FAEmail(user, otp);
        return res.status(200).json({ requires2FA: true, twoFactorToken: tempToken });
      }
      const codeOk = user.twoFactorCode === twoFactorCode &&
        user.twoFactorTempToken &&
        new Date(user.twoFactorTempExpires) > new Date();
      if (!codeOk) return res.status(401).json({ message: 'Invalid 2FA code' });
      await req.db.users.update({ _id: user._id }, { $unset: {
        twoFactorCode: true, twoFactorTempToken: true, twoFactorTempExpires: true
      }});
    }

    await ensureReferralCode(req, user);

    const hadPreviousSession = !!user.currentSessionId;
    const { token } = await signToken(req, user);
    setAuthCookie(res, token);
    await issueRefreshToken(req, res, user._id);
    const { password: _, ...userData } = user;
    logAction(req, { userId: user._id, action: 'user.login', target: user._id, metadata: { endedOtherSession: hadPreviousSession } });
    res.json({ user: userData, csrfToken: newCsrfToken() });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/logout', async (req, res) => {
  try {
    const raw = req.cookies?.[REFRESH_COOKIE];
    if (raw) {
      const tokenHash = crypto.createHash('sha256').update(raw).digest('hex');
      await req.db.refreshTokens.remove({ tokenHash }, { multi: true });
    }
    const accessToken = req.cookies?.[COOKIE_NAME];
    if (accessToken) {
      try {
        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
        if (decoded.jti) {
          await revokeJti(req.db, decoded.jti, decoded.exp * 1000);
        }
      } catch {}
    }
    clearAuthCookie(res);
    clearRefreshCookie(res);
    if (req.cookies?.[COOKIE_NAME]) {
      try {
        const decoded = jwt.verify(req.cookies[COOKIE_NAME], process.env.JWT_SECRET);
        if (decoded.id) {
          await req.db.users.update({ _id: decoded.id }, { $unset: { currentSessionId: true } });
        }
      } catch {}
    }
    res.json({ message: 'Logged out' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/me', auth, async (req, res) => {
  const { password: _, ...userData } = req.user;
  res.json(userData);
});

router.get('/captcha', (req, res) => {
  res.json(makeCaptcha());
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!isValidEmail(email)) {
      return res.json({ message: 'If the email exists, a reset link has been sent.' });
    }
    const user = await req.db.users.findOne({ email: email.toLowerCase() });
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      await req.db.users.update({ _id: user._id }, { $set: {
        resetPasswordToken: tokenHash,
        resetPasswordExpires: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      }});
      sendPasswordResetEmail({ ...user, email: user.email, name: user.name }, token);
    }
    res.json({ message: 'If the email exists, a reset link has been sent.' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ message: 'Token and new password required' });
    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({ message: 'Password must be 8+ chars with letters and numbers' });
    }
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await req.db.users.findOne({ resetPasswordToken: tokenHash });
    if (!user || new Date(user.resetPasswordExpires) < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await req.db.users.update({ _id: user._id }, {
      $set: { password: hashed },
      $unset: { resetPasswordToken: true, resetPasswordExpires: true }
    });
    await req.db.refreshTokens.remove({ userId: user._id }, { multi: true });
    await revokeAllForUser(req.db, user._id);
    logAction(req, { userId: user._id, action: 'password.reset', target: user._id });
    res.json({ message: 'Password reset successful. Please log in.' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/refresh', async (req, res) => {
  try {
    const raw = req.cookies?.[REFRESH_COOKIE];
    if (!raw) return res.status(401).json({ message: 'No refresh token' });
    const tokenHash = crypto.createHash('sha256').update(raw).digest('hex');
    const stored = await req.db.refreshTokens.findOne({ tokenHash });
    if (!stored || new Date(stored.expiresAt) < new Date()) {
      if (stored) await req.db.refreshTokens.remove({ _id: stored._id }, {});
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    const user = await req.db.users.findOne({ _id: stored.userId });
    if (!user) return res.status(401).json({ message: 'User not found' });
    if (user.isBlocked) return res.status(403).json({ message: 'Account blocked' });

    await req.db.refreshTokens.remove({ _id: stored._id }, {});
    await issueRefreshToken(req, res, user._id);

    const jti = user.currentSessionId || crypto.randomBytes(16).toString('hex');
    const { token: newJwt } = refreshSignToken(user, jti);
    if (!user.currentSessionId) {
      await req.db.users.update({ _id: user._id }, { $set: { currentSessionId: jti } });
    }
    setAuthCookie(res, newJwt);
    res.json({ csrfToken: newCsrfToken() });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: 'Token required' });
    const user = await req.db.users.findOne({ emailVerificationToken: token });
    if (!user) return res.status(400).json({ message: 'Invalid token' });
    if (new Date(user.emailVerificationExpires) < new Date()) {
      return res.status(400).json({ message: 'Token expired' });
    }
    await req.db.users.update({ _id: user._id }, {
      $set: { emailVerified: true },
      $unset: { emailVerificationToken: true, emailVerificationExpires: true }
    });
    res.json({ message: 'Email verified' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/2fa/enable', auth, async (req, res) => {
  try {
    if (!req.user.emailVerified) {
      return res.status(400).json({ message: 'Verify your email first' });
    }
    await req.db.users.update({ _id: req.userId }, { $set: { twoFactorEnabled: true } });
    res.json({ message: '2FA enabled' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/2fa/disable', auth, async (req, res) => {
  try {
    await req.db.users.update({ _id: req.userId }, { $set: { twoFactorEnabled: false } });
    res.json({ message: '2FA disabled' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
