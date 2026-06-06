import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiClipboard, FiCalendar, FiClock } from 'react-icons/fi';
import { noticeAPI } from '../../utils/api';

const Notices = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const { data } = await noticeAPI.getAll();
        setNotices(Array.isArray(data) ? data : []);
      } catch {}
      setLoading(false);
    };
    fetchNotices();
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notices</h1>
        <p className="text-gray-500 text-sm mt-1">All notices and announcements</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/2 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : !notices.length ? (
        <div className="flex flex-col items-center justify-center min-h-[30vh]">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center mb-4">
            <FiClipboard className="text-amber-600 text-2xl" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No Notices</h3>
          <p className="text-sm text-gray-500">No notices have been posted yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notices.map((notice, i) => (
            <motion.div
              key={notice._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
            >
              <div className="flex items-start gap-1 mb-2">
                <FiClipboard className="text-amber-500 mt-0.5 flex-shrink-0" size={16} />
                <h2 className="text-base font-semibold text-gray-900">{notice.title || 'Notice'}</h2>
              </div>
              {notice.content && (
                <p className="text-sm text-gray-700 mb-3 whitespace-pre-wrap">{notice.content}</p>
              )}
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <FiCalendar size={12} />
                  {new Date(notice.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric'
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <FiClock size={12} />
                  {new Date(notice.createdAt).toLocaleTimeString('en-US', {
                    hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notices;
