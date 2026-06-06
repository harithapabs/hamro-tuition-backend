import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FiBell, FiCheckCircle, FiFileText, FiMessageSquare, FiStar,
  FiBookOpen, FiClock, FiCheck, FiClipboard,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { notificationAPI } from '../../utils/api';

const typeConfig = {
  lesson: { icon: FiBookOpen, bg: 'bg-blue-100', color: 'text-blue-600' },
  grade: { icon: FiStar, bg: 'bg-green-100', color: 'text-green-600' },
  quiz: { icon: FiCheckCircle, bg: 'bg-purple-100', color: 'text-purple-600' },
  doubt: { icon: FiMessageSquare, bg: 'bg-orange-100', color: 'text-orange-600' },
  course: { icon: FiBell, bg: 'bg-indigo-100', color: 'text-indigo-600' },
  notice: { icon: FiClipboard, bg: 'bg-amber-100', color: 'text-amber-600' },
};

const timeAgo = (dateStr) => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const { data } = await notificationAPI.getAll();
      setNotifications(Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    } catch { toast.error('Failed to mark as read'); }
  };

  const markOneRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch {}
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 text-sm mt-1">
            {loading ? '' : unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-700 text-sm font-medium rounded-xl hover:bg-blue-100 transition-colors"
          >
            <FiCheck /> Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : !notifications.length ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh]">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mb-4">
            <FiBell className="text-blue-600 text-2xl" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No Notifications</h3>
          <p className="text-sm text-gray-500">You're all up to date!</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {notifications.map((notif, i) => {
            const config = typeConfig[notif.type] || typeConfig.course;
            return (
              <motion.div
                key={notif._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.02 }}
                className={`flex items-start gap-4 px-5 py-4 border-b border-gray-50 last:border-b-0 cursor-pointer hover:bg-gray-50/50 transition-colors ${
                  !notif.read ? 'bg-blue-50/30' : ''
                }`}
                onClick={() => markOneRead(notif._id)}
              >
                <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                  <config.icon className={config.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!notif.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                    {notif.message}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <FiClock className="text-gray-300 text-[10px]" />
                    <span className="text-xs text-gray-400">{timeAgo(notif.createdAt)}</span>
                  </div>
                </div>
                {!notif.read && (
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600 flex-shrink-0 mt-2" />
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;
