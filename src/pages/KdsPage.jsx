import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MonitorPlay, Clock, CheckCircle2, ChevronRight, AlertCircle } from 'lucide-react';
import api from '../api';
import styles from './KdsPage.module.css';
import pageStyles from './PageCommon.module.css';

const KdsPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = () => {
    api.get('/orders/active')
      .then(data => {
        setOrders(Array.isArray(data) ? data : data?.content || []);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to fetch orders from Kitchen Display System.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000); // Simple polling every 5s for KDS
    return () => clearInterval(interval);
  }, []);

  const moveOrder = async (id, newStatus) => {
    try {
      await api.patch(`/orders/${id}/status`, { status: newStatus, remarks: 'Updated by Kitchen' });
      // Optimistically update
      setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
    } catch (err) {
      console.error(err);
      alert('Failed to update order status');
    }
  };

  const isPending = (status) => ['NEW', 'RECEIVED'].includes(status);
  const isPreparing = (status) => status === 'PREPARING';
  const isReady = (status) => status === 'READY';

  const pending = orders.filter(o => isPending(o.status));
  const preparing = orders.filter(o => isPreparing(o.status));
  const ready = orders.filter(o => isReady(o.status));

  const OrderCard = ({ order, nextStatus, nextLabel, icon: Icon, colorClass }) => {
    const time = new Date(order.placedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return (
      <motion.div 
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={`${styles.orderCard} ${colorClass}`}
      >
        <div className={styles.cardHeader}>
          <span className={styles.orderId}>#{order.orderNumber || order.id}</span>
          <span className={styles.orderTable}>{order.tableNumber || `Table ${order.tableId}`}</span>
        </div>
        <div className={styles.timeWrap}>
          <Clock size={14} /> <span className={styles.timeText}>{time}</span>
        </div>
        <ul className={styles.itemList}>
          {(order.items || []).map((item, i) => (
            <li key={i} className={styles.item}>
              <span className={styles.itemQty}>{item.quantity}x</span>
              <span className={styles.itemName}>{item.itemName}</span>
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
  };

  if (loading && orders.length === 0) return <div className={pageStyles.loading}><div className={pageStyles.spinner}></div></div>;

  return (
    <div className={styles.kdsContainer}>
      <div className={pageStyles.header}>
        <h1 className={pageStyles.title}><MonitorPlay size={24}/> Kitchen Display System</h1>
      </div>
      
      {error && <div className={pageStyles.error}><AlertCircle size={16}/> {error}</div>}

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
