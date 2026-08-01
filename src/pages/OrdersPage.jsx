import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Trash2, Send, Coffee, Pizza, Utensils, Grid3x3 } from 'lucide-react';
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
  const [activeCategory, setActiveCategory] = useState('all');
  
  // POS State
  const [ticket, setTicket] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');

  useEffect(() => {
    // Simulated fetch
    setTimeout(() => {
      setMenu([
        { id: 1, name: 'Margherita Pizza', price: 12.99, category: 'mains', color: '#fca5a5' },
        { id: 2, name: 'Pepperoni Pizza', price: 14.99, category: 'mains', color: '#fca5a5' },
        { id: 3, name: 'Pasta Alfredo', price: 11.50, category: 'mains', color: '#fcd34d' },
        { id: 4, name: 'Veggie Burger', price: 9.99, category: 'mains', color: '#86efac' },
        { id: 5, name: 'Coke', price: 2.50, category: 'drinks', color: '#93c5fd' },
        { id: 6, name: 'Lemonade', price: 3.00, category: 'drinks', color: '#fde047' },
        { id: 7, name: 'Iced Tea', price: 2.75, category: 'drinks', color: '#d8b4fe' },
        { id: 8, name: 'Garlic Bread', price: 4.50, category: 'mains', color: '#fdba74' },
      ]);
      setTables(['T-01', 'T-02', 'T-03', 'T-04', 'T-05', 'Takeaway']);
      setLoading(false);
    }, 500);
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

  const placeOrder = () => {
    if (!selectedTable) return alert('Please select a table');
    if (ticket.length === 0) return alert('Ticket is empty');
    alert(`Order sent to kitchen for ${selectedTable}!`);
    setTicket([]);
    setSelectedTable('');
  };

  const filteredMenu = activeCategory === 'all' ? menu : menu.filter(m => m.category === activeCategory);
  const total = ticket.reduce((sum, item) => sum + (item.price * item.qty), 0);

  if (loading) return <div className={pageStyles.loading}><div className={pageStyles.spinner}></div></div>;

  return (
    <div className={styles.posContainer}>
      {/* Menu Section (Left) */}
      <div className={styles.menuSection}>
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
                <span className={styles.itemPrice}>₹{item.price.toFixed(2)}</span>
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
              {tables.map(t => <option key={t} value={t}>{t}</option>)}
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
            disabled={ticket.length === 0 || !selectedTable}
          >
            <Send size={20} /> Send to Kitchen
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;
