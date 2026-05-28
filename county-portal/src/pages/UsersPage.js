import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useTranslation } from '../context/LanguageContext';

const TAB_CHVS = 'chvs';
const TAB_STAFF = 'facilities';
const TAB_MOTHERS = 'mothers';

export default function UsersPage() {
  const { t } = useTranslation();
  const TAB_OPTIONS = [
    { key: TAB_CHVS, label: t('chvs') },
    { key: TAB_STAFF, label: t('facilities') },
    { key: TAB_MOTHERS, label: t('mothers') },
  ];
  const [tab, setTab] = useState(TAB_CHVS);
  const [users, setUsers] = useState([]);
  const [pregnancies, setPregnancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [facilities, setFacilities] = useState([]);
  const [form, setForm] = useState({ phone: '', password: '', firstName: '', lastName: '', nationalId: '', areaOfCoverage: '', facilityId: '', jobTitle: 'Facility Reception' });
  const [wards, setWards] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [tab]);

  async function loadData() {
    setLoading(true);
    try {
      if (tab === TAB_MOTHERS) {
        const res = await api.getPregnancies();
        setPregnancies(res.data);
      } else if (tab === TAB_STAFF) {
        const res = await api.getFacilities();
        setFacilities(res.data);
        setUsers([]);
      } else {
        const res = await api.getUsers('chv');
        setUsers(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleStatus(userId) {
    try {
      await api.toggleUserStatus(userId);
      loadData();
    } catch (err) {
      alert(t('toggle_failed'));
    }
  }

  function openAddModal() {
    setForm({ phone: '', password: '', firstName: '', lastName: '', nationalId: '', areaOfCoverage: '', facilityId: '', jobTitle: 'Facility Reception' });
    setShowModal(true);
    if (tab === TAB_CHVS) {
      api.getLocations({ county: 'Trans-Nzoia' }).then(res => {
        const wardSet = new Set();
        res.data.forEach(l => l.wards?.forEach(w => wardSet.add(w.ward)));
        setWards([...wardSet].sort());
      }).catch(() => {});
    }
  }

  async function handleAddUser(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        phone: form.phone,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        role: tab === TAB_CHVS ? 'chv' : 'facility_staff',
      };
      if (tab === TAB_CHVS) {
        payload.areaOfCoverage = form.areaOfCoverage || undefined;
      }
      if (tab === TAB_STAFF) {
        payload.nationalId = form.nationalId || undefined;
        payload.facilityId = form.facilityId;
        payload.jobTitle = form.jobTitle;
      }
      await api.register(payload);
      setShowModal(false);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  }

  function renderCHVRow(user) {
    const area = user.chvProfile?.area_of_coverage || '—';
    return (
      <tr key={user.id}>
        <td style={styles.td}><strong>{user.first_name} {user.last_name}</strong></td>
        <td style={styles.td}>{user.phone}</td>
        <td style={styles.td}>{area}</td>
        <td style={styles.td}>{new Date(user.created_at).toLocaleDateString()}</td>
        <td style={styles.td}>
          <span style={{ ...styles.statusBadge, background: user.is_active ? '#E8F8F5' : '#F0F0F0', color: user.is_active ? '#27AE60' : '#7F8C8D' }}>
            {user.is_active ? t('active') : t('inactive')}
          </span>
        </td>
        <td style={styles.td}>
          <button style={styles.toggleBtn} onClick={() => handleToggleStatus(user.id)}>
            {user.is_active ? t('deactivate') : t('activate')}
          </button>
        </td>
      </tr>
    );
  }

  function renderStaffRow(facility) {
    return (
      <tr key={facility.id}>
        <td style={styles.td}><strong>{facility.name}</strong></td>
        <td style={styles.td}>{facility.type?.replace(/_/g, ' ')}</td>
        <td style={styles.td}>{facility.ward}</td>
        <td style={styles.td}>{facility.constituency}</td>
        <td style={styles.td}>{facility.level}</td>
        <td style={styles.td}>
          <span style={{ ...styles.statusBadge, background: facility.is_active ? '#E8F8F5' : '#F0F0F0', color: facility.is_active ? '#27AE60' : '#7F8C8D' }}>
            {facility.is_active ? t('active') : t('inactive')}
          </span>
        </td>
      </tr>
    );
  }

  function renderMotherRow(p) {
    return (
      <tr key={p.id}>
        <td style={styles.td}><strong>{p.mother_name}</strong></td>
        <td style={styles.td}>{p.mother_phone}</td>
        <td style={styles.td}>{p.mother_ward || '—'}</td>
        <td style={styles.td}>{p.facility_name || '—'}</td>
        <td style={styles.td}>
          <span style={{ ...styles.statusBadge, background: '#FEF9E7', color: '#F39C12' }}>
            {p.status || t('active')}
          </span>
        </td>
        <td style={styles.td}>
          <span style={{ ...styles.riskBadge, background: p.risk_level === 'high' || p.risk_level === 'critical' ? '#FDEDED' : '#E8F8F5', color: p.risk_level === 'high' || p.risk_level === 'critical' ? '#E74C3C' : '#27AE60' }}>
            {p.risk_level || 'low'}
          </span>
        </td>
      </tr>
    );
  }

  const list = tab === TAB_MOTHERS ? pregnancies : tab === TAB_STAFF ? facilities : users;
  const isEmpty = !loading && list.length === 0;

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>{t('manage_users')}</h2>
          <p style={styles.subtitle}>{t('manage_users_desc')}</p>
        </div>
        {tab === TAB_CHVS && (
          <button style={styles.addBtn} onClick={openAddModal}>+ {t('add_new_chv')}</button>
        )}
      </div>

      <div style={styles.tabs}>
        {TAB_OPTIONS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ ...styles.tab, ...(tab === t.key ? styles.tabActive : {}) }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={styles.card}>
        {loading ? (
          <div style={styles.loading}>{t('loading')}</div>
        ) : isEmpty ? (
          <div style={styles.empty}>
            <p style={styles.emptyText}>{t('no_data')}</p>
            {tab === TAB_CHVS && (
              <button style={styles.addBtnInline} onClick={openAddModal}>+ {t('add_first_chv')}</button>
            )}
          </div>
        ) : tab === TAB_MOTHERS ? (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>{t('name')}</th>
                <th style={styles.th}>{t('phone')}</th>
                <th style={styles.th}>{t('ward')}</th>
                <th style={styles.th}>{t('facility')}</th>
                <th style={styles.th}>{t('status')}</th>
                <th style={styles.th}>{t('risk_level')}</th>
              </tr>
            </thead>
            <tbody>
              {pregnancies.map(renderMotherRow)}
            </tbody>
          </table>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>{t('name')}</th>
                {tab === TAB_CHVS ? <th style={styles.th}>{t('phone')}</th> : <th style={styles.th}>{t('type')}</th>}
                {tab === TAB_CHVS ? <th style={styles.th}>{t('area_of_coverage')}</th> : <th style={styles.th}>{t('ward')}</th>}
                {tab === TAB_CHVS ? <th style={styles.th}>{t('created')}</th> : <th style={styles.th}>{t('constituency')}</th>}
                {tab === TAB_CHVS ? null : <th style={styles.th}>{t('level')}</th>}
                <th style={styles.th}>{t('status')}</th>
                {tab === TAB_CHVS ? <th style={styles.th}>{t('actions')}</th> : null}
              </tr>
            </thead>
            <tbody>
              {users.map(tab === TAB_CHVS ? renderCHVRow : renderStaffRow)}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div style={styles.overlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>{tab === TAB_CHVS ? t('add_new_chv') : t('add_new_staff')}</h3>
            <form onSubmit={handleAddUser}>
              <div style={styles.formGrid}>
                <div style={styles.field}>
                  <label style={styles.label}>{t('first_name')} *</label>
                  <input style={styles.input} value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} required />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>{t('last_name')} *</label>
                  <input style={styles.input} value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} required />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>{t('phone')} *</label>
                  <input style={styles.input} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+2547..." required />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>{t('password')} *</label>
                  <input style={styles.input} type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder={t('enter_password')} required />
                </div>
                {tab !== TAB_CHVS && (
                  <div style={styles.field}>
                      <label style={styles.label}>{t('national_id')}</label>
                    <input style={styles.input} value={form.nationalId} onChange={e => setForm({ ...form, nationalId: e.target.value })} placeholder={t('optional')} />
                  </div>
                )}
                {tab === TAB_CHVS && (
                  <div style={styles.field}>
                    <label style={styles.label}>{t('area_of_coverage')}</label>
                    <select style={styles.input} value={form.areaOfCoverage} onChange={e => setForm({ ...form, areaOfCoverage: e.target.value })}>
                      <option value="">{t('select_ward')}</option>
                      {wards.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                )}
                {tab === TAB_STAFF && (
                  <>
                    <div style={styles.field}>
                      <label style={styles.label}>{t('facility')} *</label>
                      <select style={styles.input} value={form.facilityId} onChange={e => setForm({ ...form, facilityId: e.target.value })} required>
                        <option value="">{t('select_facility')}</option>
                        {facilities.map(f => (
                          <option key={f.id} value={f.id}>{f.name} ({f.ward})</option>
                        ))}
                      </select>
                    </div>
                    <div style={styles.field}>
                      <label style={styles.label}>{t('job_title')}</label>
                      <input style={styles.input} value={form.jobTitle} onChange={e => setForm({ ...form, jobTitle: e.target.value })} />
                    </div>
                  </>
                )}
              </div>
              <div style={styles.modalActions}>
                <button type="button" style={styles.cancelBtn} onClick={() => setShowModal(false)}>{t('cancel')}</button>
                <button type="submit" style={styles.saveBtn} disabled={submitting}>
                  {submitting ? t('creating') : t('create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1A5276', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#7F8C8D', margin: 0 },
  tabs: { display: 'flex', gap: 8, marginBottom: 20 },
  tab: { padding: '8px 24px', border: '1px solid #E0E0E0', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: '#666' },
  tabActive: { background: '#1A5276', color: '#fff', borderColor: '#1A5276' },
  card: { background: '#fff', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '14px 16px', borderBottom: '2px solid #F0F0F0', fontSize: 13, color: '#7F8C8D', fontWeight: 600, background: '#FAFAFA' },
  td: { padding: '14px 16px', borderBottom: '1px solid #F0F0F0', fontSize: 14, color: '#2C3E50' },
  statusBadge: { padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 500, display: 'inline-block' },
  riskBadge: { padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 500, display: 'inline-block', textTransform: 'capitalize' },
  toggleBtn: { background: 'none', border: '1px solid #E0E0E0', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12, color: '#555' },
  addBtn: { background: '#1A5276', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500, marginTop: 4 },
  addBtnInline: { background: '#1A5276', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500 },
  loading: { padding: 40, textAlign: 'center', color: '#7F8C8D' },
  empty: { padding: 40, textAlign: 'center', color: '#999' },
  emptyText: { marginBottom: 16, fontSize: 15 },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#fff', borderRadius: 12, padding: 32, width: 520, maxWidth: '90%', maxHeight: '90vh', overflow: 'auto' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A5276', margin: '0 0 20px 0' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  field: { marginBottom: 4 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 4 },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 },
  cancelBtn: { background: '#fff', color: '#666', border: '1px solid #E0E0E0', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500 },
  saveBtn: { background: '#1A5276', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500 },
};
