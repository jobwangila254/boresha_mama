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
    { path: '/dashboard/analytics', label: t('analytics'), icon: '📈' },
    { path: '/dashboard/facilities', label: t('facilities'), icon: '🏥' },
    { path: '/dashboard/users', label: t('users'), icon: '👥' },
    { path: '/dashboard/referrals', label: t('referral_tracking'), icon: '🔄' },
    { path: '/dashboard/reports', label: t('reports'), icon: '📋' },
  ];

  return (
    <div style={styles.container}>
      <nav style={styles.sidebar}>
        <div style={styles.logo}>
          <CountyLogo size={50} showTagline={false} />
          <div style={styles.logoText}>{t('county_portal')}</div>
        </div>
        <div style={styles.userInfo}>
          <div style={styles.userName}>{user?.firstName} {user?.lastName}</div>
          <div style={styles.userRole}>County Administrator</div>
        </div>
        <div style={styles.nav}>
          {navItems.map(item => (
            <Link key={item.path} to={item.path} style={{ ...styles.navItem, ...(location.pathname === item.path ? styles.navItemActive : {}) }}>
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
  sidebar: { width: 200, background: '#1A237E', color: '#fff', padding: '24px 0', display: 'flex', flexDirection: 'column' },
  logo: { padding: '0 24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 },
  logoText: { fontSize: 18, fontWeight: 'bold' },
  logoSub: { fontSize: 11, color: '#FFD700', marginTop: -2 },
  userInfo: { padding: '12px 24px', borderTop: '1px solid rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: 16 },
  userName: { fontSize: 14, fontWeight: 600 },
  userRole: { fontSize: 12, color: '#FFD700', marginTop: 2 },
  nav: { flex: 1, padding: '0 12px' },
  navItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, color: '#9FA8DA', textDecoration: 'none', fontSize: 14, marginBottom: 4 },
  navItemActive: { background: '#283593', color: '#fff' },
  langRow: { display: 'flex', gap: 8, padding: '8px 24px', justifyContent: 'center' },
  langBtn: { padding: '4px 12px', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 4, color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  logoutBtn: { margin: '8px 24px 16px', padding: 10, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 14 },
  main: { flex: 1, padding: 24, overflow: 'auto' },
};
