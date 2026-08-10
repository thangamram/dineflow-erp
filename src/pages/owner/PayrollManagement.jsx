import React, { useState, useEffect } from 'react';
import { 
    Banknote, Plus, Search, CheckCircle, FileText, Download, 
    Trash2, Edit, AlertCircle, Calendar, Users, Briefcase
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import api from '../../api';

export default function PayrollManagement() {
    const [payrolls, setPayrolls] = useState([]);
    const [staff, setStaff] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    
    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [attendanceStats, setAttendanceStats] = useState(null);
    
    // Form state
    const [formData, setFormData] = useState({
        employeeId: '',
        period: '',
        basicSalary: 0,
        allowances: 0,
        overtimeHours: 0,
        overtimeRate: 0,
        bonus: 0,
        deductions: 0,
        status: 'Draft'
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const res = await api.get('/users');
            const users = res.content || res.data?.content || res;
            
            // Ensure users is an array
            const usersArray = Array.isArray(users) ? users : [];
            
            const mappedStaff = usersArray
                .filter(user => !user.roles || (!user.roles.includes('ROLE_CUSTOMER') && !user.roles.includes('ROLE_ADMIN')))
                .map(user => {
                    let roleName = 'Owner';
                    if (user.roles && user.roles.length > 0) {
                        const roleCode = user.roles[0];
                        if (roleCode === 'ROLE_WAITER') roleName = 'Waiter';
                        else if (roleCode === 'ROLE_KITCHEN') roleName = 'Kitchen';
                        else if (roleCode === 'ROLE_CASHIER') roleName = 'Cashier';
                        else if (roleCode === 'ROLE_ADMIN') roleName = 'Owner';
                    }
                    
                    return {
                        id: user.id,
                        employeeId: user.username,
                        username: user.username,
                        name: user.fullName || user.username,
                        role: roleName,
                        salary: user.baseSalary != null ? user.baseSalary : 0,
                        status: user.enabled ? 'Active' : 'Inactive'
                    };
                });
            
            setStaff(mappedStaff);

            const storedPayroll = localStorage.getItem('mockPayroll');
            if (storedPayroll) {
                const allPayrolls = JSON.parse(storedPayroll);
                // Auto-clean: remove payroll records where the employee no longer exists
                const validPayrolls = allPayrolls.filter(p => {
                    const empExists = mappedStaff.some(
                        s => String(s.id) === String(p.employeeId) || String(s.employeeId) === String(p.employeeId)
                    );
                    return empExists;
                });
                // If we cleaned some out, persist the cleaned list
                if (validPayrolls.length !== allPayrolls.length) {
                    localStorage.setItem('mockPayroll', JSON.stringify(validPayrolls));
                }
                setPayrolls(validPayrolls);
            } else {
                setPayrolls([]);
            }
        } catch (error) {
            console.error("Failed to load staff for payroll:", error);
            alert("Failed to load staff members. Please ensure the backend is running.");
        } finally {
            setLoading(false);
        }
    };

    const savePayrolls = (updated) => {
        setPayrolls(updated);
        localStorage.setItem('mockPayroll', JSON.stringify(updated));
    };

    const addLog = (action, target) => {
        const newLog = {
            id: Date.now(),
            date: new Date().toLocaleString(),
            action,
            target,
            user: 'Owner'
        };
        const stored = JSON.parse(localStorage.getItem('mockPayrollLogs') || '[]');
        localStorage.setItem('mockPayrollLogs', JSON.stringify([newLog, ...stored]));
    };

    // Derived values
    const selectedStaff = staff.find(s => String(s.id) === String(formData.employeeId) || String(s.employeeId) === String(formData.employeeId));
    const overtimePay = (parseFloat(formData.overtimeHours) || 0) * (parseFloat(formData.overtimeRate) || 0);
    const netSalary = (parseFloat(formData.basicSalary) || 0) + 
                      (parseFloat(formData.allowances) || 0) + 
                      overtimePay + 
                      (parseFloat(formData.bonus) || 0) - 
                      (parseFloat(formData.deductions) || 0);

    const handleEmployeeSelect = (id) => {
        const employee = staff.find(s => String(s.id) === String(id) || String(s.employeeId) === String(id));
        const baseSalary = employee ? parseFloat(employee.salary) || 0 : 0;
        
        let autoDeduction = 0;
        let stats = null;

        if (employee) {
            const allAttendance = JSON.parse(localStorage.getItem('mockAttendance') || '[]');
            const empAttendance = allAttendance.filter(a => a.employeeId === employee.employeeId);
            
            const absentCount = empAttendance.filter(a => a.status === 'Absent').length;
            const halfDayCount = empAttendance.filter(a => a.status === 'Half Day').length;
            const presentCount = empAttendance.filter(a => a.status === 'Present').length;
            const leaveCount = empAttendance.filter(a => a.status === 'On Leave').length;
            
            const dailyRate = baseSalary / 30;
            autoDeduction = (absentCount * dailyRate) + (halfDayCount * 0.5 * dailyRate);
            
            stats = {
                present: presentCount,
                absent: absentCount,
                halfDay: halfDayCount,
                leave: leaveCount
            };
        }
        
        setAttendanceStats(stats);
        
        setFormData({
            ...formData,
            employeeId: id,
            basicSalary: baseSalary,
            deductions: Math.round(autoDeduction)
        });
    };

    const openCreateModal = () => {
        const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
        setFormData({
            employeeId: '', period: currentMonth, basicSalary: 0, allowances: 0,
            overtimeHours: 0, overtimeRate: 0, bonus: 0, deductions: 0, status: 'Draft'
        });
        setEditingId(null);
        setAttendanceStats(null);
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.employeeId || !formData.period) return;
        
        const finalNetSalary = netSalary;
        
        if (editingId) {
            const updated = payrolls.map(p => p.id === editingId ? { ...p, ...formData, netSalary: finalNetSalary } : p);
            savePayrolls(updated);
            addLog('Updated Payroll', `${selectedStaff?.name} - ${formData.period}`);
        } else {
            const newPayroll = {
                ...formData,
                id: `PRL-${Date.now()}`,
                netSalary: finalNetSalary,
                generatedAt: new Date().toISOString()
            };
            savePayrolls([newPayroll, ...payrolls]);
            addLog('Generated Payroll', `${selectedStaff?.name} - ${formData.period}`);
        }
        setShowModal(false);
    };

    const updateStatus = (id, newStatus) => {
        const updated = payrolls.map(p => p.id === id ? { 
            ...p, 
            status: newStatus,
            paidAt: newStatus === 'Paid' ? new Date().toISOString() : p.paidAt 
        } : p);
        savePayrolls(updated);
        
        const targetPayroll = payrolls.find(p => p.id === id);
        const emp = staff.find(s => String(s.id) === String(targetPayroll.employeeId) || String(s.employeeId) === String(targetPayroll.employeeId));
        addLog(`Marked as ${newStatus}`, `${emp?.name} - ${targetPayroll?.period}`);
    };

    const deletePayroll = (id) => {
        if(confirm('Are you sure you want to delete this draft payroll?')) {
            const targetPayroll = payrolls.find(p => p.id === id);
            const emp = staff.find(s => String(s.id) === String(targetPayroll.employeeId) || String(s.employeeId) === String(targetPayroll.employeeId));
            savePayrolls(payrolls.filter(p => p.id !== id));
            addLog('Deleted Payroll', `${emp?.name} - ${targetPayroll?.period}`);
        }
    };

    const generatePayslipPDF = (payroll) => {
        const emp = staff.find(s => String(s.id) === String(payroll.employeeId) || String(s.employeeId) === String(payroll.employeeId));
        const doc = new jsPDF();
        
        doc.setFontSize(22);
        doc.setTextColor(31, 41, 55);
        doc.text("DineFlow ERP - Official Payslip", 105, 20, { align: "center" });
        
        doc.setFontSize(12);
        doc.text(`Salary Period: ${payroll.period}`, 105, 28, { align: "center" });
        
        doc.line(14, 35, 196, 35);
        
        doc.setFontSize(11);
        doc.text("Employee Details", 14, 45);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Name: ${emp?.name || 'N/A'}`, 14, 52);
        doc.text(`Role: ${emp?.role || 'N/A'}`, 14, 58);
        doc.text(`Employment: ${emp?.employmentType || 'N/A'}`, 14, 64);
        
        doc.text("Employee Info", 120, 45);
        doc.text(`Username: ${emp?.username || 'N/A'}`, 120, 52);
        
        const tableData = [
            ['Basic Salary', `Rs. ${payroll.basicSalary}`],
            ['Allowances', `Rs. ${payroll.allowances}`],
            ['Overtime Pay', `Rs. ${payroll.overtimeHours * payroll.overtimeRate}`],
            ['Bonuses & Incentives', `Rs. ${payroll.bonus}`],
            ['Deductions', `- Rs. ${payroll.deductions}`],
            ['Net Salary', `Rs. ${payroll.netSalary}`]
        ];

        if (typeof doc.autoTable === 'function') {
            doc.autoTable({
                startY: 75,
                head: [['Earnings / Deductions', 'Amount']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [59, 130, 246] },
                willDrawCell: function(data) {
                    if (data.row.index === 5 && data.section === 'body') {
                        doc.setFont(undefined, 'bold');
                    }
                }
            });
            
            const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 150;
            doc.text(`Status: ${payroll.status}`, 14, finalY + 15);
            if (payroll.paidAt) doc.text(`Paid On: ${new Date(payroll.paidAt).toLocaleDateString()}`, 14, finalY + 22);
            
            doc.save(`Payslip_${emp?.name}_${payroll.period}.pdf`);
        } else {
            import('jspdf-autotable').then((module) => {
                const autoTable = module.default || module;
                autoTable(doc, {
                    startY: 75,
                    head: [['Earnings / Deductions', 'Amount']],
                    body: tableData,
                    theme: 'grid',
                    headStyles: { fillColor: [59, 130, 246] }
                });
                const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 150;
                doc.text(`Status: ${payroll.status}`, 14, finalY + 15);
                if (payroll.paidAt) doc.text(`Paid On: ${new Date(payroll.paidAt).toLocaleDateString()}`, 14, finalY + 22);
                doc.save(`Payslip_${emp?.name}_${payroll.period}.pdf`);
            });
            return;
        }
    };

    // KPIs
    const totalStaff = staff.length;
    const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    const currentMonthPayrolls = payrolls.filter(p => p.period === currentMonth);
    const totalExpense = currentMonthPayrolls.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.netSalary, 0);
    const pendingCount = currentMonthPayrolls.filter(p => p.status === 'Draft' || p.status === 'Pending Approval').length;
    const approvedCount = currentMonthPayrolls.filter(p => p.status === 'Approved').length;
    const paidCount = currentMonthPayrolls.filter(p => p.status === 'Paid').length;

    const filteredPayrolls = payrolls.filter(p => {
        const emp = staff.find(s => String(s.id) === String(p.employeeId) || String(s.employeeId) === String(p.employeeId));
        return emp?.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.period.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Payroll Management</h1>
                    <p className="text-gray-500 font-medium mt-1">Manage employee salaries, bonuses, and payslips</p>
                </div>
                <button onClick={openCreateModal} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-md shadow-blue-200 flex items-center gap-2">
                    <Plus size={18} /> Generate Payroll
                </button>
            </div>

            {/* KPI Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-gray-500 font-medium text-sm">Total Salary Expense</h3>
                            <p className="text-3xl font-black text-gray-900 mt-1">₹{totalExpense}</p>
                        </div>
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600"><Banknote size={20}/></div>
                    </div>
                    <p className="text-sm text-gray-400 mt-4">For {currentMonth}</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-gray-500 font-medium text-sm">Pending Approval</h3>
                            <p className="text-3xl font-black text-gray-900 mt-1">{pendingCount}</p>
                        </div>
                        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600"><AlertCircle size={20}/></div>
                    </div>
                    <p className="text-sm text-gray-400 mt-4">Draft or Waiting</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-gray-500 font-medium text-sm">Approved (Unpaid)</h3>
                            <p className="text-3xl font-black text-gray-900 mt-1">{approvedCount}</p>
                        </div>
                        <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center text-yellow-600"><CheckCircle size={20}/></div>
                    </div>
                    <p className="text-sm text-gray-400 mt-4">Ready to be Paid</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-gray-500 font-medium text-sm">Paid Payrolls</h3>
                            <p className="text-3xl font-black text-gray-900 mt-1">{paidCount}</p>
                        </div>
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600"><Banknote size={20}/></div>
                    </div>
                    <p className="text-sm text-gray-400 mt-4">Successfully distributed</p>
                </div>
            </div>

            {/* Search and Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div className="relative w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input type="text" placeholder="Search by name or period..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 text-gray-900 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white text-gray-500 text-sm border-b border-gray-200">
                                <th className="p-4 font-bold">Employee</th>
                                <th className="p-4 font-bold">Period</th>
                                <th className="p-4 font-bold">Net Salary</th>
                                <th className="p-4 font-bold">Status</th>
                                <th className="p-4 font-bold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredPayrolls.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center text-gray-400 font-medium">No payroll records found.</td></tr>
                            ) : filteredPayrolls.map(payroll => {
                                const emp = staff.find(s => String(s.id) === String(payroll.employeeId) || String(s.employeeId) === String(payroll.employeeId));
                                return (
                                    <tr key={payroll.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4">
                                            <p className="font-bold text-gray-900">{emp?.name || 'Unknown'}</p>
                                            <p className="text-xs text-gray-500 font-medium">{emp?.role}</p>
                                        </td>
                                        <td className="p-4 text-gray-600 font-medium">{payroll.period}</td>
                                        <td className="p-4 font-black text-gray-900">₹{payroll.netSalary}</td>
                                        <td className="p-4">
                                            <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wide ${
                                                payroll.status === 'Paid' ? 'bg-green-100 text-green-700' :
                                                payroll.status === 'Approved' ? 'bg-blue-100 text-blue-700' :
                                                payroll.status === 'Pending Approval' ? 'bg-orange-100 text-orange-700' :
                                                'bg-gray-100 text-gray-600'
                                            }`}>
                                                {payroll.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right space-x-2">
                                            <button onClick={() => generatePayslipPDF(payroll)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Download Payslip">
                                                <Download size={18} />
                                            </button>
                                            
                                            {payroll.status === 'Draft' && (
                                                <>
                                                    <button onClick={() => { setFormData(payroll); setEditingId(payroll.id); setShowModal(true); }} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                                                        <Edit size={18} />
                                                    </button>
                                                    <button onClick={() => updateStatus(payroll.id, 'Pending Approval')} className="px-3 py-1.5 bg-orange-100 text-orange-700 hover:bg-orange-200 text-xs font-bold rounded-lg transition-colors">
                                                        Submit
                                                    </button>
                                                    <button onClick={() => deletePayroll(payroll.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </>
                                            )}
                                            
                                            {payroll.status === 'Pending Approval' && (
                                                <button onClick={() => updateStatus(payroll.id, 'Approved')} className="px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs font-bold rounded-lg transition-colors">
                                                    Approve
                                                </button>
                                            )}
                                            
                                            {payroll.status === 'Approved' && (
                                                <button onClick={() => updateStatus(payroll.id, 'Paid')} className="px-3 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 text-xs font-bold rounded-lg transition-colors">
                                                    Mark Paid
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
                        <div className="bg-blue-600 p-5 text-white flex justify-between items-center">
                            <h2 className="text-xl font-bold">{editingId ? 'Edit Payroll' : 'Generate Payroll'}</h2>
                            <button onClick={() => setShowModal(false)} className="hover:bg-blue-500 p-1 rounded-lg transition-colors">
                                <Plus className="rotate-45" size={24} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Employee</label>
                                    <select 
                                        required
                                        disabled={!!editingId}
                                        value={formData.employeeId}
                                        onChange={(e) => handleEmployeeSelect(e.target.value)}
                                        className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                                    >
                                        <option value="">Select Employee</option>
                                        {staff.map(s => <option key={s.id} value={s.id}>{s.name} - {s.role}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Period (Month/Year)</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={formData.period}
                                        onChange={(e) => setFormData({...formData, period: e.target.value})}
                                        className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="e.g. August 2026"
                                    />
                                </div>
                            </div>

                            {attendanceStats && (
                                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                    <h3 className="text-sm font-bold text-blue-900 mb-3">Attendance Summary (Current Month)</h3>
                                    <div className="grid grid-cols-4 gap-2">
                                        <div className="bg-white p-2 rounded-lg text-center shadow-sm">
                                            <p className="text-xs text-gray-500 font-bold uppercase">Present</p>
                                            <p className="font-black text-green-600">{attendanceStats.present}</p>
                                        </div>
                                        <div className="bg-white p-2 rounded-lg text-center shadow-sm">
                                            <p className="text-xs text-gray-500 font-bold uppercase">Absent</p>
                                            <p className="font-black text-red-600">{attendanceStats.absent}</p>
                                        </div>
                                        <div className="bg-white p-2 rounded-lg text-center shadow-sm">
                                            <p className="text-xs text-gray-500 font-bold uppercase">Half Day</p>
                                            <p className="font-black text-orange-500">{attendanceStats.halfDay}</p>
                                        </div>
                                        <div className="bg-white p-2 rounded-lg text-center shadow-sm">
                                            <p className="text-xs text-gray-500 font-bold uppercase">On Leave</p>
                                            <p className="font-black text-blue-600">{attendanceStats.leave}</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-blue-800 mt-2 text-center italic">
                                        * Deductions are auto-calculated based on Absent and Half-Day count.
                                    </p>
                                </div>
                            )}
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Basic Salary (₹)</label>
                                    <input 
                                        type="number" 
                                        required min="0"
                                        value={formData.basicSalary}
                                        onChange={(e) => setFormData({...formData, basicSalary: e.target.value})}
                                        className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Allowances (₹)</label>
                                    <input 
                                        type="number" 
                                        min="0"
                                        value={formData.allowances}
                                        onChange={(e) => setFormData({...formData, allowances: e.target.value})}
                                        className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                            
                            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                                <h4 className="font-bold text-blue-800 mb-3 text-sm flex items-center gap-2"><Briefcase size={16}/> Overtime</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-blue-700 mb-1">OT Hours</label>
                                        <input 
                                            type="number" 
                                            min="0"
                                            value={formData.overtimeHours}
                                            onChange={(e) => setFormData({...formData, overtimeHours: e.target.value})}
                                            className="w-full px-4 py-2 text-gray-900 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-blue-700 mb-1">OT Rate (₹/Hr)</label>
                                        <input 
                                            type="number" 
                                            min="0"
                                            value={formData.overtimeRate}
                                            onChange={(e) => setFormData({...formData, overtimeRate: e.target.value})}
                                            className="w-full px-4 py-2 text-gray-900 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                        />
                                    </div>
                                </div>
                                <div className="mt-2 text-right">
                                    <span className="text-sm font-semibold text-blue-800">Total OT Pay: ₹{overtimePay}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-green-700 mb-1 flex items-center gap-1"><Plus size={14}/> Bonuses / Incentives (₹)</label>
                                    <input 
                                        type="number" 
                                        min="0"
                                        value={formData.bonus}
                                        onChange={(e) => setFormData({...formData, bonus: e.target.value})}
                                        className="w-full px-4 py-2 text-gray-900 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-red-700 mb-1 flex items-center gap-1"><Trash2 size={14}/> Deductions (₹)</label>
                                    <input 
                                        type="number" 
                                        min="0"
                                        value={formData.deductions}
                                        onChange={(e) => setFormData({...formData, deductions: e.target.value})}
                                        className="w-full px-4 py-2 text-gray-900 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="bg-gray-900 rounded-xl p-5 flex justify-between items-center text-white">
                                <span className="font-bold text-lg">Net Salary</span>
                                <span className="font-black text-2xl tracking-wider">₹{netSalary}</span>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md shadow-blue-200 transition-colors">
                                    {editingId ? 'Save Payroll' : 'Generate Payroll'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
