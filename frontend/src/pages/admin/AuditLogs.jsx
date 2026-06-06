import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiActivity, FiUser, FiClock, FiFilter, FiGlobe } from 'react-icons/fi';
import { adminAPI } from '../../utils/api';

const ACTION_LABELS = {
  'user.register': 'User registered',
  'user.login': 'User logged in',
  'password.reset': 'Password reset',
  'payment.approve': 'Payment approved',
  'payment.reject': 'Payment rejected',
  'course.create': 'Course created',
  'course.update': 'Course updated',
  'course.delete': 'Course deleted',
};

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    adminAPI.getAuditLogs(filter ? { action: filter } : {})
      .then((r) => setLogs(r.data))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FiActivity className="text-blue-600" /> Audit Logs
          </h1>
          <p className="text-gray-500 text-sm mt-1">Track admin actions and security events</p>
        </div>
        <div className="flex items-center gap-2">
          <FiFilter className="text-gray-400" />
          <select value={filter} onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none">
            <option value="">All actions</option>
            {Object.keys(ACTION_LABELS).map((a) => (
              <option key={a} value={a}>{ACTION_LABELS[a]}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-400">Loading logs...</div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <FiActivity className="text-5xl text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-700">No audit logs yet</h3>
          <p className="text-sm text-gray-400 mt-1">Logs will appear here as admins and users take actions.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b bg-gray-50">
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">IP</th>
                  <th className="py-3 px-4">User Agent</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <motion.tr key={log._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <FiClock className="text-xs" />
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {ACTION_LABELS[log.action] || log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {log.user ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600">
                            {log.user.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{log.user.name}</p>
                            <p className="text-xs text-gray-400">{log.user.email}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-500 font-mono text-xs">{log.ip || '—'}</td>
                    <td className="py-3 px-4 text-gray-400 text-xs max-w-xs truncate" title={log.userAgent}>
                      {log.userAgent || '—'}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
