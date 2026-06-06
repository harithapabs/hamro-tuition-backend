const crypto = require('crypto');

const TOKEN_VALUE_RS = 100;
const REFERRAL_COMMISSION_PERCENT = 10;
const REFEREE_COMMISSION_PERCENT = 10;

function generateReferralCode(name) {
  const clean = (name || 'USER').replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 6) || 'USER';
  const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `HAMRO-${clean}-${rand}`;
}

function computeTokens(coursePrice) {
  const total = Math.floor((Number(coursePrice) || 0) * (REFERRAL_COMMISSION_PERCENT / 100) / TOKEN_VALUE_RS);
  return {
    total,
    toReferrer: total,
    toReferee: total,
  };
}

module.exports = {
  TOKEN_VALUE_RS,
  REFERRAL_COMMISSION_PERCENT,
  REFEREE_COMMISSION_PERCENT,
  generateReferralCode,
  computeTokens,
};
