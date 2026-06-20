require('dotenv').config();
const mongoose = require('mongoose');

const chapters = [
  { title: 'Chapter 1: Permutation & Combination', videos: [] },
  { title: 'Chapter 2: Binomial Theorem', videos: [] },
  { title: 'Chapter 3: Complex Number', videos: [] },
  { title: 'Chapter 4: Sequence and Series', videos: [] },
  { title: 'Chapter 5: Matrix based System of Linear Equations', videos: [] },
  { title: 'Chapter 6: Properties of Triangle', videos: [] },
  { title: 'Chapter 7: Solution of Triangle', videos: [] },
  { title: 'Chapter 8: Conic Section', videos: [] },
  { title: 'Chapter 9: Product of Vectors', videos: [] },
  { title: 'Chapter 10: Correlation and Regression', videos: [] },
  { title: 'Chapter 11: Probability', videos: [] },
  { title: 'Chapter 12: Derivatives', videos: [] },
  { title: 'Chapter 13: Applications of Derivatives', videos: [] },
  { title: 'Chapter 14: Antiderivative', videos: [] },
  { title: 'Chapter 15: Differential Equations', videos: [] },
  { title: 'Chapter 16: System of Linear Equations', videos: [] },
  { title: 'Chapter 17: Linear Programming', videos: [] },
  { title: 'Chapter 18: Statics', videos: [] },
  { title: "Chapter 19: Dynamics : Newton's Laws of Motion and Projectile", videos: [] },
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const result = await db.collection('courses').updateOne(
      { _id: '6a357c84a7bfc0623fc5d732' },
      { $set: { chapters } }
    );
    console.log('Matched:', result.matchedCount, 'Modified:', result.modifiedCount);
    
    const course = await db.collection('courses').findOne({ _id: '6a357c84a7bfc0623fc5d732' });
    console.log('Course:', course.title);
    console.log('Chapters:', course.chapters.length);
    course.chapters.forEach(ch => console.log(' -', ch.title));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();
