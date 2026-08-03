import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, CheckCircle, XCircle, FileText, Send, X } from 'lucide-react';

const LeaveRequestsPage = () => {
  const [leaves, setLeaves] = useState([]);
  const [showApplyModal, setShowApplyModal] = useState(false);
  
  const userId = localStorage.getItem('employeeId');
  const userName = localStorage.getItem('username');
  const roleCode = localStorage.getItem('role');
  
  // Format role for display
  const displayRole = roleCode === 'ROLE_WAITER' ? 'Waiter' : 
                      roleCode === 'ROLE_KITCHEN' ? 'Kitchen Staff' : 
                      roleCode === 'ROLE_CASHIER' ? 'Cashier' : 'Employee';

  const [formData, setFormData] = useState({
    type: 'Casual Leave',
    startDate: '',
    endDate: '',
    reason: ''
  });

  useEffect(() => {
    loadLeaves();
  }, []);

  const loadLeaves = () => {
    const stored = JSON.parse(localStorage.getItem('mockLeaves') || '[]');
    const myLeaves = stored.filter(l => l.employeeId === userId);
    setLeaves(myLeaves.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)));
  };

  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = Math.abs(e - s);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
    return diffDays;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.startDate || !formData.endDate || !formData.reason) return;
    
    const days = calculateDays(formData.startDate, formData.endDate);
    if (days <= 0) return;

    const newLeave = {
      id: `LV-${Date.now()}`,
      employeeId: userId,
      name: userName,
      role: displayRole,
      type: formData.type,
      startDate: formData.startDate,
      endDate: formData.endDate,
      days: days,
      reason: formData.reason,
      status: 'Pending',
      submittedAt: new Date().toISOString(),
      remarks: ''
    };

    const stored = JSON.parse(localStorage.getItem('mockLeaves') || '[]');
    localStorage.setItem('mockLeaves', JSON.stringify([newLeave, ...stored]));
    
    // Create Notification for Owner
    const notifs = JSON.parse(localStorage.getItem('mockNotifications') || '[]');
    notifs.unshift({
      id: Date.now(),
      userId: 'owner',
      message: `New Leave Request from ${userName} (${days} days)`,
      isRead: false,
      createdAt: new Date().toISOString(),
      type: 'Info'
    });
    localStorage.setItem('mockNotifications', JSON.stringify(notifs));

    setFormData({ type: 'Casual Leave', startDate: '', endDate: '', reason: '' });
    setShowApplyModal(false);
    loadLeaves();
  };

  const cancelLeave = (id) => {
    if (!window.confirm("Are you sure you want to cancel this leave request?")) return;
    
    const stored = JSON.parse(localStorage.getItem('mockLeaves') || '[]');
    const updated = stored.map(l => l.id === id ? { ...l, status: 'Cancelled' } : l);
    localStorage.setItem('mockLeaves', JSON.stringify(updated));
    
    // Notify Owner
    const notifs = JSON.parse(localStorage.getItem('mockNotifications') || '[]');
    notifs.unshift({
      id: Date.now(),
      userId: 'owner',
      message: `Leave Request Cancelled by ${userName}`,
      isRead: false,
      createdAt: new Date().toISOString(),
      type: 'Info'
    });
    localStorage.setItem('mockNotifications', JSON.stringify(notifs));

    loadLeaves();
  };

  const totalLeaves = leaves.length;
  const pendingCount = leaves.filter(l => l.status === 'Pending').length;
  const approvedCount = leaves.filter(l => l.status === 'Approved').length;
  const rejectedCount = leaves.filter(l => l.status === 'Rejected').length;

  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leave Requests</h1>
          <p className="text-gray-500 mt-1">Manage your leaves and track approval status</p>
        </div>
        <button 
          onClick={() => setShowApplyModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md flex items-center gap-2"
        >
          <Send size={20} /> Apply Leave
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { title: 'Total Requests', value: totalLeaves, icon: FileText, color: 'blue' },
          { title: 'Pending', value: pendingCount, icon: Clock, color: 'orange' },
          { title: 'Approved', value: approvedCount, icon: CheckCircle, color: 'green' },
          { title: 'Rejected', value: rejectedCount, icon: XCircle, color: 'red' }
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
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">Leave History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
              <tr>
                <th className="px-6 py-4">Leave ID</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Days</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Owner Remarks</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leaves.length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-8 text-center text-gray-500">No leave requests found</td></tr>
              ) : leaves.map(leave => (
                <tr key={leave.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-semibold text-gray-900">{leave.id}</td>
                  <td className="px-6 py-4 text-gray-600">{leave.type}</td>
                  <td className="px-6 py-4 text-gray-600 text-sm">
                    {leave.startDate} to {leave.endDate}
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">{leave.days}</td>
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
                  <td className="px-6 py-4 text-sm text-gray-600 truncate max-w-[200px]">
                    {leave.remarks || '-'}
                  </td>
                  <td className="px-6 py-4">
                    {leave.status === 'Pending' && (
                      <button 
                        onClick={() => cancelLeave(leave.id)}
                        className="text-red-500 hover:text-red-700 font-bold text-sm"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showApplyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
          >
            <div className="bg-blue-600 p-6 flex justify-between items-center text-white">
              <h2 className="text-xl font-bold flex items-center gap-2"><Calendar /> Apply for Leave</h2>
              <button onClick={() => setShowApplyModal(false)} className="hover:bg-blue-500 p-1 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Employee ID</label>
                  <input type="text" value={userId} disabled className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
                  <input type="text" value={userName} disabled className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600" />
                </div>
              </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Leave Type</label>
                  <input 
                    type="text"
                    list="leaveTypes"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="Select or type a custom leave"
                    required
                  />
                  <datalist id="leaveTypes">
                    <option value="Casual Leave" />
                    <option value="Sick Leave" />
                    <option value="Emergency Leave" />
                    <option value="Personal Leave" />
                    <option value="Other" />
                  </datalist>
                </div>
                <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Start Date</label>
                  <input 
                    type="date" 
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">End Date</label>
                  <input 
                    type="date" 
                    required
                    min={formData.startDate || new Date().toISOString().split('T')[0]}
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" 
                  />
                </div>
              </div>
              {formData.startDate && formData.endDate && (
                <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm font-semibold text-center border border-blue-100">
                  Total Leave Duration: {calculateDays(formData.startDate, formData.endDate)} Days
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Reason</label>
                <textarea 
                  required
                  rows="3"
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900" 
                  placeholder="Please specify your reason for leave..."
                ></textarea>
              </div>
              <div className="pt-4 flex gap-3 border-t">
                <button type="button" onClick={() => setShowApplyModal(false)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors">Submit Request</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default LeaveRequestsPage;
