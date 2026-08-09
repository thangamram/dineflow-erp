import React, { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from '../../contexts/WebSocketContext';
import api from '../../api';
import { CreditCard, DollarSign, Receipt, TrendingUp, RefreshCw, X, Check, Printer, Mail, ChevronRight } from 'lucide-react';

// ====== BILL PREVIEW MODAL ======
const BillPreviewModal = ({ bill, onClose, onConfirm }) => {
  if (!bill) return null;
  const subtotal = bill.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const gst = Math.round(subtotal * 0.05);
  const serviceCharge = Math.round(subtotal * 0.05);
  const total = subtotal + gst + serviceCharge;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-blue-600 text-white p-5 flex justify-between items-center">
          <h3 className="text-xl font-bold">Bill Preview</h3>
          <button onClick={onClose} className="hover:bg-blue-500 p-1 rounded-lg transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-bold text-gray-900">{bill.table}</span>
            <span className="text-sm text-gray-500">Session #{bill.sessionId || '102'}</span>
          </div>
          <div className="space-y-3 mb-6">
            {bill.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm">
                <div><span className="font-semibold text-gray-900">{item.name}</span> <span className="text-gray-500">×{item.qty}</span></div>
                <span className="font-bold text-gray-900">₹{item.price * item.qty}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 pt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-semibold">₹{subtotal}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">GST (5%)</span><span className="font-semibold">₹{gst}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Service Charge (5%)</span><span className="font-semibold">₹{serviceCharge}</span></div>
          </div>
          <div className="border-t-2 border-gray-900 mt-4 pt-4 flex justify-between items-center">
            <span className="text-lg font-bold text-gray-900">Total</span>
            <span className="text-2xl font-black text-gray-900">₹{total}</span>
          </div>
        </div>
        <div className="p-5 bg-gray-50 border-t">
          <button onClick={() => onConfirm({ ...bill, total, gst, serviceCharge })}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-base transition-colors shadow-sm flex items-center justify-center gap-2">
            <Check size={20} /> Confirm Bill
          </button>
        </div>
      </div>
    </div>
  );
};

// ====== PAYMENT MODAL ======
const PaymentModal = ({ bill, onClose, onPay }) => {
  const [selectedMethod, setSelectedMethod] = useState(bill?.customerPreferredMethod || 'Cash');

  if (!bill) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-green-600 text-white p-5 flex justify-between items-center">
          <h3 className="text-xl font-bold">Confirm Payment Received</h3>
          <button onClick={onClose} className="hover:bg-green-500 p-1 rounded-lg transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6">
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl mb-6">
            <span className="font-semibold text-gray-700">{bill.table}</span>
            <span className="text-2xl font-black text-gray-900">₹{bill.total}</span>
          </div>
          
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-600 mb-3 text-center">Select Payment Method</p>
            <div className="grid grid-cols-3 gap-3">
              {['Cash', 'Card', 'UPI'].map(method => (
                <button 
                  key={method}
                  onClick={() => setSelectedMethod(method)}
                  className={`py-3 rounded-xl font-bold transition-colors ${selectedMethod === method ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-blue-400'}`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="p-5 bg-gray-50 border-t">
          <button onClick={() => onPay(bill.id, selectedMethod, bill.total)}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold text-base transition-colors shadow-sm flex items-center justify-center gap-2">
            <DollarSign size={20} /> Confirm Payment
          </button>
        </div>
      </div>
    </div>
  );
};

// ====== POST-PAYMENT MODAL ======
const PostPaymentModal = ({ bill, onComplete }) => {
  if (!bill) return null;
  const [eBillSent, setEBillSent] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-center">
        <div className="bg-green-500 text-white p-8">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={32} />
          </div>
          <h3 className="text-2xl font-bold">Payment Successful!</h3>
          <p className="text-green-100 mt-2">{bill.table} • ₹{bill.total} • {bill.paymentMethod}</p>
        </div>
        <div className="p-6 space-y-3">
          <button onClick={() => setEBillSent(true)}
            className={`w-full py-3 rounded-xl font-bold text-base transition-colors flex items-center justify-center gap-2 ${eBillSent ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'}`}
            disabled={eBillSent}>
            <Mail size={18} /> {eBillSent ? 'E-Bill Sent ✓' : 'Send E-Bill'}
          </button>
          <button onClick={() => window.print()}
            className="w-full bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 py-3 rounded-xl font-bold text-base transition-colors flex items-center justify-center gap-2">
            <Printer size={18} /> Print Receipt
          </button>
          <button onClick={() => onComplete(bill)}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold text-base transition-colors shadow-sm flex items-center justify-center gap-2">
            <ChevronRight size={18} /> Complete Transaction
          </button>
        </div>
      </div>
    </div>
  );
};

// ====== MAIN CASHIER DASHBOARD ======
export default function BillingDashboard() {
  const { subscribeToTopic, connected } = useWebSocket();
  const [pendingBills, setPendingBills] = useState([]);
  const [paidBills, setPaidBills] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [previewBill, setPreviewBill] = useState(null);
  const [paymentBill, setPaymentBill] = useState(null);
  const [completedBill, setCompletedBill] = useState(null);

  const fetchBills = useCallback(async () => {
    try {
      // Get all active orders — show SERVED and READY (ready for billing)
      const activeRes = await api.get('/orders/active');
      const billingOrders = (activeRes || [])
        .filter(o => ['READY', 'SERVED', 'DELIVERED', 'COMPLETED'].includes(o.status))
        .map(bo => ({
          id: bo.id,
          table: `Table ${bo.tableNumber || bo.tableId || '?'}`,
          tableNumber: bo.tableNumber || bo.tableId,
          tableId: bo.tableId,
          sessionId: bo.orderNumber || bo.id,
          status: 'pending',
          items: (bo.items || []).map(bi => ({
            name: bi.itemName || bi.name || 'Item',
            qty: bi.quantity || 1,
            price: Number(bi.unitPrice || bi.price || 0)
          }))
        }));

      // Also include tables in CLEANING state (waiter sent them for billing)
      const allTables = await api.get('/tables').catch(() => []);
      const deletedIds = (JSON.parse(localStorage.getItem('deletedTableIds') || '[]')).map(String);
      const cleaningTables = (allTables || [])
        .filter(t => t.status === 'CLEANING' && !deletedIds.includes(String(t.id)));

      // Merge: add any cleaning table not already in billingOrders
      cleaningTables.forEach(t => {
        const alreadyIn = billingOrders.some(b => String(b.tableNumber) === String(t.tableNumber));
        if (!alreadyIn) {
          billingOrders.push({
            id: `tbl-${t.id}`,
            table: `Table ${t.tableNumber}`,
            tableNumber: t.tableNumber,
            tableId: t.id,
            sessionId: `T-${t.tableNumber}`,
            status: 'pending',
            items: [{ name: 'Items from waiter', qty: 1, price: 0 }]
          });
        }
      });

      // Also merge any pending bills stored locally by waiter (fallback)
      const localPending = JSON.parse(localStorage.getItem('cashierPending') || '[]');
      localPending.forEach(lb => {
        const alreadyIn = billingOrders.some(b => String(b.tableNumber) === String(lb.tableNumber || lb.table?.replace('Table ', '')));
        if (!alreadyIn) billingOrders.push(lb);
      });

      setPendingBills(billingOrders);
      setLoading(false);

      // Fetch paid bills from API
      const allBillsPage = await api.get('/bills?size=50').catch(() => null);
      if (allBillsPage && allBillsPage.content) {
        const paid = allBillsPage.content
          .filter(b => b.status === 'PAID')
          .map(b => ({
            id: b.id,
            table: `Table ${b.tableNumber || b.customerId || '?'}`,
            total: b.grandTotal || 0,
            paymentMethod: b.paymentMethod || 'Paid',
            paidAt: b.generatedAt
          }));
        setPaidBills(paid);
      }
    } catch (err) {
      console.error('Failed to fetch bills', err);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBills();
    const interval = setInterval(fetchBills, 3000); // auto-refresh every 3s
    window.addEventListener('storage', fetchBills);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', fetchBills);
    };
  }, [fetchBills]);


  // WebSocket: listen for new billing requests from waiters
  useEffect(() => {
    if (!connected) return;
    const sub = subscribeToTopic('/topic/billing', (msg) => {
      const newBill = msg.bill || msg;
      if (newBill && newBill.status === 'pending') {
        setPendingBills(prev => {
          const updated = [newBill, ...prev];
          localStorage.setItem('cashierPending', JSON.stringify(updated));
          return updated;
        });
      }
    });
    return () => { if (sub) sub.unsubscribe(); };
  }, [connected, subscribeToTopic]);

  // Step 1: Generate Bill → show preview
  const handleGenerateBill = (bill) => {
    setPreviewBill(bill);
  };

  // Step 2: Confirm Bill → show payment
  const handleConfirmBill = async (confirmedBill) => {
    try {
      const res = await api.post('/bills', { orderId: Number(confirmedBill.id) });
      setPreviewBill(null);
      setPaymentBill({
        ...confirmedBill,
        billId: res.id,
        total: res.grandTotal,
        gst: res.gstAmount,
        serviceCharge: res.serviceCharge
      });
    } catch (err) {
      console.error('Failed to generate bill on backend:', err);
      alert('Failed to generate bill on backend: ' + (err.response?.data?.message || err.message));
    }
  };

  // Step 3: Confirm Payment → show post-payment
  const handlePayBill = async (billId, method, amount) => {
    const activeBillId = paymentBill.billId || billId;
    try {
      await api.post(`/bills/${activeBillId}/mark-paid`);
      
      const bill = pendingBills.find(b => b.id === paymentBill.id);
      if (bill) {
        const paidBill = { ...bill, status: 'paid', paymentMethod: method, total: amount, paidAt: new Date().toISOString() };
        setPaidBills(prev => [paidBill, ...prev]);
        setPendingBills(prev => prev.filter(b => b.id !== paymentBill.id));
      }
      
      setPaymentBill(null);
      setCompletedBill({ ...paymentBill, paymentMethod: method });
    } catch (err) {
      console.error('Failed to settle payment on backend:', err);
      alert('Failed to settle payment on backend: ' + (err.response?.data?.message || err.message));
    }
  };

  // Step 4: Complete Transaction → update cross-portal state
  const handleCompleteTransaction = async (bill) => {
    setCompletedBill(null);
    try {
      if (bill.tableId) {
        await api.patch(`/tables/${bill.tableId}/status?status=AVAILABLE`).catch(() => {});
      }
      // Clear from local cashierPending too
      const localPending = JSON.parse(localStorage.getItem('cashierPending') || '[]');
      const filtered = localPending.filter(b =>
        String(b.tableNumber) !== String(bill.tableNumber) &&
        String(b.table) !== String(bill.table)
      );
      localStorage.setItem('cashierPending', JSON.stringify(filtered));
      fetchBills();
    } catch (e) {
      console.error(e);
    }
  };

  const todayRevenue = paidBills.reduce((sum, b) => sum + (b.total || 0), 0);

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      {/* Header */}
      <header className="mb-6 flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Cashier Portal</h1>
          <p className="text-sm text-gray-500 font-medium">Billing & Payment Management</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-bold border border-green-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Live Sync Active
          </div>
          <button onClick={fetchBills} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div><p className="text-sm text-gray-500 font-medium">Pending Bills</p><p className="text-2xl font-bold text-gray-900">{pendingBills.length}</p></div>
          <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-600"><Receipt size={20}/></div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div><p className="text-sm text-gray-500 font-medium">Paid Bills</p><p className="text-2xl font-bold text-gray-900">{paidBills.length}</p></div>
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600"><Check size={20}/></div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div><p className="text-sm text-gray-500 font-medium">Today's Revenue</p><p className="text-2xl font-bold text-gray-900">₹{todayRevenue.toLocaleString()}</p></div>
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><TrendingUp size={20}/></div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div><p className="text-sm text-gray-500 font-medium">Transactions</p><p className="text-2xl font-bold text-gray-900">{paidBills.length}</p></div>
          <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600"><CreditCard size={20}/></div>
        </div>
      </div>

      {/* Billing Queue */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
          <Receipt className="text-yellow-500" size={22} /> Billing Queue
          <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full font-bold">{pendingBills.length} Pending</span>
        </h2>

        {pendingBills.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Receipt size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-medium">No pending bills</p>
            <p className="text-sm mt-1">Waiting for waiters to mark tables as "Ready for Billing"</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {pendingBills.map(bill => (
              <div key={bill.id} className="border border-yellow-200 bg-yellow-50/30 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-black text-gray-900">{bill.table}</h3>
                    <p className="text-sm text-gray-500 font-medium">Customer: Session #{bill.sessionId || 'N/A'}</p>
                  </div>
                  <span className="bg-yellow-100 text-yellow-800 text-xs px-3 py-1 rounded-full font-bold">Ready for Billing</span>
                </div>
                <div className="mb-4">
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="text-2xl font-black text-gray-900">₹{bill.total?.toLocaleString()}</p>
                </div>
                <button onClick={() => handleGenerateBill(bill)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm flex items-center justify-center gap-2">
                  <Receipt size={16} /> Generate Bill
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {previewBill && <BillPreviewModal bill={previewBill} onClose={() => setPreviewBill(null)} onConfirm={handleConfirmBill} />}
      {paymentBill && <PaymentModal bill={paymentBill} onClose={() => setPaymentBill(null)} onPay={handlePayBill} />}
      {completedBill && <PostPaymentModal bill={completedBill} onComplete={handleCompleteTransaction} />}
    </div>
  );
}
