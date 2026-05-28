import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useTranslation } from '../context/LanguageContext';

export default function ReferralsPage() {
  const { t } = useTranslation();
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { loadReferrals(); }, [filter]);

  async function loadReferrals() {
    try {
      const res = await api.getReferrals({ status: filter === 'all' ? undefined : filter });
      setReferrals(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 style={styles.title}>{t('referral_tracking')}</h2>

      <div style={styles.tabs}>
        {['all', 'pending', 'accepted', 'completed', 'cancelled'].map(t => (
          <button key={t} onClick={() => setFilter(t)} style={{ ...styles.tab, ...(filter === t ? styles.tabActive : {}) }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div style={styles.card}>
        {loading ? (
          <div style={styles.loading}>{t('loading')}</div>
        ) : referrals.length === 0 ? (
          <div style={styles.empty}>{t('no_referrals')}</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>{t('mother')}</th>
                <th style={styles.th}>{t('from')}</th>
                <th style={styles.th}>{t('to_facility')}</th>
                <th style={styles.th}>{t('priority')}</th>
                <th style={styles.th}>{t('status')}</th>
                <th style={styles.th}>{t('date')}</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map(ref => (
                <tr key={ref.id}>
                  <td style={styles.td}><strong>{ref.mother_name || '—'}</strong></td>
                  <td style={styles.td}>{ref.referred_by || '—'}</td>
                  <td style={styles.td}>{ref.to_facility_name || ref.to_facility_id || '—'}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.priorityBadge,
                      background: ref.priority === 'emergency' ? '#FDEDED' : ref.priority === 'urgent' ? '#FEF9E7' : '#E8F8F5',
                      color: ref.priority === 'emergency' ? '#E74C3C' : ref.priority === 'urgent' ? '#F39C12' : '#27AE60',
                    }}>
                      {ref.priority || 'normal'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.statusBadge,
                      background: ref.status === 'pending' ? '#EBF5FB' : ref.status === 'completed' ? '#E8F8F5' : ref.status === 'accepted' ? '#FEF9E7' : '#F0F0F0',
                      color: ref.status === 'pending' ? '#2980B9' : ref.status === 'completed' ? '#27AE60' : ref.status === 'accepted' ? '#F39C12' : '#7F8C8D',
                    }}>
                      {ref.status}
                    </span>
                  </td>
                  <td style={styles.td}>{ref.created_at ? new Date(ref.created_at).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const styles = {
  title: { fontSize: 24, fontWeight: 'bold', color: '#1A5276', marginBottom: 20 },
  tabs: { display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  tab: { padding: '8px 20px', border: '1px solid #E0E0E0', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: '#666' },
  tabActive: { background: '#1A5276', color: '#fff', borderColor: '#1A5276' },
  card: { background: '#fff', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '14px 16px', borderBottom: '2px solid #F0F0F0', fontSize: 13, color: '#7F8C8D', fontWeight: 600, background: '#FAFAFA' },
  td: { padding: '14px 16px', borderBottom: '1px solid #F0F0F0', fontSize: 14, color: '#2C3E50' },
  loading: { padding: 40, textAlign: 'center', color: '#7F8C8D' },
  empty: { padding: 40, textAlign: 'center', color: '#999' },
  priorityBadge: { padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, textTransform: 'capitalize' },
  statusBadge: { padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 500, textTransform: 'capitalize' },
};
