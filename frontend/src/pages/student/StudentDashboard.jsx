import { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiGrid, FiBookOpen, FiHelpCircle, FiFileText, FiMessageSquare,
  FiUser, FiLogOut, FiBell, FiSearch, FiChevronDown, FiMenu, FiX,
  FiBook, FiCreditCard, FiStar, FiClipboard, FiAward, FiEdit3, FiGift,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { notificationAPI } from '../../utils/api';

const navItems = [
  { path: '/dashboard/student', label: 'My Courses', icon: FiGrid },
  { path: '/dashboard/student/quiz', label: 'Quiz', icon: FiHelpCircle },
  { path: '/dashboard/student/assignments', label: 'Live Session & Assignment', icon: FiFileText },
  { path: '/dashboard/student/doubts', label: 'Doubts', icon: FiMessageSquare },
  { path: '/dashboard/student/teaching-board', label: 'Teaching Board', icon: FiEdit3 },
  { path: '/dashboard/student/referrals', label: 'Referrals & Tokens', icon: FiGift },
  { path: '/dashboard/student/notices', label: 'Notices', icon: FiClipboard },
  { path: '/dashboard/student/certificates', label: 'Certificates', icon: FiAward },
  { path: '/dashboard/student/payment-history', label: 'Payment History', icon: FiCreditCard },
  { path: '/dashboard/student/write-review', label: 'Write Review', icon: FiStar },
  { path: '/dashboard/student/notifications', label: 'Notifications', icon: FiBell },
  { path: '/dashboard/student/profile', label: 'Profile', icon: FiUser },
];

const StudentDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const [notifDropdown, setNotifDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [recentNotifs, setRecentNotifs] = useState([]);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const fetchNotifs = async () => {
    try {
      const { data } = await notificationAPI.getUnreadCount();
      setUnreadCount(data.count || 0);
      const { data: list } = await notificationAPI.getAll();
      setRecentNotifs(Array.isArray(list) ? list.slice(0, 5) : []);
    } catch {}
  };

  useEffect(() => { fetchNotifs(); }, []);

  useEffect(() => {
    if (notifDropdown) fetchNotifs();
  }, [notifDropdown]);

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifDropdown(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileDropdown(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const isActive = (path) => {
    if (path === '/dashboard/student') return location.pathname === '/dashboard/student';
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-gray-50 font-['Poppins',sans-serif]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 flex flex-col transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center gap-3 px-6 h-16 border-b border-white/10">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
            <FiBook className="text-white text-lg" />
          </div>
          <span className="text-xl font-bold text-white">
            Hamro <span className="text-blue-400">Tuition</span>
          </span>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive(item.path)
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className={`text-lg ${isActive(item.path) ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'} transition-colors`} />
              {item.label}
              {item.label === 'Dashboard' && (
                <span className={`ml-auto w-2 h-2 rounded-full ${isActive(item.path) ? 'bg-white' : 'bg-blue-500'}`} />
              )}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all group"
          >
            <FiLogOut className="text-lg text-slate-500 group-hover:text-red-400 transition-colors" />
            Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden text-gray-600 hover:text-gray-900 transition-colors"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <FiX size={22} /> : <FiMenu size={22} />}
            </button>
            <div className="hidden sm:flex items-center gap-2 bg-gray-100 rounded-xl px-4 py-2 w-64 lg:w-80">
              <FiSearch className="text-gray-400 text-sm" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && searchTerm.trim()) { navigate(`/courses?q=${encodeURIComponent(searchTerm.trim())}`); } }}
                placeholder="Search courses, lessons..."
                className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none flex-1"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifDropdown(!notifDropdown)}
                className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                  <FiBell className="text-gray-600 text-xl" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white font-bold flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              <AnimatePresence>
                {notifDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                      <Link
                        to="/dashboard/student/notifications"
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        onClick={() => setNotifDropdown(false)}
                      >
                        View All
                      </Link>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {recentNotifs.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm text-gray-400">No notifications</div>
                      ) : (
                        recentNotifs.map((n) => (
                          <div key={n._id} className={`flex items-start gap-3 px-4 py-3 hover:bg-blue-50/50 cursor-pointer transition-colors ${!n.read ? 'bg-blue-50/30' : ''}`}>
                            {!n.read && <div className="w-2 h-2 mt-2 rounded-full bg-blue-600 flex-shrink-0" />}
                            {n.read && <div className="w-2 h-2 mt-2 flex-shrink-0" />}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-700 line-clamp-2">{n.message}</p>
                              <span className="text-xs text-gray-400 mt-0.5">{new Date(n.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileDropdown(!profileDropdown)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-semibold">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[100px] truncate">
                  {user?.name || 'User'}
                </span>
                <FiChevronDown className="hidden sm:block text-gray-400 text-sm" />
              </button>
              <AnimatePresence>
                {profileDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                      <p className="text-xs text-gray-500">{user?.email || ''}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        to="/dashboard/profile"
                        onClick={() => setProfileDropdown(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                      >
                        <FiUser className="text-gray-400" /> Profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <FiLogOut className="text-red-400" /> Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;
