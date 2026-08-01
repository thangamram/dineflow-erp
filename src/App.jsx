import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import OrdersPage from './pages/OrdersPage';
import MenuPage from './pages/MenuPage';
import InventoryPage from './pages/InventoryPage';
import StaffPage from './pages/StaffPage';
import TablesPage from './pages/TablesPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import OnboardingPage from './pages/OnboardingPage';
import KdsPage from './pages/KdsPage';
import { NotFoundPage } from './pages/ErrorPage';

// Auth and Setup Guard
const PrivateRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('token');
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  const isSetupComplete = !!localStorage.getItem('onboardingCompleted');
  if (!isSetupComplete) return <Navigate to="/setup" replace />;
  
  return children;
};

const SetupRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('token');
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  const isSetupComplete = !!localStorage.getItem('onboardingCompleted');
  if (isSetupComplete) return <Navigate to="/dashboard" replace />;
  
  return children;
};

function App() {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Standalone Setup Route */}
      <Route 
        path="/setup" 
        element={
          <SetupRoute>
            <OnboardingPage />
          </SetupRoute>
        } 
      />

      {/* Private Dashboard Routes */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="menu" element={<MenuPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="staff" element={<StaffPage />} />
        <Route path="tables" element={<TablesPage />} />
        <Route path="kds" element={<KdsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        
        {/* 404 Catch all within layout */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
