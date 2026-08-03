import React, { useState, useEffect } from 'react';
import { Package, TrendingDown, Plus, Edit2, Trash2, History, AlertTriangle, Search, Filter, ShoppingCart, Truck, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProcurementPage() {
    const [activeTab, setActiveTab] = useState('vendors'); // overview, stock, vendors, logs
    const [inventory, setInventory] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [logs, setLogs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modals
    const [showStockModal, setShowStockModal] = useState(false);
    const [showVendorModal, setShowVendorModal] = useState(false);
    
    // Form States
    const [editingItem, setEditingItem] = useState(null);
    const [stockForm, setStockForm] = useState({
        name: '', variety: '', category: 'Grains', unit: 'g', minStock: '', stock: '', price: '', vendorId: ''
    });

    const [vendorForm, setVendorForm] = useState({
        name: '', contact: '', phone: '', email: '', gst: ''
    });

    // Initialize mock data
    const loadData = () => {
        const storedInv = localStorage.getItem('mockInventory');
        const storedVendors = localStorage.getItem('mockVendors');
        const storedLogs = localStorage.getItem('mockInventoryLogs');

        if (storedVendors) {
            setVendors(JSON.parse(storedVendors));
        } else {
            setVendors([]);
        }

        if (storedInv) {
            setInventory(JSON.parse(storedInv));
        } else {
            setInventory([]);
        }

        if (storedLogs) {
            setLogs(JSON.parse(storedLogs));
        } else {
            setLogs([]);
        }
    };

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 3000);
        return () => clearInterval(interval);
    }, []);

    const saveInventory = (newInv) => {
        setInventory(newInv);
        localStorage.setItem('mockInventory', JSON.stringify(newInv));
    };

    const saveVendors = (newVen) => {
        setVendors(newVen);
        localStorage.setItem('mockVendors', JSON.stringify(newVen));
    };

    const addLog = (action, ingredient, qty, user = 'Owner') => {
        const newLog = {
            id: Date.now(),
            date: new Date().toLocaleString(),
            action,
            ingredient,
            qty,
            user
        };
        const storedLogs = JSON.parse(localStorage.getItem('mockInventoryLogs') || '[]');
        const updatedLogs = [newLog, ...storedLogs];
        setLogs(updatedLogs);
        localStorage.setItem('mockInventoryLogs', JSON.stringify(updatedLogs));
    };

    // Form Handlers
    const handleStockSubmit = (e) => {
        e.preventDefault();
        const numStock = parseFloat(stockForm.stock);
        
        if (editingItem) {
            const updated = inventory.map(i => i.id === editingItem ? { 
                ...i, ...stockForm, 
                stock: numStock, 
                minStock: parseFloat(stockForm.minStock),
                price: parseFloat(stockForm.price)
            } : i);
            saveInventory(updated);
            addLog('Update Stock', stockForm.name, `${numStock} ${stockForm.unit}`);
        } else {
            const newItem = { 
                ...stockForm, 
                id: `i${Date.now()}`,
                stock: numStock,
                minStock: parseFloat(stockForm.minStock),
                price: parseFloat(stockForm.price)
            };
            saveInventory([...inventory, newItem]);
            addLog('Purchase Stock', stockForm.name, `${numStock} ${stockForm.unit}`);
        }
        setShowStockModal(false);
    };

    const handleVendorSubmit = (e) => {
        e.preventDefault();
        if (!/^\d{10}$/.test(vendorForm.phone)) {
            alert("Invalid Phone Number! Please enter exactly 10 digits.");
            return;
        }
        const newVendor = { ...vendorForm, id: `v${Date.now()}` };
        saveVendors([...vendors, newVendor]);
        setShowVendorModal(false);
    };

    const deleteItem = (id, name) => {
        if(confirm(`Delete ${name} from inventory?`)) {
            saveInventory(inventory.filter(i => i.id !== id));
            addLog('Delete Item', name, 'ALL');
        }
    };

    // Render Helpers
    const lowStockItems = inventory.filter(i => i.stock <= i.minStock);
    const filteredInventory = inventory.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Procurement & Vendors</h1>
                    <p className="text-gray-500 font-medium mt-1">Manage suppliers and purchase logs</p>
                </div>
                <div className="flex space-x-3">
                    <button onClick={() => { setVendorForm({name: '', contact: '', phone: '', email: '', gst: ''}); setShowVendorModal(true); }} className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl transition-colors shadow-sm flex items-center gap-2">
                        <Truck size={18} /> Add Vendor
                    </button>
                    <button onClick={() => { setEditingItem(null); setStockForm({name: '', variety: '', category: 'Grains', unit: 'g', minStock: '', stock: '', price: '', vendorId: ''}); setShowStockModal(true); }} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-md shadow-blue-200 flex items-center gap-2">
                        <ShoppingCart size={18} /> Purchase Stock
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-white rounded-xl shadow-sm border border-gray-100 p-1 w-max">
                <button
                    onClick={() => setActiveTab('vendors')}
                    className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'vendors' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                >
                    Vendors
                </button>
                <button
                    onClick={() => setActiveTab('logs')}
                    className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'logs' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                >
                    Logs
                </button>
            </div>

            {/* TAB: OVERVIEW */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    {lowStockItems.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                            <h2 className="text-red-800 font-bold text-lg mb-4 flex items-center gap-2">
                                <AlertTriangle size={24} className="text-red-600"/> Critical Low Stock Alerts
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {lowStockItems.map(item => (
                                    <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-red-100 flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-gray-900">{item.name}</p>
                                            <p className="text-xs font-medium text-gray-500">{item.variety}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-red-600 font-black">{item.stock} {item.unit}</p>
                                            <p className="text-xs text-red-400 font-medium">Min: {item.minStock} {item.unit}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-4"><Package size={24}/></div>
                            <h3 className="text-gray-500 font-medium text-sm">Total Unique Items</h3>
                            <p className="text-3xl font-black text-gray-900 mt-1">{inventory.length}</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-600 mb-4"><TrendingDown size={24}/></div>
                            <h3 className="text-gray-500 font-medium text-sm">Items Low on Stock</h3>
                            <p className="text-3xl font-black text-gray-900 mt-1">{lowStockItems.length}</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-4"><Truck size={24}/></div>
                            <h3 className="text-gray-500 font-medium text-sm">Active Vendors</h3>
                            <p className="text-3xl font-black text-gray-900 mt-1">{vendors.length}</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 mb-4"><ShieldCheck size={24}/></div>
                            <h3 className="text-gray-500 font-medium text-sm">Inventory Value (Est.)</h3>
                            <p className="text-3xl font-black text-gray-900 mt-1">₹{inventory.reduce((sum, i) => sum + (i.stock * i.price), 0).toFixed(0)}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: STOCK */}
            {activeTab === 'stock' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <div className="relative w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input type="text" placeholder="Search inventory..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 text-gray-900 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                    </div>
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white text-gray-500 text-sm border-b border-gray-200">
                                <th className="p-4 font-bold">Item Name</th>
                                <th className="p-4 font-bold">Category</th>
                                <th className="p-4 font-bold">Stock</th>
                                <th className="p-4 font-bold">Vendor</th>
                                <th className="p-4 font-bold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredInventory.map(item => {
                                const vendor = vendors.find(v => v.id === item.vendorId);
                                const isLow = item.stock <= item.minStock;
                                return (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4">
                                            <p className="font-bold text-gray-900 flex items-center gap-2">
                                                {item.name} {isLow && <span className="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Low</span>}
                                            </p>
                                            <p className="text-xs text-gray-500 font-medium">{item.variety}</p>
                                        </td>
                                        <td className="p-4 text-gray-600 font-medium">{item.category}</td>
                                        <td className="p-4">
                                            <span className={`font-black ${isLow ? 'text-red-600' : 'text-gray-900'}`}>{item.stock}</span>
                                            <span className="text-sm font-medium text-gray-500 ml-1">{item.unit}</span>
                                        </td>
                                        <td className="p-4 text-gray-600 font-medium">{vendor?.name || 'Unknown'}</td>
                                        <td className="p-4 text-right space-x-2">
                                            <button onClick={() => { setEditingItem(item.id); setStockForm(item); setShowStockModal(true); }} className="p-2 text-gray-400 hover:text-blue-600 transition-colors bg-white rounded-lg border border-gray-200 shadow-sm"><Edit2 size={16} /></button>
                                            <button onClick={() => deleteItem(item.id, item.name)} className="p-2 text-gray-400 hover:text-red-600 transition-colors bg-white rounded-lg border border-gray-200 shadow-sm"><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* TAB: VENDORS */}
            {activeTab === 'vendors' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {vendors.map(v => (
                        <div key={v.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                            <h3 className="text-lg font-black text-gray-900">{v.name}</h3>
                            <div className="mt-4 space-y-2 text-sm">
                                <div className="flex justify-between"><span className="text-gray-500 font-medium">Contact:</span> <span className="font-semibold text-gray-900">{v.contact}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500 font-medium">Phone:</span> <span className="font-semibold text-gray-900">{v.phone}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500 font-medium">Email:</span> <span className="font-semibold text-gray-900">{v.email}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500 font-medium">GST No:</span> <span className="font-semibold text-gray-900">{v.gst}</span></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* TAB: LOGS */}
            {activeTab === 'logs' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                        <h2 className="font-bold text-gray-900 flex items-center gap-2"><History size={18} /> Audit Trails & History</h2>
                    </div>
                    <div className="overflow-y-auto max-h-[600px]">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-white text-gray-500 border-b border-gray-200 sticky top-0">
                                    <th className="p-4 font-bold">Date & Time</th>
                                    <th className="p-4 font-bold">Action</th>
                                    <th className="p-4 font-bold">Ingredient</th>
                                    <th className="p-4 font-bold">Quantity</th>
                                    <th className="p-4 font-bold">Performed By</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {logs.map(log => (
                                    <tr key={log.id} className="hover:bg-gray-50">
                                        <td className="p-4 text-gray-600">{log.date}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                                                log.action.includes('Deduction') ? 'bg-orange-100 text-orange-700' :
                                                log.action.includes('Purchase') ? 'bg-green-100 text-green-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>{log.action}</span>
                                        </td>
                                        <td className="p-4 font-bold text-gray-900">{log.ingredient}</td>
                                        <td className="p-4 font-bold text-gray-900">{log.qty}</td>
                                        <td className="p-4 text-gray-500">{log.user}</td>
                                    </tr>
                                ))}
                                {logs.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-gray-400">No transaction logs found.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* MODALS */}
            {showStockModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-gray-100 bg-gray-50">
                            <h2 className="text-xl font-bold text-gray-900">{editingItem ? 'Edit Inventory Item' : 'Purchase / Add Stock'}</h2>
                        </div>
                        <form onSubmit={handleStockSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-bold text-gray-700 mb-1">Item Name</label><input required className="w-full p-2.5 border rounded-xl text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" value={stockForm.name} onChange={e=>setStockForm({...stockForm, name: e.target.value})} /></div>
                                <div><label className="block text-sm font-bold text-gray-700 mb-1">Variety (Optional)</label><input className="w-full p-2.5 border rounded-xl text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" value={stockForm.variety} onChange={e=>setStockForm({...stockForm, variety: e.target.value})} /></div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                                    <select className="w-full p-2.5 border rounded-xl text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" value={stockForm.category} onChange={e=>setStockForm({...stockForm, category: e.target.value})}>
                                        <option>Grains</option><option>Meat</option><option>Vegetables</option><option>Pantry</option><option>Dairy</option><option>Beverages</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Unit</label>
                                    <select className="w-full p-2.5 border rounded-xl text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" value={stockForm.unit} onChange={e=>setStockForm({...stockForm, unit: e.target.value})}>
                                        <option value="g">Grams (g)</option><option value="ml">Milliliters (ml)</option><option value="pcs">Pieces (pcs)</option>
                                    </select>
                                </div>
                                <div><label className="block text-sm font-bold text-gray-700 mb-1">Vendor</label>
                                    <select required className="w-full p-2.5 border rounded-xl text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" value={stockForm.vendorId} onChange={e=>setStockForm({...stockForm, vendorId: e.target.value})}>
                                        <option value="">Select Vendor</option>
                                        {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div><label className="block text-sm font-bold text-gray-700 mb-1">Stock Amount</label><input type="number" required min="0" step="0.1" className="w-full p-2.5 border rounded-xl text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" value={stockForm.stock} onChange={e=>setStockForm({...stockForm, stock: e.target.value})} /></div>
                                <div><label className="block text-sm font-bold text-gray-700 mb-1">Min Alert Lvl</label><input type="number" required min="0" step="0.1" className="w-full p-2.5 border rounded-xl text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" value={stockForm.minStock} onChange={e=>setStockForm({...stockForm, minStock: e.target.value})} /></div>
                                <div><label className="block text-sm font-bold text-gray-700 mb-1">Cost Per Unit</label><input type="number" required min="0" step="0.01" className="w-full p-2.5 border rounded-xl text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" value={stockForm.price} onChange={e=>setStockForm({...stockForm, price: e.target.value})} /></div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setShowStockModal(false)} className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-xl">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-sm">{editingItem ? 'Save Changes' : 'Purchase Stock'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showVendorModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-gray-100 bg-gray-50"><h2 className="text-xl font-bold text-gray-900">Add New Vendor</h2></div>
                        <form onSubmit={handleVendorSubmit} className="p-6 space-y-4">
                            <div><label className="block text-sm font-bold text-gray-700 mb-1">Company Name</label><input required className="w-full p-2.5 border rounded-xl text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" value={vendorForm.name} onChange={e=>setVendorForm({...vendorForm, name: e.target.value})} /></div>
                            <div><label className="block text-sm font-bold text-gray-700 mb-1">Contact Person</label><input required className="w-full p-2.5 border rounded-xl text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" value={vendorForm.contact} onChange={e=>setVendorForm({...vendorForm, contact: e.target.value})} /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-bold text-gray-700 mb-1">Phone</label><input type="tel" pattern="[0-9]{10}" title="Please enter exactly 10 digits" required className="w-full p-2.5 border rounded-xl text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" value={vendorForm.phone} onChange={e=>setVendorForm({...vendorForm, phone: e.target.value})} /></div>
                                <div><label className="block text-sm font-bold text-gray-700 mb-1">Email</label><input type="email" required className="w-full p-2.5 border rounded-xl text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" value={vendorForm.email} onChange={e=>setVendorForm({...vendorForm, email: e.target.value})} /></div>
                            </div>
                            <div><label className="block text-sm font-bold text-gray-700 mb-1">GST Number</label><input className="w-full p-2.5 border rounded-xl text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" value={vendorForm.gst} onChange={e=>setVendorForm({...vendorForm, gst: e.target.value})} /></div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setShowVendorModal(false)} className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-xl">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-sm">Save Vendor</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
