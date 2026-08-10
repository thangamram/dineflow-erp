import React, { useState, useEffect } from 'react';
import api from '../../api';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Plus, Minus, Utensils, Search, Leaf, Beef, X, CheckCircle, Receipt, Clock, LayoutDashboard, Menu as MenuIcon, QrCode, Camera } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function CustomerPortal() {
  const [sessionId, setSessionId] = useState(localStorage.getItem('customerSessionId') || '');
  const [tableNumber, setTableNumber] = useState(localStorage.getItem('tableNumber') || '');
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState({});
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('');
  
  // New States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // ALL, VEG, NON_VEG
  const [activeTab, setActiveTab] = useState('MENU'); // MENU, DASHBOARD
  const [showCartModal, setShowCartModal] = useState(false);
  const [specialNote, setSpecialNote] = useState('');
  
  const [myOrders, setMyOrders] = useState([]);
  const [tableStatus, setTableStatus] = useState('');
  const [waiterName, setWaiterName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const [availableTables, setAvailableTables] = useState([]);
  const [validationError, setValidationError] = useState('');
  const navigate = useNavigate();

  const loadTables = async () => {
    try {
      const dbTables = await api.get('/tables');
      const deletedIds = (JSON.parse(localStorage.getItem('deletedTableIds') || '[]')).map(String);
      const mapped = (dbTables || [])
        .filter(t => !deletedIds.includes(String(t.id)))
        .map(t => ({
          id: t.id,
          number: t.tableNumber || String(t.id),
          capacity: t.capacity || t.seats || 4,
          status: t.status === 'AVAILABLE' ? 'Available' : t.status === 'OCCUPIED' ? 'Occupied' : 'Cleaning',
          assignedWaiter: t.assignedWaiter || '',
          qrToken: t.qrToken || String(t.id)
        }));
      setAvailableTables(mapped);
      return mapped;
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  const startSession = async (tableNum) => {
    const activeTable = String(tableNum || tableNumber);
    if (!activeTable.trim()) return;
    const newSessionId = `sess_${activeTable}_${Date.now()}`;
    localStorage.setItem('customerSessionId', newSessionId);
    localStorage.setItem('tableNumber', activeTable);
    setSessionId(newSessionId);
    
    try {
      const tablesList = await loadTables();
      const matchedTable = tablesList.find(t => String(t.number) === activeTable);
      if (matchedTable) {
        await api.patch(`/tables/${matchedTable.id}/status?status=OCCUPIED`).catch(() => {});
        loadTables();
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    let scanner = null;
    if (!sessionId && isScanning && !validationError) {
      const timer = setTimeout(() => {
        try {
          scanner = new Html5QrcodeScanner('reader', {
            fps: 10,
            qrbox: { width: 220, height: 220 },
            rememberLastUsedCamera: true
          }, false);

          scanner.render(
            (decodedText) => {
              try {
                const url = new URL(decodedText);
                const tableParam = url.searchParams.get('table');
                const restParam = url.searchParams.get('restaurant');
                const tokenParam = url.searchParams.get('token');
                
                if (tableParam) {
                  if (restParam !== 'REST-1001') {
                    setValidationError('Invalid QR Code. Please contact restaurant staff.');
                    return;
                  }
                  const checkAndStartFromScanner = async () => {
                    try {
                      const dbTables = await api.get('/tables');
                      const matchedTable = dbTables.find(t => String(t.tableNumber || t.id) === tableParam);
                      if (!matchedTable || (matchedTable.qrToken && matchedTable.qrToken !== tokenParam)) {
                        setValidationError('Invalid QR Code. Please contact restaurant staff.');
                        return;
                      }
                      startSession(tableParam);
                    } catch (e) {
                      startSession(tableParam);
                    }
                  };
                  checkAndStartFromScanner();
                } else {
                  startSession(decodedText);
                }
              } catch (e) {
                startSession(decodedText);
              }
              scanner.clear().catch(err => console.error(err));
            },
            (error) => {}
          );
        } catch (e) {
          console.error("Scanner init error", e);
        }
      }, 300);

      return () => {
        clearTimeout(timer);
        if (scanner) {
          scanner.clear().catch(err => console.error("Clean up error", err));
        }
      };
    }
  }, [sessionId, isScanning, validationError]);

  // Parse QR code from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tableParam = params.get('table');
    const restParam = params.get('restaurant');
    const tokenParam = params.get('token');
    
    if (tableParam) {
      if (restParam !== 'REST-1001') {
        setValidationError('Invalid QR Code. Please contact restaurant staff.');
        return;
      }
      
      const checkAndStart = async () => {
        try {
          const dbTables = await api.get('/tables');
          const matchedTable = dbTables.find(t => String(t.tableNumber || t.id) === tableParam);
          
          if (!matchedTable) {
            setValidationError('Invalid Table. Please contact restaurant staff.');
            return;
          }
          
          if (matchedTable.qrToken && matchedTable.qrToken !== tokenParam) {
            setValidationError('Invalid QR Code. Please contact restaurant staff.');
            return;
          }
          
          const currentSession = localStorage.getItem('customerSessionId');
          const currentTable = localStorage.getItem('tableNumber');
          
          if (!currentSession || currentTable !== tableParam) {
            const newSessionId = `sess_${tableParam}_${Date.now()}`;
            localStorage.setItem('customerSessionId', newSessionId);
            localStorage.setItem('tableNumber', tableParam);
            setSessionId(newSessionId);
            setTableNumber(tableParam);
            
            await api.patch(`/tables/${matchedTable.id}/status?status=OCCUPIED`).catch(() => {});
          }
        } catch (err) {
          console.error(err);
          const newSessionId = `sess_${tableParam}_${Date.now()}`;
          localStorage.setItem('customerSessionId', newSessionId);
          localStorage.setItem('tableNumber', tableParam);
          setSessionId(newSessionId);
          setTableNumber(tableParam);
        }
      };
      
      checkAndStart();
      window.history.replaceState({}, '', '/customer');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('customerSessionId');
    localStorage.removeItem('tableNumber');
    setSessionId('');
    setTableNumber('');
    setMyOrders([]);
    setCart({});
  };

  useEffect(() => {
    if (sessionId) {
      fetchMenu();
      fetchDashboardData();
      const interval = setInterval(fetchDashboardData, 3000);
      return () => clearInterval(interval);
    }
  }, [sessionId, tableNumber]);

  const fetchDashboardData = async () => {
    try {
      const activeRes = await api.get('/orders/active');
      const filtered = (activeRes || []).filter(o => String(o.tableNumber || o.tableId) === String(tableNumber));
      const mapped = filtered.map(bo => ({
        id: bo.id.toString(),
        tableNumber: bo.tableNumber || bo.tableId || '?',
        status: bo.status,
        remarks: bo.remarks,
        items: (bo.items || []).map(bi => ({ name: bi.itemName, quantity: bi.quantity, price: bi.price })),
        total: bo.totalAmount || 0,
        time: bo.placedAt ? new Date(bo.placedAt).toLocaleTimeString() : new Date().toLocaleTimeString()
      }));
      setMyOrders(mapped);
    } catch (e) {
      console.error('Failed to fetch dashboard data:', e);
    }
    
    try {
      const dbTables = await api.get('/tables');
      const myTable = dbTables.find(t => String(t.tableNumber || t.id) === String(tableNumber));
      if (myTable) {
        const mappedStatus = myTable.status === 'AVAILABLE' ? 'Available' : myTable.status === 'OCCUPIED' ? 'Occupied' : 'Cleaning';
        setTableStatus(mappedStatus);
        if (mappedStatus === 'Available') {
          handleLogout();
          return;
        }
        
        // Read waiter assignment from backend first (cross-device), fallback to localStorage
        const assignments = JSON.parse(localStorage.getItem('tableWaiterAssignments') || '{}');
        const assignedEmpId = myTable.assignedWaiter || assignments[String(myTable.id)] || '';

        if (assignedEmpId) {
          // Try to resolve name from mockStaff
          const storedStaff = localStorage.getItem('mockStaff');
          if (storedStaff) {
            const staff = JSON.parse(storedStaff);
            const waiter = staff.find(s =>
              s.employeeId === assignedEmpId ||
              s.username === assignedEmpId ||
              String(s.id) === String(assignedEmpId)
            );
            setWaiterName(waiter ? (waiter.name || waiter.employeeId || assignedEmpId) : assignedEmpId);
          } else {
            setWaiterName(assignedEmpId);
          }
        } else {
          setWaiterName('Pending Assignment');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getAuthToken = async () => {
    // Always get a fresh token — customer1 uses Admin@123 (updated by V4 migration)
    const tryLogin = async (user, pass) => {
      try {
        const authData = await api.post('/auth/login', {
          usernameOrEmailOrMobile: user,
          password: pass
        });
        if (authData?.accessToken) {
          localStorage.setItem('token', authData.accessToken);
          return authData.accessToken;
        }
      } catch (e) {
        console.warn(`Silent login failed for ${user}:`, e?.response?.data?.message || e.message);
      }
      return null;
    };

    // Try with current stored token first
    const existingToken = localStorage.getItem('token');
    if (existingToken && !existingToken.startsWith('mock-jwt-token')) {
      return existingToken;
    }

    // Token missing or mock — re-login
    let token = await tryLogin('customer1', 'Admin@123');
    if (!token) token = await tryLogin('customer1', 'password123');
    if (!token) token = await tryLogin('admin', 'password123');
    return token;
  };

  const fetchMenu = async () => {
    setLoading(true);
    try {
      await getAuthToken();
      const cats = await api.get('/categories');
      const itemsResponse = await api.get('/menu-items?size=200');
      const deletedMenuIds = (JSON.parse(localStorage.getItem('deletedMenuItemIds') || '[]')).map(String);
      const activeItems = (itemsResponse.content || [])
        .filter(item => !deletedMenuIds.includes(String(item.id)))
        .filter(item => item.available !== false)
        .map(item => ({
          id: item.id.toString(),
          name: item.name,
          category: item.categoryName || 'General',
          price: Number(item.price || 0),
          type: item.dietaryType === 'VEG' ? 'veg' : 'non-veg',
          isAvailable: item.available
        }));
      setMenu(activeItems);
      setCategories(cats.map(c => c.name));
      if (cats.length > 0) setActiveCategory(cats[0].name);
    } catch (err) {
      console.error('Failed to fetch menu:', err);
      // Fallback to local storage if API fails
      const storedMenu = localStorage.getItem('mockMenu');
      if (storedMenu) {
        const items = JSON.parse(storedMenu);
        const deletedMenuIds = (JSON.parse(localStorage.getItem('deletedMenuItemIds') || '[]')).map(String);
        const activeItems = items
          .filter(item => !deletedMenuIds.includes(String(item.id)))
          .filter(item => item.isAvailable !== false);
        setMenu(activeItems);
        const cats = [...new Set(activeItems.map(item => item.category))];
        setCategories(cats);
        if (cats.length > 0) setActiveCategory(cats[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateCart = (item, delta) => {
    setCart(prev => {
      const current = prev[item.id] || { ...item, quantity: 0 };
      const nextQuantity = current.quantity + delta;
      
      if (nextQuantity <= 0) {
        const newCart = { ...prev };
        delete newCart[item.id];
        return newCart;
      }
      return { ...prev, [item.id]: { ...current, quantity: nextQuantity } };
    });
  };

  const cartTotal = Object.values(cart).reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemCount = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
  const gstAmount = cartTotal * 0.05; // 5% GST
  const grandTotal = cartTotal + gstAmount;

  const handleConfirmOrder = async () => {
    try {
      // Force fresh token — clear stale/mock token first
      const currentToken = localStorage.getItem('token');
      if (!currentToken || currentToken.startsWith('mock-jwt-token')) {
        localStorage.removeItem('token');
      }
      await getAuthToken();
      
      // Get table ID
      const tables = await api.get('/tables');
      const table = tables.find(t => String(t.tableNumber) === String(tableNumber) || String(t.id) === String(tableNumber));
      const tableId = table ? table.id : 1;

      // Post order
      const itemsPayload = Object.values(cart).map(c => ({
        menuItemId: Number(c.id),
        quantity: c.quantity,
        specialInstructions: specialNote
      }));

      const res = await api.post('/orders', {
        tableId: tableId,
        orderType: 'DINE_IN',
        remarks: specialNote,
        items: itemsPayload
      });

      // Save order ID locally so tracking knows what to poll
      if (res && res.id) {
        localStorage.setItem('lastPlacedOrderId', res.id.toString());
      }

      // Update local table status
      if (table) {
        await api.patch(`/tables/${table.id}/status?status=OCCUPIED`).catch(() => {});
      }

      setCart({});
      setShowCartModal(false);
      navigate('/customer/track');
    } catch (err) {
      console.error('Failed to place order:', err);
      alert('Failed to place order: ' + (err.response?.data?.message || err.message));
    }
  };

  if (validationError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-red-100 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center shadow-lg shadow-red-200">
              <X className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">Access Denied</h1>
          <p className="text-gray-500 mb-8 font-semibold leading-relaxed text-red-600">{validationError}</p>
          
          <button 
            type="button" 
            onClick={() => setValidationError('')} 
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
          >
            Retry Scanning
          </button>
        </div>
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-gray-100">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-200">
              <Utensils className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-center text-gray-900 mb-2 tracking-tight">DineFlow</h1>
          <p className="text-gray-500 text-center mb-8 font-medium">Scan table QR code to view menu & order</p>
          
            <div className="space-y-6">
              <div id="reader" className="w-full rounded-2xl overflow-hidden shadow-md border border-gray-100 bg-gray-50"></div>
              <p className="text-sm text-gray-500 text-center font-medium leading-relaxed">
                Please scan the QR code located on your dining table using your mobile camera or webcam to open the menu and place orders.
              </p>
            </div>
          </div>
      </div>
    );
  }

  // Filter Menu
  const filteredMenu = menu.filter(item => {
    if (activeCategory !== item.category) return false;
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    const itemType = (item.type || '').toLowerCase();
    if (filterType === 'VEG' && itemType !== 'veg') return false;
    if (filterType === 'NON_VEG' && itemType !== 'non-veg') return false;
    
    return true;
  });

  const dashboardTotalSpent = myOrders.reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Header */}
      <header className="bg-white sticky top-0 z-10 shadow-sm border-b border-gray-100 pb-2">
        <div className="px-4 py-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-xl">
                <Utensils className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 leading-tight">DineFlow</h1>
                <p className="text-xs text-gray-500 font-medium">Table {tableNumber}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="text-sm font-medium text-red-500 hover:text-red-600 bg-red-50 px-3 py-1.5 rounded-lg transition-colors">Logout</button>
          </div>
          
          <div className="flex justify-between items-center bg-gray-50 rounded-xl p-3 border border-gray-100">
            <div className="text-sm">
              <span className="text-gray-500 font-medium">Waiter: </span>
              <span className="font-bold text-gray-900">{waiterName || 'Assigning...'}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-500 font-medium">Status: </span>
              <span className={`font-bold ${tableStatus === 'Available' ? 'text-green-600' : 'text-blue-600'}`}>{tableStatus || 'Occupied'}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-4 space-x-2 mt-2">
          <button 
            onClick={() => setActiveTab('MENU')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'MENU' ? 'bg-gray-900 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            <MenuIcon size={16} /> Browse Menu
          </button>
          <button 
            onClick={() => setActiveTab('DASHBOARD')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'DASHBOARD' ? 'bg-gray-900 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            <LayoutDashboard size={16} /> My Dashboard
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 max-w-5xl mx-auto">
        
        {activeTab === 'DASHBOARD' && (
          <div className="space-y-6 animate-fade-in-up">
            {tableStatus === 'Waiting for Payment' && (
              <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200 flex flex-col items-center text-center">
                <Receipt size={40} className="mb-3 opacity-90" />
                <h2 className="text-2xl font-black mb-2">Your Bill is Ready!</h2>
                <p className="text-blue-100 font-medium mb-4">Please proceed to the cashier or wait for them to collect your payment.</p>
                <div className="bg-white/20 px-4 py-2 rounded-lg font-bold text-lg w-full max-w-xs">
                  Estimated Total: ₹{dashboardTotalSpent.toFixed(2)}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <p className="text-sm text-gray-500 font-medium mb-1">Orders Placed</p>
                  <h3 className="text-3xl font-black text-gray-900">{myOrders.length}</h3>
               </div>
               <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <p className="text-sm text-gray-500 font-medium mb-1">Estimated Bill</p>
                  <h3 className="text-3xl font-black text-blue-600">₹{dashboardTotalSpent.toFixed(2)}</h3>
               </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4">Your Recent Orders</h3>
              {myOrders.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No orders placed yet.</p>
              ) : (
                <div className="space-y-4">
                  {myOrders.map(order => (
                    <div key={order.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-bold text-gray-900">{order.id}</span>
                        <span className={`text-xs px-2 py-1 rounded-full font-bold ${order.status === 'COMPLETED' || order.status === 'READY' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm text-gray-600">
                            <span>{item.quantity}x {item.name}</span>
                            <span className="font-semibold">₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'MENU' && (
          <div className="animate-fade-in-up">
            {/* Search and Filters */}
            <div className="mb-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Search food..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-500 transition-shadow shadow-sm"
                />
              </div>
              
              <div className="flex gap-2">
                <button onClick={() => setFilterType('ALL')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${filterType === 'ALL' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>ALL</button>
                <button onClick={() => setFilterType('VEG')} className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors ${filterType === 'VEG' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}><Leaf size={14}/> VEG</button>
                <button onClick={() => setFilterType('NON_VEG')} className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors ${filterType === 'NON_VEG' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}><Beef size={14}/> NON-VEG</button>
              </div>
            </div>

            {/* Categories */}
            <div className="flex overflow-x-auto space-x-2 scrollbar-hide mb-6 py-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`whitespace-nowrap px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                    activeCategory === cat
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMenu.map(item => (
                  <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-1">
                           <h3 className="text-lg font-bold text-gray-900 pr-2">{item.name}</h3>
                           {item.type === 'VEG' ? <div className="w-4 h-4 border-2 border-green-600 flex items-center justify-center p-0.5"><div className="w-2 h-2 bg-green-600 rounded-full"></div></div> : item.type === 'NON_VEG' ? <div className="w-4 h-4 border-2 border-red-600 flex items-center justify-center p-0.5"><div className="w-2 h-2 bg-red-600 rounded-full"></div></div> : null}
                        </div>
                        <p className="text-gray-500 text-sm mb-3 line-clamp-2">{item.description}</p>
                      </div>
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                        <span className="text-xl font-black text-gray-900">₹{item.price}</span>
                        
                        {cart[item.id] ? (
                          <div className="flex items-center space-x-3 bg-gray-50 rounded-xl p-1 border border-gray-200">
                            <button onClick={() => updateCart(item, -1)} className="w-8 h-8 flex items-center justify-center text-gray-700 bg-white shadow-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="font-bold text-gray-900 w-4 text-center">{cart[item.id].quantity}</span>
                            <button onClick={() => updateCart(item, 1)} className="w-8 h-8 flex items-center justify-center text-white bg-blue-600 shadow-sm rounded-lg hover:bg-blue-700 transition-colors">
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => updateCart(item, 1)} className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-100 transition-colors">
                            Add +
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Cart Floating Bar */}
      {cartItemCount > 0 && !showCartModal && activeTab === 'MENU' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-gray-200 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] z-20 animate-fade-in-up">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative bg-blue-100 p-3 rounded-xl">
                <ShoppingBag className="w-6 h-6 text-blue-700" />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                  {cartItemCount}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Subtotal</span>
                <span className="text-xl font-black text-gray-900">₹{cartTotal}</span>
              </div>
            </div>
            <button
              onClick={() => setShowCartModal(true)}
              className="bg-gray-900 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-black transition-all shadow-lg hover:-translate-y-1"
            >
              Review Order
            </button>
          </div>
        </div>
      )}

      {/* Order Confirmation Modal */}
      {showCartModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-end sm:items-center">
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 animate-fade-in-up max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-gray-900">Confirm Order</h2>
              <button onClick={() => setShowCartModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {Object.values(cart).map(item => (
                <div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900">{item.name}</h4>
                    <p className="text-sm text-gray-500 font-medium">₹{item.price} x {item.quantity}</p>
                  </div>
                  <div className="font-black text-gray-900">
                    ₹{item.price * item.quantity}
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Special Instructions</label>
              <textarea 
                value={specialNote}
                onChange={(e) => setSpecialNote(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                placeholder="e.g. Less spicy, Extra napkins..."
                rows="2"
              ></textarea>
            </div>

            <div className="border-t border-gray-200 pt-4 mb-6 space-y-2">
              <div className="flex justify-between text-gray-600 font-medium">
                <span>Subtotal</span>
                <span>₹{cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600 font-medium">
                <span>GST (5%)</span>
                <span>₹{gstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-black text-gray-900 pt-2 border-t border-gray-100 mt-2">
                <span>Grand Total</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleConfirmOrder}
              className="w-full bg-green-600 text-white font-black py-4 rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-200 text-lg flex items-center justify-center gap-2"
            >
              <CheckCircle size={22} /> Confirm & Place Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
