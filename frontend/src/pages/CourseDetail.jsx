import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaStar, FaUserTie, FaClock, FaDownload, FaChevronDown, FaPlay,
  FaGraduationCap, FaCheckCircle, FaRegClock, FaBookOpen,
} from 'react-icons/fa';
import { courseAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import toast from 'react-hot-toast';

const tabs = ['Description', 'Syllabus', 'Reviews'];

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

const CourseDetail = ({ onLoginClick }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Description');
  const [expandedLesson, setExpandedLesson] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const isEnrolled = user?.enrolledCourses?.some((c) => {
    if (typeof c === 'string') return c === id;
    return c._id === id;
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [courseRes, reviewsRes] = await Promise.all([
          courseAPI.getOne(id),
          courseAPI.getReviews(id).catch(() => ({ data: [] })),
        ]);
        setCourse(courseRes.data);
        setReviews(reviewsRes.data);
      } catch {
        toast.error('Course not found');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) { onLoginClick(); return; }
    setReviewSubmitting(true);
    try {
      await courseAPI.addReview(id, reviewForm);
      toast.success('Review submitted for approval');
      setReviewForm({ rating: 5, comment: '' });
      const { data } = await courseAPI.getReviews(id);
      setReviews(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen pt-16 bg-gray-50"><Loading /></div>;
  if (!course) return (
    <div className="min-h-screen pt-16 bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <FaBookOpen className="text-6xl text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-600">Course not found</h2>
        <Link to="/courses" className="mt-4 inline-block text-blue-600 hover:underline">Back to courses</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className={`bg-gradient-to-r ${categoryGradients[course.category] || 'from-blue-700 to-indigo-900'} text-white`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-2">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-3 ${categoryBadge[course.category] || 'bg-white/20 text-white'}`}>
                {course.category === 'School' ? 'School Level' :
                 course.category === 'Plus2' ? '+2 Level' :
                 course.category === 'Bachelor' ? 'Bachelor' :
                 course.category === 'Master' ? 'Master' :
                 course.category === 'Aayog' ? 'Aayog Tayari' : course.category}
              </span>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{course.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-white/80 mb-4">
                <div className="flex items-center gap-2">
                  <FaUserTie />
                  <span>{course.instructor || 'Hamro Tuition'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <FaStar className="text-yellow-300" />
                  <span>{course.rating?.toFixed(1) || '0.0'}</span>
                  <span className="text-white/60">({course.numReviews || 0} reviews)</span>
                </div>
                <div className="flex items-center gap-1">
                  <FaBookOpen />
                  <span>{course.lessons?.length || 0} lessons</span>
                </div>
              </div>
              <p className="text-white/70 text-sm leading-relaxed line-clamp-3">{course.description}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className={`h-40 rounded-xl bg-gradient-to-br ${categoryGradients[course.category] || 'from-blue-400 to-indigo-500'} flex items-center justify-center mb-4`}>
                <FaPlay className="text-4xl text-white/60" />
              </div>
              <div className="text-3xl font-bold mb-4">
                {course.price > 0 ? `रू ${course.price.toLocaleString()}` : 'Free'}
              </div>
              {isEnrolled ? (
                <Link
                  to={`/dashboard/student/course/${course._id}`}
                  className="block w-full py-3 bg-green-500 hover:bg-green-600 text-white text-center font-medium rounded-xl transition-colors"
                >
                  Go to Course
                </Link>
              ) : (
                <button
                  onClick={() => {
                    if (!user) { onLoginClick(); return; }
                    navigate(`/checkout/${id}`);
                  }}
                  className="w-full py-3 bg-white text-blue-700 font-medium rounded-xl hover:bg-blue-50 transition-colors"
                >
                  Enroll Now
                </button>
              )}
              {course.lessons?.length > 0 && (
                <p className="text-center text-white/60 text-xs mt-3">
                  <FaRegClock className="inline mr-1" />
                  Full lifetime access
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-4 border-b mb-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium transition-colors relative ${
                activeTab === tab ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div layoutId="courseTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'Description' && (
            <motion.div
              key="desc"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white rounded-2xl p-6 shadow-sm"
            >
              <div className="prose max-w-none text-gray-600 leading-relaxed whitespace-pre-line">
                {course.description}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                {[
                  { icon: FaBookOpen, label: 'Lessons', value: course.lessons?.length || 0 },
                  { icon: FaClock, label: 'Duration', value: 'Self-paced' },
                  { icon: FaStar, label: 'Rating', value: `${course.rating?.toFixed(1) || '0.0'} / 5` },
                  { icon: FaUserTie, label: 'Instructor', value: course.instructor || 'Hamro Tuition' },
                ].map((stat, i) => (
                  <div key={i} className="text-center p-4 bg-gray-50 rounded-xl">
                    <stat.icon className="text-blue-500 text-xl mx-auto mb-2" />
                    <div className="text-lg font-bold text-gray-900">{stat.value}</div>
                    <div className="text-xs text-gray-500">{stat.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'Syllabus' && (
            <motion.div
              key="syllabus"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white rounded-2xl p-6 shadow-sm"
            >
              {course.lessons?.length > 0 ? (
                <div className="space-y-2">
                  {course.lessons.map((lesson, i) => (
                    <div key={i} className="border rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedLesson(expandedLesson === i ? null : i)}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                            {i + 1}
                          </span>
                          <div className="text-left">
                            <p className="font-medium text-gray-900 text-sm">{lesson.title}</p>
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                              <FaRegClock className="text-[10px]" />
                              {lesson.duration || '0:00'}
                            </p>
                          </div>
                        </div>
                        <FaChevronDown className={`text-gray-400 transition-transform ${expandedLesson === i ? 'rotate-180' : ''}`} />
                      </button>
                      {expandedLesson === i && (
                        <div className="px-4 pb-4 border-t pt-3 bg-gray-50">
                          <div className="flex gap-3">
                            {lesson.videoUrl && (
                              <a href={lesson.videoUrl} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                                <FaPlay className="text-xs" /> Watch Video
                              </a>
                            )}
                            {lesson.notesPdf && (
                              <a href={lesson.notesPdf} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-green-600 hover:underline">
                                <FaDownload className="text-xs" /> Download Notes
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">No lessons available yet.</p>
              )}
            </motion.div>
          )}

          {activeTab === 'Reviews' && (
            <motion.div
              key="reviews"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  {reviews.length > 0 ? (
                    reviews.map((review) => (
                      <div key={review._id} className="bg-white rounded-2xl p-5 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-600 font-medium text-sm">
                              {review.userId?.name?.charAt(0) || 'U'}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-medium text-gray-900 text-sm">{review.userId?.name || 'Anonymous'}</h4>
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <FaStar key={s} className={`text-xs ${s <= review.rating ? 'text-yellow-400' : 'text-gray-200'}`} />
                                ))}
                              </div>
                            </div>
                            <p className="text-gray-500 text-sm">{review.comment}</p>
                            <p className="text-xs text-gray-400 mt-2">{new Date(review.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                      <FaStar className="text-4xl text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No reviews yet. Be the first to review!</p>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm h-fit">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    {user ? 'Write a Review' : 'Login to Review'}
                  </h3>
                  <form onSubmit={handleReviewSubmit}>
                    <div className="flex items-center gap-2 mb-4">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button key={s} type="button" onClick={() => setReviewForm({ ...reviewForm, rating: s })}>
                          <FaStar className={`text-xl transition-colors ${s <= reviewForm.rating ? 'text-yellow-400' : 'text-gray-200 hover:text-yellow-300'}`} />
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                      placeholder="Share your experience..."
                      rows={4}
                      className="w-full border rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                    />
                    <button
                      type="submit"
                      disabled={reviewSubmitting}
                      className="w-full mt-3 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-xl text-sm transition-colors"
                    >
                      {reviewSubmitting ? 'Submitting...' : user ? 'Submit Review' : 'Login to Review'}
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CourseDetail;
