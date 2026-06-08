import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiCheckCircle, FiCircle, FiDownload, FiChevronLeft, FiChevronRight,
  FiPlay, FiPause, FiFileText, FiBookOpen, FiChevronDown, FiChevronUp,
  FiSmile, FiHelpCircle, FiX, FiVolume2, FiVolumeX, FiMaximize2, FiMinimize2,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import ReactPlayer from 'react-player';
import { courseAPI, studentAPI } from '../../utils/api';

function getGoogleDriveFileId(url) {
  if (!url || !url.includes('drive.google.com')) return null;
  try {
    const u = new URL(url);
    const match1 = u.pathname.match(/\/file\/d\/([^/]+)/);
    if (match1) return match1[1];
    const id = u.searchParams.get('id');
    if (id) return id;
    const match2 = u.pathname.match(/\/uc\?.*id=([^&]+)/);
    if (match2) return match2[1];
  } catch {}
  return null;
}

function getYouTubeEmbedUrl(url) {
  if (!url || (!url.includes('youtube') && !url.includes('youtu.be'))) return url;
  try {
    let videoId = '';
    if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0]?.split('/')[0] || '';
    } else {
      const u = new URL(url);
      videoId = u.searchParams.get('v') || '';
    }
    if (!videoId) return url;
    return `https://www.youtube-nocookie.com/embed/${videoId}?controls=1&modestbranding=1&rel=0&iv_load_policy=3&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`;
  } catch { return url; }
}

function normalizeChapters(course) {
  if (course.chapters?.length > 0) {
    return course.chapters.map((ch, chIdx) => ({
      ...ch,
      pdfUrl: ch.pdfUrl || '',
      mcqs: ch.mcqs || [],
      videos: (ch.videos || []).map((v, vIdx) => ({ ...v, _id: v._id || v.id || `c${chIdx}v${vIdx}` })),
    }));
  }
  if (course.lessons?.length > 0) {
    const map = {};
    course.lessons.forEach(l => {
      const chName = l.chapterName || 'General';
      if (!map[chName]) map[chName] = { name: chName, description: '', pdfUrl: '', videos: [], mcqs: [] };
      map[chName].videos.push({
        _id: l._id,
        title: l.title,
        url: l.videoUrl || '',
        duration: l.duration || '',
        description: l.description || '',
        isFree: l.isFree || false,
        completed: l.completed || false,
      });
    });
    const chapters = Object.values(map);
    if (course.mcqs?.length > 0 && chapters.length > 0) {
      chapters[0].mcqs = course.mcqs;
    }
    if (course.pdfNotesUrl && chapters.length > 0) {
      chapters[0].pdfUrl = course.pdfNotesUrl;
    }
    return chapters;
  }
  return [];
}

function getAllVideos(chapters) {
  const result = [];
  chapters.forEach((ch, chIdx) => {
    ch.videos.forEach(v => {
      result.push({ ...v, chapterIndex: chIdx, chapterName: ch.name });
    });
  });
  return result;
}

function getChapterStats(chapters) {
  const totalChapters = chapters.length;
  const totalVideos = chapters.reduce((s, ch) => s + ch.videos.length, 0);
  const totalMCQs = chapters.reduce((s, ch) => s + (ch.mcqs?.length || 0), 0);
  return { totalChapters, totalVideos, totalMCQs };
}

