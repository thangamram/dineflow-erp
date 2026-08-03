import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import LoginPage from './pages/LoginPage';

// Owner Pages
import DashboardPage from './pages/owner/DashboardPage';
import MenuPage from './pages/owner/MenuPage';
import InventoryManagement from './pages/owner/InventoryManagement';
import ProcurementPage from './pages/owner/ProcurementPage';
import StaffPage from './pages/owner/StaffPage';
import TablesPage from './pages/owner/TablesPage';
import ReportsPage from './pages/owner/ReportsPage';
import SettingsPage from './pages/owner/SettingsPage';
import PayrollManagement from './pages/owner/PayrollManagement';

// Waiter Pages
import WaiterDashboard from './pages/waiter/WaiterDashboard';
import WaiterTables from './pages/waiter/WaiterTables';
import WaiterOrders from './pages/waiter/WaiterOrders';
import WaiterPayroll from './pages/waiter/WaiterPayroll';

// Kitchen Pages
import KitchenDashboard from './pages/kitchen/KitchenDashboard';
import KitchenPayroll from './pages/kitchen/MyPayroll';

// Cashier Pages
import BillingDashboard from './pages/cashier/BillingDashboard';
import CashierHistory from './pages/cashier/CashierHistory';
import CashierPayroll from './pages/cashier/CashierPayroll';

// Customer Pages
import CustomerPortal from './pages/customer/CustomerPortal';
import OrderTracking from './pages/customer/OrderTracking';

// Error Page
import { NotFoundPage } from './pages/ErrorPage';

// Auth Guard (Simplified for now - assumes token means logged in)

