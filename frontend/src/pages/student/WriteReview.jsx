import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiStar, FiBook, FiSend } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { studentAPI } from '../../utils/api';

const WriteReview = () => {
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    studentAPI.getMyCourses()
      .then(({ data }) => setCourses(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!courseId) return toast.error('Please select a course');
    if (!rating) return toast.error('Please select a rating');
    if (!comment.trim()) return toast.error('Please write a review');
    setSubmitting(true);
    try {
      await studentAPI.createReview({ courseId, rating, comment: comment.trim() });
      toast.success('Review submitted for admin approval');
      setCourseId(''); setRating(0); setComment('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Write a Review</h1>
        <p className="text-gray-500 text-sm mt-1">Share your learning experience</p>
      </div>

      <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Course</label>
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
            <option value="">-- Choose a course --</option>
            {courses.map(c => (
              <option key={c._id} value={c._id}>{c.title}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Rating</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} type="button" onClick={() => setRating(star)}
                onMouseEnter={() => setHover(star)} onMouseLeave={() => setHover(0)}
                className="p-0.5 transition-colors">
                <FiStar size={24} className={`transition-colors ${(hover || rating) >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Review</label>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={4} placeholder="Write your experience..."
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
        </div>

        <button type="submit" disabled={submitting}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50">
          <FiSend /> {submitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </motion.form>
    </div>
  );
};

export default WriteReview;
