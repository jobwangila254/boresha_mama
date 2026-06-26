import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useTranslation } from '../context/LanguageContext';

export default function RegisterPatientPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [locations, setLocations] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    motherPhone: '',
    motherFirstName: '',
    motherLastName: '',
    motherNationalId: '',
    motherDOB: '',
    constituency: '',
    ward: '',
    village: '',
    lmpDate: '',
    gravida: '1',
    parity: '0',
    facilityId: '',
    // Prenatal fields
    chronicConditions: [],
    allergies: '',
    currentMedications: '',
    height: '',
    weight: '',
    previousComplications: [],
    bloodType: '',
    currentSymptoms: [],
    // Birth plan fields
    deliveryPlan: 'facility',
    supportPerson: '',
    emergencyContactPhone: '',
    breastfeedingPlan: 'exclusive',
    familyPlanning: '',
    // Childcare fields
    knowsVaccinations: true,
    careSupport: '',
    emergencyTransport: true,
  });

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getLocations({ county: 'Trans-Nzoia' });
        setLocations(Array.isArray(data.data) ? data.data : []);
      } catch { setLocations([]); }
    })();
  }, []);

  const constituencies = [...new Set(locations.map(l => l.constituency).filter(Boolean))];
  const wardsForConstituency = [...new Set(
    (locations.find(l => l.constituency === form.constituency)?.wards || []).map(w => w.ward).filter(Boolean)
  )];
  const villagesForWard = [
    ...new Set(
      (locations
        .flatMap(l => l.wards || [])
        .find(w => w.ward === form.ward)
        ?.villages || []
      ).filter(Boolean)
    )
  ];

  async function fetchFacilities(ward) {
    if (!ward) return;
    try {
      const res = await api.getFacilities({ ward });
      setFacilities(Array.isArray(res.data) ? res.data : []);
    } catch { setFacilities([]); }
  }

  useEffect(() => {
    if (form.ward) { fetchFacilities(form.ward); setForm(prev => ({ ...prev, facilityId: '' })); }
  }, [form.ward]);

  function updateField(field, value) {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'constituency') { next.ward = ''; next.village = ''; }
      if (field === 'ward') { next.village = ''; }
      return next;
    });
  }

  function calcEDD(lmp) {
    if (!lmp) return '';
    const d = new Date(lmp);
    d.setDate(d.getDate() + 280);
    return d.toISOString().split('T')[0];
  }

  function normalizePhone(phone) {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('0') && digits.length === 10) return '+254' + digits.slice(1);
    if (digits.startsWith('254') && digits.length === 12) return '+' + digits;
    return phone;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const phone = normalizePhone(form.motherPhone);
    if (!phone || !form.motherFirstName || !form.motherLastName || !form.motherNationalId || !form.motherDOB || !form.lmpDate || !form.constituency || !form.ward || !form.village || !form.emergencyContactPhone) {
      setError('Please fill in all required fields');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await api.registerMother({
        phone,
        first_name: form.motherFirstName,
        last_name: form.motherLastName,
        national_id: form.motherNationalId,
        date_of_birth: form.motherDOB,
        constituency: form.constituency,
        ward: form.ward,
        village: form.village,
        lmp_date: form.lmpDate,
        gravida: parseInt(form.gravida),
        parity: parseInt(form.parity),
        facility_id: form.facilityId || undefined,
        prenatal: {
          chronicConditions: form.chronicConditions,
          allergies: form.allergies,
          currentMedications: form.currentMedications,
          height: parseFloat(form.height) || null,
          weight: parseFloat(form.weight) || null,
          previousPregnancies: parseInt(form.gravida) || 1,
          previousBirths: parseInt(form.parity) || 0,
          previousComplications: form.previousComplications,
          bloodType: form.bloodType,
          currentSymptoms: form.currentSymptoms,
        },
        postnatal: {
          deliveryPlan: form.deliveryPlan,
          preferredFacilityId: form.facilityId,
          supportPerson: form.supportPerson,
          emergencyContactPhone: form.emergencyContactPhone,
          breastfeedingPlan: form.breastfeedingPlan,
          familyPlanning: form.familyPlanning,
        },
        childcare: {
          knowsVaccinations: form.knowsVaccinations,
          careSupport: form.careSupport,
          emergencyTransport: form.emergencyTransport,
        },
      });
      setSuccess(true);
      setTimeout(() => navigate('/dashboard/patients'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Registration failed');
    } finally {
      setSaving(false);
    }
  }

  if (success) {
    return <div style={styles.success}>Mother registered successfully! Redirecting...</div>;
  }

  return (
    <div>
      <h2 style={styles.title}>Register New Patient</h2>
      {error && <div style={styles.error}>{error}</div>}
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>First Name *</label>
            <input style={styles.input} value={form.motherFirstName} onChange={e => updateField('motherFirstName', e.target.value)} required />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Last Name *</label>
            <input style={styles.input} value={form.motherLastName} onChange={e => updateField('motherLastName', e.target.value)} required />
          </div>
        </div>
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>National ID *</label>
            <input style={styles.input} value={form.motherNationalId} onChange={e => updateField('motherNationalId', e.target.value)} required />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Phone Number *</label>
            <input style={styles.input} value={form.motherPhone} onChange={e => updateField('motherPhone', e.target.value)} placeholder="0712345678" required />
          </div>
        </div>
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Date of Birth *</label>
            <input style={styles.input} type="date" value={form.motherDOB} onChange={e => updateField('motherDOB', e.target.value)} max={new Date().toISOString().split('T')[0]} required />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>LMP (Last Menstrual Period) *</label>
            <input style={styles.input} type="date" value={form.lmpDate} onChange={e => updateField('lmpDate', e.target.value)} required />
          </div>
        </div>
        {form.lmpDate && (
          <div style={styles.edd}>EDD: {calcEDD(form.lmpDate)}</div>
        )}
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Constituency *</label>
            <select style={styles.select} value={form.constituency} onChange={e => updateField('constituency', e.target.value)} required>
              <option value="">Select constituency</option>
              {constituencies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Ward *</label>
            <select style={styles.select} value={form.ward} onChange={e => updateField('ward', e.target.value)} required disabled={!form.constituency}>
              <option value="">Select ward</option>
              {wardsForConstituency.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
        </div>
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Village *</label>
            <select style={styles.select} value={form.village} onChange={e => updateField('village', e.target.value)} required disabled={!form.ward}>
              <option value="">Select village</option>
              {villagesForWard.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Health Facility</label>
            <select style={styles.select} value={form.facilityId} onChange={e => updateField('facilityId', e.target.value)} disabled={!form.ward}>
              <option value="">Auto-assign</option>
              {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
        </div>
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Gravida (pregnancies)</label>
            <input style={styles.input} type="number" min="1" value={form.gravida} onChange={e => updateField('gravida', e.target.value)} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Parity (births)</label>
            <input style={styles.input} type="number" min="0" value={form.parity} onChange={e => updateField('parity', e.target.value)} />
          </div>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Prenatal Information</h3>
          
          <div style={styles.field}>
            <label style={styles.label}>Chronic Conditions</label>
            <div style={styles.chipContainer}>
              {['diabetes', 'hypertension', 'hiv', 'asthma', 'anemia', 'heart_disease', 'thyroid', 'kidney_disease', 'none'].map(c => (
                <label key={c} style={styles.chipLabel}>
                  <input
                    type="checkbox"
                    checked={form.chronicConditions.includes(c)}
                    onChange={e => {
                      if (c === 'none') {
                        updateField('chronicConditions', e.target.checked ? ['none'] : []);
                      } else {
                        const filtered = form.chronicConditions.filter(x => x !== 'none');
                        updateField('chronicConditions', e.target.checked ? [...filtered, c] : filtered.filter(x => x !== c));
                      }
                    }}
                  />
                  <span>{c.replace(/_/g, ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Allergies</label>
            <input style={styles.input} value={form.allergies} onChange={e => updateField('allergies', e.target.value)} placeholder="e.g. Penicillin" />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Current Medications</label>
            <input style={styles.input} value={form.currentMedications} onChange={e => updateField('currentMedications', e.target.value)} placeholder="List any medications" />
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Height (cm)</label>
              <input style={styles.input} type="number" step="0.1" value={form.height} onChange={e => updateField('height', e.target.value)} placeholder="e.g. 160" />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Weight (kg)</label>
              <input style={styles.input} type="number" step="0.1" value={form.weight} onChange={e => updateField('weight', e.target.value)} placeholder="e.g. 65" />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Previous Complications</label>
            <div style={styles.chipContainer}>
              {['previous_c_section', 'postpartum_hemorrhage', 'preeclampsia', 'preterm_birth', 'miscarriage', 'stillbirth', 'none'].map(c => (
                <label key={c} style={styles.chipLabel}>
                  <input
                    type="checkbox"
                    checked={form.previousComplications.includes(c)}
                    onChange={e => {
                      if (c === 'none') {
                        updateField('previousComplications', e.target.checked ? ['none'] : []);
                      } else {
                        const filtered = form.previousComplications.filter(x => x !== 'none');
                        updateField('previousComplications', e.target.checked ? [...filtered, c] : filtered.filter(x => x !== c));
                      }
                    }}
                  />
                  <span>{c.replace(/_/g, ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Blood Type</label>
            <input style={styles.input} value={form.bloodType} onChange={e => updateField('bloodType', e.target.value)} placeholder="e.g. O+" />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Current Symptoms</label>
            <div style={styles.chipContainer}>
              {['nausea', 'fatigue', 'back_pain', 'swelling', 'heartburn', 'headache', 'none'].map(s => (
                <label key={s} style={styles.chipLabel}>
                  <input
                    type="checkbox"
                    checked={form.currentSymptoms.includes(s)}
                    onChange={e => {
                      if (s === 'none') {
                        updateField('currentSymptoms', e.target.checked ? ['none'] : []);
                      } else {
                        const filtered = form.currentSymptoms.filter(x => x !== 'none');
                        updateField('currentSymptoms', e.target.checked ? [...filtered, s] : filtered.filter(x => x !== s));
                      }
                    }}
                  />
                  <span>{s.replace(/_/g, ' ')}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Birth Plan</h3>
          
          <div style={styles.field}>
            <label style={styles.label}>Delivery Plan</label>
            <select style={styles.select} value={form.deliveryPlan} onChange={e => updateField('deliveryPlan', e.target.value)}>
              <option value="facility">Facility</option>
              <option value="home">Home</option>
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Support Person</label>
            <input style={styles.input} value={form.supportPerson} onChange={e => updateField('supportPerson', e.target.value)} placeholder="Name of support person" />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Emergency Contact Phone *</label>
            <input style={styles.input} value={form.emergencyContactPhone} onChange={e => updateField('emergencyContactPhone', e.target.value)} placeholder="+2547XXXXXXXX" required />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Breastfeeding Plan</label>
            <select style={styles.select} value={form.breastfeedingPlan} onChange={e => updateField('breastfeedingPlan', e.target.value)}>
              <option value="exclusive">Exclusive</option>
              <option value="mixed">Mixed</option>
              <option value="formula">Formula</option>
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Family Planning</label>
            <input style={styles.input} value={form.familyPlanning} onChange={e => updateField('familyPlanning', e.target.value)} placeholder="Preferred method" />
          </div>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Childcare</h3>
          
          <div style={styles.field}>
            <label style={styles.label}>Knows Vaccination Schedule</label>
            <select style={styles.select} value={form.knowsVaccinations.toString()} onChange={e => updateField('knowsVaccinations', e.target.value === 'true')}>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Care Support</label>
            <input style={styles.input} value={form.careSupport} onChange={e => updateField('careSupport', e.target.value)} placeholder="Who will help with childcare" />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Emergency Transport Available</label>
            <select style={styles.select} value={form.emergencyTransport.toString()} onChange={e => updateField('emergencyTransport', e.target.value === 'true')}>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
        </div>

        <div style={styles.actions}>
          <button type="submit" style={styles.submitBtn} disabled={saving}>{saving ? 'Registering...' : 'Register Patient'}</button>
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
  field: { flex: '1 1 200px', minWidth: 200 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6 },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' },
  select: { width: '100%', padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: 6, fontSize: 14, boxSizing: 'border-box', background: '#fff', cursor: 'pointer' },
  edd: { fontSize: 14, color: '#1B5E20', fontWeight: 600, marginBottom: 16, padding: '8px 12px', background: '#E8F5E9', borderRadius: 6, display: 'inline-block' },
  actions: { display: 'flex', gap: 12, marginTop: 8, paddingTop: 16, borderTop: '1px solid #F0F0F0' },
  submitBtn: { padding: '10px 24px', background: '#1B5E20', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  cancelBtn: { padding: '10px 24px', background: '#F0F0F0', color: '#555', border: 'none', borderRadius: 6, fontSize: 14, cursor: 'pointer' },
  section: { marginTop: 24, paddingTop: 24, borderTop: '2px solid #F0F0F0' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50', marginBottom: 16 },
  chipContainer: { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chipLabel: { display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', border: '1px solid #E0E0E0', borderRadius: 16, cursor: 'pointer', fontSize: 13, background: '#FAFAFA' },
};
