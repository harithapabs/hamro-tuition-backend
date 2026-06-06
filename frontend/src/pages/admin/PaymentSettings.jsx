import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FiSave, FiUpload, FiSmartphone, FiCreditCard, FiCheckCircle,
  FiXCircle, FiTrash2, FiEye,
} from 'react-icons/fi';
import { adminAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const PaymentSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [khalti, setKhalti] = useState({
    enabled: false,
    qrImage: '',
    label: 'Khalti Payment',
    khaltiNumber: '',
    khaltiName: '',
  });
  const [bank, setBank] = useState({
    enabled: false,
    qrImage: '',
    bankName: '',
    accountName: '',
    accountNumber: '',
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await adminAPI.getPaymentSettings();
        if (data.khalti) setKhalti(data.khalti);
        if (data.bank) setBank(data.bank);
      } catch {
        toast.error('Failed to load payment settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleImageUpload = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'khalti') {
        setKhalti({ ...khalti, qrImage: reader.result });
      } else {
        setBank({ ...bank, qrImage: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (type) => {
    if (type === 'khalti') {
      setKhalti({ ...khalti, qrImage: '' });
    } else {
      setBank({ ...bank, qrImage: '' });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminAPI.savePaymentSettings({ khalti, bank });
      toast.success('Payment settings saved successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Manual Payment Setup</h2>
        <p className="text-gray-500 text-sm mt-1">Configure QR payment methods for students</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <FiSmartphone className="text-purple-600 text-lg" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Khalti QR</h3>
                <p className="text-xs text-gray-500">Mobile wallet payment</p>
              </div>
            </div>
            <button
              onClick={() => setKhalti({ ...khalti, enabled: !khalti.enabled })}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                khalti.enabled ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  khalti.enabled ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">QR Code Image</label>
              {khalti.qrImage ? (
                <div className="relative group">
                  <img
                    src={khalti.qrImage}
                    alt="Khalti QR"
                    className="w-full max-w-xs rounded-xl border border-gray-200"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-3">
                    <label className="cursor-pointer p-2 bg-white rounded-lg hover:bg-gray-100">
                      <FiEye className="text-gray-600" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, 'khalti')}
                      />
                    </label>
                    <button
                      onClick={() => removeImage('khalti')}
                      className="p-2 bg-white rounded-lg hover:bg-red-50 text-red-500"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full max-w-xs h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors">
                  <FiUpload className="text-gray-400 text-3xl mb-2" />
                  <span className="text-sm text-gray-500">Upload Khalti QR</span>
                  <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, 'khalti')}
                  />
                </label>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Label</label>
              <input
                type="text"
                value={khalti.label}
                onChange={(e) => setKhalti({ ...khalti, label: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                placeholder="Khalti Payment"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Khalti Number</label>
                <input
                  type="text"
                  value={khalti.khaltiNumber}
                  onChange={(e) => setKhalti({ ...khalti, khaltiNumber: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                  placeholder="98XXXXXXXX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Khalti Name</label>
                <input
                  type="text"
                  value={khalti.khaltiName}
                  onChange={(e) => setKhalti({ ...khalti, khaltiName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
              khalti.enabled ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {khalti.enabled ? <FiCheckCircle /> : <FiXCircle />}
              {khalti.enabled ? 'Enabled for students' : 'Disabled'}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <FiCreditCard className="text-blue-600 text-lg" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Bank QR</h3>
                <p className="text-xs text-gray-500">Bank transfer payment</p>
              </div>
            </div>
            <button
              onClick={() => setBank({ ...bank, enabled: !bank.enabled })}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                bank.enabled ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  bank.enabled ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">QR Code Image</label>
              {bank.qrImage ? (
                <div className="relative group">
                  <img
                    src={bank.qrImage}
                    alt="Bank QR"
                    className="w-full max-w-xs rounded-xl border border-gray-200"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-3">
                    <label className="cursor-pointer p-2 bg-white rounded-lg hover:bg-gray-100">
                      <FiEye className="text-gray-600" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, 'bank')}
                      />
                    </label>
                    <button
                      onClick={() => removeImage('bank')}
                      className="p-2 bg-white rounded-lg hover:bg-red-50 text-red-500"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full max-w-xs h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors">
                  <FiUpload className="text-gray-400 text-3xl mb-2" />
                  <span className="text-sm text-gray-500">Upload Bank QR</span>
                  <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, 'bank')}
                  />
                </label>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Bank Name</label>
              <input
                type="text"
                value={bank.bankName}
                onChange={(e) => setBank({ ...bank, bankName: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                placeholder="e.g. Nabil Bank, NIC Asia"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Account Name</label>
              <input
                type="text"
                value={bank.accountName}
                onChange={(e) => setBank({ ...bank, accountName: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                placeholder="Account holder name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Account Number (Optional)</label>
              <input
                type="text"
                value={bank.accountNumber}
                onChange={(e) => setBank({ ...bank, accountNumber: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                placeholder="XXXX-XXXX-XXXX"
              />
            </div>

            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
              bank.enabled ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {bank.enabled ? <FiCheckCircle /> : <FiXCircle />}
              {bank.enabled ? 'Enabled for students' : 'Disabled'}
            </div>
          </div>
        </motion.div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
        >
          <FiSave className={saving ? 'animate-spin' : ''} />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default PaymentSettings;
