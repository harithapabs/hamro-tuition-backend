import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  FiUsers, FiBook, FiDollarSign, FiActivity, FiArrowUp, FiArrowDown,
} from 'react-icons/fi';
import { adminAPI } from '../../utils/api';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const statCards = [
  { key: 'totalStudents', label: 'Total Students', icon: FiUsers, gradient: 'from-blue-600 to-blue-800', light: 'bg-blue-50' },
  { key: 'totalCourses', label: 'Total Courses', icon: FiBook, gradient: 'from-emerald-500 to-emerald-700', light: 'bg-emerald-50' },
  { key: 'totalRevenue', label: 'Total Revenue', icon: FiDollarSign, gradient: 'from-amber-500 to-amber-700', light: 'bg-amber-50' },
  { key: 'activeUsers', label: 'Active Users', icon: FiActivity, gradient: 'from-purple-500 to-purple-700', light: 'bg-purple-50' },
];

const AnimatedNumber = ({ value, prefix = '' }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!value) return;
    let start = 0;
    const duration = 1000;
    const step = Math.ceil(value / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(start);
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{prefix}{display.toLocaleString()}</span>;
};

const SimpleChart = ({ labels, values, type, colors }) => {
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
          type: type === 'doughnut' ? 'doughnut' : 'line',
          data: {
            labels,
            datasets: type === 'doughnut' ? [{
              data: values,
              backgroundColor: colors,
              borderWidth: 3,
              borderColor: '#fff',
            }] : [{
              label: 'Revenue',
              data: values,
              borderColor: '#1a56db',
              backgroundColor: 'rgba(26,86,219,0.1)',
              fill: true,
              tension: 0.4,
              pointBackgroundColor: '#1a56db',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              pointRadius: 4,
            }],
          },
          options: type === 'doughnut' ? {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
              legend: { position: 'bottom', labels: { usePointStyle: true, padding: 16, font: { size: 12 } } },
            },
          } : {
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
  }, [labels, values, type, colors]);

  return <canvas ref={canvasRef} />;
};

const Overview = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data: res } = await adminAPI.getDashboard();
        setData(res);
      } catch { setData(null); }
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-20" />
                <div className="h-6 bg-gray-200 rounded w-16" />
              </div>
            </div>
          </div>
        ))}
        <div className="lg:col-span-4 grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse h-72" />
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse h-72" />
        </div>
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse h-64" />
      </div>
    );
  }

  const stats = {
    totalStudents: data?.totalStudents || 0,
    totalCourses: data?.totalCourses || 0,
    totalRevenue: data?.totalRevenue || 0,
    activeUsers: data?.totalStudents || 0,
  };
  const revenueData = data?.revenueData || [];
  const categoryData = data?.categoryData || [];
  const recentPayments = data?.recentPayments || [];

  const revenueLabels = revenueData.map((r) => r.month) || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const revenueValues = revenueData.map((r) => r.revenue) || [0, 0, 0, 0, 0, 0];
  const catLabels = categoryData.map((c) => c.name) || ['Class 8', 'Class 9', 'Class 10', 'Plus 2'];
  const catValues = categoryData.map((c) => c.count) || [10, 15, 20, 12];
  const douColors = ['#1a56db', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const val = stats[card.key];
          const change = stats[`${card.key}Change`];
          const isUp = change >= 0;
          const Icon = card.icon;
          return (
            <motion.div key={card.key} variants={item} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className={`w-14 h-14 rounded-2xl ${card.light} flex items-center justify-center`}>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center`}>
                    <Icon className="text-white text-lg" />
                  </div>
                </div>
                {change !== undefined && (
                  <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {isUp ? <FiArrowUp /> : <FiArrowDown />}
                    {Math.abs(change)}%
                  </span>
                )}
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500">{card.label}</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">
                  {card.key === 'totalRevenue' ? 'Rs. ' : ''}
                  <AnimatedNumber value={val} />
                </h3>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={item} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Monthly Revenue</h3>
          <div className="h-72">
            <SimpleChart labels={revenueLabels} values={revenueValues} type="line" />
          </div>
        </motion.div>

        <motion.div variants={item} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Course Enrollment</h3>
          <div className="h-72">
            <SimpleChart labels={catLabels} values={catValues} type="doughnut" colors={douColors} />
          </div>
        </motion.div>
      </div>

      <motion.div variants={item} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Recent Payments</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Student</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Course</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Amount</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Status</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentPayments.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">No recent payments</td></tr>
              ) : recentPayments.slice(0, 5).map((p, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 px-4 text-gray-900">{p.studentName || p.student?.name || '-'}</td>
                  <td className="py-3 px-4 text-gray-600">{p.courseTitle || p.course?.title || '-'}</td>
                  <td className="py-3 px-4 text-gray-900 font-medium">Rs. {p.amount?.toLocaleString() || 0}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      p.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {p.status || 'pending'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-500">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Overview;
