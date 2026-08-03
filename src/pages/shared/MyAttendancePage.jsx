import React, { useState, useEffect } from 'react';
import { Calendar, UserCheck, UserMinus, Clock, Coffee } from 'lucide-react';

const MyAttendancePage = () => {
  const [attendance, setAttendance] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  
  const userId = localStorage.getItem('employeeId');

  useEffect(() => {
    loadAttendance();
  }, [currentMonth]);

  const loadAttendance = () => {
    const stored = JSON.parse(localStorage.getItem('mockAttendance') || '[]');
    const myRecords = stored.filter(a => a.employeeId === userId && a.date.startsWith(currentMonth));
    setAttendance(myRecords.sort((a, b) => new Date(b.date) - new Date(a.date)));
  };

  const stats = {
    present: attendance.filter(a => a.status === 'Present').length,
    absent: attendance.filter(a => a.status === 'Absent').length,
    halfDay: attendance.filter(a => a.status === 'Half Day').length,
    leave: attendance.filter(a => a.status === 'On Leave').length,
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Attendance</h1>
          <p className="text-gray-500 mt-1">View your attendance records and monthly summary</p>
        </div>
        <input 
          type="month" 
          value={currentMonth}
          onChange={(e) => setCurrentMonth(e.target.value)}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { title: 'Present', value: stats.present, icon: UserCheck, color: 'green' },
          { title: 'Absent', value: stats.absent, icon: UserMinus, color: 'red' },
          { title: 'Half Day', value: stats.halfDay, icon: Clock, color: 'orange' },
          { title: 'On Leave', value: stats.leave, icon: Coffee, color: 'blue' }
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`p-4 rounded-xl bg-${stat.color}-50 text-${stat.color}-600`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm font-semibold">{stat.title} Days</p>
              <h3 className="text-2xl font-black text-gray-900">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Attendance Log ({currentMonth})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Remarks</th>
                <th className="px-6 py-4">Marked At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {attendance.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500">No attendance records found for this month</td></tr>
              ) : attendance.map(record => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-bold text-gray-900">{record.date}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      record.status === 'Present' ? 'bg-green-100 text-green-700' :
                      record.status === 'Absent' ? 'bg-red-100 text-red-700' :
                      record.status === 'Half Day' ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{record.remarks || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(record.markedAt).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MyAttendancePage;
