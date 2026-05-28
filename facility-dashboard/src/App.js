import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import api from './services/api';
import { LanguageProvider } from './context/LanguageContext';
import ErrorBoundary from './components/ErrorBoundary';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PatientsPage from './pages/PatientsPage';
import PatientDetailPage from './pages/PatientDetailPage';
import AppointmentsPage from './pages/AppointmentsPage';
import ReferralsPage from './pages/ReferralsPage';
import ReportsPage from './pages/ReportsPage';
import Layout from './components/Layout';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
}

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function loadUser() {
      const stored = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      if (stored && token) {
        try {
          const profileRes = await api.getProfile();
          const userData = { ...JSON.parse(stored), ...profileRes.data };
          localStorage.setItem('user', JSON.stringify(userData));
          setUser(userData);
        } catch {
          try { setUser(JSON.parse(stored)); } catch { /* ignore corrupt data */ }
        }
      }
    }
    loadUser();
  }, []);

  return (
    <ErrorBoundary>
    <LanguageProvider>
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage setUser={setUser} />} />
        <Route path="/" element={<PrivateRoute><Layout user={user} setUser={setUser} /></PrivateRoute>}>
          <Route index element={<DashboardPage />} />
          <Route path="patients" element={<PatientsPage />} />
          <Route path="patients/:id" element={<PatientDetailPage />} />
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="referrals" element={<ReferralsPage />} />
          <Route path="reports" element={<ReportsPage />} />
        </Route>
      </Routes>
    </Router>
    </LanguageProvider>
    </ErrorBoundary>
  );
}
