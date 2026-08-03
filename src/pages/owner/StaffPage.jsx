import React, { useState, useEffect } from 'react';
import { Search, Plus, UserCheck, Shield, X, Save, Trash2, Edit2 } from 'lucide-react';

export default function StaffPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [staffMembers, setStaffMembers] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        employeeId: '',
        username: '',
        password: '',
        role: 'Waiter',
        salary: '',
        employmentType: 'Full-time',
        status: 'Active'
    });

    const loadStaff = () => {
        const stored = localStorage.getItem('mockStaff');
        if (stored) {
            setStaffMembers(JSON.parse(stored));
        } else {
            setStaffMembers([]);
        }
    };

    useEffect(() => {
        loadStaff();
    }, []);

    const saveStaff = (updatedStaff) => {
        setStaffMembers(updatedStaff);
        localStorage.setItem('mockStaff', JSON.stringify(updatedStaff));
    };

    const handleOpenAdd = () => {
        const nextId = `EMP-${(staffMembers.length + 1).toString().padStart(4, '0')}`;
        setFormData({ 
            name: '', employeeId: nextId, username: nextId, password: 'Temp@123', role: 'Waiter', salary: '', 
            employmentType: 'Full-time', status: 'Active' 
        });
        setEditingStaff(null);
        setShowAddModal(true);
    };

    const handleOpenEdit = (staff) => {
        setFormData(staff);
        setEditingStaff(staff.id);
        setShowAddModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name || !formData.role || !formData.username) return;
        
        if (editingStaff) {
            const updated = staffMembers.map(s => s.id === editingStaff ? { ...s, ...formData } : s);
            saveStaff(updated);
        } else {
            const newStaff = { ...formData, id: Date.now(), forcePasswordChange: true };
            const updated = [...staffMembers, newStaff];
            saveStaff(updated);
            
            const auditLogs = JSON.parse(localStorage.getItem('mockAuditLogs') || '[]');
            auditLogs.unshift({
                id: Date.now(), timestamp: new Date().toISOString(), action: 'Account Created',
                user: formData.username, role: formData.role, details: `Created by Owner`
            });
            localStorage.setItem('mockAuditLogs', JSON.stringify(auditLogs));
        }
        setShowAddModal(false);
    };

    const handleResetPassword = () => {
        if (confirm("Are you sure you want to reset this employee's password to Temp@123?")) {
            const updated = staffMembers.map(s => s.id === editingStaff ? { ...s, password: 'Temp@123', forcePasswordChange: true } : s);
            saveStaff(updated);
            
            const auditLogs = JSON.parse(localStorage.getItem('mockAuditLogs') || '[]');
            auditLogs.unshift({
                id: Date.now(), timestamp: new Date().toISOString(), action: 'Password Reset',
                user: formData.username, role: formData.role, details: `Password reset to Temp@123 by Owner`
            });
            localStorage.setItem('mockAuditLogs', JSON.stringify(auditLogs));
            
            alert('Password reset successfully to Temp@123');
            setShowAddModal(false);
        }
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to remove this employee?')) {
            saveStaff(staffMembers.filter(s => s.id !== id));
        }
    };

    const filteredStaff = staffMembers.filter(staff => 
        staff.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        staff.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
                    <p className="text-gray-500">Manage employee accounts, roles, and payroll settings</p>
                </div>
                <button onClick={handleOpenAdd} className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-colors font-bold shadow-sm">
                    <Plus size={20} />
                    <span>Add Employee</span>
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div className="relative w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search staff..." 
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
                                <th className="p-4 font-bold">Employee</th>
                                <th className="p-4 font-bold">Role</th>
                                <th className="p-4 font-bold">Base Salary</th>
                                <th className="p-4 font-bold">Status</th>
                                <th className="p-4 font-bold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredStaff.map(staff => (
                                <tr key={staff.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-lg border border-blue-200">
                                                {staff.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900">{staff.name}</div>
                                                <div className="text-xs text-gray-500 font-medium">@{staff.username}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="flex items-center space-x-1.5 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg w-max border border-gray-200 text-sm font-semibold">
                                            <Shield size={14} className="text-blue-500" />
                                            <span>{staff.role}</span>
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-900 font-bold">
                                        ₹{parseFloat(staff.salary || 0).toLocaleString()} / mo
                                    </td>
                                    <td className="p-4">
                                        <span className={`flex items-center space-x-1.5 text-sm font-bold ${staff.status === 'Active' ? 'text-emerald-600' : 'text-gray-500'}`}>
                                            <span className={`h-2 w-2 rounded-full ${staff.status === 'Active' ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                                            <span>{staff.status}</span>
                                        </span>
                                    </td>
                                    <td className="p-4 text-right space-x-2">
                                        <button onClick={() => handleOpenEdit(staff)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors" title="Edit">
                                            <Edit2 size={18} />
                                        </button>
                                        <button onClick={() => handleDelete(staff.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors" title="Delete">
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredStaff.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-500 font-medium">No employees found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-xl font-bold text-gray-900">{editingStaff ? 'Edit Employee' : 'Add New Employee'}</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                                <input 
                                    type="text" 
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Employee ID</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={formData.employeeId}
                                        onChange={e => setFormData({...formData, employeeId: e.target.value})}
                                        className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                                        readOnly={!!editingStaff}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Username</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={formData.username}
                                        onChange={e => setFormData({...formData, username: e.target.value})}
                                        className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                                        readOnly={!!editingStaff}
                                    />
                                </div>
                            </div>

                            {!editingStaff && (
                                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-start gap-3">
                                    <Shield size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-bold text-blue-900">Temporary Password: Temp@123</p>
                                        <p className="text-xs text-blue-700">The employee will be forced to change this upon first login.</p>
                                    </div>
                                </div>
                            )}
                            
                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Role</label>
                                    <select 
                                        value={formData.role}
                                        onChange={e => setFormData({...formData, role: e.target.value})}
                                        className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    >
                                        <option value="Waiter">Waiter</option>
                                        <option value="Kitchen">Kitchen Staff</option>
                                        <option value="Cashier">Cashier</option>
                                        <option value="Manager">Manager</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Employment Type</label>
                                    <select 
                                        value={formData.employmentType}
                                        onChange={e => setFormData({...formData, employmentType: e.target.value})}
                                        className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    >
                                        <option value="Full-time">Full-time</option>
                                        <option value="Part-time">Part-time</option>
                                        <option value="Contract">Contract</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Base Salary (₹)</label>
                                    <input 
                                        type="number" 
                                        required
                                        min="0"
                                        value={formData.salary}
                                        onChange={e => setFormData({...formData, salary: e.target.value})}
                                        className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                                    <select 
                                        value={formData.status}
                                        onChange={e => setFormData({...formData, status: e.target.value})}
                                        className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-between items-center border-t border-gray-100">
                                <div>
                                    {editingStaff && (
                                        <button type="button" onClick={handleResetPassword} className="px-4 py-2 text-orange-600 font-bold hover:bg-orange-50 rounded-lg transition-colors border border-orange-200">
                                            Reset Password
                                        </button>
                                    )}
                                </div>
                                <div className="flex space-x-3">
                                    <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition-colors">
                                        Cancel
                                    </button>
                                    <button type="submit" className="px-4 py-2 flex items-center gap-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200 transition-colors">
                                        <Save size={18} />
                                        {editingStaff ? 'Save Changes' : 'Create Employee'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
