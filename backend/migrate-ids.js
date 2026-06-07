const mongoose = require('mongoose');
require('dotenv').config();

const collectionNames = [
  'users', 'courses', 'payments', 'reviews', 'notices', 'doubts',
  'quizzes', 'assignments', 'paymentSettings', 'liveSessions', 'enrollments',
  'liveAssignments', 'liveSubmissions', 'notifications', 'certificates',
  'progress', 'referrals', 'tokenTransactions', 'refreshTokens',
  'auditLogs', 'revokedTokens'
];

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected. Migrating _id ObjectId -> String...');

  for (const name of collectionNames) {
    const collection = mongoose.connection.db.collection(name);
    const docs = await collection.find({}).toArray();
    let migrated = 0;
    let skipped = 0;
    for (const doc of docs) {
      if (doc._id && doc._id.constructor && doc._id.constructor.name === 'ObjectId') {
        const oldId = doc._id;
        const newId = oldId.toString();
        const { _id, ...rest } = doc;
        try {
          await collection.deleteOne({ _id: oldId });
          await collection.insertOne({ _id: newId, ...rest });
          migrated++;
        } catch (e) {
          console.error(`  ${name} ${oldId}: migration failed -`, e.message);
        }
      } else {
        skipped++;
      }
    }
    if (migrated > 0) {
      console.log(`  ${name}: migrated ${migrated}, skipped ${skipped}`);
    }
  }

  console.log('\nVerifying...');
  for (const name of collectionNames) {
    const collection = mongoose.connection.db.collection(name);
    const sample = await collection.findOne({});
    if (sample) {
      console.log(`  ${name}: _id is ${sample._id} (${sample._id?.constructor?.name})`);
    }
  }

  await mongoose.disconnect();
  console.log('\nDone.');
}

migrate().catch(e => { console.error(e); process.exit(1); });
