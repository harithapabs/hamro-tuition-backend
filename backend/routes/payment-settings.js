const express = require('express');
const { adminAuth } = require('../middleware/auth');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const settings = await req.db.paymentSettings.findOne({});
    res.json(settings || { _id: 'global', khalti: { enabled: false }, bank: { enabled: false } });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/public', async (req, res) => {
  try {
    const settings = await req.db.paymentSettings.findOne({});
    if (!settings) return res.json({ khalti: { enabled: false }, bank: { enabled: false } });
    const safe = { ...settings };
    delete safe._id;
    res.json(safe);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/', adminAuth, async (req, res) => {
  try {
    const { khalti, bank } = req.body;

    const settingsData = {
      khalti: {
        enabled: khalti?.enabled || false,
        qrImage: khalti?.qrImage || '',
        label: khalti?.label || 'Khalti Payment',
        khaltiNumber: khalti?.khaltiNumber || '',
        khaltiName: khalti?.khaltiName || '',
      },
      bank: {
        enabled: bank?.enabled || false,
        qrImage: bank?.qrImage || '',
        bankName: bank?.bankName || '',
        accountName: bank?.accountName || '',
        accountNumber: bank?.accountNumber || '',
      },
      updatedAt: new Date().toISOString(),
    };

    const existing = await req.db.paymentSettings.findOne({});
    if (existing) {
      await req.db.paymentSettings.remove({ _id: existing._id }, {});
      await req.db.paymentSettings.insert({ _id: 'global', ...settingsData });
    } else {
      await req.db.paymentSettings.insert({ _id: 'global', ...settingsData });
    }

    res.json({ message: 'Payment settings saved' });
  } catch (err) {
    console.error('Payment settings save error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
