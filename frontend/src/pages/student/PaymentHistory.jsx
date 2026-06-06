import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiClock, FiCheckCircle, FiXCircle, FiCalendar, FiBook,
  FiArrowRight, FiImage, FiMessageSquare,
} from 'react-icons/fi';
import { paymentAPI } from '../../utils/api';

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewScreenshot, setViewScreenshot] = useState(null);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const { data } = await paymentAPI.getMyPayments();
        setPayments(Array.isArray(data) ? data : []);
      } catch {
        setPayments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  const statusConfig = (status) => {
    switch (status) {
      case 'pending':
        return {
          bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200',
          icon: FiClock, label: 'Pending Verification',
        };
      case 'approved':
        return {
          bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200',
          icon: FiCheckCircle, label: 'Approved',
        };
      case 'rejected':
        return {
          bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200',
          icon: FiXCircle, label: 'Rejected',
        };
      default:
        return {
          bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200',
          icon: FiClock, label: status || 'Unknown',
        };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payment History</h1>
        <p className="text-gray-500 text-sm mt-1">Track your payment status and history</p>
      </div>

      {payments.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <FiCalendar className="text-gray-400 text-2xl" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">No Payments Yet</h2>
          <p className="text-gray-500 text-sm mb-6">You haven't made any payment submissions yet.</p>
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all"
          >
            Browse Courses <FiArrowRight />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((payment, i) => {
            const status = statusConfig(payment.status);
            const StatusIcon = status.icon;

            return (
              <motion.div
                key={payment._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {payment.course?.thumbnail ? (
                        <img src={payment.course.thumbnail} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <FiBook className="text-white/50" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {payment.course?.title || 'Unknown Course'}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                        <FiCalendar className="text-xs" />
                        <span>{new Date(payment.createdAt).toLocaleDateString()}</span>
                        <span className="text-gray-300">|</span>
                        <span className="capitalize">{payment.paymentMethod || 'N/A'}</span>
                        {payment.transactionId && (
                          <>
                            <span className="text-gray-300">|</span>
                            <span className="font-mono">{payment.transactionId}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {payment.screenshot && (
                      <button
                        onClick={() => setViewScreenshot(payment.screenshot)}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        <FiImage className="text-sm" /> Screenshot
                      </button>
                    )}

                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        Rs. {payment.amount?.toLocaleString() || 0}
                      </p>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${status.bg} ${status.text} ${status.border}`}>
                        <StatusIcon className="text-xs" />
                        {status.label}
                      </span>
                    </div>
                  </div>
                </div>

                {payment.status === 'rejected' && payment.rejectionReason && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-start gap-2">
                      <FiMessageSquare className="text-red-400 text-xs mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-red-600">
                        <span className="font-medium">Rejection reason:</span> {payment.rejectionReason}
                      </p>
                    </div>
                  </div>
                )}

                {payment.status === 'approved' && payment._type === 'course' && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <Link
                      to={`/dashboard/student/course/${payment.courseId}/lesson/`}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700"
                    >
                      Go to Course <FiArrowRight className="text-xs" />
                    </Link>
                  </div>
                )}
                {payment.status === 'approved' && payment._type === 'live-session' && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <Link
                      to="/dashboard/student/assignments"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700"
                    >
                      View Live Session <FiArrowRight className="text-xs" />
                    </Link>
                  </div>
                )}

                {payment.status === 'pending' && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <FiClock className="text-xs" />
                      Your payment is being reviewed. You will be notified once verified.
                    </p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {viewScreenshot && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setViewScreenshot(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-sm">Payment Screenshot</h3>
              <button
                onClick={() => setViewScreenshot(null)}
                className="p-1 rounded-lg hover:bg-gray-100"
              >
                <FiXCircle className="text-gray-500" />
              </button>
            </div>
            <div className="p-4">
              <img
                src={viewScreenshot}
                alt="Payment Screenshot"
                className="w-full rounded-xl"
              />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;
