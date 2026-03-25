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
  getBranches: () => api.get('/admin/sucursales'),
  createBranch: (data) => api.post('/sucursales', data),
  updateBranch: (id, data) => api.put(`/sucursales/${id}`, data),
  getProducts: (id) => api.get(`/sucursales/${id}/products`),
  addProduct: (data) => api.post('/sucursales/products', data),
  updateProduct: (id, data) => api.put(`/sucursales/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/sucursales/products/${id}`),
  uploadStoreImage: (formData) => api.post('/sucursales/upload-image', formData, { 
    headers: { 'Content-Type': 'multipart/form-data' } 
  }),
  uploadProductImage: (formData) => api.post('/sucursales/products/upload-image', formData, { 
    headers: { 'Content-Type': 'multipart/form-data' } 
  }),
  getOrders: (storeId) => api.get(`/sucursales/orders/store/${storeId}`),
  updateOrderStatus: (id, status) => api.patch(`/sucursales/orders/${id}/status`, { status }),
  getStoreAppointments: (storeId) => api.get(`/sucursales/${storeId}/appointments`),
};

export default api;
