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
      const token = localStorage.getItem('token');
      const isMockToken = token && token.startsWith('mock-jwt-token');
      
      // Don't redirect customer portal — they auto-login silently
      if (!isLoginRequest && !isMockToken && !isCustomerPortal) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
