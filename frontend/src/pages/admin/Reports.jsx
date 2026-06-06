import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  FiBarChart2, FiPieChart, FiLayers, FiCalendar, FiBook,
  FiUsers, FiDollarSign, FiTrendingUp, FiGrid,
} from 'react-icons/fi';
import { adminAPI } from '../../utils/api';

const doughnutColors = ['#1a56db', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#14b8a6'];

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
          type: type === 'doughnut' ? 'doughnut' : 'bar',
          data: type === 'doughnut' ? {
            labels,
            datasets: [{ data: values, backgroundColor: colors, borderWidth: 3, borderColor: '#fff' }],
          } : {
            labels,
            datasets: [{
              label: 'Revenue',
              data: values,
              backgroundColor: colors || 'rgba(26,86,219,0.7)',
              borderColor: colors || '#1a56db',
              borderWidth: 1,
              borderRadius: 6,
            }],
          },
          options: type === 'doughnut' ? {
            responsive: true, maintainAspectRatio: false, cutout: '65%',
            plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 16, font: { size: 12 } } } },
          } : {
            responsive: true, maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: { callbacks: { label: (ctx) => 'Rs. ' + ctx.parsed.y?.toLocaleString() } },
            },
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

const tabs = [
  { id: 'monthly', label: 'Monthly Report', icon: FiCalendar },
  { id: 'subject', label: 'Subject-wise', icon: FiBook },
  { id: 'level', label: 'Level-wise', icon: FiLayers },
];

const Reports = () => {
  const [activeTab, setActiveTab] = useState('monthly');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data: res } = await adminAPI.getReports();
        setData(res);
      } catch {} finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const monthly = data?.monthlyReport || [];
  const subject = data?.subjectReport || [];
  const level = data?.levelReport || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500 text-sm mt-1">Detailed insights across monthly, subject, and level dimensions</p>
      </div>

      <div className="flex gap-2">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}>
            <tab.icon className="text-sm" /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'monthly' && <MonthlyReport data={monthly} />}
      {activeTab === 'subject' && <CategoryReport data={subject} type="Subject" icon={FiBook} />}
      {activeTab === 'level' && <CategoryReport data={level} type="Level" icon={FiLayers} />}
    </div>
  );
};

const MonthlyReport = ({ data }) => {
  const labels = data.map(d => d.month);
  const revenueValues = data.map(d => d.revenue);
  const studentValues = data.map(d => d.students);
  const courseValues = data.map(d => d.courses);
  const enrollValues = data.map(d => d.enrollments);

  const totals = data.reduce((acc, d) => ({
    revenue: acc.revenue + d.revenue,
    students: acc.students + d.students,
    courses: acc.courses + d.courses,
    enrollments: acc.enrollments + d.enrollments,
  }), { revenue: 0, students: 0, courses: 0, enrollments: 0 });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue (12mo)', value: `Rs. ${totals.revenue.toLocaleString()}`, icon: FiDollarSign, color: 'from-amber-500 to-amber-700' },
          { label: 'New Students', value: totals.students, icon: FiUsers, color: 'from-blue-600 to-blue-800' },
          { label: 'New Courses', value: totals.courses, icon: FiBook, color: 'from-emerald-500 to-emerald-700' },
          { label: 'Live Enrollments', value: totals.enrollments, icon: FiTrendingUp, color: 'from-purple-500 to-purple-700' },
        ].map((c, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center`}>
                <c.icon className="text-white text-lg" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{c.label}</p>
                <p className="text-lg font-bold text-gray-900">{c.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Monthly Revenue</h3>
          <div className="h-64"><SimpleChart labels={labels} values={revenueValues} type="bar" colors={doughnutColors.slice(0, labels.length)} /></div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold text-gray-900 mb-4">New Students & Courses</h3>
          <div className="h-64 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-2 text-gray-500 font-medium">Month</th>
                  <th className="text-right py-2 px-2 text-gray-500 font-medium">Revenue</th>
                  <th className="text-right py-2 px-2 text-gray-500 font-medium">Students</th>
                  <th className="text-right py-2 px-2 text-gray-500 font-medium">Courses</th>
                  <th className="text-right py-2 px-2 text-gray-500 font-medium">Enrollments</th>
                </tr>
              </thead>
              <tbody>
                {data.map((d, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-2 px-2 text-gray-900 font-medium">{d.month} {d.year}</td>
                    <td className="py-2 px-2 text-right text-gray-900">Rs. {d.revenue.toLocaleString()}</td>
                    <td className="py-2 px-2 text-right text-gray-600">{d.students}</td>
                    <td className="py-2 px-2 text-right text-gray-600">{d.courses}</td>
                    <td className="py-2 px-2 text-right text-gray-600">{d.enrollments}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const CategoryReport = ({ data, type, icon: Icon }) => {
  const labels = data.map(d => d.name);
  const revenueValues = data.map(d => d.revenue);
  const studentValues = data.map(d => d.students);
  const courseValues = data.map(d => d.courses);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold text-gray-900 mb-4">{type} Distribution</h3>
          <div className="h-72"><SimpleChart labels={labels} values={courseValues} type="doughnut" colors={doughnutColors.slice(0, labels.length)} /></div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold text-gray-900 mb-4">{type} Revenue</h3>
          <div className="h-72"><SimpleChart labels={labels} values={revenueValues} type="bar" colors={doughnutColors.slice(0, labels.length)} /></div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left py-3 px-4 text-gray-500 font-medium">{type}</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Courses</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Students</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-12 text-gray-400">No data available</td></tr>
              ) : data.map((d, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 px-4 text-gray-900 font-medium">{d.name}</td>
                  <td className="py-3 px-4 text-gray-600">{d.courses}</td>
                  <td className="py-3 px-4 text-gray-600">{d.students}</td>
                  <td className="py-3 px-4 text-gray-900 font-medium">Rs. {d.revenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default Reports;
