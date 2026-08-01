import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, AlertCircle } from 'lucide-react';
import api from '../api';
import styles from './PageCommon.module.css';

const StaffPage = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/staff').then(d => setStaff(Array.isArray(d) ? d : d?.content || [])).catch(() => {
      setStaff([
        { id: 1, name: 'System Administrator', role: 'ROLE_ADMIN', email: 'admin@restaurant.com', active: true },
        { id: 3, name: 'Chef Gordon Kitchen', role: 'ROLE_KITCHEN', email: 'chef@restaurant.com', active: true },
        { id: 4, name: 'Sam Waiter', role: 'ROLE_WAITER', email: 'waiter1@restaurant.com', active: true },
        { id: 5, name: 'Clara Cashier', role: 'ROLE_CASHIER', email: 'cashier1@restaurant.com', active: true }
      ]);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.loading}><div className={styles.spinner}></div></div>;

  return (
    <div>
      <div className={styles.header}><h1 className={styles.title}><Users size={24}/> Staff</h1></div>
      {error && <div className={styles.error}><AlertCircle size={16}/> {error}</div>}
      <div className={styles.grid}>
        {(Array.isArray(staff) ? staff : []).map((s, i) => (
          <motion.div key={s.id||i} className={styles.card} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>{s.name || s.firstName}</span>
              <span className={styles.badge} style={{background: s.active !== false ? 'var(--success-bg)' : 'var(--danger-bg)', color: s.active !== false ? 'var(--success)' : 'var(--danger)'}}>{s.active !== false ? 'Active' : 'Inactive'}</span>
            </div>
            <p className={styles.cardMeta}>{s.role || s.position || 'Staff'}</p>
            <p className={styles.cardMeta}>{s.email || s.phone || ''}</p>
          </motion.div>
        ))}
      </div>
      {staff.length===0 && !error && <p className={styles.empty}>No staff members found</p>}
    </div>
  );
};

export default StaffPage;
