import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiBook, FiLayers, FiVideo, FiFileText, FiCheckCircle, FiPlus, FiTrash2,
  FiChevronRight, FiChevronLeft, FiSend, FiSave, FiImage, FiX, FiArrowUp, FiArrowDown,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { adminAPI } from '../../utils/api';

const STEPS = [
  { id: 1, label: 'Basic Details', icon: FiBook, color: 'blue' },
  { id: 2, label: 'Chapters', icon: FiLayers, color: 'green' },
  { id: 3, label: 'Videos', icon: FiVideo, color: 'yellow' },
  { id: 4, label: 'MCQs', icon: FiCheckCircle, color: 'purple' },
  { id: 5, label: 'Review', icon: FiCheckCircle, color: 'blue' },
];

const levels = {
  School: ['Class 8', 'Class 9', 'Class 10'],
  '+2': ['Class 11', 'Class 12'],
  Bachelor: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
  Master: ['1st Year', '2nd Year'],
  'Aayog Tayari': ['Loksewa Prepare', 'Kharidar', 'Nayab Subba'],
};

const categoryToLevel = { School: 'School', Plus2: '+2', Bachelor: 'Bachelor', Master: 'Master', Aayog: 'Aayog Tayari' };

const getCategory = (level, sublevel) => {
  if (level === 'School') return 'School';
  if (level === '+2') return 'Plus2';
  if (level === 'Bachelor') return 'Bachelor';
  if (level === 'Master') return 'Master';
  if (level === 'Aayog Tayari') return 'Aayog';
  return level;
};

