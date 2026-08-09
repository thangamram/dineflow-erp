import React, { useEffect, useState, useCallback } from 'react';
import api from '../../api';
import { BellRing, ChefHat, CheckCircle, Clock, Coffee } from 'lucide-react';

const WaiterOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const activeRes = await api.get('/orders/active');
      const mapped = (activeRes || []).map(bo => ({
        id: bo.id.toString(),
        tableNumber: bo.tableNumber || bo.tableId || '?',
        status: bo.status,
        remarks: bo.remarks,
        items: (bo.items || []).map(bi => ({
          name: bi.itemName,
          quantity: bi.quantity,
          price: bi.price
        })),
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
    fetchOrders();
    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      await fetchOrders();
    } catch (err) {
      console.error('Failed to update order status:', err);
      // Optimistic update
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    }
  };

  const statusColor = (status) => {
    switch(status) {
      case 'PENDING': return 'bg-gray-100 text-gray-600';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-700';
      case 'PREPARING': return 'bg-yellow-100 text-yellow-700';
      case 'READY': return 'bg-green-100 text-green-700';
      case 'SERVED': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  const readyOrders = orders.filter(o => o.status === 'READY');
  const activeOrders = orders.filter(o => ['PENDING', 'CONFIRMED', 'PREPARING'].includes(o.status));
  const servedOrders = orders.filter(o => o.status === 'SERVED');

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="mb-6 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-black text-gray-900">Live Orders</h1>
        <p className="text-sm text-gray-500">{readyOrders.length} ready · {activeOrders.length} in kitchen · {servedOrders.length} served</p>
      </header>

      {/* Ready to Serve — urgent section */}
      {readyOrders.length > 0 && (
        <div className="mb-6">
          <h2 className="text-md font-bold text-orange-700 mb-3 flex items-center gap-2">
            <BellRing size={18} className="text-orange-500" /> 🔔 Ready to Serve
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {readyOrders.map(order => (
              <div key={order.id} className="bg-orange-50 border-2 border-orange-400 rounded-xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-bold text-orange-800">Table {order.tableNumber}</span>
                    <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-bold">READY</span>
                  </div>
                  <span className="text-xs text-gray-500">{order.time}</span>
                </div>
                <ul className="text-sm text-gray-700 mb-3 space-y-1">
                  {order.items.map((item, i) => (
                    <li key={i}>• {item.name} × {item.quantity}</li>
                  ))}
                </ul>
                <div className="flex justify-between items-center text-sm font-bold text-gray-700 mb-3">
                  <span>Total: ₹{order.total.toFixed(2)}</span>
                </div>
                <button onClick={() => updateOrderStatus(order.id, 'SERVED')}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-colors">
                  <CheckCircle size={16} /> Mark as Served
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* In Kitchen */}
      <div className="mb-6">
        <h2 className="text-md font-bold text-gray-700 mb-3 flex items-center gap-2">
          <ChefHat size={18} className="text-blue-500" /> In Kitchen
        </h2>
        {activeOrders.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center border border-gray-100 shadow-sm">
            <Coffee size={32} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No orders currently being prepared</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeOrders.map(order => (
              <div key={order.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-bold text-gray-800">Table {order.tableNumber}</span>
                    <span className={`ml-2 px-2 py-0.5 text-xs rounded-full font-semibold ${statusColor(order.status)}`}>{order.status}</span>
                  </div>
                  <span className="text-xs text-gray-400">{order.time}</span>
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

      {/* Served Orders */}
      {servedOrders.length > 0 && (
        <div>
          <h2 className="text-md font-bold text-gray-700 mb-3 flex items-center gap-2">
            <CheckCircle size={18} className="text-green-500" /> Served
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {servedOrders.map(order => (
              <div key={order.id} className="bg-green-50 rounded-xl p-4 border border-green-200 shadow-sm opacity-75">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold text-green-800">Table {order.tableNumber}</span>
                  <span className="text-xs text-gray-400">{order.time}</span>
                </div>
                <ul className="text-sm text-green-700 space-y-1">
                  {order.items.map((item, i) => (
                    <li key={i}>✓ {item.name} × {item.quantity}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WaiterOrders;
