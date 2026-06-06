import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  FiUser, FiMail, FiPhone, FiMapPin, FiCamera, FiSave,
  FiBookOpen, FiLock, FiShield, FiCheckCircle, FiAlertCircle,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { studentAPI, authAPI } from '../../utils/api';

const Profile = () => {
  const { user, setUser } = useAuth();
  const fileRef = useRef(null);
  const [activeTab, setActiveTab] = useState('edit');
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be less than 5MB'); return; }
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append('photo', file);
      const { data } = await studentAPI.uploadProfilePhoto(fd);
      if (setUser) setUser({ ...user, profilePic: data.profilePic });
      toast.success('Profile photo updated!');
    } catch { toast.error('Failed to upload photo'); }
    finally { setUploadingPhoto(false); }
  };

  const stats = [
    { label: 'Enrolled Courses', value: user?.enrolledCourses?.length || '0', icon: FiBookOpen, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50' },
    { label: 'Email', value: user?.email?.split('@')[0] || '-', icon: FiMail, color: 'from-purple-500 to-purple-600', bg: 'bg-purple-50' },
    { label: 'Phone', value: formData.phone || '-', icon: FiPhone, color: 'from-green-500 to-green-600', bg: 'bg-green-50' },
    { label: 'Address', value: formData.address || '-', icon: FiMapPin, color: 'from-orange-500 to-orange-600', bg: 'bg-orange-50' },
  ];

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { data } = await studentAPI.updateProfile({ name: formData.name, phone: formData.phone, address: formData.address });
      if (setUser) setUser({ ...user, ...data });
      toast.success('Profile updated successfully!');
    } catch { toast.error('Failed to update profile'); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
      toast.error('Please fill all password fields'); return;
    }
    if (passwordData.new !== passwordData.confirm) { toast.error('Passwords do not match'); return; }
    if (passwordData.new.length < 8 || !/[A-Za-z]/.test(passwordData.new) || !/[0-9]/.test(passwordData.new)) {
      toast.error('New password must be 8+ chars with letters and numbers'); return;
    }
    try {
      await studentAPI.changePassword({ currentPassword: passwordData.current, newPassword: passwordData.new });
      toast.success('Password changed successfully!');
      setPasswordData({ current: '', new: '', confirm: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to change password'); }
  };

  const toggle2FA = async () => {
    try {
      if (user.twoFactorEnabled) {
        await authAPI.disable2FA();
        toast.success('2FA disabled');
        if (setUser) setUser({ ...user, twoFactorEnabled: false });
      } else {
        if (!user.emailVerified) { toast.error('Verify your email first'); return; }
        await authAPI.enable2FA();
        toast.success('2FA enabled — you will get a code by email on next login');
        if (setUser) setUser({ ...user, twoFactorEnabled: true });
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to toggle 2FA'); }
  };

  const EditTab = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
          <div className="relative">
            <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input type="text" value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
          <div className="relative">
            <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input type="email" value={formData.email} onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
          <div className="relative">
            <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input type="tel" value={formData.phone} onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
          <div className="relative">
            <FiMapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input type="text" value={formData.address} onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
          </div>
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <button onClick={handleSaveProfile} disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed">
          <FiSave className={saving ? 'animate-spin' : ''} />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );

  const PasswordTab = () => (
    <div className="space-y-5 max-w-md">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
        <div className="relative">
          <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input type="password" value={passwordData.current} onChange={(e) => setPasswordData((p) => ({ ...p, current: e.target.value }))}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
        <div className="relative">
          <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input type="password" value={passwordData.new} onChange={(e) => setPasswordData((p) => ({ ...p, new: e.target.value }))}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
        <div className="relative">
          <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input type="password" value={passwordData.confirm} onChange={(e) => setPasswordData((p) => ({ ...p, confirm: e.target.value }))}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <button onClick={handleChangePassword}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-600/20">
          <FiLock /> Change Password
        </button>
      </div>
    </div>
  );

  const SecurityTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user?.emailVerified ? 'bg-green-100' : 'bg-amber-100'}`}>
            {user?.emailVerified ? <FiCheckCircle className="text-green-600 text-xl" /> : <FiAlertCircle className="text-amber-600 text-xl" />}
          </div>
          <div>
            <p className="font-medium text-gray-900">Email Verification</p>
            <p className="text-xs text-gray-500">{user?.emailVerified ? 'Your email is verified' : 'Check your inbox for the verification link'}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${user?.emailVerified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
          {user?.emailVerified ? 'Verified' : 'Pending'}
        </span>
      </div>

      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user?.twoFactorEnabled ? 'bg-green-100' : 'bg-gray-200'}`}>
            <FiShield className={`text-xl ${user?.twoFactorEnabled ? 'text-green-600' : 'text-gray-500'}`} />
          </div>
          <div>
            <p className="font-medium text-gray-900">Two-Factor Authentication</p>
            <p className="text-xs text-gray-500">Get a 6-digit code by email on every login</p>
          </div>
        </div>
        <button
          onClick={toggle2FA}
          className={`relative w-12 h-6 rounded-full transition-colors ${user?.twoFactorEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
        >
          <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${user?.twoFactorEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
        </button>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
        <strong>Tip:</strong> 2FA requires a verified email. Check your inbox (or spam folder) for the verification link.
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account settings</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-10 text-center relative">
          <div className="relative inline-block">
            <div className="w-24 h-24 rounded-full border-4 border-white/50 mx-auto overflow-hidden bg-white/20 flex items-center justify-center">
              {user?.profilePic ? (
                <img src={user.profilePic} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-white">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
              )}
            </div>
            <button onClick={() => fileRef.current?.click()} disabled={uploadingPhoto}
              className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors">
              {uploadingPhoto ? <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /> : <FiCamera className="text-blue-600 text-sm" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </div>
          <h2 className="text-xl font-bold text-white mt-3">{formData.name}</h2>
          <p className="text-blue-200 text-sm">{user?.email || formData.email}</p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-medium border border-white/20">
            <FiUser className="text-xs" /> Student
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-5 -mt-8 relative z-10">
          {stats.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mx-auto mb-2`}>
                <stat.icon className={`text-lg bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`} />
              </div>
              <div className="text-xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100">
          {['edit', 'password', 'security'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3.5 text-sm font-medium transition-colors relative ${activeTab === tab ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
              {tab === 'edit' ? 'Edit Profile' : tab === 'password' ? 'Change Password' : 'Security'}
              {activeTab === tab && (
                <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full" />
              )}
            </button>
          ))}
        </div>

        <div className="p-5 lg:p-6">
          {activeTab === 'edit' && <EditTab />}
          {activeTab === 'password' && <PasswordTab />}
          {activeTab === 'security' && <SecurityTab />}
        </div>
      </div>
    </div>
  );
};

export default Profile;
