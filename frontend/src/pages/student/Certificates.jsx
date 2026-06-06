import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiAward, FiDownload, FiExternalLink, FiBookOpen } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { certificateAPI, studentAPI } from '../../utils/api';

const Certificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [completedCourses, setCompletedCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [certRes, courseRes] = await Promise.all([
          certificateAPI.getAll(),
          studentAPI.getMyCourses(),
        ]);
        const certs = Array.isArray(certRes.data) ? certRes.data : [];
        setCertificates(certs);

        const courses = Array.isArray(courseRes.data) ? courseRes.data : [];
        const certCourseIds = new Set(certs.map((c) => c.courseId));
        const completed = courses.filter(
          (c) => (c.progress || c.completion || 0) >= 80 && !certCourseIds.has(c._id)
        );
        setCompletedCourses(completed);
      } catch {}
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleGenerate = async (courseId) => {
    try {
      await certificateAPI.generate(courseId);
      toast.success('Certificate generated!');
      const { data } = await certificateAPI.getAll();
      setCertificates(Array.isArray(data) ? data : []);
      setCompletedCourses((prev) => prev.filter((c) => c._id !== courseId));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Certificates</h1>
        <p className="text-gray-500 text-sm mt-1">View and download your course completion certificates</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-2/3 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
              <div className="h-10 bg-gray-200 rounded-xl w-40" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {completedCourses.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Available to Claim</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completedCourses.map((course) => (
                  <motion.div
                    key={course._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-5 border border-amber-200/50"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <FiAward className="text-amber-600 text-xl" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm">{course.title}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{course.instructor || 'Hamro Tuition'}</p>
                        <button
                          onClick={() => handleGenerate(course._id)}
                          className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-medium rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/20"
                        >
                          <FiDownload size={13} /> Get Certificate
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              {certificates.length > 0 ? 'Your Certificates' : ''}
            </h2>
            {certificates.length === 0 && completedCourses.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[40vh]">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center mb-4">
                  <FiAward className="text-amber-600 text-2xl" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No Certificates Yet</h3>
                <p className="text-sm text-gray-500 text-center max-w-sm">
                  Complete at least 80% of a course to claim your certificate.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {certificates.map((cert, i) => (
                  <motion.div
                    key={cert._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                        <FiAward className="text-white text-xl" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm">{cert.course?.title || cert.courseTitle}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Issued: {new Date(cert.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5 font-mono">{cert.certNumber}</p>
                        <Link
                          to={`/dashboard/student/certificate/${cert._id}`}
                          className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-600/20"
                        >
                          <FiExternalLink size={13} /> View Certificate
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Certificates;
