import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiCheck, FiX, FiEye, FiSearch, FiFilter, FiClock,
  FiCheckCircle, FiXCircle, FiUser, FiBook, FiCalendar,
  FiImage, FiMessageSquare, FiX,
} from 'react-icons/fi';
import { adminAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const PaymentRequests = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewScreenshot, setViewScreenshot] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchPayments = async () => {
    try {
      const { data } = await adminAPI.getPaymentRequests();
      setPayments(Array.isArray(data) ? data : []);
    } catch {
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayments(); }, []);

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      await adminAPI.approvePayment(id);
      toast.success('Payment approved! Course unlocked for student.');
      setPayments(payments.map(p =>
        p._id === id ? { ...p, status: 'approved' } : p
      ));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setActionLoading(rejectModal);
    try {
      await adminAPI.rejectPayment(rejectModal, { reason: rejectReason });
      toast.success('Payment rejected.');
      setPayments(payments.map(p =>
        p._id === rejectModal ? { ...p, status: 'rejected', rejectionReason: rejectReason } : p
      ));
      setRejectModal(null);
      setRejectReason('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = payments.filter((p) => {
    const matchesSearch =
      (p.user?.name || '')?.toLowerCase().includes(search.toLowerCase()) ||
      (p.course?.title || '')?.toLowerCase().includes(search.toLowerCase()) ||
      (p.transactionId || '')?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: payments.length,
    pending: payments.filter(p => p.status === 'pending').length,
    approved: payments.filter(p => p.status === 'approved').length,
    rejected: payments.filter(p => p.status === 'rejected').length,
  };

  const statusStyle = (status) => {
    switch (status) {
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'approved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'rejected': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const statusIcon = (status) => {
    switch (status) {
      case 'pending': return <FiClock className="text-amber-500" />;
      case 'approved': return <FiCheckCircle className="text-emerald-500" />;
      case 'rejected': return <FiXCircle className="text-red-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Payment Requests</h2>
        <p className="text-gray-500 text-sm mt-1">Review and verify student payment submissions</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total', count: statusCounts.all, color: 'from-gray-500 to-gray-700' },
          { label: 'Pending', count: statusCounts.pending, color: 'from-amber-500 to-amber-700' },
          { label: 'Approved', count: statusCounts.approved, color: 'from-emerald-500 to-emerald-700' },
          { label: 'Rejected', count: statusCounts.rejected, color: 'from-red-500 to-red-700' },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                <span className="text-white font-bold text-sm">{card.count}</span>
              </div>
              <div>
                <p className="text-xs text-gray-500">{card.label}</p>
                <p className="text-lg font-bold text-gray-900">{card.count}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex gap-2 flex-wrap">
            {['all', 'pending', 'approved', 'rejected'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                  statusFilter === s
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s} ({statusCounts[s]})
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, course..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Student</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Course</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Amount</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Method</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Screenshot</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Status</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Date</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    No payment requests found
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <FiUser className="text-blue-600 text-xs" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{p.user?.name || 'Unknown'}</p>
                          <p className="text-xs text-gray-400">{p.user?.email || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <FiBook className="text-gray-400 text-xs" />
                        <span className="text-gray-700">{p.course?.title || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">
                      Rs. {p.amount?.toLocaleString() || 0}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        p.paymentMethod === 'khalti' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {p.paymentMethod === 'khalti' ? 'Khalti' : 'Bank'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {p.screenshot ? (
                        <button
                          onClick={() => setViewScreenshot(p.screenshot)}
                          className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-xs font-medium"
                        >
                          <FiImage className="text-sm" /> View
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs">No screenshot</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${statusStyle(p.status)}`}>
                        {statusIcon(p.status)}
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs">
                      <div className="flex items-center gap-1">
                        <FiCalendar className="text-xs" />
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-'}
                      </div>
                      {p.transactionId && (
                        <span className="text-gray-400 font-mono">{p.transactionId}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {p.status === 'pending' ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApprove(p._id)}
                            disabled={actionLoading === p._id}
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white text-xs font-medium rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
                          >
                            <FiCheck className="text-sm" /> Approve
                          </button>
                          <button
                            onClick={() => setRejectModal(p._id)}
                            disabled={actionLoading === p._id}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                          >
                            <FiX className="text-sm" /> Reject
                          </button>
                        </div>
                      ) : p.status === 'approved' ? (
                        <span className="text-emerald-600 text-xs font-medium flex items-center gap-1">
                          <FiCheckCircle /> Approved
                        </span>
                      ) : (
                        <div>
                          <span className="text-red-600 text-xs font-medium flex items-center gap-1">
                            <FiXCircle /> Rejected
                          </span>
                          {p.rejectionReason && (
                            <p className="text-xs text-gray-400 mt-1 max-w-[120px] truncate" title={p.rejectionReason}>
                              {p.rejectionReason}
                            </p>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {viewScreenshot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setViewScreenshot(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 text-sm">Payment Screenshot</h3>
                <button
                  onClick={() => setViewScreenshot(null)}
                  className="p-1 rounded-lg hover:bg-gray-100"
                >
                  <FiX className="text-gray-500" />
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
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {rejectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => { setRejectModal(null); setRejectReason(''); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Reject Payment</h3>
                <p className="text-sm text-gray-500 mt-1">Provide a reason for rejection</p>
              </div>
              <div className="p-6">
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Reason for rejection (optional)..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none resize-none"
                />
                <div className="flex justify-end gap-3 mt-4">
                  <button
                    onClick={() => { setRejectModal(null); setRejectReason(''); }}
                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={actionLoading === rejectModal}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    <FiX /> Reject Payment
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PaymentRequests;
