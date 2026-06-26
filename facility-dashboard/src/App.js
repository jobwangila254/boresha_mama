import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import api from './services/api';
import { LanguageProvider } from './context/LanguageContext';
import ErrorBoundary from './components/ErrorBoundary';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PatientsPage from './pages/PatientsPage';
import PatientDetailPage from './pages/PatientDetailPage';
import RegisterPatientPage from './pages/RegisterPatientPage';
import AppointmentsPage from './pages/AppointmentsPage';
import ReferralsPage from './pages/ReferralsPage';
import NewReferralPage from './pages/NewReferralPage';
import ReportsPage from './pages/ReportsPage';
import Layout from './components/Layout';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/" />;
  return children;
}

export default function App() {
  const [user, setUser] = useState(null);

  return (
    <ErrorBoundary>
    <LanguageProvider>
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<LoginPage setUser={setUser} />} />
        <Route path="/dashboard" element={<PrivateRoute><Layout user={user} setUser={setUser} /></PrivateRoute>}>
          <Route index element={<DashboardPage />} />
          <Route path="patients" element={<PatientsPage />} />
          <Route path="patients/register" element={<RegisterPatientPage />} />
          <Route path="patients/:id" element={<PatientDetailPage />} />
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="referrals" element={<ReferralsPage />} />
          <Route path="referrals/new" element={<NewReferralPage />} />
          <Route path="reports" element={<ReportsPage />} />
        </Route>
      </Routes>
    </Router>
    </LanguageProvider>
    </ErrorBoundary>
  );
}
