import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import ErrorBoundary from './components/ErrorBoundary';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AnalyticsPage from './pages/AnalyticsPage';
import FacilitiesPage from './pages/FacilitiesPage';
import UsersPage from './pages/UsersPage';
import ReportsPage from './pages/ReportsPage';
import ReferralsPage from './pages/ReferralsPage';
import Layout from './components/Layout';

function PrivateRoute({ children, user }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/" />;
  if (!user || user.role !== 'county_admin') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/" />;
  }
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
        <Route path="/dashboard" element={<PrivateRoute user={user}><Layout user={user} setUser={setUser} /></PrivateRoute>}>
          <Route index element={<DashboardPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="facilities" element={<FacilitiesPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="referrals" element={<ReferralsPage />} />
          <Route path="reports" element={<ReportsPage />} />
        </Route>
      </Routes>
    </Router>
    </LanguageProvider>
    </ErrorBoundary>
  );
}
