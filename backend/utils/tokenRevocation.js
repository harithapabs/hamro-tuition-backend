async function revokeJti(db, jti, expiresAt) {
  if (!jti) return;
  try {
    await db.revokedTokens.insert({ jti, expiresAt: new Date(expiresAt).toISOString(), revokedAt: new Date().toISOString() });
  } catch (err) {
    if (!String(err.message).includes('unique')) console.error('revokeJti:', err.message);
  }
}

async function isRevoked(db, jti) {
  if (!jti) return false;
  const found = await db.revokedTokens.findOne({ jti });
  return !!found;
}

async function revokeAllForUser(db, userId, jwtSecret) {
  await db.revokedTokens.insert({ userId, revokeAll: true, revokedAt: new Date().toISOString() });
}

async function isUserRevoked(db, userId) {
  const found = await db.revokedTokens.findOne({ userId, revokeAll: true });
  return !!found;
}

async function cleanupExpired(db) {
  const now = new Date().toISOString();
  await db.revokedTokens.remove({ expiresAt: { $lt: now } }, { multi: true });
}

setInterval(() => {
  try {
    const { db } = require('../config/db');
    cleanupExpired(db);
  } catch {}
}, 60 * 60 * 1000);

module.exports = { revokeJti, isRevoked, revokeAllForUser, isUserRevoked, cleanupExpired };
