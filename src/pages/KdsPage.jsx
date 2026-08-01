import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MonitorPlay, Clock, CheckCircle2, ChevronRight, AlertCircle } from 'lucide-react';
import api from '../api';
import styles from './KdsPage.module.css';
import pageStyles from './PageCommon.module.css';

const KdsPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulated fetch
    setTimeout(() => {
      setOrders([
        { id: 101, table: 'T-02', items: [{name: 'Margherita Pizza', qty: 1}, {name: 'Garlic Bread', qty: 1}], status: 'PENDING', time: '10:32 AM' },
        { id: 102, table: 'T-05', items: [{name: 'Pasta Alfredo', qty: 2}, {name: 'Coke', qty: 2}], status: 'PENDING', time: '10:35 AM' },
        { id: 103, table: 'T-01', items: [{name: 'Veggie Burger', qty: 1}, {name: 'Fries', qty: 1}], status: 'PREPARING', time: '10:25 AM' },
        { id: 104, table: 'Takeaway', items: [{name: 'Chicken Wings', qty: 1}], status: 'READY', time: '10:15 AM' },
      ]);
      setLoading(false);
    }, 800);
  }, []);

  const moveOrder = (id, newStatus) => {
    setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
  };

  const pending = orders.filter(o => o.status === 'PENDING');
  const preparing = orders.filter(o => o.status === 'PREPARING');
  const ready = orders.filter(o => o.status === 'READY');

  const OrderCard = ({ order, nextStatus, nextLabel, icon: Icon, colorClass }) => (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`${styles.orderCard} ${colorClass}`}
    >
      <div className={styles.cardHeader}>
        <span className={styles.orderId}>#{order.id}</span>
        <span className={styles.orderTable}>{order.table}</span>
      </div>
      <div className={styles.timeWrap}>
        <Clock size={14} /> <span className={styles.timeText}>{order.time}</span>
      </div>
      <ul className={styles.itemList}>
        {order.items.map((item, i) => (
          <li key={i} className={styles.item}>
            <span className={styles.itemQty}>{item.qty}x</span>
            <span className={styles.itemName}>{item.name}</span>
          </li>
        ))}
      </ul>
      {nextStatus && (
        <button className={styles.actionBtn} onClick={() => moveOrder(order.id, nextStatus)}>
          {nextLabel} <Icon size={16} />
        </button>
      )}
    </motion.div>
  );

  if (loading) return <div className={pageStyles.loading}><div className={pageStyles.spinner}></div></div>;

  return (
    <div className={styles.kdsContainer}>
      <div className={pageStyles.header}>
        <h1 className={pageStyles.title}><MonitorPlay size={24}/> Kitchen Display System</h1>
      </div>
      
      <div className={styles.kanbanBoard}>
        {/* Pending Column */}
        <div className={styles.column}>
          <div className={`${styles.columnHeader} ${styles.headerPending}`}>
            <h2>Pending ({pending.length})</h2>
          </div>
          <div className={styles.columnBody}>
            <AnimatePresence>
              {pending.map(o => (
                <OrderCard 
                  key={o.id} 
                  order={o} 
                  nextStatus="PREPARING" 
                  nextLabel="Start Prep"
                  icon={ChevronRight}
                  colorClass={styles.cardPending}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Preparing Column */}
        <div className={styles.column}>
          <div className={`${styles.columnHeader} ${styles.headerPreparing}`}>
            <h2>Preparing ({preparing.length})</h2>
          </div>
          <div className={styles.columnBody}>
            <AnimatePresence>
              {preparing.map(o => (
                <OrderCard 
                  key={o.id} 
                  order={o} 
                  nextStatus="READY" 
                  nextLabel="Mark Ready"
                  icon={CheckCircle2}
                  colorClass={styles.cardPreparing}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Ready Column */}
        <div className={styles.column}>
          <div className={`${styles.columnHeader} ${styles.headerReady}`}>
            <h2>Ready ({ready.length})</h2>
          </div>
          <div className={styles.columnBody}>
            <AnimatePresence>
              {ready.map(o => (
                <OrderCard 
                  key={o.id} 
                  order={o}
                  nextStatus={null}
                  colorClass={styles.cardReady}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KdsPage;
