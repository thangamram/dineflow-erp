import React, { useEffect, useState, useCallback } from 'react';
import { useWebSocket } from '../../contexts/WebSocketContext';
import api from '../../api';
import { 
  CheckCircle, 
  ChefHat, 
  Clock, 
  Utensils, 
  Package,
  RefreshCw,
  BellRing,
  Coffee
} from 'lucide-react';

const WaiterDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [assignedTables, setAssignedTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { subscribeToTopic, connected } = useWebSocket();

  // Load tables assigned to this waiter
  const fetchTables = useCallback(async () => {
    try {
      const stored = localStorage.getItem('mockTables');
      const username = localStorage.getItem('username');
      const userRole = localStorage.getItem('role');
      let myTables = [];
      if (stored) {
        const allTables = JSON.parse(stored);
        myTables = allTables;
        setAssignedTables(myTables);
      } else {
        setAssignedTables([]);
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
        setError(null);
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
      // Filter orders by assigned tables
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
      setOrders((prev) => {
        if (prev.find((o) => o.id === newOrder.id)) return prev;
        return [newOrder, ...prev];
      });
    });

    const statusSub = subscribeToTopic('/topic/orders/status', (updatedOrder) => {
      setOrders((prev) => 
        prev.map((o) => (o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o))
      );
    });

    const kitchenSub = subscribeToTopic('/topic/kitchen', (updatedOrder) => {
      setOrders((prev) => 
        prev.map((o) => (o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o))
      );
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

  const handleReadyForBilling = async (tableNumber) => {
    try {
      // Mock optimistic table status update
      setAssignedTables(prev => prev.map(t => t.number === tableNumber ? { ...t, status: 'Waiting for Payment' } : t));
      
      // Notify Cashier
      await api.post('/api/v1/bills/request', { tableNumber });
      alert(`Billing request sent to cashier for Table ${tableNumber}`);
    } catch (err) {
      console.error('Failed to send billing request', err);
      alert(`Mock: Billing request sent to cashier for Table ${tableNumber}`);
    }
  };

  const pendingOrders = orders.filter((o) => o.status === 'PENDING');
  const preparingOrders = orders.filter((o) => o.status === 'PREPARING' || o.status === 'ACCEPTED');
  const readyOrders = orders.filter((o) => o.status === 'READY');
  const completedOrders = orders.filter((o) => o.status === 'DELIVERED');

  // Any table that has a delivered order is considered "Active Dining"
  const activeDiningTables = assignedTables.filter(t => 
    completedOrders.some(o => o.tableNumber === t.number) || t.status === 'Occupied'
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col">
      <header className="mb-6 flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Waiter Portal</h1>
          <p className="text-sm text-gray-500 font-medium">Real-time Order Management</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className={connected ? 'text-green-700' : 'text-red-700'}>
              {connected ? 'Live Sync Active' : 'Disconnected'}
            </span>
          </div>
          <button onClick={fetchOrders} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Assigned Tables</p>
            <p className="text-2xl font-bold text-gray-900">{assignedTables.length}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><Utensils size={20}/></div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Pending Orders</p>
            <p className="text-2xl font-bold text-gray-900">{pendingOrders.length}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-600"><Clock size={20}/></div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Preparing Orders</p>
            <p className="text-2xl font-bold text-gray-900">{preparingOrders.length}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600"><ChefHat size={20}/></div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Ready for Delivery</p>
            <p className="text-2xl font-bold text-gray-900">{readyOrders.length}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600"><BellRing size={20}/></div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Completed Orders</p>
            <p className="text-2xl font-bold text-gray-900">{completedOrders.length}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-600"><CheckCircle size={20}/></div>
        </div>
      </div>
      {/* End Dashboard Cards */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
      `}</style>
    </div>
  );
};

export default WaiterDashboard;
