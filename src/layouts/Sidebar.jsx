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
  MonitorPlay
} from 'lucide-react';
import styles from './Sidebar.module.css';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/orders', label: 'Orders', icon: ClipboardList },
  { path: '/menu', label: 'Menu', icon: ChefHat },
  { path: '/inventory', label: 'Inventory', icon: Package },
  { path: '/staff', label: 'Staff', icon: Users },
  { path: '/kds', label: 'KDS', icon: MonitorPlay },
  { path: '/billing', label: 'Billing', icon: CreditCard },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
];

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      <div className={styles.logo}>
        <UtensilsCrossed size={28} className={styles.logoIcon} />
        {!collapsed && <span className={styles.logoText}>DineFlow</span>}
      </div>

      <button
        className={styles.toggle}
        onClick={() => setCollapsed(!collapsed)}
        aria-label="Toggle sidebar"
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>

      <nav className={styles.nav}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.active : ''}`
            }
            title={item.label}
          >
            <item.icon size={20} />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <button className={styles.logout} onClick={handleLogout} title="Logout">
        <LogOut size={20} />
        {!collapsed && <span>Logout</span>}
      </button>
    </aside>
  );
};

export default Sidebar;
