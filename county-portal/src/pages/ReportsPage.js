import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import { useTranslation } from '../context/LanguageContext';

export default function ReportsPage() {
  const { t } = useTranslation();
  const [kpiData, setKpiData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(null);

  useEffect(() => {
    api.getKPIData({ period: 'monthly' })
      .then(res => setKpiData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleExport(type) {
    setExporting(type);
    try {
      const res = await api.exportReport({ type, format: 'csv' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_report_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(t('export_failed'));
    } finally {
      setExporting(null);
    }
  }

  async function handlePrint() {
    try {
      const [stats, kpi] = await Promise.all([
        api.getDashboardStats(),
        api.getKPIData({ period: 'monthly' }),
      ]);
      const data = kpi.data || [];
      const rows = data.map(d => `<tr><td>${d.period ? new Date(d.period).toLocaleDateString('en-KE', { month: 'short', year: '2-digit' }) : '—'}</td><td>${d.pregnancies || 0}</td><td>${d.referrals || 0}</td><td>${d.home_visits || 0}</td><td>${d.high_risk || 0}</td></tr>`).join('');
      const win = window.open('', '_blank');
      if (!win) { alert(t('allow_popups')); return; }
      win.document.write(`
        <html><head><title>Boresha-Mama County Report</title>
        <style>body{font-family:Arial,sans-serif;padding:40px}
        h1{color:#1A5276}h2{color:#2C3E50}
        table{width:100%;border-collapse:collapse;margin:12px 0}
        th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:13px}
        th{background:#1A5276;color:#fff}
        .stat{display:inline-block;margin:8px;padding:16px;background:#f5f5f5;border-radius:8px;text-align:center;min-width:120px}
        .stat-val{font-size:24px;font-weight:bold;color:#1A5276}
        .stat-lbl{font-size:11px;color:#666}
        @media print{button{display:none}}
        </style></head><body>
        <h1>Boresha-Mama County Health Report</h1>
        <p>Trans-Nzoia County | Generated: ${new Date().toLocaleString()}</p>
        <div style="text-align:center">
          <div class="stat"><div class="stat-val">${stats.data?.totalMothers || 0}</div><div class="stat-lbl">Total Mothers</div></div>
          <div class="stat"><div class="stat-val">${stats.data?.activePregnancies || 0}</div><div class="stat-lbl">Active Pregnancies</div></div>
          <div class="stat"><div class="stat-val">${stats.data?.highRiskPregnancies || 0}</div><div class="stat-lbl">High Risk</div></div>
          <div class="stat"><div class="stat-val">${stats.data?.totalCHVs || 0}</div><div class="stat-lbl">Active CHVs</div></div>
        </div>
        <h2>Monthly KPI Data</h2>
        <table><thead><tr><th>Period</th><th>Pregnancies</th><th>Referrals</th><th>Home Visits</th><th>High Risk</th></tr></thead><tbody>${rows || '<tr><td colspan="5">No data</td></tr>'}</tbody></table>
        <p><button onclick="window.print()" style="padding:10px 20px;background:#1A5276;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:16px">🖨️ Print / Save as PDF</button></p>
        </body></html>
      `);
      win.document.close();
    } catch { alert(t('export_failed')); }
  }

  if (loading) return <div style={styles.loading}>{t('loading')}</div>;

  return (
    <div>
      <h2 style={styles.title}>{t('aggregated_reports')}</h2>

      <div style={styles.card}>
        <h3 style={styles.chartTitle}>{t('monthly_trend')}</h3>
        {kpiData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={kpiData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" tickFormatter={v => new Date(v).toLocaleDateString('en-KE', { month: 'short', year: '2-digit' })} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="pregnancies" fill="#3498DB" name={t('pregnancies')} />
              <Bar dataKey="referrals" fill="#E74C3C" name={t('referrals')} />
              <Bar dataKey="home_visits" fill="#27AE60" name={t('home_visits')} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p style={styles.noData}>{t('no_data')}</p>
        )}
      </div>

      <div style={styles.card}>
        <h3 style={styles.chartTitle}>{t('export_reports')}</h3>
        <div style={styles.exportGrid}>
          <div style={styles.exportCard}>
            <h4>{t('pregnancies_report')}</h4>
            <p>{t('pregnancies_report_desc')}</p>
            <button style={styles.exportBtn} onClick={() => handleExport('pregnancies')} disabled={exporting === 'pregnancies'}>
              {exporting === 'pregnancies' ? t('exporting') : t('download_csv')}
            </button>
          </div>
          <div style={styles.exportCard}>
            <h4>{t('referrals_report')}</h4>
            <p>{t('referrals_report_desc')}</p>
            <button style={styles.exportBtn} onClick={() => handleExport('referrals')} disabled={exporting === 'referrals'}>
              {exporting === 'referrals' ? t('exporting') : t('download_csv')}
            </button>
          </div>
          <div style={styles.exportCard}>
            <h4>{t('chv_performance')}</h4>
            <p>{t('chv_performance_desc')}</p>
            <button style={styles.exportBtn} onClick={() => handleExport('chv_performance')} disabled={exporting === 'chv_performance'}>
              {exporting === 'chv_performance' ? t('exporting') : t('download_csv')}
            </button>
          </div>
        </div>
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <button style={{ ...styles.exportBtn, background: '#1A5276', padding: '12px 32px' }} onClick={handlePrint}>{t('print_pdf')}</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  loading: { padding: 40, textAlign: 'center', color: '#7F8C8D' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1A5276', marginBottom: 24 },
  card: { background: '#fff', borderRadius: 10, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 16 },
  chartTitle: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50', margin: '0 0 16px 0' },
  noData: { textAlign: 'center', color: '#999', padding: 40 },
  exportGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 },
  exportCard: { border: '1px solid #E0E0E0', borderRadius: 10, padding: 20 },
  exportBtn: { background: '#1A5276', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500 },
};
