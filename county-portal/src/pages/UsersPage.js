import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useTranslation } from '../context/LanguageContext';

const TAB_CHVS = 'chvs';
const TAB_FACILITIES = 'facilities';
const TAB_MOTHERS = 'mothers';

export default function UsersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const TAB_OPTIONS = [
    { key: TAB_CHVS, label: t('chvs') },
    { key: TAB_FACILITIES, label: t('facilities') },
    { key: TAB_MOTHERS, label: t('mothers') },
  ];
  const [tab, setTab] = useState(TAB_CHVS);
  const [users, setUsers] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [pregnancies, setPregnancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    phone: '', password: '', firstName: '', lastName: '', nationalId: '',
    areaOfCoverage: '', dateOfBirth: '', gender: '', educationLevel: '',
    chvRegistrationNumber: '', trainingDate: '', village: '', subLocation: '',
    emergencyContactName: '', emergencyContactPhone: '', yearsOfExperience: '',
  });
  const [wards, setWards] = useState([]);
  const [subLocations, setSubLocations] = useState([]);
  const [villages, setVillages] = useState([]);
  const [facilityOptions, setFacilityOptions] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [chvList, setChvList] = useState([]);
  const [reassignTarget, setReassignTarget] = useState(null);
  const [selectedChvId, setSelectedChvId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, [tab]);

  useEffect(() => {
    if (tab === TAB_MOTHERS) {
      api.getUsers('chv').then(res => setChvList(res.data)).catch(() => {});
    }
  }, [tab]);

  async function loadData() {
    setLoading(true);
    try {
      if (tab === TAB_MOTHERS) {
        const res = await api.getPregnancies();
        setPregnancies(res.data);
      } else if (tab === TAB_FACILITIES) {
        const res = await api.getFacilities();
        setFacilities(res.data);
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

  async function handleAssignChv(e) {
    e.preventDefault();
    if (!selectedChvId || !reassignTarget) return;
    try {
      await api.assignChv(reassignTarget.id, selectedChvId);
      setReassignTarget(null);
      setSelectedChvId('');
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reassign CHV');
    }
  }

  function openAddModal() {
    setForm({
      phone: '', password: '', firstName: '', lastName: '', nationalId: '',
      areaOfCoverage: '', dateOfBirth: '', gender: '', educationLevel: '',
      chvRegistrationNumber: '', trainingDate: '', village: '', subLocation: '',
      emergencyContactName: '', emergencyContactPhone: '', yearsOfExperience: '',
    });
    setShowModal(true);
    api.getLocations({ county: 'Trans-Nzoia' }).then(res => {
      const wardSet = new Set();
      res.data.forEach(l => l.wards?.forEach(w => wardSet.add(w.ward)));
      setWards([...wardSet].sort());
    }).catch(() => {});
    api.getLocations({ county: 'Trans-Nzoia', mode: 'sub_locations' }).then(res => {
      setSubLocations(res.data);
    }).catch(() => {});
    setVillages([]);
    api.getFacilities().then(res => setFacilityOptions(res.data)).catch(() => {});
    api.getUsers('chv').then(res => {
      const existing = res.data
        .map(u => u.chvProfile?.chv_registration_number)
        .filter(Boolean)
        .map(n => parseInt(n.replace('CHV-', ''), 10))
        .filter(n => !isNaN(n));
      const max = existing.length > 0 ? Math.max(...existing) : 0;
      const next = `CHV-${String(max + 1).padStart(3, '0')}`;
      setForm(prev => ({ ...prev, chvRegistrationNumber: next }));
    }).catch(() => {});
  }

  function sanitizePhone(phone) {
    let cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0') && cleaned.length === 10) {
      cleaned = '254' + cleaned.slice(1);
    }
    if (!cleaned.startsWith('254')) {
      cleaned = '254' + cleaned;
    }
    return '+' + cleaned;
  }

  async function handleAddUser(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        phone: sanitizePhone(form.phone),
        password: form.chvRegistrationNumber,
        firstName: form.firstName,
        lastName: form.lastName,
        nationalId: form.nationalId,
        role: 'chv',
        areaOfCoverage: form.areaOfCoverage || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender || undefined,
        educationLevel: form.educationLevel || undefined,
        chvRegistrationNumber: form.chvRegistrationNumber || undefined,
        trainingDate: form.trainingDate || undefined,
        village: form.village || undefined,
        subLocation: form.subLocation || undefined,
        emergencyContactName: form.emergencyContactName || undefined,
        emergencyContactPhone: sanitizePhone(form.emergencyContactPhone) || undefined,
        yearsOfExperience: parseInt(form.yearsOfExperience) || 0,
      };
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
    const p = user.chvProfile || {};
    return (
      <tr key={user.id} onClick={() => setSelectedUser(user)} style={styles.trClickable}>
        <td style={styles.td}><strong>{user.first_name} {user.last_name}</strong></td>
        <td style={styles.td}>{user.phone}</td>
        <td style={styles.td}>{p.chv_registration_number || '—'}</td>
        <td style={styles.td}>{p.area_of_coverage || '—'}</td>
        <td style={styles.td}>{p.education_level || '—'}</td>
        <td style={styles.td}>
          <span style={{ ...styles.statusBadge, background: user.is_active ? '#E8F8F5' : '#F0F0F0', color: user.is_active ? '#27AE60' : '#7F8C8D' }}>
            {user.is_active ? t('active') : t('inactive')}
          </span>
        </td>
        <td style={styles.td}>
          <button style={styles.toggleBtn} onClick={(e) => { e.stopPropagation(); handleToggleStatus(user.id); }}>
            {user.is_active ? t('deactivate') : t('activate')}
          </button>
        </td>
      </tr>
    );
  }

  function renderFacilityRow(facility) {
    return (
      <tr key={facility.id} onClick={() => navigate('/dashboard/facilities')} style={styles.trClickable}>
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
    const chvName = p.chv_first_name ? `${p.chv_first_name} ${p.chv_last_name}` : null;
    return (
      <tr key={p.id}>
        <td style={styles.td}><strong>{p.mother_name}</strong></td>
        <td style={styles.td}>{p.mother_phone}</td>
        <td style={styles.td}>{p.ward || '—'}</td>
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
        <td style={styles.td}>
          <span style={{ color: chvName ? '#2C3E50' : '#999' }}>
            {chvName || 'Unassigned'}
          </span>
        </td>
        <td style={styles.td}>{p.registered_by_name || '—'}</td>
        <td style={styles.td}>{p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}</td>
        <td style={styles.td}>
          <button style={styles.toggleBtn} onClick={() => { setReassignTarget(p); setSelectedChvId(''); }}>
            {t('reassign_chv')}
          </button>
        </td>
      </tr>
    );
  }

  const filteredPregnancies = searchQuery
    ? pregnancies.filter(p => {
        const q = searchQuery.toLowerCase();
        const chvName = p.chv_first_name ? `${p.chv_first_name} ${p.chv_last_name}`.toLowerCase() : '';
        return (p.mother_name && p.mother_name.toLowerCase().includes(q))
          || (p.mother_phone && p.mother_phone.includes(q))
          || (p.ward && p.ward.toLowerCase().includes(q))
          || (p.facility_name && p.facility_name.toLowerCase().includes(q))
          || (p.registered_by_name && p.registered_by_name.toLowerCase().includes(q))
          || chvName.includes(q);
      })
    : pregnancies;

  const list = tab === TAB_MOTHERS ? filteredPregnancies : tab === TAB_FACILITIES ? facilities : users;
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
        ) : tab === TAB_FACILITIES ? (
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
              {facilities.map(renderFacilityRow)}
            </tbody>
          </table>
        ) : tab === TAB_MOTHERS ? (
          <>
            <div style={styles.searchBar}>
              <input style={styles.searchInput} placeholder="Search by name, phone, ward, facility, CHV, registrant..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              {filteredPregnancies.length < pregnancies.length && (
                <span style={styles.searchCount}>{filteredPregnancies.length} of {pregnancies.length}</span>
              )}
            </div>
            <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>{t('name')}</th>
                <th style={styles.th}>{t('phone')}</th>
                <th style={styles.th}>{t('ward')}</th>
                <th style={styles.th}>{t('facility')}</th>
                <th style={styles.th}>{t('status')}</th>
                <th style={styles.th}>{t('risk_level')}</th>
                <th style={styles.th}>CHV</th>
                <th style={styles.th}>Registered by</th>
                <th style={styles.th}>{t('date')}</th>
                <th style={styles.th}>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {pregnancies.map(renderMotherRow)}
            </tbody>
          </table>
          </>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>{t('name')}</th>
                <th style={styles.th}>{t('phone')}</th>
                <th style={styles.th}>ID No.</th>
                <th style={styles.th}>{t('area_of_coverage')}</th>
                <th style={styles.th}>{t('education')}</th>
                <th style={styles.th}>{t('status')}</th>
                <th style={styles.th}>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map(renderCHVRow)}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div style={styles.overlay} onClick={() => setShowModal(false)}>
          <div style={{ ...styles.modal, width: 640 }} onClick={e => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>{t('add_new_chv')}</h3>
            <form onSubmit={handleAddUser}>
              <p style={{ fontSize: 13, color: '#7F8C8D', marginBottom: 16 }}>All fields marked * are legally required for CHV registration in Kenya.</p>
              <div style={styles.sectionTitle}>Personal Information</div>
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
                  <label style={styles.label}>{t('national_id')} *</label>
                  <input style={styles.input} value={form.nationalId} onChange={e => setForm({ ...form, nationalId: e.target.value })} placeholder="Kenyan National ID" required />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>{t('phone')} *</label>
                  <input style={styles.input} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+2547..." required />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>{t('password')} *</label>
                  <input style={styles.input} type="text" value={form.chvRegistrationNumber} disabled />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>{t('date_of_birth')} *</label>
                  <input style={styles.input} type="date" value={form.dateOfBirth} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })} required />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>{t('gender')} *</label>
                  <select style={styles.input} value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} required>
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>{t('education_level')} *</label>
                  <select style={styles.input} value={form.educationLevel} onChange={e => setForm({ ...form, educationLevel: e.target.value })} required>
                    <option value="">Select Level</option>
                    <option value="primary">Primary</option>
                    <option value="secondary">Secondary</option>
                    <option value="certificate">Certificate</option>
                    <option value="diploma">Diploma</option>
                    <option value="degree">Degree</option>
                  </select>
                </div>
              </div>

              <div style={{ ...styles.sectionTitle, marginTop: 20 }}>CHV Registration & Training</div>
              <div style={styles.formGrid}>
                <div style={styles.field}>
                  <label style={styles.label}>{t('chv_registration_number')} *</label>
                  <input style={styles.input} value={form.chvRegistrationNumber} onChange={e => setForm({ ...form, chvRegistrationNumber: e.target.value })} placeholder="e.g. CHV-001" disabled required />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>{t('training_date')} *</label>
                  <input style={styles.input} type="date" value={form.trainingDate} onChange={e => setForm({ ...form, trainingDate: e.target.value })} required />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>{t('area_of_coverage')} *</label>
                  <select style={styles.input} value={form.areaOfCoverage} onChange={e => {
                    setForm({ ...form, areaOfCoverage: e.target.value, subLocation: '', village: '' });
                    setVillages([]);
                  }} required>
                    <option value="">{t('select_ward')}</option>
                    {wards.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>{t('years_of_experience')}</label>
                  <input style={styles.input} type="number" min="0" value={form.yearsOfExperience} onChange={e => setForm({ ...form, yearsOfExperience: e.target.value })} placeholder="0" />
                </div>
              </div>

              <div style={{ ...styles.sectionTitle, marginTop: 20 }}>Residential Address</div>
              <div style={styles.formGrid}>
                <div style={styles.field}>
                  <label style={styles.label}>{t('sub_location')} *</label>
                  <select style={styles.input} value={form.subLocation} onChange={e => {
                    const val = e.target.value;
                    setForm({ ...form, subLocation: val, village: '' });
                    if (val) {
                      api.getLocations({ county: 'Trans-Nzoia', mode: 'villages', sub_location: val, ward: form.areaOfCoverage || undefined }).then(res => {
                        const seen = new Set();
                        const unique = res.data.filter(v => { const dup = seen.has(v.village); seen.add(v.village); return !dup; });
                        setVillages(unique);
                      }).catch(() => setVillages([]));
                    } else {
                      setVillages([]);
                    }
                  }}>
                    <option value="">Select sub-location</option>
                    {subLocations.filter(s => !form.areaOfCoverage || s.ward === form.areaOfCoverage).map(s => <option key={s.sub_location} value={s.sub_location}>{s.sub_location}</option>)}
                  </select>
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>{t('village')} *</label>
                  <select style={styles.input} value={form.village} onChange={e => setForm({ ...form, village: e.target.value })} disabled={!form.subLocation}>
                    <option value="">Select village</option>
                    {villages.map(v => <option key={v.village} value={v.village}>{v.village}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ ...styles.sectionTitle, marginTop: 20 }}>Emergency Contact</div>
              <div style={styles.formGrid}>
                <div style={styles.field}>
                  <label style={styles.label}>{t('emergency_contact_name')}</label>
                  <input style={styles.input} value={form.emergencyContactName} onChange={e => setForm({ ...form, emergencyContactName: e.target.value })} placeholder="Full name" />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>{t('emergency_contact_phone')}</label>
                  <input style={styles.input} value={form.emergencyContactPhone} onChange={e => setForm({ ...form, emergencyContactPhone: e.target.value })} placeholder="+2547..." />
                </div>
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

      {selectedUser && (
        <div style={styles.overlay} onClick={() => setSelectedUser(null)}>
          <div style={{ ...styles.modal, width: 640 }} onClick={e => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>{selectedUser.first_name} {selectedUser.last_name}</h3>
            <div style={styles.detailBody}>
              <div style={styles.detailSection}>
                <div style={styles.sectionTitle}>Personal Information</div>
                <div style={styles.detailGrid}>
                  <DetailField label="National ID" value={selectedUser.national_id} />
                  <DetailField label={t('phone')} value={selectedUser.phone} />
                  <DetailField label={t('email')} value={selectedUser.email} />
                  <DetailField label={t('date_of_birth')} value={selectedUser.chvProfile?.date_of_birth} />
                  <DetailField label={t('gender')} value={selectedUser.chvProfile?.gender} />
                  <DetailField label={t('education_level')} value={selectedUser.chvProfile?.education_level} />
                  <DetailField label={t('status')} value={selectedUser.is_active ? 'Active' : 'Inactive'} badge />
                  <DetailField label={t('created')} value={selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : null} />
                </div>
              </div>

              <div style={styles.detailSection}>
                <div style={styles.sectionTitle}>CHV Registration</div>
                <div style={styles.detailGrid}>
                  <DetailField label="Reg Number" value={selectedUser.chvProfile?.chv_registration_number} />
                  <DetailField label="Training Date" value={selectedUser.chvProfile?.training_date} />
                  <DetailField label={t('area_of_coverage')} value={selectedUser.chvProfile?.area_of_coverage} />
                  <DetailField label={t('years_of_experience')} value={selectedUser.chvProfile?.years_of_experience?.toString()} />
                  <DetailField label={t('last_login')} value={selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleString() : null} />
                </div>
              </div>

              <div style={styles.detailSection}>
                <div style={styles.sectionTitle}>Residential Address</div>
                <div style={styles.detailGrid}>
                  <DetailField label={t('village')} value={selectedUser.chvProfile?.village} />
                  <DetailField label={t('sub_location')} value={selectedUser.chvProfile?.sub_location} />
                </div>
              </div>

              <div style={styles.detailSection}>
                <div style={styles.sectionTitle}>Emergency Contact</div>
                <div style={styles.detailGrid}>
                  <DetailField label="Name" value={selectedUser.chvProfile?.emergency_contact_name} />
                  <DetailField label="Phone" value={selectedUser.chvProfile?.emergency_contact_phone} />
                </div>
              </div>
            </div>
            <div style={styles.modalActions}>
              <button type="button" style={styles.cancelBtn} onClick={() => setSelectedUser(null)}>{t('close')}</button>
            </div>
          </div>
        </div>
      )}

      {reassignTarget && (
        <div style={styles.overlay} onClick={() => setReassignTarget(null)}>
          <div style={{ ...styles.modal, width: 420 }} onClick={e => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Assign CHV to {reassignTarget.mother_name}</h3>
            <form onSubmit={handleAssignChv}>
              <div style={styles.field}>
                <label style={styles.label}>Select CHV</label>
                <select style={styles.input} value={selectedChvId} onChange={e => setSelectedChvId(e.target.value)} required>
                  <option value="">Choose a CHV...</option>
                  {chvList.filter(u => u.is_active).map(chv => (
                    <option key={chv.id} value={chv.id}>
                      {chv.first_name} {chv.last_name} — {chv.chvProfile?.area_of_coverage || chv.phone}
                    </option>
                  ))}
                </select>
              </div>
              <div style={styles.modalActions}>
                <button type="button" style={styles.cancelBtn} onClick={() => setReassignTarget(null)}>Cancel</button>
                <button type="submit" style={styles.saveBtn}>Assign</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailField({ label, value, badge }) {
  return (
    <div style={detailFieldStyles.container}>
      <span style={detailFieldStyles.label}>{label}</span>
      {badge ? (
        <span style={{ ...styles.statusBadge, background: value === 'Active' ? '#E8F8F5' : '#F0F0F0', color: value === 'Active' ? '#27AE60' : '#7F8C8D', display: 'inline-block', margin: 0 }}>
          {value || '—'}
        </span>
      ) : (
        <span style={detailFieldStyles.value}>{value || '—'}</span>
      )}
    </div>
  );
}

const detailFieldStyles = {
  container: { display: 'flex', flexDirection: 'column', gap: 2 },
  label: { fontSize: 11, color: '#7F8C8D', fontWeight: 600, textTransform: 'uppercase' },
  value: { fontSize: 14, color: '#2C3E50' },
};

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1A5276', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#7F8C8D', margin: 0 },
  tabs: { display: 'flex', gap: 8, marginBottom: 20 },
  tab: { padding: '8px 24px', border: '1px solid #E0E0E0', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: '#666' },
  tabActive: { background: '#1A5276', color: '#fff', border: '1px solid #1A5276' },
  card: { background: '#fff', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' },
  searchBar: { display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid #F0F0F0' },
  searchInput: { flex: 1, padding: '8px 12px', border: '1px solid #E0E0E0', borderRadius: 6, fontSize: 13, outline: 'none' },
  searchCount: { fontSize: 12, color: '#999', whiteSpace: 'nowrap' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '14px 16px', borderBottom: '2px solid #F0F0F0', fontSize: 13, color: '#7F8C8D', fontWeight: 600, background: '#FAFAFA' },
  td: { padding: '14px 16px', borderBottom: '1px solid #F0F0F0', fontSize: 14, color: '#2C3E50' },
  trClickable: { cursor: 'pointer' },
  statusBadge: { padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 500, display: 'inline-block' },
  riskBadge: { padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 500, display: 'inline-block', textTransform: 'capitalize' },
  toggleBtn: { background: 'none', border: '1px solid #E0E0E0', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12, color: '#555' },
  addBtn: { background: '#1A5276', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500, marginTop: 4 },
  addBtnInline: { background: '#1A5276', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500 },
  loading: { padding: 40, textAlign: 'center', color: '#7F8C8D' },
  empty: { padding: 40, textAlign: 'center', color: '#999' },
  emptyText: { marginBottom: 16, fontSize: 15 },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#fff', borderRadius: 12, padding: 32, maxWidth: '95%', maxHeight: '90vh', overflow: 'auto' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A5276', margin: '0 0 16px 0' },
  sectionTitle: { fontSize: 14, fontWeight: 600, color: '#7F8C8D', textTransform: 'uppercase', borderBottom: '1px solid #F0F0F0', paddingBottom: 8, marginBottom: 12 },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
  field: { marginBottom: 4 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 4 },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 },
  cancelBtn: { background: '#fff', color: '#666', border: '1px solid #E0E0E0', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500 },
  saveBtn: { background: '#1A5276', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500 },
  detailBody: { display: 'flex', flexDirection: 'column', gap: 20 },
  detailSection: {},
  detailGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
};
