import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import CountyLogo from './CountyLogo';
import { useTranslation } from '../context/LanguageContext';

export default function Layout({ user, setUser }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, language, setLanguage } = useTranslation();

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  }

  const navItems = [
    { path: '/dashboard', label: t('dashboard'), icon: '📊' },
    { path: '/dashboard/patients', label: t('patients'), icon: '👩‍👧' },
    { path: '/dashboard/appointments', label: t('appointments'), icon: '📅' },
    { path: '/dashboard/referrals', label: t('referrals'), icon: '🔄' },
    { path: '/dashboard/reports', label: t('reports'), icon: '📋' },
  ];

  return (
    <div style={styles.container}>
      <nav style={styles.sidebar}>
        <div style={styles.logo}>
          <CountyLogo size={50} showTagline={false} />
          <div style={styles.logoText}>{user?.facilityStaff?.facility_name || t('app_name')}</div>
        </div>
        {user?.facilityStaff?.facility_name && (
          <div style={styles.wardBadge}>
            <span style={styles.wardIcon}>📍</span>
            {user.facilityStaff.facility_name}
          </div>
        )}
        <div style={styles.userInfo}>
          <div style={styles.staffLabel}>{t('logged_in_as')}</div>
          <div style={styles.staffName}>{user?.firstName} {user?.lastName}</div>
          <div style={styles.staffRole}>{user?.facilityStaff?.job_title?.replace('_', ' ') || t('facility_staff')}</div>
        </div>
        <div style={styles.nav}>
          {navItems.map(item => (
            <Link key={item.path} to={item.path} style={{ ...styles.navItem, ...(location.pathname.startsWith(item.path) ? styles.navItemActive : {}) }}>
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
        <div style={styles.langRow}>
          <button style={{ ...styles.langBtn, fontWeight: language === 'en' ? 'bold' : 'normal', background: language === 'en' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)' }} onClick={() => setLanguage('en')}>EN</button>
          <button style={{ ...styles.langBtn, fontWeight: language === 'sw' ? 'bold' : 'normal', background: language === 'sw' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)' }} onClick={() => setLanguage('sw')}>SW</button>
        </div>
        <button style={styles.logoutBtn} onClick={handleLogout}>{t('logout')}</button>
      </nav>
      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

const styles = {
  container: { display: 'flex', minHeight: '100vh', background: '#F4F6F8' },
  sidebar: { width: 240, background: '#004d26', color: '#fff', padding: '24px 0', display: 'flex', flexDirection: 'column' },
  logo: { padding: '0 24px', marginBottom: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 },
  logoText: { fontSize: 14, fontWeight: 'bold', textAlign: 'center', lineHeight: 1.3 },
  wardBadge: { padding: '6px 24px 16px', fontSize: 12, color: '#FFD700', display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: 12 },
  wardIcon: { fontSize: 14 },
  userInfo: { padding: '12px 24px', marginBottom: 16 },
  staffLabel: { fontSize: 11, color: '#7F8C8D', textTransform: 'uppercase', letterSpacing: 1 },
  staffName: { fontSize: 14, fontWeight: 600, marginTop: 4 },
  staffRole: { fontSize: 12, color: '#BDC3C7', marginTop: 2, textTransform: 'capitalize' },
  nav: { flex: 1, padding: '0 12px' },
  navItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, color: '#BDC3C7', textDecoration: 'none', fontSize: 14, marginBottom: 4, transition: 'all 0.2s' },
  navItemActive: { background: 'rgba(255,255,255,0.15)', color: '#fff' },
  langRow: { display: 'flex', gap: 8, padding: '8px 24px', justifyContent: 'center' },
  langBtn: { padding: '4px 12px', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 4, color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  logoutBtn: { margin: '8px 24px 16px', padding: 10, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 14 },
  main: { flex: 1, padding: 24, overflow: 'auto' },
};
