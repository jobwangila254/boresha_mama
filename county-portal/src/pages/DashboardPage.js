import React, { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import api from '../services/api';
import { useTranslation } from '../context/LanguageContext';

const PIE_COLORS = ['#4CAF50', '#FF9800', '#F44336', '#E0E0E0'];

export default function DashboardPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  function getCurrentQuarter() {
    const now = new Date();
    const q = Math.floor(now.getMonth() / 3) + 1;
    return `Q${q} ${now.getFullYear()}`;
  }

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const statsRes = await api.getDashboardStats();
      setStats(statsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div style={styles.loading}>{t('loading')}</div>;

  const totalPregnancies = stats?.activePregnancies || 0;
  const lowRisk = stats?.lowRiskPregnancies ?? Math.max(totalPregnancies - (stats?.mediumRiskPregnancies ?? 0) - (stats?.highRiskPregnancies ?? 0), 0);
  const mediumRisk = stats?.mediumRiskPregnancies ?? 0;
  const highRisk = stats?.highRiskPregnancies ?? 0;

  const riskData = [];
  if (lowRisk > 0) riskData.push({ name: 'Low Risk', value: lowRisk, pct: totalPregnancies > 0 ? Math.round((lowRisk / totalPregnancies) * 100) + '%' : '0%' });
  if (mediumRisk > 0) riskData.push({ name: 'Medium', value: mediumRisk, pct: totalPregnancies > 0 ? Math.round((mediumRisk / totalPregnancies) * 100) + '%' : '0%' });
  if (highRisk > 0) riskData.push({ name: 'High/Critical', value: highRisk, pct: totalPregnancies > 0 ? Math.round((highRisk / totalPregnancies) * 100) + '%' : '0%' });
  if (riskData.length === 0) riskData.push({ name: 'No Data', value: 1, pct: '0%' });

  const ancCoverage = stats?.ancCoverage ?? 0;
  const totalMothers = stats?.totalMothers ?? 0;
  const totalDeliveries = stats?.totalDeliveries ?? 0;
  const totalCHVs = stats?.totalCHVs ?? 0;
  const totalReferrals = stats?.totalReferrals ?? 0;
  const referralRate = totalPregnancies > 0 ? ((totalReferrals / totalPregnancies) * 100).toFixed(1) : '0.0';

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Maternal Health Analytics</h2>
          <p style={styles.subtitle}>Trans-Nzoia County</p>
        </div>
        <span style={styles.period}>{getCurrentQuarter()}</span>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>ANC Coverage Rate</div>
          <div style={styles.statValue}>{ancCoverage}%</div>
          <div style={styles.progressBg}>
            <div style={{ ...styles.progressFill, width: `${ancCoverage}%` }} />
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Facility Deliveries</div>
          <div style={styles.statValue}>{totalDeliveries.toLocaleString()}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Active CHVs</div>
          <div style={styles.statValue}>{totalCHVs}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Referral Rate</div>
          <div style={styles.statValue}>{referralRate}%</div>
        </div>
      </div>

      <div style={styles.row}>
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>ANC Coverage by Ward</h3>
          {(stats?.wardStats?.length > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.wardStats} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                <Tooltip formatter={v => `${v}%`} />
                <Bar dataKey="coverage" fill="#3F51B5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={styles.noData}>No ward data available</div>
          )}
        </div>

        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Pregnancy Risk Distribution</h3>
          <div style={styles.pieContainer}>
            <ResponsiveContainer width={220} height={220}>
              <PieChart>
                <Pie data={riskData} cx="50%" cy="50%" innerRadius={30} outerRadius={80} dataKey="value" paddingAngle={2}>
                  {riskData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={styles.riskLegend}>
              {riskData.map(r => (
                <div key={r.name} style={styles.riskItem}>
                  <span style={{ ...styles.riskDot, background: PIE_COLORS[riskData.indexOf(r)] }} />
                  <span style={styles.riskText}>{r.name} ({r.pct})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={styles.summaryCard}>
        <h3 style={styles.summaryTitle}>Key Metrics at a Glance</h3>
        <div style={styles.summaryKpis}>
          <div style={styles.kpiBox}>
            <span style={styles.kpiValue}>{totalMothers}</span>
            <span style={styles.kpiLabel}>Total Mothers</span>
          </div>
          <div style={styles.kpiBox}>
            <span style={styles.kpiValue}>{totalPregnancies}</span>
            <span style={styles.kpiLabel}>Active Pregnancies</span>
          </div>
          <div style={styles.kpiBox}>
            <span style={styles.kpiValue}>{totalCHVs}</span>
            <span style={styles.kpiLabel}>Active CHVs</span>
          </div>
          <div style={styles.kpiBox}>
            <span style={styles.kpiValue}>{totalDeliveries}</span>
            <span style={styles.kpiLabel}>Deliveries</span>
          </div>
          <div style={styles.kpiBox}>
            <span style={styles.kpiValue}>{ancCoverage}%</span>
            <span style={styles.kpiLabel}>ANC Coverage</span>
          </div>
          <div style={styles.kpiBox}>
            <span style={styles.kpiValue}>{referralRate}%</span>
            <span style={styles.kpiLabel}>Referral Rate</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  loading: { padding: 40, textAlign: 'center', color: '#7F8C8D', fontSize: 18 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1A5276', margin: 0 },
  subtitle: { fontSize: 13, color: '#7F8C8D', marginTop: 2 },
  period: { fontSize: 13, color: '#666', background: '#E8EAF6', padding: '4px 12px', borderRadius: 12, fontWeight: 600 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 },
  statCard: { background: '#fff', borderRadius: 10, padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  statLabel: { fontSize: 11, color: '#7F8C8D', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 },
  statValue: { fontSize: 26, fontWeight: 'bold', color: '#1A237E', marginBottom: 8 },
  progressBg: { height: 5, background: '#E8EAF6', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', background: '#3F51B5', borderRadius: 3 },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 },
  chartCard: { background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  chartTitle: { fontSize: 15, fontWeight: 'bold', color: '#2C3E50', margin: '0 0 16px 0' },
  wardRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 },
  wardName: { width: 80, fontSize: 12, color: '#666', textAlign: 'right' },
  wardBarBg: { width: 170, height: 12, background: '#E8EAF6', borderRadius: 4, overflow: 'hidden' },
  wardBarFill: { height: '100%', borderRadius: 4 },
  wardPct: { fontSize: 12, fontWeight: 'bold', color: '#333', width: 35, textAlign: 'right' },
  noData: { padding: '60px 0', textAlign: 'center', color: '#999', fontSize: 14 },
  pieContainer: { display: 'flex', alignItems: 'center', gap: 16 },
  riskLegend: { display: 'flex', flexDirection: 'column', gap: 8 },
  riskItem: { display: 'flex', alignItems: 'center', gap: 8 },
  riskDot: { width: 12, height: 12, borderRadius: 3, flexShrink: 0 },
  riskText: { fontSize: 12, color: '#666' },
  summaryCard: { background: '#fff', borderRadius: 10, padding: '14px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  summaryTitle: { fontSize: 14, fontWeight: 'bold', color: '#2C3E50', margin: '0 0 10px 0' },
  summaryItems: { display: 'flex', flexDirection: 'column', gap: 6 },
  summaryItem: { fontSize: 13, color: '#333' },
  summaryKpis: { display: 'flex', gap: 14, flexWrap: 'wrap' },
  kpiBox: { flex: '1 0 100px', textAlign: 'center', padding: '10px 12px', background: '#F8F9FA', borderRadius: 8 },
  kpiValue: { display: 'block', fontSize: 20, fontWeight: 'bold', color: '#1A237E', marginBottom: 2 },
  kpiLabel: { display: 'block', fontSize: 11, color: '#7F8C8D', fontWeight: 600, textTransform: 'uppercase' },
};
