const bcrypt = require('bcryptjs');
require('dotenv').config();

(async () => {
  try {
    const db = require('./config/db');

    console.log('Clearing existing data...');
    await db.users.remove({});
    await db.courses.remove({});
    await db.notices.remove({});
    await db.quizzes.remove({});
    await db.paymentSettings.remove({});
    console.log('Cleared');

    const hashedAdmin = await bcrypt.hash('admin123', 10);
    const admin = await db.users.insert({
      name: 'Admin',
      email: 'admin@hamrotuition.com',
      password: hashedAdmin,
      role: 'admin',
      enrolledCourses: [],
      profilePic: '',
      tokens: 0,
      createdAt: new Date().toISOString()
    });
    console.log('✅ Admin: admin@hamrotuition.com / admin123');

    const hashedStudent = await bcrypt.hash('student123', 10);
    await db.users.insert([
      { name: 'Ram Sharma', email: 'ram@test.com', password: hashedStudent, role: 'student', enrolledCourses: [], profilePic: '', tokens: 0, createdAt: new Date().toISOString() },
      { name: 'Sita Poudel', email: 'sita@test.com', password: hashedStudent, role: 'student', enrolledCourses: [], profilePic: '', tokens: 0, createdAt: new Date().toISOString() },
      { name: 'Hari Magar', email: 'harithapabs@gmail.com', password: hashedStudent, role: 'admin', enrolledCourses: [], profilePic: '', tokens: 0, createdAt: new Date().toISOString() },
    ]);
    console.log('✅ Students + extra admin created');

    const courses = await db.courses.insert([
      {
        title: 'Class 10 Compulsory Mathematics',
        description: 'Complete maths for SEE preparation. Covers Algebra, Geometry, Trigonometry, Statistics, and more. Designed by experienced teachers.',
        price: 2999,
        thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800',
        instructor: 'Rajesh Hamal',
        category: 'School',
        rating: 4.8,
        numReviews: 124,
        lessons: [
          { title: 'Introduction to Algebra', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', notesPdf: '', duration: '45:00', isFree: true },
          { title: 'Linear Equations', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', notesPdf: '', duration: '38:00', isFree: false },
          { title: 'Quadratic Equations', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', notesPdf: '', duration: '52:00', isFree: false },
          { title: 'Geometry & Trigonometry', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', notesPdf: '', duration: '60:00', isFree: false },
        ],
        createdAt: new Date().toISOString()
      },
      {
        title: 'Class 11 Physics - Mechanics',
        description: 'Master physics for NEB board exam. Comprehensive coverage of mechanics with solved problems.',
        price: 3499,
        thumbnail: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=800',
        instructor: 'Dr. Anup Ghimire',
        category: 'Plus2',
        rating: 4.9,
        numReviews: 89,
        lessons: [
          { title: 'Physical Quantities', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', notesPdf: '', duration: '40:00', isFree: true },
          { title: 'Kinematics', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', notesPdf: '', duration: '55:00', isFree: false },
          { title: "Newton's Laws", videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', notesPdf: '', duration: '62:00', isFree: false },
        ],
        createdAt: new Date().toISOString()
      },
      {
        title: 'Class 12 English Guide',
        description: 'Complete English for NEB board exam. Grammar, literature, writing skills.',
        price: 1999,
        thumbnail: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800',
        instructor: 'Maya Devi Gurung',
        category: 'Plus2',
        rating: 4.7,
        numReviews: 156,
        lessons: [
          { title: 'Grammar Fundamentals', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', notesPdf: '', duration: '35:00', isFree: true },
          { title: 'Tenses & Aspects', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', notesPdf: '', duration: '42:00', isFree: false },
        ],
        createdAt: new Date().toISOString()
      },
      {
        title: 'Bachelor Business Studies',
        description: 'BBS/BBA first year complete course. Principles of Management, Accounting, Economics.',
        price: 4999,
        thumbnail: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800',
        instructor: 'Prof. Krishna Bhattarai',
        category: 'Bachelor',
        rating: 4.6,
        numReviews: 73,
        lessons: [
          { title: 'Introduction to Business', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', notesPdf: '', duration: '30:00', isFree: true },
        ],
        createdAt: new Date().toISOString()
      },
      {
        title: 'Class 8 Science',
        description: 'Interactive science with experiments. Perfect for young learners.',
        price: 2499,
        thumbnail: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800',
        instructor: 'Santosh Thapa',
        category: 'School',
        rating: 4.5,
        numReviews: 98,
        lessons: [
          { title: 'Scientific Learning', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', notesPdf: '', duration: '25:00', isFree: true },
          { title: 'Force & Motion', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', notesPdf: '', duration: '33:00', isFree: false },
        ],
        createdAt: new Date().toISOString()
      },
      {
        title: 'Class 9 Computer Science',
        description: 'Programming & IT fundamentals. Learn coding from scratch.',
        price: 2799,
        thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800',
        instructor: 'Bishal Neupane',
        category: 'School',
        rating: 4.8,
        numReviews: 67,
        lessons: [
          { title: 'Computer Basics', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', notesPdf: '', duration: '28:00', isFree: true },
          { title: 'Programming Concepts', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', notesPdf: '', duration: '40:00', isFree: false },
        ],
        createdAt: new Date().toISOString()
      },
    ]);
    console.log(`✅ ${courses.length} courses created`);

    await db.notices.insert([
      { title: 'New Batch for Class 10 SEE 2081', content: 'Enroll now for intensive SEE prep. Classes from Sunday!', isActive: true, createdAt: new Date().toISOString() },
      { title: 'Free Trial Classes for +2 Science', content: 'Try our premium teaching for Class 11 Science this week.', isActive: true, createdAt: new Date().toISOString() },
    ]);
    console.log('✅ Notices created');

    await db.quizzes.insert({
      courseId: String(courses[0]._id),
      lessonId: '0',
      title: 'Algebra Basics Quiz',
      questions: [
        { question: 'What is x + 2 = 5, find x', options: ['2', '3', '5', '7'], correctAnswer: 1 },
        { question: 'What is 2x = 10, find x', options: ['2', '5', '10', '20'], correctAnswer: 1 },
        { question: 'Simplify: a + a + a', options: ['a', '3a', 'a³', '3'], correctAnswer: 1 },
      ],
      timeLimit: 10,
      createdAt: new Date().toISOString()
    });
    console.log('✅ Quiz created');

    await db.paymentSettings.insert({
      khaltiNumber: '98XXXXXXXX',
      esewaNumber: '98XXXXXXXX',
      updatedAt: new Date().toISOString()
    });
    console.log('✅ Payment settings created');

    console.log('\n🎉 Production database seeded successfully!');
    console.log('\n📧 Admin: admin@hamrotuition.com / admin123');
    console.log('📧 Student: ram@test.com / student123');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
})();
