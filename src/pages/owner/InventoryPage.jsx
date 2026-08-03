import React, { useState } from 'react';
import { Search, Plus, AlertTriangle, TrendingDown } from 'lucide-react';

export default function InventoryPage() {
    const [searchTerm, setSearchTerm] = useState('');

    const inventoryItems = [
        { id: 1, name: 'Basmati Rice', category: 'Grains', stock: 50, unit: 'kg', minStock: 20, status: 'Good' },
        { id: 2, name: 'Chicken Breast', category: 'Meat', stock: 15, unit: 'kg', minStock: 20, status: 'Low' },
        { id: 3, name: 'Cooking Oil', category: 'Pantry', stock: 8, unit: 'L', minStock: 10, status: 'Low' },
        { id: 4, name: 'Onions', category: 'Vegetables', stock: 35, unit: 'kg', minStock: 15, status: 'Good' },
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Inventory Management</h1>
                    <p className="text-gray-500 dark:text-gray-400">Track stock levels and set low-stock alerts</p>
                </div>
                <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                    <Plus size={20} />
                    <span>Add Stock</span>
                </button>
            </div>

            {/* Low Stock Alerts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {inventoryItems.filter(i => i.status === 'Low').map(item => (
                    <div key={item.id} className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-full text-red-600 dark:text-red-400">
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-red-800 dark:text-red-300">{item.name} is running low</h4>
                                <p className="text-xs text-red-600 dark:text-red-400">Current stock: {item.stock}{item.unit} (Minimum: {item.minStock}{item.unit})</p>
                            </div>
                        </div>
                        <button className="text-sm font-medium text-red-700 dark:text-red-400 hover:underline">Restock</button>
                    </div>
                ))}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search inventory..." 
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option>All Categories</option>
                        <option>Grains</option>
                        <option>Meat</option>
                        <option>Vegetables</option>
                        <option>Pantry</option>
                    </select>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-sm border-b border-gray-100 dark:border-gray-700">
                                <th className="p-4 font-medium">Item Name</th>
                                <th className="p-4 font-medium">Category</th>
                                <th className="p-4 font-medium">In Stock</th>
                                <th className="p-4 font-medium">Min Threshold</th>
                                <th className="p-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {inventoryItems.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                                    <td className="p-4 font-medium text-gray-900 dark:text-white flex items-center space-x-2">
                                        {item.status === 'Low' && <TrendingDown size={16} className="text-red-500" />}
                                        <span>{item.name}</span>
                                    </td>
                                    <td className="p-4 text-gray-500 dark:text-gray-400">{item.category}</td>
                                    <td className={`p-4 font-medium ${item.status === 'Low' ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                                        {item.stock} {item.unit}
                                    </td>
                                    <td className="p-4 text-gray-500 dark:text-gray-400">{item.minStock} {item.unit}</td>
                                    <td className="p-4 text-right space-x-2">
                                        <button className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium">Edit</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
