import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, ChefHat, Timer, Flame, CheckCircle2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function KitchenDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Poll for orders from localStorage
  const fetchOrders = () => {
    try {
      const storedOrders = localStorage.getItem('mockOrders');
      if (storedOrders) {
        setOrders(JSON.parse(storedOrders));
      }
    } catch (error) {
      console.error('Failed to parse orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 2000);
    return () => clearInterval(interval);
  }, []);

  const deductInventoryForOrder = (order) => {
    try {
        const storedMenu = JSON.parse(localStorage.getItem('mockMenu') || '[]');
        const storedInv = JSON.parse(localStorage.getItem('mockInventory') || '[]');
        const storedLogs = JSON.parse(localStorage.getItem('mockInventoryLogs') || '[]');
        
        let inventoryUpdated = false;
        let logsToAdd = [];

        (order.items || []).forEach(orderItem => {
            const menuItem = storedMenu.find(m => m.name === (orderItem.itemName || orderItem.name));
            if (menuItem && menuItem.recipe && menuItem.recipe.length > 0) {
                const qty = parseInt(orderItem.quantity || orderItem.qty || 1);
                
                menuItem.recipe.forEach(recipeItem => {
                    const invItem = storedInv.find(inv => inv.id === recipeItem.ingredientId);
                    if (invItem) {
                        const totalDeduct = parseFloat(recipeItem.qty) * qty;
                        invItem.stock -= totalDeduct;
                        inventoryUpdated = true;
                        
                        logsToAdd.push({
                            id: Date.now() + Math.random(),
                            date: new Date().toLocaleString(),
                            action: `Auto Deduction (Order #${order.orderNumber || order.id.toString().split('-')[1] || order.id})`,
                            ingredient: invItem.name,
                            qty: `-${totalDeduct} ${invItem.unit}`,
                            user: 'Kitchen System'
                        });
                    }
                });
            }
        });

        if (inventoryUpdated) {
            localStorage.setItem('mockInventory', JSON.stringify(storedInv));
            localStorage.setItem('mockInventoryLogs', JSON.stringify([...logsToAdd, ...storedLogs]));
        }
    } catch (err) {
        console.error('Failed to deduct inventory:', err);
    }
  };

  const updateOrderStatus = (id, newStatus) => {
    try {
      const storedOrders = localStorage.getItem('mockOrders');
      if (storedOrders) {
        const allOrders = JSON.parse(storedOrders);
        const orderToUpdate = allOrders.find(o => o.id === id);
        
        // Auto-deduct inventory if changing to PREPARING
        if (newStatus === 'PREPARING' && orderToUpdate && orderToUpdate.status !== 'PREPARING') {
            deductInventoryForOrder(orderToUpdate);
        }

        const updatedOrders = allOrders.map(o => o.id === id ? { ...o, status: newStatus } : o);
        localStorage.setItem('mockOrders', JSON.stringify(updatedOrders));
        setOrders(updatedOrders);
      }
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const isPending = (status) => ['NEW', 'RECEIVED', 'WAITING', 'PENDING'].includes(status);
  const isPreparing = (status) => status === 'PREPARING' || status === 'ACCEPTED';
  const isReady = (status) => status === 'READY';
  const isCompleted = (status) => status === 'DELIVERED' || status === 'COMPLETED';

  const pendingOrders = orders.filter(o => isPending(o.status));
  const preparingOrders = orders.filter(o => isPreparing(o.status));
  const readyOrders = orders.filter(o => isReady(o.status));
  const completedOrders = orders.filter(o => isCompleted(o.status));

  // Mock priorities for demonstration based on table string or random
  const getPriorityInfo = (order) => {
    const tableNum = parseInt(order.tableNumber || order.tableId || '1');
    if (tableNum === 8 || order.specialInstructions?.toLowerCase().includes('urgent')) {
      return { label: 'URGENT', color: 'bg-red-500 text-white', icon: Flame };
    }
    if (tableNum % 3 === 0) return { label: 'High Priority', color: 'bg-orange-100 text-orange-800', icon: Flame };
    return { label: 'Normal', color: 'bg-blue-100 text-blue-800', icon: null };
  };

  const OrderCard = ({ order, nextStatus, nextLabel, actionColor, icon: Icon }) => {
    const timeStr = new Date(order.placedAt || order.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const priority = getPriorityInfo(order);
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
        className="bg-white rounded-xl shadow-sm p-4 mb-4 border border-gray-100 hover:shadow-md transition-shadow flex flex-col gap-3"
      >
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
              Order #{order.orderNumber || order.id?.split('-')[1] || order.id}
              {PriorityIcon && <PriorityIcon size={16} className="text-red-500" />}
            </h3>
            <p className="text-sm font-medium text-gray-500">Table {order.tableNumber || order.tableId}</p>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full font-semibold flex items-center gap-1 ${priority.color}`}>
            {priority.label}
          </span>
        </div>

        <div className="flex gap-4 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
          <div className="flex items-center gap-1">
            <Clock size={14} /> <span>{timeStr}</span>
          </div>
          <div className="flex items-center gap-1 text-orange-600 font-medium">
            <Timer size={14} /> <span>{elapsedMinutes}m / {estimatedTotal}m est.</span>
          </div>
        </div>

        <div className="mt-2">
          <ul className="space-y-2">
            {(order.items || []).map((item, idx) => (
              <li key={idx} className="flex justify-between items-start text-sm border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                <div className="flex items-start gap-2">
                  <span className="font-bold text-gray-800 bg-gray-100 px-1.5 rounded">{item.quantity || item.qty}x</span>
                  <span className="flex-1 text-gray-700 font-medium">{item.itemName || item.name}</span>
                </div>
              </li>
            ))}
            {order.specialInstructions && (
              <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded font-medium border border-red-100">
                Note: {order.specialInstructions}
              </div>
            )}
            {(!order.items || order.items.length === 0) && (
              <li className="text-sm text-gray-400 italic">No items found</li>
            )}
          </ul>
        </div>

        {nextStatus && (
          <button
            onClick={() => updateOrderStatus(order.id, nextStatus)}
            className={`mt-2 w-full py-2.5 rounded-lg text-white font-bold flex items-center justify-center gap-2 transition-colors ${actionColor}`}
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
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4 lg:p-6">
      <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200">
            <ChefHat size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900">Kitchen Display System</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium mt-1">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              Live Sync Active
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
        {/* Waiting / Pending Column */}
        <div className="bg-gray-100/50 rounded-2xl p-4 min-h-[75vh] border border-gray-200">
          <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-orange-200">
            <h2 className="font-bold text-lg text-orange-600 flex items-center gap-2">
              Waiting
              <span className="bg-orange-100 text-orange-700 py-0.5 px-2.5 rounded-full text-sm">
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
                  actionColor="bg-orange-500 hover:bg-orange-600 shadow-md shadow-orange-200"
                  icon={ChevronRight}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Preparing Column */}
        <div className="bg-gray-100/50 rounded-2xl p-4 min-h-[75vh] border border-gray-200">
          <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-blue-200">
            <h2 className="font-bold text-lg text-blue-600 flex items-center gap-2">
              Preparing
              <span className="bg-blue-100 text-blue-700 py-0.5 px-2.5 rounded-full text-sm">
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
                  actionColor="bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200"
                  icon={CheckCircle2}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Ready Column */}
        <div className="bg-gray-100/50 rounded-2xl p-4 min-h-[75vh] border border-gray-200">
          <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-green-200">
            <h2 className="font-bold text-lg text-green-600 flex items-center gap-2">
              Ready
              <span className="bg-green-100 text-green-700 py-0.5 px-2.5 rounded-full text-sm">
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
                  nextStatus="DELIVERED"
                  nextLabel="Mark Completed"
                  actionColor="bg-green-600 hover:bg-green-700 shadow-md shadow-green-200"
                  icon={CheckCircle}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Completed Column */}
        <div className="bg-gray-100/50 rounded-2xl p-4 min-h-[75vh] border border-gray-200 opacity-75">
          <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-gray-300">
            <h2 className="font-bold text-lg text-gray-600 flex items-center gap-2">
              Completed
              <span className="bg-gray-200 text-gray-700 py-0.5 px-2.5 rounded-full text-sm">
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
