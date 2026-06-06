const express = require('express');
const { auth, adminAuth } = require('../middleware/auth');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const notices = await req.db.notices.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(notices);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', adminAuth, async (req, res) => {
  try {
    const notice = await req.db.notices.insert({
      ...req.body, isActive: true, createdAt: new Date().toISOString()
    });

    const students = await req.db.users.find({ role: 'student' });
    const now = new Date();
    const notifDate = now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const notification = {
      type: 'notice',
      title: 'New Notice',
      message: (req.body.title || 'New notice') + ' — ' + notifDate,
      read: false,
      createdAt: now.toISOString()
    };
    for (const student of students) {
      await req.db.notifications.insert({ ...notification, userId: student._id });
    }

    const allNotices = await req.db.notices.find({}).sort({ createdAt: -1 });
    if (allNotices.length > 10) {
      const toDelete = allNotices.slice(10);
      for (const old of toDelete) {
        await req.db.notices.remove({ _id: old._id }, {});
      }
    }

    res.status(201).json(notice);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', adminAuth, async (req, res) => {
  try {
    await req.db.notices.remove({ _id: req.params.id }, {});
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
