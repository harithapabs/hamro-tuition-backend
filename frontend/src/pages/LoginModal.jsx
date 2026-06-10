import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUser, FaEnvelope, FaLock, FaChalkboardTeacher, FaUserGraduate, FaShieldAlt, FaSync } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';

const LoginModal = ({ onClose }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { login, register, verify2FA, requires2FA } = useAuth();

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [twoFactorForm, setTwoFactorForm] = useState({ code: '' });

  const [captcha, setCaptcha] = useState(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');

  const [captchaError, setCaptchaError] = useState(false);

  const loadCaptcha = async (retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        const { data } = await authAPI.getCaptcha();
        setCaptcha(data);
        setCaptchaAnswer('');
        setCaptchaError(false);
        return;
      } catch {
        if (i < retries - 1) await new Promise(r => setTimeout(r, 1000));
      }
    }
    setCaptcha(null);
    setCaptchaError(true);
  };

  useEffect(() => { loadCaptcha(); }, []);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateLogin = () => {
    const errs = {};
    if (!loginForm.email) errs.email = 'Email is required';
    else if (!validateEmail(loginForm.email)) errs.email = 'Invalid email format';
    if (!loginForm.password) errs.password = 'Password is required';
    return errs;
  };

  const validateField = (form, field) => {
    if (form === 'login') {
      if (field === 'email') {
        if (!loginForm.email) return 'Email is required';
        if (!validateEmail(loginForm.email)) return 'Invalid email format';
      }
      if (field === 'password' && !loginForm.password) return 'Password is required';
    } else {
      if (field === 'name' && !signupForm.name.trim()) return 'Name is required';
      if (field === 'email') {
        if (!signupForm.email) return 'Email is required';
        if (!validateEmail(signupForm.email)) return 'Invalid email format';
      }
      if (field === 'password') {
        if (!signupForm.password) return 'Password is required';
        if (signupForm.password.length < 8) return 'Min 8 characters';
        if (!/[A-Za-z]/.test(signupForm.password) || !/[0-9]/.test(signupForm.password)) {
          return 'Must include letters and numbers';
        }
      }
      if (field === 'confirmPassword' && signupForm.password !== signupForm.confirmPassword) {
        return 'Passwords do not match';
      }
    }
    return '';
  };

  const onFieldBlur = (form, field) => {
    const msg = validateField(form, field);
    setErrors((prev) => {
      const next = { ...prev };
      if (msg) next[field] = msg;
      else delete next[field];
      return next;
    });
  };

  const validateSignup = () => {
    const errs = {};
    if (!signupForm.name.trim()) errs.name = 'Name is required';
    if (!signupForm.email) errs.email = 'Email is required';
    else if (!validateEmail(signupForm.email)) errs.email = 'Invalid email format';
    if (!signupForm.password) errs.password = 'Password is required';
    else if (signupForm.password.length < 8) errs.password = 'Min 8 characters';
    else if (!/[A-Za-z]/.test(signupForm.password) || !/[0-9]/.test(signupForm.password)) {
      errs.password = 'Must include letters and numbers';
    }
    if (signupForm.password !== signupForm.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (captcha && !captchaAnswer) errs.captcha = 'Solve the captcha';
    return errs;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const errs = validateLogin();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    try {
      const result = await login(loginForm.email, loginForm.password);
      if (result?.requires2FA) {
        toast.success('Verification code sent to your email');
        return;
      }
      toast.success('Welcome back!');
      onClose();
      navigate(result.role === 'admin' ? '/dashboard/admin' : '/dashboard/student');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      setErrors({ general: msg });
      toast.error(msg);
      loadCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const handle2FA = async (e) => {
    e.preventDefault();
    if (!twoFactorForm.code || twoFactorForm.code.length !== 6) {
      setErrors({ code: 'Enter the 6-digit code' });
      return;
    }
    setLoading(true);
    try {
      const user = await verify2FA(loginForm.email, loginForm.password, twoFactorForm.code);
      toast.success('Verified!');
      onClose();
      navigate(user.role === 'admin' ? '/dashboard/admin' : '/dashboard/student');
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid code';
      setErrors({ general: msg });
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const errs = validateSignup();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    try {
      const user = await register({
        ...signupForm,
        captchaId: captcha?.id || null,
        captchaAnswer: captchaAnswer || null,
      });
      toast.success('Account created! Please verify your email.');
      onClose();
      navigate(user.role === 'admin' ? '/dashboard/admin' : '/dashboard/student');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      setErrors({ general: msg });
      toast.error(msg);
      loadCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const Captcha = () => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Security Check</label>
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 px-3 py-2.5 bg-gray-50 border rounded-lg">
          <span className="text-sm text-gray-700 font-medium">{captcha?.question}</span>
        </div>
        <input
          type="text"
          value={captchaAnswer}
          onChange={(e) => setCaptchaAnswer(e.target.value)}
          placeholder="Answer"
          className="w-24 px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
        <button type="button" onClick={loadCaptcha} className="p-2 text-gray-500 hover:text-gray-700" title="New question">
          <FaSync />
        </button>
      </div>
      {errors.captcha && <p className="text-red-500 text-xs mt-1">{errors.captcha}</p>}
    </div>
  );

  if (requires2FA) {
    return (
      <Modal isOpen={true} onClose={onClose} size="sm">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-blue-100 mx-auto mb-4 flex items-center justify-center">
            <FaShieldAlt className="text-blue-600 text-2xl" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Two-Factor Authentication</h2>
          <p className="text-sm text-gray-500 mb-6">Enter the 6-digit code we sent to your email</p>
          {errors.general && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{errors.general}</div>}
          <form onSubmit={handle2FA}>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={twoFactorForm.code}
              onChange={(e) => setTwoFactorForm({ code: e.target.value.replace(/\D/g, '') })}
              placeholder="000000"
              className="w-full text-center text-2xl tracking-[0.5em] font-mono py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none mb-4"
              autoFocus
            />
            {errors.code && <p className="text-red-500 text-xs mb-3">{errors.code}</p>}
            <button type="submit" disabled={loading} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg text-sm">
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </form>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={true} onClose={onClose} size="md">
      <div className="flex border-b mb-6">
        {['login', 'signup'].map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setErrors({}); }}
            className={`flex-1 pb-3 text-sm font-medium transition-colors relative ${
              activeTab === tab ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab === 'login' ? 'Login' : 'Sign Up'}
            {activeTab === tab && (
              <motion.div layoutId="tabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
        ))}
      </div>

      {errors.general && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{errors.general}</div>
      )}

      <AnimatePresence mode="wait">
        {activeTab === 'login' ? (
          <motion.form key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }} onSubmit={handleLogin}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input type="email" value={loginForm.email}
                    onChange={(e) => { setLoginForm({ ...loginForm, email: e.target.value }); if (errors.email) setErrors(({ email, ...r }) => r); }}
                    onBlur={() => onFieldBlur('login', 'email')}
                    placeholder="your@email.com"
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${errors.email ? 'border-red-400 bg-red-50/50' : ''}`} />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><span>⚠</span>{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input type="password" value={loginForm.password}
                    onChange={(e) => { setLoginForm({ ...loginForm, password: e.target.value }); if (errors.password) setErrors(({ password, ...r }) => r); }}
                    onBlur={() => onFieldBlur('login', 'password')}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${errors.password ? 'border-red-400 bg-red-50/50' : ''}`} />
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><span>⚠</span>{errors.password}</p>}
                <div className="text-right mt-1">
                  <Link to="/forgot-password" onClick={onClose} className="text-xs text-blue-600 hover:underline">
                    Forgot password?
                  </Link>
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg text-sm">
                {loading ? 'Signing in...' : 'Login'}
              </button>
            </div>
          </motion.form>
        ) : (
          <motion.form key="signup" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} onSubmit={handleSignup}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                  <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input type="text" value={signupForm.name}
                    onChange={(e) => { setSignupForm({ ...signupForm, name: e.target.value }); if (errors.name) setErrors(({ name, ...r }) => r); }}
                    onBlur={() => onFieldBlur('signup', 'name')}
                    placeholder="Your full name"
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${errors.name ? 'border-red-400 bg-red-50/50' : ''}`} />
                </div>
                {errors.name && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><span>⚠</span>{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input type="email" value={signupForm.email}
                    onChange={(e) => { setSignupForm({ ...signupForm, email: e.target.value }); if (errors.email) setErrors(({ email, ...r }) => r); }}
                    onBlur={() => onFieldBlur('signup', 'email')}
                    placeholder="your@email.com"
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${errors.email ? 'border-red-400 bg-red-50/50' : ''}`} />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><span>⚠</span>{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input type="password" value={signupForm.password}
                    onChange={(e) => { setSignupForm({ ...signupForm, password: e.target.value }); if (errors.password) setErrors(({ password, ...r }) => r); }}
                    onBlur={() => onFieldBlur('signup', 'password')}
                    placeholder="Min 8 chars, letters + numbers"
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${errors.password ? 'border-red-400 bg-red-50/50' : ''}`} />
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><span>⚠</span>{errors.password}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input type="password" value={signupForm.confirmPassword}
                    onChange={(e) => { setSignupForm({ ...signupForm, confirmPassword: e.target.value }); if (errors.confirmPassword) setErrors(({ confirmPassword, ...r }) => r); }}
                    onBlur={() => onFieldBlur('signup', 'confirmPassword')}
                    placeholder="Repeat password"
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${errors.confirmPassword ? 'border-red-400 bg-red-50/50' : ''}`} />
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><span>⚠</span>{errors.confirmPassword}</p>}
              </div>
              {captcha && <Captcha />}
              <button type="submit" disabled={loading} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg text-sm">
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </Modal>
  );
};

export default LoginModal;
