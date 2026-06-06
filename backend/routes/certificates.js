const express = require('express');
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const { auth } = require('../middleware/auth');
const { sendCertificateEmail } = require('../utils/email');
const router = express.Router();

const certDir = path.join(__dirname, '..', 'uploads', 'certificates');
if (!fs.existsSync(certDir)) fs.mkdirSync(certDir, { recursive: true });

router.get('/', auth, async (req, res) => {
  try {
    const certs = await req.db.certificates.find({ userId: req.userId }).sort({ createdAt: -1 });
    const result = [];
    for (const c of certs) {
      const course = await req.db.courses.findOne({ _id: c.courseId });
      result.push({ ...c, course: course ? { title: course.title, category: course.category, instructor: course.instructor } : { title: 'Unknown' } });
    }
    res.json(result);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/:id/pdf', async (req, res) => {
  try {
    const token = req.query.token || req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Auth required' });
    let decoded;
    try { decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET); } catch { return res.status(401).json({ message: 'Invalid token' }); }
    const cert = await req.db.certificates.findOne({ _id: req.params.id });
    if (!cert) return res.status(404).json({ message: 'Certificate not found' });
    if (cert.userId !== decoded.id) {
      const admin = await req.db.users.findOne({ _id: decoded.id });
      if (!admin || admin.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    }
    const pdfPath = cert.pdfPath || path.join(certDir, `${cert._id}.pdf`);
    if (fs.existsSync(pdfPath)) {
      return res.sendFile(pdfPath);
    }
    const doc = new PDFDocument({ layout: 'landscape', size: 'A4', margin: 40 });
    const writeStream = fs.createWriteStream(pdfPath);
    doc.pipe(writeStream);

    const pageW = doc.page.width, pageH = doc.page.height;
    doc.rect(0, 0, pageW, pageH).fill('#0B1A30');

    doc.rect(15, 15, pageW - 30, pageH - 30).lineWidth(2).stroke('#C9A84C');
    doc.rect(20, 20, pageW - 40, pageH - 40).lineWidth(1).stroke('#C9A84C');

    doc.fontSize(28).fillColor('#C9A84C').font('Times-Bold').text('CERTIFICATE', 0, 80, { align: 'center' });
    doc.fontSize(14).fillColor('#C9A84C').font('Times-Roman').text('of Completion', 0, 115, { align: 'center' });

    const name = cert.studentName || 'Student';
    doc.fontSize(36).fillColor('#FFFFFF').font('Times-Bold').text(name, 0, 165, { align: 'center' });

    doc.fontSize(12).fillColor('#8899AA').font('Times-Roman').text('has successfully completed the course', 0, 215, { align: 'center' });
    doc.fontSize(20).fillColor('#C9A84C').font('Times-Bold').text(cert.courseTitle || 'Course', 0, 240, { align: 'center' });
    doc.fontSize(10).fillColor('#8899AA').font('Times-Roman').text(`Issued on: ${new Date(cert.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}  |  Certificate #: ${cert.certNumber || ''}`, 0, 280, { align: 'center' });

    doc.fontSize(10).fillColor('#8899AA').font('Times-Roman').text(`Instructor: ${cert.instructor || 'Hamro Tuition'}`, 0, 310, { align: 'center' });

    doc.fontSize(8).fillColor('#556677').font('Times-Roman').text('www.hamrotuition.com', 0, pageH - 50, { align: 'center' });

    doc.end();
    await new Promise(resolve => writeStream.on('finish', resolve));
    res.sendFile(pdfPath);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/generate', auth, async (req, res) => {
  try {
    const { courseId } = req.body;
    if (!courseId) return res.status(400).json({ message: 'courseId required' });

    const existing = await req.db.certificates.findOne({ userId: req.userId, courseId });
    if (existing) return res.status(400).json({ message: 'Certificate already exists for this course' });

    const course = await req.db.courses.findOne({ _id: courseId });
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const user = await req.db.users.findOne({ _id: req.userId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const cert = await req.db.certificates.insert({
      userId: req.userId,
      courseId,
      studentName: user.name,
      courseTitle: course.title,
      instructor: course.instructor || 'Hamro Tuition',
      issuedAt: new Date().toISOString(),
      certNumber: 'HC-' + Date.now().toString(36).toUpperCase(),
    });

    sendCertificateEmail(user, course.title, cert.certNumber);

    res.status(201).json(cert);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
