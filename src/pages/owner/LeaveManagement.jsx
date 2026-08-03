import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, XCircle, Search, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const LeaveManagement = () => {
  const [leaves, setLeaves] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterRole, setFilterRole] = useState('All');
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [activeLeave, setActiveLeave] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [actionType, setActionType] = useState(''); // 'Approve' or 'Reject'

  useEffect(() => {
    loadLeaves();
  }, []);

  const loadLeaves = () => {
    const stored = JSON.parse(localStorage.getItem('mockLeaves') || '[]');
    setLeaves(stored.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)));
  };

  const openActionModal = (leave, type) => {
    setActiveLeave(leave);
    setActionType(type);
    setRemarks('');
    setShowModal(true);
  };

  const handleAction = () => {
    if (!remarks) {
      alert('Remarks are required.');
      return;
    }

    const status = actionType === 'Approve' ? 'Approved' : 'Rejected';
    const updated = leaves.map(l => 
      l.id === activeLeave.id ? { ...l, status, remarks, reviewedBy: 'Owner' } : l
    );
    
    localStorage.setItem('mockLeaves', JSON.stringify(updated));
    setLeaves(updated);

    // Audit Log
    const auditLogs = JSON.parse(localStorage.getItem('mockAuditLogs') || '[]');
    auditLogs.unshift({
      id: Date.now(),
      timestamp: new Date().toISOString(),
      action: 'Leave Decision',
      user: 'Owner',
      role: 'Owner',
      details: `${status} leave for ${activeLeave.name} (${activeLeave.id}). Remarks: ${remarks}`
    });
    localStorage.setItem('mockAuditLogs', JSON.stringify(auditLogs));

    // Notify Employee
    const notifs = JSON.parse(localStorage.getItem('mockNotifications') || '[]');
    notifs.unshift({
      id: Date.now(),
      userId: activeLeave.employeeId,
      message: `Your Leave Request (${activeLeave.id}) has been ${status}. Remarks: ${remarks}`,
      isRead: false,
      createdAt: new Date().toISOString(),
      type: status
    });
    localStorage.setItem('mockNotifications', JSON.stringify(notifs));

    setShowModal(false);
  };

  const filteredLeaves = leaves.filter(l => {
    const matchSearch = l.name.toLowerCase().includes(searchTerm.toLowerCase()) || l.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'All' || l.status === filterStatus;
    const matchRole = filterRole === 'All' || l.role === filterRole;
    return matchSearch && matchStatus && matchRole;
  });

  const pendingCount = leaves.filter(l => l.status === 'Pending').length;
  const approvedCount = leaves.filter(l => l.status === 'Approved').length;
  const rejectedCount = leaves.filter(l => l.status === 'Rejected').length;
  const cancelledCount = leaves.filter(l => l.status === 'Cancelled').length;

  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Leave Management</h1>
        <p className="text-gray-500 mt-1">Review and manage employee leave requests</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { title: 'Pending', value: pendingCount, icon: Clock, color: 'orange' },
          { title: 'Approved', value: approvedCount, icon: CheckCircle, color: 'green' },
          { title: 'Rejected', value: rejectedCount, icon: XCircle, color: 'red' },
          { title: 'Cancelled', value: cancelledCount, icon: FileText, color: 'gray' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`p-4 rounded-xl bg-${stat.color}-50 text-${stat.color}-600`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm font-semibold">{stat.title}</p>
              <h3 className="text-2xl font-black text-gray-900">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-wrap gap-4 items-center justify-between bg-gray-50">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Search by Employee ID or Name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
          </div>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <select 
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="All">All Roles</option>
            <option value="Waiter">Waiter</option>
            <option value="Kitchen Staff">Kitchen Staff</option>
            <option value="Cashier">Cashier</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white border-b border-gray-100 text-gray-500 text-xs uppercase font-bold">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Leave Type</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLeaves.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">No leave requests match filters</td></tr>
              ) : filteredLeaves.map(leave => (
                <tr key={leave.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">{leave.name}</div>
                    <div className="text-xs text-gray-500">{leave.employeeId}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-medium">{leave.role}</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-800">{leave.type}</div>
                    <div className="text-xs text-gray-500 max-w-[200px] truncate" title={leave.reason}>{leave.reason}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gray-800">{leave.days} Days</div>
                    <div className="text-xs text-gray-500">{leave.startDate} to {leave.endDate}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      leave.status === 'Approved' ? 'bg-green-100 text-green-700' :
                      leave.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                      leave.status === 'Cancelled' ? 'bg-gray-200 text-gray-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {leave.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {leave.status === 'Pending' ? (
                      <div className="flex gap-2">
                        <button onClick={() => openActionModal(leave, 'Approve')} className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors" title="Approve">
                          <CheckCircle size={18} />
                        </button>
                        <button onClick={() => openActionModal(leave, 'Reject')} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Reject">
                          <XCircle size={18} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400 italic text-center w-full block">Resolved</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className={`p-6 flex justify-between items-center text-white ${actionType === 'Approve' ? 'bg-green-600' : 'bg-red-600'}`}>
              <h2 className="text-xl font-bold flex items-center gap-2">
                {actionType === 'Approve' ? <CheckCircle /> : <XCircle />} 
                {actionType} Leave Request
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Employee</p>
                <p className="font-bold text-gray-900">{activeLeave.name} ({activeLeave.employeeId})</p>
                <div className="h-px bg-gray-200 my-3"></div>
                <p className="text-sm text-gray-500 mb-1">Reason</p>
                <p className="text-gray-800 font-medium">{activeLeave.reason}</p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Remarks / Note to Employee</label>
                <textarea 
                  required
                  rows="3"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900" 
                  placeholder={actionType === 'Approve' ? 'e.g. Approved, take care!' : 'e.g. Cannot approve, restaurant is busy.'}
                ></textarea>
              </div>
              <div className="pt-4 flex gap-3 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-colors">Cancel</button>
                <button onClick={handleAction} className={`flex-1 py-3 text-white font-bold rounded-xl transition-colors ${actionType === 'Approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                  Confirm {actionType}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagement;
