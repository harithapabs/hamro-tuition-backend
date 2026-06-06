import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiBookOpen, FiClock, FiArrowRight, FiPlay, FiUser, FiTrendingUp, FiBookmark, FiShoppingCart, FiCheck, FiGrid, FiList } from 'react-icons/fi';
import { studentAPI, courseAPI } from '../../utils/api';

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 animate-pulse">
    <div className="h-40 bg-gray-200" />
    <div className="p-5 space-y-3">
      <div className="h-5 bg-gray-200 rounded w-3/4" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
      <div className="h-2 bg-gray-200 rounded-full" />
      <div className="flex justify-between">
        <div className="h-4 bg-gray-200 rounded w-20" />
        <div className="h-9 bg-gray-200 rounded-xl w-36" />
      </div>
    </div>
  </div>
);

function ensureVideoIds(course) {
  if (!course.chapters) return course;
  return {
    ...course,
    chapters: course.chapters.map((ch, chIdx) => ({
      ...ch,
      videos: (ch.videos || []).map((v, vIdx) => ({ ...v, _id: v._id || v.id || `c${chIdx}v${vIdx}` })),
    })),
  };
}

const MyCourses = () => {
  const [allCourses, setAllCourses] = useState([]);
  const [enrolledIds, setEnrolledIds] = useState(new Set());
  const [progressMap, setProgressMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [allRes, myRes, progRes] = await Promise.all([
          courseAPI.getAll().catch(() => ({ data: [] })),
          studentAPI.getMyCourses().catch(() => ({ data: [] })),
          studentAPI.getMyProgress().catch(() => ({ data: [] })),
        ]);

        const enrolled = Array.isArray(myRes.data) ? myRes.data : myRes.data?.courses || [];
        const enrolledSet = new Set(enrolled.map(c => c._id || c.id));
        setEnrolledIds(enrolledSet);

        const prog = {};
        if (Array.isArray(progRes.data)) {
          progRes.data.forEach(p => { prog[p.courseId] = p.percentage; });
        }
        setProgressMap(prog);

        const all = Array.isArray(allRes.data) ? allRes.data : [];
        const seen = new Set();
        const merged = [];
        for (const c of enrolled) { merged.push(ensureVideoIds(c)); seen.add(c._id || c.id); }
        for (const c of all) {
          const id = c._id || c.id;
          if (!seen.has(id)) { merged.push(ensureVideoIds(c)); seen.add(id); }
        }
        setAllCourses(merged);
      } catch {
        setAllCourses([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const visible = useMemo(() => {
    let list = allCourses;
    if (filter === 'enrolled') list = list.filter(c => enrolledIds.has(c._id || c.id));
    else if (filter === 'available') list = list.filter(c => !enrolledIds.has(c._id || c.id));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c => c.title?.toLowerCase().includes(q) || c.instructor?.toLowerCase().includes(q) || c.category?.toLowerCase().includes(q));
    }
    return list;
  }, [allCourses, filter, search, enrolledIds]);

  const enrolledCount = useMemo(() => allCourses.filter(c => enrolledIds.has(c._id || c.id)).length, [allCourses, enrolledIds]);
  const availableCount = allCourses.length - enrolledCount;

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
          <p className="text-gray-500 text-sm mt-1">Continue learning where you left off</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
            <p className="text-gray-500 text-sm mt-1">
              {enrolledCount} enrolled · {availableCount} available
            </p>
          </div>
          {enrolledCount > 0 && (
            <div className="hidden sm:flex items-center gap-2 bg-blue-50 rounded-xl px-4 py-2 text-sm text-blue-700 font-medium">
              <FiTrendingUp />
              <span>{Math.round(allCourses.filter(c => enrolledIds.has(c._id || c.id)).reduce((s, c) => s + (progressMap[c._id || c.id] || 0), 0) / enrolledCount)}% avg progress</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-3 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 bg-gray-50 rounded-xl p-1">
          {[
            { key: 'all', label: 'All', count: allCourses.length },
            { key: 'enrolled', label: 'Enrolled', count: enrolledCount },
            { key: 'available', label: 'Available', count: availableCount },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === t.key ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t.label} <span className="text-xs opacity-70">({t.count})</span>
            </button>
          ))}
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search courses..."
          className="flex-1 px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
        />
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh]">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mb-6">
            <FiBookOpen className="text-blue-600 text-3xl" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Courses Found</h2>
          <p className="text-gray-500 text-sm mb-6 text-center max-w-sm">
            {filter === 'enrolled'
              ? "You haven't enrolled in any courses yet."
              : filter === 'available'
              ? "You've enrolled in all available courses!"
              : 'No courses match your search.'}
          </p>
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-600/20"
          >
            Browse Catalog <FiArrowRight />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {visible.map((course, i) => {
            const courseId = course._id || course.id;
            const isEnrolled = enrolledIds.has(courseId);
            const progress = progressMap[courseId] || 0;
            const firstVideo = course.chapters?.[0]?.videos?.[0]?._id || course.lessons?.[0]?._id;

            return (
              <motion.div
                key={courseId || i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                  <Link
                    to={isEnrolled && firstVideo ? `/dashboard/student/course/${courseId}/lesson/${firstVideo}` : `/course/${courseId}`}
                    className="block group"
                  >
                    <div className="h-44 bg-gradient-to-br from-blue-500 to-indigo-600 relative overflow-hidden flex-shrink-0">
                      <div className="absolute inset-0 bg-black/20" />
                      {course.thumbnail ? (
                        <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FiBookOpen className="text-white/30 text-5xl" />
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                        <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                          {isEnrolled ? (
                            <FiPlay className="text-blue-600 text-xl ml-0.5" />
                          ) : (
                            <FiShoppingCart className="text-blue-600 text-xl" />
                          )}
                        </div>
                      </div>
                      <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-sm border border-white/20">
                          {course.category || course.level || 'Course'}
                        </span>
                        {isEnrolled ? (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/90 text-white backdrop-blur-sm flex items-center gap-1">
                            <FiCheck className="text-[10px]" /> Enrolled
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-500/90 text-white backdrop-blur-sm">
                            Rs. {course.price?.toLocaleString() || 0}
                          </span>
                        )}
                      </div>
                      {isEnrolled && progress > 0 && (
                        <div className="absolute bottom-3 right-3">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/80 text-white backdrop-blur-sm">
                            {Math.round(progress)}% done
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="p-5 flex flex-col flex-1">
                    <Link to={`/course/${courseId}`} className="font-semibold text-gray-900 text-base mb-1.5 line-clamp-2 hover:text-blue-600 transition-colors">
                      {course.title}
                    </Link>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                      <FiUser className="text-gray-400 text-xs" />
                      <span>{course.instructor || 'Hamro Tuition'}</span>
                    </div>

                    {isEnrolled ? (
                      <>
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-gray-400">Progress</span>
                            <span className="font-semibold text-gray-700">{Math.round(progress)}%</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-700 ease-out"
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                        </div>
                        <div className="mt-auto pt-3 border-t border-gray-50">
                          <Link
                            to={firstVideo ? `/dashboard/student/course/${courseId}/lesson/${firstVideo}` : `/course/${courseId}`}
                            className="w-full text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-3.5 py-2 rounded-lg inline-flex items-center justify-center gap-1.5 transition-all"
                          >
                            Continue Learning <FiArrowRight className="text-xs" />
                          </Link>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                          {course.description || 'Explore this course and start learning today.'}
                        </p>
                        <div className="mt-auto pt-3 border-t border-gray-50">
                          <Link
                            to={`/course/${courseId}`}
                            className="w-full text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 px-3.5 py-2 rounded-lg inline-flex items-center justify-center gap-1.5 transition-all"
                          >
                            Enroll Now <FiArrowRight className="text-xs" />
                          </Link>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyCourses;
