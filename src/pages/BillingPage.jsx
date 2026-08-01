import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Receipt, CheckCircle, CreditCard, ChevronRight, AlertCircle, FileText } from 'lucide-react';
import api from '../api';
import styles from './PageCommon.module.css';

const BillingPage = () => {
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [currentBill, setCurrentBill] = useState(null);
  const [processing, setProcessing] = useState(false);

  const fetchOrders = () => {
    api.get('/orders/active')
      .then(d => {
        const orders = Array.isArray(d) ? d : d?.content || [];
        // Only show orders that are not fully closed/cancelled
        setActiveOrders(orders.filter(o => !['CLOSED', 'CANCELLED'].includes(o.status)));
      })
      .catch(err => setError('Failed to fetch active orders'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // 10s polling
    return () => clearInterval(interval);
  }, []);

  const generateBill = async (orderId) => {
    setProcessing(true);
    setError('');
    try {
      const res = await api.post('/bills', { orderId });
      setCurrentBill(res);
    } catch (err) {
      console.error(err);
      
      // If bill already exists, try fetching it
      if (err.response?.status === 400 && err.response?.data?.message?.includes('already generated')) {
         try {
           const billRes = await api.get(`/bills/order/${orderId}`);
           setCurrentBill(billRes);
         } catch (fetchErr) {
           setError('Failed to fetch existing bill.');
         }
      } else {
        setError(err.response?.data?.message || 'Failed to generate bill');
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
    setCurrentBill(null);
  };

  const markAsPaid = async () => {
    if (!currentBill) return;
    setProcessing(true);
    try {
      await api.post(`/bills/${currentBill.id}/mark-paid`);
      alert('Payment successful!');
      setCurrentBill({ ...currentBill, status: 'PAID' });
      fetchOrders(); // refresh active list
      setSelectedOrder(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  if (loading && activeOrders.length === 0) return <div className={styles.loading}><div className={styles.spinner}></div></div>;

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 120px)', gap: '20px' }}>
      {/* Left: Active Orders List */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}><Receipt size={20}/> Active Orders</h2>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
          {activeOrders.length === 0 ? (
             <div className={styles.empty}>No active orders found</div>
          ) : (
            activeOrders.map(order => (
              <div 
                key={order.id}
                onClick={() => handleSelectOrder(order)}
                style={{
                  padding: '16px', margin: '8px', borderRadius: 'var(--radius-md)',
                  background: selectedOrder?.id === order.id ? 'var(--bg-hover)' : 'var(--bg-primary)',
                  border: `1px solid ${selectedOrder?.id === order.id ? 'var(--accent)' : 'var(--border)'}`,
                  cursor: 'pointer', transition: '0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>Order #{order.orderNumber || order.id} - {order.tableNumber || 'Table'}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Status: {order.status}</div>
                </div>
                <div style={{ fontWeight: 600, color: 'var(--accent)' }}>₹{(order.totalAmount || 0).toFixed(2)}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right: Billing Panel */}
      <div style={{ flex: 1, background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '20px', display: 'flex', flexDirection: 'column' }}>
        {error && <div className={styles.error}><AlertCircle size={16}/> {error}</div>}
        
        {!selectedOrder ? (
          <div className={styles.empty} style={{ margin: 'auto' }}>
            <FileText size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
            <p>Select an order to generate or view its bill</p>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ borderBottom: '1px dashed var(--border)', paddingBottom: '20px', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>Table {selectedOrder.tableNumber}</h2>
              <p style={{ color: 'var(--text-secondary)' }}>Order #{selectedOrder.orderNumber || selectedOrder.id}</p>
            </div>
            
            {!currentBill ? (
              <div style={{ margin: 'auto', textAlign: 'center' }}>
                <button 
                  className={styles.saveBtn} 
                  onClick={() => generateBill(selectedOrder.id)}
                  disabled={processing}
                >
                  {processing ? 'Generating...' : 'Generate Bill'}
                </button>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Item Total</span>
                    <span>₹{currentBill.itemTotal?.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Service Charge</span>
                    <span>₹{currentBill.serviceCharge?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>GST / Tax</span>
                    <span>₹{currentBill.gstAmount?.toFixed(2) || '0.00'}</span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)', fontSize: '20px', fontWeight: 700 }}>
                    <span>Grand Total</span>
                    <span>₹{currentBill.grandTotal?.toFixed(2)}</span>
                  </div>
                  
                  <div style={{ marginTop: '24px', padding: '12px', background: currentBill.status === 'PAID' ? 'var(--success-bg)' : 'var(--warning-bg)', color: currentBill.status === 'PAID' ? 'var(--success)' : 'var(--warning)', borderRadius: 'var(--radius-md)', textAlign: 'center', fontWeight: 600 }}>
                    Status: {currentBill.status}
                  </div>
                </div>
                
                {currentBill.status !== 'PAID' && (
                  <button 
                    style={{ width: '100%', padding: '16px', background: 'var(--success)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontSize: '16px', fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                    onClick={markAsPaid}
                    disabled={processing}
                  >
                    <CreditCard size={20} /> {processing ? 'Processing...' : 'Mark as Paid'}
                  </button>
                )}
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingPage;
