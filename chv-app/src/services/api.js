import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const ENV_URL = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_API_URL : null;
const API_BASE_URL = ENV_URL || (Platform.OS === 'web'
  ? 'http://localhost:5000/api'
  : __DEV__
    ? 'http://10.0.2.2:5000/api'
    : 'https://api.boreshamama.go.ke/api');

class ChvApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.token = null;
  }

  async setToken(token) {
    this.token = token;
    if (token) await AsyncStorage.setItem('chv_token', token);
    else await AsyncStorage.removeItem('chv_token');
  }

  async loadToken() {
    const token = await AsyncStorage.getItem('chv_token');
    if (token) this.token = token;
    return token;
  }

  async request(endpoint, options = {}) {
    try {
      const headers = { 'Content-Type': 'application/json', ...options.headers };
      if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

      const response = await fetch(`${this.baseUrl}${endpoint}`, { ...options, headers });
      const data = await response.json();
      if (!response.ok) {
        const msg = Array.isArray(data.details) ? data.details.map(d => `${d.field}: ${d.message}`).join(', ') : data.error;
        throw new Error(msg || 'Request failed');
      }
      return data;
    } catch (err) {
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        throw new Error('Network error. Please check your connection.');
      }
      throw err;
    }
  }

  login(identifier, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
  }

  getProfile() { return this.request('/auth/profile'); }

  getAssignedMothers() { return this.request('/pregnancies'); }

  registerPregnancy(data) {
    return this.request('/pregnancies', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  registerMother(data) {
    return this.request('/auth/register-mother', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  getPregnancy(id) { return this.request(`/pregnancies/${id}`); }

  createHomeVisit(data) {
    return this.request('/home-visits', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  syncOfflineVisits(visits) {
    return this.request('/home-visits/sync', {
      method: 'POST',
      body: JSON.stringify({ visits }),
    });
  }

  getHomeVisits(params = {}) {
    const q = new URLSearchParams(params).toString();
    return this.request(`/home-visits${q ? '?' + q : ''}`);
  }

  createReferral(data) {
    return this.request('/referrals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  getReferrals() { return this.request('/referrals'); }

  getFacilities(params = {}) {
    const q = new URLSearchParams(params).toString();
    return this.request(`/facilities${q ? '?' + q : ''}`);
  }

  getLocations(params = {}) {
    const q = new URLSearchParams(params).toString();
    return this.request(`/locations${q ? '?' + q : ''}`);
  }
}

export default new ChvApiService();
