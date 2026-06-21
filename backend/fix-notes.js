const mongoose = require('mongoose');

const schema = new mongoose.Schema({}, { strict: false, versionKey: false, _id: false });
const Course = mongoose.model('courses', schema, 'courses');

async function main() {
  await mongoose.connect('mongodb+srv://hamroadmin:Hamro%402044@hamrotuition.ihfzeyc.mongodb.net/hamrotuition?appName=hamrotuition&retryWrites=true&w=majority', {
    serverSelectionTimeoutMS: 10000,
  });
  
  // Use raw collection directly
  const raw = Course.collection;
  
  const course = await raw.findOne({ title: { $regex: 'Class 12 Mathematics' } });
  if (!course) { console.log('Not found'); await mongoose.disconnect(); return; }
  
  console.log('ID:', course._id);
  console.log('Type:', typeof course._id);
  console.log('Chapters:', course.chapters?.length);
  
  for (let i = 0; i < (course.chapters || []).length; i++) {
    if (course.chapters[i].notes?.length > 0) {
      console.log(`Chapter ${i}: ${course.chapters[i].notes.length} notes`);
    }
  }
  
  // Clear notes
  const chapters = course.chapters.map(ch => ({ ...ch, notes: [] }));
  const result = await raw.updateOne({ _id: course._id }, { $set: { chapters } });
  console.log('Update:', JSON.stringify(result));
  
  // Verify
  const verify = await raw.findOne({ _id: course._id });
  let totalNotes = 0;
  for (const ch of verify.chapters || []) {
    totalNotes += (ch.notes?.length || 0);
  }
  console.log('Remaining notes:', totalNotes);
  
  await mongoose.disconnect();
}

main().catch(e => { console.error(e.message); process.exit(1); });
