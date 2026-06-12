const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const counter = await req.db.visitors.findOne({ _id: 'site_counter' });
    const count = counter ? counter.count : 0;
    res.json({ count });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/hit', async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || '';
    const today = new Date().toISOString().slice(0, 10);
    const existing = await req.db.visitors.findOne({ _id: 'site_counter' });
    if (existing) {
      const lastIp = existing.lastIp || '';
      const lastDate = existing.lastDate || '';
      const isNewVisit = lastIp !== ip || lastDate !== today;
      await req.db.visitors.update(
        { _id: 'site_counter' },
        { $set: { count: existing.count + (isNewVisit ? 1 : 0), lastIp: ip, lastDate: today, updatedAt: new Date().toISOString() } }
      );
      res.json({ count: existing.count + (isNewVisit ? 1 : 0) });
    } else {
      await req.db.visitors.insert({ _id: 'site_counter', count: 1, lastIp: ip, lastDate: today, updatedAt: new Date().toISOString() });
      res.json({ count: 1 });
    }
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
