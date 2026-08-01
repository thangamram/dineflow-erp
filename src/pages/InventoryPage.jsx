import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, AlertCircle, Plus, X } from 'lucide-react';
import api from '../api';
import styles from './PageCommon.module.css';

const InventoryPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [newItem, setNewItem] = useState({ itemName: '', quantity: 0, unit: 'KG', reorderLevel: 10 });
  const [saving, setSaving] = useState(false);

  const fetchInventory = () => {
    setLoading(true);
    api.get('/inventory/ingredients')
      .then(d => setItems(Array.isArray(d) ? d : d?.content || []))
      .catch(err => setError(err.response?.data?.message || 'Failed to fetch inventory'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleAddItem = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: newItem.itemName,
        unitOfMeasure: newItem.unit,
        currentStock: newItem.quantity,
        minimumStock: newItem.reorderLevel,
        unitCost: 0
      };
      await api.post('/inventory/ingredients', payload);
      setShowModal(false);
      setNewItem({ itemName: '', quantity: 0, unit: 'KG', reorderLevel: 10 });
      fetchInventory();
    } catch (err) {
      setError(err.response?.data?.message || 'Validation failed or Server error');
    } finally {
      setSaving(false);
    }
  };

  if (loading && items.length === 0) return <div className={styles.loading}><div className={styles.spinner}></div></div>;

  return (
    <div>
      <div className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className={styles.title}><Package size={24}/> Inventory</h1>
        <button className={styles.saveBtn} onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', margin: 0 }}>
          <Plus size={18} /> Add New Item
        </button>
      </div>
      
      {error && <div className={styles.error}><AlertCircle size={16}/> {error}</div>}
      
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead><tr><th>Item</th><th>Quantity</th><th>Unit</th><th>Reorder Level</th><th>Status</th></tr></thead>
          <tbody>
            {(Array.isArray(items) ? items : []).map((item, i) => {
              const isLow = item.lowStock;
              return (
                <motion.tr key={item.id||i} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.03}}>
                  <td>{item.name}</td>
                  <td>{item.currentStock}</td>
                  <td>{item.unitOfMeasure}</td>
                  <td>{item.minimumStock}</td>
                  <td><span className={styles.badge} style={{background: isLow ? 'var(--warning-bg)' : 'var(--success-bg)', color: isLow ? 'var(--warning)' : 'var(--success)'}}>{isLow ? 'Low Stock' : 'In Stock'}</span></td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
        {items.length===0 && !error && !loading && <p className={styles.empty}>No inventory items found</p>}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className={styles.modalOverlay}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={styles.modalContent}
            >
              <div className={styles.modalHeader}>
                <h2>Add Inventory Item</h2>
                <button onClick={() => setShowModal(false)} className={styles.iconBtn}><X size={20}/></button>
              </div>
              <form onSubmit={handleAddItem} className={styles.formGrid} style={{ marginTop: '20px' }}>
                <div className={styles.field}>
                  <label className={styles.label}>Item Name</label>
                  <input className={styles.input} required value={newItem.itemName} onChange={e => setNewItem({...newItem, itemName: e.target.value})} placeholder="e.g. Milk" />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Quantity</label>
                  <input type="number" step="0.01" className={styles.input} required value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: parseFloat(e.target.value)})} />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Unit</label>
                  <input className={styles.input} required value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value})} placeholder="e.g. Liters, KG" />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Reorder Level</label>
                  <input type="number" step="0.01" className={styles.input} required value={newItem.reorderLevel} onChange={e => setNewItem({...newItem, reorderLevel: parseFloat(e.target.value)})} />
                </div>
                <button type="submit" className={styles.saveBtn} style={{ gridColumn: '1 / -1', marginTop: '10px' }} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Item'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InventoryPage;
