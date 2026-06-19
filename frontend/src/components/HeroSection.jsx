import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaRocket, FaBook, FaChalkboardTeacher, FaVideo, FaUsers, FaGraduationCap,
  FaStar, FaLaptop, FaPlay, FaClock, FaCheckCircle,
} from 'react-icons/fa';

const GOOGLE_FORM_URL = 'https://forms.gle/iaATwc6NC5bMG3Ez6';

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
              <div className="relative w-full max-w-lg">
                <div className="relative bg-gradient-to-br from-[#001f5b] via-[#002d7a] to-[#001a4d] rounded-3xl overflow-hidden border border-blue-400/30 shadow-2xl">
                  <div className="absolute inset-0 bg-black/20" />

                  <div className="relative z-10 p-8 text-center text-white">
                    <div className="inline-block bg-red-600 px-6 py-2 rounded-full font-bold text-base mb-5 shadow-lg shadow-red-600/40 animate-pulse">
                      🎯 FREE LIVE CLASS
                    </div>

                    <h2 className="text-3xl sm:text-4xl font-extrabold mb-2 leading-tight drop-shadow-lg">
                      CLASS 12<br />MATHEMATICS
                    </h2>

                    <h3 className="text-yellow-400 font-bold text-lg mb-5 drop-shadow">
                      GRADE INCREMENT EXAM PREPARATION
                    </h3>

                    <div className="space-y-3 text-left text-sm md:text-base mb-6">
                      {[
                        'Important Board Questions',
                        'Easy Tricks & Shortcuts',
                        'Live Doubt Solving',
                        'Score Boosting Strategies',
                      ].map((item) => (
                        <div key={item} className="flex items-center gap-2">
                          <FaCheckCircle className="text-green-400 flex-shrink-0" />
                          <span className="text-blue-100">{item}</span>
                        </div>
                      ))}
                    </div>

                    <a
                      href={GOOGLE_FORM_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-10 rounded-full text-lg transition-all shadow-lg shadow-red-600/40 hover:shadow-red-600/60 hover:scale-105 active:scale-95 animate-pulse cursor-pointer"
                    >
                      REGISTER NOW
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HeroSection;
