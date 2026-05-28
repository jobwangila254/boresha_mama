import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../services/api';
import { useTranslation } from '../context/LanguageContext';

const COLORS = ['#27AE60', '#F39C12', '#E74C3C', '#3498DB'];

export default function DashboardPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [kpiData, setKpiData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [statsRes, kpiRes] = await Promise.all([
        api.getDashboardStats(),
        api.getKPIData({ period: 'monthly' }),
      ]);
      setStats(statsRes.data);
      setKpiData(kpiRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const lowRisk = (stats?.activePregnancies ?? 0) - (stats?.highRiskPregnancies ?? 0);
  const pieData = [
    { name: t('low_risk'), value: Math.max(lowRisk, 0) },
    { name: t('high_risk'), value: stats?.highRiskPregnancies || 0 },
  ];

  if (loading) return <div style={styles.loading}>{t('loading')}</div>;

  return (
    <div>
      <h2 style={styles.pageTitle}>{t('county_dashboard')}</h2>

      <div style={styles.statsGrid}>
        <div style={{ ...styles.statCard, borderTop: '4px solid #1A5276' }}>
          <div style={styles.statValue}>{stats?.totalMothers || 0}</div>
          <div style={styles.statLabel}>{t('total_mothers')}</div>
        </div>
        <div style={{ ...styles.statCard, borderTop: '4px solid #27AE60' }}>
          <div style={styles.statValue}>{stats?.activePregnancies || 0}</div>
          <div style={styles.statLabel}>{t('active_pregnancies')}</div>
        </div>
        <div style={{ ...styles.statCard, borderTop: '4px solid #E74C3C' }}>
          <div style={styles.statValue}>{stats?.highRiskPregnancies || 0}</div>
          <div style={styles.statLabel}>{t('high_risk')}</div>
        </div>
        <div style={{ ...styles.statCard, borderTop: '4px solid #F39C12' }}>
          <div style={styles.statValue}>{stats?.totalCHVs || 0}</div>
          <div style={styles.statLabel}>{t('active_chvs')}</div>
        </div>
        <div style={{ ...styles.statCard, borderTop: '4px solid #3498DB' }}>
          <div style={styles.statValue}>{stats?.totalFacilities || 0}</div>
          <div style={styles.statLabel}>{t('total_facilities')}</div>
        </div>
        <div style={{ ...styles.statCard, borderTop: '4px solid #8E44AD' }}>
          <div style={styles.statValue}>{stats?.ancCoverage ?? 0}%</div>
          <div style={styles.statLabel}>{t('anc_coverage')}</div>
        </div>
      </div>

      <div style={styles.row}>
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>{t('monthly_pregnancies')}</h3>
          {kpiData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={kpiData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" tickFormatter={v => new Date(v).toLocaleDateString('en-KE', { month: 'short', year: '2-digit' })} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="pregnancies" fill="#3498DB" name={t('pregnancies')} />
                <Bar dataKey="home_visits" fill="#27AE60" name={t('home_visits')} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={styles.noData}>{t('no_kpi_data')}</p>
          )}
        </div>

        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>{t('risk_distribution')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {pieData.map((_, index) => <Cell key={index} fill={COLORS[index]} />)}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={styles.infoGrid}>
        <div style={styles.infoCard}>
          <h4 style={styles.infoTitle}>{t('referrals')}</h4>
          <div style={styles.infoStats}>
            <div><strong>{stats?.totalReferrals || 0}</strong> {t('referrals_total')}</div>
            <div><strong>{stats?.pendingReferrals || 0}</strong> {t('referrals_pending')}</div>
          </div>
        </div>
        <div style={styles.infoCard}>
          <h4 style={styles.infoTitle}>{t('weekly_appointments')}</h4>
          <div style={styles.infoStats}>
            <div><strong>{stats?.weekAppointments || 0}</strong> {t('this_week')}</div>
          </div>
        </div>
        <div style={styles.infoCard}>
          <h4 style={styles.infoTitle}>{t('anc_coverage')}</h4>
          <div style={styles.infoStats}>
            <div><strong>{stats?.ancCoverage ?? 0}%</strong> {t('coverage_rate')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  loading: { padding: 40, textAlign: 'center', color: '#7F8C8D', fontSize: 18 },
  pageTitle: { fontSize: 24, fontWeight: 'bold', color: '#1A5276', marginBottom: 24 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 },
  statCard: { background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  statValue: { fontSize: 32, fontWeight: 'bold', color: '#2C3E50' },
  statLabel: { fontSize: 14, color: '#7F8C8D', marginTop: 4 },
  row: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 16, marginBottom: 24 },
  chartCard: { background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  chartTitle: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50', marginBottom: 16, marginTop: 0 },
  noData: { textAlign: 'center', color: '#999', padding: 40 },
  infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 },
  infoCard: { background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  infoTitle: { fontSize: 15, fontWeight: 'bold', color: '#2C3E50', margin: '0 0 12px 0' },
  infoStats: { display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, color: '#555' },
};
