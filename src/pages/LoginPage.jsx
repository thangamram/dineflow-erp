import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UtensilsCrossed, Mail, Lock, ArrowRight } from 'lucide-react';
import api from '../api';

const LoginPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLoginSuccess = (user) => {
    // Add audit log
    const auditLogs = JSON.parse(localStorage.getItem('mockAuditLogs') || '[]');
    auditLogs.unshift({
      id: Date.now(),
      timestamp: new Date().toISOString(),
      action: 'Login',
      user: user.username,
      role: user.role,
      details: 'Successful login'
    });
    localStorage.setItem('mockAuditLogs', JSON.stringify(auditLogs));

    localStorage.setItem('token', 'mock-jwt-token-' + user.id);
    localStorage.setItem('role', getRoleCode(user.role));
    localStorage.setItem('username', user.username);
    localStorage.setItem('employeeId', user.employeeId);

    const roleCode = getRoleCode(user.role);
    switch(roleCode) {
      case 'ROLE_WAITER':
        navigate('/waiter/dashboard');
        break;
      case 'ROLE_KITCHEN':
        navigate('/kitchen/dashboard');
        break;
      case 'ROLE_CASHIER':
        navigate('/cashier/dashboard');
        break;
      default: // ROLE_OWNER or ROLE_ADMIN
        navigate('/owner/dashboard');
        break;
    }
  };

  const getRoleCode = (roleName) => {
    switch(roleName?.toLowerCase()) {
      case 'waiter': return 'ROLE_WAITER';
      case 'kitchen staff':
      case 'kitchen': return 'ROLE_KITCHEN';
      case 'cashier': return 'ROLE_CASHIER';
      default: return 'ROLE_OWNER';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const searchUsername = username.trim();
      const searchPassword = password.trim();
      
      // Master root access - guarantees owner can always log in to wipe corrupted data
      if (searchUsername.toLowerCase() === 'owner' && searchPassword === 'Admin@123') {
        handleLoginSuccess({
          id: 'OWN-0001', employeeId: 'OWN-0001', name: 'Owner Admin', 
          username: 'owner', role: 'Owner', status: 'Active', forcePasswordChange: false
        });
        return;
      }

      // Backend API login
      const data = await api.post('/auth/login', {
        usernameOrEmailOrMobile: searchUsername,
        password: searchPassword
      });

      const role = data.roles[0];
      let roleName = 'Owner';
      if (role === 'ROLE_WAITER') roleName = 'Waiter';
      else if (role === 'ROLE_KITCHEN') roleName = 'Kitchen';
      else if (role === 'ROLE_CASHIER') roleName = 'Cashier';

      // Log success locally
      const auditLogs = JSON.parse(localStorage.getItem('mockAuditLogs') || '[]');
      auditLogs.unshift({
        id: Date.now(),
        timestamp: new Date().toISOString(),
        action: 'Login',
        user: data.username,
        role: roleName,
        details: 'Successful backend login'
      });
      localStorage.setItem('mockAuditLogs', JSON.stringify(auditLogs));

      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('role', role);
      localStorage.setItem('username', data.username);
      localStorage.setItem('employeeId', data.fullName || data.username);

      switch(role) {
        case 'ROLE_WAITER':
          navigate('/waiter/dashboard');
          break;
        case 'ROLE_KITCHEN':
          navigate('/kitchen/dashboard');
          break;
        case 'ROLE_CASHIER':
          navigate('/cashier/dashboard');
          break;
        default:
          navigate('/owner/dashboard');
          break;
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
            <UtensilsCrossed size={32} />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">DineFlow</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Sign in to your restaurant dashboard</p>
      </div>

      {error && <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-400">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username / Emp ID</label>
          <div className="relative">
            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your Employee ID"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="password"
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <button 
          type="submit" 
          className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50" 
          disabled={loading}
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
};

export default LoginPage;
