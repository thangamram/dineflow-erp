import React, { useState, useEffect } from 'react';
import { Search, ShieldAlert, LogIn, LogOut, KeyRound, UserPlus, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadLogs = () => {
      const stored = localStorage.getItem('mockAuditLogs');
      if (stored) {
        setLogs(JSON.parse(stored));
      }
    };
    loadLogs();
    
    // Poll for new logs just in case
    const interval = setInterval(loadLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  const getActionIcon = (action) => {
    switch(action) {
      case 'Login': return <LogIn size={16} className="text-emerald-500" />;
      case 'Logout': return <LogOut size={16} className="text-gray-500" />;
      case 'Password Change':
      case 'Password Reset': return <KeyRound size={16} className="text-blue-500" />;
      case 'Account Created': return <UserPlus size={16} className="text-purple-500" />;
      case 'Failed Login': return <XCircle size={16} className="text-red-500" />;
      default: return <ShieldAlert size={16} className="text-orange-500" />;
    }
  };

  const getActionColor = (action) => {
    switch(action) {
      case 'Login': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Logout': return 'bg-gray-50 text-gray-700 border-gray-100';
      case 'Password Change':
      case 'Password Reset': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Account Created': return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'Failed Login': return 'bg-red-50 text-red-700 border-red-100';
      default: return 'bg-orange-50 text-orange-700 border-orange-100';
    }
  };

  const filteredLogs = logs.filter(log => 
    log.user?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Security Audit Logs</h1>
          <p className="text-gray-500">Track all authentication and account management events</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search user, action, or details..." 
              className="w-full pl-10 pr-4 py-2 text-gray-900 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-gray-500 text-sm border-b border-gray-200">
                <th className="p-4 font-bold">Timestamp</th>
                <th className="p-4 font-bold">Action</th>
                <th className="p-4 font-bold">User</th>
                <th className="p-4 font-bold">Role</th>
                <th className="p-4 font-bold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLogs.map(log => (
                <motion.tr 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  key={log.id} 
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="p-4 text-sm font-medium text-gray-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${getActionColor(log.action)}`}>
                      {getActionIcon(log.action)}
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-gray-900">
                    {log.user}
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {log.role}
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {log.details}
                  </td>
                </motion.tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500 font-medium">No audit logs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogsPage;
