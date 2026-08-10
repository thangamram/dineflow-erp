import React, { useState, useEffect } from 'react';
import { Search, Filter, CreditCard, Calendar } from 'lucide-react';
import api from '../../api';

const CashierHistory = () => {
  const [paidBills, setPaidBills] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMethod, setFilterMethod] = useState('All');

  useEffect(() => {
    const fetchPaidBills = async () => {
      try {
        const [billsRes, ordersRes] = await Promise.all([
          api.get('/bills?size=100').catch(() => null),
          api.get('/orders?size=500').catch(() => null)
        ]);
        
        const bills = billsRes?.content || billsRes?.data?.content || billsRes;
        const orders = ordersRes?.content || ordersRes?.data?.content || ordersRes || [];
        
        const orderMap = {};
        if (Array.isArray(orders)) {
          orders.forEach(o => orderMap[o.id] = o);
        }

        if (Array.isArray(bills)) {
          const paid = bills.filter(b => b.status === 'PAID').map(b => {
            const order = orderMap[b.orderId];
            const tableRef = order ? (order.tableNumber || order.tableId) : (b.tableNumber || b.tableId);
            return {
              id: b.id,
              billNumber: `BILL-${b.id}`,
              table: `Table ${tableRef || '?'}`,
              orderId: b.orderId ? `ORD-${b.orderId}` : 'N/A',
              sessionId: b.orderId,
              total: b.grandTotal || 0,
              paymentMethod: b.paymentMethod || 'CASH',
              paidAt: b.paidAt || b.generatedAt
            };
          });
          setPaidBills(paid);
        } else {
          setPaidBills([]);
        }
      } catch (err) {
        console.error('Failed to load payment history:', err);
        setPaidBills([]);
      }
    };
    fetchPaidBills();
  }, []);

  const filteredBills = paidBills.filter(bill => {
    const matchesSearch = searchQuery === '' ||
      bill.table?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.orderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.sessionId?.toString().includes(searchQuery);

    const matchesFilter = filterMethod === 'All' || bill.paymentMethod === filterMethod;

    return matchesSearch && matchesFilter;
  });

  const methods = ['All', 'Cash', 'UPI', 'Credit Card', 'Debit Card', 'QR Code'];

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <header className="mb-6 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Payment History</h1>
        <p className="text-sm text-gray-500 font-medium">View all completed transactions</p>
      </header>

      {/* Search & Filters */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Table, Bill #, or Session..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {methods.map(m => (
              <button key={m} onClick={() => setFilterMethod(m)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${filterMethod === m ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Bill #</th>
              <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Table</th>
              <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Session</th>
              <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Method</th>
              <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Time</th>
              <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredBills.length === 0 ? (
              <tr><td colSpan="7" className="text-center py-12 text-gray-400">No transactions found</td></tr>
            ) : (
              filteredBills.map(bill => (
                <tr key={bill.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">{bill.billNumber}</td>
                  <td className="px-6 py-4">
                    <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold">
                      {bill.table}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{bill.orderId}</td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">₹{bill.total?.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg text-xs font-semibold text-gray-600">
                      <CreditCard size={12} /> {bill.paymentMethod}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={12} /> 
                      {bill.paidAt ? new Date(bill.paidAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-bold">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                      Success
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CashierHistory;
