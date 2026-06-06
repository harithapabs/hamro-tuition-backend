import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiStar, FiCheck, FiTrash2, FiUser, FiMessageSquare } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { adminAPI } from '../../utils/api';

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');

  const fetchReviews = async () => {
    try {
      const { data: res } = await adminAPI.getDashboard();
      setReviews(res?.reviews || []);
    } catch { toast.error('Failed to load reviews'); }
    setLoading(false);
  };

  useEffect(() => { fetchReviews(); }, []);

  const handleApprove = async (id) => {
    try {
      await adminAPI.approveReview(id);
      toast.success('Review approved');
      fetchReviews();
    } catch { toast.error('Failed to approve'); }
  };

  const handleDelete = async (id) => {
    try {
      await adminAPI.deleteReview(id);
      toast.success('Review deleted');
      fetchReviews();
    } catch { toast.error('Failed to delete'); }
  };

  const pending = reviews.filter((r) => !r.isApproved);
  const approved = reviews.filter((r) => r.isApproved);

  const filtered = tab === 'pending' ? pending : tab === 'approved' ? approved : reviews;

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : 0;

  const tabs = [
    { key: 'pending', label: 'Pending Approval', count: pending.length },
    { key: 'approved', label: 'Approved', count: approved.length },
    { key: 'all', label: 'All', count: reviews.length },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Reviews', value: reviews.length, icon: FiMessageSquare, color: 'bg-blue-50 text-blue-600' },
          { label: 'Pending Approval', value: pending.length, icon: FiStar, color: 'bg-amber-50 text-amber-600' },
          { label: 'Average Rating', value: avgRating, icon: FiStar, color: 'bg-purple-50 text-purple-600', suffix: '/5' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center`}>
                <s.icon size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-xl font-bold text-gray-900">{s.value}{s.suffix || ''}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 border-b border-gray-100 pb-0">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-[1px] ${
              tab === t.key ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            {t.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              tab === t.key ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'
            }`}>{t.count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gray-200" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                </div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FiStar className="mx-auto text-4xl mb-3" />
          <p>No reviews found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {filtered.map((review, i) => (
              <motion.div key={review._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-semibold">
                      {review.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{review.user?.name || 'User'}</p>
                      <p className="text-xs text-gray-500">{review.course?.title || 'Course'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FiStar key={star} size={14}
                        className={star <= (review.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-sm text-gray-700 mb-3">"{review.comment || review.text}"</p>

                {review.createdAt && (
                  <p className="text-xs text-gray-400 mb-3">{new Date(review.createdAt).toLocaleDateString()}</p>
                )}

                <div className="flex items-center gap-2">
                  {!review.isApproved && (
                    <button onClick={() => handleApprove(review._id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-medium hover:bg-emerald-100 transition-colors">
                      <FiCheck size={13} /> Approve
                    </button>
                  )}
                  <button onClick={() => handleDelete(review._id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-xl text-xs font-medium hover:bg-red-100 transition-colors">
                    <FiTrash2 size={13} /> Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default Reviews;
