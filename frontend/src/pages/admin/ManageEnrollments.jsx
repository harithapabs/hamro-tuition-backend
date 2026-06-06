import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiCheck, FiX, FiUser, FiCalendar, FiClock, FiDollarSign, FiImage, FiFileText, FiVideo } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { liveSessionAPI } from '../../utils/api';

const statusStyles = {
  pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Pending' },
  approved: { bg: 'bg-green-50', text: 'text-green-700', label: 'Approved' },
  rejected: { bg: 'bg-red-50', text: 'text-red-700', label: 'Rejected' },
};

const ManageEnrollments = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    try {
      const { data } = await liveSessionAPI.allEnrollments();
      setEnrollments(Array.isArray(data) ? data : []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const handleApprove = async (id) => {
    try {
      await liveSessionAPI.approveEnrollment(id);
      toast.success('Enrollment approved');
      fetch();
    } catch { toast.error('Failed to approve'); }
  };

  const handleReject = async (id) => {
    try {
      await liveSessionAPI.rejectEnrollment(id);
      toast.success('Enrollment rejected');
      fetch();
    } catch { toast.error('Failed to reject'); }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Enrollment Requests</h1>
        <p className="text-gray-500 text-sm mt-1">Approve or reject live session enrollment requests</p>
      </div>

      {!enrollments.length ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh]">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mb-4">
            <FiUser className="text-blue-600 text-2xl" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No Enrollments Yet</h3>
          <p className="text-sm text-gray-500">Enrollments will appear here when students sign up</p>
        </div>
      ) : (
        <div className="space-y-3">
          {enrollments.map((e, i) => {
            const style = statusStyles[e.status] || statusStyles.pending;
            return (
              <motion.div key={e._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <FiUser className="text-blue-600 text-xl" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{e.userName || e.user?.name || 'Unknown'}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium ${style.bg} ${style.text}`}>
                        {style.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{e.userEmail || e.user?.email || ''}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><FiVideo /> {e.liveSession?.courseName || 'Unknown'}</span>
                      <span className="flex items-center gap-1"><FiCalendar /> {e.liveSession?.startDate || 'N/A'}</span>
                      <span className="flex items-center gap-1"><FiClock /> {e.liveSession?.startTime || 'N/A'}</span>
                      {e.liveSession?.price && <span className="flex items-center gap-1"><FiDollarSign /> Rs {e.liveSession.price}</span>}
                    </div>
                    {e.screenshot && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-blue-600">
                        <FiImage /> <a href={e.screenshot} target="_blank" rel="noopener noreferrer" className="hover:underline">View Screenshot</a>
                      </div>
                    )}
                    {e.courseDetail && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-xl">
                        <span className="flex items-center gap-1 text-xs font-medium text-gray-700 mb-1"><FiFileText /> Course Details</span>
                        <p className="text-xs text-gray-600">{e.courseDetail}</p>
                      </div>
                    )}
                  </div>
                  {e.status === 'pending' && (
                    <div className="flex items-center gap-2 shrink-0 lg:self-start">
                      <button onClick={() => handleApprove(e._id)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-50 text-green-700 text-xs font-medium rounded-xl hover:bg-green-100 transition-all">
                        <FiCheck /> Approve
                      </button>
                      <button onClick={() => handleReject(e._id)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-700 text-xs font-medium rounded-xl hover:bg-red-100 transition-all">
                        <FiX /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ManageEnrollments;
