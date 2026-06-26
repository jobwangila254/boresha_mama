import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import { useTranslation } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

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

export default function RegisterMotherScreen({ navigation }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [facilities, setFacilities] = useState([]);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  function generateTempPassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let pwd = '';
    for (let i = 0; i < 8; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    return pwd;
  }

  const [form, setForm] = useState({
    phone: '', password: generateTempPassword(), firstName: '', lastName: '', nationalId: '',
    lmpDate: '', facilityId: '', gravida: '1', parity: '0',
    village: '', ward: '', emergencyContactName: '', emergencyContactPhone: '',
    alternatePhone: '',
    chronicConditions: [],
    allergies: '',
    currentMedications: '',
    height: '',
    weight: '',
    previousPregnancies: '1',
    previousBirths: '0',
    previousComplications: [],
    bloodType: '',
    currentSymptoms: [],
    deliveryPlan: 'facility',
    supportPerson: '',
    breastfeedingPlan: 'exclusive',
    familyPlanning: '',
    knowsVaccinations: true,
    careSupport: '',
    emergencyTransport: true,
  });

  useEffect(() => {
    api.getFacilities().then(setFacilities).catch(() => console.warn('Failed to load facilities'));
  }, []);

  function toggleArray(arr, value) {
    if (value === 'none') return ['none'];
    const filtered = arr.filter(v => v !== 'none');
    if (filtered.includes(value)) {
      return filtered.filter(v => v !== value);
    }
    return [...filtered, value];
  }

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function isStepValid() {
    switch (step) {
      case 0: return form.phone.trim() && form.firstName.trim() && form.lastName.trim();
      case 1: return form.village.trim() && form.ward.trim();
      case 2: return true;
      case 3: return true;
      case 4: return true;
      default: return false;
    }
  }

  function nextStep() {
    if (!isStepValid()) {
      Alert.alert(t('error'), t('fill_required_fields'));
      return;
    }
    setStep(prev => Math.min(prev + 1, 4));
  }

  function prevStep() {
    setStep(prev => Math.max(prev - 1, 0));
  }

  async function handleRegister() {
    if (!form.phone || !form.firstName || !form.lastName) {
      Alert.alert(t('error'), t('fill_required_fields'));
      return;
    }
    setSaving(true);
    try {
      await api.registerMother({
        phone: form.phone,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        nationalId: form.nationalId,
        lmpDate: form.lmpDate || null,
        facilityId: form.facilityId || null,
        gravida: parseInt(form.gravida) || 1,
        parity: parseInt(form.parity) || 0,
        village: form.village,
        ward: form.ward,
        emergencyContactName: form.emergencyContactName,
        emergencyContactPhone: form.emergencyContactPhone,
        alternatePhone: form.alternatePhone,
        onboardingData: {
          prenatal: {
            chronicConditions: form.chronicConditions,
            allergies: form.allergies,
            currentMedications: form.currentMedications,
            height: parseFloat(form.height) || null,
            weight: parseFloat(form.weight) || null,
            previousPregnancies: parseInt(form.previousPregnancies) || 1,
            previousBirths: parseInt(form.previousBirths) || 0,
            previousComplications: form.previousComplications,
            bloodType: form.bloodType,
            currentSymptoms: form.currentSymptoms,
          },
          postnatal: {
            deliveryPlan: form.deliveryPlan,
            supportPerson: form.supportPerson,
            breastfeedingPlan: form.breastfeedingPlan,
            familyPlanning: form.familyPlanning,
          },
          childcare: {
            knowsVaccinations: form.knowsVaccinations,
            careSupport: form.careSupport,
            emergencyTransport: form.emergencyTransport,
          },
        },
      });
      Alert.alert(t('success'), t('mother_registered'), [
        {
          text: t('back'),
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err) {
      Alert.alert(t('error'), err.message);
    } finally {
      setSaving(false);
    }
  }

  const steps = [
    <View key="step0">
      <Text style={styles.stepTitle}>{t('mother_personal_info')}</Text>

      <Text style={styles.label}>{t('phone_required')}</Text>
      <TextInput style={styles.input} value={form.phone} onChangeText={v => update('phone', v)} placeholder="+254712345678" keyboardType="phone-pad" placeholderTextColor="#999" />

      <Text style={styles.label}>{t('alternate_phone')}</Text>
      <TextInput style={styles.input} value={form.alternatePhone} onChangeText={v => update('alternatePhone', v)} placeholder="+254712345679" keyboardType="phone-pad" placeholderTextColor="#999" />

      <Text style={styles.label}>{t('temp_password')}</Text>
      <TextInput style={styles.input} value={form.password} onChangeText={v => update('password', v)} placeholder="changeme123" placeholderTextColor="#999" />

      <View style={styles.row}>
        <View style={styles.halfField}>
          <Text style={styles.label}>{t('first_name')} *</Text>
          <TextInput style={styles.input} value={form.firstName} onChangeText={v => update('firstName', v)} placeholder="Jane" placeholderTextColor="#999" />
        </View>
        <View style={styles.halfField}>
          <Text style={styles.label}>{t('last_name')} *</Text>
          <TextInput style={styles.input} value={form.lastName} onChangeText={v => update('lastName', v)} placeholder="Doe" placeholderTextColor="#999" />
        </View>
      </View>

      <Text style={styles.label}>{t('national_id_optional')}</Text>
      <TextInput style={styles.input} value={form.nationalId} onChangeText={v => update('nationalId', v)} placeholder="Optional" keyboardType="number-pad" placeholderTextColor="#999" />

      <TouchableOpacity style={styles.button} onPress={nextStep}>
        <Text style={styles.buttonText}>{t('next')}</Text>
      </TouchableOpacity>
    </View>,

    <View key="step1">
      <Text style={styles.stepTitle}>{t('pregnancy_info')}</Text>

      <Text style={styles.label}>{t('lmp_date')}</Text>
      <TextInput style={styles.input} value={form.lmpDate} onChangeText={v => update('lmpDate', v)} placeholder="YYYY-MM-DD (if known)" placeholderTextColor="#999" />

      <View style={styles.row}>
        <View style={styles.halfField}>
          <Text style={styles.label}>{t('gravida')}</Text>
          <TextInput style={styles.input} value={form.gravida} onChangeText={v => update('gravida', v)} keyboardType="number-pad" placeholderTextColor="#999" />
        </View>
        <View style={styles.halfField}>
          <Text style={styles.label}>{t('parity')}</Text>
          <TextInput style={styles.input} value={form.parity} onChangeText={v => update('parity', v)} keyboardType="number-pad" placeholderTextColor="#999" />
        </View>
      </View>

      <Text style={styles.label}>{t('preferred_facility')}</Text>
      <View style={styles.optionsRow}>
        {facilities.slice(0, 6).map(f => (
          <TouchableOpacity
            key={f.id}
            style={[styles.optionBtn, form.facilityId === f.id && styles.optionSelected]}
            onPress={() => update('facilityId', form.facilityId === f.id ? '' : f.id)}
          >
            <Text style={[styles.optionText, form.facilityId === f.id && styles.optionTextSelected]}>{f.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>{t('village')} *</Text>
      <TextInput style={styles.input} value={form.village} onChangeText={v => update('village', v)} placeholderTextColor="#999" />

      <Text style={styles.label}>{t('ward')} *</Text>
      <TextInput style={styles.input} value={form.ward} onChangeText={v => update('ward', v)} placeholder="e.g. Kiminini" placeholderTextColor="#999" />

      <Text style={styles.label}>{t('emergency_contact_name_label')}</Text>
      <TextInput style={styles.input} value={form.emergencyContactName} onChangeText={v => update('emergencyContactName', v)} placeholderTextColor="#999" />

      <Text style={styles.label}>{t('emergency_phone')}</Text>
      <TextInput style={styles.input} value={form.emergencyContactPhone} onChangeText={v => update('emergencyContactPhone', v)} keyboardType="phone-pad" placeholderTextColor="#999" />

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={prevStep}>
          <Text style={styles.secondaryBtnText}>{t('back')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.flex1]} onPress={nextStep}>
          <Text style={styles.buttonText}>{t('next')}</Text>
        </TouchableOpacity>
      </View>
    </View>,

    <View key="step2">
      <Text style={styles.stepTitle}>{t('diary_prenatal')}</Text>
      <Text style={styles.stepDesc}>{t('diary_prenatal_desc')}</Text>

      <Text style={styles.label}>{t('chronic_conditions')}</Text>
      <View style={styles.chipRow}>
        {CHRONIC_CONDITIONS.map(c => (
          <TouchableOpacity
            key={c}
            style={[styles.chip, form.chronicConditions.includes(c) && styles.chipActive]}
            onPress={() => update('chronicConditions', toggleArray(form.chronicConditions, c))}
          >
            <Text style={[styles.chipText, form.chronicConditions.includes(c) && styles.chipTextActive]}>
              {t('cond_' + c)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>{t('allergies')}</Text>
      <TextInput style={styles.input} value={form.allergies} onChangeText={v => update('allergies', v)} placeholder={t('allergies_placeholder')} placeholderTextColor="#999" />

      <Text style={styles.label}>{t('current_medications')}</Text>
      <TextInput style={styles.input} value={form.currentMedications} onChangeText={v => update('currentMedications', v)} placeholder={t('medications_placeholder')} placeholderTextColor="#999" />

      <View style={styles.row}>
        <View style={styles.halfField}>
          <Text style={styles.label}>{t('height_cm')}</Text>
          <TextInput style={styles.input} value={form.height} onChangeText={v => update('height', v)} keyboardType="decimal-pad" placeholder="e.g. 160" placeholderTextColor="#999" />
        </View>
        <View style={styles.halfField}>
          <Text style={styles.label}>{t('weight_kg')}</Text>
          <TextInput style={styles.input} value={form.weight} onChangeText={v => update('weight', v)} keyboardType="decimal-pad" placeholder="e.g. 65" placeholderTextColor="#999" />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.halfField}>
          <Text style={styles.label}>{t('previous_pregnancies')}</Text>
          <TextInput style={styles.input} value={form.previousPregnancies} onChangeText={v => update('previousPregnancies', v)} keyboardType="number-pad" placeholderTextColor="#999" />
        </View>
        <View style={styles.halfField}>
          <Text style={styles.label}>{t('previous_births')}</Text>
          <TextInput style={styles.input} value={form.previousBirths} onChangeText={v => update('previousBirths', v)} keyboardType="number-pad" placeholderTextColor="#999" />
        </View>
      </View>

      <Text style={styles.label}>{t('prev_complications')}</Text>
      <View style={styles.chipRow}>
        {PREV_COMPLICATIONS.map(c => (
          <TouchableOpacity
            key={c}
            style={[styles.chip, form.previousComplications.includes(c) && styles.chipActive]}
            onPress={() => update('previousComplications', toggleArray(form.previousComplications, c))}
          >
            <Text style={[styles.chipText, form.previousComplications.includes(c) && styles.chipTextActive]}>
              {t('comp_' + c)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>{t('blood_type')}</Text>
      <TextInput style={styles.input} value={form.bloodType} onChangeText={v => update('bloodType', v)} placeholder="e.g. O+" placeholderTextColor="#999" />

      <Text style={styles.label}>{t('current_symptoms')}</Text>
      <View style={styles.chipRow}>
        {SYMPTOMS.map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.chip, form.currentSymptoms.includes(s) && styles.chipActive]}
            onPress={() => update('currentSymptoms', toggleArray(form.currentSymptoms, s))}
          >
            <Text style={[styles.chipText, form.currentSymptoms.includes(s) && styles.chipTextActive]}>
              {t('sym_' + s)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={prevStep}>
          <Text style={styles.secondaryBtnText}>{t('back')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.flex1]} onPress={nextStep}>
          <Text style={styles.buttonText}>{t('next')}</Text>
        </TouchableOpacity>
      </View>
    </View>,

    <View key="step3">
      <Text style={styles.stepTitle}>{t('diary_postnatal')}</Text>
      <Text style={styles.stepDesc}>{t('diary_postnatal_desc')}</Text>

      <Text style={styles.label}>{t('delivery_plan')}</Text>
      <View style={styles.optionsRow}>
        <TouchableOpacity
          style={[styles.optionBtn, form.deliveryPlan === 'facility' && styles.optionSelected]}
          onPress={() => update('deliveryPlan', 'facility')}
        >
          <Text style={[styles.optionText, form.deliveryPlan === 'facility' && styles.optionTextSelected]}>
            {t('deliver_facility')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.optionBtn, form.deliveryPlan === 'home' && styles.optionSelected]}
          onPress={() => update('deliveryPlan', 'home')}
        >
          <Text style={[styles.optionText, form.deliveryPlan === 'home' && styles.optionTextSelected]}>
            {t('deliver_home')}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>{t('support_person')}</Text>
      <TextInput style={styles.input} value={form.supportPerson} onChangeText={v => update('supportPerson', v)} placeholder={t('support_person_placeholder')} placeholderTextColor="#999" />

      <Text style={styles.label}>{t('breastfeeding_plan')}</Text>
      <View style={styles.optionsRow}>
        <TouchableOpacity
          style={[styles.optionBtn, form.breastfeedingPlan === 'exclusive' && styles.optionSelected]}
          onPress={() => update('breastfeedingPlan', 'exclusive')}
        >
          <Text style={[styles.optionText, form.breastfeedingPlan === 'exclusive' && styles.optionTextSelected]}>
            {t('bf_exclusive')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.optionBtn, form.breastfeedingPlan === 'mixed' && styles.optionSelected]}
          onPress={() => update('breastfeedingPlan', 'mixed')}
        >
          <Text style={[styles.optionText, form.breastfeedingPlan === 'mixed' && styles.optionTextSelected]}>
            {t('bf_mixed')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.optionBtn, form.breastfeedingPlan === 'formula' && styles.optionSelected]}
          onPress={() => update('breastfeedingPlan', 'formula')}
        >
          <Text style={[styles.optionText, form.breastfeedingPlan === 'formula' && styles.optionTextSelected]}>
            {t('bf_formula')}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>{t('family_planning')}</Text>
      <TextInput style={styles.input} value={form.familyPlanning} onChangeText={v => update('familyPlanning', v)} placeholder={t('family_planning_placeholder')} placeholderTextColor="#999" />

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={prevStep}>
          <Text style={styles.secondaryBtnText}>{t('back')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.flex1]} onPress={nextStep}>
          <Text style={styles.buttonText}>{t('next')}</Text>
        </TouchableOpacity>
      </View>
    </View>,

    <View key="step4">
      <Text style={styles.stepTitle}>{t('diary_childcare')}</Text>
      <Text style={styles.stepDesc}>{t('diary_childcare_desc')}</Text>

      <Text style={styles.label}>{t('knows_vaccinations')}</Text>
      <View style={styles.optionsRow}>
        <TouchableOpacity
          style={[styles.optionBtn, form.knowsVaccinations === true && styles.optionSelected]}
          onPress={() => update('knowsVaccinations', true)}
        >
          <Text style={[styles.optionText, form.knowsVaccinations === true && styles.optionTextSelected]}>
            {t('yes')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.optionBtn, form.knowsVaccinations === false && styles.optionSelected]}
          onPress={() => update('knowsVaccinations', false)}
        >
          <Text style={[styles.optionText, form.knowsVaccinations === false && styles.optionTextSelected]}>
            {t('no')}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>{t('care_support')}</Text>
      <TextInput style={styles.input} value={form.careSupport} onChangeText={v => update('careSupport', v)} placeholder={t('care_support_placeholder')} placeholderTextColor="#999" />

      <Text style={styles.label}>{t('emergency_transport')}</Text>
      <View style={styles.optionsRow}>
        <TouchableOpacity
          style={[styles.optionBtn, form.emergencyTransport === true && styles.optionSelected]}
          onPress={() => update('emergencyTransport', true)}
        >
          <Text style={[styles.optionText, form.emergencyTransport === true && styles.optionTextSelected]}>
            {t('yes')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.optionBtn, form.emergencyTransport === false && styles.optionSelected]}
          onPress={() => update('emergencyTransport', false)}
        >
          <Text style={[styles.optionText, form.emergencyTransport === false && styles.optionTextSelected]}>
            {t('no')}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={prevStep}>
          <Text style={styles.secondaryBtnText}>{t('back')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.flex1, saving && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t('register_mother_btn')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>,
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>{t('back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('register_mother')}</Text>
        <Text style={styles.headerSub}>{t('reg_mother_subtitle')}</Text>
      </View>

      <View style={styles.stepIndicator}>
        {[0, 1, 2, 3, 4].map(i => (
          <View key={i} style={styles.stepSegment}>
            <View style={[styles.stepDot, i <= step && styles.stepDotActive]}>
              <Text style={[styles.stepDotText, i <= step && styles.stepDotTextActive]}>{i + 1}</Text>
            </View>
            {i < 4 && <View style={[styles.stepLine, i < step && styles.stepLineActive]} />}
          </View>
        ))}
      </View>
      <View style={styles.stepLabelsRow}>
        <Text style={styles.stepLabel}>{t('mother_personal_info')}</Text>
        <Text style={styles.stepLabel}>{t('pregnancy_info')}</Text>
        <Text style={styles.stepLabel}>{t('diary_prenatal_short')}</Text>
        <Text style={styles.stepLabel}>{t('diary_postnatal_short')}</Text>
        <Text style={styles.stepLabel}>{t('diary_childcare_short')}</Text>
      </View>

      <View style={styles.card}>
        {steps[step]}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5F5' },
  scrollContent: { flexGrow: 1, padding: 16 },
  header: { paddingVertical: 12 },
  backBtn: { fontSize: 16, color: '#C0392B', marginBottom: 8 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#2C3E50' },
  headerSub: { fontSize: 13, color: '#7F8C8D', marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginTop: 8, elevation: 3, boxShadow: '0 2px 6px rgba(0,0,0,0.1)' },
  stepIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 12 },
  stepSegment: { flexDirection: 'row', alignItems: 'center' },
  stepDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center' },
  stepDotActive: { backgroundColor: '#C0392B' },
  stepDotText: { fontSize: 14, fontWeight: '600', color: '#999' },
  stepDotTextActive: { color: '#fff' },
  stepLine: { width: 28, height: 3, backgroundColor: '#F0F0F0', marginHorizontal: 4 },
  stepLineActive: { backgroundColor: '#C0392B' },
  stepLabelsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 4, marginBottom: 8 },
  stepLabel: { fontSize: 10, color: '#7F8C8D', fontWeight: '500', textAlign: 'center', flex: 1 },
  stepTitle: { fontSize: 18, fontWeight: 'bold', color: '#C0392B', marginBottom: 6 },
  stepDesc: { fontSize: 13, color: '#666', marginBottom: 16, lineHeight: 18 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6, marginTop: 14 },
  input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, padding: 12, fontSize: 15, backgroundColor: '#FAFAFA' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  halfField: { width: '48%' },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  optionBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: '#E0E0E0' },
  optionSelected: { backgroundColor: '#C0392B', borderColor: '#C0392B' },
  optionText: { fontSize: 13, color: '#666' },
  optionTextSelected: { color: '#fff' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: '#E0E0E0', backgroundColor: '#FAFAFA' },
  chipActive: { backgroundColor: '#C0392B', borderColor: '#C0392B' },
  chipText: { fontSize: 12, color: '#666' },
  chipTextActive: { color: '#fff' },
  button: { backgroundColor: '#C0392B', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 24 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  secondaryBtn: { flex: 1, padding: 16, alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: '#E0E0E0' },
  secondaryBtnText: { color: '#666', fontSize: 16, fontWeight: '600' },
  flex1: { flex: 1 },
});
