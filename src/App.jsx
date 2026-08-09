import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import LoginPage from './pages/LoginPage';

// Owner Pages
import DashboardPage from './pages/owner/DashboardPage';
import MenuPage from './pages/MenuPage';
import InventoryManagement from './pages/owner/InventoryManagement';
import ProcurementPage from './pages/owner/ProcurementPage';
import StaffPage from './pages/owner/StaffPage';
import TablesPage from './pages/TablesPage';
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
