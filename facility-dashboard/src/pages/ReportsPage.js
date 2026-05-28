import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useTranslation } from '../context/LanguageContext';

export default function ReportsPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboardStats()
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleExport(type) {
    try {
      const res = await api.exportReport({ type, format: 'csv' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_report.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Export failed');
    }
  }

  async function handlePrint() {
    try {
      const res = await api.getDashboardStats();
      const win = window.open('', '_blank');
      win.document.write(`
        <html><head><title>Boresha-Mama Facility Report</title>
        <style>body{font-family:Arial,sans-serif;padding:40px}
        h1{color:#004d26}h2{color:#2C3E50}
        table{width:100%;border-collapse:collapse;margin:20px 0}
        th,td{border:1px solid #ddd;padding:10px;text-align:left}
        th{background:#004d26;color:#fff}
        .stat{display:inline-block;margin:10px;padding:20px;background:#f5f5f5;border-radius:8px;text-align:center}
        .stat-val{font-size:28px;font-weight:bold;color:#2980B9}
        .stat-lbl{font-size:12px;color:#666}
        @media print{button{display:none}}
        </style></head><body>
        <h1>Boresha-Mama Facility Report</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <div>
          <div class="stat"><div class="stat-val">${res.data.totalPatients || 0}</div><div class="stat-lbl">Total Patients</div></div>
          <div class="stat"><div class="stat-val">${res.data.todayAppointments || 0}</div><div class="stat-lbl">Today's Appointments</div></div>
          <div class="stat"><div class="stat-val">${res.data.pendingReferrals || 0}</div><div class="stat-lbl">Pending Referrals</div></div>
          <div class="stat"><div class="stat-val">${res.data.activePregnancies ?? res.data.totalPatients ?? 0}</div><div class="stat-lbl">Active Pregnancies</div></div>
        </div>
        <p><button onclick="window.print()" style="padding:10px 20px;background:#2980B9;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:16px">Print / Save as PDF</button></p>
        </body></html>
      `);
      win.document.close();
    } catch { alert('Failed to generate report'); }
  }

  if (loading) return <div style={styles.loading}>{t('loading')}</div>;

  return (
    <div>
      <h2 style={styles.title}>{t('reports')}</h2>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{stats?.totalPatients || 0}</div>
          <div style={styles.statLabel}>{t('total_patients')}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{stats?.todayAppointments || 0}</div>
          <div style={styles.statLabel}>{t('today_appointments')}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{stats?.pendingReferrals || 0}</div>
          <div style={styles.statLabel}>{t('pending_referrals')}</div>
        </div>
      </div>

      <div style={styles.exportSection}>
        <h3 style={styles.sectionTitle}>{t('export_reports')}</h3>
        <div style={styles.exportGrid}>
          <div style={styles.exportCard}>
            <h4 style={styles.exportTitle}>{t('pregnancies_report')}</h4>
            <p style={styles.exportDesc}>{t('export_all_pregnancies')}</p>
            <button style={styles.exportBtn} onClick={() => handleExport('pregnancies')}>{t('download_csv')}</button>
          </div>
          <div style={styles.exportCard}>
            <h4 style={styles.exportTitle}>{t('referrals_report')}</h4>
            <p style={styles.exportDesc}>{t('export_referrals')}</p>
            <button style={styles.exportBtn} onClick={() => handleExport('referrals')}>{t('download_csv')}</button>
          </div>
          <div style={styles.exportCard}>
            <h4 style={styles.exportTitle}>{t('chv_performance')}</h4>
            <p style={styles.exportDesc}>{t('export_chv_data')}</p>
            <button style={styles.exportBtn} onClick={() => handleExport('chv_performance')}>{t('download_csv')}</button>
          </div>
        </div>
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <button style={{ ...styles.exportBtn, background: '#004d26', padding: '12px 32px' }} onClick={handlePrint}>{t('print_pdf')}</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  loading: { padding: 40, textAlign: 'center', color: '#7F8C8D', fontSize: 18 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2C3E50', marginBottom: 24 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 },
  statCard: { background: '#fff', borderRadius: 10, padding: 20, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  statValue: { fontSize: 32, fontWeight: 'bold', color: '#2980B9' },
  statLabel: { fontSize: 14, color: '#7F8C8D', marginTop: 4 },
  exportSection: { background: '#fff', borderRadius: 10, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50', marginBottom: 16 },
  exportGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 },
  exportCard: { border: '1px solid #E0E0E0', borderRadius: 10, padding: 20 },
  exportTitle: { fontSize: 16, fontWeight: 600, color: '#2C3E50', margin: '0 0 8px 0' },
  exportDesc: { fontSize: 13, color: '#7F8C8D', marginBottom: 16 },
  exportBtn: { background: '#2980B9', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500 },
};
