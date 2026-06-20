import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiUpload, FiCheck, FiDollarSign, FiCalendar, FiClock, FiUser, FiVideo, FiFileText } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { liveSessionAPI, paymentAPI } from '../../utils/api';

const LiveSessionEnroll = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [paymentSettings, setPaymentSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState(null);
  const [courseDetail, setCourseDetail] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const [sRes, pRes] = await Promise.all([
          liveSessionAPI.getAll(),
          paymentAPI.getPaymentSettings(),
        ]);
        const sessions = Array.isArray(sRes.data) ? sRes.data : [];
        const found = sessions.find(s => s._id === sessionId);
        setSession(found || null);
        setPaymentSettings(pRes.data || null);
      } catch {} finally { setLoading(false); }
    };
    fetch();
  }, [sessionId]);

  const isFree = !session.price || Number(session.price) === 0;

  const handleSubmit = async () => {
    if (isFree) {
      setSubmitting(true);
      try {
        const formData = new FormData();
        formData.append('liveSessionId', sessionId);
        formData.append('courseDetail', courseDetail);
        await liveSessionAPI.enroll(formData);
        toast.success('Enrolled successfully!');
        navigate('/dashboard/student/assignments');
      } catch {
        toast.error('Failed to enroll');
      } finally { setSubmitting(false); }
      return;
    }
    if (!file) {
      toast.error('Please upload payment screenshot');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('liveSessionId', sessionId);
      formData.append('courseDetail', courseDetail);
      formData.append('screenshot', file);
      await liveSessionAPI.enroll(formData);
      toast.success('Enrollment submitted! Awaiting admin approval.');
      navigate('/dashboard/student/assignments');
    } catch {
      toast.error('Failed to submit enrollment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen pt-24 pb-12">
        <div className="max-w-2xl mx-auto px-4 text-center py-20">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Session Not Found</h2>
          <p className="text-gray-500 mb-4">This live session does not exist.</p>
          <button onClick={() => navigate(-1)} className="text-blue-600 hover:underline">Go back</button>
        </div>
      </div>
    );
  }

  const qrImage = paymentSettings?.khalti?.qrImage || paymentSettings?.bank?.qrImage || '';

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-2xl mx-auto px-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <FiArrowLeft /> Back
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
              <div className="flex items-center gap-2 text-blue-200 text-xs font-medium uppercase tracking-wider mb-1">
                <FiVideo /> Live Session Enrollment
              </div>
              <h1 className="text-2xl font-bold">{session.courseName}</h1>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
                <span className="flex items-center gap-1.5"><FiCalendar /> {session.startDate}</span>
                <span className="flex items-center gap-1.5"><FiClock /> {session.startTime}</span>
                {session.nepaliDate && <span className="text-orange-500 font-medium text-xs bg-orange-50 px-2 py-0.5 rounded-full">{session.nepaliDate}</span>}
                {session.instructorName && <span className="flex items-center gap-1.5"><FiUser /> {session.instructorName}</span>}
              </div>

              {session.description && (
                <p className="text-sm text-gray-500">{session.description}</p>
              )}

              {session.price > 0 && Number(session.price) > 0 && (
                <div className="flex items-center gap-2 text-xl font-bold text-gray-900">
                  <FiDollarSign className="text-green-500" /> Rs {session.price}
                </div>
              )}
              {isFree && (
                <div className="flex items-center gap-2 text-xl font-bold text-green-600">
                  <FiDollarSign /> FREE
                </div>
              )}

              <div className="border-t border-gray-100 pt-6">
                {isFree ? (
                  <div className="space-y-4">
                    <div className="text-center py-6 bg-green-50 rounded-xl mb-6">
                      <p className="text-lg font-bold text-green-600 mb-2">FREE Live Session!</p>
                      <p className="text-sm text-gray-500">Click the button below to enroll instantly. No payment required.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Course Details / Notes</label>
                      <textarea rows="3" placeholder="Any details about the course you'd like to share..."
                        value={courseDetail}
                        onChange={(e) => setCourseDetail(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                    </div>
                    <button onClick={handleSubmit} disabled={submitting}
                      className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-medium rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-lg shadow-green-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                      {submitting ? 'Enrolling...' : 'Enroll Now (FREE)'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment</h2>
                    {qrImage ? (
                      <div className="flex flex-col items-center mb-6">
                        <img src={qrImage} alt="Payment QR" className="w-48 h-48 object-contain border border-gray-200 rounded-xl p-2" />
                        <p className="text-xs text-gray-400 mt-2">Scan to pay via Khalti / Bank</p>
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-gray-50 rounded-xl mb-6">
                        <p className="text-sm text-gray-500">No QR code configured. Contact admin for payment details.</p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Upload Payment Screenshot *</label>
                      <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-blue-300 transition-colors">
                        {file ? (
                          <div className="flex items-center justify-center gap-3">
                            <FiCheck className="text-green-500 text-xl" />
                            <span className="text-sm text-gray-700">{file.name}</span>
                            <button onClick={() => setFile(null)} className="text-red-500 hover:text-red-600 text-sm">Remove</button>
                          </div>
                        ) : (
                          <label className="cursor-pointer">
                            <FiUpload className="text-gray-400 text-2xl mx-auto mb-2" />
                            <p className="text-sm text-gray-500">Click to upload screenshot</p>
                            <p className="text-xs text-gray-400 mt-1">JPG, PNG accepted</p>
                            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" />
                          </label>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Course Details / Notes</label>
                      <textarea rows="3" placeholder="Any details about the course you'd like to share..."
                        value={courseDetail}
                        onChange={(e) => setCourseDetail(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                    </div>
                    <button onClick={handleSubmit} disabled={submitting}
                      className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                      {submitting ? 'Submitting...' : <><FiUpload /> Submit Enrollment</>}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LiveSessionEnroll;
