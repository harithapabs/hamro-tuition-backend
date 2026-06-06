import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCalendar, FiClock, FiUser, FiPhone, FiDollarSign, FiVideo, FiArrowRight } from 'react-icons/fi';
import { liveSessionAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const LiveClass = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    liveSessionAPI.getAll()
      .then(({ data }) => setSessions(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!sessions.length) {
    return (
      <div className="min-h-screen pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mx-auto mb-4">
              <FiVideo className="text-blue-600 text-2xl" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Live Classes</h2>
            <p className="text-gray-500">Check back later for scheduled live sessions</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Live Classes</h1>
          <p className="text-gray-500 mt-2">Join interactive live sessions with expert instructors</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((s, i) => (
            <motion.div key={s._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white">
                <div className="flex items-center gap-2 mb-1">
                  <FiVideo className="text-blue-200" />
                  <span className="text-xs font-medium text-blue-200 uppercase tracking-wider">Live Session</span>
                </div>
                <h3 className="text-xl font-bold mt-1">{s.courseName}</h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
                  <span className="flex items-center gap-1.5"><FiCalendar className="text-blue-500" /> {s.startDate}</span>
                  <span className="flex items-center gap-1.5"><FiClock className="text-blue-500" /> {s.startTime}</span>
                  {s.nepaliDate && (
                    <span className="text-orange-500 font-medium text-xs bg-orange-50 px-2 py-0.5 rounded-full">{s.nepaliDate}</span>
                  )}
                </div>
                {s.instructorName && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <FiUser className="text-blue-500 shrink-0" />
                    <span><strong>Instructor:</strong> {s.instructorName}</span>
                    {s.instructorPhone && (
                      <a href={`tel:${s.instructorPhone}`} className="text-blue-600 hover:underline ml-1 inline-flex items-center gap-1">
                        <FiPhone size={12} /> {s.instructorPhone}
                      </a>
                    )}
                  </div>
                )}
                {s.description && (
                  <p className="text-sm text-gray-500 leading-relaxed">{s.description}</p>
                )}
                {s.price && (
                  <div className="flex items-center gap-1.5 text-lg font-bold text-gray-900">
                    <FiDollarSign className="text-green-500" /> Rs {s.price}
                  </div>
                )}
                <div className="flex items-center gap-3 pt-2">
                  {user ? (
                    <Link to={`/live-class/enroll/${s._id}`}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-600/20">
                      Enroll Now <FiArrowRight />
                    </Link>
                  ) : (
                    <Link to="/login"
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-600/20">
                      Enroll Now <FiArrowRight />
                    </Link>
                  )}
                  {s.instructorPhone && (
                    <a href={`tel:${s.instructorPhone}`}
                      className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-all">
                      <FiPhone /> Call Now
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LiveClass;
