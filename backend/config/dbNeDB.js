const Datastore = require('nedb-promises');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = {
  users: Datastore.create({ filename: path.join(dbDir, 'users.db'), autoload: true }),
  courses: Datastore.create({ filename: path.join(dbDir, 'courses.db'), autoload: true }),
  payments: Datastore.create({ filename: path.join(dbDir, 'payments.db'), autoload: true }),
  reviews: Datastore.create({ filename: path.join(dbDir, 'reviews.db'), autoload: true }),
  notices: Datastore.create({ filename: path.join(dbDir, 'notices.db'), autoload: true }),
  doubts: Datastore.create({ filename: path.join(dbDir, 'doubts.db'), autoload: true }),
  quizzes: Datastore.create({ filename: path.join(dbDir, 'quizzes.db'), autoload: true }),
  assignments: Datastore.create({ filename: path.join(dbDir, 'assignments.db'), autoload: true }),
  paymentSettings: Datastore.create({ filename: path.join(dbDir, 'paymentSettings.db'), autoload: true }),
  liveSessions: Datastore.create({ filename: path.join(dbDir, 'liveSessions.db'), autoload: true }),
  enrollments: Datastore.create({ filename: path.join(dbDir, 'enrollments.db'), autoload: true }),
  liveAssignments: Datastore.create({ filename: path.join(dbDir, 'liveAssignments.db'), autoload: true }),
  liveSubmissions: Datastore.create({ filename: path.join(dbDir, 'liveSubmissions.db'), autoload: true }),
  notifications: Datastore.create({ filename: path.join(dbDir, 'notifications.db'), autoload: true }),
  certificates: Datastore.create({ filename: path.join(dbDir, 'certificates.db'), autoload: true }),
  progress: Datastore.create({ filename: path.join(dbDir, 'progress.db'), autoload: true }),
  referrals: Datastore.create({ filename: path.join(dbDir, 'referrals.db'), autoload: true }),
  tokenTransactions: Datastore.create({ filename: path.join(dbDir, 'tokenTransactions.db'), autoload: true }),
  refreshTokens: Datastore.create({ filename: path.join(dbDir, 'refreshTokens.db'), autoload: true }),
  auditLogs: Datastore.create({ filename: path.join(dbDir, 'auditLogs.db'), autoload: true }),
  revokedTokens: Datastore.create({ filename: path.join(dbDir, 'revokedTokens.db'), autoload: true }),
};

module.exports = db;
