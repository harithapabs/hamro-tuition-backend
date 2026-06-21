const express = require('express');
const { adminAuth } = require('../middleware/auth');
const router = express.Router();
const { sendPaymentApprovedEmail } = require('../utils/email');
const { logAction } = require('../utils/audit');
const { computeRiskScore } = require('../utils/fraudDetection');
const { cacheMiddleware, invalidateByPattern } = require('../middleware/cache');

router.use(adminAuth);

router.get('/dashboard', cacheMiddleware({ ttl: 30 }), async (req, res) => {
  try {
    const [studentsCount, coursesCount, payments, enrollments, liveSessionsList, allCourses, allReviews] = await Promise.all([
      req.db.users.count({ role: 'student' }),
      req.db.courses.count({}),
      req.db.payments.find({}),
      req.db.enrollments.find({ status: 'approved' }),
      req.db.liveSessions.find({}),
      req.db.courses.find({}),
      req.db.reviews.find({}).sort({ createdAt: -1 }).limit(20),
    ]);

    const lsPriceMap = {};
    liveSessionsList.forEach(ls => { lsPriceMap[ls._id] = parseFloat(ls.price) || 0; });
    const completedPayments = payments.filter(p => p.status === 'completed' || p.status === 'approved');
    const totalRevenue = completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
      + enrollments.reduce((sum, e) => sum + (lsPriceMap[e.liveSessionId] || 0), 0);
    const recentPayments = payments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

    const monthlyRevenue = {};
    completedPayments.forEach(p => {
      const month = new Date(p.createdAt).toLocaleString('default', { month: 'short' });
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (p.amount || 0);
    });
    enrollments.forEach(e => {
      const month = new Date(e.createdAt).toLocaleString('default', { month: 'short' });
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (lsPriceMap[e.liveSessionId] || 0);
    });

    const categoryDist = {};
    allCourses.forEach(c => { categoryDist[c.category] = (categoryDist[c.category] || 0) + 1; });

    const userIds = [...new Set(allReviews.map(r => r.userId).filter(Boolean))];
    const courseIds = [...new Set(allReviews.map(r => r.courseId).filter(Boolean))];
    const [reviewUsers, reviewCourses] = await Promise.all([
      req.db.users.find({ _id: { $in: userIds } }),
      req.db.courses.find({ _id: { $in: courseIds } }),
    ]);
    const userMap = Object.fromEntries(reviewUsers.map(u => [u._id, u]));
    const courseMap = Object.fromEntries(reviewCourses.map(c => [c._id, c]));
    const reviewsWithUsers = allReviews.map(r => ({
      ...r,
      user: userMap[r.userId] ? { name: userMap[r.userId].name, email: userMap[r.userId].email } : { name: 'Unknown' },
      course: courseMap[r.courseId] ? { title: courseMap[r.courseId].title } : { title: 'Unknown' },
    }));

    res.set('Cache-Control', 'private, max-age=30');
    const slimCourses = allCourses.map(course => {
      const { thumbnail, ...rest } = course;
      return { ...rest, thumbnail: thumbnail && thumbnail.length > 200 ? thumbnail.substring(0, 100) + '...DATA' : thumbnail };
    });
    res.json({
      totalStudents: studentsCount,
      totalCourses: coursesCount,
      totalRevenue,
      activeUsers: studentsCount,
      revenueData: Object.entries(monthlyRevenue).map(([month, revenue]) => ({ month, revenue })),
      categoryData: Object.entries(categoryDist).map(([name, count]) => ({ name, count })),
      recentPayments,
      courses: slimCourses,
      reviews: reviewsWithUsers,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/reports', cacheMiddleware({ ttl: 60 }), async (req, res) => {
  try {
    const [rawCourses, payments, students, enrollments, liveSessions] = await Promise.all([
      req.db.courses.find({}),
      req.db.payments.find({}),
      req.db.users.find({ role: 'student' }),
      req.db.enrollments.find({}),
      req.db.liveSessions.find({}),
    ]);
    const courses = rawCourses.map(({ chapters, ...rest }) => rest);
    const lsPriceMap = {};
    liveSessions.forEach(ls => { lsPriceMap[ls._id] = parseFloat(ls.price) || 0; });

    // Monthly report: last 12 months
    const monthlyMap = {};
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap[key] = { month: d.toLocaleString('default', { month: 'short' }), year: d.getFullYear(), revenue: 0, students: 0, courses: 0, enrollments: 0 };
    }
    payments.filter(p => p.status === 'completed' || p.status === 'approved').forEach(p => {
      const d = new Date(p.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyMap[key]) monthlyMap[key].revenue += p.amount || 0;
    });
    enrollments.filter(e => e.status === 'approved').forEach(e => {
      const d = new Date(e.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyMap[key]) monthlyMap[key].revenue += lsPriceMap[e.liveSessionId] || 0;
    });
    students.forEach(s => {
      const d = new Date(s.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyMap[key]) monthlyMap[key].students += 1;
    });
    courses.forEach(c => {
      const d = new Date(c.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyMap[key]) monthlyMap[key].courses += 1;
    });
    enrollments.forEach(e => {
      const d = new Date(e.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyMap[key]) monthlyMap[key].enrollments += 1;
    });
    const monthlyReport = Object.values(monthlyMap);

    // Subject-wise (category) report
    const categories = [...new Set(courses.map(c => c.category).filter(Boolean))];
    const subjectReport = categories.map(cat => {
      const catCourses = courses.filter(c => c.category === cat);
      const catIds = catCourses.map(c => c._id);
      const catStudents = students.filter(s => (s.enrolledCourses || []).some(id => catIds.includes(id)));
      const catPayments = payments.filter(p => catIds.includes(p.courseId) && (p.status === 'completed' || p.status === 'approved'));
      const catRevenue = catPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      return { name: cat, courses: catCourses.length, students: catStudents.length, revenue: catRevenue };
    });

    // Level-wise report
    const levels = [...new Set(courses.map(c => c.level).filter(Boolean))];
    const levelReport = levels.map(lvl => {
      const lvlCourses = courses.filter(c => c.level === lvl);
      const lvlIds = lvlCourses.map(c => c._id);
      const lvlStudents = students.filter(s => (s.enrolledCourses || []).some(id => lvlIds.includes(id)));
      const lvlPayments = payments.filter(p => lvlIds.includes(p.courseId) && (p.status === 'completed' || p.status === 'approved'));
      const lvlRevenue = lvlPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      return { name: lvl, courses: lvlCourses.length, students: lvlStudents.length, revenue: lvlRevenue };
    });

    res.set('Cache-Control', 'private, max-age=60');
    res.json({ monthlyReport, subjectReport, levelReport });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/courses', async (req, res) => {
  try {
    const courseData = {
      ...req.body,
      chapters: (req.body.chapters || []).map((ch, chIdx) => ({
        ...ch,
        videos: (ch.videos || []).map((v, vIdx) => ({ ...v, _id: v._id || v.id || `c${chIdx}v${vIdx}` })),
      })),
      rating: 0,
      numReviews: 0,
      createdAt: new Date().toISOString()
    };
    delete courseData._id;
    delete courseData.lessons;
    const course = await req.db.courses.insert(courseData);

    const students = await req.db.users.find({ role: 'student' });
    const notifDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const notification = {
      type: 'course',
      title: 'New Course Added',
      message: 'New course "' + (courseData.title || 'Untitled') + '" added on ' + notifDate,
      read: false,
      createdAt: new Date().toISOString()
    };
    for (const student of students) {
      await req.db.notifications.insert({ ...notification, userId: student._id });
    }

    invalidateByPattern('/api/courses');
    invalidateByPattern('/api/admin/dashboard');

    res.status(201).json(course);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/courses/:id/wizard', async (req, res) => {
  try {
    const existing = await req.db.courses.findOne({ _id: req.params.id });
    if (!existing) return res.status(404).json({ message: 'Course not found' });

    const chapters = (req.body.chapters || existing.chapters || []).map((ch, chIdx) => ({
      ...ch,
      videos: (ch.videos || []).map((v, vIdx) => ({ ...v, _id: v._id || v.id || `c${chIdx}v${vIdx}` })),
    }));
    const courseData = {
      ...req.body,
      chapters,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    delete courseData.lessons;

    await req.db.courses.remove({ _id: req.params.id }, {});
    await req.db.courses.insert({ _id: req.params.id, ...courseData });
    const course = await req.db.courses.findOne({ _id: req.params.id });

    invalidateByPattern('/api/courses');
    invalidateByPattern('/api/admin/dashboard');

    res.json(course);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/courses/:id', async (req, res) => {
  try {
    const existing = await req.db.courses.findOne({ _id: req.params.id });
    if (!existing) return res.status(404).json({ message: 'Course not found' });
    await req.db.courses.remove({ _id: req.params.id }, {});
    await req.db.courses.insert({ _id: req.params.id, ...existing, ...req.body, updatedAt: new Date().toISOString() });
    const course = await req.db.courses.findOne({ _id: req.params.id });

    invalidateByPattern('/api/courses');
    invalidateByPattern('/api/admin/dashboard');

    res.json(course);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/courses/:id', async (req, res) => {
  try {
    const result = await req.db.courses.remove({ _id: req.params.id }, {});
    if ((result.numRemoved || result.deletedCount || 0) === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }
    invalidateByPattern('/api/courses');
    invalidateByPattern('/api/admin/dashboard');
    res.json({ message: 'Course deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/courses/:id/lessons', async (req, res) => {
  try {
    const course = await req.db.courses.findOne({ _id: req.params.id });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    const lessons = course.lessons || [];
    lessons.push({ ...req.body, _id: require('crypto').randomUUID() });
    await req.db.courses.update({ _id: req.params.id }, { $set: { lessons } });
    invalidateByPattern('/api/courses');
    invalidateByPattern('/api/admin/dashboard');
    res.json(await req.db.courses.findOne({ _id: req.params.id }));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/students', cacheMiddleware({ ttl: 30 }), async (req, res) => {
  try {
    const students = await req.db.users.find({ role: 'student' }).sort({ createdAt: -1 });
    const result = [];
    for (const s of students) {
      const enrolled = await req.db.courses.find({ _id: { $in: s.enrolledCourses || [] } });
      result.push({ ...s, enrolledCourses: enrolled, password: undefined });
    }
    res.json(result);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.patch('/students/:id/block', async (req, res) => {
  try {
    const user = await req.db.users.findOne({ _id: req.params.id });
    if (!user || user.role !== 'student') return res.status(404).json({ message: 'Student not found' });
    await req.db.users.update({ _id: req.params.id }, { $set: { blocked: !user.blocked } });
    res.json({ message: 'Updated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/students/:id', async (req, res) => {
  try {
    const user = await req.db.users.findOne({ _id: req.params.id });
    if (!user || user.role !== 'student') return res.status(404).json({ message: 'Student not found' });
    await req.db.users.remove({ _id: req.params.id }, {});
    await req.db.refreshTokens.remove({ userId: req.params.id }, { multi: true });
    res.json({ message: 'Student deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/payments', cacheMiddleware({ ttl: 20 }), async (req, res) => {
  try {
    const payments = await req.db.payments.find({}).sort({ createdAt: -1 });
    const result = [];
    for (const p of payments) {
      const user = await req.db.users.findOne({ _id: p.userId });
      const course = await req.db.courses.findOne({ _id: p.courseId });
      const risk = await computeRiskScore(req.db, p, user);
      result.push({
        ...p,
        _type: 'course',
        user: user ? { name: user.name, email: user.email } : { name: 'Unknown' },
        course: course ? { title: course.title } : { title: 'Unknown' },
        risk
      });
    }
    const enrollments = await req.db.enrollments.find({}).sort({ createdAt: -1 });
    for (const e of enrollments) {
      const user = await req.db.users.findOne({ _id: e.userId });
      const live = await req.db.liveSessions.findOne({ _id: e.liveSessionId });
      result.push({
        _id: e._id,
        _type: 'live-session',
        userId: e.userId,
        amount: live?.price ? Number(live.price) : 0,
        status: e.status,
        createdAt: e.createdAt,
        screenshot: e.screenshot,
        courseDetail: e.courseDetail,
        user: user ? { name: user.name, email: user.email } : { name: 'Unknown' },
        course: { title: (live?.courseName || 'Live Session') + ' (Live)' },
      });
    }
    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(result);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/payment-requests', cacheMiddleware({ ttl: 20 }), async (req, res) => {
  try {
    const payments = await req.db.payments.find({}).sort({ createdAt: -1 });
    const result = [];
    for (const p of payments) {
      const user = await req.db.users.findOne({ _id: p.userId });
      const course = await req.db.courses.findOne({ _id: p.courseId });
      const risk = await computeRiskScore(req.db, p, user);
      result.push({
        ...p,
        user: user ? { name: user.name, email: user.email } : { name: 'Unknown' },
        course: course ? { title: course.title, price: course.price } : { title: 'Unknown' },
        risk
      });
    }
    res.json(result);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/payments/:id', async (req, res) => {
  try {
    const payment = await req.db.payments.findOne({ _id: req.params.id });
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    await req.db.payments.remove({ _id: req.params.id }, {});
    res.json({ message: 'Payment deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.patch('/payments/:id/approve', async (req, res) => {
  try {
    const payment = await req.db.payments.findOne({ _id: req.params.id });
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    if (payment.status === 'approved') return res.json({ message: 'Already approved' });

    await req.db.payments.update({ _id: req.params.id }, {
      $set: { status: 'approved', approvedAt: new Date().toISOString() }
    });
    const user = await req.db.users.findOne({ _id: payment.userId });
    const riskAtApprove = await computeRiskScore(req.db, payment, user);
    logAction(req, { userId: req.userId, action: 'payment.approve', target: payment._id, metadata: { courseId: payment.courseId, amount: payment.amount, riskScore: riskAtApprove.score, riskLabel: riskAtApprove.label } });

    let courseTitle = '';
    let course = null;
    if (user) {
      const enrolled = user.enrolledCourses || [];
      if (!enrolled.includes(payment.courseId)) {
        enrolled.push(payment.courseId);
        await req.db.users.update({ _id: payment.userId }, { $set: { enrolledCourses: enrolled } });
      }
      course = await req.db.courses.findOne({ _id: payment.courseId });
      courseTitle = course?.title || '';
    }

    if (user && courseTitle) sendPaymentApprovedEmail(user, courseTitle);

    if (user && course && !payment.tokensAwarded) {
      const { computeTokens } = require('../utils/referral');
      const { toReferrer, toReferee } = computeTokens(course.price);

      if (Number(payment.tokensUsed) > 0) {
        await req.db.tokenTransactions.insert({
          userId: user._id, type: 'spent', amount: Number(payment.tokensUsed),
          description: `Used ${payment.tokensUsed} tokens for ${course.title}`,
          paymentId: payment._id, createdAt: new Date().toISOString()
        });
      }

      if (payment.referralCode && toReferee > 0) {
        await req.db.tokenTransactions.insert({
          userId: user._id, type: 'earned', amount: toReferee,
          description: `Welcome bonus for using referral code`,
          paymentId: payment._id, createdAt: new Date().toISOString()
        });
      }

      if (payment.referralCode) {
        const referrer = await req.db.users.findOne({ referralCode: payment.referralCode });
        if (referrer && referrer._id !== user._id) {
          if (toReferrer > 0) {
            await req.db.tokenTransactions.insert({
              userId: referrer._id, type: 'earned', amount: toReferrer,
              description: `Referral bonus from ${user.name} for ${course.title}`,
              paymentId: payment._id, createdAt: new Date().toISOString()
            });
          }
          await req.db.referrals.insert({
            referrerId: referrer._id, refereeId: user._id, courseId: course._id,
            coursePrice: course.price, tokensToReferrer: toReferrer, tokensToReferee: toReferee,
            paymentId: payment._id, createdAt: new Date().toISOString()
          });
        }
      }

      await req.db.payments.update({ _id: payment._id }, { $set: { tokensAwarded: true } });
    }

    res.json({ message: 'Payment approved and course unlocked' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.patch('/payments/:id/reject', async (req, res) => {
  try {
    const payment = await req.db.payments.findOne({ _id: req.params.id });
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    const { reason } = req.body;
    await req.db.payments.update({ _id: req.params.id }, {
      $set: { status: 'rejected', rejectionReason: reason || '', rejectedAt: new Date().toISOString() }
    });

    res.json({ message: 'Payment rejected' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.patch('/reviews/:id/approve', async (req, res) => {
  try {
    const review = await req.db.reviews.findOne({ _id: req.params.id });
    if (!review) return res.status(404).json({ message: 'Review not found' });
    await req.db.reviews.update({ _id: req.params.id }, { $set: { isApproved: true } });

    const reviews = await req.db.reviews.find({ courseId: review.courseId, isApproved: true });
    const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
    await req.db.courses.update({ _id: review.courseId }, {
      $set: { rating: Math.round(avgRating * 10) / 10, numReviews: reviews.length }
    });

    res.json({ message: 'Approved' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/reviews/:id', async (req, res) => {
  try {
    const review = await req.db.reviews.findOne({ _id: req.params.id });
    if (!review) return res.status(404).json({ message: 'Review not found' });
    await req.db.reviews.remove({ _id: req.params.id }, {});

    const reviews = await req.db.reviews.find({ courseId: review.courseId, isApproved: true });
    const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
    await req.db.courses.update({ _id: review.courseId }, {
      $set: { rating: Math.round(avgRating * 10) / 10, numReviews: reviews.length }
    });

    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/audit-logs', async (req, res) => {
  try {
    const { action, userId, limit = 100 } = req.query;
    const q = {};
    if (action) q.action = action;
    if (userId) q.userId = userId;
    const logs = await req.db.auditLogs.find(q).sort({ createdAt: -1 }).limit(Math.min(parseInt(limit) || 100, 500));
    const userIds = [...new Set(logs.map(l => l.userId).filter(Boolean))];
    const users = userIds.length
      ? await Promise.all(userIds.map(id => req.db.users.findOne({ _id: id })))
      : [];
    const userMap = {};
    for (const u of users) if (u) userMap[u._id] = { name: u.name, email: u.email, role: u.role };
    const enriched = logs.map(l => ({
      ...l,
      user: l.userId ? userMap[l.userId] || null : null
    }));
    res.json(enriched);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ========== QUIZ / MCQ MANAGEMENT ==========

// Get all courses with chapters (for dropdown)
router.get('/quiz/courses', async (req, res) => {
  try {
    const courses = await req.db.courses.find({});
    const result = courses.map(c => ({
      _id: c._id,
      title: c.title,
      chapters: (c.chapters || []).map((ch, i) => ({
        index: i,
        title: ch.title || `Chapter ${i + 1}`,
        mcqCount: (ch.mcqs || []).length,
      })),
    }));
    res.json(result);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get MCQs for a specific chapter
router.get('/quiz/:courseId/chapter/:chapterIndex', async (req, res) => {
  try {
    const course = await req.db.courses.findOne({ _id: req.params.courseId });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    const ch = (course.chapters || [])[parseInt(req.params.chapterIndex)];
    if (!ch) return res.status(404).json({ message: 'Chapter not found' });
    res.json({ chapter: ch.title, mcqs: ch.mcqs || [] });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Add MCQ to a chapter
router.post('/quiz/:courseId/chapter/:chapterIndex', async (req, res) => {
  try {
    const { question, options, correctAnswer, explanation } = req.body;
    if (!question || !options || options.length < 2 || correctAnswer === undefined) {
      return res.status(400).json({ message: 'question, options (min 2), correctAnswer required' });
    }
    const course = await req.db.courses.findOne({ _id: req.params.courseId });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    const chIdx = parseInt(req.params.chapterIndex);
    if (!course.chapters || !course.chapters[chIdx]) return res.status(404).json({ message: 'Chapter not found' });
    if (!course.chapters[chIdx].mcqs) course.chapters[chIdx].mcqs = [];
    course.chapters[chIdx].mcqs.push({ question, options, correctAnswer, explanation: explanation || '' });
    await req.db.courses.remove({ _id: course._id }, {});
    await req.db.courses.insert(course);
    invalidateByPattern('/api/courses');
    res.status(201).json({ message: 'MCQ added', mcqs: course.chapters[chIdx].mcqs });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Update MCQ
router.put('/quiz/:courseId/chapter/:chapterIndex/:mcqIndex', async (req, res) => {
  try {
    const course = await req.db.courses.findOne({ _id: req.params.courseId });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    const chIdx = parseInt(req.params.chapterIndex);
    const mcqIdx = parseInt(req.params.mcqIndex);
    if (!course.chapters?.[chIdx]?.mcqs?.[mcqIdx]) return res.status(404).json({ message: 'MCQ not found' });
    const { question, options, correctAnswer } = req.body;
    if (question !== undefined) course.chapters[chIdx].mcqs[mcqIdx].question = question;
    if (options !== undefined) course.chapters[chIdx].mcqs[mcqIdx].options = options;
    if (correctAnswer !== undefined) course.chapters[chIdx].mcqs[mcqIdx].correctAnswer = correctAnswer;
    if (explanation !== undefined) course.chapters[chIdx].mcqs[mcqIdx].explanation = explanation;
    await req.db.courses.remove({ _id: course._id }, {});
    await req.db.courses.insert(course);
    invalidateByPattern('/api/courses');
    res.json({ message: 'MCQ updated', mcq: course.chapters[chIdx].mcqs[mcqIdx] });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Delete MCQ
router.delete('/quiz/:courseId/chapter/:chapterIndex/:mcqIndex', async (req, res) => {
  try {
    const course = await req.db.courses.findOne({ _id: req.params.courseId });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    const chIdx = parseInt(req.params.chapterIndex);
    const mcqIdx = parseInt(req.params.mcqIndex);
    if (!course.chapters?.[chIdx]?.mcqs?.[mcqIdx]) return res.status(404).json({ message: 'MCQ not found' });
    course.chapters[chIdx].mcqs.splice(mcqIdx, 1);
    await req.db.courses.remove({ _id: course._id }, {});
    await req.db.courses.insert(course);
    invalidateByPattern('/api/courses');
    res.json({ message: 'MCQ deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Bulk import MCQs from CSV text
router.post('/quiz/:courseId/chapter/:chapterIndex/import', async (req, res) => {
  try {
    const { csv } = req.body;
    if (!csv) return res.status(400).json({ message: 'csv text required' });
    const course = await req.db.courses.findOne({ _id: req.params.courseId });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    const chIdx = parseInt(req.params.chapterIndex);
    if (!course.chapters?.[chIdx]) return res.status(404).json({ message: 'Chapter not found' });
    if (!course.chapters[chIdx].mcqs) course.chapters[chIdx].mcqs = [];

    const lines = csv.trim().split('\n');
    let imported = 0;
    let skipped = 0;
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.toLowerCase().startsWith('question,')) continue;
      const parts = trimmed.split(',').map(s => s.trim());
      if (parts.length < 6) { skipped++; continue; }
      const [question, o1, o2, o3, o4, correct, ...explanationParts] = parts;
      const correctIdx = ['a', 'b', 'c', 'd', '1', '2', '3', '4'].indexOf(correct.toLowerCase());
      if (correctIdx === -1 || !question) { skipped++; continue; }
      const correctAnswer = correctIdx >= 4 ? correctIdx - 4 : correctIdx;
      const explanation = explanationParts.length > 0 ? explanationParts.join(',').trim() : '';
      course.chapters[chIdx].mcqs.push({
        question,
        options: [o1, o2, o3, o4],
        correctAnswer,
        explanation,
      });
      imported++;
    }

    await req.db.courses.remove({ _id: course._id }, {});
    await req.db.courses.insert(course);
    invalidateByPattern('/api/courses');
    res.json({ message: `Imported ${imported} MCQs, skipped ${skipped}`, imported, skipped });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ========== NOTE MANAGEMENT ==========
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { uploadFile, deleteFile } = require('../utils/storage');

const notesDir = path.join(__dirname, '..', 'uploads', 'notes');
if (!fs.existsSync(notesDir)) fs.mkdirSync(notesDir, { recursive: true });

const noteStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, notesDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${req.params.courseId}_ch${req.params.chapterIndex}_${Date.now()}${ext}`;
    cb(null, name);
  }
});
const noteUpload = multer({
  storage: noteStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.htm', '.html'].includes(ext)) return cb(null, true);
    cb(new Error('Only .htm and .html files allowed'));
  }
});

// Upload note for a chapter
router.post('/notes/:courseId/:chapterIndex', noteUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'File required' });
    const course = await req.db.courses.findOne({ _id: req.params.courseId });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    const chIdx = parseInt(req.params.chapterIndex);
    if (!course.chapters?.[chIdx]) return res.status(404).json({ message: 'Chapter not found' });

    const destPath = `hamro-notes/${req.params.courseId}_ch${chIdx}_${Date.now()}`;
    const noteUrl = await uploadFile(req.file.path, destPath, 'text/html');

    if (!course.chapters[chIdx].notes) course.chapters[chIdx].notes = [];
    course.chapters[chIdx].notes.push({
      _id: `note_${Date.now()}`,
      title: req.body.title || req.file.originalname,
      url: noteUrl,
      createdAt: new Date().toISOString()
    });

    await req.db.courses.remove({ _id: course._id }, {});
    await req.db.courses.insert(course);
    invalidateByPattern('/api/courses');
    res.status(201).json({ message: 'Note uploaded', url: noteUrl, notes: course.chapters[chIdx].notes });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get notes for a chapter
router.get('/notes/:courseId/:chapterIndex', async (req, res) => {
  try {
    const course = await req.db.courses.findOne({ _id: req.params.courseId });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    const chIdx = parseInt(req.params.chapterIndex);
    const notes = course.chapters?.[chIdx]?.notes || [];
    res.json(notes);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Delete a note
router.delete('/notes/:courseId/:chapterIndex/:noteId', async (req, res) => {
  try {
    const course = await req.db.courses.findOne({ _id: req.params.courseId });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    const chIdx = parseInt(req.params.chapterIndex);
    const notes = course.chapters?.[chIdx]?.notes || [];
    const noteIdx = notes.findIndex(n => n._id === req.params.noteId);
    if (noteIdx === -1) return res.status(404).json({ message: 'Note not found' });

    const note = notes[noteIdx];
    if (note.url && note.url.includes('cloudinary.com')) {
      const parts = note.url.split('/');
      const folder = parts[parts.length - 2];
      const fileWithExt = parts[parts.length - 1];
      const publicId = `${folder}/${fileWithExt.split('.')[0]}`;
      await deleteFile(publicId);
    }

    notes.splice(noteIdx, 1);
    await req.db.courses.remove({ _id: course._id }, {});
    await req.db.courses.insert(course);
    invalidateByPattern('/api/courses');
    res.json({ message: 'Note deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Replace a note (re-upload)
router.put('/notes/:courseId/:chapterIndex/:noteId', noteUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'File required' });
    const course = await req.db.courses.findOne({ _id: req.params.courseId });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    const chIdx = parseInt(req.params.chapterIndex);
    const notes = course.chapters?.[chIdx]?.notes || [];
    const noteIdx = notes.findIndex(n => n._id === req.params.noteId);
    if (noteIdx === -1) return res.status(404).json({ message: 'Note not found' });

    const oldNote = notes[noteIdx];
    if (oldNote.url && oldNote.url.includes('cloudinary.com')) {
      const parts = oldNote.url.split('/');
      const folder = parts[parts.length - 2];
      const fileWithExt = parts[parts.length - 1];
      const publicId = `${folder}/${fileWithExt.split('.')[0]}`;
      await deleteFile(publicId);
    }

    const destPath = `hamro-notes/${req.params.courseId}_ch${chIdx}_${Date.now()}`;
    const newUrl = await uploadFile(req.file.path, destPath, 'text/html');

    notes[noteIdx] = {
      ...notes[noteIdx],
      title: req.body.title || notes[noteIdx].title,
      url: newUrl,
      updatedAt: new Date().toISOString()
    };

    await req.db.courses.remove({ _id: course._id }, {});
    await req.db.courses.insert(course);
    invalidateByPattern('/api/courses');
    res.json({ message: 'Note updated', notes: course.chapters[chIdx].notes });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
