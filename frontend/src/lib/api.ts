import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('haroti_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('haroti_token');
      localStorage.removeItem('haroti_user');
      if (!window.location.pathname.includes('/login')) {
        const base = import.meta.env.BASE_URL.replace(/\/$/, '');
        window.location.href = `${base}/login`;
      }
    }
    return Promise.reject(error);
  },
);

export default api;
