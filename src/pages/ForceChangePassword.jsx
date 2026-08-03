import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';

const ForceChangePassword = () => {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userId = localStorage.getItem('tempAuthToken');
    if (!userId) {
      navigate('/login');
      return;
    }
    const staffList = JSON.parse(localStorage.getItem('mockStaff') || '[]');
    const foundUser = staffList.find(s => String(s.id) === String(userId));
    if (!foundUser) {
      navigate('/login');
    } else {
      setUser(foundUser);
    }
  }, [navigate]);

  const getRoleCode = (roleName) => {
    switch(roleName?.toLowerCase()) {
      case 'waiter': return 'ROLE_WAITER';
      case 'kitchen staff':
      case 'kitchen': return 'ROLE_KITCHEN';
      case 'cashier': return 'ROLE_CASHIER';
      default: return 'ROLE_OWNER';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Update password in mockStaff
    const staffList = JSON.parse(localStorage.getItem('mockStaff') || '[]');
    const updatedStaff = staffList.map(s => {
      if (String(s.id) === String(user.id)) {
        return { ...s, password: newPassword, forcePasswordChange: false };
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
      details: 'Changed temporary password on first login'
    });
    localStorage.setItem('mockAuditLogs', JSON.stringify(auditLogs));

    // Log the user in fully
    setSuccess(true);
    localStorage.removeItem('tempAuthToken');
    
    setTimeout(() => {
      localStorage.setItem('token', 'mock-jwt-token-' + user.id);
      localStorage.setItem('role', getRoleCode(user.role));
      localStorage.setItem('username', user.username);
      localStorage.setItem('employeeId', user.employeeId);
      
      const roleCode = getRoleCode(user.role);
      switch(roleCode) {
        case 'ROLE_WAITER': navigate('/waiter/dashboard'); break;
        case 'ROLE_KITCHEN': navigate('/kitchen/dashboard'); break;
        case 'ROLE_CASHIER': navigate('/cashier/dashboard'); break;
        default: navigate('/owner/dashboard'); break;
      }
    }, 1500);
  };

  if (!user) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 text-orange-600 mb-4">
            <ShieldAlert size={32} />
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Action Required</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">You must change your temporary password before accessing the dashboard.</p>
      </div>

      {error && <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-400">{error}</div>}
      
      {success ? (
        <div className="p-6 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                <CheckCircle2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Password Updated!</h3>
            <p className="text-gray-500">Redirecting to your dashboard...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
            <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                type="password"
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                />
            </div>
            </div>

            <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
            <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                type="password"
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                />
            </div>
            </div>

            <button 
            type="submit" 
            className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition-colors" 
            >
                <span>Save and Continue</span>
                <ArrowRight size={18} />
            </button>
        </form>
      )}
    </motion.div>
  );
};

export default ForceChangePassword;
