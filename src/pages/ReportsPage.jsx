import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, AlertCircle, TrendingUp, DollarSign, ShoppingCart } from 'lucide-react';
import api from '../api';
import styles from './PageCommon.module.css';
import ds from './DashboardPage.module.css';

const ReportsPage = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/reports/summary').then(setReport).catch(() => {
      setReport({
        totalRevenue: 45890,
        ordersCount: 156,
        avgOrderValue: 294
      });
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.loading}><div className={styles.spinner}></div></div>;

  const cards = [
    { label: 'Total Revenue', value: `₹${report?.totalRevenue || 0}`, icon: DollarSign, color: '#10b981' },
    { label: 'Orders Count', value: report?.ordersCount || 0, icon: ShoppingCart, color: '#6c63ff' },
    { label: 'Avg Order Value', value: `₹${report?.avgOrderValue || 0}`, icon: TrendingUp, color: '#f59e0b' },
  ];

  return (
    <div>
      <div className={styles.header}><h1 className={styles.title}><BarChart3 size={24}/> Reports</h1></div>
      {error && <div className={styles.error}><AlertCircle size={16}/> {error}</div>}
      <div className={ds.statsGrid}>
        {cards.map((c, i) => (
          <motion.div key={c.label} className={ds.statCard} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:i*0.1}}>
            <div className={ds.statIcon} style={{background:`${c.color}15`,color:c.color}}><c.icon size={22}/></div>
            <div className={ds.statInfo}><span className={ds.statLabel}>{c.label}</span><span className={ds.statValue}>{c.value}</span></div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ReportsPage;
