import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { CheckCircle, Clock, Utensils, Truck, ArrowLeft, RefreshCw, Download, Receipt } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import api from '../../api';

export default function OrderTracking() {
  const { subscribeToTopic, connected } = useWebSocket();
  const sessionId = localStorage.getItem('customerSessionId');
  const tableNumber = localStorage.getItem('tableNumber');
  const navigate = useNavigate();

  const [status, setStatus] = useState('PLACED');
  const [paidBill, setPaidBill] = useState(null);
  
  useEffect(() => {
    const checkPayment = async () => {
      try {
        const dbTables = await api.get('/tables');
        const myTable = dbTables.find(t => String(t.tableNumber || t.id) === String(tableNumber));
        if (myTable && myTable.status === 'AVAILABLE') {
          // Find if there is any settled bill for this table
          const bills = await api.get('/bills').catch(() => []);
          const settled = (Array.isArray(bills) ? bills : (bills?.content || [])).find(b => 
            String(b.tableId) === String(myTable.id) || String(b.tableNumber) === String(tableNumber)
          );
          if (settled) {
            setPaidBill({
              id: settled.id || 'BILL-101',
              total: settled.totalAmount || 0,
              paidAt: settled.paidAt || new Date().toISOString(),
              paymentMethod: settled.paymentMethod || 'CASH'
            });
          } else {
            setPaidBill({
              id: 'BILL-' + (myTable.id || 101),
              total: 0,
              paidAt: new Date().toISOString(),
              paymentMethod: 'CASH'
            });
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    
    const interval = setInterval(checkPayment, 3000);
    checkPayment();
    return () => clearInterval(interval);
  }, [tableNumber]);
  
  useEffect(() => {
    if (!sessionId) {
      navigate('/customer');
      return;
    }

    const checkOrderStatus = async () => {
      const orderId = localStorage.getItem('lastPlacedOrderId');
      if (orderId) {
        try {
          const order = await api.get(`/orders/${orderId}`);
          if (order) {
            let overallStatus = 'PLACED';
            if (['NEW', 'RECEIVED', 'PENDING', 'WAITING'].includes(order.status)) overallStatus = 'PLACED';
            else if (['PREPARING', 'ACCEPTED'].includes(order.status)) overallStatus = 'PREPARING';
            else if (order.status === 'READY') overallStatus = 'READY';
            else if (['DELIVERED', 'COMPLETED', 'BILLED', 'PAID', 'CLOSED'].includes(order.status)) overallStatus = 'DELIVERED';
            setStatus(overallStatus);
            return;
          }
        } catch (e) {
          console.error("Failed to fetch order status from API:", e);
        }
      }

      const storedOrders = localStorage.getItem('mockOrders');
      if (storedOrders) {
        const allOrders = JSON.parse(storedOrders);
        const myOrders = allOrders.filter(o => o.tableNumber === String(tableNumber) && o.sessionId === sessionId);
        if (myOrders.length > 0) {
          const statuses = myOrders.map(o => o.status);
          let overallStatus = 'PLACED';
          if (statuses.includes('PENDING') || statuses.includes('NEW') || statuses.includes('RECEIVED') || statuses.includes('WAITING')) overallStatus = 'PLACED';
          else if (statuses.includes('PREPARING') || statuses.includes('ACCEPTED')) overallStatus = 'PREPARING';
          else if (statuses.includes('READY')) overallStatus = 'READY';
          else if (statuses.includes('DELIVERED') || statuses.includes('COMPLETED')) overallStatus = 'DELIVERED';
          setStatus(overallStatus);
        }
      }
    };

    const interval = setInterval(checkOrderStatus, 2000);
    checkOrderStatus();
    
    return () => clearInterval(interval);
  }, [sessionId, tableNumber, navigate]);

  const steps = [
    { id: 'PLACED', title: 'Order Placed', icon: Clock, description: 'We have received your order' },
    { id: 'PREPARING', title: 'Preparing', icon: Utensils, description: 'Kitchen is preparing your food' },
    { id: 'READY', title: 'Ready', icon: CheckCircle, description: 'Your order is ready to be served' },
    { id: 'DELIVERED', title: 'Delivered', icon: Truck, description: 'Enjoy your meal!' }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === status);

  const downloadEBill = () => {
    if (!paidBill) return;
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("DineFlow Restaurant - E-Bill", 14, 20);
    doc.setFontSize(12);
    doc.text(`Table: ${tableNumber}`, 14, 30);
    doc.text(`Date: ${new Date(paidBill.paidAt).toLocaleString()}`, 14, 38);
    doc.text(`Payment Method: ${paidBill.paymentMethod}`, 14, 46);

    const tableData = paidBill.items.map(item => [item.name, item.qty, `Rs. ${item.price}`, `Rs. ${item.price * item.qty}`]);
    
    // Check if autoTable exists on the document prototype (older versions) or as a global/import (newer versions)
    if (typeof doc.autoTable === 'function') {
      doc.autoTable({
        startY: 55,
        head: [['Item', 'Qty', 'Price', 'Total']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] }
      });
    } else {
      // Fallback if autoTable is not patched to doc
      import('jspdf-autotable').then(({ default: autoTable }) => {
        autoTable(doc, {
          startY: 55,
          head: [['Item', 'Qty', 'Price', 'Total']],
          body: tableData,
          theme: 'grid',
          headStyles: { fillColor: [59, 130, 246] }
        });
        
        const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 55 + (tableData.length * 10);
        doc.setFontSize(14);
        doc.text(`Grand Total: Rs. ${paidBill.total}`, 14, finalY + 15);
        doc.save(`E-Bill_Table${tableNumber}.pdf`);
      });
      return; // Return early since save happens in promise
    }

    const finalY = (doc.lastAutoTable && doc.lastAutoTable.finalY) || 55;
    doc.setFontSize(14);
    doc.text(`Grand Total: Rs. ${paidBill.total}`, 14, finalY + 15);
    
    doc.save(`E-Bill_Table${tableNumber}.pdf`);
  };

  const [billRequested, setBillRequested] = useState(false);

  const requestBill = async (method) => {
    try {
      const dbTables = await api.get('/tables').catch(() => []);
      const myTable = dbTables.find(t => String(t.tableNumber || t.id) === String(tableNumber));
      if (myTable) {
         // Notify waiter/cashier by marking table as CLEANING if it's currently OCCUPIED
         await api.patch(`/tables/${myTable.id}/status?status=CLEANING`).catch(() => {});
      }
    } catch (err) {
      console.error('Failed to notify backend of bill request', err);
    }
    
    // Set UI to bill requested state
    setBillRequested(true);
  };

  if (paidBill) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-green-600 w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-2">Payment Successful!</h2>
          <p className="text-gray-500 font-medium mb-8">Thank you for dining with us at Table {tableNumber}</p>
          
          <div className="bg-blue-50 rounded-2xl p-6 mb-8 text-left border border-blue-100">
            <div className="flex items-center gap-2 mb-4 text-blue-800 font-bold border-b border-blue-200 pb-3">
              <Receipt size={20} /> Digital E-Bill Summary
            </div>
            <div className="space-y-3 mb-4 max-h-48 overflow-y-auto pr-2">
              {paidBill.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="font-semibold text-gray-700">{item.name} <span className="text-gray-400">x{item.qty}</span></span>
                  <span className="font-bold text-gray-900">₹{item.price * item.qty}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-blue-200">
              <span className="font-bold text-gray-600">Total Paid</span>
              <span className="text-2xl font-black text-blue-700">₹{paidBill.total}</span>
            </div>
          </div>

          <div className="space-y-3">
            <button onClick={downloadEBill} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2">
              <Download size={20} /> Download PDF Receipt
            </button>
            <button onClick={() => { localStorage.removeItem('customerSessionId'); navigate('/customer'); }} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 rounded-xl transition-colors">
              Start New Order
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24">
      <div className="max-w-lg mx-auto pt-4">
        <button 
          onClick={() => navigate('/customer')}
          className="flex items-center text-gray-500 hover:text-gray-900 mb-8 transition-colors font-medium bg-white px-4 py-2 rounded-full shadow-sm"
        >
          <ArrowLeft className="w-5 h-5 mr-2" /> Back to Menu
        </button>

        <div className="bg-white rounded-3xl shadow-lg p-8 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-blue-50 rounded-bl-full -mr-16 -mt-16 opacity-60 pointer-events-none"></div>
          
          <div className="flex justify-between items-start relative z-10">
            <div>
              <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Track Order</h1>
              <div className="flex items-center space-x-3 text-sm text-gray-500 font-medium">
                <span className="bg-gray-100 px-3 py-1 rounded-full text-gray-700">Table {tableNumber}</span>
                <span>•</span>
                <span className="truncate max-w-[120px]">ID: {sessionId?.split('_')[2]}</span>
              </div>
            </div>
            {!connected && (
              <div className="flex items-center text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full text-xs font-bold" title="Simulation Mode">
                <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Simulating
              </div>
            )}
          </div>

          <div className="mt-10 relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-100"></div>
            
            <div className="space-y-8 relative z-10">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isCompleted = index <= currentStepIndex;
                const isActive = index === currentStepIndex;

                return (
                  <div key={step.id} className="flex items-start">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-4 border-white shadow-sm transition-all duration-500 ${
                      isActive ? 'bg-blue-600 text-white scale-110 ring-4 ring-blue-100' : 
                      isCompleted ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="ml-5 mt-1.5">
                      <h3 className={`text-lg font-bold transition-colors duration-300 ${
                        isActive ? 'text-blue-600' : isCompleted ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        {step.title}
                      </h3>
                      <p className={`text-sm mt-1 transition-colors duration-300 ${
                        isActive ? 'text-gray-600 font-medium' : 'text-gray-400'
                      }`}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {status === 'DELIVERED' && !billRequested && (
          <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100 animate-fade-in-up">
            <h3 className="text-xl font-black text-gray-900 mb-4 text-center">Ready for the Bill?</h3>
            <p className="text-gray-500 text-sm text-center mb-6">Select how you would like to pay</p>
            <div className="grid grid-cols-3 gap-3">
              <button onClick={() => requestBill('Cash')} className="bg-white border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:border-gray-300 transition-colors">Cash</button>
              <button onClick={() => requestBill('Card')} className="bg-white border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:border-gray-300 transition-colors">Card</button>
              <button onClick={() => requestBill('UPI')} className="bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-md">UPI</button>
            </div>
          </div>
        )}

        {billRequested && (
          <div className="bg-yellow-50 rounded-3xl p-6 border border-yellow-100 text-center animate-fade-in">
            <h3 className="text-lg font-bold text-yellow-800 mb-2">Bill Requested</h3>
            <p className="text-sm text-yellow-600 font-medium">Please wait while the cashier processes your request.</p>
          </div>
        )}

      </div>
    </div>
  );
}
