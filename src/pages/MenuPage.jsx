import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChefHat, Search, AlertCircle } from 'lucide-react';
import api from '../api';
import styles from './PageCommon.module.css';

const MenuPage = () => {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/menu/items').then(d => setItems(Array.isArray(d) ? d : d?.content || [])).catch(() => {
      setItems([
        { id: 1, name: 'Paneer Tikka Grill', category: 'Starters & Appetizers', price: 12.99, available: true },
        { id: 2, name: 'Crispy Spring Rolls', category: 'Starters & Appetizers', price: 8.50, available: true },
        { id: 3, name: 'Butter Chicken Special', category: 'Main Course', price: 16.50, available: true },
        { id: 4, name: 'Mango Mint Cooler', category: 'Beverages & Drinks', price: 4.99, available: false }
      ]);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = items.filter(i => (i.name||'').toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className={styles.loading}><div className={styles.spinner}></div></div>;

  return (
    <div>
      <div className={styles.header}><h1 className={styles.title}><ChefHat size={24}/> Menu</h1></div>
      {error && <div className={styles.error}><AlertCircle size={16}/> {error}</div>}
      <div className={styles.searchBar}>
        <input className={styles.searchInput} placeholder="Search menu items..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className={styles.grid}>
        {filtered.map((item, i) => (
          <motion.div key={item.id||i} className={styles.card} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>{item.name}</span>
              <span className={styles.badge} style={{background: item.available !== false ? 'var(--success-bg)' : 'var(--danger-bg)', color: item.available !== false ? 'var(--success)' : 'var(--danger)'}}>
                {item.available !== false ? 'Available' : 'Unavailable'}
              </span>
            </div>
            <p className={styles.cardMeta}>₹{item.price || 0} • {item.category || 'Uncategorized'}</p>
          </motion.div>
        ))}
      </div>
      {filtered.length===0 && !error && <p className={styles.empty}>No menu items found</p>}
    </div>
  );
};

export default MenuPage;
