import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useTranslation } from '../context/LanguageContext';

export default function PatientsPage() {
  const { t } = useTranslation();
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadPatients(); }, []);

  async function loadPatients() {
    try {
      const res = await api.getPregnancies();
      setPatients(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = patients.filter(p => {
    const matchSearch = !search || p.mother_name?.toLowerCase().includes(search.toLowerCase()) || p.mother_phone?.includes(search);
    const matchFilter = filter === 'all' || p.risk_level === filter;
    return matchSearch && matchFilter;
  });

  if (loading) return <div style={styles.loading}>{t('loading')}</div>;

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.title}>{t('patients')}</h2>
        <div style={styles.actions}>
          <input style={styles.searchInput} placeholder={t('search')} value={search} onChange={e => setSearch(e.target.value)} />
          <select style={styles.filterSelect} value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">{t('all_risk')}</option>
            <option value="low">{t('low_risk')}</option>
            <option value="medium">{t('medium_risk')}</option>
            <option value="high">{t('high_risk')}</option>
            <option value="critical">{t('critical')}</option>
          </select>
        </div>
      </div>

      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>{t('mother')}</th>
              <th style={styles.th}>{t('phone')}</th>
              <th style={styles.th}>EDD</th>
              <th style={styles.th}>{t('risk_level')}</th>
              <th style={styles.th}>{t('status')}</th>
              <th style={styles.th}>{t('action')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={styles.empty}>{t('no_patients')}</td></tr>
            ) : (
              filtered.map(p => (
                <tr key={p.id}>
                  <td style={styles.td}>
                    <strong>{p.mother_name}</strong>
                    {p.mother_phone && <div style={styles.subtext}>{p.mother_phone}</div>}
                  </td>
                  <td style={styles.td}>{p.mother_phone}</td>
                  <td style={styles.td}>{p.edd_date ? new Date(p.edd_date).toLocaleDateString() : '—'}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.riskBadge,
                      background: p.risk_level === 'high' ? '#FDEDED' : p.risk_level === 'medium' ? '#FEF9E7' : '#E8F8F5',
                      color: p.risk_level === 'high' ? '#E74C3C' : p.risk_level === 'medium' ? '#F39C12' : '#27AE60',
                    }}>
                      {p.risk_level}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={{ ...styles.statusBadge, background: p.status === 'active' ? '#E8F8F5' : '#F0F0F0', color: p.status === 'active' ? '#27AE60' : '#7F8C8D' }}>
                      {p.status}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <Link to={`/dashboard/patients/${p.id}`} style={styles.viewBtn}>{t('view')}</Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  loading: { padding: 40, textAlign: 'center', color: '#7F8C8D' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2C3E50', margin: 0 },
  actions: { display: 'flex', gap: 12 },
  searchInput: { padding: '10px 14px', border: '1px solid #E0E0E0', borderRadius: 8, fontSize: 14, width: 220 },
  filterSelect: { padding: '10px 14px', border: '1px solid #E0E0E0', borderRadius: 8, fontSize: 14, background: '#fff' },
  card: { background: '#fff', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '14px 16px', borderBottom: '2px solid #F0F0F0', fontSize: 13, color: '#7F8C8D', fontWeight: 600, background: '#FAFAFA' },
  td: { padding: '14px 16px', borderBottom: '1px solid #F0F0F0', fontSize: 14, color: '#2C3E50' },
  subtext: { fontSize: 12, color: '#7F8C8D', marginTop: 2 },
  riskBadge: { padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 600, textTransform: 'capitalize' },
  statusBadge: { padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 500, textTransform: 'capitalize' },
  empty: { textAlign: 'center', color: '#999', padding: 40 },
  viewBtn: { color: '#2980B9', textDecoration: 'none', fontWeight: 500, fontSize: 14 },
};
