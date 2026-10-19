import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for tokens
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Admin-specific axios instance (same token key, different service namespace)
const adminApi = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});
adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use((response) => {
  return response;
}, (error) => {
  if (error.response?.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
      window.location.href = '/login';
    }
  }
  return Promise.reject(error);
});

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  validateEmail: (email) => api.post('/auth/validate-email', { email }),
  validateUsername: (username) => api.post('/auth/validate-username', { username }),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  changePassword: (data) => api.post('/auth/change-password', { newPassword: data.newPassword || data }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }).then(r => r.data),
  verifyCode: (email, code) => api.post('/auth/verify-code', { email, code }).then(r => r.data),
  resetPassword: (email, code, newPassword) => api.post('/auth/reset-password', { email, code, newPassword }).then(r => r.data),
  uploadProfilePhoto: (formData) => api.post('/users/profile/photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

export const notificationService = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  getSettings: () => api.get('/notifications/settings'),
  updateSettings: (data) => api.put('/notifications/settings', data),
  saveDeviceToken: (token, platform = 'web') => api.post('/notifications/token', { token, platform }),
};

export const techService = {
  getAppointments: () => api.get('/appointments'),
  updateStatus: (id, status) => api.put(`/appointments/${id}/status`, { status }),
  setPrice: (id, price) => api.patch(`/appointments/${id}/price`, { price }),
  confirmPayment: (id) => api.post(`/appointments/${id}/confirm-payment`),
  getSchedule: (id) => api.get(`/technicians/${id}/schedule`),
  updateSchedule: (schedules) => api.post('/technicians/schedule', { schedules }),
  toggleAvailability: (isAvailable) => api.patch('/users/availability', { is_available: isAvailable }),
};
export const clientService = {
  getTechnicians: (params) => api.get('/technicians', { params }),
  getNearbyTechnicians: (params) => api.get('/technicians/nearby', { params }),
  getTechnicianDetails: (id) => api.get(`/technicians/${id}`),
  getTechnicianSchedule: (id) => api.get(`/technicians/${id}/schedule`),
  createAppointment: (data) => api.post('/appointments', data),
  getMyAppointments: () => api.get('/appointments'),
  getAppointmentDetails: (id) => api.get(`/appointments/${id}`),
  payAppointment: (id, method) => api.post(`/appointments/${id}/pay`, { paymentMethod: method }),
  cancelAppointment: (id) => api.delete(`/appointments/${id}`),
  confirmCompletion: (id) => api.post(`/appointments/${id}/confirm-completion`),
  addReview: (data) => api.post('/technicians/review', data),
  getUserById: (id) => api.get(`/users/${id}`),
};

export const storeService = {
  getBranches: () => api.get('/sucursales'),
  getNearbyBranches: (params) => api.get('/sucursales/nearby', { params }),
  getBranchDetails: (id) => api.get(`/sucursales/${id}`),
  getMyStore: () => api.get('/sucursales/my-store'),
  getStoreSchedules: (id) => api.get(`/sucursales/${id}/schedules`),
  getStoreAppointments: (id) => api.get(`/sucursales/${id}/appointments`),
  getStoreReviews: (id) => api.get(`/sucursales/${id}/reviews`),
  addStoreReview: (id, data) => api.post(`/sucursales/${id}/reviews`, data),
  getCatalogProducts: (params) => api.get('/sucursales/products/catalog', { params }),
  getProducts: (branchId) => api.get(`/sucursales/${branchId}/products`),
  getOrders: (branchId) => api.get(`/sucursales/orders/store/${branchId}`),
  getMyOrders: () => api.get('/sucursales/orders/my-orders'),
  updateOrderStatus: (id, status) => api.patch(`/sucursales/orders/${id}/status`, { status }),
  payOrder: (id, method) => api.post(`/sucursales/orders/${id}/pay`, { paymentMethod: method }),
  confirmOrderPayment: (id) => api.post(`/sucursales/orders/${id}/confirm-payment`),
  createOrder: (data) => api.post('/sucursales/orders', data),
  createBranch: (data) => api.post('/sucursales', data),
  updateBranch: (id, data) => api.put(`/sucursales/${id}`, data),
  addProduct: (data) => api.post('/sucursales/products', data),
  updateProduct: (id, data) => api.put(`/sucursales/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/sucursales/products/${id}`),
  uploadProductImage: (formData) => api.post('/sucursales/products/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  uploadStoreImage: (formData) => api.post('/sucursales/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export const messageService = {
  getConversations: () => api.get('/messages/conversations'),
  getMessages: (userId) => api.get(`/messages/${userId}`),
  sendMessage: (data) => api.post('/messages', data),
  sendMediaMessage: (formData) => api.post('/messages/media', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  sendOffer: (data) => api.post('/messages/offer', data),
  acceptOffer: (id) => api.put(`/messages/offer/${id}/accept`),
  rejectOffer: (id) => api.put(`/messages/offer/${id}/reject`),
  cancelOffer: (id) => api.put(`/messages/offer/${id}/cancel`),
  updateMessage: (id, messageText) => api.put(`/messages/${id}`, { messageText }),
  deleteMessage: (id, deleteForEveryone = false) => api.delete(`/messages/${id}`, { data: { deleteForEveryone } }),
  markAsRead: (id) => api.put(`/messages/${id}/read`),
};

export const culqiService = {
  getPublicKey: () => api.get('/culqi/public-key'),
  payAppointment: (id, culqiToken) => api.post(`/culqi/pay-appointment/${id}`, { culqiToken }),
  payOrder: (id, culqiToken) => api.post(`/culqi/pay-order/${id}`, { culqiToken }),
};

export const adminService = {
  getAppointments: (params) => adminApi.get('/admin/appointments', { params }),
  getUsers: (params) => adminApi.get('/admin/users', { params }),
  getBranches: () => adminApi.get('/admin/sucursales'),
  getOrders: (params) => adminApi.get('/admin/orders', { params }),
};

export const adminStoreService = {
  getBranches: () => adminApi.get('/admin/sucursales'),
  createBranch: (data) => adminApi.post('/sucursales', data),
  updateBranch: (id, data) => adminApi.put(`/sucursales/${id}`, data),
  getProducts: (id) => adminApi.get(`/sucursales/${id}/products`),
  addProduct: (data) => adminApi.post('/sucursales/products', data),
  updateProduct: (id, data) => adminApi.put(`/sucursales/products/${id}`, data),
  deleteProduct: (id) => adminApi.delete(`/sucursales/products/${id}`),
  uploadStoreImage: (formData) => adminApi.post('/sucursales/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  uploadProductImage: (formData) => adminApi.post('/sucursales/products/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getOrders: (storeId) => adminApi.get(`/sucursales/orders/store/${storeId}`),
  updateOrderStatus: (id, status) => adminApi.patch(`/sucursales/orders/${id}/status`, { status }),
  getStoreAppointments: (storeId) => adminApi.get(`/sucursales/${storeId}/appointments`),
};

export default api;
