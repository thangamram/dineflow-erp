import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar
} from 'recharts';
import { TrendingUp, Users, ShoppingBag, DollarSign, Activity, AlertTriangle, Receipt } from 'lucide-react';

const defaultRevenueData = [
    { name: 'Mon', revenue: 4000 },
    { name: 'Tue', revenue: 3000 },
    { name: 'Wed', revenue: 2000 },
    { name: 'Thu', revenue: 2780 },
    { name: 'Fri', revenue: 1890 },
    { name: 'Sat', revenue: 2390 },
    { name: 'Sun', revenue: 3490 },
];

export default function DashboardPage() {
    const { connected } = useWebSocket();
    const [metrics, setMetrics] = useState({ revenue: 0, totalOrders: 0, activeCustomers: 0 });
    const [recentActivity, setRecentActivity] = useState([]);
    const [chartData, setChartData] = useState({ revenue: [], topFoods: [] });
    const [lowInventory, setLowInventory] = useState(0);

    useEffect(() => {
      const updateMetrics = () => {
        const paidStored = localStorage.getItem('cashierPaid');
        const tablesStored = localStorage.getItem('mockTables');
        const inventoryStored = localStorage.getItem('mockInventory');

        let revenue = 0;
        let totalOrders = 0;
        let activeCustomers = 0;
        let activity = [];
        let rData = [];
        let fData = [];
        let lowInv = 0;

        if (inventoryStored) {
            const inv = JSON.parse(inventoryStored);
            lowInv = inv.filter(i => i.stock <= i.minStock).length;
        }

        if (paidStored && JSON.parse(paidStored).length > 0) {
          const paidBills = JSON.parse(paidStored);
          totalOrders = paidBills.length;
          revenue = paidBills.reduce((sum, bill) => sum + (bill.total || 0), 0);
          
          activity = paidBills.slice(-5).reverse().map(bill => ({
            time: new Date(bill.paidAt || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            event: `Payment of ₹${bill.total.toFixed(0)} received for ${bill.table} via ${bill.paymentMethod || 'UPI'}`
          }));

          // Calculate top foods dynamically
          const itemCounts = {};
          paidBills.forEach(bill => {
             if(bill.items) {
                 bill.items.forEach(item => {
                     itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
                 });
             }
          });
          fData = Object.keys(itemCounts).map(name => ({name, sales: itemCounts[name]})).sort((a,b)=>b.sales-a.sales).slice(0,4);
          rData = defaultRevenueData; // You could dynamically generate this by date if desired
        }

        if (tablesStored) {
          const tables = JSON.parse(tablesStored);
          activeCustomers = tables.filter(t => t.status === 'Customer Dining' || t.status === 'Waiting for Payment' || t.status === 'Occupied').length;
        }

        setMetrics({ revenue, totalOrders, activeCustomers });
        setRecentActivity(activity);
        setChartData({ revenue: rData, topFoods: fData });
        setLowInventory(lowInv);
      };

      updateMetrics();
      // Poll to simulate real-time updates for the dashboard
      const interval = setInterval(updateMetrics, 2000);
      return () => clearInterval(interval);
    }, []);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Owner Analytics</h1>
                    <p className="text-gray-500 dark:text-gray-400">Live Restaurant Status & Insights</p>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="relative flex h-3 w-3">
                        {connected ? (
                            <><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span></>
                        ) : (
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        )}
                    </span>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        {connected ? 'Live Sync Active' : 'Offline'}
                    </span>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex items-center space-x-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Today's Revenue</p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">₹{metrics.revenue.toLocaleString()}</h3>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex items-center space-x-4">
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                        <ShoppingBag size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Completed Transactions</p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.totalOrders}</h3>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex items-center space-x-4">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Active Dining Tables</p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.activeCustomers}</h3>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex items-center space-x-4">
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Low Inventory Alerts</p>
                        <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">{lowInventory} Items</p>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue Trend (Last 7 Days)</h3>
                        {chartData.revenue.length > 0 ? (
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData.revenue} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                        <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                                        <CartesianGrid stroke="#ccc" strokeDasharray="5 5" vertical={false} />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-72 flex items-center justify-center text-gray-500 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                                No revenue data yet. Complete an order to see trends!
                            </div>
                        )}
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Selling Items</h3>
                        {chartData.topFoods.length > 0 ? (
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData.topFoods} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="sales" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-64 flex items-center justify-center text-gray-500">
                                No sales data yet. Complete an order to see top items!
                            </div>
                        )}
                </div>
            </div>
            
            {/* Activity Logs */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <div className="flex items-center space-x-2 mb-4">
                    <Activity className="text-gray-400" size={20} />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Payment Activity</h3>
                </div>
                <div className="space-y-4">
                    {recentActivity.map((log, idx) => (
                        <div key={idx} className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <span className="text-xs font-medium text-blue-500 mt-1 whitespace-nowrap">{log.time}</span>
                            <div className="flex flex-col">
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{log.event}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
