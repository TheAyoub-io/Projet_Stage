import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
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
    if (error.response && error.response.status === 401) {
      const token = localStorage.getItem('token');
      if (token) {
        localStorage.removeItem('token');
        const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/'];
        const path = window.location.pathname;
        if (!publicPaths.includes(path)) {
          window.location.href = '/login';
        } else {
          window.location.reload();
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

