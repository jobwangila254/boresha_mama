import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const ENV_URL = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_API_URL : null;
const API_BASE_URL = ENV_URL || (Platform.OS === 'web'
  ? 'https://boresha-mama-api.onrender.com/api'
  : __DEV__
    ? 'http://10.0.2.2:5000/api'
    : 'https://boresha-mama-api.onrender.com/api');

class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.token = null;
  }

  async setToken(token) {
    this.token = token;
    if (token) {
      await AsyncStorage.setItem('auth_token', token);
    } else {
      await AsyncStorage.removeItem('auth_token');
    }
  }

  async loadToken() {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      this.token = token;
    }
    return token;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (error) {
      if (error.message === 'Network request failed') {
        throw new Error('No internet connection. Please check your network.');
      }
      throw error;
    }
  }

  // Auth
  login(identifier, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
  }

  register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  registerMother(data) {
    return this.request('/auth/register-mother', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  getProfile() {
    return this.request('/auth/profile');
  }

  updateProfile(data) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Pregnancies
  getPregnancies() {
    return this.request('/pregnancies');
  }

  getPregnancy(id) {
    return this.request(`/pregnancies/${id}`);
  }

  getPregnancyTimeline(id) {
    return this.request(`/pregnancies/timeline/${id}`);
  }

  // Appointments
  getAppointments(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/appointments${query ? '?' + query : ''}`);
  }

  createAppointment(data) {
    return this.request('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Self-Monitoring
  recordSelfMonitoring(data) {
    return this.request('/monitoring', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  getSelfMonitoring(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/monitoring${query ? '?' + query : ''}`);
  }

  // Facilities
  getFacilities(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/facilities${query ? '?' + query : ''}`);
  }

  getNearbyFacilities(lat, lng, radius = 10) {
    return this.request(`/facilities/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
  }

  // Health Tips
  getHealthTips(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/health-tips${query ? '?' + query : ''}`);
  }
}

export default new ApiService();
