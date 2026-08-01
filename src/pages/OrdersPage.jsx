import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Trash2, Send, Coffee, Pizza, Utensils, Grid3x3, AlertCircle } from 'lucide-react';
import api from '../api';
import styles from './OrdersPage.module.css';
import pageStyles from './PageCommon.module.css';

const MENU_CATEGORIES = [
  { id: 'all', name: 'All', icon: Utensils },
  { id: 'mains', name: 'Mains', icon: Pizza },
  { id: 'drinks', name: 'Drinks', icon: Coffee },
];

const OrdersPage = () => {
  const [menu, setMenu] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  
  // POS State
  const [ticket, setTicket] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/menu-items'),
      api.get('/tables')
    ]).then(([menuRes, tablesRes]) => {
      // Menu items come wrapped in a PageResponse object if fetched successfully
      const menuData = menuRes?.content || (Array.isArray(menuRes) ? menuRes : []);
      // Map colors for UI
      const colors = ['#fca5a5', '#fcd34d', '#86efac', '#93c5fd', '#fde047', '#d8b4fe', '#fdba74'];
      const menuWithColors = menuData.map((m, i) => ({ ...m, color: colors[i % colors.length] }));
      setMenu(menuWithColors);

      const tablesData = Array.isArray(tablesRes) ? tablesRes : (tablesRes?.content || []);
      setTables(tablesData);
    }).catch(err => {
      console.error(err);
      setError('Failed to fetch POS data from the server.');
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  const addToTicket = (item) => {
    const existing = ticket.find(t => t.id === item.id);
    if (existing) {
      setTicket(ticket.map(t => t.id === item.id ? { ...t, qty: t.qty + 1 } : t));
    } else {
      setTicket([...ticket, { ...item, qty: 1 }]);
    }
  };

  const updateQty = (id, delta) => {
    setTicket(ticket.map(t => {
      if (t.id === id) {
        const newQty = t.qty + delta;
        return newQty > 0 ? { ...t, qty: newQty } : t;
      }
      return t;
    }));
  };

  const removeItem = (id) => {
    setTicket(ticket.filter(t => t.id !== id));
  };

  const placeOrder = async () => {
    if (!selectedTable) return alert('Please select a table');
    if (ticket.length === 0) return alert('Ticket is empty');
    
    setSubmitting(true);
    try {
      const payload = {
        tableId: selectedTable,
        orderType: 'DINE_IN',
        remarks: 'Order from POS',
        items: ticket.map(t => ({
          menuItemId: t.id,
          quantity: t.qty,
          specialInstructions: ''
        }))
      };
      
      await api.post('/orders', payload);
      alert('Order successfully sent to kitchen!');
      setTicket([]);
      setSelectedTable('');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to place order.');
    } finally {
      setSubmitting(false);
    }
  };

  // Basic categorization logic (can be updated to use actual categories)
  const filteredMenu = activeCategory === 'all' 
    ? menu 
    : menu.filter(m => (m.categoryName || '').toLowerCase().includes(activeCategory.toLowerCase()));
    
  const total = ticket.reduce((sum, item) => sum + (item.price * item.qty), 0);

  if (loading) return <div className={pageStyles.loading}><div className={pageStyles.spinner}></div></div>;

  return (
    <div className={styles.posContainer}>
      {/* Menu Section (Left) */}
      <div className={styles.menuSection}>
        {error && <div className={pageStyles.error}><AlertCircle size={16}/> {error}</div>}
        <div className={styles.categories}>
          {MENU_CATEGORIES.map(cat => (
            <button 
              key={cat.id} 
              className={`${styles.catBtn} ${activeCategory === cat.id ? styles.activeCat : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              <cat.icon size={20} /> {cat.name}
            </button>
          ))}
        </div>
        
        <div className={styles.menuGrid}>
          {menu.length === 0 && !error && <p>No menu items found. Please add them from the API or database.</p>}
          <AnimatePresence>
            {filteredMenu.map((item, i) => (
              <motion.button
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileTap={{ scale: 0.95 }}
                className={styles.menuItem}
                style={{ '--item-bg': item.color }}
                onClick={() => addToTicket(item)}
              >
                <span className={styles.itemName}>{item.name}</span>
                <span className={styles.itemPrice}>₹{(item.price || 0).toFixed(2)}</span>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Ticket Section (Right) */}
      <div className={styles.ticketSection}>
        <div className={styles.ticketHeader}>
          <h2>Current Ticket</h2>
          <div className={styles.tableSelector}>
            <Grid3x3 size={18} />
            <select 
              value={selectedTable} 
              onChange={e => setSelectedTable(e.target.value)}
              className={styles.select}
            >
              <option value="" disabled>Select Table...</option>
              {tables.map(t => <option key={t.id} value={t.id}>{t.tableNumber}</option>)}
            </select>
          </div>
        </div>

        <div className={styles.ticketItems}>
          {ticket.length === 0 ? (
            <div className={styles.emptyTicket}>Tap items to add to order</div>
          ) : (
            <AnimatePresence>
              {ticket.map(item => (
                <motion.div 
                  key={item.id} 
                  layout 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={styles.ticketItem}
                >
                  <div className={styles.ticketItemInfo}>
                    <span className={styles.ticketItemName}>{item.name}</span>
                    <span className={styles.ticketItemPrice}>₹{(item.price * item.qty).toFixed(2)}</span>
                  </div>
                  <div className={styles.qtyControls}>
                    <button onClick={() => updateQty(item.id, -1)} className={styles.qtyBtn}><Minus size={14}/></button>
                    <span className={styles.qtyVal}>{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className={styles.qtyBtn}><Plus size={14}/></button>
                    <button onClick={() => removeItem(item.id)} className={styles.removeBtn}><Trash2 size={16}/></button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        <div className={styles.ticketFooter}>
          <div className={styles.totalRow}>
            <span>Total:</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
          <button 
            className={styles.sendBtn}
            onClick={placeOrder}
            disabled={ticket.length === 0 || !selectedTable || submitting}
          >
            <Send size={20} /> {submitting ? 'Sending...' : 'Send to Kitchen'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;
