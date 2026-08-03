import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Package,
  ChefHat,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  UtensilsCrossed,
  Users,
  Grid3x3,
  BarChart3,
  Settings,
  LogOut,
  MonitorPlay,
  Banknote,
  UserCheck,
  FileText
} from 'lucide-react';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const userRole = localStorage.getItem('role') || 'ROLE_OWNER';

  const getNavItems = () => {
    switch (userRole) {
      case 'ROLE_OWNER':
      case 'ROLE_ADMIN':
        return [
          { path: '/owner/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { path: '/owner/menu', label: 'Menu', icon: ChefHat },
          { path: '/owner/inventory', label: 'Inventory', icon: Package },
          { path: '/owner/procurement', label: 'Procurement', icon: Package },
          { path: '/owner/staff', label: 'Staff', icon: Users },
          { path: '/owner/payroll', label: 'Payroll', icon: Banknote },
          { path: '/owner/attendance', label: 'Attendance', icon: UserCheck },
          { path: '/owner/leave', label: 'Leave Mgmt', icon: FileText },
          { path: '/owner/tables', label: 'Tables', icon: Grid3x3 },
          { path: '/owner/reports', label: 'Reports', icon: BarChart3 },
          { path: '/owner/audit-logs', label: 'Audit Logs', icon: ClipboardList },
          { path: '/owner/settings', label: 'Settings', icon: Settings },
        ];
      case 'ROLE_WAITER':
        return [
          { path: '/waiter/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { path: '/waiter/tables', label: 'Tables', icon: Grid3x3 },
          { path: '/waiter/orders', label: 'Orders', icon: ClipboardList },
          { path: '/employee/leave', label: 'Leave Requests', icon: FileText },
          { path: '/employee/attendance', label: 'My Attendance', icon: UserCheck },
          { path: '/waiter/payroll', label: 'Payroll', icon: Banknote },
        ];
      case 'ROLE_KITCHEN':
        return [
          { path: '/kitchen/dashboard', label: 'KDS', icon: MonitorPlay },
          { path: '/employee/leave', label: 'Leave Requests', icon: FileText },
          { path: '/employee/attendance', label: 'My Attendance', icon: UserCheck },
          { path: '/kitchen/payroll', label: 'Payroll', icon: Banknote }
        ];
      case 'ROLE_CASHIER':
        return [
          { path: '/cashier/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { path: '/cashier/history', label: 'History', icon: ClipboardList },
          { path: '/employee/leave', label: 'Leave Requests', icon: FileText },
          { path: '/employee/attendance', label: 'My Attendance', icon: UserCheck },
          { path: '/cashier/payroll', label: 'Payroll', icon: Banknote },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  const handleLogout = () => {
    const userRole = localStorage.getItem('role') || 'Unknown';
    const username = localStorage.getItem('username') || 'Unknown';
    
    const auditLogs = JSON.parse(localStorage.getItem('mockAuditLogs') || '[]');
    auditLogs.unshift({
      id: Date.now(),
      timestamp: new Date().toISOString(),
      action: 'Logout',
      user: username,
      role: userRole,
      details: 'Successful logout'
    });
    localStorage.setItem('mockAuditLogs', JSON.stringify(auditLogs));

    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    localStorage.removeItem('employeeId');
    navigate('/login');
  };

  return (
    <aside className={`relative flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
      <div className="flex items-center justify-center h-20 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-center bg-blue-100 text-blue-600 rounded-xl w-10 h-10">
            <UtensilsCrossed size={24} />
        </div>
        {!collapsed && <span className="ml-3 font-bold text-xl text-gray-900 dark:text-white truncate">DineFlow</span>}
      </div>

      <button
        className="absolute -right-3 top-24 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 rounded-full p-1 hover:text-blue-600 focus:outline-none"
        onClick={() => setCollapsed(!collapsed)}
        aria-label="Toggle sidebar"
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-3 py-3 rounded-xl transition-colors ${
                isActive 
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-semibold' 
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
              }`
            }
            title={item.label}
          >
            <item.icon size={20} className={collapsed ? 'mx-auto' : ''} />
            {!collapsed && <span className="ml-3 truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-1">
          <NavLink 
            to="/profile"
            className={({ isActive }) =>
              `flex items-center px-3 py-3 rounded-xl transition-colors ${
                isActive 
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-semibold' 
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
              }`
            }
            title="Profile"
          >
            <Settings size={20} className={collapsed ? 'mx-auto' : ''} />
            {!collapsed && <span className="ml-3 font-medium">Profile & Settings</span>}
          </NavLink>
          <button 
            className="flex items-center w-full px-3 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut size={20} className={collapsed ? 'mx-auto' : ''} />
            {!collapsed && <span className="ml-3 font-medium">Logout</span>}
          </button>
      </div>
    </aside>
  );
};

export default Sidebar;