// Lazy Loading New Pages
const ForceChangePassword = React.lazy(() => import('./pages/ForceChangePassword'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const AuditLogsPage = React.lazy(() => import('./pages/owner/AuditLogsPage'));
const LeaveRequestsPage = React.lazy(() => import('./pages/shared/LeaveRequestsPage'));
const MyAttendancePage = React.lazy(() => import('./pages/shared/MyAttendancePage'));
const LeaveManagement = React.lazy(() => import('./pages/owner/LeaveManagement'));
const AttendanceManagement = React.lazy(() => import('./pages/owner/AttendanceManagement'));

const SuspenseWrapper = ({ children }) => (
  <React.Suspense fallback={<div className="flex h-screen items-center justify-center text-gray-500">Loading...</div>}>
    {children}
  </React.Suspense>
);

// Force initialize mock data for testing if empty
const initializeMockData = () => {
  const storedTables = localStorage.getItem('mockTables');
  if (!storedTables || storedTables === '[]') {
    const defaultTable = [{ id: '1', number: '1', capacity: 4, status: 'Available', assignedWaiter: 'waiter@dineflow.com' }];
    localStorage.setItem('mockTables', JSON.stringify(defaultTable));
  }
  const storedMenu = localStorage.getItem('mockMenu');
  const hasAllCategories = storedMenu && storedMenu.includes('Starters') && storedMenu.includes('Beverages') && storedMenu.includes('Breads') && storedMenu.includes('Desserts');
  if (!storedMenu || storedMenu === '[]' || !hasAllCategories) {
    const defaultMenu = [
      // === STARTERS ===
      { id: '1', name: 'Masala Dosa', category: 'Starters', price: 120, type: 'veg', status: 'Active', isAvailable: true },
      { id: '2', name: 'Paneer Tikka', category: 'Starters', price: 180, type: 'veg', status: 'Active', isAvailable: true },
      { id: '3', name: 'Veg Spring Roll', category: 'Starters', price: 140, type: 'veg', status: 'Active', isAvailable: true },
      { id: '4', name: 'Aloo Tikki', category: 'Starters', price: 100, type: 'veg', status: 'Active', isAvailable: true },
      { id: '5', name: 'Chicken 65', category: 'Starters', price: 200, type: 'non-veg', status: 'Active', isAvailable: true },
      { id: '6', name: 'Chicken Lollipop', category: 'Starters', price: 220, type: 'non-veg', status: 'Active', isAvailable: true },
      { id: '7', name: 'Fish Fry', category: 'Starters', price: 250, type: 'non-veg', status: 'Active', isAvailable: true },
      { id: '8', name: 'Mutton Seekh Kebab', category: 'Starters', price: 280, type: 'non-veg', status: 'Active', isAvailable: true },

      // === MAINS ===
      { id: '9', name: 'Paneer Butter Masala', category: 'Mains', price: 220, type: 'veg', status: 'Active', isAvailable: true },
      { id: '10', name: 'Veg Fried Rice', category: 'Mains', price: 180, type: 'veg', status: 'Active', isAvailable: true },
      { id: '11', name: 'Dal Tadka', category: 'Mains', price: 150, type: 'veg', status: 'Active', isAvailable: true },
      { id: '12', name: 'Palak Paneer', category: 'Mains', price: 200, type: 'veg', status: 'Active', isAvailable: true },
      { id: '13', name: 'Chicken Biryani', category: 'Mains', price: 280, type: 'non-veg', status: 'Active', isAvailable: true },
      { id: '14', name: 'Mutton Rogan Josh', category: 'Mains', price: 350, type: 'non-veg', status: 'Active', isAvailable: true },
      { id: '15', name: 'Butter Chicken', category: 'Mains', price: 300, type: 'non-veg', status: 'Active', isAvailable: true },
      { id: '16', name: 'Egg Curry', category: 'Mains', price: 160, type: 'non-veg', status: 'Active', isAvailable: true },

      // === BEVERAGES ===
      { id: '17', name: 'Fresh Lime Soda', category: 'Beverages', price: 60, type: 'veg', status: 'Active', isAvailable: true },
      { id: '18', name: 'Mango Lassi', category: 'Beverages', price: 80, type: 'veg', status: 'Active', isAvailable: true },
      { id: '19', name: 'Masala Chai', category: 'Beverages', price: 40, type: 'veg', status: 'Active', isAvailable: true },
      { id: '20', name: 'Cold Coffee', category: 'Beverages', price: 100, type: 'veg', status: 'Active', isAvailable: true },
      { id: '21', name: 'Buttermilk', category: 'Beverages', price: 50, type: 'veg', status: 'Active', isAvailable: true },
      { id: '22', name: 'Fresh Orange Juice', category: 'Beverages', price: 90, type: 'veg', status: 'Active', isAvailable: true },
      { id: '23', name: 'Watermelon Juice', category: 'Beverages', price: 70, type: 'veg', status: 'Active', isAvailable: true },
      { id: '24', name: 'Rose Milk', category: 'Beverages', price: 60, type: 'veg', status: 'Active', isAvailable: true },

      // === BREADS ===
      { id: '25', name: 'Naan', category: 'Breads', price: 40, type: 'veg', status: 'Active', isAvailable: true },
      { id: '26', name: 'Garlic Naan', category: 'Breads', price: 60, type: 'veg', status: 'Active', isAvailable: true },
      { id: '27', name: 'Butter Roti', category: 'Breads', price: 30, type: 'veg', status: 'Active', isAvailable: true },
      { id: '28', name: 'Laccha Paratha', category: 'Breads', price: 50, type: 'veg', status: 'Active', isAvailable: true },
      { id: '29', name: 'Cheese Naan', category: 'Breads', price: 70, type: 'veg', status: 'Active', isAvailable: true },
      { id: '30', name: 'Keema Naan', category: 'Breads', price: 80, type: 'non-veg', status: 'Active', isAvailable: true },
      { id: '31', name: 'Chicken Stuffed Paratha', category: 'Breads', price: 90, type: 'non-veg', status: 'Active', isAvailable: true },

      // === DESSERTS ===
      { id: '32', name: 'Gulab Jamun', category: 'Desserts', price: 80, type: 'veg', status: 'Active', isAvailable: true },
      { id: '33', name: 'Ice Cream Sundae', category: 'Desserts', price: 120, type: 'veg', status: 'Active', isAvailable: true },
      { id: '34', name: 'Rasgulla', category: 'Desserts', price: 70, type: 'veg', status: 'Active', isAvailable: true },
      { id: '35', name: 'Kheer', category: 'Desserts', price: 90, type: 'veg', status: 'Active', isAvailable: true },
      { id: '36', name: 'Jalebi', category: 'Desserts', price: 60, type: 'veg', status: 'Active', isAvailable: true },
      { id: '37', name: 'Brownie with Ice Cream', category: 'Desserts', price: 150, type: 'veg', status: 'Active', isAvailable: true },
      { id: '38', name: 'Egg Pudding', category: 'Desserts', price: 100, type: 'non-veg', status: 'Active', isAvailable: true },
      { id: '39', name: 'Egg Halwa', category: 'Desserts', price: 110, type: 'non-veg', status: 'Active', isAvailable: true }
    ];
    localStorage.setItem('mockMenu', JSON.stringify(defaultMenu));
  }
  const storedStaff = localStorage.getItem('mockStaff');
  let staffList = [];
  if (storedStaff && storedStaff !== '[]') {
    staffList = JSON.parse(storedStaff);
  }
  
  if (!staffList.find(s => s.username === 'owner')) {
    const defaultOwner = {
      id: Date.now(),
      employeeId: 'OWN-0001',
      name: 'Owner Admin',
      username: 'owner',
      password: 'Admin@123',
      role: 'Owner',
      phone: '9876543210',
      email: 'owner@dineflow.com',
      joiningDate: new Date().toISOString().split('T')[0],
      status: 'Active',
      forcePasswordChange: false
    };
    staffList.push(defaultOwner);
    localStorage.setItem('mockStaff', JSON.stringify(staffList));
  }
  
  if (!localStorage.getItem('mockLeaves')) {
    localStorage.setItem('mockLeaves', '[]');
  }
  if (!localStorage.getItem('mockAttendance')) {
    localStorage.setItem('mockAttendance', '[]');
  }
  if (!localStorage.getItem('mockNotifications')) {
    localStorage.setItem('mockNotifications', '[]');
  }
};
initializeMockData();

// Auth Guard (Simplified for now - assumes token means logged in)
const PrivateRoute = ({ children, allowedRoles }) => {
  const isAuthenticated = !!localStorage.getItem('token');
  const userRole = localStorage.getItem('role'); // e.g. 'ROLE_OWNER', 'ROLE_WAITER'

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return children;
};

function App() {
  return (
    <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="force-change-password" element={<SuspenseWrapper><ForceChangePassword /></SuspenseWrapper>} />
        </Route>

        {/* Protected Main Routes */}
        <Route element={<MainLayout />}>
          
          {/* Global Employee Routes */}
          <Route path="profile" element={<PrivateRoute allowedRoles={['ROLE_OWNER', 'ROLE_ADMIN', 'ROLE_WAITER', 'ROLE_KITCHEN', 'ROLE_CASHIER']}><SuspenseWrapper><ProfilePage /></SuspenseWrapper></PrivateRoute>} />
          <Route path="employee/leave" element={<PrivateRoute allowedRoles={['ROLE_WAITER', 'ROLE_KITCHEN', 'ROLE_CASHIER']}><SuspenseWrapper><LeaveRequestsPage /></SuspenseWrapper></PrivateRoute>} />
          <Route path="employee/attendance" element={<PrivateRoute allowedRoles={['ROLE_WAITER', 'ROLE_KITCHEN', 'ROLE_CASHIER']}><SuspenseWrapper><MyAttendancePage /></SuspenseWrapper></PrivateRoute>} />
          
          {/* Owner Portal */}
          <Route path="owner/dashboard" element={<PrivateRoute allowedRoles={['ROLE_OWNER', 'ROLE_ADMIN']}><DashboardPage /></PrivateRoute>} />
          <Route path="owner/menu" element={<PrivateRoute allowedRoles={['ROLE_OWNER', 'ROLE_ADMIN']}><MenuPage /></PrivateRoute>} />
          <Route path="owner/inventory" element={<PrivateRoute allowedRoles={['ROLE_OWNER', 'ROLE_ADMIN']}><InventoryManagement /></PrivateRoute>} />
          <Route path="owner/procurement" element={<PrivateRoute allowedRoles={['ROLE_OWNER', 'ROLE_ADMIN']}><ProcurementPage /></PrivateRoute>} />
          <Route path="owner/staff" element={<PrivateRoute allowedRoles={['ROLE_OWNER', 'ROLE_ADMIN']}><StaffPage /></PrivateRoute>} />
          <Route path="owner/payroll" element={<PrivateRoute allowedRoles={['ROLE_OWNER', 'ROLE_ADMIN']}><PayrollManagement /></PrivateRoute>} />
          <Route path="owner/tables" element={<PrivateRoute allowedRoles={['ROLE_OWNER', 'ROLE_ADMIN']}><TablesPage /></PrivateRoute>} />
          <Route path="owner/reports" element={<PrivateRoute allowedRoles={['ROLE_OWNER', 'ROLE_ADMIN', 'ROLE_CASHIER']}><ReportsPage /></PrivateRoute>} />
          <Route path="owner/settings" element={<PrivateRoute allowedRoles={['ROLE_OWNER', 'ROLE_ADMIN']}><SettingsPage /></PrivateRoute>} />
          <Route path="owner/audit-logs" element={<PrivateRoute allowedRoles={['ROLE_OWNER', 'ROLE_ADMIN']}><SuspenseWrapper><AuditLogsPage /></SuspenseWrapper></PrivateRoute>} />
          <Route path="owner/leave" element={<PrivateRoute allowedRoles={['ROLE_OWNER', 'ROLE_ADMIN']}><SuspenseWrapper><LeaveManagement /></SuspenseWrapper></PrivateRoute>} />
          <Route path="owner/attendance" element={<PrivateRoute allowedRoles={['ROLE_OWNER', 'ROLE_ADMIN']}><SuspenseWrapper><AttendanceManagement /></SuspenseWrapper></PrivateRoute>} />

          {/* Waiter Portal */}
          <Route path="waiter/dashboard" element={<PrivateRoute allowedRoles={['ROLE_OWNER', 'ROLE_ADMIN', 'ROLE_WAITER']}><WaiterDashboard /></PrivateRoute>} />
          <Route path="waiter/tables" element={<PrivateRoute allowedRoles={['ROLE_OWNER', 'ROLE_ADMIN', 'ROLE_WAITER']}><WaiterTables /></PrivateRoute>} />
          <Route path="waiter/orders" element={<PrivateRoute allowedRoles={['ROLE_OWNER', 'ROLE_ADMIN', 'ROLE_WAITER']}><WaiterOrders /></PrivateRoute>} />
          <Route path="waiter/payroll" element={<PrivateRoute allowedRoles={['ROLE_OWNER', 'ROLE_ADMIN', 'ROLE_WAITER']}><WaiterPayroll /></PrivateRoute>} />

          {/* Kitchen Portal */}
          <Route path="kitchen/dashboard" element={<PrivateRoute allowedRoles={['ROLE_OWNER', 'ROLE_ADMIN', 'ROLE_KITCHEN']}><KitchenDashboard /></PrivateRoute>} />
          <Route path="kitchen/payroll" element={<PrivateRoute allowedRoles={['ROLE_OWNER', 'ROLE_ADMIN', 'ROLE_KITCHEN']}><KitchenPayroll /></PrivateRoute>} />

          {/* Cashier Portal */}
          <Route path="cashier/dashboard" element={<PrivateRoute allowedRoles={['ROLE_OWNER', 'ROLE_ADMIN', 'ROLE_CASHIER']}><BillingDashboard /></PrivateRoute>} />
          <Route path="cashier/history" element={<PrivateRoute allowedRoles={['ROLE_OWNER', 'ROLE_ADMIN', 'ROLE_CASHIER']}><CashierHistory /></PrivateRoute>} />
          <Route path="cashier/payroll" element={<PrivateRoute allowedRoles={['ROLE_OWNER', 'ROLE_ADMIN', 'ROLE_CASHIER']}><CashierPayroll /></PrivateRoute>} />
          
          <Route path="unauthorized" element={<div className="flex flex-col items-center justify-center h-full text-center">
            <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">403</h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">Unauthorized Access</p>
          </div>} />
        </Route>

        {/* Public Routes */}
        <Route path="/customer">
          <Route index element={<CustomerPortal />} />
          <Route path="track" element={<OrderTracking />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
  );
}

export default App;
