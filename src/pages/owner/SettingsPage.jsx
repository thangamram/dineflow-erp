import React, { useState, useEffect } from 'react';
import { Save, Store, Receipt, Bell, Shield, Smartphone, CheckCircle } from 'lucide-react';
import api from '../../api';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('profile');
    const [settings, setSettings] = useState({
        restaurantName: 'DineFlow Signature',
        contactEmail: 'admin@dineflow.com',
        address: '123 Culinary Avenue, Food District, FD 40001',
        currency: 'INR (₹)',
        taxRate: '5',
        taxName: 'GST'
    });
    const [saved, setSaved] = useState(false);

    const handleWipeData = async () => {
        if (confirm("WARNING: This will permanently delete ALL data (Tables, Menu, Inventory, Orders, Bills, Staff) from the database and browser. This cannot be undone. Proceed?")) {

            // 1. Delete all orders first (to remove FK constraints on tables/bills)
            try {
                const orders = await api.get('/orders/active').catch(() => []);
                const orderList = Array.isArray(orders) ? orders : (orders?.content || []);
                for (const o of orderList) {
                    await api.delete(`/orders/${o.id}`).catch(() => {});
                }
            } catch (e) { console.error('Failed to clear orders:', e); }

            // 2. Delete all bills
            try {
                const bills = await api.get('/bills').catch(() => []);
                const billList = Array.isArray(bills) ? bills : (bills?.content || []);
                for (const b of billList) {
                    await api.delete(`/bills/${b.id}`).catch(() => {});
                }
            } catch (e) { console.error('Failed to clear bills:', e); }

            // 3. Delete all tables
            try {
                const tables = await api.get('/tables').catch(() => []);
                if (Array.isArray(tables)) {
                    for (const t of tables) {
                        await api.delete(`/tables/${t.id}`).catch(() => {
                            api.patch(`/tables/${t.id}/status?status=AVAILABLE`).catch(() => {});
                        });
                    }
                }
            } catch (e) { console.error('Failed to clear tables:', e); }

            // 4. Delete all menu items
            try {
                const menuRes = await api.get('/menu-items?size=200').catch(() => ({}));
                const items = menuRes?.content || (Array.isArray(menuRes) ? menuRes : []);
                for (const item of items) {
                    await api.delete(`/menu-items/${item.id}`).catch(() => {});
                }
            } catch (e) { console.error('Failed to clear menu items:', e); }

            // 5. Delete all menu categories
            try {
                const cats = await api.get('/menu-categories').catch(() => []);
                const catList = Array.isArray(cats) ? cats : (cats?.content || []);
                for (const c of catList) {
                    await api.delete(`/menu-categories/${c.id}`).catch(() => {});
                }
            } catch (e) { console.error('Failed to clear menu categories:', e); }

            // 6. Delete all staff (non-owner, non-admin users if endpoint exists)
            try {
                const staffRes = await api.get('/staff').catch(() => []);
                const staffList = Array.isArray(staffRes) ? staffRes : (staffRes?.content || []);
                for (const s of staffList) {
                    if (!['OWNER', 'ADMIN'].includes(s.role)) {
                        await api.delete(`/staff/${s.id}`).catch(() => {});
                    }
                }
            } catch (e) { console.error('Failed to clear staff:', e); }

            // 7. Clear ALL localStorage mock keys
            const mockKeys = [
                'mockTables', 'mockMenu', 'mockInventory', 'mockVendors', 'mockInventoryLogs',
                'mockOrders', 'mockBills', 'mockStaff', 'mockAttendance', 'mockLeaves',
                'mockPayroll', 'mockPayrollLogs', 'mockAuditLogs', 'mockNotifications',
                'cashierPaid', 'cashierPending', 'kdsSessions', 'tableWaiterAssignments',
                'deletedTableIds', 'lastPlacedOrderId', 'customerSessionId', 'tableNumber',
                'onboardingCompleted', 'onboardingStep', 'onboardingData'
            ];
            mockKeys.forEach(key => localStorage.removeItem(key));

            alert("✅ All data wiped! The ERP is now clean and ready for fresh real data.");
            window.location.reload();
        }
    };

    useEffect(() => {
        const stored = localStorage.getItem('erpSettings');
        if (stored) {
            setSettings(JSON.parse(stored));
        }
    }, []);

    const handleSave = () => {
        localStorage.setItem('erpSettings', JSON.stringify(settings));
        
        // Also update brand globally if needed in future (dispatch event or reload)
        window.dispatchEvent(new Event('settingsUpdated'));

        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };
    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Settings</h1>
                <p className="text-gray-500 dark:text-gray-400">Configure global restaurant parameters and preferences</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Settings Navigation */}
                <div className="space-y-1">
                    <button 
                        onClick={() => setActiveTab('profile')}
                        className={`w-full flex items-center space-x-3 px-4 py-3 font-medium rounded-lg transition-colors ${activeTab === 'profile' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                    >
                        <Store size={20} />
                        <span>Restaurant Profile</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('billing')}
                        className={`w-full flex items-center space-x-3 px-4 py-3 font-medium rounded-lg transition-colors ${activeTab === 'billing' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                    >
                        <Receipt size={20} />
                        <span>Billing & Taxes</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('system')}
                        className={`w-full flex items-center space-x-3 px-4 py-3 font-medium rounded-lg transition-colors ${activeTab === 'system' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                    >
                        <Shield size={20} />
                        <span>System / Data Wipe</span>
                    </button>
                </div>

                {/* Settings Form Area */}
                <div className="md:col-span-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-6">
                    {activeTab === 'profile' && (
                        <>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Restaurant Profile</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Update your establishment details</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Restaurant Name</label>
                                    <input 
                                        type="text" 
                                        value={settings.restaurantName}
                                        onChange={(e) => setSettings({...settings, restaurantName: e.target.value})}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Contact Email</label>
                                    <input 
                                        type="email" 
                                        value={settings.contactEmail}
                                        onChange={(e) => setSettings({...settings, contactEmail: e.target.value})}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
                                    <textarea 
                                        rows="3"
                                        value={settings.address}
                                        onChange={(e) => setSettings({...settings, address: e.target.value})}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Default Currency</label>
                                    <select 
                                        value={settings.currency}
                                        onChange={(e) => setSettings({...settings, currency: e.target.value})}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="INR (₹)">INR (₹)</option>
                                        <option value="USD ($)">USD ($)</option>
                                        <option value="EUR (€)">EUR (€)</option>
                                    </select>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'billing' && (
                        <>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Billing & Taxes</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Configure how taxes are applied to customer bills.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tax Name (e.g. GST, VAT)</label>
                                    <input 
                                        type="text" 
                                        value={settings.taxName || ''}
                                        onChange={(e) => setSettings({...settings, taxName: e.target.value})}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tax Rate (%)</label>
                                    <input 
                                        type="number" 
                                        step="0.1"
                                        value={settings.taxRate || ''}
                                        onChange={(e) => setSettings({...settings, taxRate: e.target.value})}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'system' && (
                        <>
                            <div>
                                <h2 className="text-xl font-bold text-amber-600 dark:text-amber-500">System Reset & Data Wipe</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Ready to launch your restaurant for real? Use this to wipe out all the fake testing data.
                                </p>
                            </div>

                            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/50 rounded-xl p-5">
                                <h3 className="font-bold text-amber-800 dark:text-amber-400 mb-2">Launch ERP (Wipe Mock Data)</h3>
                                <p className="text-sm text-amber-700/80 dark:text-amber-400/80 mb-4">
                                    This will permanently delete all mock Tables, Menu items, Inventory, Orders, Bills, and Staff. 
                                    Your <b>Restaurant Profile</b> and <b>Global Settings</b> will NOT be deleted.
                                </p>
                                <button 
                                    onClick={handleWipeData}
                                    className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-sm transition-colors"
                                >
                                    Wipe Mock Data & Start Fresh
                                </button>
                            </div>
                        </>
                    )}

                    {(activeTab === 'profile' || activeTab === 'billing') && (
                        <div className="pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            {saved ? (
                                <div className="flex items-center text-emerald-600 font-bold space-x-2">
                                    <CheckCircle size={20} />
                                    <span>Settings Saved Successfully!</span>
                                </div>
                            ) : (
                                <div></div>
                            )}
                            <button 
                                onClick={handleSave}
                                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
                            >
                                <Save size={18} />
                                <span>Save Changes</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
