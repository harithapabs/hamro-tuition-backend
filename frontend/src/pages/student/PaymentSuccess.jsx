import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiClock, FiArrowRight, FiHome } from 'react-icons/fi';

const PaymentSuccess = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 max-w-md w-full p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6"
        >
          <FiCheckCircle className="text-emerald-500 text-4xl" />
        </motion.div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Payment Request Submitted!
        </h1>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <FiClock className="text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <p className="text-sm font-medium text-amber-800">
                Course will be unlocked within 24 hours after verification.
              </p>
              <p className="text-xs text-amber-600 mt-1">
                We will notify you once your payment is verified.
              </p>
            </div>
          </div>
        </div>

        <p className="text-gray-500 text-sm mb-6">
          You can check the status of your payment in the payment history section.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            to="/dashboard/student/payment-history"
            className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all"
          >
            View Payment History <FiArrowRight />
          </Link>
          <Link
            to="/dashboard/student"
            className="flex items-center justify-center gap-2 w-full py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
          >
            <FiHome /> Go to Dashboard
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;
