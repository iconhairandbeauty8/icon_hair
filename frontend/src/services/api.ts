import axios from 'axios';

// Always use relative /api — the frontend proxy server (server.js) forwards to the backend.
// This means <img src="/api/images/123"> works correctly on any environment.
const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

// Resolve image URLs — relative paths are served via the proxy, absolute URLs pass through.
export function resolveImageUrl(url: string | undefined | null): string {
  if (!url) return '';
  // Already absolute — use as-is
  if (url.startsWith('http')) return url;
  // Relative /api/images/... — served via frontend proxy
  return url;
}

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global error handling
// Only redirect to /login on 401 for protected API calls — never for auth endpoints
// (login/register/me), otherwise wrong-password errors silently reload the page.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url: string = err.config?.url ?? '';
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/me');
    if (err.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ===================== AUTH =====================
export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (data: object) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// ===================== SERVICES =====================
export const serviceApi = {
  list: (params?: object) => api.get('/services', { params }),
  categories: () => api.get('/services/categories'),
  create: (data: object) => api.post('/services', data),
  update: (id: string, data: object) => api.put(`/services/${id}`, data),
};

// ===================== STAFF =====================
export const staffApi = {
  list: () => api.get('/staff'),
  get: (id: string) => api.get(`/staff/${id}`),
  me: () => api.get('/staff/me'),
  myBookings: (params?: object) => api.get('/staff/bookings', { params }),
  create: (data: object) => api.post('/staff', data),
  update: (id: string, data: object) => api.put(`/staff/${id}`, data),
};

// ===================== BOOKINGS =====================
export const bookingApi = {
  availability: (params: object) => api.get('/bookings/availability', { params }),
  list: (params?: object) => api.get('/bookings', { params }),
  get: (id: string) => api.get(`/bookings/${id}`),
  create: (data: object) => api.post('/bookings', data),
  updateStatus: (id: string, status: string) => api.put(`/bookings/${id}/status`, { status }),
  reschedule: (id: string, data: object) => api.put(`/bookings/${id}/reschedule`, data),
};

// ===================== PAYMENTS =====================
export const paymentApi = {
  createIntent: (data: object) => api.post('/payments/create-intent', data),
  refund: (bookingId: string, reason?: string) => api.post('/payments/refund', { booking_id: bookingId, reason }),
  purchaseVoucher: (data: object) => api.post('/payments/voucher/purchase', data),
};

// ===================== INVENTORY =====================
export const inventoryApi = {
  list: (params?: object) => api.get('/inventory', { params }),
  alerts: () => api.get('/inventory/alerts'),
  transactions: (params?: object) => api.get('/inventory/transactions', { params }),
  create: (data: object) => api.post('/inventory', data),
  adjust: (id: string, adjustment: number, reason: string) => api.put(`/inventory/${id}/adjust`, { adjustment, reason }),
};

// ===================== REPORTS =====================
export const reportApi = {
  revenue: (params?: object) => api.get('/reports/revenue', { params }),
  staffPerformance: (params?: object) => api.get('/reports/staff-performance', { params }),
  servicesAnalysis: (params?: object) => api.get('/reports/services-analysis', { params }),
  customerAnalytics: (params?: object) => api.get('/reports/customer-analytics', { params }),
  dashboardSummary: () => api.get('/reports/dashboard-summary'),
};

// ===================== PROMOTIONS =====================
export const promotionApi = {
  list: () => api.get('/promotions'),
  create: (data: object) => api.post('/promotions', data),
  validate: (code: string, serviceId: string, amount: number) =>
    api.post('/promotions/validate', { code, service_id: serviceId, amount }),
};

// ===================== REVIEWS =====================
export const reviewApi = {
  list: (params?: object) => api.get('/reviews', { params }),
  create: (data: object) => api.post('/reviews', data),
};

// ===================== SOCIAL =====================
export const socialApi = {
  list: () => api.get('/social'),
  create: (data: object) => api.post('/social', data),
  like: (postId: string) => api.post(`/social/${postId}/like`),
};

// ===================== LOYALTY =====================
export const loyaltyApi = {
  profile: () => api.get('/loyalty/profile'),
  customers: () => api.get('/loyalty/customers'),
  getSettings: () => api.get('/loyalty/settings'),
  saveSettings: (data: object) => api.put('/loyalty/settings', data),
};

// ===================== VOUCHERS =====================
export const voucherApi = {
  validate: (code: string) => api.get(`/vouchers/validate/${code}`),
  myVouchers: () => api.get('/vouchers/my-vouchers'),
};

// ===================== DASHBOARD =====================
export const dashboardApi = {
  get: () => api.get('/dashboard'),
};

// ===================== CUSTOMERS =====================
export const customerApi = {
  list: (params?: object) => api.get('/customers', { params }),
};

// ===================== WHATSAPP =====================
export const whatsappApi = {
  getQR: () => api.get('/whatsapp/qr'),
  send: (data: object) => api.post('/whatsapp/send', data),
};

// ===================== UPLOAD =====================
export const uploadApi = {
  single: (file: File, folder = 'general') => {
    const fd = new FormData();
    fd.append('image', file);
    return api.post(`/upload/single?folder=${folder}`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  multiple: (files: File[], folder = 'general') => {
    const fd = new FormData();
    files.forEach(f => fd.append('images', f));
    return api.post(`/upload/multiple?folder=${folder}`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default api;
