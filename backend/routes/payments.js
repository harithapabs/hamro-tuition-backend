const express = require('express');
const { auth } = require('../middleware/auth');
const { TOKEN_VALUE_RS } = require('../utils/referral');
const { sha256, isPlausibleBase64Image, validateTransactionId, computeRiskScore } = require('../utils/fraudDetection');
const router = express.Router();

async function getTokenBalance(db, userId) {
  const txs = await db.tokenTransactions.find({ userId });
  return txs.reduce((sum, t) => sum + (t.type === 'earned' ? t.amount : -t.amount), 0);
}

router.post('/initiate', auth, async (req, res) => {
  try {
    const { courseId, amount, referralCode, tokensUsed } = req.body;
    const course = await req.db.courses.findOne({ _id: courseId });
    if (!course) return res.status(404).json({ message: 'Course not found' });

    let useTokens = 0;
    if (tokensUsed && Number(tokensUsed) > 0) {
      const bal = await getTokenBalance(req.db, req.userId);
      useTokens = Math.min(Math.floor(Number(tokensUsed)), bal, Math.floor((amount || course.price) / TOKEN_VALUE_RS));
    }

    const finalAmount = (amount || course.price) - (useTokens * TOKEN_VALUE_RS);

    let validatedReferrer = null;
    let cleanReferral = '';
    if (referralCode) {
      cleanReferral = referralCode.toUpperCase().trim();
      const refUser = await req.db.users.findOne({ referralCode: cleanReferral });
      if (!refUser) return res.status(400).json({ message: 'Invalid referral code' });
      if (refUser._id === req.userId) return res.status(400).json({ message: 'You cannot use your own referral code' });
      validatedReferrer = refUser;
    }

    const payment = await req.db.payments.insert({
      userId: req.userId,
      courseId,
      amount: finalAmount,
      originalAmount: amount || course.price,
      tokensUsed: useTokens,
      tokensValue: useTokens * TOKEN_VALUE_RS,
      referralCode: cleanReferral,
      status: 'pending',
      paymentMethod: 'khalti',
      transactionId: 'TXN' + Date.now(),
      createdAt: new Date().toISOString()
    });

    res.json({
      payment,
      paymentUrl: `https://khalti.com/payment/?pid=${payment._id}&amount=${payment.amount * 100}`,
      message: 'Payment initiated',
      tokensApplied: useTokens,
      finalAmount,
      referrerName: validatedReferrer ? validatedReferrer.name : null,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/manual', auth, async (req, res) => {
  try {
    const { courseId, method, screenshot, transactionId, remarks, referralCode, tokensUsed } = req.body;
    if (!courseId || !method || !screenshot) {
      return res.status(400).json({ message: 'Course, payment method, and screenshot are required' });
    }

    const txCheck = validateTransactionId(method, transactionId);
    if (!txCheck.valid) {
      return res.status(400).json({ message: `Invalid transaction ID: ${txCheck.reason}` });
    }

    const imgCheck = isPlausibleBase64Image(screenshot);
    if (!imgCheck.valid) {
      return res.status(400).json({ message: imgCheck.reason });
    }

    const course = await req.db.courses.findOne({ _id: courseId });
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const existingPending = await req.db.payments.findOne({
      userId: req.userId,
      courseId,
      status: 'pending'
    });
    if (existingPending) {
      return res.status(400).json({ message: 'You already have a pending payment for this course' });
    }

    let useTokens = 0;
    if (tokensUsed && Number(tokensUsed) > 0) {
      const bal = await getTokenBalance(req.db, req.userId);
      useTokens = Math.min(Math.floor(Number(tokensUsed)), bal, Math.floor(course.price / TOKEN_VALUE_RS));
    }

    const finalAmount = course.price - (useTokens * TOKEN_VALUE_RS);

    let cleanReferral = '';
    if (referralCode) {
      cleanReferral = referralCode.toUpperCase().trim();
      const refUser = await req.db.users.findOne({ referralCode: cleanReferral });
      if (!refUser) return res.status(400).json({ message: 'Invalid referral code' });
      if (refUser._id === req.userId) return res.status(400).json({ message: 'You cannot use your own referral code' });
    }

    const screenshotHash = sha256(screenshot);
    const existingSameImage = await req.db.payments.find({ screenshotHash });
    if (existingSameImage.length > 0) {
      return res.status(400).json({
        message: 'This screenshot has already been submitted. If you believe this is an error, contact support.',
      });
    }

    const payment = await req.db.payments.insert({
      userId: req.userId,
      courseId,
      amount: finalAmount,
      originalAmount: course.price,
      tokensUsed: useTokens,
      tokensValue: useTokens * TOKEN_VALUE_RS,
      referralCode: cleanReferral,
      status: 'pending',
      paymentMethod: method,
      screenshot,
      screenshotHash,
      transactionId: (transactionId || '').trim(),
      remarks: remarks || '',
      createdAt: new Date().toISOString()
    });

    const user = await req.db.users.findOne({ _id: req.userId });
    const risk = await computeRiskScore(req.db, payment, user);

    res.status(201).json({
      message: 'Payment request submitted. Course will be unlocked within 24 hours after verification.',
      payment,
      tokensApplied: useTokens,
      finalAmount,
      risk
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/my-payments', auth, async (req, res) => {
  try {
    const payments = await req.db.payments.find({ userId: req.userId }).sort({ createdAt: -1 });
    const result = [];
    for (const p of payments) {
      const course = await req.db.courses.findOne({ _id: p.courseId });
      result.push({
        ...p,
        _type: 'course',
        course: course ? { title: course.title, price: course.price, thumbnail: course.thumbnail } : null
      });
    }
    const enrollments = await req.db.enrollments.find({ userId: req.userId }).sort({ createdAt: -1 });
    for (const e of enrollments) {
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
        paymentMethod: 'bank',
        course: { title: (live?.courseName || 'Live Session') + ' (Live)', price: live?.price ? Number(live.price) : 0 },
      });
    }
    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(result);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/', auth, async (req, res) => {
  try {
    const payments = await req.db.payments.find({ userId: req.userId }).sort({ createdAt: -1 });
    const result = [];
    for (const p of payments) {
      const course = await req.db.courses.findOne({ _id: p.courseId });
      result.push({ ...p, course: course ? { title: course.title, price: course.price, thumbnail: course.thumbnail } : null });
    }
    res.json(result);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/verify', auth, async (req, res) => {
  try {
    const { paymentId } = req.body;
    const payment = await req.db.payments.findOne({ _id: paymentId });
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    await req.db.payments.update({ _id: paymentId }, { $set: { status: 'completed' } });

    const user = await req.db.users.findOne({ _id: req.userId });
    const enrolled = user.enrolledCourses || [];
    if (!enrolled.includes(payment.courseId)) {
      enrolled.push(payment.courseId);
      await req.db.users.update({ _id: req.userId }, { $set: { enrolledCourses: enrolled } });
    }

    res.json({ message: 'Payment verified, enrollment successful', payment: { ...payment, status: 'completed' } });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/risk/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
    const payment = await req.db.payments.findOne({ _id: req.params.id });
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    const user = await req.db.users.findOne({ _id: payment.userId });
    const risk = await computeRiskScore(req.db, payment, user);
    res.json(risk);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
