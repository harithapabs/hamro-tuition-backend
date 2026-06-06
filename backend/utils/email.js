const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.log('Email: SMTP not configured, emails will not be sent');
    return null;
  }
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
};

const sendEmail = async ({ to, subject, html }) => {
  try {
    const t = getTransporter();
    if (!t) return;
    await t.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to, subject, html });
    console.log(`Email sent to ${to}: ${subject}`);
  } catch (err) {
    console.error('Email failed:', err.message);
  }
};

const sendWelcomeEmail = async (user) => {
  await sendEmail({
    to: user.email,
    subject: 'Welcome to Hamro Tuition!',
    html: `<div style="font-family:Arial;max-width:600px;margin:auto;padding:20px">
      <h1 style="color:#1B2A4A;">Welcome, ${user.name}!</h1>
      <p>Your account has been created successfully.</p>
      <p>Start exploring courses and begin your learning journey today.</p>
      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/courses"
         style="display:inline-block;padding:10px 20px;background:#2563EB;color:white;text-decoration:none;border-radius:8px">
        Browse Courses
      </a>
    </div>`,
  });
};

const sendPaymentApprovedEmail = async (user, courseTitle) => {
  await sendEmail({
    to: user.email,
    subject: 'Payment Approved - Course Enrolled!',
    html: `<div style="font-family:Arial;max-width:600px;margin:auto;padding:20px">
      <h1 style="color:#1B2A4A;">Payment Approved!</h1>
      <p>Dear ${user.name},</p>
      <p>Your payment has been approved and you are now enrolled in <strong>${courseTitle}</strong>.</p>
      <p>Start learning now:</p>
      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/student"
         style="display:inline-block;padding:10px 20px;background:#2563EB;color:white;text-decoration:none;border-radius:8px">
        Go to Dashboard
      </a>
    </div>`,
  });
};

const sendDoubtAnsweredEmail = async (user, courseName, question) => {
  await sendEmail({
    to: user.email,
    subject: 'Your Doubt has been Answered!',
    html: `<div style="font-family:Arial;max-width:600px;margin:auto;padding:20px">
      <h1 style="color:#1B2A4A;">Doubt Answered</h1>
      <p>Dear ${user.name},</p>
      <p>Your doubt in <strong>${courseName}</strong> has been answered.</p>
      <p><em>${question}</em></p>
      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/student/doubts"
         style="display:inline-block;padding:10px 20px;background:#2563EB;color:white;text-decoration:none;border-radius:8px">
        View Answer
      </a>
    </div>`,
  });
};

const sendCertificateEmail = async (user, courseTitle, certNumber) => {
  await sendEmail({
    to: user.email,
    subject: 'Congratulations! Certificate Generated',
    html: `<div style="font-family:Arial;max-width:600px;margin:auto;padding:20px">
      <h1 style="color:#1B2A4A;">Certificate of Completion</h1>
      <p>Congratulations ${user.name}!</p>
      <p>You have earned a certificate for completing <strong>${courseTitle}</strong>.</p>
      <p>Certificate #: <strong>${certNumber}</strong></p>
      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/student/certificates"
         style="display:inline-block;padding:10px 20px;background:#2563EB;color:white;text-decoration:none;border-radius:8px">
        View Certificate
      </a>
    </div>`,
  });
};

const sendVerificationEmail = async (user) => {
  const link = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${user.verificationToken}`;
  await sendEmail({
    to: user.email,
    subject: 'Verify your Hamro Tuition email',
    html: `<div style="font-family:Arial;max-width:600px;margin:auto;padding:20px">
      <h1 style="color:#1B2A4A;">Verify your email</h1>
      <p>Hi ${user.name},</p>
      <p>Click the button below to verify your email. This link expires in 24 hours.</p>
      <a href="${link}"
         style="display:inline-block;padding:10px 20px;background:#2563EB;color:white;text-decoration:none;border-radius:8px">
        Verify Email
      </a>
      <p style="color:#999;font-size:12px;margin-top:20px">If the button doesn't work, paste this link:<br>${link}</p>
    </div>`,
  });
};

const send2FAEmail = async (user, otp) => {
  await sendEmail({
    to: user.email,
    subject: 'Your Hamro Tuition login code',
    html: `<div style="font-family:Arial;max-width:600px;margin:auto;padding:20px">
      <h1 style="color:#1B2A4A;">Login Verification</h1>
      <p>Hi ${user.name},</p>
      <p>Your one-time login code is:</p>
      <div style="font-size:36px;font-weight:bold;letter-spacing:8px;padding:20px;background:#f5f5f5;text-align:center;border-radius:8px;color:#1B2A4A">${otp}</div>
      <p style="color:#999;font-size:12px;margin-top:20px">This code expires in 10 minutes. If you didn't try to log in, please change your password.</p>
    </div>`,
  });
};

const sendPasswordResetEmail = async (user, token) => {
  const link = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
  await sendEmail({
    to: user.email,
    subject: 'Reset your Hamro Tuition password',
    html: `<div style="font-family:Arial;max-width:600px;margin:auto;padding:20px">
      <h1 style="color:#1B2A4A;">Password Reset</h1>
      <p>Hi ${user.name},</p>
      <p>Click the button below to reset your password. This link expires in 1 hour.</p>
      <a href="${link}"
         style="display:inline-block;padding:10px 20px;background:#2563EB;color:white;text-decoration:none;border-radius:8px">
        Reset Password
      </a>
      <p style="color:#999;font-size:12px;margin-top:20px">If you didn't request this, you can safely ignore this email.</p>
    </div>`,
  });
};

module.exports = { sendWelcomeEmail, sendPaymentApprovedEmail, sendDoubtAnsweredEmail, sendCertificateEmail, sendVerificationEmail, send2FAEmail, sendPasswordResetEmail };
