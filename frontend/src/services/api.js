import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Connects directly to backend server
});

// Automatically inject JWT Bearer Token into requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
