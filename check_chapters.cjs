const d = require('C:\\xampp\\htdocs\\Hamro class\\frontend\\test_courses.json');
const courses = d.courses || d;
courses.forEach(c => {
  const ch = c.chapters ? c.chapters.length : 'NONE';
  const ls = c.lessons ? c.lessons.length : 'NONE';
  console.log(c.title + ': chapters=' + ch + ' lessons=' + ls);
});
