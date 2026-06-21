import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiFileText, FiMaximize2, FiMinimize2, FiChevronDown } from 'react-icons/fi';
import { courseAPI } from '../../utils/api';

const NoteViewer = () => {
  const { courseId, chapterIndex } = useParams();
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [chapterTitle, setChapterTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const { data } = await courseAPI.getOne(courseId);
        const chIdx = parseInt(chapterIndex);
        const ch = data.chapters?.[chIdx];
        if (ch) {
          setChapterTitle(ch.name || ch.title || `Chapter ${chIdx + 1}`);
          setNotes(ch.notes || []);
          if (ch.notes?.length > 0) setSelectedNote(ch.notes[0]);
        }
      } catch {}
      setLoading(false);
    };
    fetchNotes();
  }, [courseId, chapterIndex]);

  const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white">
        <FiFileText className="text-5xl text-gray-500 mb-4" />
        <p className="text-lg text-gray-400">No notes available for this chapter yet.</p>
        <Link to={`/dashboard/student/course/${courseId}`}
          className="mt-4 px-6 py-2 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 transition-all text-sm">
          Back to Course
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900 overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700 shrink-0">
        <div className="flex items-center gap-3">
          <Link to={`/dashboard/student/course/${courseId}`}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors text-sm">
            <FiArrowLeft size={18} />
            <span className="hidden sm:inline">Back</span>
          </Link>
          <div className="h-5 w-px bg-gray-600" />
          <h1 className="text-white text-sm font-medium truncate max-w-[200px] sm:max-w-[400px]">
            {chapterTitle} — Notes
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Note Selector Dropdown */}
          {notes.length > 1 && (
            <div className="relative group">
              <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 text-gray-200 rounded-lg text-xs hover:bg-gray-600 transition-all">
                <FiChevronDown size={14} />
                <span className="hidden sm:inline">{notes.length} Notes</span>
              </button>
              <div className="absolute right-0 top-full mt-1 bg-gray-700 border border-gray-600 rounded-xl shadow-2xl py-1 z-50 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                {notes.map((note, idx) => (
                  <button key={note._id || idx}
                    onClick={() => setSelectedNote(note)}
                    className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors ${
                      selectedNote?._id === note._id ? 'bg-cyan-600/20 text-cyan-400' : 'text-gray-300 hover:bg-gray-600'
                    }`}>
                    <FiFileText size={14} />
                    <span className="truncate">{note.title || `Note ${idx + 1}`}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <button onClick={toggleFullscreen}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-all"
            title="Toggle Fullscreen">
            {isFullscreen ? <FiMinimize2 size={16} /> : <FiMaximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Full-screen iframe */}
      {selectedNote && (
        <iframe
          src={`${BASE_URL}${selectedNote.url}`}
          className="flex-1 w-full border-0"
          title={selectedNote.title}
          sandbox="allow-scripts allow-same-origin"
        />
      )}
    </div>
  );
};

export default NoteViewer;
