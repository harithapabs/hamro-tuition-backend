import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FiSearch, FiUsers, FiUserCheck, FiUserX, FiChevronDown, FiChevronUp,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { adminAPI } from '../../utils/api';

const ManageStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [filter, setFilter] = useState('all');

  const fetchStudents = async () => {
    try {
      const { data: res } = await adminAPI.getStudents();
      setStudents(Array.isArray(res) ? res : res?.students || []);
    } catch { toast.error('Failed to load students'); }
    setLoading(false);
  };

  useEffect(() => { fetchStudents(); }, []);

  const handleBlock = async (id, currentBlocked) => {
    try {
      await adminAPI.blockStudent(id, { isBlocked: !currentBlocked });
      toast.success(`Student ${currentBlocked ? 'unblocked' : 'blocked'}`);
      fetchStudents();
    } catch { toast.error('Failed to update'); }
  };

  const filtered = students.filter((s) => {
    const match = s.name?.toLowerCase().includes(search.toLowerCase()) || s.email?.toLowerCase().includes(search.toLowerCase());
    if (filter === 'active') return match && !s.isBlocked;
    if (filter === 'blocked') return match && s.isBlocked;
    return match;
  });

  const stats = {
    total: students.length,
    active: students.filter((s) => !s.isBlocked).length,
    blocked: students.filter((s) => s.isBlocked).length,
  };

  const statCards = [
    { key: 'total', label: 'Total Students', value: stats.total, icon: FiUsers, color: 'bg-blue-50 text-blue-600' },
    { key: 'active', label: 'Active', value: stats.active, icon: FiUserCheck, color: 'bg-emerald-50 text-emerald-600' },
    { key: 'blocked', label: 'Blocked', value: stats.blocked, icon: FiUserX, color: 'bg-red-50 text-red-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {statCards.map((s) => (
          <div key={s.key} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center`}>
                <s.icon size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-xl font-bold text-gray-900">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder="Search by name or email..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'active', 'blocked'].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >{f.charAt(0).toUpperCase() + f.slice(1)}</button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Student</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Email</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Courses</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Joined</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Status</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12"><div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">No students found</td></tr>
              ) : filtered.map((student) => (
                <motion.tr key={student._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer"
                  onClick={() => setExpanded(expanded === student._id ? null : student._id)}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-semibold">
                        {student.name?.charAt(0)?.toUpperCase() || 'S'}
                      </div>
                      <span className="text-gray-900 font-medium">{student.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{student.email}</td>
                  <td className="py-3 px-4 text-gray-600">{student.enrolledCourses?.length || student.courses?.length || 0}</td>
                  <td className="py-3 px-4 text-gray-500">{student.createdAt ? new Date(student.createdAt).toLocaleDateString() : '-'}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      student.isBlocked ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {student.isBlocked ? 'Blocked' : 'Active'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleBlock(student._id, student.isBlocked); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                        student.isBlocked
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-red-50 text-red-700 hover:bg-red-100'
                      }`}
                    >
                      {student.isBlocked ? 'Unblock' : 'Block'}
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {expanded && (() => {
        const student = students.find((s) => s._id === expanded);
        if (!student) return null;
        const enrolled = student.enrolledCourses || student.courses || [];
        return (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Enrolled Courses: {student.name}</h4>
            {enrolled.length === 0 ? (
              <p className="text-sm text-gray-400">No enrolled courses</p>
            ) : (
              <div className="space-y-3">
                {enrolled.map((ec, i) => {
                  const course = ec.course || ec;
                  return (
                    <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{course.title || 'Course'}</p>
                        <p className="text-xs text-gray-500">{ec.progress || 0}% complete</p>
                      </div>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${ec.progress || 0}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        );
      })()}
    </div>
  );
};

export default ManageStudents;
