const USE_MONGODB = !!process.env.MONGODB_URI;
const { Cursor } = require('./cursor');

if (USE_MONGODB) {
  const mongoose = require('mongoose');

  let connected = false;
  async function ensureConnected() {
    if (connected) return;
    await mongoose.connect(process.env.MONGODB_URI);
    connected = true;
    try {
      const idx = [
        { model: 'users', fields: [{ email: 1 }, { unique: true, sparse: true }] },
        { model: 'users', fields: [{ role: 1 }, { createdAt: -1 }] },
        { model: 'courses', fields: [{ category: 1 }, { createdAt: -1 }] },
        { model: 'courses', fields: [{ createdAt: -1 }] },
        { model: 'payments', fields: [{ status: 1 }, { createdAt: -1 }] },
        { model: 'payments', fields: [{ userId: 1 }, { createdAt: -1 }] },
        { model: 'enrollments', fields: [{ userId: 1 }, { status: 1 }] },
        { model: 'enrollments', fields: [{ status: 1 }, { createdAt: -1 }] },
        { model: 'reviews', fields: [{ courseId: 1 }, { isApproved: 1 }, { createdAt: -1 }] },
        { model: 'reviews', fields: [{ isApproved: 1 }, { createdAt: -1 }] },
        { model: 'liveSessions', fields: [{ createdAt: -1 }] },
        { model: 'notices', fields: [{ createdAt: -1 }] },
        { model: 'auditLogs', fields: [{ createdAt: -1 }] },
        { model: 'auditLogs', fields: [{ userId: 1 }, { createdAt: -1 }] },
      ];
      for (const { model, fields } of idx) {
        try {
          const M = mongoose.model(model);
          const indexSpec = {};
          let indexOptions = { background: true };
          for (const f of fields) {
            if (typeof f === 'object') {
              Object.entries(f).forEach(([k, v]) => {
                if (k === 'unique') indexOptions.unique = true;
                else if (k === 'sparse') indexOptions.sparse = true;
                else indexSpec[k] = v;
              });
            } else {
              indexSpec[f] = 1;
            }
          }
          await M.collection.createIndex(indexSpec, indexOptions);
        } catch (e) { console.warn(`Index for ${model}:`, e.message); }
      }
    } catch (e) { console.warn('Index setup:', e.message); }
  }

  function getModel(collectionName) {
    try {
      return mongoose.model(collectionName);
    } catch (e) {
      return mongoose.model(
        collectionName,
        new mongoose.Schema({ _id: String }, { strict: false, versionKey: false }),
        collectionName
      );
    }
  }

  function createCollectionProxy(collectionName) {
    const Model = getModel(collectionName);

    const handler = {
      get(target, prop) {
        if (prop === 'insert') {
          return async (doc) => {
            await ensureConnected();
            const newId = () => new mongoose.Types.ObjectId().toString();
            if (Array.isArray(doc)) {
              const docs = doc.map((d) => ({ ...d, _id: d._id || newId() }));
              const inserted = await Model.insertMany(docs, { lean: true });
              return inserted.map(d => {
                if (!d._id) d._id = d.id;
                return d;
              });
            }
            const docWithId = { ...doc, _id: doc._id || newId() };
            const m = new Model(docWithId);
            await m.save();
            const obj = m.toObject();
            if (!obj._id) obj._id = obj.id;
            return obj;
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
          return (query = {}) => new Cursor(async () => {
            await ensureConnected();
            const docs = await Model.find(query || {}).lean();
            return docs.map(d => {
              if (!d._id) d._id = d.id;
              return d;
            });
          });
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
