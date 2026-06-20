import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiHelpCircle, FiPlus, FiTrash2, FiUpload, FiEdit2, FiCheck, FiX, FiChevronDown,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { adminAPI } from '../../utils/api';

const QuizManager = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [mcqs, setMcqs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Add MCQ form
  const [showAdd, setShowAdd] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [explanation, setExplanation] = useState('');
  const [saving, setSaving] = useState(false);

  // CSV import
  const [showImport, setShowImport] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [importing, setImporting] = useState(false);
  const fileRef = useRef(null);

  // Edit
  const [editIdx, setEditIdx] = useState(-1);
  const [editQ, setEditQ] = useState('');
  const [editOpts, setEditOpts] = useState(['', '', '', '']);
  const [editCorrect, setEditCorrect] = useState(0);
  const [editExpl, setEditExpl] = useState('');

  useEffect(() => {
    adminAPI.getQuizCourses().then(({ data }) => setCourses(data)).catch(() => {});
  }, []);

  const selectedCourseData = courses.find(c => c._id === selectedCourse);

  const fetchMCQs = async () => {
    if (!selectedCourse || selectedChapter === '') return;
    setLoading(true);
    try {
      const { data } = await adminAPI.getChapterMCQs(selectedCourse, selectedChapter);
      setMcqs(data.mcqs || []);
    } catch { setMcqs([]); }
    setLoading(false);
  };

  useEffect(() => {
    setMcqs([]);
    if (selectedCourse && selectedChapter !== '') fetchMCQs();
  }, [selectedCourse, selectedChapter]);

  const handleAddMCQ = async () => {
    if (!question.trim()) return toast.error('Question required');
    if (options.some(o => !o.trim())) return toast.error('All 4 options required');
    setSaving(true);
    try {
      await adminAPI.addMCQ(selectedCourse, selectedChapter, {
        question: question.trim(),
        options: options.map(o => o.trim()),
        correctAnswer,
        explanation: explanation.trim(),
      });
      toast.success('MCQ added!');
      setQuestion(''); setOptions(['', '', '', '']); setCorrectAnswer(0); setExplanation(''); setShowAdd(false);
      fetchMCQs();
    } catch { toast.error('Failed to add'); }
    setSaving(false);
  };

  const handleCSVImport = async () => {
    if (!csvText.trim()) return toast.error('Paste CSV or select file');
    setImporting(true);
    try {
      const { data } = await adminAPI.importMCQs(selectedCourse, selectedChapter, csvText);
      toast.success(`Imported ${data.imported} MCQs, skipped ${data.skipped}`);
      setCsvText(''); setShowImport(false);
      fetchMCQs();
    } catch { toast.error('Import failed'); }
    setImporting(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCsvText(ev.target.result);
      setShowImport(true);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDeleteMCQ = async (idx) => {
    if (!confirm('Delete this MCQ?')) return;
    try {
      await adminAPI.deleteMCQ(selectedCourse, selectedChapter, idx);
      toast.success('Deleted');
      fetchMCQs();
    } catch { toast.error('Failed'); }
  };

  const startEdit = (idx) => {
    setEditIdx(idx);
    setEditQ(mcqs[idx].question);
    setEditOpts([...mcqs[idx].options]);
    setEditCorrect(mcqs[idx].correctAnswer);
    setEditExpl(mcqs[idx].explanation || '');
  };

  const saveEdit = async () => {
    try {
      await adminAPI.updateMCQ(selectedCourse, selectedChapter, editIdx, {
        question: editQ, options: editOpts, correctAnswer: editCorrect, explanation: editExpl,
      });
      toast.success('Updated');
      setEditIdx(-1);
      fetchMCQs();
    } catch { toast.error('Failed'); }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quiz Manager</h1>
        <p className="text-gray-500 text-sm mt-1">Add MCQ questions for course chapters</p>
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
                  <option key={ch.index} value={ch.index}>{ch.title} ({ch.mcqCount} MCQs)</option>
                ))}
              </select>
              <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {selectedCourse && selectedChapter !== '' && (
        <div className="flex gap-3 mb-6">
          <button onClick={() => setShowAdd(!showAdd)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-all">
            <FiPlus /> Add MCQ
          </button>
          <button onClick={() => setShowImport(!showImport)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 transition-all">
            <FiUpload /> Import CSV
          </button>
          <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
          <button onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-all">
            <FiUpload /> Upload CSV File
          </button>
        </div>
      )}

      {/* Add MCQ Form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6 overflow-hidden">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New MCQ</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Question</label>
                <input value={question} onChange={e => setQuestion(e.target.value)} placeholder="Enter question..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
              </div>
              {options.map((opt, i) => (
                <div key={i}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Option {i + 1}</label>
                  <input value={opt} onChange={e => { const n = [...options]; n[i] = e.target.value; setOptions(n); }}
                    placeholder={`Option ${i + 1}`}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Correct Answer</label>
                <div className="flex gap-2">
                  {['A', 'B', 'C', 'D'].map((label, i) => (
                    <button key={i} onClick={() => setCorrectAnswer(i)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${correctAnswer === i ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Explanation (optional)</label>
                <textarea rows={2} value={explanation} onChange={e => setExplanation(e.target.value)}
                  placeholder="Why is this the correct answer?"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddMCQ} disabled={saving}
                  className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save MCQ'}
                </button>
                <button onClick={() => setShowAdd(false)}
                  className="px-6 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CSV Import */}
      <AnimatePresence>
        {showImport && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6 overflow-hidden">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Import MCQs from CSV</h3>
            <p className="text-xs text-gray-500 mb-4">Format: question,option1,option2,option3,option4,correctAnswer,explanation (explanation optional)</p>
            <textarea rows={8} value={csvText} onChange={e => setCsvText(e.target.value)}
              placeholder={"What is 2+2?,3,4,5,6,B,Two plus two equals four\nSquare root of 9?,2,3,4,5,B,3 squared is 9"}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
            <div className="flex gap-2 mt-4">
              <button onClick={handleCSVImport} disabled={importing}
                className="px-6 py-2.5 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 disabled:opacity-50">
                {importing ? 'Importing...' : 'Import'}
              </button>
              <button onClick={() => { setShowImport(false); setCsvText(''); }}
                className="px-6 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MCQs List */}
      {selectedCourse && selectedChapter !== '' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">MCQs ({mcqs.length})</h3>
          </div>
          {loading ? (
            <div className="p-10 text-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : mcqs.length === 0 ? (
            <div className="p-10 text-center text-gray-500 text-sm">No MCQs yet. Add manually or import CSV.</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {mcqs.map((mcq, idx) => (
                <div key={idx} className="p-4 hover:bg-gray-50 transition-colors">
                  {editIdx === idx ? (
                    <div className="space-y-3">
                      <input value={editQ} onChange={e => setEditQ(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
                      {editOpts.map((o, oi) => (
                        <input key={oi} value={o} onChange={e => { const n = [...editOpts]; n[oi] = e.target.value; setEditOpts(n); }}
                          placeholder={`Option ${oi + 1}`}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
                      ))}
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">Correct:</span>
                        {['A', 'B', 'C', 'D'].map((l, i) => (
                          <button key={i} onClick={() => setEditCorrect(i)}
                            className={`px-3 py-1 rounded-lg text-xs font-medium ${editCorrect === i ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                            {l}
                          </button>
                        ))}
                      </div>
                      <textarea rows={2} value={editExpl} onChange={e => setEditExpl(e.target.value)}
                        placeholder="Explanation (optional)"
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
                      <div className="flex gap-2">
                        <button onClick={saveEdit} className="px-4 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg"><FiCheck className="inline" /> Save</button>
                        <button onClick={() => setEditIdx(-1)} className="px-4 py-1.5 border text-gray-600 text-xs font-medium rounded-lg"><FiX className="inline" /> Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 mb-1">{idx + 1}. {mcq.question}</p>
                        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                          {mcq.options.map((o, oi) => (
                            <span key={oi} className={`px-2 py-0.5 rounded-full ${oi === mcq.correctAnswer ? 'bg-green-100 text-green-700 font-medium' : 'bg-gray-100'}`}>
                              {['A', 'B', 'C', 'D'][oi]}. {o}
                            </span>
                          ))}
                        </div>
                        {mcq.explanation && (
                          <p className="text-xs text-blue-600 mt-1.5 bg-blue-50 px-2 py-1 rounded-lg">{mcq.explanation}</p>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => startEdit(idx)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"><FiEdit2 size={14} /></button>
                        <button onClick={() => handleDeleteMCQ(idx)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"><FiTrash2 size={14} /></button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuizManager;
