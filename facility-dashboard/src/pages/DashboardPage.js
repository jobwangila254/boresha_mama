import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [statsRes, aptsRes] = await Promise.all([
        api.getDashboardStats(),
        api.getAppointments({ status: 'scheduled' }),
      ]);
      setStats(statsRes.data);
      setAppointments(aptsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div style={styles.loading}>{t('loading')}</div>;

  const today = new Date().toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.pageTitle}>Dashboard Overview</h2>
        <div style={styles.headerRight}>
          <span style={styles.date}>📅 {today}</span>
          <span style={styles.countyTag}>Trans-Nzoia County</span>
        </div>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIconCircle('#E8F5E9')}>
            <span style={styles.statIcon}>👩</span>
          </div>
          <div>
            <div style={styles.statLabel}>Total Patients</div>
            <div style={{ ...styles.statValue, color: '#1B5E20' }}>{stats?.totalPatients || 0}</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIconCircle('#E3F2FD')}>
            <span style={styles.statIcon}>🤰</span>
          </div>
          <div>
            <div style={styles.statLabel}>Active Pregnancies</div>
            <div style={{ ...styles.statValue, color: '#1565C0' }}>{stats?.activePregnancies || 0}</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIconCircle('#FFF3E0')}>
            <span style={styles.statIcon}>📅</span>
          </div>
          <div>
            <div style={styles.statLabel}>Appts Today</div>
            <div style={{ ...styles.statValue, color: '#E65100' }}>{stats?.todayAppointments || 0}</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIconCircle('#FCE4EC')}>
            <span style={styles.statIcon}>↗</span>
          </div>
          <div>
            <div style={styles.statLabel}>Pending Referrals</div>
            <div style={{ ...styles.statValue, color: '#C62828' }}>{stats?.pendingReferrals || 0}</div>
          </div>
        </div>
      </div>

      <div style={styles.row}>
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Monthly Patient Registration Trends</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats?.monthlyRegistrations || []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#999', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip />
              <Bar dataKey="patients" fill="#4CAF50" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.scheduleCard}>
          <h3 style={styles.chartTitle}>Today's Schedule</h3>
          <div style={styles.scheduleUnderline} />
          {appointments.length === 0 ? (
            <p style={styles.empty}>{t('no_appointments')}</p>
          ) : (
            appointments.slice(0, 5).map(apt => (
              <div key={apt.id} style={styles.scheduleItem}>
                <div style={styles.scheduleTime}>
                  {new Date(apt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div style={styles.scheduleDetail}>
                  <div style={styles.scheduleName}>{apt.mother_name}</div>
                  <div style={styles.scheduleType}>{(apt.visit_type || '').replace('_', ' ')}</div>
                </div>
              </div>
            ))
          )}
          <Link to="/dashboard/appointments" style={styles.viewAll}>View All →</Link>
        </div>
      </div>

      <div style={styles.quickActions}>
        <span style={styles.quickActionsTitle}>Quick Actions</span>
        <div style={styles.quickActionsBtns}>
          <Link to="/dashboard/patients/register" style={{ textDecoration: 'none' }}><button style={styles.quickBtn('#1B5E20')}>+ Register Patient</button></Link>
          <Link to="/dashboard/appointments" style={{ textDecoration: 'none' }}><button style={styles.quickBtn('#1565C0')}>📅 New Appointment</button></Link>
          <Link to="/dashboard/referrals/new" style={{ textDecoration: 'none' }}><button style={styles.quickBtn('#E65100')}>↗ Process Referral</button></Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  loading: { padding: 40, textAlign: 'center', color: '#7F8C8D', fontSize: 18 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  pageTitle: { fontSize: 22, fontWeight: 'bold', color: '#2C3E50', margin: 0 },
  headerRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 },
  date: { fontSize: 13, color: '#666' },
  countyTag: { fontSize: 10, color: '#1B5E20', fontWeight: 600 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 },
  statCard: { background: '#fff', borderRadius: 10, padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 14 },
  statIconCircle: color => ({ width: 40, height: 40, borderRadius: 20, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }),
  statIcon: { fontSize: 18 },
  statValue: { fontSize: 26, fontWeight: 'bold' },
  statLabel: { fontSize: 12, color: '#7F8C8D', marginBottom: 2 },
  row: { display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, marginBottom: 16 },
  chartCard: { background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  scheduleCard: { background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  chartTitle: { fontSize: 15, fontWeight: 'bold', color: '#2C3E50', margin: '0 0 12px 0' },
  scheduleUnderline: { width: 60, height: 3, background: '#4CAF50', borderRadius: 2, marginBottom: 16 },
  scheduleItem: { display: 'flex', gap: 12, marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid #F0F0F0' },
  scheduleTime: { fontSize: 14, fontWeight: 'bold', color: '#333', minWidth: 45 },
  scheduleDetail: { flex: 1 },
  scheduleName: { fontSize: 13, fontWeight: 600, color: '#2C3E50' },
  scheduleType: { fontSize: 12, color: '#7F8C8D', marginTop: 2, textTransform: 'capitalize' },
  viewAll: { color: '#1B5E20', textDecoration: 'none', fontSize: 13, fontWeight: 'bold', display: 'inline-block', marginTop: 8 },
  quickActions: { background: '#fff', borderRadius: 10, padding: '14px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 20 },
  quickActionsTitle: { fontSize: 14, fontWeight: 'bold', color: '#2C3E50', whiteSpace: 'nowrap' },
  quickActionsBtns: { display: 'flex', gap: 10 },
  quickBtn: color => ({ padding: '8px 18px', background: color, border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }),
  empty: { color: '#999', fontSize: 13, textAlign: 'center', padding: 20 },
};
