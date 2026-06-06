const USE_MONGODB = !!process.env.MONGODB_URI;

if (USE_MONGODB) {
  const mongoose = require('mongoose');

  let connected = false;
  async function ensureConnected() {
    if (connected) return;
    await mongoose.connect(process.env.MONGODB_URI);
    connected = true;
  }

  function getModel(collectionName) {
    try {
      return mongoose.model(collectionName);
    } catch (e) {
      return mongoose.model(collectionName, new mongoose.Schema({}, { strict: false, versionKey: false }), collectionName);
    }
  }

  function createCollectionProxy(collectionName) {
    const Model = getModel(collectionName);

    const handler = {
      get(target, prop) {
        if (prop === 'insert') {
          return async (doc) => {
            await ensureConnected();
            const m = new Model(doc);
            await m.save();
            return m.toObject();
          };
        }
        if (prop === 'findOne') {
          return async (query = {}) => {
            await ensureConnected();
            const m = await Model.findOne(query).lean();
            if (!m) return null;
            if (!m._id) m._id = m.id;
            return m;
          };
        }
        if (prop === 'find') {
          return async (query = {}, options = {}) => {
            await ensureConnected();
            let q = Model.find(query || {});
            if (options.sort) q = q.sort(options.sort);
            if (options.limit) q = q.limit(options.limit);
            if (options.skip) q = q.skip(options.skip);
            const docs = await q.lean();
            return docs.map(d => {
              if (!d._id) d._id = d.id;
              return d;
            });
          };
        }
        if (prop === 'update') {
          return async (query, update) => {
            await ensureConnected();
            const updateOp = {};
            if (update.$set) updateOp.$set = update.$set;
            if (update.$unset) updateOp.$unset = Object.fromEntries(Object.keys(update.$unset).map(k => [k, '']));
            if (update.$inc) updateOp.$inc = update.$inc;
            if (update.$push) {
              for (const [k, v] of Object.entries(update.$push)) {
                await Model.updateOne(query, { $push: { [k]: v } });
              }
              if (Object.keys(updateOp).length === 0) return { modifiedCount: 0 };
            }
            const res = await Model.updateMany(query, updateOp);
            return { modifiedCount: res.modifiedCount || 0 };
          };
        }
        if (prop === 'remove') {
          return async (query, options = {}) => {
            await ensureConnected();
            const res = await Model.deleteMany(query);
            return { deletedCount: res.deletedCount || 0 };
          };
        }
        if (prop === 'count') {
          return async (query = {}) => {
            await ensureConnected();
            return await Model.countDocuments(query);
          };
        }
        return target[prop];
      }
    };

    return new Proxy({}, handler);
  }

  const collectionNames = [
    'users', 'courses', 'payments', 'reviews', 'notices', 'doubts',
    'quizzes', 'assignments', 'paymentSettings', 'liveSessions', 'enrollments',
    'liveAssignments', 'liveSubmissions', 'notifications', 'certificates',
    'progress', 'referrals', 'tokenTransactions', 'refreshTokens',
    'auditLogs', 'revokedTokens'
  ];

  const db = {};
  for (const name of collectionNames) {
    db[name] = createCollectionProxy(name);
  }
  module.exports = db;
} else {
  module.exports = require('./dbNeDB');
}
