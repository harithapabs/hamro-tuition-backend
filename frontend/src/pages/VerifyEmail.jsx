import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiXCircle, FiMail, FiLoader } from 'react-icons/fi';
import { authAPI } from '../utils/api';

const VerifyEmail = () => {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState('verifying');

  useEffect(() => {
    if (!token) { setStatus('invalid'); return; }
    authAPI.verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
      >
        {status === 'verifying' && (
          <>
            <FiLoader className="text-6xl text-blue-500 mx-auto mb-4 animate-spin" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying your email...</h1>
            <p className="text-gray-500">Please wait a moment.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <FiCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h1>
            <p className="text-gray-500 mb-6">Your email has been successfully verified. You can now use all features.</p>
            <Link to="/dashboard/student" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium">
              Go to Dashboard
            </Link>
          </>
        )}
        {(status === 'error' || status === 'invalid') && (
          <>
            <FiXCircle className="text-6xl text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h1>
            <p className="text-gray-500 mb-6">The link is invalid or has expired. Please register again or contact support.</p>
            <Link to="/" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium">
              Back to Home
            </Link>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
