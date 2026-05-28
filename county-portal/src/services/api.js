import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default {
  login: (identifier, password) => api.post('/auth/login', { identifier, password }),
  getProfile: () => api.get('/auth/profile'),

  getDashboardStats: () => api.get('/reports/dashboard'),
  getKPIData: params => api.get('/reports/kpi', { params }),
  exportReport: params => api.get('/reports/export', { params, responseType: 'blob' }),
  exportReportJson: params => api.get('/reports/export', { params }),

  getPregnancies: () => api.get('/pregnancies'),
  getReferrals: params => api.get('/referrals', { params }),
  getFacilities: (includeInactive) => api.get('/facilities', { params: includeInactive ? { include_inactive: true } : {} }),
  getFacility: (id) => api.get(`/facilities/${id}`),
  getFacilityStats: (id) => api.get(`/facilities/${id}/stats`),
  getLocations: (params) => api.get('/locations', { params }),

  updateUser: (id, data) => api.put(`/auth/profile`, data),

  getUsers: (role) => api.get('/auth/users', { params: { role } }),
  toggleUserStatus: (id) => api.patch(`/auth/users/${id}/status`),

  createFacility: (data) => api.post('/facilities', data),
  updateFacility: (id, data) => api.put(`/facilities/${id}`, data),
  toggleFacilityStatus: (id, isActive) => api.put(`/facilities/${id}`, { is_active: isActive }),

  register: (data) => api.post('/auth/register', data),

  assignChv: (pregnancyId, chvId) => api.patch(`/pregnancies/${pregnancyId}/assign-chv`, { chvId }),
};
