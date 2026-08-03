import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../../contexts/WebSocketContext';
import api from '../../api';
import { Clock, CheckCircle, ChefHat, AlertCircle, Timer, Flame, CheckCircle2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function KdsDashboard() {
  const { subscribeToTopic, connected } = useWebSocket();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (connected) {
      const subscription = subscribeToTopic('/topic/kitchen', (message) => {
        // message can be an order object or an event
        // if message has id, update it in the list or add if new
        if (message && message.id) {
          setOrders(prev => {
            const exists = prev.find(o => o.id === message.id);
            if (exists) {
              return prev.map(o => o.id === message.id ? message : o);
            } else {
              return [message, ...prev];
            }
          });
        } else {
           // fallback to fetch all if payload doesn't contain order
           fetchOrders();
        }
      });
      return () => {
        if (subscription) subscription.unsubscribe();
      };
    }
  }, [connected, subscribeToTopic]);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/orders/active');
      // Sometimes it's nested in data.data or data.content, let's just make sure it's an array
      let fetchedOrders = [];
      if (Array.isArray(data)) {
        fetchedOrders = data;
      } else if (data && Array.isArray(data.content)) {
        fetchedOrders = data.content;
      } else {
        // the interceptor might already return data.data, but wait, looking at api.js:
        // if response.data.hasOwnProperty('success'), it returns response.data.data.
        // Let's call api.get directly and assign.
      }
      
      const res = await api.get('/orders/active');
      setOrders(Array.isArray(res) ? res : res?.content || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (id, newStatus) => {
    try {
      await api.patch(`/orders/${id}/status`, { status: newStatus, remarks: 'Updated by Kitchen' });
      // Optimistic update
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  };

  const isPending = (status) => ['NEW', 'RECEIVED', 'WAITING'].includes(status);
  const isPreparing = (status) => status === 'PREPARING';
  const isReady = (status) => status === 'READY';
  const isCompleted = (status) => status === 'COMPLETED';

  const pendingOrders = orders.filter(o => isPending(o.status));
  const preparingOrders = orders.filter(o => isPreparing(o.status));
  const readyOrders = orders.filter(o => isReady(o.status));
  const completedOrders = orders.filter(o => isCompleted(o.status));

  // Mock priorities for demonstration
  const getPriorityInfo = (orderId) => {
    const p = orderId % 3;
    if (p === 0) return { label: 'High Priority', color: 'bg-red-500 text-white', icon: Flame };
    if (p === 1) return { label: 'Normal', color: 'bg-blue-100 text-blue-800', icon: null };
    return { label: 'Low', color: 'bg-gray-100 text-gray-800', icon: null };
  };

  const OrderCard = ({ order, nextStatus, nextLabel, actionColor, icon: Icon }) => {
    const timeStr = new Date(order.placedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const priority = getPriorityInfo(order.id);
    const PriorityIcon = priority.icon;
    
    // Mock prep timer
    const elapsedMinutes = Math.floor(Math.random() * 15) + 1;
    const estimatedTotal = 20;

    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-4 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-shadow flex flex-col gap-3"
      >
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
              Order #{order.orderNumber || order.id}
              {PriorityIcon && <PriorityIcon size={16} className="text-red-500" />}
            </h3>
            <p className="text-sm font-medium text-gray-500">{order.tableNumber || `Table ${order.tableId}`}</p>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full font-semibold flex items-center gap-1 ${priority.color}`}>
            {priority.label}
          </span>
        </div>

        <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg">
          <div className="flex items-center gap-1">
            <Clock size={14} /> <span>{timeStr}</span>
          </div>
          <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-medium">
            <Timer size={14} /> <span>{elapsedMinutes}m / {estimatedTotal}m est.</span>
          </div>
        </div>

        <div className="flex-1">
          <ul className="space-y-2">
            {(order.items || []).map((item, idx) => (
              <li key={idx} className="flex justify-between items-start text-sm border-b border-gray-100 dark:border-gray-700 pb-2 last:border-0 last:pb-0">
                <span className="font-semibold text-gray-800 dark:text-gray-200">{item.quantity}x</span>
                <span className="flex-1 ml-2 text-gray-700 dark:text-gray-300">{item.itemName}</span>
                {item.modifiers && (
                  <span className="text-xs text-red-400 italic block mt-1">{item.modifiers}</span>
                )}
              </li>
            ))}
            {(!order.items || order.items.length === 0) && (
              <li className="text-sm text-gray-400 italic">No items found</li>
            )}
          </ul>
        </div>

        {nextStatus && (
          <button
            onClick={() => updateOrderStatus(order.id, nextStatus)}
            className={`mt-2 w-full py-2.5 rounded-lg text-white font-semibold flex items-center justify-center gap-2 transition-colors ${actionColor}`}
          >
            {nextLabel}
            {Icon && <Icon size={18} />}
          </button>
        )}
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 text-white rounded-xl shadow-lg">
            <ChefHat size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Kitchen Display System</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="relative flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${connected ? 'bg-green-400' : 'bg-red-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
              </span>
              {connected ? 'Live Sync Active' : 'Disconnected'}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
        {/* Waiting / Pending Column */}
        <div className="bg-gray-100/50 dark:bg-gray-800/50 rounded-2xl p-4 min-h-[70vh] border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-orange-200 dark:border-orange-900/50">
            <h2 className="font-bold text-lg text-orange-600 dark:text-orange-400 flex items-center gap-2">
              Waiting
              <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 py-0.5 px-2.5 rounded-full text-sm">
                {pendingOrders.length}
              </span>
            </h2>
          </div>
          <div className="space-y-4">
            <AnimatePresence>
              {pendingOrders.map(o => (
                <OrderCard
                  key={o.id}
                  order={o}
                  nextStatus="PREPARING"
                  nextLabel="Start Preparing"
                  actionColor="bg-orange-500 hover:bg-orange-600"
                  icon={ChevronRight}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Preparing Column */}
        <div className="bg-gray-100/50 dark:bg-gray-800/50 rounded-2xl p-4 min-h-[70vh] border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-blue-200 dark:border-blue-900/50">
            <h2 className="font-bold text-lg text-blue-600 dark:text-blue-400 flex items-center gap-2">
              Preparing
              <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 py-0.5 px-2.5 rounded-full text-sm">
                {preparingOrders.length}
              </span>
            </h2>
          </div>
          <div className="space-y-4">
            <AnimatePresence>
              {preparingOrders.map(o => (
                <OrderCard
                  key={o.id}
                  order={o}
                  nextStatus="READY"
                  nextLabel="Mark Ready"
                  actionColor="bg-blue-600 hover:bg-blue-700"
                  icon={CheckCircle2}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Ready Column */}
        <div className="bg-gray-100/50 dark:bg-gray-800/50 rounded-2xl p-4 min-h-[70vh] border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-green-200 dark:border-green-900/50">
            <h2 className="font-bold text-lg text-green-600 dark:text-green-400 flex items-center gap-2">
              Ready
              <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 py-0.5 px-2.5 rounded-full text-sm">
                {readyOrders.length}
              </span>
            </h2>
          </div>
          <div className="space-y-4">
            <AnimatePresence>
              {readyOrders.map(o => (
                <OrderCard
                  key={o.id}
                  order={o}
                  nextStatus="COMPLETED"
                  nextLabel="Complete Order"
                  actionColor="bg-green-600 hover:bg-green-700"
                  icon={CheckCircle}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Completed Column */}
        <div className="bg-gray-100/50 dark:bg-gray-800/50 rounded-2xl p-4 min-h-[70vh] border border-gray-200 dark:border-gray-700 opacity-60">
          <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-gray-300 dark:border-gray-600">
            <h2 className="font-bold text-lg text-gray-500 dark:text-gray-400 flex items-center gap-2">
              Completed
              <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 py-0.5 px-2.5 rounded-full text-sm">
                {completedOrders.length}
              </span>
            </h2>
          </div>
          <div className="space-y-4">
            <AnimatePresence>
              {completedOrders.slice(0, 10).map(o => (
                <OrderCard
                  key={o.id}
                  order={o}
                  nextStatus={null}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}
