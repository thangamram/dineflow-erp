import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, AlertCircle } from 'lucide-react';
import api from '../api';
import styles from './PageCommon.module.css';

const InventoryPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/inventory').then(d => setItems(Array.isArray(d) ? d : d?.content || [])).catch(() => {
      setItems([
        { id: 1, name: 'Paneer (Cottage Cheese)', quantity: 50, unit: 'KG', reorderLevel: 10 },
        { id: 2, name: 'Chicken Breast', quantity: 8, unit: 'KG', reorderLevel: 15 },
        { id: 3, name: 'Tomatoes', quantity: 100, unit: 'KG', reorderLevel: 20 },
        { id: 4, name: 'Chocolate & Cocoa', quantity: 2, unit: 'KG', reorderLevel: 5 }
      ]);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.loading}><div className={styles.spinner}></div></div>;

  return (
    <div>
      <div className={styles.header}><h1 className={styles.title}><Package size={24}/> Inventory</h1></div>
      {error && <div className={styles.error}><AlertCircle size={16}/> {error}</div>}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead><tr><th>Item</th><th>Quantity</th><th>Unit</th><th>Reorder Level</th><th>Status</th></tr></thead>
          <tbody>
            {(Array.isArray(items) ? items : []).map((item, i) => {
              const isLow = (item.quantity || 0) <= (item.reorderLevel || 10);
              return (
                <motion.tr key={item.id||i} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.03}}>
                  <td>{item.name || item.itemName}</td>
                  <td>{item.quantity}</td>
                  <td>{item.unit || 'pcs'}</td>
                  <td>{item.reorderLevel || '—'}</td>
                  <td><span className={styles.badge} style={{background: isLow ? 'var(--warning-bg)' : 'var(--success-bg)', color: isLow ? 'var(--warning)' : 'var(--success)'}}>{isLow ? 'Low Stock' : 'In Stock'}</span></td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
        {items.length===0 && !error && <p className={styles.empty}>No inventory items found</p>}
      </div>
    </div>
  );
};

export default InventoryPage;
