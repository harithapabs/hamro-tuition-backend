import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiArrowLeft, FiCheckCircle, FiLoader, FiXCircle, FiEye, FiEyeOff } from 'react-icons/fi';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await authAPI.forgotPassword({ email });
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <FiArrowLeft /> Back
        </Link>
        {sent ? (
          <div className="text-center">
            <FiCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h1>
            <p className="text-gray-500 text-sm">If an account exists for that email, we've sent a password reset link.</p>
            <Link to="/" className="inline-block mt-6 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium text-sm">
              Back to Home
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Forgot Password?</h1>
            <p className="text-gray-500 text-sm mb-6">Enter your email and we'll send you a reset link.</p>
            <form onSubmit={submit}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <div className="relative mb-4">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
              <button type="submit" disabled={loading} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg text-sm">
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
};

export const ResetPassword = () => {
  const [params] = useSearchParams();
  const token = params.get('token');
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(token ? 'form' : 'invalid');

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      toast.error('Password must be 8+ chars with letters and numbers');
      return;
    }
    if (password !== confirm) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      await authAPI.resetPassword({ token, newPassword: password });
      setStatus('success');
      setTimeout(() => navigate('/'), 3000);
    } catch (err) {
      setStatus('error');
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <FiCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Password Reset!</h1>
          <p className="text-gray-500 text-sm">Redirecting to home page...</p>
        </div>
      </div>
    );
  }
  if (status === 'invalid' || status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <FiXCircle className="text-6xl text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid or Expired Link</h1>
          <p className="text-gray-500 text-sm mb-6">Please request a new password reset link.</p>
          <Link to="/forgot-password" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium text-sm">
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Set New Password</h1>
        <p className="text-gray-500 text-sm mb-6">Enter a new password for your account.</p>
        <form onSubmit={submit}>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
          <div className="relative mb-3">
            <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required
              className="w-full pl-10 pr-10 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {showPw ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
          <div className="relative mb-4">
            <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type={showPw ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)} required
              className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          </div>
          <button type="submit" disabled={loading} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg text-sm">
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
