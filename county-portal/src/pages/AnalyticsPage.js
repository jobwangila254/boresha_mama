import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../services/api';
import { useTranslation } from '../context/LanguageContext';

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const [kpiData, setKpiData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('monthly');

  useEffect(() => {
    api.getKPIData({ period })
      .then(res => setKpiData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) return <div style={styles.loading}>{t('loading')}</div>;

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.title}>{t('kpi_analytics')}</h2>
        <select style={styles.select} value={period} onChange={e => setPeriod(e.target.value)}>
          <option value="monthly">{t('monthly')}</option>
          <option value="quarterly">{t('quarterly')}</option>
        </select>
      </div>

      <div style={styles.card}>
        <h3 style={styles.chartTitle}>{t('trends_pregnancies')}</h3>
        {kpiData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={kpiData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" tickFormatter={v => new Date(v).toLocaleDateString('en-KE', { month: 'short', year: '2-digit' })} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="pregnancies" stroke="#3498DB" strokeWidth={2} name={t('pregnancies')} />
              <Line type="monotone" dataKey="referrals" stroke="#E74C3C" strokeWidth={2} name={t('referrals')} />
              <Line type="monotone" dataKey="home_visits" stroke="#27AE60" strokeWidth={2} name={t('home_visits')} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p style={styles.noData}>{t('no_data')}</p>
        )}
      </div>

      <div style={styles.card}>
        <h3 style={styles.chartTitle}>{t('high_risk_trends')}</h3>
        {kpiData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={kpiData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" tickFormatter={v => new Date(v).toLocaleDateString('en-KE', { month: 'short', year: '2-digit' })} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="high_risk" fill="#E74C3C" name={t('high_risk_pregnancies')} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p style={styles.noData}>{t('no_data')}</p>
        )}
      </div>
    </div>
  );
}

const styles = {
  loading: { padding: 40, textAlign: 'center', color: '#7F8C8D' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1A5276', margin: 0 },
  select: { padding: '10px 16px', border: '1px solid #E0E0E0', borderRadius: 8, fontSize: 14, background: '#fff' },
  card: { background: '#fff', borderRadius: 10, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 16 },
  chartTitle: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50', margin: '0 0 16px 0' },
  noData: { textAlign: 'center', color: '#999', padding: 40 },
};
