const express = require('express');
const { adminAuth } = require('../middleware/auth');
const router = express.Router();
const { sendDoubtAnsweredEmail } = require('../utils/email');

router.use(adminAuth);

router.get('/', async (req, res) => {
  try {
    const doubts = await req.db.doubts.find({}).sort({ createdAt: -1 });
    const result = [];
    for (const d of doubts) {
      const user = await req.db.users.findOne({ _id: d.userId });
      const course = await req.db.courses.findOne({ _id: d.courseId });
      result.push({
        ...d,
        user: user ? { name: user.name, email: user.email } : { name: 'Unknown' },
        course: course ? { title: course.title } : { title: d.courseName || 'Unknown' }
      });
    }
    res.json(result);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id/answer', async (req, res) => {
  try {
    const doubt = await req.db.doubts.findOne({ _id: req.params.id });
    if (!doubt) return res.status(404).json({ message: 'Doubt not found' });
    const admin = await req.db.users.findOne({ _id: req.userId });
    const answeredByName = admin ? admin.name : 'Teacher';
    await req.db.doubts.update({ _id: req.params.id }, {
      $set: { answer: req.body.answer, answeredBy: req.userId, answeredByName, isResolved: true }
    });
    const updated = await req.db.doubts.findOne({ _id: req.params.id });
    const user = await req.db.users.findOne({ _id: updated.userId });
    const course = await req.db.courses.findOne({ _id: updated.courseId });
    if (user) sendDoubtAnsweredEmail(user, course?.title || updated.courseName, updated.question);
    res.json({
      ...updated,
      user: user ? { name: user.name, email: user.email } : { name: 'Unknown' },
      course: course ? { title: course.title } : { title: 'Unknown' }
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
