import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useTranslation } from '../context/LanguageContext';

export default function FacilitiesPage() {
  const { t } = useTranslation();
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getFacilities()
      .then(res => setFacilities(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2 style={styles.title}>{t('health_facilities')}</h2>
      <p style={styles.subtitle}>{t('facilities_desc')}</p>

      <div style={styles.card}>
        {loading ? (
          <div style={styles.loading}>{t('loading')}</div>
        ) : facilities.length === 0 ? (
          <div style={styles.empty}>{t('no_facilities')}</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>{t('name')}</th>
                <th style={styles.th}>{t('type')}</th>
                <th style={styles.th}>{t('ward')}</th>
                <th style={styles.th}>{t('constituency')}</th>
                <th style={styles.th}>{t('level')}</th>
                <th style={styles.th}>{t('status')}</th>
              </tr>
            </thead>
            <tbody>
              {facilities.map(f => (
                <tr key={f.id}>
                  <td style={styles.td}><strong>{f.name}</strong></td>
                  <td style={styles.td}>{f.type.replace(/_/g, ' ')}</td>
                  <td style={styles.td}>{f.ward}</td>
                  <td style={styles.td}>{f.constituency}</td>
                  <td style={styles.td}>{f.level}</td>
                  <td style={styles.td}>
                    <span style={{ ...styles.statusBadge, background: f.is_active ? '#E8F8F5' : '#F0F0F0', color: f.is_active ? '#27AE60' : '#7F8C8D' }}>
                      {f.is_active ? t('active') : t('inactive')}
                    </span>
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
  title: { fontSize: 24, fontWeight: 'bold', color: '#1A5276', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#7F8C8D', marginBottom: 24 },
  card: { background: '#fff', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '14px 16px', borderBottom: '2px solid #F0F0F0', fontSize: 13, color: '#7F8C8D', fontWeight: 600, background: '#FAFAFA' },
  td: { padding: '14px 16px', borderBottom: '1px solid #F0F0F0', fontSize: 14, color: '#2C3E50' },
  statusBadge: { padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 500 },
  loading: { padding: 40, textAlign: 'center', color: '#7F8C8D' },
  empty: { padding: 40, textAlign: 'center', color: '#999' },
};
