import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, Modal, FlatList, Platform,
} from 'react-native';
import { useTranslation } from '../context/LanguageContext';
import api from '../services/api';
import DateTimePicker from '@react-native-community/datetimepicker';

function PickerModal({ visible, title, options, selected, onSelect, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
          </View>
          <FlatList
            data={options}
            keyExtractor={(item, index) => `${item}-${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.optionItem, item === selected && styles.optionItemSelected]}
                onPress={() => { onSelect(item); onClose(); }}
              >
                <Text style={[styles.optionText, item === selected && styles.optionTextSelected]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

export default function RegisterPregnancyScreen({ navigation }) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [locations, setLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [showConstituencyPicker, setShowConstituencyPicker] = useState(false);
  const [showWardPicker, setShowWardPicker] = useState(false);
  const [showVillagePicker, setShowVillagePicker] = useState(false);
  const [showDOBPicker, setShowDOBPicker] = useState(false);
  const [showLMPPicker, setShowLMPPicker] = useState(false);
  const [facilities, setFacilities] = useState([]);
  const [loadingFacilities, setLoadingFacilities] = useState(false);
  const [showFacilityPicker, setShowFacilityPicker] = useState(false);

  function generateTempPassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let pwd = '';
    for (let i = 0; i < 8; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    return pwd;
  }

  const [form, setForm] = useState({
    motherPhone: '',
    motherFirstName: '',
    motherLastName: '',
    motherNationalId: '',
    motherDOB: '',
    alternatePhone: '',
    constituency: '',
    ward: '',
    village: '',
    lmpDate: '',
    gravida: '1',
    parity: '0',
    facilityId: '',
    riskFactors: [],
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

  const tempPasswordRef = useRef(generateTempPassword());

  const riskFactorOptions = [
    'age_over_35', 'age_under_18', 'previous_c_section',
    'previous_miscarriage', 'hypertension', 'diabetes', 'multiple_pregnancy',
    'hiv_positive', 'anemia', 'obesity', 'previous_complication',
  ];

  const CHRONIC_CONDITIONS = [
    'diabetes', 'hypertension', 'hiv', 'asthma', 'anemia',
    'heart_disease', 'thyroid', 'kidney_disease', 'none',
  ];

  const PREV_COMPLICATIONS = [
    'previous_c_section', 'postpartum_hemorrhage', 'preeclampsia',
    'preterm_birth', 'miscarriage', 'stillbirth', 'none',
  ];

  const SYMPTOMS = [
    'nausea', 'fatigue', 'back_pain', 'swelling', 'heartburn',
    'headache', 'none',
  ];

  const constituencies = locations.map(l => l.constituency);
  const currentConstituency = locations.find(l => l.constituency === form.constituency);
  const wards = currentConstituency ? currentConstituency.wards.map(w => w.ward) : [];
  const currentWard = currentConstituency
    ? currentConstituency.wards.find(w => w.ward === form.ward)
    : null;
  const villages = currentWard ? [...new Set(currentWard.villages)] : [];

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getLocations({ county: 'Trans-Nzoia' });
        setLocations(data);
      } catch {
        setLocations([]);
      } finally {
        setLoadingLocations(false);
      }
    })();
  }, []);

  function updateField(field, value) {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'constituency') {
        next.ward = '';
        next.village = '';
      }
      if (field === 'ward') {
        next.village = '';
      }
      return next;
    });
  }

  async function fetchFacilities() {
    if (!form.ward) return;
    setLoadingFacilities(true);
    try {
      const data = await api.getFacilities({ ward: form.ward });
      setFacilities(data);
    } catch {
      setFacilities([]);
    } finally {
      setLoadingFacilities(false);
    }
  }

  useEffect(() => {
    if (form.ward) {
      fetchFacilities();
      updateField('facilityId', '');
    }
  }, [form.ward]);

  function toggleRiskFactor(factor) {
    setForm(prev => ({
      ...prev,
      riskFactors: prev.riskFactors.includes(factor)
        ? prev.riskFactors.filter(f => f !== factor)
        : [...prev.riskFactors, factor],
    }));
  }

  function toggleArray(field, value) {
    if (value === 'none') return ['none'];
    const current = form[field] || [];
    const filtered = current.filter(v => v !== 'none');
    if (filtered.includes(value)) {
      return filtered.filter(v => v !== value);
    }
    return [...filtered, value];
  }

  function onDOBChange(_, selectedDate) {
    setShowDOBPicker(false);
    if (selectedDate) {
      const d = selectedDate.toISOString().split('T')[0];
      updateField('motherDOB', d);
    }
  }

  function onLMPChange(_, selectedDate) {
    setShowLMPPicker(false);
    if (selectedDate) {
      const d = selectedDate.toISOString().split('T')[0];
      updateField('lmpDate', d);
    }
  }

  function normalizePhone(phone) {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('0') && digits.length === 10) return '+254' + digits.slice(1);
    if (digits.startsWith('254') && digits.length === 12) return '+' + digits;
    return phone;
  }

  async function handleRegister() {
    const phone = normalizePhone(form.motherPhone);
    if (!phone || !form.motherFirstName || !form.motherLastName || !form.motherNationalId || !form.motherDOB || !form.lmpDate || !form.constituency || !form.ward || !form.village || !form.emergencyContactPhone) {
      Alert.alert(t('error'), t('phone_name_lmp_required'));
      return;
    }

    setSaving(true);
    try {
      const res = await api.registerMother({
        phone,
        password: tempPasswordRef.current,
        firstName: form.motherFirstName,
        lastName: form.motherLastName || form.motherFirstName,
        nationalId: form.motherNationalId,
        lmpDate: form.lmpDate,
        gravida: parseInt(form.gravida) || 1,
        parity: parseInt(form.parity) || 0,
        alternatePhone: form.alternatePhone,
        village: form.village,
        ward: form.ward,
        constituency: form.constituency,
        facilityId: form.facilityId || null,
        riskFactors: form.riskFactors,
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
      const pw = res.data?.tempPassword || tempPasswordRef.current;
      Alert.alert(
        t('success'),
        `Mother registered successfully!\n\nPhone: ${form.motherPhone}\nPassword: ${pw}\n\nPlease share these credentials with the mother.`
      );
      navigation.goBack();
    } catch (err) {
      Alert.alert(t('error'), err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Register Pregnancy</Text>
        <Text style={styles.headerSub}>Record new pregnancy during home visit</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Mother Information</Text>

        <Text style={styles.label}>Phone Number *</Text>
        <TextInput style={styles.input} value={form.motherPhone} onChangeText={v => updateField('motherPhone', v)} placeholder="+254712345678" placeholderTextColor="#999" keyboardType="phone-pad" />

        <Text style={styles.label}>Alternate Phone</Text>
        <TextInput style={styles.input} value={form.alternatePhone} onChangeText={v => updateField('alternatePhone', v)} placeholder="+254712345679" placeholderTextColor="#999" keyboardType="phone-pad" />

        <Text style={styles.label}>National ID *</Text>
        <TextInput style={styles.input} value={form.motherNationalId} onChangeText={v => updateField('motherNationalId', v)} placeholder="e.g. 12345678" placeholderTextColor="#999" keyboardType="number-pad" />

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>First Name *</Text>
            <TextInput style={styles.input} value={form.motherFirstName} onChangeText={v => updateField('motherFirstName', v)} placeholderTextColor="#999" />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>Last Name *</Text>
            <TextInput style={styles.input} value={form.motherLastName} onChangeText={v => updateField('motherLastName', v)} placeholderTextColor="#999" />
          </View>
        </View>

        <Text style={styles.label}>Date of Birth *</Text>
        {Platform.OS === 'web' ? (
          <DateTimePicker
            value={form.motherDOB ? new Date(form.motherDOB) : undefined}
            mode="date"
            maximumDate={new Date()}
            onChange={onDOBChange}
            style={styles.input}
          />
        ) : (
          <>
            <TouchableOpacity style={styles.input} onPress={() => setShowDOBPicker(true)}>
              <Text style={form.motherDOB ? styles.inputText : styles.placeholderText}>
                {form.motherDOB || 'Select date of birth'}
              </Text>
            </TouchableOpacity>
            {showDOBPicker && (
              <DateTimePicker
                value={form.motherDOB ? new Date(form.motherDOB) : new Date()}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={onDOBChange}
              />
            )}
          </>
        )}

        <Text style={styles.label}>Constituency *</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowConstituencyPicker(true)}
          disabled={loadingLocations}
        >
          <Text style={form.constituency ? styles.inputText : styles.placeholderText}>
            {loadingLocations ? t('loading') : form.constituency || t('select_constituency')}
          </Text>
        </TouchableOpacity>

        <Text style={styles.label}>Ward *</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => {
            if (!form.constituency) {
              Alert.alert(t('notice'), t('select_constituency'));
              return;
            }
            setShowWardPicker(true);
          }}
          disabled={!form.constituency || loadingLocations}
        >
          <Text style={form.ward ? styles.inputText : styles.placeholderText}>
            {!form.constituency ? t('select_constituency') : form.ward || t('select_ward_first')}
          </Text>
        </TouchableOpacity>

        <Text style={styles.label}>Village *</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => {
            if (!form.ward) {
              Alert.alert(t('notice'), t('select_ward_first'));
              return;
            }
            setShowVillagePicker(true);
          }}
          disabled={!form.ward || loadingLocations}
        >
          <Text style={form.village ? styles.inputText : styles.placeholderText}>
            {!form.ward ? t('select_ward_first') : form.village || t('select_village')}
          </Text>
        </TouchableOpacity>

        <Text style={styles.label}>Nearest Health Facility</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => {
            if (!form.ward) {
              Alert.alert(t('notice'), t('select_ward_first'));
              return;
            }
            setShowFacilityPicker(true);
          }}
          disabled={!form.ward || loadingFacilities}
        >
          <Text style={form.facilityId ? styles.inputText : styles.placeholderText}>
            {!form.ward ? t('select_ward_first')
              : loadingFacilities ? 'Loading facilities...'
              : form.facilityId
                ? (facilities.find(f => f.id === form.facilityId)?.name || 'Selected')
                : 'Select nearest facility'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Pregnancy Details</Text>

        <Text style={styles.label}>LMP Date (Last Menstrual Period) *</Text>
        {Platform.OS === 'web' ? (
          <DateTimePicker
            value={form.lmpDate ? new Date(form.lmpDate) : undefined}
            mode="date"
            maximumDate={new Date()}
            onChange={onLMPChange}
            style={styles.input}
          />
        ) : (
          <>
            <TouchableOpacity style={styles.input} onPress={() => setShowLMPPicker(true)}>
              <Text style={form.lmpDate ? styles.inputText : styles.placeholderText}>
                {form.lmpDate || 'Select LMP date'}
              </Text>
            </TouchableOpacity>
            {showLMPPicker && (
              <DateTimePicker
                value={form.lmpDate ? new Date(form.lmpDate) : new Date()}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={onLMPChange}
              />
            )}
          </>
        )}

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>Gravida (# pregnancies)</Text>
            <TextInput style={styles.input} value={form.gravida} onChangeText={v => updateField('gravida', v)} keyboardType="number-pad" placeholderTextColor="#999" />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>Parity (# births)</Text>
            <TextInput style={styles.input} value={form.parity} onChangeText={v => updateField('parity', v)} keyboardType="number-pad" placeholderTextColor="#999" />
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Prenatal Information</Text>

        <Text style={styles.label}>Chronic Conditions</Text>
        <View style={styles.riskGrid}>
          {CHRONIC_CONDITIONS.map(c => (
            <TouchableOpacity
              key={c}
              style={[styles.riskChip, form.chronicConditions.includes(c) && styles.riskChipSelected]}
              onPress={() => updateField('chronicConditions', toggleArray('chronicConditions', c))}
            >
              <Text style={[styles.riskChipText, form.chronicConditions.includes(c) && styles.riskChipTextSelected]}>{c.replace(/_/g, ' ')}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Allergies</Text>
        <TextInput style={styles.input} value={form.allergies} onChangeText={v => updateField('allergies', v)} placeholder="e.g. Penicillin" placeholderTextColor="#999" />

        <Text style={styles.label}>Current Medications</Text>
        <TextInput style={styles.input} value={form.currentMedications} onChangeText={v => updateField('currentMedications', v)} placeholder="List any medications" placeholderTextColor="#999" />

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>Height (cm)</Text>
            <TextInput style={styles.input} value={form.height} onChangeText={v => updateField('height', v)} keyboardType="decimal-pad" placeholder="e.g. 160" placeholderTextColor="#999" />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>Weight (kg)</Text>
            <TextInput style={styles.input} value={form.weight} onChangeText={v => updateField('weight', v)} keyboardType="decimal-pad" placeholder="e.g. 65" placeholderTextColor="#999" />
          </View>
        </View>

        <Text style={styles.label}>Previous Complications</Text>
        <View style={styles.riskGrid}>
          {PREV_COMPLICATIONS.map(c => (
            <TouchableOpacity
              key={c}
              style={[styles.riskChip, form.previousComplications.includes(c) && styles.riskChipSelected]}
              onPress={() => updateField('previousComplications', toggleArray('previousComplications', c))}
            >
              <Text style={[styles.riskChipText, form.previousComplications.includes(c) && styles.riskChipTextSelected]}>{c.replace(/_/g, ' ')}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Blood Type</Text>
        <TextInput style={styles.input} value={form.bloodType} onChangeText={v => updateField('bloodType', v)} placeholder="e.g. O+" placeholderTextColor="#999" />

        <Text style={styles.label}>Current Symptoms</Text>
        <View style={styles.riskGrid}>
          {SYMPTOMS.map(s => (
            <TouchableOpacity
              key={s}
              style={[styles.riskChip, form.currentSymptoms.includes(s) && styles.riskChipSelected]}
              onPress={() => updateField('currentSymptoms', toggleArray('currentSymptoms', s))}
            >
              <Text style={[styles.riskChipText, form.currentSymptoms.includes(s) && styles.riskChipTextSelected]}>{s.replace(/_/g, ' ')}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Birth Plan</Text>

        <Text style={styles.label}>Delivery Plan</Text>
        <View style={styles.riskGrid}>
          <TouchableOpacity
            style={[styles.riskChip, form.deliveryPlan === 'facility' && styles.riskChipSelected]}
            onPress={() => updateField('deliveryPlan', 'facility')}
          >
            <Text style={[styles.riskChipText, form.deliveryPlan === 'facility' && styles.riskChipTextSelected]}>Facility</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.riskChip, form.deliveryPlan === 'home' && styles.riskChipSelected]}
            onPress={() => updateField('deliveryPlan', 'home')}
          >
            <Text style={[styles.riskChipText, form.deliveryPlan === 'home' && styles.riskChipTextSelected]}>Home</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Support Person</Text>
        <TextInput style={styles.input} value={form.supportPerson} onChangeText={v => updateField('supportPerson', v)} placeholder="Name of support person" placeholderTextColor="#999" />

        <Text style={styles.label}>Emergency Contact Phone *</Text>
        <TextInput style={styles.input} value={form.emergencyContactPhone} onChangeText={v => updateField('emergencyContactPhone', v)} keyboardType="phone-pad" placeholder="+2547XXXXXXXX" placeholderTextColor="#999" />

        <Text style={styles.label}>Breastfeeding Plan</Text>
        <View style={styles.riskGrid}>
          <TouchableOpacity
            style={[styles.riskChip, form.breastfeedingPlan === 'exclusive' && styles.riskChipSelected]}
            onPress={() => updateField('breastfeedingPlan', 'exclusive')}
          >
            <Text style={[styles.riskChipText, form.breastfeedingPlan === 'exclusive' && styles.riskChipTextSelected]}>Exclusive</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.riskChip, form.breastfeedingPlan === 'mixed' && styles.riskChipSelected]}
            onPress={() => updateField('breastfeedingPlan', 'mixed')}
          >
            <Text style={[styles.riskChipText, form.breastfeedingPlan === 'mixed' && styles.riskChipTextSelected]}>Mixed</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.riskChip, form.breastfeedingPlan === 'formula' && styles.riskChipSelected]}
            onPress={() => updateField('breastfeedingPlan', 'formula')}
          >
            <Text style={[styles.riskChipText, form.breastfeedingPlan === 'formula' && styles.riskChipTextSelected]}>Formula</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Family Planning</Text>
        <TextInput style={styles.input} value={form.familyPlanning} onChangeText={v => updateField('familyPlanning', v)} placeholder="Preferred method" placeholderTextColor="#999" />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Childcare</Text>

        <Text style={styles.label}>Knows Vaccination Schedule</Text>
        <View style={styles.riskGrid}>
          <TouchableOpacity
            style={[styles.riskChip, form.knowsVaccinations === true && styles.riskChipSelected]}
            onPress={() => updateField('knowsVaccinations', true)}
          >
            <Text style={[styles.riskChipText, form.knowsVaccinations === true && styles.riskChipTextSelected]}>Yes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.riskChip, form.knowsVaccinations === false && styles.riskChipSelected]}
            onPress={() => updateField('knowsVaccinations', false)}
          >
            <Text style={[styles.riskChipText, form.knowsVaccinations === false && styles.riskChipTextSelected]}>No</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Care Support</Text>
        <TextInput style={styles.input} value={form.careSupport} onChangeText={v => updateField('careSupport', v)} placeholder="Who will help with childcare" placeholderTextColor="#999" />

        <Text style={styles.label}>Emergency Transport Available</Text>
        <View style={styles.riskGrid}>
          <TouchableOpacity
            style={[styles.riskChip, form.emergencyTransport === true && styles.riskChipSelected]}
            onPress={() => updateField('emergencyTransport', true)}
          >
            <Text style={[styles.riskChipText, form.emergencyTransport === true && styles.riskChipTextSelected]}>Yes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.riskChip, form.emergencyTransport === false && styles.riskChipSelected]}
            onPress={() => updateField('emergencyTransport', false)}
          >
            <Text style={[styles.riskChipText, form.emergencyTransport === false && styles.riskChipTextSelected]}>No</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={[styles.registerBtn, saving && { opacity: 0.6 }]} onPress={handleRegister} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.registerBtnText}>Register Pregnancy</Text>}
      </TouchableOpacity>

      <View style={{ height: 40 }} />

      <PickerModal
        visible={showConstituencyPicker}
        title="Select Constituency"
        options={constituencies}
        selected={form.constituency}
        onSelect={v => updateField('constituency', v)}
        onClose={() => setShowConstituencyPicker(false)}
      />

      <PickerModal
        visible={showWardPicker}
        title="Select Ward"
        options={wards}
        selected={form.ward}
        onSelect={v => updateField('ward', v)}
        onClose={() => setShowWardPicker(false)}
      />

      <PickerModal
        visible={showVillagePicker}
        title="Select Village"
        options={villages}
        selected={form.village}
        onSelect={v => updateField('village', v)}
        onClose={() => setShowVillagePicker(false)}
      />

      <PickerModal
        visible={showFacilityPicker}
        title="Select Nearest Facility"
        options={facilities.map(f => f.name)}
        selected={facilities.find(f => f.id === form.facilityId)?.name}
        onSelect={v => {
          const facility = facilities.find(f => f.name === v);
          if (facility) updateField('facilityId', facility.id);
        }}
        onClose={() => setShowFacilityPicker(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8' },
  header: { padding: 20, backgroundColor: '#2980B9' },
  backBtn: { fontSize: 16, color: '#D5E8F5', marginBottom: 8, fontWeight: '600' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 13, color: '#D5E8F5', marginTop: 2 },
  card: { backgroundColor: '#fff', margin: 12, borderRadius: 12, padding: 16, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50', marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 4, marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, padding: 10, fontSize: 15, backgroundColor: '#FAFAFA', justifyContent: 'center' },
  inputText: { fontSize: 15, color: '#333' },
  placeholderText: { fontSize: 15, color: '#999' },
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
  riskGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  riskChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: '#E0E0E0' },
  riskChipSelected: { backgroundColor: '#E74C3C', borderColor: '#E74C3C' },
  riskChipText: { fontSize: 12, color: '#666', textTransform: 'capitalize' },
  riskChipTextSelected: { color: '#fff' },
  registerBtn: { backgroundColor: '#2980B9', margin: 12, borderRadius: 12, padding: 16, alignItems: 'center' },
  registerBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 30 },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  modalTitle: { fontSize: 17, fontWeight: 'bold', color: '#2C3E50' },
  modalClose: { fontSize: 18, color: '#999', padding: 4 },
  optionItem: { paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  optionItemSelected: { backgroundColor: '#EBF5FB' },
  optionText: { fontSize: 15, color: '#333' },
  optionTextSelected: { color: '#2980B9', fontWeight: '600' },
});
