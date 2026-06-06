const Datastore = require('nedb-promises');
const path = require('path');
const fs = require('fs');
const { Cursor } = require('./cursor');

const dbDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

function wrapDs(ds) {
  return {
    insert: (doc) => ds.insert(doc),
    findOne: (query) => ds.findOne(query || {}),
    update: (query, update) => ds.update(query || {}, update),
    remove: (query, options) => ds.remove(query || {}, options),
    count: (query) => ds.count(query || {}),
    find: (query = {}) => new Cursor(() => ds.find(query || {})),
  };
}

const db = {
  users: wrapDs(Datastore.create({ filename: path.join(dbDir, 'users.db'), autoload: true })),
  courses: wrapDs(Datastore.create({ filename: path.join(dbDir, 'courses.db'), autoload: true })),
  payments: wrapDs(Datastore.create({ filename: path.join(dbDir, 'payments.db'), autoload: true })),
  reviews: wrapDs(Datastore.create({ filename: path.join(dbDir, 'reviews.db'), autoload: true })),
  notices: wrapDs(Datastore.create({ filename: path.join(dbDir, 'notices.db'), autoload: true })),
  doubts: wrapDs(Datastore.create({ filename: path.join(dbDir, 'doubts.db'), autoload: true })),
  quizzes: wrapDs(Datastore.create({ filename: path.join(dbDir, 'quizzes.db'), autoload: true })),
  assignments: wrapDs(Datastore.create({ filename: path.join(dbDir, 'assignments.db'), autoload: true })),
  paymentSettings: wrapDs(Datastore.create({ filename: path.join(dbDir, 'paymentSettings.db'), autoload: true })),
  liveSessions: wrapDs(Datastore.create({ filename: path.join(dbDir, 'liveSessions.db'), autoload: true })),
  enrollments: wrapDs(Datastore.create({ filename: path.join(dbDir, 'enrollments.db'), autoload: true })),
  liveAssignments: wrapDs(Datastore.create({ filename: path.join(dbDir, 'liveAssignments.db'), autoload: true })),
  liveSubmissions: wrapDs(Datastore.create({ filename: path.join(dbDir, 'liveSubmissions.db'), autoload: true })),
  notifications: wrapDs(Datastore.create({ filename: path.join(dbDir, 'notifications.db'), autoload: true })),
  certificates: wrapDs(Datastore.create({ filename: path.join(dbDir, 'certificates.db'), autoload: true })),
  progress: wrapDs(Datastore.create({ filename: path.join(dbDir, 'progress.db'), autoload: true })),
  referrals: wrapDs(Datastore.create({ filename: path.join(dbDir, 'referrals.db'), autoload: true })),
  tokenTransactions: wrapDs(Datastore.create({ filename: path.join(dbDir, 'tokenTransactions.db'), autoload: true })),
  refreshTokens: wrapDs(Datastore.create({ filename: path.join(dbDir, 'refreshTokens.db'), autoload: true })),
  auditLogs: wrapDs(Datastore.create({ filename: path.join(dbDir, 'auditLogs.db'), autoload: true })),
  revokedTokens: wrapDs(Datastore.create({ filename: path.join(dbDir, 'revokedTokens.db'), autoload: true })),
};

module.exports = db;
