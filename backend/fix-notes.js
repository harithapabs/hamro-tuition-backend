const mongoose = require('mongoose');

const schema = new mongoose.Schema({}, { strict: false, versionKey: false });
const Course = mongoose.model('courses', schema, 'courses');

async function main() {
  await mongoose.connect('mongodb+srv://hamroadmin:Hamro%402044@hamrotuition.ihfzeyc.mongodb.net/hamrotuition?appName=hamrotuition&retryWrites=true&w=majority', {
    serverSelectionTimeoutMS: 10000,
  });
  
  const raw = Course.collection;
  const course = await raw.findOne({ title: { $regex: 'Class 12 Mathematics' } });
  
  console.log('ID:', course._id);
  
  for (let i = 0; i < (course.chapters || []).length; i++) {
    const ch = course.chapters[i];
    if (ch.notes && ch.notes.length > 0) {
      console.log(`Chapter ${i}: ${ch.notes.length} notes`);
      for (const n of ch.notes) {
        console.log(`  - ${n.title} | has url: ${!!n.url} | has content: ${!!n.content}`);
      }
    }
  }
  
  // Clear ALL notes with old url-only format
  const chapters = course.chapters.map(ch => ({
    ...ch,
    notes: (ch.notes || []).filter(n => n.content).map(n => ({
      _id: n._id,
      title: n.title,
      content: n.content,
      createdAt: n.createdAt,
    }))
  }));
  
  let removed = 0;
  for (let i = 0; i < course.chapters.length; i++) {
    const before = course.chapters[i].notes?.length || 0;
    const after = chapters[i].notes?.length || 0;
    if (before > after) {
      console.log(`Chapter ${i}: ${before} -> ${after} (removed ${before - after} old notes)`);
      removed += before - after;
    }
  }
  
  if (removed > 0) {
    const result = await raw.updateOne({ _id: course._id }, { $set: { chapters } });
    console.log(`Cleaned ${removed} old notes. Result:`, JSON.stringify(result));
  } else {
    console.log('No old notes to clean');
  }
  
  await mongoose.disconnect();
}

main().catch(e => { console.error(e.message); process.exit(1); });
