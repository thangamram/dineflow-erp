import React, { useState, useEffect } from 'react';
import { Plus, Coffee, Utensils, CheckCircle, Clock, Users, DollarSign, QrCode, Trash2, Edit2, X, User } from 'lucide-react';
import api from '../../api';

export default function TablesPage() {
    const [tables, setTables] = useState([]);
    const [waiters, setWaiters] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showQrModal, setShowQrModal] = useState(null);
    const [newTable, setNewTable] = useState({ number: '', capacity: 4, assignedWaiter: '' });
    const [editingTable, setEditingTable] = useState(null);
    
    // For inline waiter assignment
    const [activeAssignmentMenu, setActiveAssignmentMenu] = useState(null);

    const loadData = async () => {
        try {
            const backendTables = await api.get('/tables');
            const assignments = JSON.parse(localStorage.getItem('tableWaiterAssignments') || '{}');

            // Backend is the source of truth — if it returned a table, it exists.
            // Auto-clean any stale deletedTableIds that still exist on the backend
            const backendIds = (backendTables || []).map(t => String(t.id));
            const deletedIds = (JSON.parse(localStorage.getItem('deletedTableIds') || '[]')).map(String);
            const cleanedDeletedIds = deletedIds.filter(id => !backendIds.includes(id));
            localStorage.setItem('deletedTableIds', JSON.stringify(cleanedDeletedIds));

            const mapped = (backendTables || [])
                .map(t => ({
                    id: t.id,
                    number: t.tableNumber || String(t.id),
                    capacity: t.capacity || t.seats || 4,
                    status: t.status === 'AVAILABLE' ? 'Available' : t.status === 'OCCUPIED' ? 'Customer Dining' : t.status === 'CLEANING' ? 'Needs Cleaning' : 'Available',
                    assignedWaiter: t.assignedWaiter || assignments[t.id] || '',
                    qrToken: t.qrToken || String(t.id)
                }));
            setTables(mapped);
        } catch (err) {
            console.error('Failed to load tables from API:', err);
            const storedTables = localStorage.getItem('mockTables');
            if (storedTables) {
                const parsed = JSON.parse(storedTables);
                const migrated = parsed.map(t => t.qrToken ? t : { ...t, qrToken: String(t.id || Date.now()) });
                setTables(migrated);
            }
        }

        const storedStaff = localStorage.getItem('mockStaff');
        if (storedStaff) {
            const staff = JSON.parse(storedStaff);
            setWaiters(staff.filter(s => s.role === 'Waiter' && s.status === 'Active'));
        } else {
            setWaiters([{ id: 1, name: 'Rahul Sharma', username: 'EMP001', role: 'Waiter', status: 'Active' }]);
        }
    };

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 3000);
        return () => clearInterval(interval);
    }, []);

    const saveTables = (updatedTables) => {
        setTables(updatedTables);
        localStorage.setItem('mockTables', JSON.stringify(updatedTables));
    };

    const handleAddTable = async (e) => {
        e.preventDefault();
        if (!newTable.number.trim()) return;
        
        try {
            const payload = {
                tableNumber: newTable.number,
                capacity: Number(newTable.capacity),
                status: 'AVAILABLE',
                qrToken: String(Date.now())
            };
            await api.post('/tables', payload);
            setShowAddModal(false);
            setNewTable({ number: '', capacity: 4, assignedWaiter: '' });
            loadData();
        } catch (err) {
            console.error('Failed to create table via API:', err);
            const updated = [...tables, { 
                id: Date.now(), 
                number: newTable.number, 
                capacity: newTable.capacity, 
                status: 'Available',
                assignedWaiter: newTable.assignedWaiter,
                qrToken: String(Date.now())
            }];
            saveTables(updated);
            setShowAddModal(false);
            setNewTable({ number: '', capacity: 4, assignedWaiter: '' });
        }
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this table?')) {
            // Immediately hide from UI
            setTables(prev => prev.filter(t => String(t.id) !== String(id)));

            // Persist hidden IDs to survive page refresh
            const deletedIds = (JSON.parse(localStorage.getItem('deletedTableIds') || '[]')).map(String);
            if (!deletedIds.includes(String(id))) {
                deletedIds.push(String(id));
                localStorage.setItem('deletedTableIds', JSON.stringify(deletedIds));
            }

            // Try real delete in background
            try {
                await api.delete(`/tables/${id}`);
            } catch (err) {
                console.warn('Backend table delete skipped (FK constraint):', err?.message);
            }
        }
    };

    const handleMarkAvailable = async (id) => {
        try {
            await api.patch(`/tables/${id}/status?status=AVAILABLE`);
            loadData();
        } catch (err) {
            console.error('Failed to update table status:', err);
            saveTables(tables.map(t => t.id === id ? { ...t, status: 'Available' } : t));
        }
    };
    
    const handleAssignWaiter = async (tableId, waiterUsername) => {
        try {
            // Save to localStorage for immediate local display
            const assignments = JSON.parse(localStorage.getItem('tableWaiterAssignments') || '{}');
            assignments[tableId] = waiterUsername;
            localStorage.setItem('tableWaiterAssignments', JSON.stringify(assignments));

            // Also save to backend database so other devices/portals can read it
            const t = tables.find(tbl => tbl.id === tableId);
            await api.put(`/tables/${tableId}`, {
                tableNumber: t.number,
                capacity: t.capacity,
                status: t.status === 'Available' ? 'AVAILABLE' : t.status === 'Customer Dining' ? 'OCCUPIED' : 'CLEANING',
                assignedWaiter: waiterUsername,
                qrToken: t.qrToken
            });
            setActiveAssignmentMenu(null);
            loadData();
        } catch (err) {
            console.error('Failed to assign waiter:', err);
            setActiveAssignmentMenu(null);
        }
    };

    const handleRegenerateQr = async (tableId) => {
        if (confirm("Are you sure you want to regenerate the QR code for this table? Any old printed QR codes for this table will stop working.")) {
            try {
                const t = tables.find(tbl => tbl.id === tableId);
                const newToken = String(Date.now());
                await api.put(`/tables/${tableId}`, {
                    tableNumber: t.number,
                    capacity: t.capacity,
                    status: t.status === 'Available' ? 'AVAILABLE' : t.status === 'Customer Dining' ? 'OCCUPIED' : 'CLEANING',
                    assignedWaiter: t.assignedWaiter,
                    qrToken: newToken
                });
                alert("QR Code regenerated successfully!");
                loadData();
            } catch (err) {
                console.error('Failed to regenerate QR code:', err);
                const updated = tables.map(t => t.id === tableId ? { ...t, qrToken: String(Date.now()) } : t);
                saveTables(updated);
                alert("QR Code regenerated successfully!");
            }
        }
    };

    const downloadQrCode = async (tableNumber, qrToken) => {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(window.location.origin + '/customer?restaurant=REST-1001&table=' + tableNumber + '&token=' + (qrToken || ''))}`;
        try {
            const response = await fetch(qrUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `table-${tableNumber}-qr.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to download QR code', error);
            window.open(qrUrl, '_blank');
        }
    };

    const downloadAllQRsAsPdf = async () => {
        if (tables.length === 0) return alert("No tables to download!");
        try {
            const { jsPDF } = await import('jspdf');
            const doc = new jsPDF();
            
            for (let i = 0; i < tables.length; i++) {
                const table = tables[i];
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(window.location.origin + '/customer?restaurant=REST-1001&table=' + table.number + '&token=' + (table.qrToken || ''))}`;
                
                const response = await fetch(qrUrl);
                const blob = await response.blob();
                const base64 = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(blob);
                });
                
                if (i > 0) doc.addPage();
                doc.setFontSize(22);
                doc.setTextColor(31, 41, 55);
                doc.text(`Table ${table.number}`, 105, 40, { align: 'center' });
                doc.setFontSize(14);
                doc.setTextColor(107, 114, 128);
                doc.text("Scan to view menu & place order", 105, 50, { align: 'center' });
                doc.addImage(base64, 'PNG', 55, 70, 100, 100);
            }
            doc.save("dineflow-table-qrs.pdf");
        } catch (error) {
            console.error("PDF Generation error", error);
            alert("Error generating PDF: " + error.message);
        }
    };

    const printAllQRs = () => {
        if (tables.length === 0) return alert("No tables to print!");
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Print QR Codes - DineFlow</title>
                    <style>
                        body { font-family: sans-serif; text-align: center; padding: 20px; }
                        .qr-card { page-break-inside: avoid; margin: 20px; border: 2px solid #e5e7eb; padding: 30px; border-radius: 20px; display: inline-block; width: 260px; }
                        h2 { margin: 0 0 5px 0; font-size: 28px; color: #111827; }
                        p { color: #6b7280; margin: 0 0 20px 0; font-size: 14px; }
                        img { width: 200px; height: 200px; }
                    </style>
                </head>
                <body>
                    ${tables.map(t => `
                        <div class="qr-card">
                            <h2>Table ${t.number}</h2>
                            <p>Scan to view menu & order</p>
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(window.location.origin + '/customer?restaurant=REST-1001&table=' + t.number + '&token=' + (t.qrToken || ''))}" />
                        </div>
                    `).join('')}
                    <script>
                        window.onload = function() {
                            window.print();
                            window.close();
                        }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const getStatusColor = (status) => {
        const isAvailable = ['Available', 'Ready', 'Cleaning', 'Completed'].includes(status);
        return isAvailable ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-blue-100 text-blue-700 border-blue-200';
    };

    const getDisplayStatus = (status) => {
        const isAvailable = ['Available', 'Ready', 'Cleaning', 'Completed'].includes(status);
        return isAvailable ? 'Available' : 'Customer Dining';
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Table & QR Management</h1>
                    <p className="text-gray-500">Manage dining tables, QR Codes, and Waiter Assignments</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button 
                        onClick={printAllQRs}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2.5 rounded-lg transition-colors border border-gray-200"
                    >
                        Print All QRs
                    </button>
                    <button 
                        onClick={downloadAllQRsAsPdf}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2.5 rounded-lg transition-colors border border-gray-200"
                    >
                        Download PDF
                    </button>
                    <button 
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-colors font-bold shadow-sm"
                    >
                        <Plus size={20} />
                        <span>Add Table</span>
                    </button>
                </div>
            </div>

            {/* Table Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {tables.map(table => (
                    <div key={table.id} className={`rounded-2xl border p-6 flex flex-col items-center justify-center space-y-3 shadow-sm transition-all hover:shadow-md ${getStatusColor(table.status)} relative`}>
                        <div className="flex justify-between w-full items-start">
                            <span className="text-sm font-black uppercase tracking-wider">Table {table.number}</span>
                            <div className="flex items-center space-x-1">
                                <Users size={14} />
                                <span className="text-xs font-bold">{table.capacity || 4}</span>
                            </div>
                        </div>
                        
                        <div className="py-2">
                            {getDisplayStatus(table.status) === 'Available' ? (
                                <CheckCircle size={40} className="opacity-80" />
                            ) : (
                                <Utensils size={40} className="opacity-80" />
                            )}
                        </div>

                        <div className="text-center w-full">
                            <h3 className="text-lg font-bold">{getDisplayStatus(table.status)}</h3>
                            
                            {/* Waiter Assignment UI */}
                            <div className="mt-3 relative w-full">
                                <button 
                                    onClick={() => setActiveAssignmentMenu(activeAssignmentMenu === table.id ? null : table.id)}
                                    className={`w-full py-1.5 px-2 rounded flex justify-center items-center gap-1.5 text-xs font-bold border transition-colors ${
                                        table.assignedWaiter ? 'bg-white/60 hover:bg-white border-black/10 text-gray-900' : 'bg-white/30 border-dashed border-black/20 text-gray-600 hover:bg-white/50'
                                    }`}
                                >
                                    <User size={12} />
                                    {table.assignedWaiter ? waiters.find(w => w.username === table.assignedWaiter)?.name || table.assignedWaiter : 'Assign Waiter'}
                                </button>
                                
                                {activeAssignmentMenu === table.id && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white shadow-xl border border-gray-100 rounded-lg z-20 max-h-40 overflow-y-auto">
                                        <button 
                                            onClick={() => handleAssignWaiter(table.id, '')}
                                            className="w-full text-left px-3 py-2 text-xs text-gray-500 hover:bg-gray-50 border-b border-gray-50"
                                        >
                                            Unassign Waiter
                                        </button>
                                        {waiters.map(waiter => (
                                            <button 
                                                key={waiter.id}
                                                onClick={() => handleAssignWaiter(table.id, waiter.username)}
                                                className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors ${table.assignedWaiter === waiter.username ? 'bg-blue-50 font-bold text-blue-700' : 'text-gray-700'}`}
                                            >
                                                {waiter.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-black/10 w-full flex justify-center space-x-3 opacity-90">
                            <button onClick={() => setShowQrModal(table.number)} className="p-1.5 bg-white/50 hover:bg-white rounded text-gray-800 transition-colors" title="Generate QR Code">
                                <QrCode size={16} />
                            </button>
                            {(table.status === 'Paid / Needs Cleaning' || table.status === 'Cleaning' || table.status === 'Completed') && (
                                <button onClick={() => handleMarkAvailable(table.id)} className="p-1.5 bg-white/50 hover:bg-white rounded text-gray-800 transition-colors" title="Mark Available">
                                    <CheckCircle size={16} />
                                </button>
                            )}
                            <button onClick={() => handleDelete(table.id)} className="p-1.5 bg-white/50 hover:bg-white rounded text-red-600 transition-colors" title="Delete Table">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Table Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-xl font-bold text-gray-900">Add New Table</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleAddTable} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Table Number/Name</label>
                                <input 
                                    type="text" 
                                    required
                                    value={newTable.number}
                                    onChange={e => setNewTable({...newTable, number: e.target.value})}
                                    className="w-full px-4 py-2 text-gray-900 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g. 10 or A2"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Seating Capacity</label>
                                    <input 
                                        type="number" 
                                        required
                                        min="1"
                                        value={newTable.capacity}
                                        onChange={e => setNewTable({...newTable, capacity: e.target.value})}
                                        className="w-full px-4 py-2 text-gray-900 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Assign Waiter</label>
                                    <select 
                                        value={newTable.assignedWaiter}
                                        onChange={e => setNewTable({...newTable, assignedWaiter: e.target.value})}
                                        className="w-full px-4 py-2 text-gray-900 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    >
                                        <option value="">(None)</option>
                                        {waiters.map(w => (
                                            <option key={w.id} value={w.username}>{w.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end space-x-3">
                                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg">
                                    Cancel
                                </button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200">
                                    Create Table
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* QR Code Modal */}
            {showQrModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl text-center">
                        <div className="p-6 flex flex-col items-center">
                            <h2 className="text-2xl font-black text-gray-900 mb-2">Table {showQrModal}</h2>
                            <p className="text-gray-500 mb-6 text-sm">Scan to open Customer Portal</p>
                            
                            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 inline-block">
                                <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(window.location.origin + '/customer?restaurant=REST-1001&table=' + showQrModal + '&token=' + (tables.find(t => t.number === showQrModal)?.qrToken || ''))}`}
                                    alt={`QR Code for Table ${showQrModal}`}
                                    className="w-48 h-48"
                                />
                            </div>
                            
                            <div className="w-full space-y-3">
                                <button onClick={() => downloadQrCode(showQrModal, tables.find(t => t.number === showQrModal)?.qrToken)} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center justify-center gap-2">
                                    <QrCode size={18} /> Download QR Code
                                </button>
                                <button onClick={() => { handleRegenerateQr(tables.find(t => t.number === showQrModal)?.id); }} className="w-full bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold py-3 rounded-xl border border-orange-200 transition-colors">
                                    Regenerate QR Code
                                </button>
                                <button onClick={() => setShowQrModal(null)} className="w-full bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200">
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
