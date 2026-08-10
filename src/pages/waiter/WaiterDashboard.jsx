import React, { useEffect, useState, useCallback } from 'react';
import api from '../../api';
import { CheckCircle, ChefHat, Clock, Utensils, BellRing, Coffee, RefreshCw } from 'lucide-react';

const WaiterDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [assignedTables, setAssignedTables] = useState([]);
  const [loading, setLoading] = useState(true);

  const empId = localStorage.getItem('username') || localStorage.getItem('employeeId') || '';

  // Load tables assigned to this waiter from API
  const fetchTables = useCallback(async () => {
    try {
      const allTables = await api.get('/tables');

      const myTables = (allTables || [])
        .map(t => ({
          id: t.id,
          number: t.tableNumber || String(t.id),
          capacity: t.capacity || 4,
          status: t.status === 'AVAILABLE' ? 'Available'
                : t.status === 'OCCUPIED' ? 'Customer Dining' : 'Needs Cleaning',
          assignedWaiter: t.assignedWaiter || ''
        }))
        .filter(t => !empId || t.assignedWaiter === empId || t.assignedWaiter === '');

      setAssignedTables(myTables);
      return myTables;
    } catch (err) {
      console.error('Failed to fetch tables', err);
      return [];
    }
  }, [empId]);

  const fetchOrders = useCallback(async () => {
    try {
      const activeRes = await api.get('/orders/active');
      const mapped = (activeRes || []).map(bo => ({
        id: bo.id.toString(),
        tableNumber: bo.tableNumber || bo.tableId || '?',
        status: bo.status,
        remarks: bo.remarks,
        items: (bo.items || []).map(bi => ({ name: bi.itemName, quantity: bi.quantity, price: bi.price })),
        total: bo.totalAmount || 0,
        time: bo.placedAt ? new Date(bo.placedAt).toLocaleTimeString() : new Date().toLocaleTimeString()
      }));
      setOrders(mapped);
    } catch (err) {
      console.error('Failed to fetch orders from API:', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      await fetchTables();
      await fetchOrders();
    };
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [fetchTables, fetchOrders]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      try {
        await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      } catch (err) {
        if (newStatus === 'SERVED') {
           // Fallback to DELIVERED for older backend versions that don't have SERVED in the enum
           await api.patch(`/orders/${orderId}/status`, { status: 'DELIVERED' });
        } else {
           throw err;
        }
      }
      await fetchOrders();
    } catch (err) {
      console.error('Failed to update order status', err);
    }
  };

  const readyOrders = orders.filter(o => o.status === 'READY');
  const activeOrders = orders.filter(o => ['PENDING', 'CONFIRMED', 'PREPARING'].includes(o.status));
  const occupiedTables = assignedTables.filter(t => t.status === 'Customer Dining');

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="mb-6 bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Waiter Dashboard</h1>
          <p className="text-sm text-gray-500">Welcome, {empId || 'Waiter'} — Live orders &amp; table status</p>
        </div>
        <button onClick={() => { fetchTables(); fetchOrders(); }}
          className="flex items-center gap-2 text-sm bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors">
          <RefreshCw size={16} /> Refresh
        </button>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
            <BellRing className="text-orange-500" size={24} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{readyOrders.length}</p>
            <p className="text-sm text-gray-500">Ready to Serve</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Clock className="text-blue-500" size={24} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{activeOrders.length}</p>
            <p className="text-sm text-gray-500">Orders in Kitchen</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <Utensils className="text-green-500" size={24} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{occupiedTables.length}</p>
            <p className="text-sm text-gray-500">Occupied Tables</p>
          </div>
        </div>
      </div>

      {/* Ready to Serve — urgent */}
      {readyOrders.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <BellRing className="text-orange-500" size={20} /> Ready to Serve
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {readyOrders.map(order => (
              <div key={order.id} className="bg-orange-50 border-2 border-orange-300 rounded-xl p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="font-bold text-orange-700">Table {order.tableNumber}</span>
                    <span className="ml-2 px-2 py-0.5 bg-orange-200 text-orange-700 text-xs rounded-full font-semibold">READY</span>
                  </div>
                  <span className="text-xs text-gray-500">{order.time}</span>
                </div>
                <ul className="text-sm text-gray-700 mb-3 space-y-1">
                  {order.items.map((item, i) => (
                    <li key={i}>• {item.name} × {item.quantity}</li>
                  ))}
                </ul>
                <button onClick={() => updateOrderStatus(order.id, 'SERVED')}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2">
                  <CheckCircle size={16} /> Mark as Served
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Orders */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
          <ChefHat className="text-blue-500" size={20} /> Orders in Kitchen
        </h2>
        {activeOrders.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-gray-100 shadow-sm">
            <Coffee size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No active orders right now</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeOrders.map(order => (
              <div key={order.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="font-bold text-gray-800">Table {order.tableNumber}</span>
                    <span className={`ml-2 px-2 py-0.5 text-xs rounded-full font-semibold ${
                      order.status === 'PREPARING' ? 'bg-yellow-100 text-yellow-700'
                      : order.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600'
                    }`}>{order.status}</span>
                  </div>
                  <span className="text-xs text-gray-500">{order.time}</span>
                </div>
                <ul className="text-sm text-gray-600 space-y-1">
                  {order.items.map((item, i) => (
                    <li key={i}>• {item.name} × {item.quantity}</li>
                  ))}
                </ul>
                {order.remarks && <p className="text-xs text-gray-400 mt-2 italic">Note: {order.remarks}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WaiterDashboard;
