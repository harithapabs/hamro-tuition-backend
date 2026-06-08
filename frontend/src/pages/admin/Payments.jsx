import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiDollarSign, FiCheckCircle, FiClock, FiRefreshCw, FiDownload, FiSearch,
  FiCheck, FiX, FiEye, FiUser, FiBook, FiCalendar, FiImage, FiXCircle,
  FiSave, FiUpload, FiSmartphone, FiCreditCard, FiSettings, FiTrash2,
  FiFileText, FiBarChart2, FiClipboard, FiShield,
} from 'react-icons/fi';
import { adminAPI, liveSessionAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const BarChart = ({ labels, values }) => {
  const canvasRef = useRef(null);
  useEffect(() => {
    let chartInstance = null;
    const initChart = async () => {
      try {
        const { Chart, registerables } = await import('chart.js');
        Chart.register(...registerables);
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        chartInstance = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels.length ? labels : ['No Data'],
            datasets: [{
              label: 'Revenue',
              data: values.length ? values : [0],
              backgroundColor: 'rgba(26,86,219,0.7)',
              borderColor: '#1a56db',
              borderWidth: 1,
              borderRadius: 6,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { callback: (v) => 'Rs.' + v } },
              x: { grid: { display: false } },
            },
          },
        });
      } catch {}
    };
    initChart();
    return () => { chartInstance?.destroy(); };
  }, [labels, values]);
  return <canvas ref={canvasRef} />;
};

const tabs = [
  { id: 'overview', label: 'Overview', icon: FiBarChart2 },
  { id: 'requests', label: 'Payment Requests', icon: FiClipboard },
  { id: 'settings', label: 'Payment Settings', icon: FiSettings },
];

