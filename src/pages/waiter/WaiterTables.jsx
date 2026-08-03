import React, { useState, useEffect } from 'react';
import { Utensils, Coffee } from 'lucide-react';
import api from '../../api';

const WaiterTables = () => {
  const [assignedTables, setAssignedTables] = useState([]);

  useEffect(() => {
    const loadTables = () => {
      const stored = localStorage.getItem('mockTables');
      if (stored) {
        const allTables = JSON.parse(stored);
        setAssignedTables(allTables);
      } else {
        setAssignedTables([]);
      }
    };
    loadTables();
    const interval = setInterval(loadTables, 2000);
    return () => clearInterval(interval);
  }, []);

  // Active dining: Tables that have customers seated
  const activeDiningTables = assignedTables.filter(t =>
    t.status === 'Occupied' ||
    t.status === 'Customer Dining' ||
    t.status === 'Waiting for Payment' ||
    t.status === 'Billing Requested' ||
    t.status === 'Paid / Needs Cleaning'
  );

  const handleSendForBilling = async (tableNumber) => {
    try {
      setAssignedTables(prev => {
        const updated = prev.map(t => t.number === tableNumber ? { ...t, status: 'Waiting for Payment' } : t);
        localStorage.setItem('mockTables', JSON.stringify(updated));
        return updated;
      });

      // Sync with Cashier: add a pending bill entry
      const storedPending = localStorage.getItem('cashierPending');
      const pendingBills = storedPending ? JSON.parse(storedPending) : [];
      const alreadyExists = pendingBills.some(b => b.table === `Table ${tableNumber}`);
      if (!alreadyExists) {
        const storedOrders = localStorage.getItem('mockOrders');
        let items = [];
        let subtotal = 0;
        if (storedOrders) {
          const allOrders = JSON.parse(storedOrders);
          const tableOrders = allOrders.filter(o => o.tableNumber === String(tableNumber) && (o.status === 'COMPLETED' || o.status === 'READY'));
          tableOrders.forEach(order => {
            order.items.forEach(item => {
              const price = item.price || (Math.floor(Math.random() * 200) + 100);
              items.push({ name: item.name, qty: item.quantity, price });
              subtotal += price * item.quantity;
            });
          });
        }
        if (items.length === 0) {
          items = [{ name: 'Assorted Items', qty: 1, price: 500 }];
          subtotal = 500;
        }

        const newBill = {
          id: `B-${Date.now()}`,
          orderId: `ORD-${1000 + Math.floor(Math.random() * 999)}`,
          table: `Table ${tableNumber}`,
          sessionId: String(100 + Math.floor(Math.random() * 99)),
          total: subtotal,
          status: 'pending',
          items,
        };
        const updatedPending = [newBill, ...pendingBills];
        localStorage.setItem('cashierPending', JSON.stringify(updatedPending));
      }

      await api.post('/api/v1/bills/request', { tableNumber });
    } catch (err) {
      console.error('Failed to send billing request', err);
    }
  };

  const handleMarkCleaned = (tableNumber) => {
    setAssignedTables(prev => {
      const updated = prev.map(t => t.number === tableNumber ? { ...t, status: 'Available' } : t);
      localStorage.setItem('mockTables', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col">
      <header className="mb-6 flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Tables</h1>
          <p className="text-sm text-gray-500 font-medium">Manage your assigned tables</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
            <Utensils className="text-blue-500" size={20} /> My Assigned Tables
          </h2>
          <div className="space-y-3">
            {assignedTables.map(table => (
              <div key={table.id} className="flex justify-between items-center p-3 rounded-lg bg-gray-50 border border-gray-100">
                <span className="font-semibold text-gray-800">Table {table.number}</span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  table.status === 'Available' ? 'bg-green-100 text-green-700' :
                  table.status === 'Preparing' ? 'bg-purple-100 text-purple-700' :
                  table.status === 'Ready' ? 'bg-yellow-100 text-yellow-700' :
                  table.status === 'Paid / Needs Cleaning' ? 'bg-red-100 text-red-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {table.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
            <Coffee className="text-orange-500" size={20} /> Active Dining Tables
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeDiningTables.map(table => (
              <div key={table.id} className="border border-gray-200 rounded-xl p-4 shadow-sm bg-orange-50/30">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-bold text-lg">Table {table.number}</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    table.status === 'Paid / Needs Cleaning' ? 'bg-green-100 text-green-700' :
                    table.status === 'Waiting for Payment' || table.status === 'Billing Requested' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {table.status === 'Waiting for Payment' || table.status === 'Billing Requested' ? 'Waiting for Cashier' :
                     table.status === 'Paid / Needs Cleaning' ? '✓ Paid - Needs Cleaning' : 'Customer Dining'}
                  </span>
                </div>
                <div className="flex gap-2">

                  {/* STEP 3: Payment confirmed → Waiter cleans and marks Available */}
                  {table.status === 'Paid / Needs Cleaning' ? (
                    <button
                      onClick={() => handleMarkCleaned(table.number)}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-lg text-sm font-bold shadow-sm transition-colors"
                    >
                      ✓ Cleaned / Mark Available
                    </button>

                  /* STEP 2: Bill sent → Waiting for cashier to process */
                  ) : table.status === 'Waiting for Payment' || table.status === 'Billing Requested' ? (
                    <button disabled className="w-full bg-gray-200 text-gray-500 py-2.5 rounded-lg text-sm font-bold shadow-sm cursor-not-allowed">
                      ⏳ Waiting for Cashier...
                    </button>

                  /* STEP 1: Customer is dining → Only "Send for Billing" is available */
                  ) : (
                    <button
                      onClick={() => handleSendForBilling(table.number)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm"
                    >
                      Send for Billing
                    </button>
                  )}

                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaiterTables;
