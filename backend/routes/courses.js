const express = require('express');
const { auth } = require('../middleware/auth');
const { cacheMiddleware, invalidateByPattern } = require('../middleware/cache');
const router = express.Router();

router.get('/', cacheMiddleware({ ttl: 120 }), async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = {};
    if (category) query.category = category;
    if (search) {
      const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [{ title: re }, { instructor: re }, { description: re }, { category: re }];
    }
    const courses = await req.db.courses.find(query).sort({ createdAt: -1 });
    const slim = courses.map(({ chapters, ...rest }) => rest);
    res.json(slim);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const course = await req.db.courses.findOne({ _id: req.params.id });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/:id/review', auth, async (req, res) => {
  try {
    if (req.user.role !== 'student') return res.status(403).json({ message: 'Students only' });
    const { rating, comment } = req.body;
    const existing = await req.db.reviews.findOne({ userId: req.userId, courseId: req.params.id });
    if (existing) return res.status(400).json({ message: 'Already reviewed' });
    const review = await req.db.reviews.insert({
      userId: req.userId, courseId: req.params.id, rating, comment,
      isApproved: false, createdAt: new Date().toISOString()
    });

    const reviews = await req.db.reviews.find({ courseId: req.params.id, isApproved: true });
    const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
    await req.db.courses.update({ _id: req.params.id }, {
      $set: { rating: Math.round(avgRating * 10) / 10, numReviews: reviews.length }
    });

    res.status(201).json(review);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/:id/reviews', async (req, res) => {
  try {
    const reviews = await req.db.reviews.find({ courseId: req.params.id, isApproved: true }).sort({ createdAt: -1 });
    const populated = [];
    for (const r of reviews) {
      const user = await req.db.users.findOne({ _id: r.userId });
      populated.push({ ...r, user: user ? { name: user.name, profilePic: user.profilePic } : { name: 'Unknown' } });
    }
    res.json(populated);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get all approved reviews for homepage
router.get('/reviews/approved', async (req, res) => {
  try {
    const reviews = await req.db.reviews.find({ isApproved: true }).sort({ createdAt: -1 });
    const populated = [];
    for (const r of reviews) {
      const user = await req.db.users.findOne({ _id: r.userId });
      populated.push({
        ...r,
        user: user ? { name: user.name, profilePic: user.profilePic } : { name: 'Unknown', profilePic: '' }
      });
    }
    res.json(populated);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
