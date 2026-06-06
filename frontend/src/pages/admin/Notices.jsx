import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiTrash2, FiX, FiCalendar, FiInfo } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { noticeAPI } from '../../utils/api';

const Notices = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', isActive: true });
  const [submitting, setSubmitting] = useState(false);

  const fetchNotices = async () => {
    try {
      const { data: res } = await noticeAPI.getAll();
      setNotices(Array.isArray(res) ? res : res?.notices || []);
    } catch { toast.error('Failed to load notices'); }
    setLoading(false);
  };

  useEffect(() => { fetchNotices(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await noticeAPI.create(form);
      toast.success('Notice created');
      setShowModal(false);
      setForm({ title: '', content: '', isActive: true });
      fetchNotices();
    } catch { toast.error('Failed to create notice'); }
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await noticeAPI.delete(deleteTarget);
      toast.success('Notice deleted');
      setDeleteTarget(null);
      fetchNotices();
    } catch { toast.error('Failed to delete'); }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
            <div className="h-4 bg-gray-200 rounded w-full mb-2" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium text-sm hover:shadow-lg hover:shadow-blue-600/20 transition-all">
          <FiPlus /> Create Notice
        </button>
      </div>

      {notices.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FiInfo className="mx-auto text-4xl mb-3" />
          <p>No notices yet. Create your first notice.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notices.map((notice, i) => (
            <motion.div key={notice._id || i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start justify-between mb-3">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  notice.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {notice.isActive ? 'Active' : 'Inactive'}
                </span>
                <button onClick={() => setDeleteTarget(notice._id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                  <FiTrash2 size={14} />
                </button>
              </div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">{notice.title}</h4>
              <p className="text-sm text-gray-500 line-clamp-3 mb-3">{notice.content}</p>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <FiCalendar size={12} />
                {notice.createdAt ? new Date(notice.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          >
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-gray-900">Create Notice</h3>
                <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600"><FiX size={20} /></button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                  <textarea rows={5} required value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Active</label>
                  <button type="button" onClick={() => setForm({ ...form, isActive: !form.isActive })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isActive ? 'bg-blue-600' : 'bg-gray-300'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                <button type="submit" disabled={submitting}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium text-sm hover:shadow-lg transition-all disabled:opacity-50">
                  {submitting ? 'Creating...' : 'Create Notice'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          >
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl text-center"
            >
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <FiTrash2 className="text-red-600 text-xl" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Notice?</h3>
              <p className="text-sm text-gray-500 mt-1">This action cannot be undone.</p>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
                <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Notices;