const Payments = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const { data: res } = await adminAPI.getPayments();
      setPayments(Array.isArray(res) ? res : res?.payments || []);
    } catch (err) {
      console.error('Failed to fetch payments:', err);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayments(); }, []);

  const handleFilter = () => { setLoading(true); fetchPayments(); };

  const filtered = payments.filter((p) => {
    const matchesSearch =
      (p.user?.name || p.studentName || '')?.toLowerCase().includes(search.toLowerCase()) ||
      (p.transactionId || '')?.toLowerCase().includes(search.toLowerCase()) ||
      (p.course?.title || p.courseTitle || '')?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = payments.reduce((s, p) => p.status === 'completed' || p.status === 'approved' ? s + (p.amount || 0) : s, 0);
  const completedCount = payments.filter((p) => p.status === 'completed' || p.status === 'approved').length;
  const pendingCount = payments.filter((p) => p.status === 'pending').length;
  const rejectedCount = payments.filter((p) => p.status === 'rejected').length;

  const monthlyRevenue = (() => {
    const months = {};
    payments.filter((p) => p.status === 'completed' || p.status === 'approved').forEach((p) => {
      const d = new Date(p.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months[key] = (months[key] || 0) + (p.amount || 0);
    });
    return Object.entries(months).sort().slice(-6);
  })();

  const barLabels = monthlyRevenue.map(([m]) => {
    const [y, mo] = m.split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[parseInt(mo)-1]} ${y}`;
  });
  const barValues = monthlyRevenue.map(([, v]) => v);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payments</h2>
          <p className="text-gray-500 text-sm mt-1">Manage all payment activities</p>
        </div>
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <tab.icon className="text-sm" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (
        <OverviewTab
          payments={payments} loading={loading} filtered={filtered} search={search}
          setSearch={setSearch} dateFrom={dateFrom} setDateFrom={setDateFrom}
          dateTo={dateTo} setDateTo={setDateTo} statusFilter={statusFilter}
          setStatusFilter={setStatusFilter} handleFilter={handleFilter}
          totalRevenue={totalRevenue} completedCount={completedCount}
          pendingCount={pendingCount} rejectedCount={rejectedCount}
          barLabels={barLabels} barValues={barValues}
          setPayments={setPayments}
        />
      )}

      {activeTab === 'requests' && (
        <RequestsTab payments={payments} loading={loading} setPayments={setPayments} />
      )}

      {activeTab === 'settings' && <SettingsTab />}
    </div>
  );
};

const OverviewTab = ({
  payments, loading, filtered, search, setSearch, dateFrom, setDateFrom,
  dateTo, setDateTo, statusFilter, setStatusFilter, handleFilter,
  totalRevenue, completedCount, pendingCount, rejectedCount, barLabels, barValues,
  setPayments,
}) => {
  const [showDelete, setShowDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const handleDelete = async () => {
    if (!showDelete) return;
    setActionLoading(showDelete);
    try {
      await adminAPI.deletePayment(showDelete);
      toast.success('Payment deleted');
      setPayments(prev => prev.filter(p => p._id !== showDelete));
      setShowDelete(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete payment');
    } finally {
      setActionLoading(null);
    }
  };

  const statusCounts = {
    all: payments.length,
    pending: payments.filter(p => p.status === 'pending').length,
    approved: payments.filter(p => p.status === 'approved' || p.status === 'completed').length,
    rejected: payments.filter(p => p.status === 'rejected').length,
  };

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: `Rs. ${totalRevenue.toLocaleString()}`, icon: FiDollarSign, gradient: 'from-blue-600 to-blue-800' },
          { label: 'Completed', value: completedCount, icon: FiCheckCircle, gradient: 'from-emerald-500 to-emerald-700' },
          { label: 'Pending', value: pendingCount, icon: FiClock, gradient: 'from-amber-500 to-amber-700' },
          { label: 'Rejected', value: rejectedCount, icon: FiXCircle, gradient: 'from-red-500 to-red-700' },
        ].map((card, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center`}>
                <card.icon className="text-white text-lg" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{card.label}</p>
                <p className="text-lg font-bold text-gray-900">{card.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <h3 className="text-base font-semibold text-gray-900 mb-4">Monthly Revenue</h3>
          <div className="h-64">
            <BarChart labels={barLabels} values={barValues} />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900">Filters</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">From</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">To</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
          </div>
          <button onClick={handleFilter}
            className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all">
            Apply Filters
          </button>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex gap-2 flex-wrap">
            {['all', 'pending', 'approved', 'rejected'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                  statusFilter === s ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s} ({statusCounts[s] || 0})
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search payments..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
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
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Status</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Date</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12"><div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No payments found</td></tr>
              ) : filtered.map((p, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 px-4 text-gray-900 font-medium">{p.user?.name || p.studentName || '-'}</td>
                  <td className="py-3 px-4 text-gray-600">{p.course?.title || p.courseTitle || '-'}</td>
                  <td className="py-3 px-4 text-gray-900 font-medium">Rs. {p.amount?.toLocaleString() || 0}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      p.paymentMethod === 'khalti' ? 'bg-purple-50 text-purple-700' :
                      p.paymentMethod === 'bank' ? 'bg-blue-50 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>{p.paymentMethod || p.method || 'N/A'}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      p.status === 'completed' || p.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                      p.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                      p.status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-700'
                    }`}>{p.status || 'N/A'}</span>
                  </td>
                  <td className="py-3 px-4 text-gray-500">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-'}</td>
                  <td className="py-3 px-4">
                    <button onClick={() => setShowDelete(p._id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <FiTrash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
      <AnimatePresence>
        {showDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          >
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl text-center"
            >
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <FiTrash2 className="text-red-600 text-xl" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Payment?</h3>
              <p className="text-sm text-gray-500 mt-1">Revenue will update automatically.</p>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowDelete(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
                <button onClick={handleDelete} disabled={actionLoading === showDelete}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const RequestsTab = ({ payments, loading, setPayments }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewScreenshot, setViewScreenshot] = useState(null);
  const [viewRisk, setViewRisk] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [showDelete, setShowDelete] = useState(null);

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      const p = payments.find(p => p._id === id);
      if (p?._type === 'live-session') {
        await liveSessionAPI.approveEnrollment(id);
        toast.success('Enrollment approved! Student can now join.');
      } else {
        await adminAPI.approvePayment(id);
        toast.success('Payment approved! Course unlocked.');
      }
      setPayments(payments.map(p => p._id === id ? { ...p, status: 'approved' } : p));
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
      const p = payments.find(p => p._id === rejectModal);
      if (p?._type === 'live-session') {
        await liveSessionAPI.rejectEnrollment(rejectModal);
        toast.success('Enrollment rejected.');
      } else {
        await adminAPI.rejectPayment(rejectModal, { reason: rejectReason });
        toast.success('Payment rejected.');
      }
      setPayments(payments.map(p => p._id === rejectModal ? { ...p, status: 'rejected', rejectionReason: rejectReason } : p));
      setRejectModal(null);
      setRejectReason('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!showDelete) return;
    setActionLoading(showDelete);
    try {
      await adminAPI.deletePayment(showDelete);
      toast.success('Payment deleted');
      setPayments(payments.filter(p => p._id !== showDelete));
      setShowDelete(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete payment');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = payments.filter((p) => {
    const matchesSearch =
      (p.user?.name || '')?.toLowerCase().includes(search.toLowerCase()) ||
      (p.course?.title || '')?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: payments.length,
    pending: payments.filter(p => p.status === 'pending').length,
    approved: payments.filter(p => p.status === 'approved' || p.status === 'completed').length,
    rejected: payments.filter(p => p.status === 'rejected').length,
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'approved', 'rejected'].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                statusFilter === s ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {s} ({statusCounts[s]})
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Student</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Course</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Amount</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Method</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">TXN ID</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Risk</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Screenshot</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Status</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Date</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12"><div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">No payment requests</td></tr>
              ) : filtered.map((p) => (
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
                  <td className="py-3 px-4 font-medium text-gray-900">Rs. {p.amount?.toLocaleString() || 0}</td>
                  <td className="py-3 px-4">
                    {p._type === 'live-session' ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-700">Live Session</span>
                    ) : (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        p.paymentMethod === 'khalti' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
                      }`}>{p.paymentMethod === 'khalti' ? 'Khalti' : 'Bank'}</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {p.transactionId ? (
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">{p.transactionId}</code>
                    ) : (
                      <span className="text-xs text-red-500 font-medium">⚠ Missing</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {p.risk ? (
                      <button onClick={() => setViewRisk(p)}
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold cursor-pointer hover:opacity-80 ${
                          p.risk.color === 'red' ? 'bg-red-50 text-red-700 border border-red-200' :
                          p.risk.color === 'amber' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                        {p.risk.label} · {p.risk.score}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {p.screenshot ? (
                      <button onClick={() => setViewScreenshot(p.screenshot)}
                        className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-xs font-medium">
                        <FiImage className="text-sm" /> View
                      </button>
                    ) : (
                      <span className="text-gray-400 text-xs">No screenshot</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                      p.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      p.status === 'approved' || p.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      p.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-gray-50 text-gray-700 border-gray-200'
                    }`}>
                      {p.status === 'pending' && <FiClock className="text-amber-500" />}
                      {(p.status === 'approved' || p.status === 'completed') && <FiCheckCircle className="text-emerald-500" />}
                      {p.status === 'rejected' && <FiXCircle className="text-red-500" />}
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-xs">
                    <FiCalendar className="inline mr-1" />
                    {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {p.status === 'pending' ? (
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleApprove(p._id)} disabled={actionLoading === p._id}
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white text-xs font-medium rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50">
                            <FiCheck className="text-sm" /> Approve
                          </button>
                          <button onClick={() => setRejectModal(p._id)} disabled={actionLoading === p._id}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50">
                            <FiX className="text-sm" /> Reject
                          </button>
                        </div>
                      ) : p.status === 'approved' || p.status === 'completed' ? (
                        <span className="text-emerald-600 text-xs font-medium flex items-center gap-1"><FiCheckCircle /> Done</span>
                      ) : (
                        <span className="text-red-600 text-xs font-medium flex items-center gap-1"><FiXCircle /> Rejected</span>
                      )}
                      <button onClick={() => setShowDelete(p._id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-auto">
                        <FiTrash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {viewScreenshot && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setViewScreenshot(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 text-sm">Payment Screenshot</h3>
                <button onClick={() => setViewScreenshot(null)} className="p-1 rounded-lg hover:bg-gray-100">
                  <FiX className="text-gray-500" />
                </button>
              </div>
              <div className="p-4">
                <img src={viewScreenshot} alt="Payment Screenshot" className="w-full rounded-xl" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewRisk && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setViewRisk(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <FiShield className={
                    viewRisk.risk.color === 'red' ? 'text-red-600' :
                    viewRisk.risk.color === 'amber' ? 'text-amber-600' : 'text-emerald-600'
                  } />
                  <h3 className="font-semibold text-gray-900">Fraud Risk Analysis</h3>
                </div>
                <button onClick={() => setViewRisk(null)} className="p-1 rounded-lg hover:bg-gray-100">
                  <FiX className="text-gray-500" />
                </button>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-2xl font-bold ${
                    viewRisk.risk.color === 'red' ? 'text-red-600' :
                    viewRisk.risk.color === 'amber' ? 'text-amber-600' : 'text-emerald-600'
                  }`}>{viewRisk.risk.score}/100</span>
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                    viewRisk.risk.color === 'red' ? 'bg-red-50 text-red-700 border border-red-200' :
                    viewRisk.risk.color === 'amber' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>{viewRisk.risk.label}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                  <div className={`h-2 rounded-full ${
                    viewRisk.risk.color === 'red' ? 'bg-red-500' :
                    viewRisk.risk.color === 'amber' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`} style={{ width: `${viewRisk.risk.score}%` }} />
                </div>
                {viewRisk.risk.reasons.length === 0 ? (
                  <p className="text-sm text-emerald-700 bg-emerald-50 p-3 rounded-lg">
                    ✓ No fraud indicators detected. Screenshot looks authentic.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {viewRisk.risk.reasons.map((r, i) => (
                      <div key={i} className={`text-sm p-2.5 rounded-lg flex items-start gap-2 ${
                        r.level === 'critical' ? 'bg-red-50 text-red-800 border border-red-200' :
                        r.level === 'high' ? 'bg-red-50 text-red-700' :
                        r.level === 'medium' ? 'bg-amber-50 text-amber-700' :
                        'bg-gray-50 text-gray-700'
                      }`}>
                        <span className="flex-shrink-0">
                          {r.level === 'critical' ? '🚨' : r.level === 'high' ? '⚠️' : r.level === 'medium' ? '⚡' : 'ℹ️'}
                        </span>
                        <span>{r.msg}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400 font-mono break-all">
                  Screenshot hash: {viewRisk.risk.screenshotHash?.substring(0, 32)}...
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {rejectModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => { setRejectModal(null); setRejectReason(''); }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Reject Payment</h3>
                <p className="text-sm text-gray-500 mt-1">Provide a reason for rejection</p>
              </div>
              <div className="p-6">
                <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Reason for rejection (optional)..." rows={3}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none resize-none" />
                <div className="flex justify-end gap-3 mt-4">
                  <button onClick={() => { setRejectModal(null); setRejectReason(''); }}
                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                  <button onClick={handleReject} disabled={actionLoading === rejectModal}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50">
                    <FiX /> Reject
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          >
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl text-center"
            >
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <FiTrash2 className="text-red-600 text-xl" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Payment?</h3>
              <p className="text-sm text-gray-500 mt-1">This action cannot be undone.</p>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowDelete(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
                <button onClick={handleDelete} disabled={actionLoading === showDelete}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SettingsTab = () => {
  const [saving, setSaving] = useState(false);
  const [khalti, setKhalti] = useState({ enabled: false, qrImage: '', label: 'Khalti Payment', khaltiNumber: '', khaltiName: '' });
  const [bank, setBank] = useState({ enabled: false, qrImage: '', bankName: '', accountName: '', accountNumber: '' });
  const [settingsLoading, setSettingsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await adminAPI.getPaymentSettings();
        if (data.khalti) setKhalti(data.khalti);
        if (data.bank) setBank(data.bank);
      } catch {
        toast.error('Failed to load settings');
      } finally {
        setSettingsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleImageUpload = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be less than 5MB'); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'khalti') setKhalti({ ...khalti, qrImage: reader.result });
      else setBank({ ...bank, qrImage: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (type) => {
    if (type === 'khalti') setKhalti({ ...khalti, qrImage: '' });
    else setBank({ ...bank, qrImage: '' });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminAPI.savePaymentSettings({ khalti, bank });
      toast.success('Payment settings saved!');
    } catch (err) {
      console.error('Save settings error:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to save';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (settingsLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Khalti */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <FiSmartphone className="text-purple-600 text-lg" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Khalti QR</h3>
                <p className="text-xs text-gray-500">Mobile wallet payment</p>
              </div>
            </div>
            <button onClick={() => setKhalti({ ...khalti, enabled: !khalti.enabled })}
              className={`relative w-12 h-6 rounded-full transition-colors ${khalti.enabled ? 'bg-green-500' : 'bg-gray-300'}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${khalti.enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">QR Code Image</label>
              {khalti.qrImage ? (
                <div className="relative group inline-block">
                  <img src={khalti.qrImage} alt="Khalti QR" className="w-48 h-48 object-contain rounded-xl border border-gray-200" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-3">
                    <label className="cursor-pointer p-2 bg-white rounded-lg hover:bg-gray-100">
                      <FiEye className="text-gray-600" />
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'khalti')} />
                    </label>
                    <button onClick={() => removeImage('khalti')} className="p-2 bg-white rounded-lg hover:bg-red-50 text-red-500"><FiTrash2 /></button>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-48 h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-purple-400 hover:bg-purple-50/50 transition-colors">
                  <FiUpload className="text-gray-400 text-3xl mb-2" />
                  <span className="text-sm text-gray-500">Upload QR</span>
                  <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'khalti')} />
                </label>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Label</label>
              <input type="text" value={khalti.label} onChange={(e) => setKhalti({ ...khalti, label: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Khalti Number</label>
                <input type="text" value={khalti.khaltiNumber} onChange={(e) => setKhalti({ ...khalti, khaltiNumber: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" placeholder="98XXXXXXXX" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Khalti Name</label>
                <input type="text" value={khalti.khaltiName} onChange={(e) => setKhalti({ ...khalti, khaltiName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" placeholder="Optional" />
              </div>
            </div>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${khalti.enabled ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {khalti.enabled ? <FiCheckCircle /> : <FiXCircle />}
              {khalti.enabled ? 'Enabled for students' : 'Disabled'}
            </div>
          </div>
        </motion.div>

        {/* Bank */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <FiCreditCard className="text-blue-600 text-lg" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Bank QR</h3>
                <p className="text-xs text-gray-500">Bank transfer payment</p>
              </div>
            </div>
            <button onClick={() => setBank({ ...bank, enabled: !bank.enabled })}
              className={`relative w-12 h-6 rounded-full transition-colors ${bank.enabled ? 'bg-green-500' : 'bg-gray-300'}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${bank.enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">QR Code Image</label>
              {bank.qrImage ? (
                <div className="relative group inline-block">
                  <img src={bank.qrImage} alt="Bank QR" className="w-48 h-48 object-contain rounded-xl border border-gray-200" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-3">
                    <label className="cursor-pointer p-2 bg-white rounded-lg hover:bg-gray-100">
                      <FiEye className="text-gray-600" />
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'bank')} />
                    </label>
                    <button onClick={() => removeImage('bank')} className="p-2 bg-white rounded-lg hover:bg-red-50 text-red-500"><FiTrash2 /></button>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-48 h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors">
                  <FiUpload className="text-gray-400 text-3xl mb-2" />
                  <span className="text-sm text-gray-500">Upload QR</span>
                  <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'bank')} />
                </label>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Bank Name</label>
              <input type="text" value={bank.bankName} onChange={(e) => setBank({ ...bank, bankName: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" placeholder="e.g. Nabil Bank" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Account Name</label>
              <input type="text" value={bank.accountName} onChange={(e) => setBank({ ...bank, accountName: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" placeholder="Account holder name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Account Number (Optional)</label>
              <input type="text" value={bank.accountNumber} onChange={(e) => setBank({ ...bank, accountNumber: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" placeholder="XXXX-XXXX-XXXX" />
            </div>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${bank.enabled ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {bank.enabled ? <FiCheckCircle /> : <FiXCircle />}
              {bank.enabled ? 'Enabled for students' : 'Disabled'}
            </div>
          </div>
        </motion.div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50">
          <FiSave className={saving ? 'animate-spin' : ''} />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default Payments;
