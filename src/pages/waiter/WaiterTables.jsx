import React, { useState, useEffect, useCallback } from 'react';
import { Utensils, Coffee, CheckCircle, Clock, CreditCard } from 'lucide-react';
import api from '../../api';

const WaiterTables = () => {
  const [assignedTables, setAssignedTables] = useState([]);
  const [tableOrders, setTableOrders] = useState({}); // tableNumber -> orders array
  const [loading, setLoading] = useState(true);

  const empId = localStorage.getItem('username') || localStorage.getItem('employeeId') || '';

  const loadData = useCallback(async () => {
    try {
      // Load all tables from API
      const allTables = await api.get('/tables');
      const deletedIds = (JSON.parse(localStorage.getItem('deletedTableIds') || '[]')).map(String);
      const assignments = JSON.parse(localStorage.getItem('tableWaiterAssignments') || '{}');

      const myTables = (allTables || [])
        .filter(t => !deletedIds.includes(String(t.id)))
        .map(t => ({
          id: t.id,
          number: t.tableNumber || String(t.id),
          capacity: t.capacity || 4,
          status: t.status === 'AVAILABLE' ? 'Available'
                : t.status === 'OCCUPIED' ? 'Customer Dining'
                : t.status === 'CLEANING' ? 'Needs Cleaning' : t.status,
          assignedWaiter: assignments[t.id] || t.assignedWaiter || ''
        }));

      setAssignedTables(myTables);

      // Load active orders from API
      const activeRes = await api.get('/orders/active');
      const ordersByTable = {};
      (activeRes || []).forEach(order => {
        const tn = String(order.tableNumber || order.tableId || '');
        if (!ordersByTable[tn]) ordersByTable[tn] = [];
        ordersByTable[tn].push({
          id: order.id.toString(),
          status: order.status,
          items: (order.items || []).map(i => ({ name: i.itemName, qty: i.quantity, price: i.price })),
          total: order.totalAmount || 0
        });
      });
      setTableOrders(ordersByTable);
    } catch (err) {
      console.error('Failed to load waiter tables:', err);
    } finally {
      setLoading(false);
    }
  }, [empId]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleSendForBilling = async (table) => {
    try {
      // Patch table status to CLEANING (awaiting cashier)
      await api.patch(`/tables/${table.id}/status?status=CLEANING`).catch(() => {});

      // Create a bill via API
      const orders = tableOrders[table.number] || [];
      const readyOrders = orders.filter(o => ['READY', 'SERVED', 'COMPLETED'].includes(o.status));
      const total = readyOrders.reduce((sum, o) => sum + (o.total || 0), 0);

      try {
        if (readyOrders.length > 0) {
          await api.post('/bills', {
            orderId: readyOrders[0].id
          });
        }
      } catch (e) {
        console.warn('Bill API not available, storing locally:', e.message);
        // Fallback: write to cashierPending in localStorage
        const storedPending = JSON.parse(localStorage.getItem('cashierPending') || '[]');
        const alreadyExists = storedPending.some(b => b.tableNumber === table.number);
        if (!alreadyExists) {
          const items = readyOrders.flatMap(o => o.items.map(i => ({ name: i.name, qty: i.qty, price: i.price })));
          storedPending.unshift({
            id: `B-${Date.now()}`,
            tableId: table.id,
            tableNumber: table.number,
            table: `Table ${table.number}`,
            items: items.length > 0 ? items : [{ name: 'Assorted Items', qty: 1, price: total || 500 }],
            total: total || 500,
            status: 'pending'
          });
          localStorage.setItem('cashierPending', JSON.stringify(storedPending));
        }
      }

      await loadData();
    } catch (err) {
      console.error('Failed to send billing request', err);
    }
  };

  const handleMarkCleaned = async (table) => {
    try {
      await api.patch(`/tables/${table.id}/status?status=AVAILABLE`);
      await loadData();
    } catch (err) {
      console.error('Failed to mark table clean:', err);
    }
  };

  const occupiedTables = assignedTables.filter(t =>
    t.status === 'Customer Dining' || t.status === 'Needs Cleaning' || t.status === 'CLEANING'
  );
  const availableTables = assignedTables.filter(t => t.status === 'Available');

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col">
      <header className="mb-6 flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">My Tables</h1>
          <p className="text-sm text-gray-500 font-medium">{occupiedTables.length} occupied · {availableTables.length} available</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Occupied / Active Tables */}
        <div>
          <h2 className="text-md font-bold text-gray-700 mb-3 flex items-center gap-2">
            <Utensils size={18} className="text-orange-500" /> Active Tables
          </h2>
          {occupiedTables.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border border-gray-100 shadow-sm">
              <Coffee size={36} className="text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No occupied tables right now</p>
            </div>
          ) : (
            <div className="space-y-4">
              {occupiedTables.map(table => {
                const orders = tableOrders[table.number] || [];
                const readyOrders = orders.filter(o => o.status === 'READY' || o.status === 'SERVED');
                const pendingOrders = orders.filter(o => ['PENDING','CONFIRMED','PREPARING'].includes(o.status));
                const isCleaning = table.status === 'Needs Cleaning' || table.status === 'CLEANING';
                return (
                  <div key={table.id} className={`bg-white rounded-xl p-4 border-2 shadow-sm ${isCleaning ? 'border-purple-300' : readyOrders.length > 0 ? 'border-green-300' : 'border-orange-200'}`}>
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <span className="font-bold text-gray-900">Table {table.number}</span>
                        <span className={`ml-2 px-2 py-0.5 text-xs rounded-full font-semibold ${isCleaning ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                          {isCleaning ? 'Needs Cleaning' : 'Dining'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">{table.capacity} seats</span>
                    </div>

                    {readyOrders.length > 0 && (
                      <div className="bg-green-50 rounded-lg p-2 mb-3 text-sm text-green-700 font-medium flex items-center gap-2">
                        <CheckCircle size={14} /> {readyOrders.length} order(s) ready to serve!
                      </div>
                    )}
                    {pendingOrders.length > 0 && (
                      <div className="bg-yellow-50 rounded-lg p-2 mb-3 text-sm text-yellow-700 flex items-center gap-2">
                        <Clock size={14} /> {pendingOrders.length} order(s) in kitchen
                      </div>
                    )}

                    <div className="flex gap-2 mt-2">
                      {!isCleaning && (
                        <button onClick={() => handleSendForBilling(table)}
                          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1">
                          <CreditCard size={14} /> Send for Billing
                        </button>
                      )}
                      {isCleaning && (
                        <button onClick={() => handleMarkCleaned(table)}
                          className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg text-sm font-semibold">
                          ✓ Mark as Cleaned
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Available Tables */}
        <div>
          <h2 className="text-md font-bold text-gray-700 mb-3 flex items-center gap-2">
            <Coffee size={18} className="text-green-500" /> Available Tables
          </h2>
          {availableTables.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border border-gray-100 shadow-sm">
              <p className="text-gray-400 text-sm">All tables are occupied</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {availableTables.map(table => (
                <div key={table.id} className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <p className="font-bold text-green-800 text-lg">T-{table.number.replace('T-','')}</p>
                  <p className="text-xs text-green-600">{table.capacity} seats</p>
                  <span className="mt-1 inline-block px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-semibold">Available</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WaiterTables;
