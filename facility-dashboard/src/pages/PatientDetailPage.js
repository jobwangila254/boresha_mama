import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useTranslation } from '../context/LanguageContext';

export default function PatientDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [timelineData, setTimelineData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({});

  const riskFactorOptions = [
    'age_over_35', 'age_under_18', 'previous_c_section',
    'previous_miscarriage', 'hypertension', 'diabetes', 'multiple_pregnancy',
    'hiv_positive', 'anemia', 'obesity', 'previous_complication',
  ];

  useEffect(() => {
    async function load() {
      try {
        const [patRes, tlRes] = await Promise.all([
          api.getPregnancy(id),
          api.getPregnancyTimeline(id),
        ]);
        setPatient(patRes.data);
        setTimelineData(tlRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  function getRiskLevelLabel(level) {
    return level ? level.charAt(0).toUpperCase() + level.slice(1) : 'Auto';
  }

  const riskLevelOptions = ['low', 'medium', 'high', 'critical'];

  function startEdit() {
    setEditForm({
      status: patient.status || 'active',
      riskLevelOverride: '',
      riskFactors: patient.risk_factors || [],
      notes: patient.notes || '',
    });
    setEditing(true);
  }

  function toggleRiskFactor(factor) {
    setEditForm(prev => ({
      ...prev,
      riskFactors: prev.riskFactors.includes(factor)
        ? prev.riskFactors.filter(f => f !== factor)
        : [...prev.riskFactors, factor],
    }));
  }

  async function saveEdit() {
    setSaving(true);
    try {
      const payload = {
        status: editForm.status,
        riskFactors: editForm.riskFactors,
        notes: editForm.notes,
      };
      if (editForm.riskLevelOverride) {
        payload.riskLevel = editForm.riskLevelOverride;
      }
      const res = await api.updatePregnancy(id, payload);
      setPatient({ ...patient, ...res.data });
      setEditing(false);
    } catch (err) {
      alert('Failed to update patient');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={styles.loading}>{t('loading')}</div>;
  if (!patient) return <div style={styles.loading}>{t('no_data')}</div>;

  const appointments = timelineData?.appointments || [];
  const homeVisits = timelineData?.homeVisits || [];

  return (
    <div>
      <Link to="/patients" style={styles.backLink}>&larr; {t('back_to_patients')}</Link>

      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>{patient.mother_name}</h2>
          <p style={styles.subtitle}>{patient.mother_phone} &middot; {patient.mother_national_id || '—'}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{
            ...styles.riskBadge,
            background: patient.risk_level === 'high' ? '#FDEDED' : patient.risk_level === 'medium' ? '#FEF9E7' : '#E8F8F5',
            color: patient.risk_level === 'high' ? '#E74C3C' : patient.risk_level === 'medium' ? '#F39C12' : '#27AE60',
          }}>
            {patient.risk_level} {t('risk_level')}
          </span>
          <button style={styles.editBtn} onClick={startEdit}>{t('edit')}</button>
        </div>
      </div>

      {editing && (
        <div style={{ ...styles.card, marginBottom: 20, border: '2px solid #2980B9' }}>
          <h3 style={styles.cardTitle}>{t('edit')} {t('patients')}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={styles.fieldLabel}>{t('status')}</label>
              <select style={styles.select} value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}>
                <option value="active">Active</option>
                <option value="delivered">Delivered</option>
                <option value="lost">Lost</option>
                <option value="transferred">Transferred</option>
              </select>
            </div>
            <div>
              <label style={styles.fieldLabel}>Risk Level Override <span style={{ fontSize: 11, color: '#999' }}>(optional — set to override auto-calculation)</span></label>
              <select style={styles.select} value={editForm.riskLevelOverride} onChange={e => setEditForm(f => ({ ...f, riskLevelOverride: e.target.value }))}>
                <option value="">Auto (from risk factors)</option>
                {riskLevelOptions.map(l => (
                  <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={styles.fieldLabel}>Risk Factors</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {riskFactorOptions.map(factor => (
                <label key={factor} style={{
                  display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px',
                  borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500,
                  background: editForm.riskFactors.includes(factor) ? '#FDEDED' : '#F5F5F5',
                  border: editForm.riskFactors.includes(factor) ? '1px solid #E74C3C' : '1px solid #E0E0E0',
                }}>
                  <input type="checkbox" checked={editForm.riskFactors.includes(factor)} onChange={() => toggleRiskFactor(factor)} style={{ display: 'none' }} />
                  {factor.replace(/_/g, ' ')}
                </label>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={styles.fieldLabel}>{t('notes')}</label>
            <textarea style={{ ...styles.select, minHeight: 80 }} value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button style={{ ...styles.completeBtn, background: '#2980B9' }} onClick={saveEdit} disabled={saving}>{saving ? t('loading') : t('save')}</button>
            <button style={{ ...styles.cancelBtn }} onClick={() => setEditing(false)}>{t('cancel')}</button>
          </div>
        </div>
      )}

      <div style={styles.grid}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>{t('pregnancy_details')}</h3>
          <div style={styles.infoRow}><span style={styles.label}>EDD</span><span>{patient.edd_date ? new Date(patient.edd_date).toLocaleDateString() : '—'}</span></div>
          <div style={styles.infoRow}><span style={styles.label}>{t('gestational_age')}</span><span>{timelineData?.currentWeek || '—'} weeks</span></div>
          <div style={styles.infoRow}><span style={styles.label}>{t('parity')}</span><span>{patient.parity}</span></div>
          <div style={styles.infoRow}><span style={styles.label}>{t('gravidity')}</span><span>{patient.gravida}</span></div>
          <div style={styles.infoRow}><span style={styles.label}>{t('status')}</span><span>{patient.status}</span></div>
          <div style={styles.infoRow}><span style={styles.label}>{t('facility')}</span><span>{patient.facility_name || '—'}</span></div>
          <div style={styles.infoRow}><span style={styles.label}>Risk Factors</span><span>{patient.risk_factors?.length ? patient.risk_factors.map(f => f.replace(/_/g, ' ')).join(', ') : 'None'}</span></div>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>{t('contact_location')}</h3>
          <div style={styles.infoRow}><span style={styles.label}>{t('phone')}</span><span>{patient.mother_phone}</span></div>
          <div style={styles.infoRow}><span style={styles.label}>{t('alternate_phone')}</span><span>{patient.alternate_phone || '—'}</span></div>
          <div style={styles.infoRow}><span style={styles.label}>{t('village')}</span><span>{patient.village || '—'}</span></div>
          <div style={styles.infoRow}><span style={styles.label}>{t('ward')}</span><span>{patient.ward || '—'}</span></div>
          <div style={styles.infoRow}><span style={styles.label}>{t('constituency')}</span><span>{patient.constituency || '—'}</span></div>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>{t('appointments')} ({appointments.length})</h3>
        {appointments.length === 0 ? (
          <p style={styles.empty}>{t('no_appointments')}</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>{t('date')}</th>
                <th style={styles.th}>{t('type')}</th>
                <th style={styles.th}>{t('status')}</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map(a => (
                <tr key={a.id}>
                  <td style={styles.td}>{new Date(a.appointment_date).toLocaleDateString()}</td>
                  <td style={styles.td}>{a.visit_type?.replace('_', ' ')}</td>
                  <td style={styles.td}>{a.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <button style={{ ...styles.completeBtn, marginTop: 12, background: '#2980B9' }} onClick={() => navigate('/appointments')}>{t('create_appointment')}</button>
      </div>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>{t('home_visits')} ({homeVisits.length})</h3>
        {homeVisits.length === 0 ? (
          <p style={styles.empty}>{t('no_home_visits')}</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>{t('date')}</th>
                <th style={styles.th}>{t('type')}</th>
                <th style={styles.th}>{t('risk_level')}</th>
                <th style={styles.th}>{t('notes')}</th>
              </tr>
            </thead>
            <tbody>
              {homeVisits.map(v => (
                <tr key={v.id}>
                  <td style={styles.td}>{new Date(v.visit_date).toLocaleDateString()}</td>
                  <td style={styles.td}>{v.visit_type?.replace('_', ' ')}</td>
                  <td style={styles.td}>{v.risk_level || '—'}</td>
                  <td style={styles.td}>{v.notes || '—'}</td>
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
  loading: { padding: 40, textAlign: 'center', color: '#7F8C8D' },
  backLink: { display: 'inline-block', color: '#2980B9', textDecoration: 'none', fontSize: 14, marginBottom: 16 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2C3E50', margin: '0 0 4px' },
  subtitle: { fontSize: 14, color: '#7F8C8D', margin: 0 },
  riskBadge: { padding: '6px 16px', borderRadius: 12, fontSize: 13, fontWeight: 600, textTransform: 'capitalize' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 },
  card: { background: '#fff', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: 20 },
  cardTitle: { fontSize: 16, fontWeight: 600, color: '#2C3E50', margin: '0 0 16px' },
  infoRow: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F5F5F5', fontSize: 14 },
  label: { color: '#7F8C8D', fontWeight: 500 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px 16px', borderBottom: '2px solid #F0F0F0', fontSize: 13, color: '#7F8C8D', fontWeight: 600, background: '#FAFAFA' },
  td: { padding: '12px 16px', borderBottom: '1px solid #F0F0F0', fontSize: 14, color: '#2C3E50' },
  empty: { textAlign: 'center', color: '#999', padding: 24 },
  editBtn: { background: '#2980B9', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500 },
  fieldLabel: { display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 4 },
  select: { width: '100%', padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: 8, fontSize: 14, background: '#FAFAFA', fontFamily: 'inherit' },
  completeBtn: { border: 'none', padding: '10px 20px', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 500 },
  cancelBtn: { background: '#E0E0E0', color: '#666', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 14 },
};
