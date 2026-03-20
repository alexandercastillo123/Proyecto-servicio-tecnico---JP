import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  getProfile: () => api.get('/users/profile'),
};

export const adminService = {
  getAppointments: (params) => api.get('/admin/appointments', { params }),
  getUsers: (params) => api.get('/admin/users', { params }),
  getBranches: () => api.get('/admin/sucursales'),
};

export const storeService = {
  createBranch: (data) => api.post('/sucursales', data),
  updateBranch: (id, data) => api.put(`/sucursales/${id}`, data),
};

export default api;
