import React, { useState, useEffect } from 'react';
import { Search, Plus, Shield, X, Save, Trash2, Edit2, Loader } from 'lucide-react';
import api from '../../api';

export default function StaffPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [staffMembers, setStaffMembers] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
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

    const loadStaff = async () => {
        setLoading(true);
        try {
            // Fetch users from backend
            const res = await api.get('/users');
            const users = res.content || res;
            
            // Map users to frontend format and filter out customers and owners
            const mappedStaff = users
                .filter(user => !user.roles || !user.roles.includes('ROLE_CUSTOMER'))
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
                        salary: user.baseSalary != null ? user.baseSalary : 'N/A',
                        status: user.enabled ? 'Active' : 'Inactive'
                    };
                })
                .filter(staff => staff.role !== 'Owner');
                
            setStaffMembers(mappedStaff);
        } catch (error) {
            console.error("Failed to load staff:", error);
            alert("Failed to load staff members. Please ensure the backend is running.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStaff();
    }, []);

    const handleOpenAdd = () => {
        // Auto generate next EMP- ID
        let nextNum = 1;
        staffMembers.forEach(s => {
            const match = s.username.match(/^EMP-0*(\d+)$/);
            if (match) {
                const num = parseInt(match[1]);
                if (num >= nextNum) nextNum = num + 1;
            }
        });
        
        const nextId = 'EMP-' + nextNum.toString().padStart(4, '0');
        setFormData({ 
            name: '', employeeId: nextId, username: nextId, password: 'password123', role: 'Waiter', salary: '', 
            employmentType: 'Full-time', status: 'Active' 
        });
        setEditingStaff(null);
        setShowAddModal(true);
    };

    const handleOpenEdit = (staff) => {
        setFormData({
            name: staff.name,
            employeeId: staff.employeeId,
            username: staff.username,
            password: '',
            role: staff.role,
            salary: staff.salary !== 'N/A' ? staff.salary : '',
            employmentType: 'Full-time', // Defaulting as we aren't fetching this fully
            status: staff.status
        });
        setEditingStaff(staff);
        setShowAddModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.role || !formData.username) return;
        
        setSubmitting(true);
        try {
            if (editingStaff) {
                let backendRole = 'ROLE_OWNER';
                if (formData.role === 'Waiter') backendRole = 'ROLE_WAITER';
                if (formData.role === 'Kitchen') backendRole = 'ROLE_KITCHEN';
                if (formData.role === 'Cashier') backendRole = 'ROLE_CASHIER';

                await api.put(`/users/${editingStaff.id}`, {
                    username: formData.username,
                    fullName: formData.name,
                    role: backendRole,
                    enabled: formData.status === 'Active',
                    baseSalary: formData.salary || 0
                });
                alert('Employee updated successfully!');
                await loadStaff();
            } else {
                // Determine backend role
                let backendRole = 'ROLE_OWNER';
                if (formData.role === 'Waiter') backendRole = 'ROLE_WAITER';
                if (formData.role === 'Kitchen') backendRole = 'ROLE_KITCHEN';
                if (formData.role === 'Cashier') backendRole = 'ROLE_CASHIER';

                // Call /auth/register
                const uniqueMobile = '99' + formData.username.replace('EMP-', '').padStart(8, '0');
                await api.post('/auth/register', {
                    username: formData.username,
                    fullName: formData.name,
                    email: formData.username.toLowerCase() + '@dineflow.local',
                    mobileNumber: uniqueMobile,
                    password: formData.password || 'password123',
                    role: backendRole,
                    baseSalary: formData.salary || 0
                });

                alert('Employee created successfully!');
                await loadStaff();
            }
            setShowAddModal(false);
        } catch (error) {
            console.error("Failed to save employee:", error);
            alert("Failed to save employee: " + (error.response?.data?.message || error.message));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to permanently delete this employee?")) {
            try {
                await api.delete(`/users/${id}`);
                alert("Employee deleted successfully!");
                await loadStaff();
            } catch (error) {
                console.error("Failed to delete employee:", error);
                alert("Failed to delete employee: " + (error.response?.data?.message || error.message));
            }
        }
    };

    const filteredStaff = staffMembers.filter(staff => 
        staff.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        staff.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
                    <p className="text-gray-500">Manage employee accounts and roles directly from the live database.</p>
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
                            {loading ? (
                                <tr><td colSpan="5" className="p-8 text-center text-gray-500"><Loader className="animate-spin inline mr-2" /> Loading staff from backend...</td></tr>
                            ) : filteredStaff.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center text-gray-500">No staff found.</td></tr>
                            ) : (
                                filteredStaff.map(staff => (
                                    <tr key={staff.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-lg border border-blue-200">
                                                    {staff.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">{staff.name}</p>
                                                    <p className="text-xs text-gray-500">{staff.username}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={"inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border " + (
                                                staff.role === 'Owner' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                                staff.role === 'Manager' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                staff.role === 'Cashier' ? 'bg-green-100 text-green-700 border-green-200' :
                                                'bg-gray-100 text-gray-700 border-gray-200'
                                            )}>
                                                {staff.role}
                                            </span>
                                        </td>
                                        <td className="p-4 font-medium text-gray-900">
                                            {staff.salary}
                                        </td>
                                        <td className="p-4">
                                            <span className={"inline-flex items-center space-x-1 " + (staff.status === 'Active' ? 'text-green-600' : 'text-gray-400')}>
                                                <span className={"w-2 h-2 rounded-full " + (staff.status === 'Active' ? 'bg-green-500' : 'bg-gray-300')}></span>
                                                <span className="text-sm font-bold">{staff.status}</span>
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button onClick={() => handleOpenEdit(staff)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                    <Edit2 size={18} />
                                                </button>
                                                <button onClick={() => handleDelete(staff.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900">
                                    {editingStaff ? 'Edit Employee' : 'Add New Employee'}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">This will create a live backend user.</p>
                            </div>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
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
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Username (EmpID)</label>
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
                                        <p className="text-sm font-bold text-blue-900">Default Password: password123</p>
                                        <p className="text-xs text-blue-700">The employee will use this password to log in.</p>
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
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Base Salary (Rs)</label>
                                    <input 
                                        type="number" 
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

                            <div className="pt-4 flex justify-end items-center border-t border-gray-100">
                                <div className="flex space-x-3">
                                    <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition-colors" disabled={submitting}>
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={submitting} className="px-4 py-2 flex items-center gap-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200 transition-colors disabled:opacity-50">
                                        <Save size={18} />
                                        {submitting ? 'Saving...' : (editingStaff ? 'Save Changes' : 'Create Employee')}
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
