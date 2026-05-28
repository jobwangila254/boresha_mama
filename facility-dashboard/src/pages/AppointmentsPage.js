import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useTranslation } from '../context/LanguageContext';

export default function AppointmentsPage() {
  const { t } = useTranslation();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('scheduled');
  const [showCreate, setShowCreate] = useState(false);
  const [pregnancies, setPregnancies] = useState([]);
  const [createForm, setCreateForm] = useState({
    pregnancyId: '', motherId: '', facilityId: '',
    appointmentDate: '', visitType: 'antenatal', reason: '',
  });

  useEffect(() => { loadAppointments(); }, [tab]);

  async function loadAppointments() {
    try {
      const res = await api.getAppointments({ status: tab === 'all' ? undefined : tab });
      setAppointments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function openCreateModal() {
    try {
      const res = await api.getPregnancies();
      setPregnancies(res.data);
      setShowCreate(true);
    } catch { alert('Failed to load patients'); }
  }

  async function handleCreateAppointment() {
    if (!createForm.pregnancyId || !createForm.appointmentDate) {
      alert('Please select a patient and date');
      return;
    }
    try {
      await api.createAppointment(createForm);
      setShowCreate(false);
      setCreateForm({ pregnancyId: '', motherId: '', facilityId: '', appointmentDate: '', visitType: 'antenatal', reason: '' });
      loadAppointments();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create appointment');
    }
  }

  async function updateStatus(id, status) {
    try {
      await api.updateAppointmentStatus(id, { status });
      loadAppointments();
    } catch (err) {
      alert(err.response?.data?.error || 'Update failed');
    }
  }

  const tabs = ['scheduled', 'confirmed', 'completed', 'cancelled', 'missed', 'all'];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ ...styles.title, marginBottom: 0 }}>{t('appointments')}</h2>
        <button style={{ background: '#27AE60', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }} onClick={openCreateModal}>+ {t('create_appointment')}</button>
      </div>

      {showCreate && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: 480, maxHeight: '80vh', overflow: 'auto' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18, color: '#2C3E50' }}>{t('create_appointment')}</h3>
            <label style={styles.fieldLabel}>{t('mother')} *</label>
            <select style={styles.fieldInput} value={createForm.pregnancyId} onChange={e => {
              const p = pregnancies.find(p => p.id === e.target.value);
              setCreateForm(f => ({ ...f, pregnancyId: e.target.value, motherId: p?.mother_id || '', facilityId: p?.facility_id || '' }));
            }}>
              <option value="">{t('select_patient')}</option>
              {pregnancies.map(p => <option key={p.id} value={p.id}>{p.mother_name} — {p.mother_phone}</option>)}
            </select>
            <label style={styles.fieldLabel}>{t('date_time')} *</label>
            <input type="datetime-local" style={styles.fieldInput} value={createForm.appointmentDate} onChange={e => setCreateForm(f => ({ ...f, appointmentDate: e.target.value }))} />
            <label style={styles.fieldLabel}>{t('visit_type')}</label>
            <select style={styles.fieldInput} value={createForm.visitType} onChange={e => setCreateForm(f => ({ ...f, visitType: e.target.value }))}>
              <option value="antenatal">Antenatal</option>
              <option value="postnatal">Postnatal</option>
              <option value="follow_up">Follow-up</option>
              <option value="emergency">Emergency</option>
            </select>
            <label style={styles.fieldLabel}>{t('reason')}</label>
            <input style={styles.fieldInput} value={createForm.reason} onChange={e => setCreateForm(f => ({ ...f, reason: e.target.value }))} placeholder={t('optional')} />
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button style={{ flex: 1, background: '#27AE60', color: '#fff', border: 'none', padding: 12, borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }} onClick={handleCreateAppointment}>{t('create')}</button>
              <button style={{ flex: 1, background: '#E0E0E0', color: '#666', border: 'none', padding: 12, borderRadius: 8, cursor: 'pointer', fontSize: 14 }} onClick={() => setShowCreate(false)}>{t('cancel')}</button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.tabs}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ ...styles.tab, ...(tab === t ? styles.tabActive : {}) }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div style={styles.card}>
        {loading ? (
          <div style={styles.loading}>{t('loading')}</div>
        ) : appointments.length === 0 ? (
          <div style={styles.empty}>{t('no_appointments')}</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>{t('mother')}</th>
                <th style={styles.th}>{t('date_time')}</th>
                <th style={styles.th}>{t('type')}</th>
                <th style={styles.th}>{t('status')}</th>
                <th style={styles.th}>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map(apt => (
                <tr key={apt.id}>
                  <td style={styles.td}><strong>{apt.mother_name}</strong></td>
                  <td style={styles.td}>{new Date(apt.appointment_date).toLocaleString()}</td>
                  <td style={styles.td}><span style={styles.typeBadge}>{(apt.visit_type || '').replace('_', ' ')}</span></td>
                  <td style={styles.td}>
                    <span style={{ ...styles.statusBadge, background: apt.status === 'scheduled' ? '#FEF9E7' : apt.status === 'confirmed' ? '#EBF5FB' : apt.status === 'completed' ? '#E8F8F5' : '#F0F0F0', color: apt.status === 'scheduled' ? '#F39C12' : apt.status === 'confirmed' ? '#2980B9' : apt.status === 'completed' ? '#27AE60' : '#7F8C8D' }}>
                      {apt.status === 'scheduled' ? 'Pending' : apt.status}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {apt.status === 'scheduled' && (
                      <>
                        <button style={styles.confirmBtn} onClick={() => updateStatus(apt.id, 'confirmed')}>{t('confirm')}</button>
                        <button style={styles.cancelBtn} onClick={() => updateStatus(apt.id, 'cancelled')}>{t('cancel')}</button>
                      </>
                    )}
                    {apt.status === 'confirmed' && (
                      <>
                        <button style={styles.completeBtn} onClick={() => updateStatus(apt.id, 'completed')}>{t('complete')}</button>
                        <button style={styles.cancelBtn} onClick={() => updateStatus(apt.id, 'cancelled')}>{t('cancel')}</button>
                      </>
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
  tabs: { display: 'flex', gap: 8, marginBottom: 20 },
  tab: { padding: '8px 20px', border: '1px solid #E0E0E0', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: '#666' },
  tabActive: { background: '#2980B9', color: '#fff', borderColor: '#2980B9' },
  card: { background: '#fff', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '14px 16px', borderBottom: '2px solid #F0F0F0', fontSize: 13, color: '#7F8C8D', fontWeight: 600, background: '#FAFAFA' },
  td: { padding: '14px 16px', borderBottom: '1px solid #F0F0F0', fontSize: 14, color: '#2C3E50' },
  typeBadge: { background: '#EBF5FB', padding: '3px 10px', borderRadius: 12, fontSize: 12, color: '#2980B9', textTransform: 'capitalize' },
  statusBadge: { padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 500, textTransform: 'capitalize' },
  loading: { padding: 40, textAlign: 'center', color: '#7F8C8D' },
  empty: { padding: 40, textAlign: 'center', color: '#999' },
  confirmBtn: { background: '#2980B9', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13, marginRight: 6 },
  completeBtn: { background: '#27AE60', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13, marginRight: 6 },
  cancelBtn: { background: '#E74C3C', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
  fieldLabel: { display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginTop: 12, marginBottom: 4 },
  fieldInput: { width: '100%', padding: 10, border: '1px solid #E0E0E0', borderRadius: 8, fontSize: 14, background: '#FAFAFA', boxSizing: 'border-box' },
};
