import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, ShieldAlert, Lock, CheckCircle2, UserCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security'
  
  // Profile Form
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [profileMessage, setProfileMessage] = useState('');

  // Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityMessage, setSecurityMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = () => {
    const username = localStorage.getItem('username');
    const staffList = JSON.parse(localStorage.getItem('mockStaff') || '[]');
    const currentUser = staffList.find(s => s.username === username);
    if (currentUser) {
      setUser(currentUser);
      setPhone(currentUser.phone || '');
      setEmail(currentUser.email || '');
    }
  };

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    const staffList = JSON.parse(localStorage.getItem('mockStaff') || '[]');
    const updatedStaff = staffList.map(s => {
      if (s.id === user.id) {
        return { ...s, phone, email };
      }
      return s;
    });
    localStorage.setItem('mockStaff', JSON.stringify(updatedStaff));
    setProfileMessage('Profile updated successfully!');
    setTimeout(() => setProfileMessage(''), 3000);
    loadUser();
  };

  const handlePasswordUpdate = (e) => {
    e.preventDefault();
    setSecurityMessage({ text: '', type: '' });

    if (currentPassword !== user.password) {
      setSecurityMessage({ text: 'Current password is incorrect.', type: 'error' });
      return;
    }
    if (newPassword.length < 6) {
      setSecurityMessage({ text: 'New password must be at least 6 characters.', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setSecurityMessage({ text: 'New passwords do not match.', type: 'error' });
      return;
    }

    const staffList = JSON.parse(localStorage.getItem('mockStaff') || '[]');
    const updatedStaff = staffList.map(s => {
      if (s.id === user.id) {
        return { ...s, password: newPassword };
      }
      return s;
    });
    localStorage.setItem('mockStaff', JSON.stringify(updatedStaff));
    
    // Audit log
    const auditLogs = JSON.parse(localStorage.getItem('mockAuditLogs') || '[]');
    auditLogs.unshift({
      id: Date.now(),
      timestamp: new Date().toISOString(),
      action: 'Password Change',
      user: user.username,
      role: user.role,
      details: 'User updated their own password'
    });
    localStorage.setItem('mockAuditLogs', JSON.stringify(auditLogs));

    setSecurityMessage({ text: 'Password updated successfully!', type: 'success' });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setSecurityMessage({ text: '', type: '' }), 3000);
    loadUser();
  };

  if (!user) return <div className="p-8 text-center text-gray-500">Loading profile...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Profile & Settings</h1>
        <p className="text-gray-500">Manage your personal information and security settings</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="md:w-64 space-y-2">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-bold ${activeTab === 'profile' ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}
          >
            <UserCircle size={18} /> Personal Info
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-bold ${activeTab === 'security' ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}
          >
            <ShieldAlert size={18} /> Security & Password
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-black">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                  <p className="text-gray-500 text-sm font-semibold">{user.role}</p>
                </div>
              </div>
              
              <form onSubmit={handleProfileUpdate} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Read Only Fields */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                      {user.role === 'Owner' ? 'Admin ID' : 'Employee ID'}
                    </label>
                    <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-semibold cursor-not-allowed">
                      {user.employeeId}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Username</label>
                    <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-semibold cursor-not-allowed">
                      {user.username}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Role</label>
                    <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-semibold cursor-not-allowed">
                      {user.role}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Status</label>
                    <div className="px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-700 font-bold cursor-not-allowed flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      {user.status}
                    </div>
                  </div>

                  {/* Editable Fields */}
                  <div className="md:col-span-2 pt-4 border-t border-gray-100">
                    <h3 className="text-sm font-bold text-gray-900 mb-4">Contact Information</h3>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Phone Number</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text" 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900"
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Email Address</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900"
                        placeholder="Enter email address"
                      />
                    </div>
                  </div>
                </div>

                {profileMessage && (
                  <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-semibold flex items-center gap-2">
                    <CheckCircle2 size={16} /> {profileMessage}
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md shadow-blue-200 transition-all">
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gray-50">
                <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
                <p className="text-gray-500 text-sm">Update your password to keep your account secure.</p>
              </div>
              
              <form onSubmit={handlePasswordUpdate} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Current Password</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="password" 
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                      placeholder="Enter current password"
                    />
                  </div>
                </div>
                
                <div className="pt-4">
                  <label className="block text-sm font-bold text-gray-700 mb-1">New Password</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                      placeholder="Enter new password"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Confirm New Password</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>

                {securityMessage.text && (
                  <div className={`p-3 rounded-lg text-sm font-semibold flex items-center gap-2 ${securityMessage.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {securityMessage.type === 'success' && <CheckCircle2 size={16} />}
                    {securityMessage.text}
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <button type="submit" className="px-6 py-2 bg-gray-900 text-white font-bold rounded-lg hover:bg-black shadow-md transition-all">
                    Update Password
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
