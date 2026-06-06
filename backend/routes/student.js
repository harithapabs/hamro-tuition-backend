const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { auth } = require('../middleware/auth');
const router = express.Router();

const profileDir = path.join(__dirname, '..', 'uploads', 'profiles');
if (!fs.existsSync(profileDir)) {
  fs.mkdirSync(profileDir, { recursive: true });
}
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, profileDir),
  filename: (req, file, cb) => {
    cb(null, 'profile-' + req.userId + path.extname(file.originalname));
  }
});
const profileUpload = multer({ storage: profileStorage, limits: { fileSize: 5 * 1024 * 1024 } });

const doubtDir = path.join(__dirname, '..', 'uploads', 'doubts');
if (!fs.existsSync(doubtDir)) {
  fs.mkdirSync(doubtDir, { recursive: true });
}
const doubtStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, doubtDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'doubt-' + unique + path.extname(file.originalname));
  }
});
const doubtUpload = multer({
  storage: doubtStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|pdf)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error('Only images (jpg, png, gif, webp) and PDF files are allowed'), false);
    }
  }
});

router.use(auth);

router.get('/my-courses', async (req, res) => {
  try {
    const user = await req.db.users.findOne({ _id: req.userId });
    const courseIds = user.enrolledCourses || [];
    const courses = [];
    for (const id of courseIds) {
      const course = await req.db.courses.findOne({ _id: id });
      if (course) courses.push(course);
    }
    res.json(courses);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/quiz/:lessonId', async (req, res) => {
  try {
    const quiz = await req.db.quizzes.findOne({ lessonId: req.params.lessonId });
    if (!quiz) return res.status(404).json({ message: 'No quiz for this lesson' });
    const safe = { ...quiz, questions: quiz.questions.map(q => ({ question: q.question, options: q.options })) };
    res.json(safe);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/quiz/submit', auth, async (req, res) => {
  try {
    const { quizId, answers } = req.body;
    const quiz = await req.db.quizzes.findOne({ _id: quizId });
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    let correct = 0;
    quiz.questions.forEach((q, i) => {
      if (answers[i] === q.correctAnswer) correct++;
    });

    res.json({ score: correct, total: quiz.questions.length, percentage: Math.round((correct / quiz.questions.length) * 100) });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/doubt', auth, doubtUpload.single('file'), async (req, res) => {
  try {
    const { courseId, question } = req.body;
    const course = await req.db.courses.findOne({ _id: courseId });
    const courseName = course ? course.title : courseId;
    const fileInfo = req.file ? {
      fileName: req.file.originalname,
      filePath: '/uploads/doubts/' + req.file.filename,
      fileType: req.file.mimetype,
      fileSize: req.file.size
    } : null;
    const doubt = await req.db.doubts.insert({
      userId: req.userId, courseId, question,
      courseName,
      file: fileInfo,
      answer: null, answeredBy: null, answeredByName: null,
      isResolved: false, createdAt: new Date().toISOString()
    });
    res.status(201).json(doubt);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/doubts', auth, async (req, res) => {
  try {
    const doubts = await req.db.doubts.find({ userId: req.userId }).sort({ createdAt: -1 });
    const result = [];
    for (const d of doubts) {
      const course = await req.db.courses.findOne({ _id: d.courseId });
      result.push({
        ...d,
        course: course ? { title: course.title } : { title: d.courseName || 'Unknown' }
      });
    }
    res.json(result);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/profile/photo', auth, profileUpload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Photo required' });
    const photoPath = `/uploads/profiles/${req.file.filename}`;
    await req.db.users.update({ _id: req.userId }, { $set: { profilePic: photoPath } }, {});
    res.json({ profilePic: photoPath });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/review', auth, async (req, res) => {
  try {
    if (req.user.role !== 'student') return res.status(403).json({ message: 'Students only' });
    const { courseId, rating, comment } = req.body;
    if (!courseId || !rating || !comment) return res.status(400).json({ message: 'courseId, rating, comment required' });
    const existing = await req.db.reviews.findOne({ userId: req.userId, courseId });
    if (existing) return res.status(400).json({ message: 'Already reviewed this course' });
    const review = await req.db.reviews.insert({
      userId: req.userId, courseId, rating, comment,
      isApproved: false, createdAt: new Date().toISOString()
    });
    res.status(201).json(review);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- Progress Tracking ---

router.post('/lesson/:lessonId/complete', auth, async (req, res) => {
  try {
    const { courseId } = req.body;
    if (!courseId) return res.status(400).json({ message: 'courseId required' });
    const existing = await req.db.progress.findOne({ userId: req.userId, lessonId: req.params.lessonId });
    if (!existing) {
      await req.db.progress.insert({
        userId: req.userId, courseId, lessonId: req.params.lessonId,
        completedAt: new Date().toISOString()
      });
    }
    res.json({ message: 'Lesson marked complete' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/course/:courseId/progress', auth, async (req, res) => {
  try {
    const course = await req.db.courses.findOne({ _id: req.params.courseId });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    const completed = await req.db.progress.find({ userId: req.userId, courseId: req.params.courseId });
    const completedIds = completed.map(c => c.lessonId);
    const allLessons = [];
    if (course.chapters) {
      course.chapters.forEach(ch => {
        (ch.videos || []).forEach(v => allLessons.push(v._id));
      });
    }
    (course.lessons || []).forEach(l => allLessons.push(l._id));
    const total = allLessons.length || 1;
    const done = allLessons.filter(id => completedIds.includes(id)).length;
    res.json({ total, completed: done, percentage: Math.round((done / total) * 100), completedLessons: completedIds });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/my-progress', auth, async (req, res) => {
  try {
    const user = await req.db.users.findOne({ _id: req.userId });
    const courseIds = user.enrolledCourses || [];
    const result = [];
    for (const cid of courseIds) {
      const course = await req.db.courses.findOne({ _id: cid });
      if (!course) continue;
      const completed = await req.db.progress.find({ userId: req.userId, courseId: cid });
      const completedIds = completed.map(c => c.lessonId);
      const allLessons = [];
      if (course.chapters) {
        course.chapters.forEach(ch => (ch.videos || []).forEach(v => allLessons.push(v._id)));
      }
      (course.lessons || []).forEach(l => allLessons.push(l._id));
      const total = allLessons.length || 1;
      const done = allLessons.filter(id => completedIds.includes(id)).length;
      result.push({ courseId: cid, total, completed: done, percentage: Math.round((done / total) * 100) });
    }
    res.json(result);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- Profile Update ---

router.put('/profile', auth, async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;
    await req.db.users.update({ _id: req.userId }, { $set: updates });
    const updated = await req.db.users.findOne({ _id: req.userId });
    const { password: _, ...userData } = updated;
    res.json(userData);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Both passwords required' });
    if (newPassword.length < 6) return res.status(400).json({ message: 'New password must be at least 6 characters' });
    const user = await req.db.users.findOne({ _id: req.userId });
    const match = await require('bcryptjs').compare(currentPassword, user.password);
    if (!match) return res.status(400).json({ message: 'Current password is incorrect' });
    const hashed = await require('bcryptjs').hash(newPassword, 10);
    await req.db.users.update({ _id: req.userId }, { $set: { password: hashed } });
    res.json({ message: 'Password updated successfully' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/assignment/upload', auth, async (req, res) => {
  try {
    const { courseId, lessonId, title, fileUrl } = req.body;
    const assignment = await req.db.assignments.insert({
      userId: req.userId, courseId, lessonId, title, fileUrl: fileUrl || '',
      grade: null, feedback: '', submittedAt: new Date().toISOString()
    });
    res.status(201).json(assignment);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- Referral & Token System ---

const { computeTokens, TOKEN_VALUE_RS } = require('../utils/referral');

async function getTokenBalance(db, userId) {
  const txs = await db.tokenTransactions.find({ userId });
  return txs.reduce((sum, t) => sum + (t.type === 'earned' ? t.amount : -t.amount), 0);
}

router.get('/referral/info', auth, async (req, res) => {
  try {
    const user = await req.db.users.findOne({ _id: req.userId });
    if (!user.referralCode) {
      const { generateReferralCode } = require('../utils/referral');
      let code = generateReferralCode(user.name);
      for (let i = 0; i < 5; i++) {
        const exists = await req.db.users.findOne({ referralCode: code });
        if (!exists) break;
        code = generateReferralCode(user.name);
      }
      await req.db.users.update({ _id: user._id }, { $set: { referralCode: code } });
      user.referralCode = code;
    }

    const balance = await getTokenBalance(req.db, req.userId);
    const txs = await req.db.tokenTransactions.find({ userId: req.userId }).sort({ createdAt: -1 });
    const referrals = await req.db.referrals.find({ $or: [{ referrerId: req.userId }, { refereeId: req.userId }] }).sort({ createdAt: -1 });
    const enrolled = await req.db.referrals.find({ referrerId: req.userId });
    const totalReferred = enrolled.length;
    const totalEarned = txs.filter(t => t.type === 'earned').reduce((s, t) => s + t.amount, 0);
    const totalSpent = txs.filter(t => t.type === 'spent').reduce((s, t) => s + t.amount, 0);

    res.json({
      referralCode: user.referralCode,
      balance,
      totalEarned,
      totalSpent,
      totalReferred,
      tokenValueRs: TOKEN_VALUE_RS,
      history: txs.slice(0, 50),
      referrals: referrals.slice(0, 50),
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/referral/validate/:code', auth, async (req, res) => {
  try {
    const code = req.params.code.toUpperCase().trim();
    const referrer = await req.db.users.findOne({ referralCode: code });
    if (!referrer) return res.status(404).json({ valid: false, message: 'Invalid referral code' });
    if (referrer._id === req.userId) return res.status(400).json({ valid: false, message: 'You cannot refer yourself' });
    res.json({ valid: true, referrerName: referrer.name });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
