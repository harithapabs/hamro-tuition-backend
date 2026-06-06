import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiDownload, FiUser, FiFileText, FiVideo, FiClock, FiExternalLink } from 'react-icons/fi';
import { liveSessionAPI } from '../../utils/api';

const ManageSubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await liveSessionAPI.allSubmissions();
        setSubmissions(Array.isArray(data) ? data : []);
      } catch {} finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Assignment Submissions</h1>
        <p className="text-gray-500 text-sm mt-1">View all submitted assignments from students</p>
      </div>

      {!submissions.length ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh]">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center mb-4">
            <FiFileText className="text-indigo-600 text-2xl" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No Submissions Yet</h3>
          <p className="text-sm text-gray-500">Student submissions will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((s, i) => (
            <motion.div key={s._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                  <FiUser className="text-indigo-600 text-xl" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900">{s.userName || s.user?.name || 'Unknown'}</h3>
                  <p className="text-xs text-gray-500">{s.user?.email || ''}</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><FiVideo /> {s.liveSession?.courseName || 'N/A'}</span>
                    <span className="flex items-center gap-1"><FiFileText /> {s.assignment?.title || 'N/A'}</span>
                    <span className="flex items-center gap-1"><FiClock /> {new Date(s.submittedAt).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 lg:self-start">
                  <a href={s.filePath} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-xl hover:bg-indigo-100 transition-all">
                    <FiExternalLink /> View Solution
                  </a>
                  <a href={s.filePath} download
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-700 text-xs font-medium rounded-xl hover:bg-blue-100 transition-all">
                    <FiDownload /> Download
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageSubmissions;
