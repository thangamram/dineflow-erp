import axios from 'axios';

const api = axios.create({
  baseURL: 'https://restaurant-erp-backend-production.up.railway.app/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === 'object' && response.data.success === true) {
      return response.data.data;
    }
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      const isCustomerPortal = window.location.pathname.includes('/customer');
      const isPortalPage = window.location.pathname.includes('/owner') ||
                           window.location.pathname.includes('/waiter') ||
                           window.location.pathname.includes('/kitchen') ||
                           window.location.pathname.includes('/cashier');
      const token = localStorage.getItem('token');
      
      // Don't redirect on customer portal or if we're mid-login
      // Don't redirect from portal pages on every 401 (token might just be slow to refresh)
      // Only redirect if we have NO token at all
      if (!isLoginRequest && !isCustomerPortal && !isPortalPage && !token) {
        window.location.href = '/login';
      } else if (!isLoginRequest && !isCustomerPortal && token && !token.startsWith('mock-jwt-token')) {
        // Token is real but expired - clear and redirect
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
