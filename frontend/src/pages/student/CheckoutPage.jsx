import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiArrowLeft, FiUpload, FiSmartphone, FiCreditCard, FiCheck,
  FiAlertCircle, FiImage, FiTrash2,
} from 'react-icons/fi';
import { courseAPI, paymentAPI, studentAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const TOKEN_VALUE = 100;

const CheckoutPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [screenshot, setScreenshot] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [referralValid, setReferralValid] = useState(null);
  const [referrerName, setReferrerName] = useState('');
  const [tokenBalance, setTokenBalance] = useState(0);
  const [tokensUsed, setTokensUsed] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    const fetchData = async () => {
      try {
        const [courseRes, settingsRes, refRes] = await Promise.all([
          courseAPI.getOne(courseId),
          paymentAPI.getPaymentSettings(),
          studentAPI.getReferralInfo().catch(() => ({ data: { balance: 0, tokenValueRs: TOKEN_VALUE } })),
        ]);
        setCourse(courseRes.data);
        setSettings(settingsRes.data);
        setTokenBalance(refRes.data.balance || 0);

        if (settingsRes.data.khalti?.enabled) {
          setSelectedMethod('khalti');
        } else if (settingsRes.data.bank?.enabled) {
          setSelectedMethod('bank');
        }
      } catch {
        toast.error('Course not found');
        navigate('/courses');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [courseId, user, navigate]);

  const validateReferral = async () => {
    if (!referralCode.trim()) {
      setReferralValid(null);
      return;
    }
    try {
      const r = await studentAPI.validateReferralCode(referralCode.trim());
      setReferralValid(true);
      setReferrerName(r.data.referrerName);
    } catch {
      setReferralValid(false);
      setReferrerName('');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setScreenshot(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!selectedMethod) {
      toast.error('Please select a payment method');
      return;
    }
    if (!screenshot) {
      toast.error('Please upload payment screenshot');
      return;
    }
    if (!transactionId || transactionId.trim().length < 6) {
      toast.error('Please enter a valid transaction ID (6+ characters)');
      return;
    }

    setSubmitting(true);
    try {
      const res = await paymentAPI.submitManual({
        courseId,
        method: selectedMethod,
        screenshot,
        transactionId,
        remarks,
        referralCode: referralCode.trim() || undefined,
        tokensUsed: tokensUsed > 0 ? tokensUsed : undefined,
      });
      toast.success(res.data.message);
      navigate('/dashboard/student/payment-success');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!course) return null;

  const khaltiEnabled = settings?.khalti?.enabled;
  const bankEnabled = settings?.bank?.enabled;

  const maxTokensUsable = Math.min(tokenBalance, Math.floor((course.price || 0) / TOKEN_VALUE));
  const tokenDiscount = Math.min(tokensUsed, maxTokensUsable) * TOKEN_VALUE;
  const finalPrice = Math.max(0, (course.price || 0) - tokenDiscount);

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link
          to={`/course/${courseId}`}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium mb-6"
        >
          <FiArrowLeft /> Back to Course
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-500 text-sm mt-1">Complete payment to enroll in the course</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h2>

              {!khaltiEnabled && !bankEnabled && (
                <div className="text-center py-8">
                  <FiAlertCircle className="text-4xl text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No payment methods available yet.</p>
                  <p className="text-gray-400 text-sm mt-1">Please contact admin for assistance.</p>
                </div>
              )}

              <div className="space-y-3">
                {khaltiEnabled && (
                  <button
                    onClick={() => setSelectedMethod('khalti')}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                      selectedMethod === 'khalti'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      selectedMethod === 'khalti' ? 'bg-purple-500' : 'bg-purple-100'
                    }`}>
                      <FiSmartphone className={`text-xl ${
                        selectedMethod === 'khalti' ? 'text-white' : 'text-purple-600'
                      }`} />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-medium text-gray-900">{settings?.khalti?.label || 'Khalti Payment'}</p>
                      <p className="text-xs text-gray-500">Scan QR and pay via Khalti</p>
                    </div>
                    {selectedMethod === 'khalti' && (
                      <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                        <FiCheck className="text-white text-sm" />
                      </div>
                    )}
                  </button>
                )}

                {bankEnabled && (
                  <button
                    onClick={() => setSelectedMethod('bank')}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                      selectedMethod === 'bank'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      selectedMethod === 'bank' ? 'bg-blue-500' : 'bg-blue-100'
                    }`}>
                      <FiCreditCard className={`text-xl ${
                        selectedMethod === 'bank' ? 'text-white' : 'text-blue-600'
                      }`} />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-medium text-gray-900">{settings?.bank?.bankName || 'Bank Transfer'}</p>
                      <p className="text-xs text-gray-500">Scan QR and pay via bank</p>
                    </div>
                    {selectedMethod === 'bank' && (
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                        <FiCheck className="text-white text-sm" />
                      </div>
                    )}
                  </button>
                )}
              </div>
            </motion.div>

            {selectedMethod && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {selectedMethod === 'khalti' ? 'Khalti' : 'Bank'} QR Code
                </h2>

                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Please scan the QR code below and complete the payment of{' '}
                    <span className="font-bold text-gray-900">Rs. {finalPrice.toLocaleString()}</span>
                  </p>

                  {(selectedMethod === 'khalti' && settings?.khalti?.qrImage) && (
                    <div className="inline-block">
                      <img
                        src={settings.khalti.qrImage}
                        alt="Khalti QR Code"
                        className="w-64 h-64 object-contain rounded-xl border border-gray-200 mx-auto"
                      />
                      {settings.khalti.khaltiNumber && (
                        <p className="text-sm text-gray-500 mt-2">
                          Khalti No: <span className="font-medium">{settings.khalti.khaltiNumber}</span>
                        </p>
                      )}
                      {settings.khalti.khaltiName && (
                        <p className="text-sm text-gray-500">
                          Name: <span className="font-medium">{settings.khalti.khaltiName}</span>
                        </p>
                      )}
                    </div>
                  )}

                  {(selectedMethod === 'bank' && settings?.bank?.qrImage) && (
                    <div className="inline-block">
                      <img
                        src={settings.bank.qrImage}
                        alt="Bank QR Code"
                        className="w-64 h-64 object-contain rounded-xl border border-gray-200 mx-auto"
                      />
                      {settings.bank.bankName && (
                        <p className="text-sm text-gray-500 mt-2">
                          Bank: <span className="font-medium">{settings.bank.bankName}</span>
                        </p>
                      )}
                      {settings.bank.accountName && (
                        <p className="text-sm text-gray-500">
                          Account: <span className="font-medium">{settings.bank.accountName}</span>
                        </p>
                      )}
                      {settings.bank.accountNumber && (
                        <p className="text-sm text-gray-500">
                          No: <span className="font-medium">{settings.bank.accountNumber}</span>
                        </p>
                      )}
                    </div>
                  )}

                  {((selectedMethod === 'khalti' && !settings?.khalti?.qrImage) ||
                    (selectedMethod === 'bank' && !settings?.bank?.qrImage)) && (
                    <div className="py-8">
                      <FiAlertCircle className="text-4xl text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">QR code not uploaded yet. Please contact admin.</p>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-100 pt-4 mt-4">
                  <h3 className="font-medium text-gray-900 mb-3">Upload Payment Proof</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Screenshot <span className="text-red-500">*</span>
                      </label>
                      {screenshot ? (
                        <div className="relative group inline-block">
                          <img
                            src={screenshot}
                            alt="Payment proof"
                            className="w-48 h-48 object-cover rounded-xl border border-gray-200"
                          />
                          <button
                            onClick={() => setScreenshot('')}
                            className="absolute top-2 right-2 p-1.5 bg-white rounded-lg shadow hover:bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <FiTrash2 className="text-sm" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-48 h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors">
                          <FiImage className="text-gray-400 text-3xl mb-2" />
                          <span className="text-sm text-gray-500">Upload Screenshot</span>
                          <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                          />
                        </label>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Transaction ID <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        placeholder="Enter transaction ID"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Remarks <span className="text-gray-400">(optional)</span>
                      </label>
                      <textarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
                        placeholder="Any additional notes..."
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-24"
            >
              <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>

              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <FiImage className="text-white/50 text-xl" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-sm line-clamp-2">{course.title}</p>
                  <p className="text-xs text-gray-500">{course.category || 'Course'}</p>
                </div>
              </div>

              <div className="space-y-2 mb-4 pb-4 border-b border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Course Fee</span>
                  <span className="text-gray-900">Rs. {course.price?.toLocaleString()}</span>
                </div>
                {tokenDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Token Discount ({tokensUsed} × Rs {TOKEN_VALUE})</span>
                    <span>− Rs. {tokenDiscount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Processing Fee</span>
                  <span className="text-gray-900">Rs. 0</span>
                </div>
              </div>

              <div className="flex justify-between font-semibold text-gray-900 mb-4">
                <span>Total</span>
                <span className="text-blue-600">Rs. {finalPrice.toLocaleString()}</span>
              </div>

              <div className="space-y-3 mb-4 pb-4 border-b border-gray-100">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Referral Code (optional)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={referralCode}
                      onChange={(e) => { setReferralCode(e.target.value.toUpperCase()); setReferralValid(null); }}
                      onBlur={validateReferral}
                      placeholder="HAMRO-XXXX-XXXX"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                    />
                  </div>
                  {referralValid === true && (
                    <p className="text-xs text-green-600 mt-1">✓ Valid — referred by {referrerName}</p>
                  )}
                  {referralValid === false && (
                    <p className="text-xs text-red-600 mt-1">Invalid or own code</p>
                  )}
                </div>

                {tokenBalance > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Use Tokens (you have {tokenBalance} = Rs {tokenBalance * TOKEN_VALUE})
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max={maxTokensUsable}
                        value={tokensUsed}
                        onChange={(e) => setTokensUsed(Number(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-sm font-medium text-purple-600 w-12 text-right">{tokensUsed}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Max usable: {maxTokensUsable} tokens (Rs {maxTokensUsable * TOKEN_VALUE})</p>
                  </div>
                )}
              </div>

              <button
                onClick={handleSubmit}
                disabled={!selectedMethod || !screenshot || !transactionId || submitting}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Payment'}
              </button>

              <p className="text-xs text-gray-400 text-center mt-3">
                Course will be unlocked within 24 hours after verification
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
