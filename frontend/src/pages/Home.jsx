import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaGraduationCap, FaBook, FaFlask, FaLaptopCode, FaUniversity, FaStar,
  FaUserTie, FaUsers, FaArrowRight, FaQuoteLeft, FaBell,
  FaChalkboardTeacher, FaSmile, FaCalendarAlt,
} from 'react-icons/fa';
import ParticleBackground from '../components/ParticleBackground';
import { courseAPI, noticeAPI } from '../utils/api';

const categories = [
  { key: 'School', title: 'School Level', icon: FaBook, subjects: 'Class 8, 9, 10 — Science, Math, English', gradient: 'from-green-400 to-emerald-500', desc: 'Build strong fundamentals' },
  { key: 'Plus2', title: '+2 Level', icon: FaLaptopCode, subjects: 'Science / Management / Humanities', gradient: 'from-orange-400 to-red-500', desc: 'Specialized streams' },
  { key: 'Bachelor', title: 'Bachelor Level', icon: FaUniversity, subjects: 'BSc, BBA, BBS, BE, etc.', gradient: 'from-pink-400 to-rose-500', desc: 'Higher education' },
  { key: 'Master', title: 'Master Level', icon: FaUniversity, subjects: 'MA, MSc, MEd, MBA, etc.', gradient: 'from-indigo-400 to-purple-600', desc: 'Advanced studies' },
  { key: 'Aayog', title: 'Aayog Tayari', icon: FaBook, subjects: 'Loksewa, Kharidar, Nayab Subba', gradient: 'from-red-400 to-orange-500', desc: 'Civil service prep' },
];

const sampleCourses = [
  { id: 's1', title: 'Science for Class 10 - Complete Guide', category: 'School', instructor: 'Ram Sharma', rating: 4.8, numReviews: 234, price: 2999, students: 1542 },
  { id: 's2', title: 'Mathematics Mastery - Class 8 & 9', category: 'School', instructor: 'Sita Adhikari', rating: 4.7, numReviews: 189, price: 2499, students: 1287 },
  { id: 's3', title: '+2 Physics: Mechanics & Waves', category: 'Plus2', instructor: 'Hari Poudel', rating: 4.9, numReviews: 312, price: 3999, students: 2104 },
  { id: 's4', title: 'English Grammar & Composition', category: 'School', instructor: 'Anita Gurung', rating: 4.6, numReviews: 156, price: 1999, students: 987 },
  { id: 's5', title: 'Bachelor Mathematics - Calculus & Algebra', category: 'Bachelor', instructor: 'Dr. Krishna Thapa', rating: 4.8, numReviews: 98, price: 4999, students: 654 },
  { id: 's6', title: 'Chemistry for +2: Complete Syllabus', category: 'Plus2', instructor: 'Maya Devi', rating: 4.7, numReviews: 276, price: 3499, students: 1876 },
];

const testimonials = [
  { name: 'Aarav Adhikari', role: 'Class 10 Student', quote: 'Hamro Tuition made SEE preparation so much easier. The video lessons are crystal clear and the teachers are always there to help.', rating: 5, avatar: 'AA' },
  { name: 'Sneha Shrestha', role: '+2 Science Student', quote: 'The physics and chemistry courses are amazing! I went from struggling to scoring A in my exams. Highly recommended for all +2 students.', rating: 5, avatar: 'SS' },
  { name: 'Bibek Thapa', role: 'Bachelor Student', quote: 'As a bachelor student, I was looking for quality math tutorials. Hamro Tuition delivered beyond expectations. The syllabus is perfectly structured.', rating: 5, avatar: 'BT' },
];

const categoryGradients = {
  School: 'from-green-400 to-emerald-500',
  Plus2: 'from-orange-400 to-red-500',
  Bachelor: 'from-pink-400 to-rose-500',
  Master: 'from-indigo-400 to-purple-600',
  Aayog: 'from-red-400 to-orange-500',
};

const categoryBadge = {
  School: 'bg-green-100 text-green-700',
  Plus2: 'bg-orange-100 text-orange-700',
  Bachelor: 'bg-pink-100 text-pink-700',
  Master: 'bg-indigo-100 text-indigo-700',
  Aayog: 'bg-red-100 text-red-700',
};

const CountUp = ({ end, duration = 2000, suffix = '', prefix = '' }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !hasStarted) setHasStarted(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;
    let startTime = null;
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [hasStarted, end, duration]);

  return (
    <span ref={ref} className="count-up">
      {prefix}{count}{suffix}
    </span>
  );
};

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.5 },
};

const staggerContainer = {
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true },
  transition: { staggerChildren: 0.1 },
};

