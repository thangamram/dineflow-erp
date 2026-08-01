import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, Search, AlertCircle, Plus, X, Save } from 'lucide-react';
import api from '../api';
import styles from './PageCommon.module.css';

const MenuPage = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', price: '', categoryId: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [menuRes, catRes] = await Promise.all([
        api.get('/menu-items'), // NOTE: the endpoint is /menu-items according to MenuItemController
        api.get('/categories')
      ]);
      setItems(menuRes?.content || (Array.isArray(menuRes) ? menuRes : []));
      
      const cats = Array.isArray(catRes) ? catRes : (catRes?.content || []);
      setCategories(cats);
      
      if (cats.length > 0) {
        setNewItem(prev => ({ ...prev, categoryId: cats[0].id }));
      }
    } catch (err) {
      setError('Failed to fetch menu data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItem.categoryId) return alert("Please create a category first via API/DB");
    
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: newItem.name,
        price: parseFloat(newItem.price),
        categoryId: parseInt(newItem.categoryId, 10),
        available: true
      };
      await api.post('/menu-items', payload);
      setShowModal(false);
      setNewItem({ ...newItem, name: '', price: '' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add menu item');
    } finally {
      setSaving(false);
    }
  };

  const filtered = items.filter(i => (i.name || '').toLowerCase().includes(search.toLowerCase()));

  if (loading && items.length === 0) return <div className={styles.loading}><div className={styles.spinner}></div></div>;

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}><ChefHat size={24}/> Menu</h1>
        <button className={styles.primaryBtn} onClick={() => setShowModal(true)}>
          <Plus size={20} /> Add Menu Item
        </button>
      </div>
      
      {error && <div className={styles.error}><AlertCircle size={16}/> {error}</div>}
      
      <div className={styles.searchBar} style={{ marginBottom: '20px' }}>
        <input 
          className={styles.searchInput} 
          placeholder="Search menu items..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-primary)' }}
        />
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {filtered.map((item, i) => (
          <motion.div 
            key={item.id||i} 
            style={{ padding: '20px', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}
            initial={{opacity:0, y:16}} animate={{opacity:1, y:0}} transition={{delay: i*0.04}}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <span style={{ fontSize: '18px', fontWeight: 600 }}>{item.name}</span>
              <span style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '12px', background: item.available !== false ? 'var(--success-bg)' : 'var(--danger-bg)', color: item.available !== false ? 'var(--success)' : 'var(--danger)' }}>
                {item.available !== false ? 'Available' : 'Unavailable'}
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>₹{item.price || 0} • {item.categoryName || 'Uncategorized'}</p>
          </motion.div>
        ))}
      </div>
      
      {filtered.length === 0 && !error && <p className={styles.empty}>No menu items found</p>}

      {/* Add Item Modal */}
      <AnimatePresence>
        {showModal && (
          <div className={styles.modalOverlay}>
            <motion.div 
              className={styles.modalContent}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
            >
              <div className={styles.modalHeader}>
                <h2>Add Menu Item</h2>
                <button className={styles.closeBtn} onClick={() => setShowModal(false)}><X size={20}/></button>
              </div>
              
              <form className={styles.form} onSubmit={handleAddItem}>
                <div className={styles.formGroup}>
                  <label>Item Name</label>
                  <input required value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} placeholder="e.g. Garlic Naan" />
                </div>
                
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Price (₹)</label>
                    <input required type="number" step="0.01" min="0" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} placeholder="0.00" />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>Category</label>
                    <select required value={newItem.categoryId} onChange={e => setNewItem({...newItem, categoryId: e.target.value})}>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      {categories.length === 0 && <option value="">No categories found</option>}
                    </select>
                  </div>
                </div>

                <div className={styles.modalFooter}>
                  <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className={styles.saveBtn} disabled={saving || categories.length === 0}>
                    <Save size={18} /> {saving ? 'Saving...' : 'Save Item'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MenuPage;
