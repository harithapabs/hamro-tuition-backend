import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlus, FiSearch, FiEdit2, FiTrash2, FiChevronDown, FiChevronUp, FiBook, FiLayers,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { adminAPI, courseAPI } from '../../utils/api';
import CourseWizard from './CourseWizard';

const ManageCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showWizard, setShowWizard] = useState(false);
  const [editCourse, setEditCourse] = useState(null);
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [showDelete, setShowDelete] = useState(null);
  const [lessonForm, setLessonForm] = useState({ title: '', videoUrl: '', notesUrl: '', duration: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchCourses = async () => {
    try {
      const { data: res } = await adminAPI.getDashboard();
      setCourses(res?.courses || []);
    } catch { toast.error('Failed to load courses'); }
    setLoading(false);
  };

  useEffect(() => { fetchCourses(); }, []);

  const filtered = courses.filter((c) =>
    c.title?.toLowerCase().includes(search.toLowerCase()) ||
    c.instructor?.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditCourse(null);
    setShowWizard(true);
  };

  const openEdit = async (course) => {
    try {
      const { data: fullCourse } = await courseAPI.getOne(course._id);
      setEditCourse(fullCourse);
    } catch {
      setEditCourse(course);
    }
    setShowWizard(true);
  };

  const handleDelete = async () => {
    if (!showDelete) return;
    try {
      await adminAPI.deleteCourse(showDelete);
      toast.success('Course deleted');
      setShowDelete(null);
      fetchCourses();
    } catch { toast.error('Failed to delete'); }
  };

  const handleToggleActive = async (course) => {
    try {
      await adminAPI.updateCourse(course._id, { isActive: !course.isActive });
      toast.success(`Course ${course.isActive ? 'deactivated' : 'activated'}`);
      fetchCourses();
    } catch { toast.error('Failed to update'); }
  };

  const handleAddLesson = async (courseId) => {
    if (!lessonForm.title) { toast.error('Lesson title required'); return; }
    try {
      await adminAPI.addLesson(courseId, lessonForm);
      toast.success('Lesson added');
      setLessonForm({ title: '', videoUrl: '', notesUrl: '', duration: '' });
      fetchCourses();
    } catch { toast.error('Failed to add lesson'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <button onClick={openAdd} className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium text-sm hover:shadow-lg hover:shadow-blue-600/20 transition-all">
          <FiPlus /> Add New Course
        </button>
        <div className="relative w-full sm:w-72">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder="Search courses..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left py-3 px-4 text-gray-500 font-medium">#</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Thumbnail</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Title</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Instructor</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Category</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Price</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Content</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Status</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-12"><div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-gray-400">No courses found</td></tr>
              ) : filtered.map((course, idx) => (
                <motion.tr key={course._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                >
                  <td className="py-3 px-4 text-gray-500">{idx + 1}</td>
                  <td className="py-3 px-4">
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt="" className="w-12 h-8 rounded object-cover" />
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-900 font-medium">{course.title}</td>
                  <td className="py-3 px-4 text-gray-600">{course.instructor}</td>
                  <td className="py-3 px-4"><span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">{course.category}</span></td>
                  <td className="py-3 px-4 text-gray-900 font-medium">Rs. {course.price?.toLocaleString() || 0}</td>
                  <td className="py-3 px-4 text-gray-600">{course.chapters?.length || course.lessons?.length || 0} Ch</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleToggleActive(course)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${course.isActive ? 'bg-blue-600' : 'bg-gray-300'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${course.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(course)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <FiEdit2 size={15} />
                      </button>
                      <button onClick={() => setShowDelete(course._id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <FiTrash2 size={15} />
                      </button>
                      <button onClick={() => setExpandedCourse(expandedCourse === course._id ? null : course._id)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
                        {expandedCourse === course._id ? <FiChevronUp size={15} /> : <FiChevronDown size={15} />}
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {expandedCourse && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 overflow-hidden"
          >
            {(() => {
              const course = courses.find((c) => c._id === expandedCourse);
              if (!course) return null;
              return (
                <>
                  <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FiBook className="text-blue-600" /> Content for: {course.title}
                  </h4>
                  <div className="space-y-2 mb-4">
                    {course.chapters?.length > 0 ? (
                      course.chapters.map((ch, i) => (
                        <div key={i} className="bg-gray-50 rounded-xl px-4 py-2.5">
                          <p className="text-sm font-medium text-gray-900">{ch.name || `Chapter ${i + 1}`}</p>
                          <p className="text-xs text-gray-500">{ch.videos?.length || 0} video(s) | {ch.mcqs?.length || 0} MCQ(s) | {ch.pdfUrl ? 'PDF' : 'No PDF'}</p>
                        </div>
                      ))
                    ) : course.lessons?.length > 0 ? (
                      course.lessons.map((l, i) => (
                        <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{l.title}</p>
                            <p className="text-xs text-gray-500">{l.duration || 'N/A'} {l.videoUrl && '| Video available'}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-400">No content yet</p>
                    )}
                  </div>
                  <div className="border-t border-gray-100 pt-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Add Lesson</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-3">
                      <input type="text" placeholder="Lesson title" value={lessonForm.title}
                        onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                        className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                      <input type="text" placeholder="Video URL" value={lessonForm.videoUrl}
                        onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                        className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                      <input type="text" placeholder="Notes PDF URL" value={lessonForm.notesUrl}
                        onChange={(e) => setLessonForm({ ...lessonForm, notesUrl: e.target.value })}
                        className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                      <input type="text" placeholder="Duration (e.g. 15:00)" value={lessonForm.duration}
                        onChange={(e) => setLessonForm({ ...lessonForm, duration: e.target.value })}
                        className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                    <button onClick={() => handleAddLesson(course._id)}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm rounded-xl hover:shadow-lg transition-all">
                      Add Lesson
                    </button>
                  </div>
                </>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showWizard && (
          <CourseWizard
            onClose={() => { setShowWizard(false); setEditCourse(null); fetchCourses(); }}
            editCourse={editCourse}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          >
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl text-center"
            >
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <FiTrash2 className="text-red-600 text-xl" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Course?</h3>
              <p className="text-sm text-gray-500 mt-1">This action cannot be undone.</p>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowDelete(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
                <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageCourses;
