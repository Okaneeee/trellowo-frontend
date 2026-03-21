import axios from 'axios';

// Custom Axios instance
const api = axios.create({
  // Backend URL
  baseURL: 'http://localhost:5000', 
});

// Interceptor (running before every request)
api.interceptors.request.use(
  (config) => {
    // Look for the token in the browser's local storage
    const token = localStorage.getItem('token');
    
    // If we find it, attach it to the headers
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