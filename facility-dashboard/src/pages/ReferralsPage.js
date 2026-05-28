import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useTranslation } from '../context/LanguageContext';

export default function ReferralsPage() {
  const { t } = useTranslation();
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  useEffect(() => { loadReferrals(); }, [filter]);

  async function loadReferrals() {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const res = await api.getReferrals(params);
      setReferrals(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id, status, outcome = '') {
    try {
      await api.updateReferralStatus(id, { status, outcome });
      loadReferrals();
    } catch (err) {
      alert(err.response?.data?.error || 'update_failed');
    }
  }

  return (
    <div>
      <h2 style={styles.title}>{t('referrals')}</h2>

      <div style={styles.filterRow}>
        {['pending', 'accepted', 'completed', 'cancelled', 'all'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ ...styles.filterBtn, ...(filter === f ? styles.filterActive : {}) }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
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
                <th style={styles.th}>{t('referred_by')}</th>
                <th style={styles.th}>{t('to_facility')}</th>
                <th style={styles.th}>{t('reason')}</th>
                <th style={styles.th}>{t('priority')}</th>
                <th style={styles.th}>{t('status')}</th>
                <th style={styles.th}>{t('action')}</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map(ref => (
                <tr key={ref.id}>
                  <td style={styles.td}><strong>{ref.mother_name}</strong></td>
                  <td style={styles.td}>{ref.referred_by}</td>
                  <td style={styles.td}>{ref.to_facility}</td>
                  <td style={styles.td}>{(ref.referral_reason || '').substring(0, 50)}</td>
                  <td style={styles.td}>
                    <span style={{ ...styles.priorityBadge, background: ref.priority === 'emergency' ? '#FDEDED' : ref.priority === 'urgent' ? '#FEF9E7' : '#E8F8F5', color: ref.priority === 'emergency' ? '#E74C3C' : ref.priority === 'urgent' ? '#F39C12' : '#27AE60' }}>
                      {ref.priority}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={{ ...styles.statusBadge, background: ref.status === 'pending' ? '#FEF9E7' : ref.status === 'accepted' ? '#EBF5FB' : ref.status === 'completed' ? '#E8F8F5' : '#F0F0F0', color: ref.status === 'pending' ? '#F39C12' : ref.status === 'accepted' ? '#2980B9' : ref.status === 'completed' ? '#27AE60' : '#7F8C8D' }}>
                      {ref.status}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {ref.status === 'pending' && (
                      <>
                        <button style={styles.acceptBtn} onClick={() => updateStatus(ref.id, 'accepted')}>{t('accept')}</button>
                        <button style={styles.completeActBtn} onClick={() => updateStatus(ref.id, 'completed', 'Treated')}>{t('complete')}</button>
                      </>
                    )}
                    {ref.status === 'accepted' && (
                      <button style={styles.completeActBtn} onClick={() => updateStatus(ref.id, 'completed', 'Treated successfully')}>{t('mark_complete')}</button>
                    )}
                  </td>
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
  title: { fontSize: 24, fontWeight: 'bold', color: '#2C3E50', marginBottom: 20 },
  filterRow: { display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  filterBtn: { padding: '8px 20px', border: '1px solid #E0E0E0', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: '#666' },
  filterActive: { background: '#2980B9', color: '#fff', borderColor: '#2980B9' },
  card: { background: '#fff', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '14px 16px', borderBottom: '2px solid #F0F0F0', fontSize: 13, color: '#7F8C8D', fontWeight: 600, background: '#FAFAFA' },
  td: { padding: '14px 16px', borderBottom: '1px solid #F0F0F0', fontSize: 14, color: '#2C3E50' },
  priorityBadge: { padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 600, textTransform: 'capitalize' },
  statusBadge: { padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 500, textTransform: 'capitalize' },
  loading: { padding: 40, textAlign: 'center', color: '#7F8C8D' },
  empty: { padding: 40, textAlign: 'center', color: '#999' },
  acceptBtn: { background: '#2980B9', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13, marginRight: 6 },
  completeActBtn: { background: '#27AE60', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13, marginRight: 6 },
};
