import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlus, FiTrash2, FiVideo, FiCalendar, FiClock, FiLink, FiDollarSign, FiUser, FiPhone, FiEdit2, FiX, FiBookOpen, FiFileText, FiExternalLink,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { liveSessionAPI } from '../../utils/api';

const emptyForm = {
  courseName: '', description: '', instructorName: '', instructorPhone: '',
  meetLink: '', startDate: '', startTime: '', nepaliDate: '',
  price: '', requiresPayment: false,
};

const ManageLiveSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [assignModal, setAssignModal] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [newAssign, setNewAssign] = useState({ title: '', date: '', pdfLink: '' });

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await liveSessionAPI.getAll();
        setSessions(Array.isArray(data) ? data : []);
      } catch {} finally { setLoading(false); }
    };
    fetch();
  }, []);

  const resetForm = () => { setForm({ ...emptyForm }); setShowForm(false); setEditing(null); };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.courseName || !form.meetLink || !form.startDate || !form.startTime) {
      toast.error('Please fill all required fields');
      return;
    }
    try {
      if (editing) {
        const { data } = await liveSessionAPI.update(editing, form);
        setSessions(prev => prev.map(s => s._id === editing ? data : s));
        toast.success('Live session updated');
      } else {
        const { data } = await liveSessionAPI.create(form);
        setSessions(prev => [data, ...prev]);
        toast.success('Live session created');
      }
      resetForm();
    } catch { toast.error(editing ? 'Failed to update' : 'Failed to create'); }
  };

  const handleEdit = (s) => {
    setForm({
      courseName: s.courseName || '', description: s.description || '',
      instructorName: s.instructorName || '', instructorPhone: s.instructorPhone || '',
      meetLink: s.meetLink || '', startDate: s.startDate || '', startTime: s.startTime || '',
      nepaliDate: s.nepaliDate || '', price: s.price || '', requiresPayment: s.requiresPayment || false,
    });
    setEditing(s._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this live session?')) return;
    try {
      await liveSessionAPI.delete(id);
      setSessions(prev => prev.filter(s => s._id !== id));
      toast.success('Deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const openAssign = async (s) => {
    setAssignModal(s);
    setAssignLoading(true);
    try {
      const { data } = await liveSessionAPI.getAssignments(s._id);
      setAssignments(Array.isArray(data) ? data : []);
    } catch {} finally { setAssignLoading(false); }
  };

  const addAssignment = async () => {
    if (!newAssign.title || !newAssign.date || !newAssign.pdfLink) {
      toast.error('Please fill all fields');
      return;
    }
    try {
      const { data } = await liveSessionAPI.addAssignment(assignModal._id, newAssign);
      setAssignments(prev => [data, ...prev]);
      setNewAssign({ title: '', date: '', pdfLink: '' });
      toast.success('Assignment added');
    } catch { toast.error('Failed to add'); }
  };

  const deleteAssignment = async (assignId) => {
    if (!confirm('Delete this assignment?')) return;
    try {
      await liveSessionAPI.deleteAssignment(assignId);
      setAssignments(prev => prev.filter(a => a._id !== assignId));
      toast.success('Deleted');
    } catch { toast.error('Failed to delete'); }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Sessions</h1>
          <p className="text-gray-500 text-sm mt-1">Create and manage live class sessions</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-600/20">
          <FiPlus /> {showForm ? 'Cancel' : 'New Session'}
        </button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course Name *</label>
                <input type="text" placeholder="e.g. Class 10 Mathematics" value={form.courseName}
                  onChange={(e) => setForm({ ...form, courseName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meet Link *</label>
                <input type="url" placeholder="https://meet.google.com/..." value={form.meetLink}
                  onChange={(e) => setForm({ ...form, meetLink: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date (AD) *</label>
                <input type="date" value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
                <input type="time" value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instructor Name</label>
                <input type="text" placeholder="e.g. Hari Thapa" value={form.instructorName}
                  onChange={(e) => setForm({ ...form, instructorName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instructor Phone</label>
                <input type="text" placeholder="+977-98..." value={form.instructorPhone}
                  onChange={(e) => setForm({ ...form, instructorPhone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea rows="3" placeholder="Details about this live class..." value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (Rs)</label>
                <input type="number" placeholder="e.g. 500" value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
              </div>
              <div className="flex items-end pb-2.5">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={form.requiresPayment}
                    onChange={(e) => setForm({ ...form, requiresPayment: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                  <span className="text-sm text-gray-700">Requires Payment</span>
                </label>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nepali Date (Bikram Sambat)</label>
                <input type="text" placeholder="e.g. 2082 Jeth 15" value={form.nepaliDate}
                  onChange={(e) => setForm({ ...form, nepaliDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
              </div>
            </div>
            <button type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-600/20">
              {editing ? 'Update Live Session' : 'Create Live Session'}
            </button>
          </form>
        </motion.div>
      )}

      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh]">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mb-4">
            <FiVideo className="text-blue-600 text-2xl" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No Live Sessions</h3>
          <p className="text-sm text-gray-500">Create your first live session above</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s, i) => (
            <motion.div key={s._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <FiVideo className="text-blue-600 text-xl" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900">{s.courseName || 'Untitled'}</h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><FiCalendar /> {s.startDate || 'N/A'}</span>
                  <span className="flex items-center gap-1"><FiClock /> {s.startTime || 'N/A'}</span>
                  {s.nepaliDate && <span className="text-orange-500 font-medium">{s.nepaliDate}</span>}
                  {s.price && <span className="flex items-center gap-1"><FiDollarSign /> Rs {s.price}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => openAssign(s)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-xl hover:bg-indigo-100 transition-all">
                  <FiBookOpen size={14} /> Assignments
                </button>
                <button onClick={() => handleEdit(s)}
                  className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all">
                  <FiEdit2 size={15} />
                </button>
                <a href={s.meetLink} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-50 text-green-700 text-xs font-medium rounded-xl hover:bg-green-100 transition-colors">
                  <FiLink /> Join
                </a>
                <button onClick={() => handleDelete(s._id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                  <FiTrash2 size={15} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {assignModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Assignments</h2>
                  <p className="text-xs text-gray-500 mt-0.5">{assignModal.courseName}</p>
                </div>
                <button onClick={() => { setAssignModal(null); setAssignments([]); }}
                  className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                  <FiX size={18} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <input type="text" placeholder="Title" value={newAssign.title}
                    onChange={(e) => setNewAssign({ ...newAssign, title: e.target.value })}
                    className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
                  <input type="date" value={newAssign.date}
                    onChange={(e) => setNewAssign({ ...newAssign, date: e.target.value })}
                    className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
                  <input type="url" placeholder="PDF Link" value={newAssign.pdfLink}
                    onChange={(e) => setNewAssign({ ...newAssign, pdfLink: e.target.value })}
                    className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
                </div>
                <button onClick={addAssignment}
                  className="w-full py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-sm font-medium rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2">
                  <FiPlus size={15} /> Add Assignment
                </button>
                <hr className="border-gray-100" />
                {assignLoading ? (
                  <div className="flex justify-center py-6"><div className="w-6 h-6 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
                ) : assignments.length === 0 ? (
                  <p className="text-center text-sm text-gray-400 py-6">No assignments yet</p>
                ) : (
                  <div className="space-y-2">
                    {assignments.map(a => (
                      <div key={a._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <FiFileText className="text-indigo-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{a.title}</p>
                          <p className="text-xs text-gray-500">{a.date}</p>
                        </div>
                        <a href={a.pdfLink} target="_blank" rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-700 p-1">
                          <FiExternalLink size={15} />
                        </a>
                        <button onClick={() => deleteAssignment(a._id)}
                          className="text-gray-400 hover:text-red-500 p-1">
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageLiveSessions;
