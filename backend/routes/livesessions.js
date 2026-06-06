const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { auth, adminAuth } = require('../middleware/auth');
const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads', 'enrollments');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.get('/', async (req, res) => {
  try {
    const query = req.query.upcoming === 'true'
      ? { startDate: { $gte: new Date().toISOString().split('T')[0] } }
      : {};
    const sessions = await req.db.liveSessions.find(query).sort({ startDate: -1, startTime: -1 });
    res.json(sessions);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', adminAuth, async (req, res) => {
  try {
    const session = await req.db.liveSessions.insert({
      ...req.body,
      createdAt: new Date().toISOString()
    });
    res.status(201).json(session);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { _id, ...data } = req.body;
    await req.db.liveSessions.update({ _id: req.params.id }, { $set: data }, {});
    const updated = await req.db.liveSessions.findOne({ _id: req.params.id });
    res.json(updated);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', adminAuth, async (req, res) => {
  try {
    await req.db.liveSessions.remove({ _id: req.params.id }, {});
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/enroll', auth, upload.single('screenshot'), async (req, res) => {
  try {
    const { liveSessionId, courseDetail } = req.body;
    if (!liveSessionId) return res.status(400).json({ message: 'liveSessionId required' });
    const existing = await req.db.enrollments.findOne({ liveSessionId, userId: req.userId });
    if (existing) return res.status(400).json({ message: 'Already enrolled' });
    const screenshotPath = req.file ? `/uploads/enrollments/${req.file.filename}` : '';
    const enrollment = await req.db.enrollments.insert({
      liveSessionId,
      userId: req.userId,
      userName: req.user.name,
      userEmail: req.user.email,
      screenshot: screenshotPath,
      courseDetail: courseDetail || '',
      status: 'pending',
      createdAt: new Date().toISOString()
    });
    res.status(201).json(enrollment);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/my-enrollments', auth, async (req, res) => {
  try {
    const enrollments = await req.db.enrollments.find({ userId: req.userId }).sort({ createdAt: -1 });
    const liveMap = {};
    for (const e of enrollments) {
      if (!liveMap[e.liveSessionId]) {
        liveMap[e.liveSessionId] = await req.db.liveSessions.findOne({ _id: e.liveSessionId });
      }
    }
    const result = enrollments.map(e => ({ ...e, liveSession: liveMap[e.liveSessionId] || null }));
    res.json(result);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/enrollments', adminAuth, async (req, res) => {
  try {
    const enrollments = await req.db.enrollments.find({}).sort({ createdAt: -1 });
    const liveMap = {};
    const userMap = {};
    for (const e of enrollments) {
      if (!liveMap[e.liveSessionId]) liveMap[e.liveSessionId] = await req.db.liveSessions.findOne({ _id: e.liveSessionId });
      if (!userMap[e.userId]) userMap[e.userId] = await req.db.users.findOne({ _id: e.userId });
    }
    const result = enrollments.map(e => ({
      ...e, liveSession: liveMap[e.liveSessionId] || null, user: userMap[e.userId] || null
    }));
    res.json(result);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.patch('/enrollment/:id/approve', adminAuth, async (req, res) => {
  try {
    await req.db.enrollments.update({ _id: req.params.id }, { $set: { status: 'approved' } }, {});
    const updated = await req.db.enrollments.findOne({ _id: req.params.id });
    res.json(updated);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.patch('/enrollment/:id/reject', adminAuth, async (req, res) => {
  try {
    await req.db.enrollments.update({ _id: req.params.id }, { $set: { status: 'rejected' } }, {});
    const updated = await req.db.enrollments.findOne({ _id: req.params.id });
    res.json(updated);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Assignment upload config
const assignUploadDir = path.join(__dirname, '..', 'uploads', 'assignments');
if (!fs.existsSync(assignUploadDir)) {
  fs.mkdirSync(assignUploadDir, { recursive: true });
}
const assignStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, assignUploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const assignUpload = multer({ storage: assignStorage, limits: { fileSize: 10 * 1024 * 1024 } });

// Admin: Add assignment to a live session
router.post('/:id/assignments', adminAuth, async (req, res) => {
  try {
    const { title, date, pdfLink } = req.body;
    if (!title || !date || !pdfLink) return res.status(400).json({ message: 'title, date, pdfLink required' });
    const assignment = await req.db.liveAssignments.insert({
      liveSessionId: req.params.id,
      title, date, pdfLink,
      createdAt: new Date().toISOString()
    });
    res.status(201).json(assignment);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get assignments for a session (authenticated users)
router.get('/:id/assignments', auth, async (req, res) => {
  try {
    const assignments = await req.db.liveAssignments.find({ liveSessionId: req.params.id }).sort({ date: -1, createdAt: -1 });
    // If student, attach their submission info
    let result = assignments;
    if (req.user.role === 'student') {
      const submissions = await req.db.liveSubmissions.find({ liveSessionId: req.params.id, userId: req.userId });
      const subMap = {};
      submissions.forEach(s => { subMap[s.assignmentId] = s; });
      result = assignments.map(a => ({ ...a, mySubmission: subMap[a._id] || null }));
    }
    res.json(result);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Admin: Delete an assignment
router.delete('/assignments/:assignId', adminAuth, async (req, res) => {
  try {
    await req.db.liveAssignments.remove({ _id: req.params.assignId }, {});
    await req.db.liveSubmissions.remove({ assignmentId: req.params.assignId }, { multi: true });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Student: Submit solution for an assignment
// Admin: Get all submissions across all sessions
router.get('/submissions', adminAuth, async (req, res) => {
  try {
    const submissions = await req.db.liveSubmissions.find({}).sort({ submittedAt: -1 });
    const assignMap = {};
    const userMap = {};
    const sessionMap = {};
    for (const s of submissions) {
      if (!assignMap[s.assignmentId]) assignMap[s.assignmentId] = await req.db.liveAssignments.findOne({ _id: s.assignmentId });
      if (!userMap[s.userId]) userMap[s.userId] = await req.db.users.findOne({ _id: s.userId });
      if (s.liveSessionId && !sessionMap[s.liveSessionId]) sessionMap[s.liveSessionId] = await req.db.liveSessions.findOne({ _id: s.liveSessionId });
    }
    const result = submissions.map(s => ({
      ...s,
      assignment: assignMap[s.assignmentId] || null,
      user: userMap[s.userId] || null,
      liveSession: sessionMap[s.liveSessionId] || null,
    }));
    res.json(result);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/assignments/:assignId/submit', auth, assignUpload.single('file'), async (req, res) => {
  try {
    if (req.user.role !== 'student') return res.status(403).json({ message: 'Students only' });
    const assignment = await req.db.liveAssignments.findOne({ _id: req.params.assignId });
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    const existing = await req.db.liveSubmissions.findOne({ assignmentId: req.params.assignId, userId: req.userId });
    if (existing) return res.status(400).json({ message: 'Already submitted' });
    if (!req.file) return res.status(400).json({ message: 'File required' });
    const submission = await req.db.liveSubmissions.insert({
      assignmentId: req.params.assignId,
      liveSessionId: assignment.liveSessionId,
      userId: req.userId,
      userName: req.user.name,
      filePath: `/uploads/assignments/${req.file.filename}`,
      submittedAt: new Date().toISOString()
    });
    res.status(201).json(submission);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
