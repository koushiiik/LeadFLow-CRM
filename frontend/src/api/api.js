import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject JWT Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('leadflow_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token if unauthorized / token expired
      localStorage.removeItem('leadflow_token');
      localStorage.removeItem('leadflow_user');
      // If not already on login page, can reload or redirect
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    // Extract formatted message
    const message =
      error.response?.data?.message ||
      error.response?.data?.errors?.[0] ||
      error.message ||
      'An unexpected error occurred';

    return Promise.reject({
      message,
      errors: error.response?.data?.errors || [message],
      status: error.response?.status,
    });
  }
);

export default api;
