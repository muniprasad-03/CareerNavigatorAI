import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Note: Make sure backend is on 5000
});

export const setAuthToken = token => {
  if (token) {
    api.defaults.headers.common['x-auth-token'] = token;
  } else {
    delete api.defaults.headers.common['x-auth-token'];
  }
};

export const saveCareer = (id) => api.post(`/careers/${id}/save`);
export const unsaveCareer = (id) => api.delete(`/careers/${id}/save`);
export const getSavedCareers = () => api.get('/careers/saved');

export default api;
