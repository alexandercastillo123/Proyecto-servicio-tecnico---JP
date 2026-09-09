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
  getProfile: () => api.get('/users/profile'),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
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
  createAppointment: (data) => api.post('/appointments', data),
  getMyAppointments: () => api.get('/appointments'),
  getAppointmentDetails: (id) => api.get(`/appointments/${id}`),
  payAppointment: (id, method) => api.post(`/appointments/${id}/pay`, { paymentMethod: method }),
  cancelAppointment: (id) => api.delete(`/appointments/${id}`),
  addReview: (data) => api.post('/technicians/review', data),
};

export const storeService = {
  getBranches: () => api.get('/sucursales'),
  getNearbyBranches: (params) => api.get('/sucursales/nearby', { params }),
  getBranchDetails: (id) => api.get(`/sucursales/${id}`),
  getProducts: (branchId) => api.get(`/sucursales/${branchId}/products`),
  getOrders: (branchId) => api.get(`/sucursales/orders/store/${branchId}`),
  getMyOrders: () => api.get('/sucursales/orders/my-orders'),
  updateOrderStatus: (id, status) => api.patch(`/sucursales/orders/${id}/status`, { status }),
  createOrder: (data) => api.post('/sucursales/orders', data),
  createBranch: (data) => api.post('/sucursales', data),
  addProduct: (data) => api.post('/sucursales/products', data),
  updateProduct: (id, data) => api.put(`/sucursales/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/sucursales/products/${id}`),
};

export const messageService = {
  getConversations: () => api.get('/messages/conversations'),
  getMessages: (userId) => api.get(`/messages/${userId}`),
  sendMessage: (data) => api.post('/messages', data),
  sendOffer: (data) => api.post('/messages/offer', data),
  acceptOffer: (id) => api.put(`/messages/offer/${id}/accept`),
  rejectOffer: (id) => api.put(`/messages/offer/${id}/reject`),
  cancelOffer: (id) => api.put(`/messages/offer/${id}/cancel`),
};

export default api;
