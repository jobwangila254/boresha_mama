import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import CountyLogo from '../components/CountyLogo';
import { useTranslation } from '../context/LanguageContext';

export default function LoginPage({ setUser }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.login(email, password);
      localStorage.setItem('token', res.data.token);
      const profileRes = await api.getProfile();
      const userData = { ...res.data.user, ...profileRes.data };
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <CountyLogo size={100} />
        <h1 style={styles.title}>Boresha-Mama</h1>
        <p style={styles.subtitle}>{t('tagline')}</p>
        <p style={styles.facilityNote}>{t('facility_staff')}</p>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>{t('facility_email')}</label>
            <input style={styles.input} value={email} onChange={e => setEmail(e.target.value)} placeholder="kiminini@boreshamama.go.ke" required />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>{t('password')}</label>
            <input style={styles.input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={t('enter_password')} required />
          </div>
          <button style={styles.button} disabled={loading}>
            {loading ? t('logging_in') : t('login')}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F0F8F0' },
  card: { background: '#fff', borderRadius: 16, padding: 40, width: 400, maxWidth: '90%', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', textAlign: 'center' },
  title: { textAlign: 'center', color: '#004d26', margin: '8px 0 0', fontSize: 26 },
  subtitle: { textAlign: 'center', color: '#7F8C8D', marginTop: 2, marginBottom: 4 },
  facilityNote: { textAlign: 'center', color: '#95A5A6', fontSize: 12, marginBottom: 24 },
  error: { background: '#FDEDED', color: '#C0392B', padding: 10, borderRadius: 8, marginBottom: 16, fontSize: 14, textAlign: 'left' },
  field: { marginBottom: 16, textAlign: 'left' },
  label: { display: 'block', fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 6 },
  input: { width: '100%', padding: '12px 14px', border: '1px solid #E0E0E0', borderRadius: 8, fontSize: 16, boxSizing: 'border-box' },
  button: { width: '100%', padding: 14, background: '#006633', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer', marginTop: 8 },
};
