import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiFileText, FiUpload, FiTrash2, FiExternalLink, FiChevronDown, FiX, FiRefreshCw,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { adminAPI } from '../../utils/api';

const NoteManager = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const fileRef = useRef(null);
  const replaceRef = useRef(null);
  const [replaceIdx, setReplaceIdx] = useState(-1);

  useEffect(() => {
    adminAPI.getQuizCourses().then(({ data }) => setCourses(data)).catch(() => {});
  }, []);

  const selectedCourseData = courses.find(c => c._id === selectedCourse);

  const fetchNotes = async () => {
    if (!selectedCourse || selectedChapter === '') return;
    setLoading(true);
    try {
      const { data } = await adminAPI.getChapterNotes(selectedCourse, selectedChapter);
      setNotes(Array.isArray(data) ? data : []);
    } catch { setNotes([]); }
    setLoading(false);
  };

  useEffect(() => {
    setNotes([]);
    if (selectedCourse && selectedChapter !== '') fetchNotes();
  }, [selectedCourse, selectedChapter]);

  const handleUpload = async () => {
    if (!file) return toast.error('Select an .htm/.html file');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('title', title || file.name);
      await adminAPI.uploadNote(selectedCourse, selectedChapter, fd);
      toast.success('Note uploaded!');
      setFile(null); setTitle('');
      if (fileRef.current) fileRef.current.value = '';
      fetchNotes();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Upload failed');
    }
    setUploading(false);
  };

  const handleDelete = async (noteId) => {
    if (!confirm('Delete this note?')) return;
    try {
      await adminAPI.deleteNote(selectedCourse, selectedChapter, noteId);
      toast.success('Deleted');
      fetchNotes();
    } catch { toast.error('Failed'); }
  };

  const handleReplace = async (noteId) => {
    if (!replaceRef.current?.files?.[0]) return;
    const fd = new FormData();
    fd.append('file', replaceRef.current.files[0]);
    try {
      await adminAPI.replaceNote(selectedCourse, selectedChapter, noteId, fd);
      toast.success('Note replaced!');
      setReplaceIdx(-1);
      replaceRef.current.value = '';
      fetchNotes();
    } catch { toast.error('Failed'); }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Note Manager</h1>
        <p className="text-gray-500 text-sm mt-1">Upload interactive .htm/.html notes for chapters</p>
      </div>

      {/* Course / Chapter Selectors */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Course</label>
            <div className="relative">
              <select value={selectedCourse} onChange={(e) => { setSelectedCourse(e.target.value); setSelectedChapter(''); }}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm appearance-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none">
                <option value="">-- Choose Course --</option>
                {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
              </select>
              <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Chapter</label>
            <div className="relative">
              <select value={selectedChapter} onChange={(e) => setSelectedChapter(e.target.value)}
                disabled={!selectedCourse}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm appearance-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none disabled:opacity-50">
                <option value="">-- Choose Chapter --</option>
                {(selectedCourseData?.chapters || []).map(ch => (
                  <option key={ch.index} value={ch.index}>{ch.title}</option>
                ))}
              </select>
              <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      {selectedCourse && selectedChapter !== '' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload HTML Note</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Note Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Chapter 1 Notes"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">HTML File (.htm / .html)</label>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-blue-300 transition-colors">
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <FiFileText className="text-green-500 text-xl" />
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <button onClick={() => { setFile(null); fileRef.current.value = ''; }}
                      className="text-red-500 hover:text-red-600 text-sm">Remove</button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <FiUpload className="text-gray-400 text-2xl mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Click to upload .htm or .html file</p>
                    <p className="text-xs text-gray-400 mt-1">Max 50MB</p>
                    <input ref={fileRef} type="file" accept=".htm,.html" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" />
                  </label>
                )}
              </div>
            </div>
            <button onClick={handleUpload} disabled={uploading || !file}
              className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
              {uploading ? 'Uploading...' : 'Upload Note'}
            </button>
          </div>
        </div>
      )}

      {/* Notes List */}
      {selectedCourse && selectedChapter !== '' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Uploaded Notes ({notes.length})</h3>
          </div>
          {loading ? (
            <div className="p-10 text-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : notes.length === 0 ? (
            <div className="p-10 text-center text-gray-500 text-sm">No notes uploaded yet.</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {notes.map((note) => (
                <div key={note._id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                      <FiFileText className="text-purple-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{note.title}</p>
                      <p className="text-xs text-gray-400 truncate">{note.url}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a href={note.url} target="_blank" rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-all" title="Preview">
                      <FiExternalLink size={16} />
                    </a>
                    <div className="relative">
                      <button onClick={() => setReplaceIdx(replaceIdx === note._id ? -1 : note._id)}
                        className="p-2 text-gray-400 hover:text-orange-600 rounded-lg hover:bg-orange-50 transition-all" title="Replace">
                        <FiRefreshCw size={16} />
                      </button>
                      {replaceIdx === note._id && (
                        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-3 z-10 w-56">
                          <p className="text-xs text-gray-500 mb-2">Select new file:</p>
                          <input ref={replaceRef} type="file" accept=".htm,.html"
                            className="text-xs w-full mb-2" onChange={() => handleReplace(note._id)} />
                          <button onClick={() => setReplaceIdx(-1)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                        </div>
                      )}
                    </div>
                    <button onClick={() => handleDelete(note._id)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all" title="Delete">
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NoteManager;
