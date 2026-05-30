import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  function mapProfile(profile) {
    return {
      id: profile.id,
      phone: profile.phone,
      role: profile.role,
      firstName: profile.first_name,
      lastName: profile.last_name,
      email: profile.email,
      preferredLanguage: profile.preferred_language,
      nationalId: profile.national_id,
    };
  }

  async function loadStoredAuth() {
    try {
      const token = await api.loadToken();
      if (token) {
        const profile = await api.getProfile();
        setUser(mapProfile(profile));
        setIsAuthenticated(true);
      }
    } catch (err) {
      await api.setToken(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(phone, password) {
    const response = await api.login(phone, password);
    await api.setToken(response.token);
    const profile = await api.getProfile();
    setUser(mapProfile(profile));
    setIsAuthenticated(true);
    return response;
  }

  async function register(userData) {
    const response = await api.register(userData);
    await api.setToken(response.token);
    setIsAuthenticated(true);
    return response;
  }

  async function logout() {
    await api.setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        login,
        register,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
