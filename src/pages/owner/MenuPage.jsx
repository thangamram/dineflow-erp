import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Image as ImageIcon, X, Check, Save } from 'lucide-react';
import api from '../../api';

export default function MenuPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [menuItems, setMenuItems] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        category: 'Main Course',
        price: '',
        type: 'veg',
        status: 'Active',
        description: '',
        image: '',
        recipe: [] // Array of { ingredientId, qty }
    });
    const [inventoryItems, setInventoryItems] = useState([]);
    const [categories, setCategories] = useState([]);

    const loadMenu = async () => {
        try {
            const menuRes = await api.get('/menu-items?size=200');
            const catsRes = await api.get('/categories');
            setCategories(catsRes || []);
            
            const activeItems = (menuRes.content || []).map(item => ({
                id: item.id,
                name: item.name,
                category: item.categoryName || 'General',
                price: Number(item.price || 0),
                type: item.dietaryType === 'VEG' ? 'veg' : 'non-veg',
                status: item.available ? 'Active' : 'Inactive',
                description: item.description,
                image: item.imageUrl,
                recipe: []
            }));
            setMenuItems(activeItems);
        } catch (err) {
            console.error('Failed to load menu from REST API:', err);
            const stored = localStorage.getItem('mockMenu');
            if (stored) {
                setMenuItems(JSON.parse(stored));
            } else {
                setMenuItems([]);
            }
        }

        const storedInv = localStorage.getItem('mockInventory');
        if (storedInv) {
            setInventoryItems(JSON.parse(storedInv));
        }
    };

    useEffect(() => {
        loadMenu();
    }, []);

    const saveMenu = (updatedMenu) => {
        setMenuItems(updatedMenu);
        localStorage.setItem('mockMenu', JSON.stringify(updatedMenu));
    };

    const handleOpenAdd = () => {
        setFormData({ name: '', category: 'Main Course', price: '', type: 'veg', status: 'Active', description: '', image: '', recipe: [] });
        setEditingItem(null);
        setShowAddModal(true);
    };

    const handleOpenEdit = (item) => {
        setFormData({ ...item, recipe: item.recipe || [] });
        setEditingItem(item.id);
        setShowAddModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.price) return;
        
        const priceNum = parseFloat(formData.price);
        
        try {
            let cat = categories.find(c => c.name.toLowerCase() === formData.category.toLowerCase());
            if (!cat && categories.length > 0) {
                cat = categories[0];
            }
            const catId = cat ? cat.id : 1;

            const payload = {
                name: formData.name,
                price: priceNum,
                categoryId: catId,
                description: formData.description || '',
                available: formData.status === 'Active',
                dietaryType: formData.type === 'veg' ? 'VEG' : 'NON_VEG'
            };

            if (editingItem) {
                await api.put(`/menu-items/${editingItem}`, payload);
            } else {
                await api.post('/menu-items', payload);
            }
            setShowAddModal(false);
            loadMenu();
        } catch (err) {
            console.error('Failed to save menu item via API:', err);
            if (editingItem) {
                const updated = menuItems.map(item => item.id === editingItem ? { ...item, ...formData, price: priceNum } : item);
                saveMenu(updated);
            } else {
                const newItem = { ...formData, id: Date.now(), price: priceNum };
                const updated = [...menuItems, newItem];
                saveMenu(updated);
            }
            setShowAddModal(false);
        }
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this menu item?')) {
            try {
                await api.delete(`/menu-items/${id}`);
                loadMenu();
            } catch (err) {
                console.error('Failed to delete menu item:', err);
                saveMenu(menuItems.filter(item => item.id !== id));
            }
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
        try {
            const item = menuItems.find(i => i.id === id);
            let cat = categories.find(c => c.name.toLowerCase() === item.category.toLowerCase());
            const catId = cat ? cat.id : 1;
            
            await api.put(`/menu-items/${id}`, {
                name: item.name,
                price: item.price,
                categoryId: catId,
                description: item.description || '',
                available: newStatus === 'Active',
                dietaryType: item.type === 'veg' ? 'VEG' : 'NON_VEG'
            });
            loadMenu();
        } catch (err) {
            console.error('Failed to toggle status:', err);
            saveMenu(menuItems.map(item => item.id === id ? { ...item, status: newStatus } : item));
        }
    };

    const filteredMenu = menuItems.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Menu Management</h1>
                    <p className="text-gray-500">Manage items and instantly update Customer portal</p>
                </div>
                <button 
                    onClick={handleOpenAdd}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-colors font-bold shadow-sm"
                >
                    <Plus size={20} />
                    <span>Add New Item</span>
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div className="relative w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search menu..." 
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
                                <th className="p-4 font-bold">Item Name</th>
                                <th className="p-4 font-bold">Category</th>
                                <th className="p-4 font-bold">Type</th>
                                <th className="p-4 font-bold">Price</th>
                                <th className="p-4 font-bold">Status</th>
                                <th className="p-4 font-bold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredMenu.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 font-bold text-gray-900">{item.name}</td>
                                    <td className="p-4 text-gray-600 font-medium">{item.category}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-1.5">
                                            <div className={`w-3 h-3 border ${item.type === 'veg' ? 'border-green-600' : 'border-red-600'} flex items-center justify-center p-0.5`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${item.type === 'veg' ? 'bg-green-600' : 'bg-red-600'}`}></div>
                                            </div>
                                            <span className="text-xs font-semibold uppercase text-gray-500">{item.type}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-900 font-bold">₹{parseFloat(item.price).toFixed(2)}</td>
                                    <td className="p-4">
                                        <button 
                                            onClick={() => toggleStatus(item.id, item.status)}
                                            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${item.status === 'Active' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                        >
                                            {item.status}
                                        </button>
                                    </td>
                                    <td className="p-4 text-right space-x-2">
                                        <button onClick={() => handleOpenEdit(item)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors" title="Edit">
                                            <Edit2 size={18} />
                                        </button>
                                        <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors" title="Delete">
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredMenu.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-500 font-medium">No menu items found.</td>
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
                            <h2 className="text-xl font-bold text-gray-900">{editingItem ? 'Edit Menu Item' : 'Add New Item'}</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Item Name</label>
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
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                                    <input 
                                        type="text"
                                        required
                                        list="category-options"
                                        placeholder="Select or type new..."
                                        value={formData.category}
                                        onChange={e => setFormData({...formData, category: e.target.value})}
                                        className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    />
                                    <datalist id="category-options">
                                        {[...new Set([...menuItems.map(i => i.category), 'Starters', 'Mains', 'Breads', 'Beverages', 'Desserts'])].map(cat => (
                                            <option key={cat} value={cat} />
                                        ))}
                                    </datalist>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Price (₹)</label>
                                    <input 
                                        type="number" 
                                        required
                                        min="0"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={e => setFormData({...formData, price: e.target.value})}
                                        className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Dietary Type</label>
                                    <select 
                                        value={formData.type}
                                        onChange={e => setFormData({...formData, type: e.target.value})}
                                        className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    >
                                        <option value="veg">Vegetarian</option>
                                        <option value="non-veg">Non-Vegetarian</option>
                                        <option value="n/a">Not Applicable</option>
                                    </select>
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
                            
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Description (Optional)</label>
                                <textarea 
                                    rows="2"
                                    value={formData.description || ''}
                                    onChange={e => setFormData({...formData, description: e.target.value})}
                                    className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                    placeholder="Brief description for the customer menu..."
                                />
                            </div>

                            <div className="pt-2 border-t border-gray-100">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-semibold text-gray-700">Recipe / Ingredients</label>
                                    <button 
                                        type="button" 
                                        onClick={() => setFormData({...formData, recipe: [...formData.recipe, { ingredientId: '', qty: '' }]})}
                                        className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-md"
                                    >
                                        <Plus size={14} /> Add Ingredient
                                    </button>
                                </div>
                                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                    {formData.recipe.map((rec, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <select 
                                                value={rec.ingredientId}
                                                onChange={(e) => {
                                                    const newRecipe = [...formData.recipe];
                                                    newRecipe[index].ingredientId = e.target.value;
                                                    setFormData({...formData, recipe: newRecipe});
                                                }}
                                                className="flex-1 px-3 py-1.5 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                            >
                                                <option value="">Select Ingredient...</option>
                                                {inventoryItems.map(inv => (
                                                    <option key={inv.id} value={inv.id}>{inv.name} ({inv.variety}) - in {inv.unit}</option>
                                                ))}
                                            </select>
                                            <input 
                                                type="number" 
                                                min="0" step="0.01"
                                                placeholder="Qty"
                                                value={rec.qty}
                                                onChange={(e) => {
                                                    const newRecipe = [...formData.recipe];
                                                    newRecipe[index].qty = e.target.value;
                                                    setFormData({...formData, recipe: newRecipe});
                                                }}
                                                className="w-24 px-3 py-1.5 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    const newRecipe = formData.recipe.filter((_, i) => i !== index);
                                                    setFormData({...formData, recipe: newRecipe});
                                                }}
                                                className="text-gray-400 hover:text-red-600 p-1"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    {formData.recipe.length === 0 && (
                                        <p className="text-xs text-gray-500 italic">No ingredients added yet. Kitchen won't automatically deduct stock for this item.</p>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end space-x-3 border-t border-gray-100">
                                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" className="px-4 py-2 flex items-center gap-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200 transition-colors">
                                    <Save size={18} />
                                    {editingItem ? 'Save Changes' : 'Create Item'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
