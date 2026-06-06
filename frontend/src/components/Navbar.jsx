import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaUser, FaBars, FaTimes, FaBookOpen, FaVideo, FaSearch } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ onLoginClick }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [navSearch, setNavSearch] = useState('');
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavSearch = (e) => {
    if (e.key === 'Enter' && navSearch.trim()) {
      navigate(`/courses?q=${encodeURIComponent(navSearch.trim())}`);
      setNavSearch('');
      setMobileOpen(false);
    }
  };

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/courses', label: 'Courses' },
    { path: '/live-class', label: 'Live Class', icon: FaVideo },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <FaBookOpen className="text-blue-600 text-2xl" />
            <span className="text-xl font-bold text-gray-900">Hamro Tuition</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2 w-56">
              <FaSearch className="text-gray-400 text-sm" />
              <input
                type="text"
                value={navSearch}
                onChange={(e) => setNavSearch(e.target.value)}
                onKeyDown={handleNavSearch}
                placeholder="Search courses..."
                className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none flex-1"
              />
            </div>
            <div className="flex items-center gap-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <FaUser className="text-blue-600 text-xs" />
                  </div>
                  <span>{user.name}</span>
                </button>
                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-2 z-20 border">
                      <Link
                        to={user.role === 'admin' ? '/dashboard/admin' : '/dashboard/student'}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                        onClick={() => setDropdownOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <button
                        onClick={() => { logout(); setDropdownOpen(false); }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={onLoginClick}
                className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700 transition-all"
              >
                Login / Sign Up
              </button>
            )}
            </div>
          </div>

          <button
            className="md:hidden text-gray-600"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-t px-4 py-4 space-y-3">
          <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2">
            <FaSearch className="text-gray-400 text-sm" />
            <input
              type="text"
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              onKeyDown={handleNavSearch}
              placeholder="Search courses..."
              className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none flex-1"
            />
          </div>
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`block text-sm font-medium ${
                isActive(link.path) ? 'text-blue-600' : 'text-gray-600'
              }`}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <hr className="my-2" />
          {user ? (
            <>
              <Link
                to={user.role === 'admin' ? '/dashboard/admin' : '/dashboard/student'}
                className="block text-sm text-gray-600"
                onClick={() => setMobileOpen(false)}
              >
                Dashboard
              </Link>
              <button
                onClick={() => { logout(); setMobileOpen(false); }}
                className="block text-sm text-red-600"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => { onLoginClick(); setMobileOpen(false); }}
              className="w-full px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-full"
            >
              Login / Sign Up
            </button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
