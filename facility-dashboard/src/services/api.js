import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'https://boresha-mama-api.onrender.com/api';

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
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default {
  login: (identifier, password) => api.post('/auth/login', { identifier, password }),
  getProfile: () => api.get('/auth/profile'),

  getPregnancies: () => api.get('/pregnancies'),
  getPregnancy: id => api.get(`/pregnancies/${id}`),
  getPregnancyTimeline: id => api.get(`/pregnancies/timeline/${id}`),
  updatePregnancy: (id, data) => api.put(`/pregnancies/${id}`, data),

  getAppointments: params => api.get('/appointments', { params }),
  createAppointment: data => api.post('/appointments', data),
  updateAppointmentStatus: (id, data) => api.patch(`/appointments/${id}/status`, data),

  getReferrals: params => api.get('/referrals', { params }),
  updateReferralStatus: (id, data) => api.patch(`/referrals/${id}/status`, data),

  getFacilities: params => api.get('/facilities', { params }),
  getLocations: params => api.get('/locations', { params }),
  getDashboardStats: () => api.get('/reports/dashboard'),
  exportReport: params => api.get('/reports/export', { params }),

  registerMother: data => api.post('/auth/register-mother', data),
  createReferral: data => api.post('/referrals', data),
};