const MCQPractice = ({ mcqs, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex || 0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState({});
  const mcq = mcqs?.[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === mcqs.length - 1;

  if (!mcqs || mcqs.length === 0 || !mcq) return null;

  const handleSelect = (idx) => {
    if (revealed) return;
    setSelected(idx);
    setRevealed(true);
    const correct = idx === mcq.correctAnswer;
    if (!answered[currentIndex]) {
      setAnswered(prev => ({ ...prev, [currentIndex]: correct }));
      if (correct) setScore(s => s + 1);
    }
  };

  const goTo = (idx) => {
    if (idx < 0 || idx >= mcqs.length) return;
    setCurrentIndex(idx);
    setSelected(null);
    setRevealed(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">Practice MCQ</h3>
            <p className="text-xs text-gray-400 mt-0.5">Question {currentIndex + 1} of {mcqs.length}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
              Score: {score}/{Object.keys(answered).length}
            </span>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <FiX size={18} />
            </button>
          </div>
        </div>

        <p className="text-gray-800 font-medium mb-4">{mcq.question}</p>
        <div className="space-y-2.5">
          {mcq.options.map((opt, oi) => {
            const isCorrect = oi === mcq.correctAnswer;
            const isSelected = selected === oi;
            let borderClass = 'border-gray-200 hover:border-gray-300 bg-white';
            let icon = null;
            if (revealed && isCorrect) { borderClass = 'border-green-400 bg-green-50'; icon = <FiCheckCircle className="text-green-600 shrink-0" />; }
            else if (revealed && isSelected && !isCorrect) { borderClass = 'border-red-400 bg-red-50'; icon = <FiX className="text-red-600 shrink-0" />; }
            else if (isSelected) { borderClass = 'border-blue-400 bg-blue-50'; }
            return (
              <button key={oi} onClick={() => handleSelect(oi)}
                className={`w-full text-left p-3.5 rounded-xl border-2 transition-all flex items-center gap-3 ${borderClass}`}>
                <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center text-sm font-medium shrink-0 ${
                  revealed && isCorrect ? 'border-green-600 bg-green-600 text-white' :
                  revealed && isSelected && !isCorrect ? 'border-red-600 bg-red-600 text-white' :
                  isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 text-gray-400'
                }`}>
                  {String.fromCharCode(65 + oi)}
                </div>
                <span className="text-sm text-gray-700 flex-1">{opt}</span>
                {icon}
              </button>
            );
          })}
        </div>

        {revealed && (
          <p className={`text-sm mt-4 font-medium ${selected === mcq.correctAnswer ? 'text-green-600' : 'text-red-600'}`}>
            {selected === mcq.correctAnswer ? 'Correct!' : `Incorrect. Correct answer: ${mcq.options[mcq.correctAnswer]}`}
          </p>
        )}

        <div className="flex items-center justify-between mt-5 gap-3">
          <button onClick={() => goTo(currentIndex - 1)} disabled={isFirst}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1 ${
              isFirst ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}>
            <FiChevronLeft /> Previous
          </button>
          <span className="text-xs text-gray-400">Question {currentIndex + 1}/{mcqs.length}</span>
          <button onClick={() => goTo(currentIndex + 1)} disabled={isLast}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1 ${
              isLast ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}>
            Next <FiChevronRight />
          </button>
        </div>

        <button onClick={onClose}
          className="mt-3 w-full py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-all">
          Close
        </button>
      </motion.div>
    </motion.div>
  );
};

const WatchVideo = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [expandedChapter, setExpandedChapter] = useState(null);
  const [mcqPractice, setMcqPractice] = useState(null);
  const [showMCQ, setShowMCQ] = useState({});
  const [playing, setPlaying] = useState(true);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const playerRef = useRef(null);
  const playerContainerRef = useRef(null);

  useEffect(() => {
    const onFsChange = () => {
      const fs = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
      setIsFullscreen(fs);
      if (!fs && screen.orientation && screen.orientation.unlock) {
        try { screen.orientation.unlock(); } catch {}
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    document.addEventListener('mozfullscreenchange', onFsChange);
    document.addEventListener('MSFullscreenChange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
      document.removeEventListener('mozfullscreenchange', onFsChange);
      document.removeEventListener('MSFullscreenChange', onFsChange);
    };
  }, []);

  const allVideos = getAllVideos(chapters);
  const currentIndex = allVideos.findIndex(v => v._id === lessonId);
  const currentLesson = allVideos[currentIndex] || allVideos[0];
  const prevLesson = currentIndex > 0 ? allVideos[currentIndex - 1] : null;
  const nextLesson = currentIndex < allVideos.length - 1 ? allVideos[currentIndex + 1] : null;
  const stats = getChapterStats(chapters);

  useEffect(() => {
    const container = playerContainerRef.current;
    if (!container) return;
    const ensurePlaysinline = () => {
      const iframes = container.querySelectorAll('iframe');
      iframes.forEach(iframe => {
        try {
          const src = iframe.getAttribute('src') || '';
          if (!/playsinline=1/.test(src)) {
            const sep = src.includes('?') ? '&' : '?';
            iframe.setAttribute('src', `${src}${sep}playsinline=1`);
          }
        } catch {}
      });
    };
    ensurePlaysinline();
    const observer = new MutationObserver(ensurePlaysinline);
    observer.observe(container, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [currentLesson?._id]);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const { data } = await courseAPI.getOne(courseId);
        setCourse(data);
        const chs = normalizeChapters(data);
        setChapters(chs);
        const allV = getAllVideos(chs);
        const idx = allV.findIndex(v => v._id === lessonId);
        if (idx < 0 && allV.length > 0) {
          navigate(`/dashboard/student/course/${courseId}/lesson/${allV[0]._id}`, { replace: true });
        }
        if (chs.length > 0) {
          const chIdx = chs.findIndex(ch => ch.videos.some(v => v._id === lessonId));
          setExpandedChapter(chIdx >= 0 ? chIdx : 0);
        }
      } catch {
        setCourse({
          _id: courseId, title: 'Sample Course', instructor: 'Ram Sharma',
          description: 'Comprehensive course covering all major topics.',
        });
      } finally {
        setLoading(false);
      }
    };
    if (courseId) fetchCourse();
  }, [courseId]);

  useEffect(() => {
    if (currentLesson) {
      setCompleted(currentLesson.completed || false);
      setPlaying(true);
    }
  }, [currentLesson?._id]);

  const handlePlayPause = () => setPlaying(p => !p);
  const handleProgress = ({ played: p }) => { if (!seeking) setPlayed(p); };
  const handleDuration = (d) => setDuration(d);
  const handleSeekChange = (e) => setPlayed(parseFloat(e.target.value));
  const handleSeekMouseDown = () => setSeeking(true);
  const handleSeekMouseUp = (e) => {
    setSeeking(false);
    playerRef.current?.seekTo(parseFloat(e.target.value));
  };
  const handleVolumeChange = (e) => setVolume(parseFloat(e.target.value));
  const toggleMute = () => setMuted(m => !m);
  const toggleFullscreen = useCallback(async () => {
    const el = playerContainerRef.current;
    if (!document.fullscreenElement) {
      const req = el?.requestFullscreen || el?.webkitRequestFullscreen || el?.mozRequestFullScreen || el?.msRequestFullscreen;
      if (req) {
        try {
          await req.call(el);
          setIsFullscreen(true);
          if (screen.orientation && screen.orientation.lock) {
            try { await screen.orientation.lock('landscape'); } catch {}
          }
        } catch {}
      }
    } else {
      const exit = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
      if (exit) {
        try { await exit.call(document); setIsFullscreen(false); } catch {}
        if (screen.orientation && screen.orientation.unlock) {
          try { screen.orientation.unlock(); } catch {}
        }
      }
    }
  }, []);
  const formatTime = (s) => {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handleMarkComplete = async () => {
    try {
      await studentAPI.markLessonComplete(lessonId, courseId);
      setCompleted(true);
      toast.success('Lesson marked as complete!');
    } catch {
      toast.error('Failed to mark lesson');
    }
  };

  const handleNext = () => {
    if (nextLesson) navigate(`/dashboard/student/course/${courseId}/lesson/${nextLesson._id}`);
  };

  const handlePrev = () => {
    if (prevLesson) navigate(`/dashboard/student/course/${courseId}/lesson/${prevLesson._id}`);
  };

  const toggleChapter = (idx) => {
    setExpandedChapter(expandedChapter === idx ? null : idx);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const gdriveFileId = currentLesson?.url ? getGoogleDriveFileId(currentLesson.url) : null;

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Left: Video Player */}
      <div className="flex-1 min-w-0">
        <div ref={playerContainerRef} className="bg-black rounded-2xl overflow-hidden relative group" style={{ aspectRatio: '16/9' }}>
          {currentLesson?.url ? (
            <>
              {gdriveFileId ? (
                <iframe
                  key={currentLesson._id}
                  src={`https://drive.google.com/file/d/${gdriveFileId}/preview`}
                  width="100%"
                  height="100%"
                  allow="autoplay"
                  allowFullScreen={false}
                  frameBorder="0"
                  className="absolute inset-0 w-full h-full"
                />
              ) : (
                <ReactPlayer
                  key={currentLesson._id}
                  ref={playerRef}
                  url={getYouTubeEmbedUrl(currentLesson.url)}
                  width="100%"
                  height="100%"
                  playing={playing}
                  volume={volume}
                  muted={muted}
                  onProgress={handleProgress}
                  onDuration={handleDuration}
                  onPlay={() => setPlaying(true)}
                  onPause={() => setPlaying(false)}
                  onEnded={() => setPlaying(false)}
                  config={{
                    youtube: {
                      playerVars: { modestbranding: 1, rel: 0, iv_load_policy: 3, controls: 1, playsinline: 1, enablejsapi: 1, origin: window.location.origin },
                    },
                  }}
                  style={{ pointerEvents: playing ? 'auto' : 'none' }}
                  className="react-player"
                />
              )}

              <div
                onClick={(e) => { e.stopPropagation(); handlePlayPause(); }}
                onTouchStart={(e) => { e.stopPropagation(); }}
                className="absolute inset-0 z-0"
                style={{ background: 'transparent' }}
                aria-label="Tap to play/pause"
              />

              {!playing && (
                <button onClick={handlePlayPause}
                  className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity z-10">
                  <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                    <FiPlay className="text-gray-900 ml-1" size={28} />
                  </div>
                </button>
              )}

              <button onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                className="absolute top-3 right-3 z-30 text-white/80 hover:text-white bg-black/40 hover:bg-black/60 rounded-lg p-2 transition-all backdrop-blur-sm">
                {isFullscreen ? <FiMinimize2 size={18} /> : <FiMaximize2 size={18} />}
              </button>

              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent px-3 pb-4 pt-10 z-20">
                <input type="range" min={0} max={1} step={0.001} value={played}
                  onMouseDown={handleSeekMouseDown} onMouseUp={handleSeekMouseUp}
                  onTouchStart={handleSeekMouseDown} onTouchEnd={handleSeekMouseUp}
                  onChange={handleSeekChange}
                  className="w-full h-1 appearance-none bg-white/30 rounded-full cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                    [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow"
                  style={{ background: `linear-gradient(to right, white ${played * 100}%, rgba(255,255,255,0.3) ${played * 100}%)` }} />

                <div className="flex items-center justify-between mt-1.5">
                  <div className="flex items-center gap-2">
                    {currentLesson?.chapterName && (
                      <span className="bg-black text-white text-sm font-extrabold tracking-wider px-4 py-1.5 rounded-lg truncate max-w-[180px]">Ch {currentLesson.chapterIndex + 1} ({currentLesson.chapterName})</span>
                    )}
                    <button onClick={handlePlayPause} className="text-white hover:text-blue-300 transition-colors">
                      {playing ? <FiPause size={16} /> : <FiPlay size={16} />}
                    </button>
                    <span className="text-white/80 text-[11px] font-mono">{formatTime(played * duration)} / {formatTime(duration)}</span>
                    <button onClick={toggleMute} className="text-white/70 hover:text-white transition-colors ml-1">
                      {muted || volume === 0 ? <FiVolumeX size={14} /> : <FiVolume2 size={14} />}
                    </button>
                    <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-16 h-1 appearance-none bg-white/30 rounded-full cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5
                        [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full" />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="bg-black text-white text-sm font-extrabold tracking-wider px-4 py-1.5 rounded-lg shadow-lg">Hamro Tuition</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-900">
              <div className="text-center">
                <FiPlay className="text-white/30 text-6xl mx-auto mb-4" />
                <p className="text-white/60 text-sm">Video not available</p>
              </div>
            </div>
          )}
            <div className="w-full h-full flex items-center justify-center bg-gray-900">
              <div className="text-center">
                <FiPlay className="text-white/30 text-6xl mx-auto mb-4" />
                <p className="text-white/60 text-sm">Video not available</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 lg:mt-6">
          <div className="mb-4">
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
              {course?.title || 'Course'}
              {course?.instructor && <span className="font-bold text-blue-800 text-base ml-2">by {course.instructor}</span>}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {currentLesson?.chapterName
                ? `Chapter ${(currentLesson?.chapterIndex ?? 0) + 1} (${currentLesson.chapterName}) → ${currentLesson?.title || 'Lesson'}`
                : currentLesson?.title || 'Lesson'}
              {currentLesson?.duration && <span className="ml-2 text-xs text-gray-400">({currentLesson.duration})</span>}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleMarkComplete}
              disabled={completed}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                completed
                  ? 'bg-green-100 text-green-700 cursor-default'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-600/20'
              }`}
            >
              <FiCheckCircle className={completed ? 'text-green-600' : ''} />
              {completed ? 'Completed' : 'Mark as Complete'}
            </button>

            {prevLesson && (
              <button onClick={handlePrev}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">
                <FiChevronLeft /> Previous
              </button>
            )}
            {nextLesson && (
              <button onClick={handleNext}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">
                Next <FiChevronRight />
              </button>
            )}
          </div>

          {course?.description && (
            <div className="mt-6 p-5 bg-white rounded-2xl border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-2">About This Course</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">{course.description}</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="py-2 pr-3 font-semibold text-gray-700">Chapter</th>
                      <th className="py-2 px-3 font-semibold text-gray-700 text-center">Videos</th>
                      <th className="py-2 px-3 font-semibold text-gray-700 text-center">MCQs</th>
                      <th className="py-2 pl-3 font-semibold text-gray-700 text-center">Marks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chapters.map((ch, i) => (
                      <tr key={i} className="border-b border-gray-50">
                        <td className="py-2 pr-3 text-gray-600">Chapter {i + 1} ({ch.name || 'Untitled'})</td>
                        <td className="py-2 px-3 text-gray-600 text-center">{ch.videos.length}</td>
                        <td className="py-2 px-3 text-gray-600 text-center">{(ch.mcqs || []).length}</td>
                        <td className="py-2 pl-3 text-gray-600 text-center">{ch.marks ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-gray-200 font-semibold">
                      <td className="py-2 pr-3 text-gray-800">Total</td>
                      <td className="py-2 px-3 text-gray-800 text-center">{chapters.reduce((s, ch) => s + ch.videos.length, 0)}</td>
                      <td className="py-2 px-3 text-gray-800 text-center">{chapters.reduce((s, ch) => s + (ch.mcqs || []).length, 0)}</td>
                      <td className="py-2 pl-3 text-gray-800 text-center">{chapters.reduce((s, ch) => s + (Number(ch.marks) || 0), 0) || '-'}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Chapter Sidebar */}
      <div className="lg:w-80 xl:w-96 flex-shrink-0">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden lg:sticky lg:top-6">

          {/* Chapter Accordion */}
          <div className="max-h-[calc(100vh-350px)] overflow-y-auto">
            {chapters.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-400">No content available</div>
            ) : (
              chapters.map((ch, chIdx) => {
                const isExpanded = expandedChapter === chIdx;
                const hasCurrentVideo = ch.videos.some(v => v._id === (currentLesson?._id || lessonId));
                return (
                  <div key={chIdx} className="border-b border-gray-50 last:border-0">
                    <button
                      onClick={() => toggleChapter(chIdx)}
                      className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                        hasCurrentVideo ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FiBookOpen className={`shrink-0 ${hasCurrentVideo ? 'text-blue-600' : 'text-gray-400'}`} size={15} />
                        <div className="min-w-0">
                          <p className={`text-sm truncate ${hasCurrentVideo ? 'font-semibold text-blue-700' : 'font-medium text-gray-700'}`}>
                            {`Chapter ${chIdx + 1} (${ch.name || 'Untitled'})`}
                          </p>
                          <p className="text-xs text-gray-400">
                            {ch.videos.length} video(s)
                            {ch.pdfUrl ? ' | PDF' : ''}
                            {(ch.mcqs?.length || 0) > 0 ? ` | ${ch.mcqs.length} MCQ` : ''}
                          </p>
                        </div>
                      </div>
                      {isExpanded ? <FiChevronUp size={16} className="text-gray-400 shrink-0" /> : <FiChevronDown size={16} className="text-gray-400 shrink-0" />}
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-3 space-y-1.5">
                            {/* PDF Link */}
                            {ch.pdfUrl && (
                              <a href={ch.pdfUrl} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors">
                                <FiDownload size={14} /> Download PDF Notes
                              </a>
                            )}

                            {/* Videos */}
                            {ch.videos.map((v) => {
                              const isCurrent = v._id === (currentLesson?._id || lessonId);
                              return (
                                <Link
                                  key={v._id}
                                  to={`/dashboard/student/course/${courseId}/lesson/${v._id}`}
                                  onClick={() => setExpandedChapter(chIdx)}
                                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                                    isCurrent
                                      ? 'bg-blue-100 text-blue-700 font-semibold'
                                      : 'text-gray-600 hover:bg-gray-100'
                                  }`}
                                >
                                  {isCurrent ? (
                                    <FiPlay size={12} className="text-blue-600 shrink-0" />
                                  ) : v.completed ? (
                                    <FiCheckCircle size={12} className="text-green-500 shrink-0" />
                                  ) : (
                                    <FiCircle size={12} className="text-gray-300 shrink-0" />
                                  )}
                                  <span className="truncate flex-1">{v.title}</span>
                                  {v.duration && <span className="text-gray-400 shrink-0">{v.duration}</span>}
                                </Link>
                              );
                            })}

                            {/* MCQs */}
                            {(ch.mcqs || []).length > 0 && (
                              <div className="mt-2 pt-2 border-t border-gray-100">
                                <button
                                  onClick={() => setShowMCQ(prev => ({ ...prev, [chIdx]: !prev[chIdx] }))}
                                  className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-medium text-purple-600 hover:bg-purple-50 transition-colors text-left"
                                >
                                  <span className="flex items-center gap-2">
                                    <FiSmile size={14} className="text-purple-500 shrink-0" />
                                    Practice MCQ ({ch.mcqs.length})
                                  </span>
                                  {showMCQ[chIdx] ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                                </button>
                                {showMCQ[chIdx] && (
                                  <button
                                    onClick={() => setMcqPractice({ mcqs: ch.mcqs, initialIndex: 0, score: 0 })}
                                    className="flex items-center gap-2 w-full px-3 py-2 mt-1 rounded-lg text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-colors text-center justify-center"
                                  >
                                    <FiSmile size={14} />
                                    Start Practice
                                  </button>
                                )}
                              </div>
                            )}

                            {/* No content fallback */}
                            {!ch.pdfUrl && ch.videos.length === 0 && (!ch.mcqs || ch.mcqs.length === 0) && (
                              <p className="text-xs text-gray-400 text-center py-3">No content in this chapter</p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* MCQ Practice Modal */}
      <AnimatePresence>
        {mcqPractice && (
          <MCQPractice
            mcqs={mcqPractice.mcqs}
            initialIndex={mcqPractice.initialIndex}
            onClose={() => setMcqPractice(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default WatchVideo;
