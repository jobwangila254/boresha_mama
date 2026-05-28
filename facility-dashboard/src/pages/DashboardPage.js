import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useTranslation } from '../context/LanguageContext';

function getFacilityName() {
  try {
    const stored = localStorage.getItem('user');
    if (!stored) return null;
    return JSON.parse(stored)?.facilityStaff?.facility_name || null;
  } catch { return null; }
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [statsRes, aptsRes, refsRes] = await Promise.all([
        api.getDashboardStats(),
        api.getAppointments({ status: 'scheduled' }),
        api.getReferrals({ status: 'pending' }),
      ]);
      setStats(statsRes.data);
      setAppointments(aptsRes.data);
      setReferrals(refsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div style={styles.loading}>{t('loading')}</div>;

  return (
    <div>
      <h2 style={styles.pageTitle}>{getFacilityName() || t('dashboard')}</h2>

      <div style={styles.statsGrid}>
        <div style={{ ...styles.statCard, borderLeft: '4px solid #2980B9' }}>
          <div style={styles.statValue}>{stats?.totalPatients || 0}</div>
          <div style={styles.statLabel}>{t('total_patients')}</div>
        </div>
        <div style={{ ...styles.statCard, borderLeft: '4px solid #27AE60' }}>
          <div style={styles.statValue}>{stats?.todayAppointments || 0}</div>
          <div style={styles.statLabel}>{t('today_appointments')}</div>
        </div>
        <div style={{ ...styles.statCard, borderLeft: '4px solid #E74C3C' }}>
          <div style={styles.statValue}>{stats?.pendingReferrals || 0}</div>
          <div style={styles.statLabel}>{t('pending_referrals')}</div>
        </div>
        <div style={{ ...styles.statCard, borderLeft: '4px solid #F39C12' }}>
          <div style={styles.statValue}>{stats?.activePregnancies ?? stats?.totalPatients ?? 0}</div>
          <div style={styles.statLabel}>{t('active_pregnancies')}</div>
        </div>
      </div>

      <div style={styles.row}>
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>{t('today_appointments')}</h3>
            <Link to="/appointments" style={styles.viewAll}>{t('view_all')}</Link>
          </div>
          {appointments.length === 0 ? (
            <p style={styles.empty}>{t('no_appointments')}</p>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>{t('mother')}</th>
                  <th style={styles.th}>Time</th>
                  <th style={styles.th}>{t('type')}</th>
                  <th style={styles.th}>{t('status')}</th>
                </tr>
              </thead>
              <tbody>
                {appointments.slice(0, 5).map(apt => (
                  <tr key={apt.id}>
                    <td style={styles.td}>{apt.mother_name}</td>
                    <td style={styles.td}>{new Date(apt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td style={styles.td}><span style={styles.badge}>{(apt.visit_type || '').replace('_', ' ')}</span></td>
                    <td style={styles.td}><span style={{ ...styles.statusBadge, background: '#EBF5FB', color: '#2980B9' }}>{apt.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>{t('pending_referrals')}</h3>
            <Link to="/referrals" style={styles.viewAll}>{t('view_all')}</Link>
          </div>
          {referrals.length === 0 ? (
            <p style={styles.empty}>{t('no_referrals')}</p>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>{t('mother')}</th>
                  <th style={styles.th}>{t('from')}</th>
                  <th style={styles.th}>{t('priority')}</th>
                  <th style={styles.th}>{t('action')}</th>
                </tr>
              </thead>
              <tbody>
                {referrals.slice(0, 5).map(ref => (
                  <tr key={ref.id}>
                    <td style={styles.td}>{ref.mother_name}</td>
                    <td style={styles.td}>{ref.referred_by}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.priorityBadge, background: ref.priority === 'emergency' ? '#FDEDED' : '#FEF9E7', color: ref.priority === 'emergency' ? '#E74C3C' : '#F39C12' }}>
                        {ref.priority}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <Link to={`/referrals`} style={styles.actionLink}>{t('review')}</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  loading: { padding: 40, textAlign: 'center', color: '#7F8C8D', fontSize: 18 },
  pageTitle: { fontSize: 24, fontWeight: 'bold', color: '#2C3E50', marginBottom: 24 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 },
  statCard: { background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  statValue: { fontSize: 32, fontWeight: 'bold', color: '#2C3E50' },
  statLabel: { fontSize: 14, color: '#7F8C8D', marginTop: 4 },
  row: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 16 },
  section: { background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50', margin: 0 },
  viewAll: { color: '#2980B9', textDecoration: 'none', fontSize: 14, fontWeight: 500 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '10px 8px', borderBottom: '2px solid #F0F0F0', fontSize: 13, color: '#7F8C8D', fontWeight: 600 },
  td: { padding: '10px 8px', borderBottom: '1px solid #F0F0F0', fontSize: 14, color: '#2C3E50' },
  badge: { background: '#EBF5FB', padding: '3px 8px', borderRadius: 12, fontSize: 12, color: '#2980B9', textTransform: 'capitalize' },
  statusBadge: { padding: '3px 8px', borderRadius: 12, fontSize: 12, fontWeight: 500 },
  priorityBadge: { padding: '3px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600 },
  empty: { color: '#999', fontSize: 14, textAlign: 'center', padding: 20 },
  actionLink: { color: '#2980B9', textDecoration: 'none', fontWeight: 500 },
};
