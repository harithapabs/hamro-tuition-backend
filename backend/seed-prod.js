const bcrypt = require('bcryptjs');
require('dotenv').config();

const { runSeed } = require('./seed-runner');
(async () => {
  try {
    await runSeed();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
})();
