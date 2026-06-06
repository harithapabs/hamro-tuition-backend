import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageSquare, FiSend, FiCheckCircle, FiClock, FiUser, FiPaperclip, FiFile, FiImage } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { doubtAPI } from '../../utils/api';

const Doubts = () => {
  const [doubts, setDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState({});

  const fetchDoubts = async () => {
    try {
      const { data: res } = await doubtAPI.getAll();
      setDoubts(Array.isArray(res) ? res : res?.doubts || []);
    } catch { toast.error('Failed to load doubts'); }
    setLoading(false);
  };

  useEffect(() => { fetchDoubts(); }, []);

  const handleAnswer = async (doubtId) => {
    const answer = answers[doubtId]?.trim();
    if (!answer) { toast.error('Please write an answer'); return; }
    setSubmitting((s) => ({ ...s, [doubtId]: true }));
    try {
      await doubtAPI.answer(doubtId, { answer });
      toast.success('Answer submitted');
      setAnswers((a) => ({ ...a, [doubtId]: '' }));
      fetchDoubts();
    } catch { toast.error('Failed to submit answer'); }
    setSubmitting((s) => ({ ...s, [doubtId]: false }));
  };

  const pending = doubts.filter((d) => !(d.isResolved || d.resolved));
  const resolved = doubts.filter((d) => d.isResolved || d.resolved);

  const filtered = tab === 'pending' ? pending : tab === 'resolved' ? resolved : doubts;

  const tabs = [
    { key: 'all', label: 'All', count: doubts.length },
    { key: 'pending', label: 'Pending', count: pending.length },
    { key: 'resolved', label: 'Resolved', count: resolved.length },
  ];

  return (
    <div className="space-y-6">
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
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FiMessageSquare className="mx-auto text-4xl mb-3" />
          <p>No doubts found</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filtered.map((doubt, i) => (
              <motion.div key={doubt._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-semibold">
                      {(doubt.user?.name || 'S').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{doubt.user?.name || 'Student'}</p>
                      <p className="text-xs text-gray-500">{doubt.course?.title || 'Course'}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    doubt.isResolved ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {doubt.isResolved ? <FiCheckCircle size={11} /> : <FiClock size={11} />}
                    {doubt.isResolved ? 'Resolved' : 'Pending'}
                  </span>
                </div>

                <p className="text-sm text-gray-700 mb-3 bg-gray-50 rounded-xl p-3">{doubt.question}</p>

                {doubt.file && (
                  <div className="mb-3">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                      <FiPaperclip size={12} />
                      <span>Attachment</span>
                    </div>
                    {doubt.file.fileType?.startsWith('image/') ? (
                      <a href={doubt.file.filePath} target="_blank" rel="noopener noreferrer">
                        <img src={doubt.file.filePath} alt={doubt.file.fileName} className="max-h-32 rounded-lg object-contain bg-white border border-gray-100" />
                      </a>
                    ) : (
                      <a href={doubt.file.filePath} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-100 hover:border-blue-200 transition-colors text-xs text-gray-700"
                      >
                        <FiFile className="text-red-500" />
                        <span className="truncate max-w-[200px]">{doubt.file.fileName}</span>
                      </a>
                    )}
                  </div>
                )}

                {doubt.createdAt && (
                  <p className="text-xs text-gray-400 mb-3">{new Date(doubt.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                )}

                {doubt.isResolved && doubt.answer && (
                  <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-100">
                    <div className="flex items-center gap-2 mb-1">
                      <FiCheckCircle className="text-blue-600" size={14} />
                      <span className="text-xs font-medium text-blue-700">Answer {doubt.answeredByName ? `by ${doubt.answeredByName}` : ''}</span>
                    </div>
                    <p className="text-sm text-gray-700">{doubt.answer}</p>
                  </div>
                )}

                {!doubt.isResolved && (
                  <div className="mt-3">
                    <textarea
                      placeholder="Write your answer..."
                      value={answers[doubt._id] || ''}
                      onChange={(e) => setAnswers({ ...answers, [doubt._id]: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                      rows={2}
                    />
                    <button
                      onClick={() => handleAnswer(doubt._id)}
                      disabled={submitting[doubt._id]}
                      className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      <FiSend size={14} /> {submitting[doubt._id] ? 'Submitting...' : 'Submit Answer'}
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default Doubts;
