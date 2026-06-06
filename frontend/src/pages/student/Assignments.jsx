import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiFileText, FiUpload, FiClock,
  FiVideo,
  FiCalendar, FiLink, FiDollarSign, FiExternalLink, FiCheck, FiUser,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { liveSessionAPI } from '../../utils/api';

const enrollmentStyles = {
  pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Pending Approval' },
  approved: { bg: 'bg-green-50', text: 'text-green-700', label: 'Approved' },
  rejected: { bg: 'bg-red-50', text: 'text-red-700', label: 'Rejected' },
};

const Assignments = () => {
  const [liveSessions, setLiveSessions] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [sessionAssigns, setSessionAssigns] = useState({});
  const [loadingAssigns, setLoadingAssigns] = useState({});
  const [uploading, setUploading] = useState(null);
  const [selected, setSelected] = useState(null);
  const [solFiles, setSolFiles] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sRes, eRes] = await Promise.all([
          liveSessionAPI.getAll().catch(() => ({ data: [] })),
          liveSessionAPI.myEnrollments().catch(() => ({ data: [] })),
        ]);
        setLiveSessions(Array.isArray(sRes.data) ? sRes.data : []);
        setEnrollments(Array.isArray(eRes.data) ? eRes.data : []);
      } catch {}
    };
    fetchData();
  }, []);

  const loadAssignments = async (sessionId) => {
    if (sessionAssigns[sessionId]) return;
    setLoadingAssigns(prev => ({ ...prev, [sessionId]: true }));
    try {
      const { data } = await liveSessionAPI.getAssignments(sessionId);
      setSessionAssigns(prev => ({ ...prev, [sessionId]: Array.isArray(data) ? data : [] }));
    } catch {} finally {
      setLoadingAssigns(prev => ({ ...prev, [sessionId]: false }));
    }
  };

  const getEnrollment = (sessionId) => enrollments.find(e => e.liveSessionId === sessionId);

  const handleSolFile = (assignId, file) => {
    if (file && file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed');
      return;
    }
    if (file && file.size > 10 * 1024 * 1024) {
      toast.error('File must be less than 10MB');
      return;
    }
    setSolFiles(prev => ({ ...prev, [assignId]: file }));
  };

  const handleSubmitSolution = async (assignId) => {
    const file = solFiles[assignId];
    if (!file) {
      toast.error('Please select a file');
      return;
    }
    setUploading(assignId);
    try {
      const fd = new FormData();
      fd.append('file', file);
      await liveSessionAPI.submitSolution(assignId, fd);
      toast.success('Solution submitted!');
      setSolFiles(prev => { const n = { ...prev }; delete n[assignId]; return n; });
      for (const sid of Object.keys(sessionAssigns)) {
        const { data } = await liveSessionAPI.getAssignments(sid);
        setSessionAssigns(prev => ({ ...prev, [sid]: Array.isArray(data) ? data : [] }));
      }
    } catch {
      toast.error('Failed to submit');
    } finally {
      setUploading(null);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Live Session & Assignment</h1>
        <p className="text-gray-500 text-sm mt-1">Join live sessions, view assignments, and submit solutions</p>
      </div>

      {liveSessions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FiVideo className="text-blue-600" /> Live Sessions
          </h2>
          {liveSessions.map((s, i) => {
            const enrollment = getEnrollment(s._id);
            const isApproved = enrollment?.status === 'approved';
            return (
              <motion.div key={s._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 shadow-sm flex items-center justify-center shrink-0">
                    <FiVideo className="text-blue-600 text-xl" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900">{s.courseName || 'Live Session'}</h3>
                    {s.description && <p className="text-sm text-gray-500 mt-0.5">{s.description}</p>}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><FiCalendar /> {s.startDate || 'N/A'}</span>
                      <span className="flex items-center gap-1"><FiClock /> {s.startTime || 'N/A'}</span>
                      {s.nepaliDate && <span className="text-orange-500 font-medium">{s.nepaliDate}</span>}
                      {s.instructorName && <span className="flex items-center gap-1"><FiUser /> {s.instructorName}</span>}
                      {s.price && <span className="flex items-center gap-1"><FiDollarSign /> Rs {s.price}</span>}
                    </div>
                    {enrollment && (
                      <span className={`inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-medium ${enrollmentStyles[enrollment.status]?.bg || ''} ${enrollmentStyles[enrollment.status]?.text || ''}`}>
                        {enrollmentStyles[enrollment.status]?.label || enrollment.status}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isApproved ? (
                      <a href={s.meetLink} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white text-xs font-medium rounded-xl hover:from-green-700 hover:to-green-800 transition-all shadow-lg shadow-green-600/20">
                        <FiLink /> Join Now
                      </a>
                    ) : (
                      <>
                        {!enrollment && (
                          <Link to={`/live-class/enroll/${s._id}`}
                            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-600/20">
                            Enroll Now
                          </Link>
                        )}
                        {s.instructorPhone && (
                          <a href={`tel:${s.instructorPhone}`}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 text-gray-700 text-xs font-medium rounded-xl hover:bg-gray-50 transition-all">
                            Call Now
                          </a>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {isApproved && (
                  <div className="border-t border-gray-100">
                    <button onClick={() => {
                      if (!sessionAssigns[s._id]) loadAssignments(s._id);
                      setSelected(selected === s._id ? null : s._id);
                    }}
                      className="w-full px-5 py-3 flex items-center justify-between text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors">
                      <span className="flex items-center gap-2 font-medium">
                        <FiFileText className="text-indigo-500" /> Assignments
                      </span>
                      <span className="text-xs text-gray-400">{selected === s._id ? 'Collapse' : 'Expand'}</span>
                    </button>
                    {selected === s._id && (
                      <div className="px-5 pb-4 space-y-2">
                        {loadingAssigns[s._id] ? (
                          <div className="flex justify-center py-4"><div className="w-5 h-5 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
                        ) : !sessionAssigns[s._id]?.length ? (
                          <p className="text-sm text-gray-400 text-center py-4">No assignments yet</p>
                        ) : (
                          sessionAssigns[s._id].map(a => (
                            <div key={a._id} className="p-4 bg-gray-50 rounded-xl">
                              <div className="flex items-center gap-3">
                                <FiFileText className="text-indigo-500 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900">{a.title}</p>
                                  <p className="text-xs text-gray-500">{a.date}</p>
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-200">
                                <a href={a.pdfLink} target="_blank" rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-lg hover:bg-indigo-100 transition-colors">
                                  <FiExternalLink size={13} /> Download Assignment
                                </a>
                                {a.mySubmission ? (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-green-700 text-xs font-medium">
                                    <FiCheck size={14} /> Submitted
                                  </span>
                                ) : (
                                  <>
                                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg hover:bg-blue-100 transition-colors cursor-pointer">
                                      <FiUpload size={13} /> Upload Assignment
                                      <input type="file" accept=".pdf" className="hidden"
                                        onChange={(e) => handleSolFile(a._id, e.target.files?.[0])} />
                                    </label>
                                    {solFiles[a._id] && (
                                      <span className="text-xs text-gray-500 truncate max-w-[120px]">{solFiles[a._id].name}</span>
                                    )}
                                    <button onClick={() => handleSubmitSolution(a._id)} disabled={uploading === a._id || !solFiles[a._id]}
                                      className="px-3 py-1.5 bg-gradient-to-r from-green-600 to-green-700 text-white text-xs font-medium rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg shadow-green-600/20 disabled:opacity-50 disabled:cursor-not-allowed">
                                      {uploading === a._id ? 'Uploading...' : 'Submit'}
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {!liveSessions.length && (
        <div className="flex flex-col items-center justify-center min-h-[40vh]">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mb-4">
            <FiFileText className="text-blue-600 text-2xl" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No Live Sessions Yet</h3>
          <p className="text-sm text-gray-500">Enroll in a live class to see assignments here</p>
        </div>
      )}
    </div>
  );
};

export default Assignments;
