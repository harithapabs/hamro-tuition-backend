const { Firestore } = require('@google-cloud/firestore');

const firestore = new Firestore();

const collections = {
  users: 'users',
  courses: 'courses',
  payments: 'payments',
  reviews: 'reviews',
  notices: 'notices',
  doubts: 'doubts',
  quizzes: 'quizzes',
  assignments: 'assignments',
  paymentSettings: 'paymentSettings',
  liveSessions: 'liveSessions',
  enrollments: 'enrollments',
  liveAssignments: 'liveAssignments',
  liveSubmissions: 'liveSubmissions',
  notifications: 'notifications',
  certificates: 'certificates',
  progress: 'progress',
  referrals: 'referrals',
  tokenTransactions: 'tokenTransactions',
  refreshTokens: 'refreshTokens',
  auditLogs: 'auditLogs',
  revokedTokens: 'revokedTokens',
};

function docToObject(doc) {
  if (!doc.exists) return null;
  const data = doc.data();
  return { _id: doc.id, ...data };
}

function createCollectionProxy(collectionName) {
  const colRef = firestore.collection(collectionName);

  const handler = {
    get(target, prop) {
      if (prop === 'insert') {
        return async (doc) => {
          const data = { ...doc };
          delete data._id;
          const ref = await colRef.add(data);
          const snap = await ref.get();
          return docToObject(snap);
        };
      }
      if (prop === 'findOne') {
        return async (query = {}) => {
          let q = colRef;
          const filters = Object.entries(query);
          if (filters.length > 0) {
            q = colRef.where(filters[0][0], '==', filters[0][1]);
            for (let i = 1; i < filters.length; i++) {
              q = q.where(filters[i][0], '==', filters[i][1]);
            }
          }
          const snap = await q.limit(1).get();
          if (snap.empty) return null;
          return docToObject(snap.docs[0]);
        };
      }
      if (prop === 'find') {
        return async (query = {}, options = {}) => {
          let q = colRef;
          const filters = Object.entries(query).filter(([k]) => !k.startsWith('$'));
          if (filters.length > 0) {
            q = colRef.where(filters[0][0], '==', filters[0][1]);
            for (let i = 1; i < filters.length; i++) {
              q = q.where(filters[i][0], '==', filters[i][1]);
            }
          }
          if (options.sort) {
            const sortField = Object.keys(options.sort)[0];
            const sortDir = options.sort[sortField] === -1 ? 'desc' : 'asc';
            q = q.orderBy(sortField, sortDir);
          }
          if (options.limit) q = q.limit(options.limit);
          const snap = await q.get();
          return snap.docs.map(docToObject);
        };
      }
      if (prop === 'update') {
        return async (query, update) => {
          const docs = await handler.get(target, 'find')({}, query, {});
          for (const doc of docs) {
            const ref = colRef.doc(doc._id);
            const ops = {};
            if (update.$set) ops.set = { ...(await ref.get()).data(), ...update.$set };
            if (update.$unset) {
              const current = (await ref.get()).data() || {};
              for (const k of Object.keys(update.$unset)) delete current[k];
              ops.set = current;
            }
            if (update.$inc) {
              const current = (await ref.get()).data() || {};
              for (const [k, v] of Object.entries(update.$inc)) {
                current[k] = (current[k] || 0) + v;
              }
              ops.set = current;
            }
            if (ops.set) await ref.set(ops.set);
            else if (update.$push) {
              const current = (await ref.get()).data() || {};
              for (const [k, v] of Object.entries(update.$push)) {
                if (!current[k]) current[k] = [];
                current[k].push(v);
              }
              await ref.set(current);
            }
          }
          return { modified: docs.length };
        };
      }
      if (prop === 'remove') {
        return async (query, options = {}) => {
          const docs = await handler.get(target, 'find')({}, query, {});
          const batch = firestore.batch();
          for (const doc of docs) batch.delete(colRef.doc(doc._id));
          await batch.commit();
          return { deleted: docs.length };
        };
      }
      if (prop === 'count') {
        return async (query = {}) => {
          const docs = await handler.get(target, 'find')({}, query, {});
          return docs.length;
        };
      }
      return target[prop];
    }
  };

  return new Proxy({}, handler);
}

const db = {};
for (const [key, colName] of Object.entries(collections)) {
  db[key] = createCollectionProxy(colName);
}

module.exports = db;
