import React, { useState, useEffect } from 'react';
import { Calendar, UserCheck, Search, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../api';

const AttendanceManagement = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [staff, setStaff] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    try {
      const activeRes = await api.get('/employees/active');
      const staffList = (activeRes || []).map(u => ({
        id: u.id,
        employeeId: u.username,
        name: u.fullName || u.username,
        role: u.designation === 'ROLE_WAITER' ? 'Waiter' : 
              u.designation === 'ROLE_KITCHEN' ? 'Kitchen' : 'Staff',
        status: 'Active'
      }));
      setStaff(staffList);
      
      const attendanceRes = await api.get(`/employees/attendance/date/${selectedDate}`);
      const attendanceData = attendanceRes || [];
      const mappedAttendance = attendanceData.map(a => ({
        id: a.id,
        date: a.attendanceDate,
        employeeId: a.employeeName, // Temporary map if needed, but we should match by employeeId
        realEmployeeId: a.employeeId,
        name: a.employeeName,
        status: a.status === 'PRESENT' ? 'Present' : a.status === 'ABSENT' ? 'Absent' : a.status === 'HALF_DAY' ? 'Half Day' : 'On Leave',
      }));
      setAttendance(mappedAttendance);
    } catch (err) {
      console.error('Failed to load data:', err);
      setStaff([]);
      setAttendance([]);
    }
  };

  const getAttendanceForEmployee = (realEmployeeId) => {
    return attendance.find(a => a.realEmployeeId === realEmployeeId) || null;
  };

  const handleMarkAttendance = async (employee, status, remarks) => {
    let backendStatus = 'PRESENT';
    if (status === 'Absent') backendStatus = 'ABSENT';
    if (status === 'Half Day') backendStatus = 'HALF_DAY';
    if (status === 'On Leave') backendStatus = 'ON_LEAVE';

    try {
      await api.post('/employees/attendance', {
        employeeId: employee.id,
        attendanceDate: selectedDate,
        status: backendStatus,
        checkInTime: status === 'Present' ? new Date().toISOString() : null
      });
      loadData();
    } catch (err) {
      console.error('Failed to mark attendance:', err);
      alert('Failed to mark attendance.');
    }
  };

  const filteredStaff = staff.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    present: attendance.filter(a => a.status === 'Present').length,
    absent: attendance.filter(a => a.status === 'Absent').length,
    halfDay: attendance.filter(a => a.status === 'Half Day').length,
    leave: attendance.filter(a => a.status === 'On Leave').length,
    unmarked: Math.max(0, staff.length - attendance.length)
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
          <p className="text-gray-500 mt-1">Mark daily attendance and track employee presence</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
          <Calendar className="text-gray-400 ml-2" />
          <input 
            type="date"
            value={selectedDate}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 bg-transparent outline-none font-bold text-gray-700"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Unmarked', value: stats.unmarked, color: 'gray' },
          { label: 'Present', value: stats.present, color: 'green' },
          { label: 'Absent', value: stats.absent, color: 'red' },
          { label: 'Half Day', value: stats.halfDay, color: 'orange' },
          { label: 'On Leave', value: stats.leave, color: 'blue' }
        ].map((stat, i) => (
          <div key={i} className={`bg-white rounded-2xl p-4 shadow-sm border-b-4 border-${stat.color}-500 flex flex-col items-center justify-center`}>
            <h3 className={`text-3xl font-black text-${stat.color}-600 mb-1`}>{stat.value}</h3>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-4 bg-gray-50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Search by Employee ID or Name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white border-b border-gray-100 text-gray-500 text-xs uppercase font-bold">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Remarks</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStaff.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No active employees found</td></tr>
              ) : filteredStaff.map(emp => {
                const record = getAttendanceForEmployee(emp.id);
                const currentStatus = record ? record.status : '';
                return (
                  <tr key={emp.employeeId} className={`hover:bg-gray-50 transition-colors ${!record ? 'bg-orange-50/30' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{emp.name}</div>
                      <div className="text-xs text-gray-500">{emp.employeeId}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-medium">{emp.role}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {['Present', 'Absent', 'Half Day', 'On Leave'].map(st => (
                          <button
                            key={st}
                            onClick={() => handleMarkAttendance(emp, st, record?.remarks || '')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              currentStatus === st 
                                ? (st === 'Present' ? 'bg-green-600 text-white shadow-md' : 
                                   st === 'Absent' ? 'bg-red-600 text-white shadow-md' : 
                                   st === 'Half Day' ? 'bg-orange-500 text-white shadow-md' : 
                                   'bg-blue-600 text-white shadow-md')
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <input 
                        type="text"
                        placeholder="Optional remarks..."
                        value={record?.remarks || ''}
                        onChange={(e) => handleMarkAttendance(emp, currentStatus || 'Present', e.target.value)}
                        className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-colors"
                      />
                    </td>
                    <td className="px-6 py-4 text-center text-sm">
                      {record ? (
                        <span className="text-green-600 font-bold flex items-center justify-center gap-1">
                          <UserCheck size={16} /> Saved
                        </span>
                      ) : (
                        <span className="text-orange-500 font-semibold italic">Unmarked</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceManagement;
