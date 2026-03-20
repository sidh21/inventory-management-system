import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:57425/api' });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

export const authApi = {
  login:    (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me:       ()     => api.get('/auth/me'),
};

export const dashboardApi = { get: () => api.get('/dashboard') };

export const productsApi = {
  getAll:  (params) => api.get('/products', { params }),
  getById: (id)     => api.get(`/products/${id}`),
  create:  (data)   => api.post('/products', data),
  update:  (id, d)  => api.put(`/products/${id}`, d),
  delete:  (id)     => api.delete(`/products/${id}`),
  getQR:   (id)     => api.get(`/products/${id}/qr`),
};

export const categoriesApi = {
  getAll:  ()       => api.get('/categories'),
  create:  (data)   => api.post('/categories', data),
  update:  (id, d)  => api.put(`/categories/${id}`, d),
  delete:  (id)     => api.delete(`/categories/${id}`),
};

export const suppliersApi = {
  getAll:  ()       => api.get('/suppliers'),
  getById: (id)     => api.get(`/suppliers/${id}`),
  create:  (data)   => api.post('/suppliers', data),
  update:  (id, d)  => api.put(`/suppliers/${id}`, d),
  delete:  (id)     => api.delete(`/suppliers/${id}`),
};

export const stockApi = {
  getLogs: (params) => api.get('/stock', { params }),
  adjust:  (data)   => api.post('/stock/adjust', data),
};

export const purchaseOrdersApi = {
  getAll:  (params) => api.get('/purchase-orders', { params }),
  getById: (id)     => api.get(`/purchase-orders/${id}`),
  create:  (data)   => api.post('/purchase-orders', data),
  receive: (id)     => api.patch(`/purchase-orders/${id}/receive`),
  cancel:  (id)     => api.patch(`/purchase-orders/${id}/cancel`),
};

export const reportsApi = {
  inventory:      ()         => api.get('/reports/inventory'),
  stockMovements: (days)     => api.get('/reports/stock-movements', { params: { days } }),
  exportProducts: ()         => api.get('/reports/export/products', { responseType: 'blob' }),
  exportStockLogs:(from, to) => api.get('/reports/export/stock-logs', { params: { from, to }, responseType: 'blob' }),
};

export const notificationsApi = {
  getAll:      (unreadOnly) => api.get('/notifications', { params: { unreadOnly } }),
  unreadCount: ()           => api.get('/notifications/unread-count'),
  markRead:    (id)         => api.patch(`/notifications/${id}/read`),
  markAllRead: ()           => api.patch('/notifications/read-all'),
  delete:      (id)         => api.delete(`/notifications/${id}`),
  checkStock:  ()           => api.post('/notifications/check-stock'),
};

export const auditLogsApi = {
  getAll: (params) => api.get('/audit-logs', { params }),
};

export const usersApi = {
  getAll:   ()       => api.get('/users'),
  update:   (id, d)  => api.put(`/users/${id}`, d),
  delete:   (id)     => api.delete(`/users/${id}`),
  register: (data)   => api.post('/auth/register', data),
};

export const downloadBlob = (blob, filename) => {
  const url  = window.URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};
