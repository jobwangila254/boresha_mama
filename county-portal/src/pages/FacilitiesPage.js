import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useTranslation } from '../context/LanguageContext';

const FACILITY_TYPES = ['dispensary', 'health_center', 'sub_county_hospital', 'county_hospital', 'county_referral_hospital'];
const FACILITY_LEVELS = ['Level 2', 'Level 3', 'Level 4', 'Level 5'];

export default function FacilitiesPage() {
  const { t } = useTranslation();
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    name: '', type: '', ward: '', constituency: 'Kiminini', level: '', phone: '', email: '', latitude: '', longitude: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    fetchFacilities();
  }, []);

  useEffect(() => {
    if (selectedId) {
      setStatsLoading(true);
      setStats(null);
      api.getFacilityStats(selectedId)
        .then(res => setStats(res.data))
        .catch(() => {})
        .finally(() => setStatsLoading(false));
    }
  }, [selectedId]);

  const fetchFacilities = () => {
    setLoading(true);
    api.getFacilities(true)
      .then(res => setFacilities(res.data))
      .catch(err => setError(err.response?.data?.error || 'Failed to load facilities'))
      .finally(() => setLoading(false));
  };

  function openAddForm() {
    setEditing(null);
    setFormData({ name: '', type: '', ward: '', constituency: 'Kiminini', level: '', phone: '', email: '', latitude: '', longitude: '' });
    setShowForm(true);
  }

  function openEditForm(e, facility) {
    e.stopPropagation();
    setEditing(facility);
    setFormData({
      name: facility.name || '',
      type: facility.type || '',
      ward: facility.ward || '',
      constituency: facility.constituency || 'Kiminini',
      level: facility.level || '',
      phone: facility.phone || '',
      email: facility.email || '',
      latitude: facility.latitude?.toString() || '',
      longitude: facility.longitude?.toString() || '',
    });
    setShowForm(true);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (editing) {
        await api.updateFacility(editing.id, formData);
      } else {
        await api.createFacility(formData);
      }
      setFormData({ name: '', type: '', ward: '', constituency: 'Kiminini', level: '', phone: '', email: '', latitude: '', longitude: '' });
      setShowForm(false);
      setEditing(null);
      fetchFacilities();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save facility');
    } finally {
      setSubmitting(false);
    }
  };

  async function handleToggleStatus(e, facility) {
    e.stopPropagation();
    try {
      await api.toggleFacilityStatus(facility.id, !facility.is_active);
      if (selectedId === facility.id) setSelectedId(null);
      fetchFacilities();
    } catch (err) {
      alert('Failed to update facility status');
    }
  }

  const summary = {
    total: facilities.length,
    active: facilities.filter(f => f.is_active).length,
    inactive: facilities.filter(f => !f.is_active).length,
    byType: facilities.reduce((acc, f) => {
      acc[f.type] = (acc[f.type] || 0) + 1;
      return acc;
    }, {}),
    byWard: [...new Set(facilities.map(f => f.ward))].length,
  };

  function renderStatCard(label, value, color) {
    return (
      <div style={{ ...styles.statCard, borderLeft: `4px solid ${color}` }}>
        <span style={styles.statValue}>{value}</span>
        <span style={styles.statLabel}>{label}</span>
      </div>
    );
  }

  const selected = facilities.find(f => f.id === selectedId);

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>{t('health_facilities')}</h2>
          <p style={styles.subtitle}>{t('facilities_desc')}</p>
        </div>
        <button onClick={openAddForm} style={styles.addBtn}>+ {t('add_facility')}</button>
      </div>

      <div style={styles.statsRow}>
        {renderStatCard('Total', summary.total, '#1A5276')}
        {renderStatCard('Active', summary.active, '#27AE60')}
        {renderStatCard('Inactive', summary.inactive, '#E74C3C')}
        {renderStatCard('Wards', summary.byWard, '#F39C12')}
      </div>

      {Object.keys(summary.byType).length > 0 && (
        <div style={styles.typeRow}>
          {Object.entries(summary.byType).map(([type, count]) => (
            <div key={type} style={styles.typeChip}>
              <span style={styles.typeChipLabel}>{type.replace(/_/g, ' ')}</span>
              <span style={styles.typeChipCount}>{count}</span>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div style={styles.card}>
          <h3 style={{ marginBottom: 16 }}>{editing ? 'Edit Facility' : 'Add New Facility'}</h3>
          {error && <div style={styles.error}>{error}</div>}
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.row}>
              <input placeholder="Facility Name*" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required style={styles.input} />
              <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} required style={styles.input}>
                <option value="">Select Type*</option>
                {FACILITY_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div style={styles.row}>
              <input placeholder="Ward*" value={formData.ward} onChange={(e) => setFormData({...formData, ward: e.target.value})} required style={styles.input} />
              <select value={formData.level} onChange={(e) => setFormData({...formData, level: e.target.value})} required style={styles.input}>
                <option value="">Select Level*</option>
                {FACILITY_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div style={styles.row}>
              <input placeholder="Phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} style={styles.input} />
              <input placeholder="Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} style={styles.input} />
            </div>
            <div style={styles.row}>
              <input placeholder="Latitude" type="number" step="0.0001" value={formData.latitude} onChange={(e) => setFormData({...formData, latitude: e.target.value})} style={styles.input} />
              <input placeholder="Longitude" type="number" step="0.0001" value={formData.longitude} onChange={(e) => setFormData({...formData, longitude: e.target.value})} style={styles.input} />
            </div>
            <div style={styles.row}>
              <button type="submit" disabled={submitting} style={styles.submitBtn}>
                {submitting ? 'Saving...' : editing ? 'Update Facility' : 'Create Facility'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} style={styles.cancelBtn}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {selected && (
        <div style={styles.overlay} onClick={() => setSelectedId(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>{selected.name}</h3>
              <button onClick={() => setSelectedId(null)} style={styles.modalClose}>&times;</button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.modalSection}>
                <h4 style={styles.sectionTitle}>Facility Info</h4>
                <div style={styles.infoGrid}>
                  <div><span style={styles.infoLabel}>Type</span><span style={styles.infoValue}>{selected.type?.replace(/_/g, ' ')}</span></div>
                  <div><span style={styles.infoLabel}>Ward</span><span style={styles.infoValue}>{selected.ward}</span></div>
                  <div><span style={styles.infoLabel}>Constituency</span><span style={styles.infoValue}>{selected.constituency}</span></div>
                  <div><span style={styles.infoLabel}>Level</span><span style={styles.infoValue}>{selected.level}</span></div>
                  <div><span style={styles.infoLabel}>Phone</span><span style={styles.infoValue}>{selected.phone || '—'}</span></div>
                  <div><span style={styles.infoLabel}>Email</span><span style={styles.infoValue}>{selected.email || '—'}</span></div>
                  <div><span style={styles.infoLabel}>Status</span>
                    <span style={{ ...styles.statusBadge, background: selected.is_active ? '#E8F8F5' : '#F0F0F0', color: selected.is_active ? '#27AE60' : '#7F8C8D' }}>
                      {selected.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div style={styles.modalSection}>
                <h4 style={styles.sectionTitle}>Performance Stats</h4>
                {statsLoading ? (
                  <div style={styles.loading}>Loading stats...</div>
                ) : stats ? (
                  <div style={styles.statsGrid}>
                    <div style={styles.statBox}>
                      <span style={styles.statBoxValue}>{stats.stats.staffCount}</span>
                      <span style={styles.statBoxLabel}>Staff</span>
                    </div>
                    <div style={styles.statBox}>
                      <span style={styles.statBoxValue}>{stats.stats.mothersCount}</span>
                      <span style={styles.statBoxLabel}>Mothers</span>
                    </div>
                    <div style={styles.statBox}>
                      <span style={styles.statBoxValue}>{stats.stats.activePregnancies}</span>
                      <span style={styles.statBoxLabel}>Active Pregnancies</span>
                    </div>
                    <div style={styles.statBox}>
                      <span style={styles.statBoxValue}>{stats.stats.pregnancyCount}</span>
                      <span style={styles.statBoxLabel}>Total Pregnancies</span>
                    </div>
                    <div style={styles.statBox}>
                      <span style={styles.statBoxValue}>{stats.stats.referralsTo}</span>
                      <span style={styles.statBoxLabel}>Referrals In</span>
                    </div>
                    <div style={styles.statBox}>
                      <span style={styles.statBoxValue}>{stats.stats.referralsFrom}</span>
                      <span style={styles.statBoxLabel}>Referrals Out</span>
                    </div>
                    <div style={styles.statBox}>
                      <span style={styles.statBoxValue}>{stats.stats.referralsCompleted}</span>
                      <span style={styles.statBoxLabel}>Referrals Completed</span>
                    </div>
                    <div style={styles.statBox}>
                      <span style={styles.statBoxValue}>{stats.stats.appointmentsTotal}</span>
                      <span style={styles.statBoxLabel}>Appointments</span>
                    </div>
                    <div style={styles.statBox}>
                      <span style={styles.statBoxValue}>{stats.stats.appointmentsUpcoming}</span>
                      <span style={styles.statBoxLabel}>Upcoming</span>
                    </div>
                  </div>
                ) : (
                  <div style={styles.loading}>Failed to load stats</div>
                )}
              </div>
            </div>

            <div style={styles.modalActions}>
              <button style={styles.editBtnLarge} onClick={(e) => { openEditForm(e, selected); setSelectedId(null); }}>Edit Facility</button>
              <button style={selected.is_active ? styles.deactivateBtnLarge : styles.activateBtnLarge} onClick={(e) => handleToggleStatus(e, selected)}>
                {selected.is_active ? 'Deactivate' : 'Activate'}
              </button>
              <button style={styles.closeBtn} onClick={() => setSelectedId(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

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
                <th style={styles.th}>{t('phone')}</th>
                <th style={styles.th}>{t('status')}</th>
                <th style={styles.th}>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {facilities.map(f => (
                <tr key={f.id} onClick={() => setSelectedId(f.id)} style={styles.trClickable}>
                  <td style={styles.td}><strong>{f.name}</strong></td>
                  <td style={styles.td}>{f.type?.replace(/_/g, ' ')}</td>
                  <td style={styles.td}>{f.ward}</td>
                  <td style={styles.td}>{f.constituency}</td>
                  <td style={styles.td}>{f.level}</td>
                  <td style={styles.td}>{f.phone || '—'}</td>
                  <td style={styles.td}>
                    <span style={{ ...styles.statusBadge, background: f.is_active ? '#E8F8F5' : '#F0F0F0', color: f.is_active ? '#27AE60' : '#7F8C8D' }}>
                      {f.is_active ? t('active') : t('inactive')}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.actionBtns}>
                      <button style={styles.editBtn} onClick={(e) => openEditForm(e, f)}>Edit</button>
                      <button style={f.is_active ? styles.deactivateBtn : styles.activateBtn} onClick={(e) => handleToggleStatus(e, f)}>
                        {f.is_active ? 'Deact' : 'Activate'}
                      </button>
                    </div>
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
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1A5276', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#7F8C8D', margin: 0 },
  statsRow: { display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' },
  statCard: { background: '#fff', borderRadius: 10, padding: '16px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', flex: 1, minWidth: 140 },
  statValue: { display: 'block', fontSize: 28, fontWeight: 'bold', color: '#2C3E50', marginBottom: 4 },
  statLabel: { display: 'block', fontSize: 12, color: '#7F8C8D', fontWeight: 600, textTransform: 'uppercase' },
  typeRow: { display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  typeChip: { background: '#EAF2F8', borderRadius: 20, padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 },
  typeChipLabel: { color: '#1A5276', fontWeight: 500 },
  typeChipCount: { background: '#1A5276', color: '#fff', borderRadius: 12, padding: '2px 8px', fontSize: 11, fontWeight: 700 },
  addBtn: { padding: '10px 20px', background: '#27AE60', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500, fontSize: 14 },
  card: { background: '#fff', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden', padding: 20, marginBottom: 20 },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  row: { display: 'flex', gap: 12 },
  input: { flex: 1, padding: '10px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14 },
  submitBtn: { padding: '12px 24px', background: '#1A5276', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 },
  cancelBtn: { padding: '12px 24px', background: '#fff', color: '#666', border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer', fontWeight: 500 },
  error: { background: '#fadbd8', color: '#c0392b', padding: 12, borderRadius: 6, marginBottom: 12 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '14px 16px', borderBottom: '2px solid #F0F0F0', fontSize: 13, color: '#7F8C8D', fontWeight: 600, background: '#FAFAFA' },
  td: { padding: '14px 16px', borderBottom: '1px solid #F0F0F0', fontSize: 14, color: '#2C3E50' },
  trClickable: { cursor: 'pointer' },
  statusBadge: { padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 500, display: 'inline-block' },
  actionBtns: { display: 'flex', gap: 6 },
  editBtn: { background: '#EAF2F8', color: '#1A5276', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 500 },
  deactivateBtn: { background: '#FDEDED', color: '#E74C3C', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 500 },
  activateBtn: { background: '#E8F8F5', color: '#27AE60', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 500 },
  loading: { padding: 40, textAlign: 'center', color: '#7F8C8D' },
  empty: { padding: 40, textAlign: 'center', color: '#999' },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#fff', borderRadius: 12, width: 640, maxWidth: '95%', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px 0' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A5276', margin: 0 },
  modalClose: { background: 'none', border: 'none', fontSize: 28, color: '#999', cursor: 'pointer', padding: '0 4px', lineHeight: 1 },
  modalBody: { padding: '16px 24px' },
  modalSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: 600, color: '#7F8C8D', textTransform: 'uppercase', margin: '0 0 12px 0', borderBottom: '1px solid #F0F0F0', paddingBottom: 8 },
  infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  infoLabel: { display: 'block', fontSize: 11, color: '#7F8C8D', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 },
  infoValue: { fontSize: 14, color: '#2C3E50' },
  statsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 },
  statBox: { background: '#F8F9FA', borderRadius: 8, padding: '14px', textAlign: 'center' },
  statBoxValue: { display: 'block', fontSize: 24, fontWeight: 'bold', color: '#1A5276' },
  statBoxLabel: { display: 'block', fontSize: 11, color: '#7F8C8D', fontWeight: 600, marginTop: 4 },
  modalActions: { display: 'flex', gap: 10, padding: '0 24px 20px', flexWrap: 'wrap' },
  editBtnLarge: { padding: '10px 20px', background: '#1A5276', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500, fontSize: 14 },
  deactivateBtnLarge: { padding: '10px 20px', background: '#FDEDED', color: '#E74C3C', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500, fontSize: 14 },
  activateBtnLarge: { padding: '10px 20px', background: '#E8F8F5', color: '#27AE60', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500, fontSize: 14 },
  closeBtn: { padding: '10px 20px', background: '#fff', color: '#666', border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer', fontWeight: 500, fontSize: 14, marginLeft: 'auto' },
};
