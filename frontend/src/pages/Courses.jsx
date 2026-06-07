import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaSearch, FaStar, FaUserTie, FaGraduationCap, FaBook, FaFlask, FaLaptopCode, FaUniversity } from 'react-icons/fa';
import { courseAPI } from '../utils/api';
import Loading from '../components/Loading';

const categories = [
  { value: '', label: 'All Courses', icon: FaGraduationCap },
  { value: 'School', label: 'School', icon: FaBook },
  { value: 'Plus2', label: '+2 Level', icon: FaLaptopCode },
  { value: 'Bachelor', label: 'Bachelor', icon: FaUniversity },
  { value: 'Master', label: 'Master', icon: FaUniversity },
  { value: 'Aayog', label: 'Aayog Tayari', icon: FaBook },
];

const categoryGradients = {
  School: 'from-green-400 to-emerald-500',
  Plus2: 'from-orange-400 to-red-500',
  Bachelor: 'from-pink-400 to-rose-500',
  Master: 'from-indigo-400 to-purple-600',
  Aayog: 'from-red-400 to-orange-500',
};

const categoryBadge = {
  School: 'border border-green-500 text-green-600 bg-white/90',
  Plus2: 'border border-orange-500 text-orange-600 bg-white/90',
  Bachelor: 'border border-pink-500 text-pink-600 bg-white/90',
  Master: 'border border-indigo-500 text-indigo-600 bg-white/90',
  Aayog: 'border border-red-500 text-red-600 bg-white/90',
};

const CourseCard = ({ course, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: index * 0.05 }}
  >
    <Link to={`/course/${course._id}`} className="block group">
      <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <div
          className={`h-44 bg-gradient-to-br ${categoryGradients[course.category] || 'from-blue-400 to-indigo-500'} relative overflow-hidden bg-gray-200`}
          style={course.thumbnail ? { backgroundImage: `url(${course.thumbnail})`, backgroundSize: 'cover', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' } : {}}
        >
          {course.thumbnail ? null : (
            <span className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-white/20">{course.category}</span>
          )}
          <div className="absolute bottom-3 right-3">
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide shadow-sm backdrop-blur-sm ${categoryBadge[course.category] || 'border border-gray-300 text-gray-600 bg-white/90'}`}
            >
              {course.category === 'School' ? 'School Level' :
               course.category === 'Plus2' ? '+2 Level' :
               course.category === 'Bachelor' ? 'Bachelor' :
               course.category === 'Master' ? 'Master' :
               course.category === 'Aayog' ? 'Aayog Tayari' : course.category}
            </motion.span>
          </div>
        </div>
        <div className="p-5">
          <h3 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {course.title}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <FaUserTie className="text-gray-400" />
            <span>{course.instructor || 'Hamro Tuition'}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <FaStar className="text-yellow-400 text-sm" />
              <span className="text-sm font-medium text-gray-700">{course.rating?.toFixed(1) || '0.0'}</span>
              <span className="text-xs text-gray-400">({course.numReviews || 0})</span>
            </div>
            <span className="text-lg font-bold text-blue-600">
              {course.price > 0 ? `रू ${course.price.toLocaleString()}` : 'Free'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  </motion.div>
);

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl overflow-hidden shadow-md animate-pulse">
    <div className="h-44 bg-gray-200" />
    <div className="p-5 space-y-3">
      <div className="h-5 bg-gray-200 rounded w-3/4" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
      <div className="flex justify-between">
        <div className="h-4 bg-gray-200 rounded w-1/4" />
        <div className="h-5 bg-gray-200 rounded w-1/4" />
      </div>
    </div>
  </div>
);

const Courses = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || '');

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const params = {};
        if (activeCategory) params.category = activeCategory;
        if (searchQuery) params.search = searchQuery;
        const { data } = await courseAPI.getAll(Object.keys(params).length ? params : undefined);
        setCourses(data);
      } catch {
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [activeCategory, searchQuery]);

  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    const params = {};
    if (cat) params.category = cat;
    if (searchQuery) params.q = searchQuery;
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Our Courses
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-blue-200 text-lg max-w-2xl mx-auto"
          >
            Explore our comprehensive range of courses from Class 8 to Bachelor Level
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 max-w-xl mx-auto relative"
          >
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                const p = {};
                if (activeCategory) p.category = activeCategory;
                if (e.target.value) p.q = e.target.value;
                setSearchParams(p);
              }}
              placeholder="Search courses..."
              className="w-full pl-12 pr-4 py-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
            />
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="flex flex-wrap gap-2 justify-center">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => handleCategoryChange(cat.value)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat.value
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                  : 'bg-white text-gray-600 hover:bg-blue-50 shadow-sm'
              }`}
            >
              <cat.icon className="text-sm" />
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
          </div>
         ) : courses.length === 0 ? (
          <div className="text-center py-16">
            <FaGraduationCap className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No courses found</h3>
            <p className="text-gray-400">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course, i) => (
              <CourseCard key={course._id} course={course} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Courses;
