import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../services/api';
import { useTranslation } from '../context/LanguageContext';

const COLORS = ['#3498DB', '#27AE60', '#F39C12', '#E74C3C', '#8E44AD', '#1ABC9C', '#E67E22', '#2C3E50'];

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState('monthly');
  const [kpiData, setKpiData] = useState([]);
  const [stats, setStats] = useState(null);
  const [chvPerformance, setChvPerformance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [period]);

  async function loadData() {
    setLoading(true);
    try {
      const [kpiRes, statsRes, chvRes] = await Promise.all([
        api.getKPIData({ period }),
        api.getDashboardStats(),
        api.exportReportJson({ type: 'chv_performance', format: 'json' }),
      ]);
      setKpiData(kpiRes.data);
      setStats(statsRes.data);
      setChvPerformance(Array.isArray(chvRes.data) ? chvRes.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const deliveries = stats?.monthlyDeliveries || [];
  const deliveriesData = [...deliveries].reverse().map(d => ({
    period: d.month,
    deliveries: parseInt(d.count),
  }));

  const totalPregnancies = kpiData.reduce((s, d) => s + (d.pregnancies || 0), 0);
  const totalReferrals = kpiData.reduce((s, d) => s + (d.referrals || 0), 0);
  const totalVisits = kpiData.reduce((s, d) => s + (d.home_visits || 0), 0);

  if (loading) return <div style={styles.loading}>{t('loading')}</div>;

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>{t('kpi_analytics')}</h2>
          <p style={styles.subtitle}>County-level performance trends and analysis</p>
        </div>
        <select style={styles.select} value={period} onChange={e => setPeriod(e.target.value)}>
          <option value="monthly">{t('monthly')}</option>
          <option value="quarterly">{t('quarterly')}</option>
        </select>
      </div>

      <div style={styles.statsRow}>
        <div style={{ ...styles.miniStat, borderLeft: '4px solid #3498DB' }}>
          <span style={styles.miniStatValue}>{totalPregnancies}</span>
          <span style={styles.miniStatLabel}>Total Pregnancies</span>
        </div>
        <div style={{ ...styles.miniStat, borderLeft: '4px solid #E74C3C' }}>
          <span style={styles.miniStatValue}>{totalReferrals}</span>
          <span style={styles.miniStatLabel}>Total Referrals</span>
        </div>
        <div style={{ ...styles.miniStat, borderLeft: '4px solid #27AE60' }}>
          <span style={styles.miniStatValue}>{totalVisits}</span>
          <span style={styles.miniStatLabel}>Home Visits</span>
        </div>
        <div style={{ ...styles.miniStat, borderLeft: '4px solid #F39C12' }}>
          <span style={styles.miniStatValue}>{stats?.highRiskPregnancies || 0}</span>
          <span style={styles.miniStatLabel}>High Risk</span>
        </div>
        <div style={{ ...styles.miniStat, borderLeft: '4px solid #8E44AD' }}>
          <span style={styles.miniStatValue}>{stats?.ancCoverage ?? 0}%</span>
          <span style={styles.miniStatLabel}>ANC Coverage</span>
        </div>
        <div style={{ ...styles.miniStat, borderLeft: '4px solid #1ABC9C' }}>
          <span style={styles.miniStatValue}>{stats?.weekAppointments || 0}</span>
          <span style={styles.miniStatLabel}>This Week's Apts</span>
        </div>
      </div>

      <div style={styles.row}>
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>{t('trends_pregnancies')}</h3>
          {kpiData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
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

        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>{t('high_risk_trends')}</h3>
          {kpiData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={kpiData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" tickFormatter={v => new Date(v).toLocaleDateString('en-KE', { month: 'short', year: '2-digit' })} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="high_risk" fill="#E74C3C" name={t('high_risk_pregnancies')} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={styles.noData}>{t('no_data')}</p>
          )}
        </div>
      </div>

      <div style={styles.row}>
        {deliveriesData.length > 0 && (
          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}>Monthly Deliveries (Last 6 Months)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={deliveriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" tickFormatter={v => new Date(v).toLocaleDateString('en-KE', { month: 'short', year: '2-digit' })} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="deliveries" fill="#1ABC9C" name="Deliveries" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Referral Funnel</h3>
          {stats ? (
            <div style={styles.funnelContainer}>
              <div style={styles.funnelItem}>
                <div style={styles.funnelBarOuter}>
                  <div style={{ ...styles.funnelBar, width: '100%', background: stats.totalReferrals > 0 ? '#3498DB' : '#E0E0E0' }} />
                </div>
                <div style={styles.funnelLabel}>
                  <span>Total Referrals</span>
                  <strong>{stats.totalReferrals}</strong>
                </div>
              </div>
              <div style={styles.funnelItem}>
                <div style={styles.funnelBarOuter}>
                  <div style={{ ...styles.funnelBar, width: stats.totalReferrals > 0 ? `${(stats.pendingReferrals / stats.totalReferrals) * 100}%` : '0%', background: '#F39C12' }} />
                </div>
                <div style={styles.funnelLabel}>
                  <span>Pending</span>
                  <strong>{stats.pendingReferrals}</strong>
                </div>
              </div>
              <div style={styles.funnelItem}>
                <div style={styles.funnelBarOuter}>
                  <div style={{ ...styles.funnelBar, width: stats.totalReferrals > 0 ? `${((stats.totalReferrals - stats.pendingReferrals) / stats.totalReferrals) * 100}%` : '0%', background: '#27AE60' }} />
                </div>
                <div style={styles.funnelLabel}>
                  <span>Completed</span>
                  <strong>{(stats.totalReferrals || 0) - (stats.pendingReferrals || 0)}</strong>
                </div>
              </div>
            </div>
          ) : (
            <p style={styles.noData}>{t('no_data')}</p>
          )}
        </div>
      </div>

      <div style={styles.row}>
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>CHV Performance</h3>
          {chvPerformance.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chvPerformance.slice(0, 10)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="first_name" tickFormatter={v => {
                  const chv = chvPerformance.find(c => c.first_name === v);
                  return chv ? `${chv.first_name} ${chv.last_name?.[0] || ''}` : v;
                }} width={120} />
                <Tooltip />
                <Legend />
                <Bar dataKey="total_visits" fill="#27AE60" name="Home Visits" />
                <Bar dataKey="total_referrals" fill="#3498DB" name="Referrals" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={styles.noData}>{t('no_data')}</p>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  loading: { padding: 60, textAlign: 'center', color: '#7F8C8D', fontSize: 18 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1A5276', margin: 0 },
  subtitle: { fontSize: 14, color: '#7F8C8D', margin: '4px 0 0 0' },
  select: { padding: '10px 16px', border: '1px solid #E0E0E0', borderRadius: 8, fontSize: 14, background: '#fff', cursor: 'pointer' },
  statsRow: { display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' },
  miniStat: { background: '#fff', borderRadius: 10, padding: '14px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', flex: 1, minWidth: 140 },
  miniStatValue: { display: 'block', fontSize: 24, fontWeight: 'bold', color: '#2C3E50', marginBottom: 2 },
  miniStatLabel: { display: 'block', fontSize: 11, color: '#7F8C8D', fontWeight: 600, textTransform: 'uppercase' },
  row: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: 16, marginBottom: 16 },
  chartCard: { background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  chartTitle: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50', margin: '0 0 16px 0' },
  noData: { textAlign: 'center', color: '#999', padding: 40 },
  funnelContainer: { display: 'flex', flexDirection: 'column', gap: 20, padding: '20px 10px' },
  funnelItem: { display: 'flex', flexDirection: 'column', gap: 6 },
  funnelBarOuter: { height: 28, background: '#F0F0F0', borderRadius: 14, overflow: 'hidden' },
  funnelBar: { height: '100%', borderRadius: 14, transition: 'width 0.3s' },
  funnelLabel: { display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#555' },
};
