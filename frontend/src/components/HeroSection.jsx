import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaRocket, FaBook, FaChalkboardTeacher, FaVideo, FaUsers, FaGraduationCap,
  FaStar, FaLaptop, FaPlay, FaClock,
} from 'react-icons/fa';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
};

const floatAnim = {
  animate: { y: [0, -10, 0] },
  transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
};

const stats = [
  { icon: FaUsers, end: '10,000+', label: 'Students' },
  { icon: FaChalkboardTeacher, end: '20+', label: 'Expert Teachers' },
  { icon: FaVideo, end: '100+', label: 'Video Lessons' },
  { icon: FaStar, end: '95%+', label: 'Success Rate' },
];

const HeroSection = ({ onLoginClick }) => {
  return (
    <div className="overflow-hidden">
      <section className="relative min-h-screen flex items-center bg-gradient-to-br from-blue-700 via-blue-600 to-purple-800 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-4 h-4 bg-white/30 rounded-full floating" />
        <div className="absolute bottom-1/4 left-1/3 w-6 h-6 bg-white/20 rounded-full floating" style={{ animationDelay: '2s' }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            <motion.div {...fadeUp} className="text-left">
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight mb-4"
              >
                Learn Smart. <br />
                Score <span className="text-yellow-400">Better.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-lg md:text-xl text-blue-100 mb-3 font-medium"
              >
                अब घरमै बसेर उत्कृष्ट तयारी गर्नुहोस्!
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="text-sm md:text-base text-blue-200/80 mb-8 max-w-lg leading-relaxed"
              >
                Level: School to College &nbsp;|&nbsp; Mathematics, Science &amp; More &nbsp;|&nbsp; Expert Teachers &nbsp;|&nbsp; Live + Recorded Classes &nbsp;|&nbsp; Affordable Price
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="flex flex-wrap gap-4"
              >
                <Link
                  to="/courses"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-yellow-400 text-gray-900 font-bold rounded-full hover:bg-yellow-300 transition-all shadow-lg hover:shadow-xl text-base"
                >
                  <FaRocket className="text-sm" /> Start Learning
                </Link>
                <Link
                  to="/courses"
                  className="inline-flex items-center gap-2 px-8 py-3.5 border-2 border-white/40 text-white font-semibold rounded-full hover:bg-white/10 transition-all backdrop-blur-sm text-base"
                >
                  View Courses
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="relative flex justify-center"
            >
              <div className="relative w-full max-w-md">
                <div className="relative bg-gradient-to-br from-blue-500/90 to-blue-700/90 backdrop-blur-sm rounded-3xl p-8 border border-blue-400/30 shadow-2xl">
                  <div className="absolute -top-4 -right-4 w-20 h-20 bg-yellow-400/30 rounded-full blur-xl" />
                  <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-purple-400/30 rounded-full blur-xl" />

                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-48 h-48 rounded-2xl overflow-hidden mb-4 border-4 border-white/40 shadow-lg bg-white">
                      <img src="/hero-student.png" alt="Student learning on laptop" className="w-full h-full object-cover" />
                    </div>

                    <div className="w-full bg-white/15 rounded-xl p-3 mb-3 border border-white/20">
                      <div className="flex items-center gap-2 mb-1">
                        <FaLaptop className="text-blue-200 text-sm" />
                        <span className="text-white text-sm font-medium">Hamro Tuition</span>
                      </div>
                      <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full w-3/4 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full" />
                      </div>
                      <span className="text-xs text-blue-100 mt-1 block">Course Progress: 75%</span>
                    </div>

                    <div className="flex gap-2 w-full">
                      {['Mathematics', 'Science', 'English'].map((book) => (
                        <div key={book} className="flex-1 bg-white/15 rounded-lg p-2 text-center border border-white/20">
                          <FaBook className="text-white/80 text-sm mx-auto mb-1" />
                          <span className="text-xs text-white/90">{book}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <motion.div
                  {...floatAnim}
                  className="absolute -top-6 -left-4 bg-white rounded-xl shadow-xl p-3 flex items-center gap-2 border border-gray-100 z-20"
                >
                  <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                    <FaPlay className="text-white text-xs" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">Live Classes</span>
                    <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold animate-pulse">LIVE</span>
                  </div>
                </motion.div>

                <motion.div
                  {...floatAnim}
                  transition={{ ...floatAnim.transition, delay: 1 }}
                  className="absolute -bottom-4 -left-6 bg-white rounded-xl shadow-xl p-3 flex items-center gap-2 border border-gray-100 z-20"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <FaChalkboardTeacher className="text-white text-xs" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">Expert Teachers</span>
                    <span className="text-[10px] text-gray-500">Nepal's Best Educators</span>
                  </div>
                </motion.div>

                <motion.div
                  {...floatAnim}
                  transition={{ ...floatAnim.transition, delay: 2 }}
                  className="absolute -bottom-4 -right-4 bg-white rounded-xl shadow-xl p-3 flex items-center gap-2 border border-gray-100 z-20"
                >
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                    <FaClock className="text-white text-xs" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">Recorded Lessons</span>
                    <span className="text-[10px] text-gray-500">Watch Anytime</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HeroSection;
