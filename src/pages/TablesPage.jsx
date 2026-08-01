import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Grid3x3, AlertCircle } from 'lucide-react';
import api from '../api';
import styles from './TablesPage.module.css';
import pageStyles from './PageCommon.module.css';

const TablesPage = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/tables').then(d => setTables(Array.isArray(d) ? d : d?.content || [])).catch(() => {
      setTables([
        { id: 1, tableNumber: 'T-01', capacity: 2, status: 'AVAILABLE', gridArea: '1 / 1 / 3 / 3', shape: 'round' },
        { id: 2, tableNumber: 'T-02', capacity: 4, status: 'OCCUPIED', gridArea: '1 / 5 / 3 / 8', shape: 'rect' },
        { id: 3, tableNumber: 'T-03', capacity: 4, status: 'CLEANING', gridArea: '1 / 10 / 3 / 13', shape: 'rect' },
        { id: 4, tableNumber: 'T-04', capacity: 6, status: 'AVAILABLE', gridArea: '5 / 1 / 8 / 4', shape: 'rect' },
        { id: 5, tableNumber: 'T-05', capacity: 8, status: 'OCCUPIED', gridArea: '5 / 6 / 9 / 11', shape: 'rect' },
        { id: 6, tableNumber: 'T-06', capacity: 2, status: 'AVAILABLE', gridArea: '6 / 12 / 8 / 14', shape: 'round' }
      ]);
    }).finally(() => setLoading(false));
  }, []);

  const getStatusClass = (status) => {
    if (status === 'AVAILABLE') return styles.available;
    if (status === 'OCCUPIED') return styles.occupied;
    if (status === 'CLEANING' || status === 'RESERVED') return styles.cleaning;
    return styles.available;
  };

  if (loading) return <div className={pageStyles.loading}><div className={pageStyles.spinner}></div></div>;

  return (
    <div className={styles.container}>
      <div className={pageStyles.header}>
        <h1 className={pageStyles.title}><Grid3x3 size={24}/> Visual Floor Plan</h1>
        <div className={styles.legend}>
          <div className={styles.legendItem}><div className={`${styles.legendBox} ${styles.available}`}></div> Available</div>
          <div className={styles.legendItem}><div className={`${styles.legendBox} ${styles.occupied}`}></div> Occupied</div>
          <div className={styles.legendItem}><div className={`${styles.legendBox} ${styles.cleaning}`}></div> Cleaning</div>
        </div>
      </div>
      {error && <div className={pageStyles.error}><AlertCircle size={16}/> {error}</div>}
      
      <div className={styles.floorPlanContainer}>
        <div className={styles.floorPlanGrid}>
          {tables.map((t, i) => (
            <motion.div 
              key={t.id || i}
              className={`${styles.table} ${t.shape === 'round' ? styles.tableRound : styles.tableRect} ${getStatusClass(t.status)}`}
              style={{ gridArea: t.gridArea || 'auto' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1, type: "spring", stiffness: 200 }}
            >
              <span className={styles.tableNumber}>{t.tableNumber || t.id}</span>
              <span className={styles.tableCapacity}>{t.capacity || t.seats} Seats</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TablesPage;
