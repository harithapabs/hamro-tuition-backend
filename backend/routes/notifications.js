const express = require('express');
const { auth } = require('../middleware/auth');
const router = express.Router();

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const notifications = await req.db.notifications.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/unread-count', async (req, res) => {
  try {
    const count = await req.db.notifications.count({ userId: req.userId, read: false });
    res.json({ count });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id/read', async (req, res) => {
  try {
    await req.db.notifications.update({ _id: req.params.id, userId: req.userId }, { $set: { read: true } });
    res.json({ message: 'Marked as read' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/read-all', async (req, res) => {
  try {
    await req.db.notifications.update({ userId: req.userId, read: false }, { $set: { read: true } }, { multi: true });
    res.json({ message: 'All marked as read' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
