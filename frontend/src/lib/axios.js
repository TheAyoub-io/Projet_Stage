import axios from 'axios';
import { Capacitor } from '@capacitor/core';

export const API_BASE_URL = Capacitor.isNativePlatform() ? 'http://10.0.2.2:8000' : 'http://localhost:8000';
export const WS_BASE_URL = Capacitor.isNativePlatform() ? 'ws://10.0.2.2:8000' : 'ws://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT token if it exists in localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor to handle global errors (like 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || '';
    const isAuthRequest = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');

    if (error.response?.status === 401 && !isAuthRequest) {
      const token = localStorage.getItem('token');
      if (token) {
        localStorage.removeItem('token');
        const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/'];
        const path = window.location.pathname;
        if (!publicPaths.includes(path)) {
          window.location.href = '/login?session=expired';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

