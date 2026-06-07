const bcrypt = require('bcryptjs');
require('dotenv').config();

(async () => {
  try {
    const db = require('./config/db');

    console.log('Checking admin user in production DB...');
    const admin = await db.users.findOne({ email: 'admin@hamrotuition.com' });

    if (!admin) {
      console.log('❌ Admin user NOT FOUND in production DB');
      console.log('Need to re-seed. Run: node seed-prod.js');
      process.exit(1);
    }

    console.log('✅ Admin user EXISTS:');
    console.log('  Email:', admin.email);
    console.log('  Role:', admin.role);
    console.log('  Name:', admin.name);
    console.log('  Password hash starts with:', admin.password ? admin.password.substring(0, 10) + '...' : 'NULL');
    console.log('');

    console.log('Testing password "admin123"...');
    const valid = await bcrypt.compare('admin123', admin.password);
    console.log(valid ? '✅ Password "admin123" is CORRECT' : '❌ Password "admin123" is WRONG');

    if (!valid) {
      console.log('\nLet me check what password the hash actually matches...');
      const tests = ['admin123', 'student123', 'password', 'admin@123', 'hamro@2026'];
      for (const t of tests) {
        const v = await bcrypt.compare(t, admin.password);
        if (v) console.log(`  Match found: "${t}"`);
      }
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
