import React, { useEffect, useState, useCallback } from 'react';
import { useWebSocket } from '../../contexts/WebSocketContext';
import api from '../../api';
import { BellRing, ChefHat, Package, RefreshCw } from 'lucide-react';

const WaiterOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { subscribeToTopic, connected } = useWebSocket();

  const fetchTables = useCallback(async () => {
    try {
      const stored = localStorage.getItem('mockTables');
      const username = localStorage.getItem('username');
      const userRole = localStorage.getItem('role');
      let myTables = [];
      if (stored) {
        const allTables = JSON.parse(stored);
        myTables = allTables;
      }
      return myTables;
    } catch (err) {
      console.error('Failed to fetch tables', err);
      return [];
    }
  }, []);

  const fetchOrders = useCallback(async (myTables) => {
    try {
      const response = await api.get('/api/v1/orders');
      if (response && response.length > 0) {
        setOrders(response);
      } else {
        throw new Error('Empty API response');
      }
    } catch (err) {
      const storedMock = localStorage.getItem('mockOrders');
      let allOrders = [];
      if (storedMock) {
        allOrders = JSON.parse(storedMock);
      } else {
        allOrders = [];
      }
      
      const myTableNumbers = myTables.map(t => String(t.number));
      setOrders(allOrders.filter(o => myTableNumbers.includes(String(o.tableNumber))));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const myTables = await fetchTables();
      await fetchOrders(myTables);
    };
    loadData();
    const interval = setInterval(loadData, 2000);
    return () => clearInterval(interval);
  }, [fetchTables, fetchOrders]);

  useEffect(() => {
    if (!connected) return;

    const newOrderSub = subscribeToTopic('/topic/orders/new', (newOrder) => {
      setOrders((prev) => prev.find((o) => o.id === newOrder.id) ? prev : [newOrder, ...prev]);
    });

    const statusSub = subscribeToTopic('/topic/orders/status', (updatedOrder) => {
      setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o)));
    });

    const kitchenSub = subscribeToTopic('/topic/kitchen', (updatedOrder) => {
      setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o)));
    });

    return () => {
      if (newOrderSub) newOrderSub.unsubscribe();
      if (statusSub) statusSub.unsubscribe();
      if (kitchenSub) kitchenSub.unsubscribe();
    };
  }, [connected, subscribeToTopic]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const storedMock = localStorage.getItem('mockOrders');
      if (storedMock) {
        const allOrders = JSON.parse(storedMock);
        const updatedMock = allOrders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o));
        localStorage.setItem('mockOrders', JSON.stringify(updatedMock));
      }
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
      await api.patch(`/api/v1/orders/${orderId}/status`, { status: newStatus });
    } catch (err) {
      console.error('Failed to update order status', err);
    }
  };

  const preparingOrders = orders.filter((o) => o.status === 'PREPARING' || o.status === 'ACCEPTED');
  const readyOrders = orders.filter((o) => o.status === 'READY');

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col">
      <header className="mb-6 flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Food Delivery</h1>
          <p className="text-sm text-gray-500 font-medium">Deliver ready food to your tables</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className={connected ? 'text-green-700' : 'text-red-700'}>{connected ? 'Live' : 'Disconnected'}</span>
          </div>
          <button onClick={fetchOrders} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        
        {/* Kitchen Status (Preparing) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-[calc(100vh-180px)]">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <ChefHat className="text-purple-500" size={24} /> Kitchen is Preparing
          </h2>
          <div className="flex-1 overflow-y-auto space-y-5 pr-2 custom-scrollbar">
            {preparingOrders.map(order => (
              <div key={order.id} className="border border-purple-200 bg-purple-50/30 rounded-xl p-5 shadow-sm">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="text-lg font-black text-gray-900">Order #{order.orderNumber || order.id}</h3>
                  <span className="bg-purple-100 text-purple-800 text-xs px-3 py-1 rounded-full font-bold shadow-sm">Preparing</span>
                </div>
                <p className="text-purple-600 font-medium mb-4">Table {order.tableNumber}</p>
                
                <ul className="space-y-2">
                  {order.items?.map((item, idx) => (
                    <li key={idx} className="text-gray-800 flex flex-col">
                      <div><span className="font-bold text-gray-900">{item.quantity}x</span> {item.name}</div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {preparingOrders.length === 0 && <p className="text-center text-gray-400 mt-10">Kitchen is idle</p>}
          </div>
        </div>

        {/* Ready to Deliver */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-[calc(100vh-180px)]">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <BellRing className="text-green-500" size={24} /> Ready for Delivery
          </h2>
          <div className="flex-1 overflow-y-auto space-y-5 pr-2 custom-scrollbar">
            {readyOrders.map(order => (
              <div key={order.id} className="border border-green-300 bg-green-50/30 rounded-xl p-5 shadow-sm">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="text-lg font-black text-gray-900">Order #{order.orderNumber || order.id}</h3>
                  <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-bold shadow-sm">
                    Ready
                  </span>
                </div>
                <p className="text-green-600 font-medium mb-4">Table {order.tableNumber}</p>
                
                <ul className="space-y-2 mb-6">
                  {order.items?.map((item, idx) => (
                    <li key={idx} className="text-gray-800">
                      <span className="font-bold text-gray-900">{item.quantity}x</span> {item.name}
                    </li>
                  ))}
                </ul>

                <button 
                  onClick={() => updateOrderStatus(order.id, 'DELIVERED')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  <Package size={18}/> Deliver to Customer
                </button>
              </div>
            ))}
            {readyOrders.length === 0 && <p className="text-center text-gray-400 mt-10">No food waiting to be delivered</p>}
          </div>
        </div>

      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
      `}</style>
    </div>
  );
};

export default WaiterOrders;
