import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useTranslation } from '../context/LanguageContext';

const LEVEL_ORDER = { 'Level 2': 2, 'Level 3': 3, 'Level 4': 4, 'Level 5': 5 };

export default function NewReferralPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const searchRef = useRef();
  const [saving, setSaving] = useState(false);
  const [patients, setPatients] = useState([]);
  const [allFacilities, setAllFacilities] = useState([]);
  const [userFacilityLevel, setUserFacilityLevel] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [form, setForm] = useState({
    motherId: '',
    pregnancyId: '',
    toFacilityId: '',
    referralReason: '',
    priority: 'normal',
    notes: '',
  });

  const selectedPatient = patients.find(p => (p.mother_id || p.id) === form.motherId);

  useEffect(() => {
    (async () => {
      try {
        const [profileRes, patientsRes, facilitiesRes] = await Promise.all([
          api.getProfile(),
          api.getPregnancies(),
          api.getFacilities(),
        ]);
        setPatients(patientsRes.data || []);
        const allFacs = Array.isArray(facilitiesRes.data) ? facilitiesRes.data : [];
        setAllFacilities(allFacs);

        const staffLevel = profileRes.data?.facilityStaff?.facility_level;
        if (staffLevel) {
          setUserFacilityLevel(LEVEL_ORDER[staffLevel] || 0);
        }
      } catch { /* ignore */ }
    })();
  }, []);

  const filteredPatients = patients.filter(p => {
    if (!searchQuery) return false;
    const q = searchQuery.toLowerCase();
    const name = (p.mother_name || '').toLowerCase();
    const phone = (p.mother_phone || p.phone || '').toLowerCase();
    const nationalId = (p.mother_national_id || p.national_id || '').toLowerCase();
    return name.includes(q) || phone.includes(q) || nationalId.includes(q);
  });

  const eligibleFacilities = allFacilities.filter(f => {
    const level = LEVEL_ORDER[f.level] || 0;
    return level >= (userFacilityLevel || 0);
  });

  const levelLabels = { 'Level 2': 'Level 2', 'Level 3': 'Level 3', 'Level 4': 'Level 4', 'Level 5': 'Level 5' };

  function selectPatient(patient) {
    setForm(p => ({ ...p, motherId: patient.mother_id || patient.id, pregnancyId: patient.id || patient.pregnancy_id }));
    setSearchQuery(patient.mother_name || `${patient.first_name || ''} ${patient.last_name || ''}`);
    setShowSuggestions(false);
  }

  function handleSearchChange(e) {
    setSearchQuery(e.target.value);
    setShowSuggestions(true);
    if (form.motherId) {
      setForm(p => ({ ...p, motherId: '', pregnancyId: '' }));
    }
  }

  function handleClearPatient() {
    setSearchQuery('');
    setForm(p => ({ ...p, motherId: '', pregnancyId: '' }));
    setShowSuggestions(false);
    searchRef.current?.focus();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.motherId || !form.toFacilityId || !form.referralReason) {
      setError('Please select a patient, facility, and enter a reason');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.createReferral({
        pregnancyId: form.pregnancyId,
        motherId: form.motherId,
        toFacilityId: form.toFacilityId,
        referralReason: form.referralReason,
        priority: form.priority,
        notes: form.notes,
      });
      setSuccess(true);
      setTimeout(() => navigate('/referrals'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to create referral');
    } finally {
      setSaving(false);
    }
  }

  if (success) {
    return <div style={styles.success}>Referral created successfully! Redirecting...</div>;
  }

  return (
    <div>
      <h2 style={styles.title}>New Referral</h2>
      {error && <div style={styles.error}>{error}</div>}
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.field}>
          <label style={styles.label}>Search Patient *</label>
          <input
            ref={searchRef}
            style={styles.input}
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Type patient name, phone or national ID..."
            autoComplete="off"
          />
          {showSuggestions && searchQuery && (
            <div style={styles.suggestions}>
              {filteredPatients.length > 0 ? (
                filteredPatients.slice(0, 10).map(p => (
                  <div key={p.mother_id || p.id} style={styles.suggestionItem} onClick={() => selectPatient(p)}>
                    <strong>{p.mother_name || `${p.first_name || ''} ${p.last_name || ''}`}</strong>
                    <span style={styles.suggestionMeta}>{p.mother_phone || p.phone || ''} {p.mother_national_id || p.national_id ? `(${p.mother_national_id || p.national_id})` : ''}</span>
                  </div>
                ))
              ) : (
                <div style={styles.noResults}>No matching patients found</div>
              )}
            </div>
          )}
          {selectedPatient && (
            <div style={styles.selectedPatient}>
              <span>{selectedPatient.mother_name || `${selectedPatient.first_name || ''} ${selectedPatient.last_name || ''}`}</span>
              <button type="button" style={styles.clearBtn} onClick={handleClearPatient}>x</button>
            </div>
          )}
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Refer To Facility *</label>
          <select style={styles.select} value={form.toFacilityId} onChange={e => setForm(p => ({ ...p, toFacilityId: e.target.value }))} required>
            <option value="">Select facility</option>
            {eligibleFacilities.map(f => (
              <option key={f.id} value={f.id}>{f.name} — {levelLabels[f.level] || f.level || ''}</option>
            ))}
          </select>
          {eligibleFacilities.length === 0 && (
            <div style={styles.hint}>No eligible facilities found at your level or above</div>
          )}
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Referral Reason *</label>
          <select style={styles.select} value={form.referralReason} onChange={e => setForm(p => ({ ...p, referralReason: e.target.value }))} required>
            <option value="">Select reason</option>
            <option value="high_risk_pregnancy">High Risk Pregnancy</option>
            <option value="complication">Complication</option>
            <option value="preterm_labor">Preterm Labor</option>
            <option value="hypertension">Hypertension</option>
            <option value="diabetes_gestational">Gestational Diabetes</option>
            <option value="obstetric_emergency">Obstetric Emergency</option>
            <option value="postnatal_complication">Postnatal Complication</option>
            <option value="routine_checkup">Routine Checkup</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Priority</label>
            <select style={styles.select} value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Notes</label>
          <textarea style={styles.textarea} rows={3} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Optional notes or instructions" />
        </div>

        <div style={styles.actions}>
          <button type="submit" style={styles.submitBtn} disabled={saving}>{saving ? 'Creating...' : 'Create Referral'}</button>
          <button type="button" style={styles.cancelBtn} onClick={() => navigate('/dashboard')}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

const styles = {
  title: { fontSize: 22, fontWeight: 'bold', color: '#2C3E50', marginBottom: 24 },
  error: { background: '#FDEDED', color: '#E74C3C', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14 },
  success: { padding: 40, textAlign: 'center', fontSize: 18, color: '#27AE60' },
  form: { background: '#fff', borderRadius: 10, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', maxWidth: 600 },
  row: { display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' },
  field: { marginBottom: 16, position: 'relative' },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6 },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' },
  select: { width: '100%', padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: 6, fontSize: 14, boxSizing: 'border-box', background: '#fff', cursor: 'pointer' },
  textarea: { width: '100%', padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: 6, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit' },
  actions: { display: 'flex', gap: 12, marginTop: 8, paddingTop: 16, borderTop: '1px solid #F0F0F0' },
  submitBtn: { padding: '10px 24px', background: '#1B5E20', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  cancelBtn: { padding: '10px 24px', background: '#F0F0F0', color: '#555', border: 'none', borderRadius: 6, fontSize: 14, cursor: 'pointer' },
  suggestions: { position: 'absolute', zIndex: 10, background: '#fff', border: '1px solid #E0E0E0', borderRadius: 6, maxHeight: 240, overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: 'calc(100% - 2px)' },
  suggestionItem: { padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #F5F5F5', display: 'flex', flexDirection: 'column' },
  suggestionMeta: { fontSize: 12, color: '#999', marginTop: 2 },
  noResults: { padding: 20, textAlign: 'center', color: '#999', fontSize: 13 },
  selectedPatient: { marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 8, background: '#E8F5E9', padding: '6px 12px', borderRadius: 6, fontSize: 14, color: '#2E7D32' },
  clearBtn: { background: 'none', border: 'none', color: '#C62828', cursor: 'pointer', fontSize: 16, fontWeight: 'bold', padding: '0 4px' },
  hint: { fontSize: 12, color: '#E65100', marginTop: 4 },
};
