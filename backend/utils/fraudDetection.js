const crypto = require('crypto');

function sha256(input) {
  if (!input) return null;
  const clean = String(input).replace(/^data:image\/\w+;base64,/, '');
  return crypto.createHash('sha256').update(clean).digest('hex');
}

function isBase64Image(s) {
  return typeof s === 'string' && /^data:image\/(png|jpe?g|webp);base64,/.test(s);
}

function isPlausibleBase64Image(s) {
  if (!isBase64Image(s)) return { valid: false, reason: 'Not a valid image format' };
  const clean = s.replace(/^data:image\/\w+;base64,/, '');
  if (clean.length < 200) return { valid: false, reason: 'Image too small (likely fake/empty)' };
  if (clean.length > 5 * 1024 * 1024) return { valid: false, reason: 'Image too large' };
  return { valid: true };
}

function validateTransactionId(method, txnId) {
  if (!txnId || typeof txnId !== 'string') {
    return { valid: false, reason: 'Transaction ID is required' };
  }
  const id = txnId.trim();
  if (id.length < 6 || id.length > 64) {
    return { valid: false, reason: 'Transaction ID must be 6-64 chars' };
  }
  if (!/^[A-Za-z0-9\-_]+$/.test(id)) {
    return { valid: false, reason: 'Transaction ID has invalid characters' };
  }
  const m = (method || '').toLowerCase();
  if (m === 'khalti') {
    if (!/^[A-Z0-9]{8,}$/i.test(id)) {
      return { valid: false, reason: 'Khalti TXN should be 8+ alphanumeric characters' };
    }
  } else if (m === 'esewa') {
    if (!/^[0-9A-Za-z]{8,}$/i.test(id)) {
      return { valid: false, reason: 'eSewa TXN should be 8+ alphanumeric characters' };
    }
  }
  return { valid: true };
}

async function computeRiskScore(db, payment, currentUser) {
  let score = 0;
  const reasons = [];

  if (!payment.screenshot) {
    score += 40;
    reasons.push({ level: 'high', msg: 'No screenshot provided' });
  } else {
    const chk = isPlausibleBase64Image(payment.screenshot);
    if (!chk.valid) {
      score += 30;
      reasons.push({ level: 'high', msg: chk.reason });
    }
  }

  if (!payment.transactionId || payment.transactionId.length < 6) {
    score += 20;
    reasons.push({ level: 'medium', msg: 'Missing or short transaction ID' });
  } else {
    const tx = validateTransactionId(payment.paymentMethod, payment.transactionId);
    if (!tx.valid) {
      score += 15;
      reasons.push({ level: 'medium', msg: `Transaction ID format issue: ${tx.reason}` });
    }
  }

  if (payment.screenshot) {
    const hash = sha256(payment.screenshot);
    const dupes = await db.payments.find({ screenshotHash: hash, _id: { $ne: payment._id } });
    if (dupes.length > 0) {
      score += 50;
      const dupeUsers = [...new Set(dupes.map(d => d.userId))];
      reasons.push({
        level: 'critical',
        msg: `EXACT SAME IMAGE used in ${dupes.length} other payment(s) by ${dupeUsers.length} other user(s)`,
        dupePaymentIds: dupes.map(d => d._id)
      });
    }
  }

  if (currentUser) {
    const userPayments = await db.payments.find({ userId: currentUser._id });
    const previousRejected = userPayments.filter(p => p.status === 'rejected' && p._id !== payment._id).length;
    if (previousRejected > 0) {
      score += 10 * previousRejected;
      reasons.push({ level: 'medium', msg: `User has ${previousRejected} previously rejected payment(s)` });
    }
    if (userPayments.length > 5) {
      score += 5;
      reasons.push({ level: 'low', msg: `User has ${userPayments.length} total payment attempts` });
    }
  }

  const createdAt = new Date(payment.createdAt).getTime();
  const now = Date.now();
  const ageHours = (now - createdAt) / (1000 * 60 * 60);
  if (ageHours > 24) {
    score += 15;
    reasons.push({ level: 'medium', msg: `Payment is ${Math.floor(ageHours)}h old (screenshot may be reused)` });
  }

  const amount = payment.amount || 0;
  if (amount > 10000) {
    score += 5;
    reasons.push({ level: 'low', msg: `Large amount (Rs ${amount}) — verify carefully` });
  }

  if (score > 100) score = 100;

  let label = 'Low Risk';
  let color = 'emerald';
  if (score >= 60) { label = 'High Risk'; color = 'red'; }
  else if (score >= 30) { label = 'Medium Risk'; color = 'amber'; }

  return { score, label, color, reasons, screenshotHash: sha256(payment.screenshot) };
}

module.exports = {
  sha256,
  isBase64Image,
  isPlausibleBase64Image,
  validateTransactionId,
  computeRiskScore
};
