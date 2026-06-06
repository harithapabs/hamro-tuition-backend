import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMessageSquare, FiSend, FiPlus, FiCheckCircle, FiClock,
  FiUser, FiBookOpen, FiX, FiChevronRight, FiPaperclip, FiFile, FiImage,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { studentAPI } from '../../utils/api';

const Doubts = () => {
  const [doubts, setDoubts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [showAskModal, setShowAskModal] = useState(false);
  const [askData, setAskData] = useState({ courseId: '', question: '' });
  const [askFile, setAskFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [courses, setCourses] = useState([]);
  const fileInputRef = useRef(null);

  const selectedDoubt = doubts.find((d) => d._id === selectedId) || null;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [doubtsRes, coursesRes] = await Promise.all([
          studentAPI.getDoubts(),
          studentAPI.getMyCourses(),
        ]);
        if (Array.isArray(doubtsRes.data)) {
          setDoubts(doubtsRes.data);
          if (doubtsRes.data.length && !selectedId) setSelectedId(doubtsRes.data[0]?._id);
        }
        if (Array.isArray(coursesRes.data)) setCourses(coursesRes.data);
      } catch {}
      setFetching(false);
    };
    fetchData();
  }, []);

  const handleAskDoubt = async () => {
    if (!askData.courseId || !askData.question.trim()) {
      toast.error('Please select a course and enter your question');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('courseId', askData.courseId);
      formData.append('question', askData.question);
      if (askFile) formData.append('file', askFile);

      await studentAPI.askDoubt(formData);
      toast.success('Your doubt has been submitted!');

      setShowAskModal(false);
      setAskData({ courseId: '', question: '' });
      setAskFile(null);

      const { data } = await studentAPI.getDoubts();
      if (Array.isArray(data)) {
        setDoubts(data);
        if (data.length) setSelectedId(data[0]._id);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit doubt');
    } finally {
      setLoading(false);
    }
  };

  const isResolved = (d) => d.isResolved || d.resolved;

  const isImage = (file) => file?.fileType?.startsWith('image/');

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
      <div className="lg:w-96 flex-shrink-0 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Doubts</h1>
          <button
            onClick={() => setShowAskModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-600/20"
          >
            <FiPlus /> Ask
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {fetching ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
              </div>
            ))
          ) : !doubts.length ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FiMessageSquare className="text-gray-300 text-3xl mb-3" />
              <p className="text-sm text-gray-500">No doubts yet</p>
            </div>
          ) : (
            doubts.map((doubt) => (
              <button
                key={doubt._id}
                onClick={() => setSelectedId(doubt._id)}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${
                  selectedId === doubt._id
                    ? 'border-blue-200 bg-blue-50 shadow-sm'
                    : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">{doubt.question}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        isResolved(doubt)
                          ? 'bg-green-50 text-green-700'
                          : 'bg-yellow-50 text-yellow-700'
                      }`}>
                        {isResolved(doubt) ? <FiCheckCircle className="text-[10px]" /> : <FiClock className="text-[10px]" />}
                        {isResolved(doubt) ? 'Resolved' : 'Pending'}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(doubt.createdAt).toLocaleDateString()}
                      </span>
                      {doubt.file && (
                        <FiPaperclip className="text-[10px] text-gray-400" />
                      )}
                    </div>
                  </div>
                  <FiChevronRight className={`text-sm mt-1 flex-shrink-0 ${
                    selectedId === doubt._id ? 'text-blue-600' : 'text-gray-300'
                  }`} />
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        {selectedDoubt ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm h-full flex flex-col">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0">
                  <FiUser className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      isResolved(selectedDoubt)
                        ? 'bg-green-50 text-green-700'
                        : 'bg-yellow-50 text-yellow-700'
                    }`}>
                      {isResolved(selectedDoubt) ? <FiCheckCircle /> : <FiClock />}
                      {isResolved(selectedDoubt) ? 'Resolved' : 'Pending'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(selectedDoubt.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric',
                      })}
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">{selectedDoubt.question}</h2>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <FiBookOpen className="text-blue-500" />
                <span className="font-medium text-blue-600">{selectedDoubt.course?.title || 'Course'}</span>
              </div>
            </div>

            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              {selectedDoubt.file && (
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                  <p className="text-xs font-medium text-gray-500 mb-2">Attachment</p>
                  {isImage(selectedDoubt.file) ? (
                    <a href={selectedDoubt.file.filePath} target="_blank" rel="noopener noreferrer">
                      <img
                        src={selectedDoubt.file.filePath}
                        alt={selectedDoubt.file.fileName}
                        className="max-h-48 rounded-lg object-contain bg-white border border-gray-100"
                      />
                    </a>
                  ) : (
                    <a
                      href={selectedDoubt.file.filePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 hover:border-blue-200 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                        <FiFile className="text-red-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 group-hover:text-blue-600 truncate">{selectedDoubt.file.fileName}</p>
                        <p className="text-xs text-gray-400">{formatFileSize(selectedDoubt.file.fileSize)}</p>
                      </div>
                    </a>
                  )}
                </div>
              )}

              {isResolved(selectedDoubt) && selectedDoubt.answer ? (
                <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-2xl border border-blue-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-[10px] font-bold">
                      {selectedDoubt.answeredByName?.charAt(0) || 'T'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{selectedDoubt.answeredByName || 'Teacher'}</p>
                      <p className="text-xs text-gray-400">
                        Answered
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{selectedDoubt.answer}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-yellow-50 flex items-center justify-center mb-4">
                    <FiClock className="text-yellow-500 text-2xl" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">Awaiting Response</h3>
                  <p className="text-sm text-gray-500 max-w-xs">
                    Your question has been submitted. A teacher will respond shortly.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mb-4">
              <FiMessageSquare className="text-blue-600 text-2xl" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">Select a Doubt</h3>
            <p className="text-sm text-gray-500">Choose a question from the list to view details</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAskModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAskModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Ask a Doubt</h2>
                <button
                  onClick={() => { setShowAskModal(false); setAskFile(null); }}
                  className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FiX size={18} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Course</label>
                  <select
                    value={askData.courseId}
                    onChange={(e) => setAskData((p) => ({ ...p, courseId: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white"
                  >
                    <option value="">Select course</option>
                    {courses.map((c) => (
                      <option key={c._id} value={c._id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Question</label>
                  <textarea
                    value={askData.question}
                    onChange={(e) => setAskData((p) => ({ ...p, question: e.target.value }))}
                    placeholder="Type your question here..."
                    rows={4}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Attachment (Photo or PDF)</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <FiPaperclip />
                    {askFile ? askFile.name : 'Click to upload photo or PDF'}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 10 * 1024 * 1024) {
                          toast.error('File size must be less than 10MB');
                          return;
                        }
                        setAskFile(file);
                      }
                    }}
                    className="hidden"
                  />
                  {askFile && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      {askFile.type?.startsWith('image/') ? <FiImage className="text-blue-500" /> : <FiFile className="text-red-500" />}
                      <span className="truncate">{askFile.name}</span>
                      <button
                        onClick={() => setAskFile(null)}
                        className="text-red-400 hover:text-red-600 ml-auto"
                      >
                        <FiX size={14} />
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleAskDoubt}
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                >
                  {loading ? (
                    'Submitting...'
                  ) : (
                    <>
                      <FiSend /> Submit Question
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Doubts;