const Home = ({ onLoginClick }) => {
  const [notices, setNotices] = useState([]);
  const [featuredCourses, setFeaturedCourses] = useState(sampleCourses);
  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: courses } = await courseAPI.getAll();
        if (courses?.length >= 4) setFeaturedCourses(courses.slice(0, 6));
      } catch {}
      try {
        const { data } = await noticeAPI.getAll();
        setNotices(data);
      } catch {}
      try {
        const { data } = await courseAPI.getApprovedReviews();
        setTestimonials(Array.isArray(data) ? data : []);
      } catch {}
    };
    fetchData();
  }, []);

  return (
    <div className="overflow-hidden">
      {/* A) Hero Section */}
      <section className="relative min-h-screen flex items-center bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-900 overflow-hidden">
        <ParticleBackground />
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/3 right-1/4 w-4 h-4 bg-white/30 rounded-full floating" />
        <div className="absolute bottom-1/4 left-1/3 w-6 h-6 bg-white/20 rounded-full floating" style={{ animationDelay: '2s' }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-blue-200 text-lg md:text-xl mb-4"
          >
            Welcome to
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-4"
          >
            Hamro <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-cyan-200">Tuition</span>
          </motion.h1>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="h-1 w-32 bg-gradient-to-r from-blue-400 to-cyan-300 mx-auto rounded-full mb-6"
          />
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-blue-100 text-lg md:text-xl max-w-2xl mx-auto mb-8"
          >
            Learn From Nepal's Best Teachers. Class 8 to Bachelor Level.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="text-blue-200/80 text-base max-w-xl mx-auto mb-8"
          >
            Join thousands of students learning from Nepal's best educators. Quality education at your fingertips.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <Link
              to="/courses"
              className="px-8 py-3 bg-white text-blue-700 font-semibold rounded-full hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl"
            >
              Get Started Free <FaArrowRight className="inline ml-2 text-sm" />
            </Link>
            <Link
              to="/courses"
              className="px-8 py-3 border-2 border-white/30 text-white font-semibold rounded-full hover:bg-white/10 transition-all backdrop-blur-sm"
            >
              Explore Courses
            </Link>
          </motion.div>
        </div>

        {/* Marquee Course Slider */}
        {featuredCourses.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 overflow-hidden">
            <div className="flex gap-5 animate-marquee py-4">
              {[...featuredCourses, ...featuredCourses].map((course, i) => (
                <Link key={i} to={`/course/${course._id || course.id}`}
                  className="flex-shrink-0 w-64 bg-white/90 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow group">
                  <p className="text-gray-900 font-semibold text-sm truncate group-hover:text-blue-600 transition-colors">{course.title}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-400">{course.category}</span>
                    <span className="text-sm font-bold text-blue-600">{course.price > 0 ? `रू ${course.price.toLocaleString()}` : 'Free'}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* B) Features/Categories Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              Learn at Every Level
            </h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              Comprehensive courses designed for every academic level in Nepal's education system
            </p>
          </motion.div>

          <motion.div {...staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.key}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="group"
              >
                <Link to={`/courses?category=${cat.key}`} className="block">
                  <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 p-6 text-center border border-gray-100">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <cat.icon className="text-2xl text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1">{cat.title}</h3>
                    <p className="text-xs text-gray-400 mb-3 line-clamp-1">{cat.subjects}</p>
                    <p className="text-xs text-gray-400 mb-3">{cat.desc}</p>
                    <span className="text-blue-600 text-sm font-medium group-hover:gap-2 inline-flex items-center gap-1 transition-all">
                      View Courses <FaArrowRight className="text-xs" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* C) Featured Courses Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Popular Courses</h2>
              <p className="text-gray-500 mt-2">Most enrolled courses by students like you</p>
            </div>
            <Link to="/courses" className="hidden sm:flex items-center gap-2 text-blue-600 font-medium hover:gap-3 transition-all">
              View All <FaArrowRight className="text-sm" />
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCourses.map((course, i) => (
              <motion.div
                key={course.id || course._id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <Link to={`/course/${course._id || course.id}`} className="block group">
                  <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div
                      className={`h-44 bg-gradient-to-br ${categoryGradients[course.category] || 'from-blue-400 to-indigo-500'} relative overflow-hidden bg-gray-200`}
                      style={course.thumbnail ? { backgroundImage: `url(${course.thumbnail})`, backgroundSize: 'cover', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' } : {}}
                    >
                      {!course.thumbnail && (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-5xl font-bold text-white/20">{course.category === 'School' ? 'S' : course.category === 'Plus2' ? '+2' : course.category === 'Bachelor' ? 'B' : course.category === 'Master' ? 'M' : course.category === 'Aayog' ? 'A' : '?'}</span>
                        </div>
                      )}
                      {course.price === 0 && (
                        <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium z-10">Free</div>
                      )}
                      <div className="absolute bottom-3 right-3 z-10">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm ${categoryBadge[course.category] || 'bg-white/90 text-gray-800'}`}>
                           {course.category === 'School' ? 'School Level' : course.category === 'Plus2' ? '+2 Level' : course.category === 'Bachelor' ? 'Bachelor' : course.category === 'Master' ? 'Master' : course.category === 'Aayog' ? 'Aayog Tayari' : course.category}
                        </span>
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-semibold text-gray-900 text-base mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {course.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                        <FaUserTie className="text-gray-400" />
                        <span>{course.instructor || 'Hamro Tuition'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                        <FaUsers className="text-gray-400" />
                        <span>{course.students || 0} students</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <FaStar className="text-yellow-400 text-sm" />
                          <span className="text-sm font-medium text-gray-700">{course.rating?.toFixed(1)}</span>
                          <span className="text-xs text-gray-400">({course.numReviews || 0})</span>
                        </div>
                        <span className="text-lg font-bold text-blue-600">
                          {course.price > 0 ? `रू ${course.price.toLocaleString()}` : 'Free'}
                        </span>
                      </div>
                      <button className="w-full mt-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors">
                        Enroll Now
                      </button>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.div {...fadeUp} className="text-center mt-8 sm:hidden">
            <Link to="/courses" className="inline-flex items-center gap-2 text-blue-600 font-medium">
              View All Courses <FaArrowRight className="text-sm" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* D) Stats Section */}
      <section className="py-20 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-900 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 {...fadeUp} className="text-3xl md:text-4xl font-bold text-center mb-12">
            Our Impact in Numbers
          </motion.h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: FaUsers, end: 5000, suffix: '+', label: 'Students Enrolled' },
              { icon: FaBook, end: 200, suffix: '+', label: 'Courses' },
              { icon: FaChalkboardTeacher, end: 50, suffix: '+', label: 'Expert Teachers' },
              { icon: FaSmile, end: 98, suffix: '%', label: 'Satisfaction Rate' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="text-center p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10"
              >
                <stat.icon className="text-3xl text-blue-300 mx-auto mb-3" />
                <div className="text-4xl md:text-5xl font-bold mb-1">
                  <CountUp end={stat.end} suffix={stat.suffix} duration={2500} />
                </div>
                <div className="text-blue-200 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* E) Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">What Our Students Say</h2>
            <p className="text-gray-500 mt-2 max-w-xl mx-auto">
              Hear from students who have transformed their learning journey with us
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(testimonials.length > 0 ? testimonials : []).map((t, i) => (
              <motion.div
                key={t._id || i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-100"
              >
                <FaQuoteLeft className="text-blue-100 text-3xl mb-4" />
                <p className="text-gray-600 text-sm leading-relaxed mb-4">"{t.comment}"</p>
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <FaStar key={s} className={`text-xs ${s <= (t.rating || 0) ? 'text-yellow-400' : 'text-gray-200'}`} />
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                    {t.user?.profilePic ? (
                      <img src={t.user.profilePic} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-blue-600 font-semibold text-sm">{t.user?.name?.charAt(0)?.toUpperCase() || 'S'}</span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm">{t.user?.name || 'Student'}</h4>
                    <p className="text-xs text-gray-400">{t.course?.title || ''}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* F) Notice/Announcement Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Announcements</h2>
            <p className="text-gray-500 mt-2">Stay updated with the latest news and updates</p>
          </motion.div>

          <div className="max-w-3xl mx-auto space-y-4">
            {notices.length > 0 ? (
              notices.map((notice, i) => (
                <motion.div
                  key={notice._id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-blue-500 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <FaBell className="text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900">{notice.title}</h3>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <FaCalendarAlt className="text-[10px]" />
                          {new Date(notice.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{notice.content}</p>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <>
                {[
                  { title: 'New Courses Added for 2082 Session', date: '2026-01-15', content: 'We have added new courses for the upcoming academic session 2082. Enroll now to get early bird discounts!' },
                  { title: 'Free Trial Classes Starting Soon', date: '2026-01-10', content: 'Join our free trial classes and experience quality education from the comfort of your home.' },
                  { title: 'Scholarship Program Announced', date: '2026-01-05', content: 'We are offering scholarships to deserving students. Apply now to get up to 50% fee waiver.' },
                ].map((notice, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-blue-500 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <FaBell className="text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900">{notice.title}</h3>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <FaCalendarAlt className="text-[10px]" />
                            {notice.date}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">{notice.content}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </>
            )}
          </div>
        </div>
      </section>


    </div>
  );
};

export default Home;
