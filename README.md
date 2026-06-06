# Hamro Tuition - Online Course Platform

A complete online course selling platform with video lessons, quizzes, certificates, payments, and admin dashboard.

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express + MongoDB (or NeDB for local dev)
- **Storage**: Cloudinary (videos, PDFs, images)
- **Auth**: JWT + httpOnly cookies + refresh tokens + 2FA + CSRF
- **Hosting**: Firebase Hosting (frontend) + Render (backend)
- **Database**: MongoDB Atlas (production) / NeDB (local dev)

## Features

### For Students
- Browse and purchase courses
- Watch video lessons with progress tracking
- Take quizzes and exams
- Earn certificates upon course completion
- Referral system (earn tokens for inviting friends)
- Token-based discounts (1 token = Rs 100)
- Profile management

### For Admins
- Course management (CRUD with video upload)
- Student management
- Payment approval (Khalti/eSewa)
- Fraud detection (risk scoring)
- Audit logs
- Analytics dashboard

## Local Development

```bash
# Backend
cd backend
npm install
cp .env.example .env  # fill in credentials
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

## Deployment

See [DEPLOY.md](./DEPLOY.md) for full deployment guide.

## Security

See [SECURITY.md](./SECURITY.md) for security implementation details.

## Test Accounts

- **Student**: `ram@test.com` / `student123`
- **Admin**: `admin@hamrotuition.com` / `admin123`