const CourseWizard = ({ onClose, editCourse }) => {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [published, setPublished] = useState(false);
  const fileInputRef = useRef(null);

  const [data, setData] = useState(editCourse ? {
    title: editCourse.title || '',
    description: editCourse.description || '',
    level: editCourse.level || categoryToLevel[editCourse.category] || 'School',
    sublevel: editCourse.sublevel || (() => {
      const lvl = editCourse.level || categoryToLevel[editCourse.category] || 'School';
      return levels[lvl]?.[0] || editCourse.category || 'Class 8';
    })(),
    price: editCourse.price?.toString() || '',
    instructor: editCourse.instructor || '',
    thumbnail: editCourse.thumbnail || '',
    chapters: editCourse.chapters?.length > 0
      ? editCourse.chapters.map(ch => ({
          ...ch,
          pdfUrl: ch.pdfUrl || '',
          mcqs: ch.mcqs || [],
          videos: (ch.videos || []).map(v => ({ ...v, _id: v._id || v.id || crypto.randomUUID() })),
        }))
      : editCourse.lessons?.length > 0
        ? (() => {
            const grouped = groupLessonsIntoChapters(editCourse.lessons);
            return grouped.map((ch, i) => ({
              ...ch,
              pdfUrl: i === 0 && editCourse.pdfNotesUrl ? editCourse.pdfNotesUrl : '',
              mcqs: i === 0 && editCourse.mcqs?.length > 0 ? editCourse.mcqs : [],
            }));
          })()
        : [],
    status: editCourse.status || 'draft',
  } : {
    title: '', description: '', level: 'School', sublevel: 'Class 8',
    price: '', instructor: '', thumbnail: '', chapters: [],
    status: 'draft',
  });

  const [thumbnailPreview, setThumbnailPreview] = useState(data.thumbnail || '');

  function groupLessonsIntoChapters(lessons) {
    const map = {};
    lessons.forEach(l => {
      const chName = l.chapterName || 'General';
      if (!map[chName]) map[chName] = { name: chName, description: '', demoUrl: '', pdfUrl: '', videos: [], mcqs: [], marks: '' };
      map[chName].videos.push({
        _id: l._id || crypto.randomUUID(),
        order: l.order || map[chName].videos.length + 1,
        title: l.title,
        url: l.videoUrl || '',
        description: l.description || '',
        duration: l.duration || '',
        notesUrl: l.notesUrl || '',
        isFree: l.isFree || false,
      });
    });
    return Object.values(map);
  }

  const update = (field, value) => setData(prev => ({ ...prev, [field]: value }));

  const nextStep = () => {
    if (step === 1 && !data.title.trim()) { toast.error('Course name is required'); return; }
    if (step === 1 && !data.price) { toast.error('Course fee is required'); return; }
    if (step === 2 && data.chapters.length === 0) { toast.error('Add at least one chapter'); return; }
    setStep(s => Math.min(s + 1, 5));
  };
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  // Chapter management
  const addChapter = () => {
    setData(prev => ({
      ...prev,
      chapters: [...prev.chapters, { name: '', description: '', demoUrl: '', pdfUrl: '', videos: [], mcqs: [], marks: '' }],
    }));
  };
  const updateChapter = (i, field, value) => {
    setData(prev => {
      const ch = [...prev.chapters];
      ch[i] = { ...ch[i], [field]: value };
      return { ...prev, chapters: ch };
    });
  };
  const removeChapter = (i) => {
    setData(prev => ({ ...prev, chapters: prev.chapters.filter((_, idx) => idx !== i) }));
  };

  // Video management
  const addVideo = (chIdx) => {
    setData(prev => {
      const ch = [...prev.chapters];
      ch[chIdx] = {
        ...ch[chIdx],
        videos: [...ch[chIdx].videos, { _id: crypto.randomUUID(), order: ch[chIdx].videos.length + 1, title: '', url: '', description: '', duration: '', isFree: false }],
      };
      return { ...prev, chapters: ch };
    });
  };
  const updateVideo = (chIdx, vIdx, field, value) => {
    setData(prev => {
      const ch = [...prev.chapters];
      const videos = [...ch[chIdx].videos];
      videos[vIdx] = { ...videos[vIdx], [field]: value };
      ch[chIdx] = { ...ch[chIdx], videos };
      return { ...prev, chapters: ch };
    });
  };
  const removeVideo = (chIdx, vIdx) => {
    setData(prev => {
      const ch = [...prev.chapters];
      ch[chIdx] = { ...ch[chIdx], videos: ch[chIdx].videos.filter((_, idx) => idx !== vIdx) };
      return { ...prev, chapters: ch };
    });
  };
  const moveVideo = (chIdx, vIdx, dir) => {
    setData(prev => {
      const ch = [...prev.chapters];
      const videos = [...ch[chIdx].videos];
      const target = vIdx + dir;
      if (target < 0 || target >= videos.length) return prev;
      [videos[vIdx], videos[target]] = [videos[target], videos[vIdx]];
      videos.forEach((v, i) => (v.order = i + 1));
      ch[chIdx] = { ...ch[chIdx], videos };
      return { ...prev, chapters: ch };
    });
  };

  // MCQ management (per-chapter)
  const addMCQ = (chIdx) => {
    setData(prev => {
      const ch = [...prev.chapters];
      ch[chIdx] = {
        ...ch[chIdx],
        mcqs: [...(ch[chIdx].mcqs || []), { question: '', options: ['', '', '', ''], correctAnswer: 0 }]
      };
      return { ...prev, chapters: ch };
    });
  };
  const updateMCQ = (chIdx, i, field, value) => {
    setData(prev => {
      const ch = [...prev.chapters];
      const mcqs = [...(ch[chIdx].mcqs || [])];
      mcqs[i] = { ...mcqs[i], [field]: value };
      ch[chIdx] = { ...ch[chIdx], mcqs };
      return { ...prev, chapters: ch };
    });
  };
  const updateMCQOption = (chIdx, i, oIdx, value) => {
    setData(prev => {
      const ch = [...prev.chapters];
      const mcqs = [...(ch[chIdx].mcqs || [])];
      const options = [...mcqs[i].options];
      options[oIdx] = value;
      mcqs[i] = { ...mcqs[i], options };
      ch[chIdx] = { ...ch[chIdx], mcqs };
      return { ...prev, chapters: ch };
    });
  };
  const removeMCQ = (chIdx, i) => {
    setData(prev => {
      const ch = [...prev.chapters];
      ch[chIdx] = { ...ch[chIdx], mcqs: (ch[chIdx].mcqs || []).filter((_, idx) => idx !== i) };
      return { ...prev, chapters: ch };
    });
  };

  const handleThumbnailUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setThumbnailPreview(ev.target.result);
      update('thumbnail', ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const totalVideos = data.chapters.reduce((sum, ch) => sum + ch.videos.length, 0);

  const handleSubmit = async (status) => {
    setSubmitting(true);
    try {
      const payload = {
        ...data,
        status,
        price: parseFloat(data.price),
        category: getCategory(data.level, data.sublevel),
        isActive: status === 'published',
      };
      if (editCourse) {
        await adminAPI.wizardUpdateCourse(editCourse._id, payload);
        toast.success('Course updated');
      } else {
        await adminAPI.wizardCreateCourse(payload);
        toast.success('Course created');
      }
      setPublished(status === 'published');
      if (status === 'published') {
        setTimeout(() => { onClose(); }, 2000);
      } else {
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save course');
    }
    setSubmitting(false);
  };

  const inputClass = 'w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';
  const cardClass = 'bg-white rounded-2xl p-6 shadow-sm border border-gray-100';

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2 sm:p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        className="bg-gray-50 rounded-3xl w-full max-w-4xl shadow-2xl max-h-[95vh] overflow-y-auto relative"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-gray-100 rounded-t-3xl px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            {editCourse ? 'Edit Course' : 'Create New Course'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
            <FiX size={20} />
          </button>
        </div>

        {published ? (
          <div className="p-12 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-6">
              <FiCheckCircle className="text-green-600 text-4xl" />
            </motion.div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Course is Live on Website!</h3>
            <p className="text-gray-500">Students can now enroll and start learning.</p>
          </div>
        ) : (
          <>
            {/* Step Indicator */}
            <div className="px-6 pt-6 pb-2">
              <div className="flex items-center justify-between max-w-3xl mx-auto">
                {STEPS.map((s, idx) => {
                  const Icon = s.icon;
                  const isActive = step === s.id;
                  const isDone = step > s.id;
                  return (
                    <div key={s.id} className="flex items-center flex-1">
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                          isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-110' :
                          isDone ? 'bg-green-500 text-white' :
                          'bg-gray-100 text-gray-400'
                        }`}>
                          {isDone ? <FiCheckCircle size={18} /> : <Icon size={18} />}
                        </div>
                        <span className={`text-[10px] mt-1.5 font-medium whitespace-nowrap ${
                          isActive ? 'text-blue-600' : isDone ? 'text-green-600' : 'text-gray-400'
                        }`}>
                          {s.label}
                        </span>
                      </div>
                      {idx < STEPS.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-2 mt-[-1.2rem] rounded-full transition-colors ${
                          isDone ? 'bg-green-400' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step Content */}
            <div className="px-6 py-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }}
                >
                  {/* STEP 1: Basic Details */}
                  {step === 1 && (
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className={labelClass}>Course Name *</label>
                          <input type="text" placeholder="e.g. Class 10 Mathematics" value={data.title}
                            onChange={(e) => update('title', e.target.value)} className={inputClass} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={labelClass}>Level</label>
                            <select value={data.level} onChange={(e) => {
                              const lvl = e.target.value;
                              update('level', lvl);
                              update('sublevel', levels[lvl][0]);
                            }} className={inputClass}>
                              {Object.keys(levels).map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className={labelClass}>Sublevel</label>
                            <select value={data.sublevel} onChange={(e) => update('sublevel', e.target.value)} className={inputClass}>
                              {levels[data.level]?.map(sl => <option key={sl} value={sl}>{sl}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className={labelClass}>Description</label>
                        <textarea rows={3} placeholder="Brief description of the course..." value={data.description}
                          onChange={(e) => update('description', e.target.value)} className={inputClass} />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className={labelClass}>Course Fee (Rs.) *</label>
                          <input type="number" placeholder="e.g. 2999" value={data.price}
                            onChange={(e) => update('price', e.target.value)} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Instructor</label>
                          <input type="text" placeholder="Instructor name" value={data.instructor}
                            onChange={(e) => update('instructor', e.target.value)} className={inputClass} />
                        </div>
                      </div>

                      <div>
                        <label className={labelClass}>Thumbnail Image</label>
                        <div className="flex items-center gap-4">
                          <button type="button" onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2.5 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-all flex items-center gap-2">
                            <FiImage /> Upload Image
                          </button>
                          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleThumbnailUpload} className="hidden" />
                          {data.thumbnail && data.thumbnail.startsWith('data:image/') ? (
                            <div className="flex-1 px-4 py-2.5 border border-green-200 bg-green-50 rounded-xl text-sm text-green-700 flex items-center gap-2">
                              <FiImage size={16} /> Image uploaded
                            </div>
                          ) : (
                            <input type="text" placeholder="Or paste image URL" value={data.thumbnail}
                              onChange={(e) => { update('thumbnail', e.target.value); setThumbnailPreview(e.target.value); }}
                              className={inputClass + ' flex-1'} />
                          )}
                        </div>
                        {thumbnailPreview && (
                          <div className="mt-3 relative inline-block">
                            <div className="w-48 h-28 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                              <img src={thumbnailPreview} alt="Preview" className="w-full h-full object-contain" />
                            </div>
                            <button onClick={() => { setThumbnailPreview(''); update('thumbnail', ''); }}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">
                              <FiX size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* STEP 2: Chapters */}
                  {step === 2 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">Create chapters to organize your course content.</p>
                        <button onClick={addChapter} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-all">
                          <FiPlus size={16} /> Create Chapter
                        </button>
                      </div>

                      {data.chapters.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
                          <FiLayers size={40} className="mx-auto mb-3 text-gray-300" />
                          <p className="text-sm">No chapters yet. Click "Create Chapter" to begin.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {data.chapters.map((ch, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                              <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-green-50 to-blue-50 border-b border-gray-100">
                                <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                  <FiLayers className="text-green-600" size={16} />
                                  Chapter {i + 1}
                                </span>
                                <button onClick={() => removeChapter(i)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                  <FiTrash2 size={15} />
                                </button>
                              </div>
                              <div className="p-5 space-y-3">
                                <input type="text" placeholder="Chapter name" value={ch.name}
                                  onChange={(e) => updateChapter(i, 'name', e.target.value)} className={inputClass} />
                                <textarea rows={2} placeholder="Chapter description (optional)" value={ch.description}
                                  onChange={(e) => updateChapter(i, 'description', e.target.value)} className={inputClass} />
                                <input type="text" placeholder="Demo YouTube URL (optional)" value={ch.demoUrl}
                                  onChange={(e) => updateChapter(i, 'demoUrl', e.target.value)} className={inputClass} />
                                <input type="text" placeholder="PDF notes URL (Google Drive link)" value={ch.pdfUrl}
                                  onChange={(e) => updateChapter(i, 'pdfUrl', e.target.value)} className={inputClass} />
                                <input type="number" placeholder="Marks (e.g. 10)" value={ch.marks ?? ''}
                                  onChange={(e) => updateChapter(i, 'marks', e.target.value === '' ? '' : Number(e.target.value))}
                                  className={inputClass} min="0" />
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* STEP 3: Videos */}
                  {step === 3 && (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-500">Add videos to each chapter. Drag to reorder.</p>

                      {data.chapters.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
                          <FiVideo size={40} className="mx-auto mb-3 text-gray-300" />
                          <p className="text-sm">No chapters yet. Go back and create chapters first.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {data.chapters.map((ch, chIdx) => (
                            <div key={chIdx} className={cardClass}>
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                  <FiLayers className="text-blue-600" size={16} />
                                  {ch.name || `Chapter ${chIdx + 1}`}
                                  <span className="text-xs text-gray-400 font-normal">({ch.videos.length} videos)</span>
                                </h4>
                                <button onClick={() => addVideo(chIdx)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg text-xs font-medium hover:bg-yellow-100 transition-all">
                                  <FiPlus size={13} /> Add Video
                                </button>
                              </div>

                              {ch.videos.length === 0 ? (
                                <p className="text-xs text-gray-400 text-center py-4 bg-gray-50 rounded-xl">No videos in this chapter. Click "Add Video".</p>
                              ) : (
                                <div className="space-y-2">
                                  {ch.videos.map((v, vIdx) => (
                                    <motion.div key={vIdx} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                      className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-bold text-gray-400 bg-white w-6 h-6 rounded-lg flex items-center justify-center border">{v.order || vIdx + 1}</span>
                                          <div className="flex flex-col sm:flex-row gap-1.5">
                                            <button onClick={() => moveVideo(chIdx, vIdx, -1)} disabled={vIdx === 0}
                                              className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 rounded-lg hover:bg-white transition-all"><FiArrowUp size={14} /></button>
                                            <button onClick={() => moveVideo(chIdx, vIdx, 1)} disabled={vIdx === ch.videos.length - 1}
                                              className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 rounded-lg hover:bg-white transition-all"><FiArrowDown size={14} /></button>
                                          </div>
                                        </div>
                                        <button onClick={() => removeVideo(chIdx, vIdx)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg shrink-0 transition-all">
                                          <FiTrash2 size={14} />
                                        </button>
                                      </div>
                                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
                                        <input type="text" placeholder="Video title" value={v.title}
                                          onChange={(e) => updateVideo(chIdx, vIdx, 'title', e.target.value)}
                                          className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white" />
                                        <input type="text" placeholder="YouTube/Vimeo URL" value={v.url}
                                          onChange={(e) => updateVideo(chIdx, vIdx, 'url', e.target.value)}
                                          className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white" />
                                        <input type="text" placeholder="Duration (e.g. 15:00)" value={v.duration}
                                          onChange={(e) => updateVideo(chIdx, vIdx, 'duration', e.target.value)}
                                          className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white" />
                                      </div>
                                      <input type="text" placeholder="Video description (optional)" value={v.description}
                                        onChange={(e) => updateVideo(chIdx, vIdx, 'description', e.target.value)}
                                        className="mt-2 px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white w-full" />
                                    </motion.div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* STEP 4: MCQs per Chapter */}
                  {step === 4 && (
                    <div className="space-y-6">
                      <p className="text-sm text-gray-500">Add multiple-choice questions for each chapter.</p>
                      {data.chapters.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
                          <FiCheckCircle size={40} className="mx-auto mb-3 text-gray-300" />
                          <p className="text-sm">No chapters yet. Go back and create chapters first.</p>
                        </div>
                      ) : (
                        data.chapters.map((ch, chIdx) => (
                          <div key={chIdx} className={cardClass}>
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                <FiLayers className="text-purple-600" />
                                {ch.name || `Chapter ${chIdx + 1}`} — MCQs
                                <span className="text-xs text-gray-400 font-normal">({(ch.mcqs || []).length} questions)</span>
                              </h4>
                              <button onClick={() => addMCQ(chIdx)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-medium hover:bg-purple-100 transition-all">
                                <FiPlus size={13} /> Add Question
                              </button>
                            </div>

                            {(ch.mcqs || []).length === 0 ? (
                              <p className="text-xs text-gray-400 text-center py-6 bg-gray-50 rounded-xl">No MCQs for this chapter. Click "Add Question".</p>
                            ) : (
                              <div className="space-y-3">
                                {ch.mcqs.map((mcq, i) => (
                                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                    <div className="flex items-start justify-between mb-3">
                                      <span className="text-xs font-semibold text-gray-500 bg-white px-2 py-1 rounded-lg border">Q{i + 1}</span>
                                      <button onClick={() => removeMCQ(chIdx, i)} className="p-1 text-gray-400 hover:text-red-500 transition-all"><FiTrash2 size={14} /></button>
                                    </div>
                                    <input type="text" placeholder="Enter question" value={mcq.question}
                                      onChange={(e) => updateMCQ(chIdx, i, 'question', e.target.value)}
                                      className="mb-3 px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 bg-white w-full" />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {[0, 1, 2, 3].map(o => (
                                        <label key={o} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs cursor-pointer transition-all ${
                                          mcq.correctAnswer === o ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-white hover:border-gray-300'
                                        }`}>
                                          <input type="radio" name={`mcq-${chIdx}-${i}`} checked={mcq.correctAnswer === o}
                                            onChange={() => updateMCQ(chIdx, i, 'correctAnswer', o)} className="accent-green-600" />
                                          <input type="text" placeholder={`Option ${o + 1}`} value={mcq.options[o]}
                                            onChange={(e) => updateMCQOption(chIdx, i, o, e.target.value)}
                                            className="flex-1 bg-transparent text-xs focus:outline-none" />
                                          {mcq.correctAnswer === o && <span className="text-green-600 text-[10px] font-medium shrink-0">Correct</span>}
                                        </label>
                                      ))}
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* STEP 5: Review */}
                  {step === 5 && (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-500">Review your course before publishing.</p>

                      <div className={cardClass}>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <FiBook className="text-blue-600" /> Basic Details
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div><span className="text-gray-400">Title:</span> <span className="text-gray-800 font-medium">{data.title || '—'}</span></div>
                          <div><span className="text-gray-400">Category:</span> <span className="text-gray-800">{data.level} / {data.sublevel}</span></div>
                          <div><span className="text-gray-400">Fee:</span> <span className="text-gray-800 font-medium">Rs. {parseFloat(data.price || 0).toLocaleString()}</span></div>
                          <div><span className="text-gray-400">Instructor:</span> <span className="text-gray-800">{data.instructor || '—'}</span></div>
                        </div>
                        {data.thumbnail && (
                          <img src={data.thumbnail} alt="Thumbnail" className="mt-3 h-20 rounded-lg object-cover" />
                        )}
                      </div>

                      <div className={cardClass}>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <FiLayers className="text-green-600" /> Chapters & Videos
                        </h4>
                        {data.chapters.length === 0 ? (
                          <p className="text-xs text-gray-400">No chapters</p>
                        ) : (
                          <div className="space-y-2">
                            {data.chapters.map((ch, i) => (
                              <div key={i} className="bg-gray-50 rounded-xl p-3">
                                <p className="text-sm font-medium text-gray-800">{ch.name || `Chapter ${i + 1}`}</p>
                                <p className="text-xs text-gray-400">
                                  {ch.videos?.length || 0} video(s)
                                  {ch.pdfUrl ? ' | PDF' : ''}
                                  {(ch.mcqs?.length || 0) > 0 ? ` | ${ch.mcqs.length} MCQ(s)` : ''}
                                  {ch.demoUrl ? ' | Demo' : ''}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className={cardClass}>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <FiFileText className="text-purple-600" /> Chapter Materials & MCQs
                        </h4>
                        {data.chapters.length === 0 ? (
                          <p className="text-xs text-gray-400">No chapters</p>
                        ) : (
                          <div className="space-y-2">
                            {data.chapters.map((ch, i) => (
                              <div key={i} className="bg-gray-50 rounded-xl p-3 text-sm">
                                <p className="font-medium text-gray-800">{ch.name || `Chapter ${i + 1}`}</p>
                                <div className="text-xs text-gray-500 space-y-0.5 mt-1">
                                  <p>PDF: {ch.pdfUrl ? <span className="text-blue-600">Provided</span> : <span className="text-gray-400">None</span>}</p>
                                  <p>Videos: {ch.videos?.length || 0}</p>
                                  <p>MCQs: {ch.mcqs?.length || 0} question(s)</p>
                                  <p>Marks: {ch.marks ? `${ch.marks}` : 'Not set'}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <button onClick={() => handleSubmit('draft')} disabled={submitting}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50">
                          <FiSave size={16} /> Save as Draft
                        </button>
                        <button onClick={() => handleSubmit('published')} disabled={submitting}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium text-sm hover:shadow-lg hover:shadow-blue-600/20 transition-all disabled:opacity-50">
                          {submitting ? 'Publishing...' : <><FiSend size={16} /> Publish Course</>}
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="sticky bottom-0 bg-white/80 backdrop-blur-xl border-t border-gray-100 rounded-b-3xl px-6 py-4 flex items-center justify-between">
              <div className="text-xs text-gray-400">
                Step {step} of 5
                {step === 3 && totalVideos > 0 && <span className="ml-2 text-blue-600">| {totalVideos} video(s) total</span>}
              </div>
              <div className="flex gap-3">
                {step > 1 && (
                  <button onClick={prevStep} className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all">
                    <FiChevronLeft size={16} /> Back
                  </button>
                )}
                {step < 5 && (
                  <button onClick={nextStep} className="inline-flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all">
                    Next <FiChevronRight size={16} />
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

export default CourseWizard;
