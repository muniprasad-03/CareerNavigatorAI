import axios from 'axios';

const api = axios.create({
  baseURL: '/api', 
});

// Request interceptor for API calls
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Unauthorized! Clearing token and redirecting...");
      localStorage.removeItem('token');
      if (!window.location.pathname.includes('/login')) {
         window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export const saveCareer = (id) => api.post(`/careers/${id}/save`);
export const unsaveCareer = (id) => api.delete(`/careers/${id}/save`);
export const getSavedCareers = () => api.get('/careers/saved');

export default api;
