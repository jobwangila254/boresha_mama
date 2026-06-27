import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
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

export default function PregnancyDiaryScreen({ navigation }) {
  const { t } = useTranslation();
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [data, setData] = useState({
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
    emergencyContactPhone: '',
    breastfeedingPlan: 'exclusive',
    familyPlanning: '',
    knowsVaccinations: true,
    careSupport: '',
    emergencyTransport: true,
    preferredFacilityId: '',
  });

  useEffect(() => {
    if (user?.onboardingData && Object.keys(user.onboardingData).length > 0) {
      const prenatal = user.onboardingData.prenatal || {};
      const postnatal = user.onboardingData.postnatal || {};
      const childcare = user.onboardingData.childcare || {};
      setData(prev => ({
        ...prev,
        chronicConditions: prenatal.chronicConditions || prev.chronicConditions,
        allergies: prenatal.allergies || prev.allergies,
        currentMedications: prenatal.currentMedications || prev.currentMedications,
        height: prenatal.height ? String(prenatal.height) : prev.height,
        weight: prenatal.weight ? String(prenatal.weight) : prev.weight,
        previousPregnancies: String(prenatal.previousPregnancies || prev.previousPregnancies),
        previousBirths: String(prenatal.previousBirths || prev.previousBirths),
        previousComplications: prenatal.previousComplications || prev.previousComplications,
        bloodType: prenatal.bloodType || prev.bloodType,
        currentSymptoms: prenatal.currentSymptoms || prev.currentSymptoms,
        deliveryPlan: postnatal.deliveryPlan || prev.deliveryPlan,
        supportPerson: postnatal.supportPerson || prev.supportPerson,
        emergencyContactPhone: postnatal.emergencyContactPhone || user.emergencyContactPhone || prev.emergencyContactPhone,
        breastfeedingPlan: postnatal.breastfeedingPlan || prev.breastfeedingPlan,
        familyPlanning: postnatal.familyPlanning || prev.familyPlanning,
        knowsVaccinations: childcare.knowsVaccinations !== false,
        careSupport: childcare.careSupport || prev.careSupport,
        emergencyTransport: childcare.emergencyTransport !== false,
        preferredFacilityId: '',
      }));
    }
  }, [user?.onboardingData]);

  function toggleArray(arr, value) {
    if (value === 'none') return ['none'];
    const filtered = arr.filter(v => v !== 'none');
    if (filtered.includes(value)) {
      return filtered.filter(v => v !== value);
    }
    return [...filtered, value];
  }

  function update(field, value) {
    setData(prev => ({ ...prev, [field]: value }));
  }

  function isStepValid() {
    switch (step) {
      case 0: return true;
      case 1: return true;
      case 2: return data.emergencyContactPhone.trim();
      case 3: return true;
      default: return false;
    }
  }

  function nextStep() {
    if (!isStepValid()) {
      Alert.alert(t('error'), t('fill_required_fields'));
      return;
    }
    setStep(prev => Math.min(prev + 1, 3));
  }

  function prevStep() {
    setStep(prev => Math.max(prev - 1, 0));
  }

  async function handleComplete() {
    setSaving(true);
    try {
      await api.saveOnboarding({
        prenatal: {
          chronicConditions: data.chronicConditions,
          allergies: data.allergies,
          currentMedications: data.currentMedications,
          height: parseFloat(data.height) || null,
          weight: parseFloat(data.weight) || null,
          previousPregnancies: parseInt(data.previousPregnancies) || 1,
          previousBirths: parseInt(data.previousBirths) || 0,
          previousComplications: data.previousComplications,
          bloodType: data.bloodType,
          currentSymptoms: data.currentSymptoms,
        },
        postnatal: {
          deliveryPlan: data.deliveryPlan,
          preferredFacilityId: data.preferredFacilityId,
          supportPerson: data.supportPerson,
          emergencyContactPhone: data.emergencyContactPhone,
          breastfeedingPlan: data.breastfeedingPlan,
          familyPlanning: data.familyPlanning,
        },
        childcare: {
          knowsVaccinations: data.knowsVaccinations,
          careSupport: data.careSupport,
          emergencyTransport: data.emergencyTransport,
        },
      });
      await refreshProfile();
      Alert.alert(t('success'), t('diary_complete'), [
        { text: t('go_to_dashboard'), onPress: () => navigation.replace('Main') },
      ]);
    } catch (err) {
      Alert.alert(t('error'), err.message);
    } finally {
      setSaving(false);
    }
  }

  const steps = [
    // Step 0: Prenatal - Medical History
    <View key="step0">
      <Text style={styles.stepTitle}>{t('diary_prenatal')}</Text>
      <Text style={styles.stepDesc}>{t('diary_prenatal_desc')}</Text>

      <Text style={styles.label}>{t('chronic_conditions')}</Text>
      <View style={styles.chipRow}>
        {CHRONIC_CONDITIONS.map(c => (
          <TouchableOpacity
            key={c}
            style={[styles.chip, data.chronicConditions.includes(c) && styles.chipActive]}
            onPress={() => update('chronicConditions', toggleArray(data.chronicConditions, c))}
          >
            <Text style={[styles.chipText, data.chronicConditions.includes(c) && styles.chipTextActive]}>
              {t('cond_' + c)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>{t('allergies')}</Text>
      <TextInput style={styles.input} value={data.allergies} onChangeText={v => update('allergies', v)} placeholder={t('allergies_placeholder')} placeholderTextColor="#999" />

      <Text style={styles.label}>{t('current_medications')}</Text>
      <TextInput style={styles.input} value={data.currentMedications} onChangeText={v => update('currentMedications', v)} placeholder={t('medications_placeholder')} placeholderTextColor="#999" />

      <View style={styles.row}>
        <View style={styles.halfField}>
          <Text style={styles.label}>{t('height_cm')}</Text>
          <TextInput style={styles.input} value={data.height} onChangeText={v => update('height', v)} keyboardType="decimal-pad" placeholder="e.g. 160" placeholderTextColor="#999" />
        </View>
        <View style={styles.halfField}>
          <Text style={styles.label}>{t('weight_kg')}</Text>
          <TextInput style={styles.input} value={data.weight} onChangeText={v => update('weight', v)} keyboardType="decimal-pad" placeholder="e.g. 65" placeholderTextColor="#999" />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.halfField}>
          <Text style={styles.label}>{t('previous_pregnancies')}</Text>
          <TextInput style={styles.input} value={data.previousPregnancies} onChangeText={v => update('previousPregnancies', v)} keyboardType="number-pad" placeholderTextColor="#999" />
        </View>
        <View style={styles.halfField}>
          <Text style={styles.label}>{t('previous_births')}</Text>
          <TextInput style={styles.input} value={data.previousBirths} onChangeText={v => update('previousBirths', v)} keyboardType="number-pad" placeholderTextColor="#999" />
        </View>
      </View>

      <Text style={styles.label}>{t('prev_complications')}</Text>
      <View style={styles.chipRow}>
        {PREV_COMPLICATIONS.map(c => (
          <TouchableOpacity
            key={c}
            style={[styles.chip, data.previousComplications.includes(c) && styles.chipActive]}
            onPress={() => update('previousComplications', toggleArray(data.previousComplications, c))}
          >
            <Text style={[styles.chipText, data.previousComplications.includes(c) && styles.chipTextActive]}>
              {t('comp_' + c)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>{t('blood_type')}</Text>
      <TextInput style={styles.input} value={data.bloodType} onChangeText={v => update('bloodType', v)} placeholder="e.g. O+" placeholderTextColor="#999" />

      <Text style={styles.label}>{t('current_symptoms')}</Text>
      <View style={styles.chipRow}>
        {SYMPTOMS.map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.chip, data.currentSymptoms.includes(s) && styles.chipActive]}
            onPress={() => update('currentSymptoms', toggleArray(data.currentSymptoms, s))}
          >
            <Text style={[styles.chipText, data.currentSymptoms.includes(s) && styles.chipTextActive]}>
              {t('sym_' + s)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={nextStep}>
        <Text style={styles.buttonText}>{t('next')}</Text>
      </TouchableOpacity>
    </View>,

    // Step 1: Postnatal - Birth Plan
    <View key="step1">
      <Text style={styles.stepTitle}>{t('diary_postnatal')}</Text>
      <Text style={styles.stepDesc}>{t('diary_postnatal_desc')}</Text>

      <Text style={styles.label}>{t('delivery_plan')}</Text>
      <View style={styles.optionsRow}>
        <TouchableOpacity
          style={[styles.optionBtn, data.deliveryPlan === 'facility' && styles.optionBtnActive]}
          onPress={() => update('deliveryPlan', 'facility')}
        >
          <Text style={[styles.optionBtnText, data.deliveryPlan === 'facility' && styles.optionBtnTextActive]}>
            {t('deliver_facility')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.optionBtn, data.deliveryPlan === 'home' && styles.optionBtnActive]}
          onPress={() => update('deliveryPlan', 'home')}
        >
          <Text style={[styles.optionBtnText, data.deliveryPlan === 'home' && styles.optionBtnTextActive]}>
            {t('deliver_home')}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>{t('support_person')}</Text>
      <TextInput style={styles.input} value={data.supportPerson} onChangeText={v => update('supportPerson', v)} placeholder={t('support_person_placeholder')} placeholderTextColor="#999" />

      <Text style={styles.label}>{t('emergency_phone')} *</Text>
      <TextInput style={styles.input} value={data.emergencyContactPhone} onChangeText={v => update('emergencyContactPhone', v)} keyboardType="phone-pad" placeholder="+2547XXXXXXXX" placeholderTextColor="#999" />

      <Text style={styles.label}>{t('breastfeeding_plan')}</Text>
      <View style={styles.optionsRow}>
        <TouchableOpacity
          style={[styles.optionBtn, data.breastfeedingPlan === 'exclusive' && styles.optionBtnActive]}
          onPress={() => update('breastfeedingPlan', 'exclusive')}
        >
          <Text style={[styles.optionBtnText, data.breastfeedingPlan === 'exclusive' && styles.optionBtnTextActive]}>
            {t('bf_exclusive')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.optionBtn, data.breastfeedingPlan === 'mixed' && styles.optionBtnActive]}
          onPress={() => update('breastfeedingPlan', 'mixed')}
        >
          <Text style={[styles.optionBtnText, data.breastfeedingPlan === 'mixed' && styles.optionBtnTextActive]}>
            {t('bf_mixed')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.optionBtn, data.breastfeedingPlan === 'formula' && styles.optionBtnActive]}
          onPress={() => update('breastfeedingPlan', 'formula')}
        >
          <Text style={[styles.optionBtnText, data.breastfeedingPlan === 'formula' && styles.optionBtnTextActive]}>
            {t('bf_formula')}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>{t('family_planning')}</Text>
      <TextInput style={styles.input} value={data.familyPlanning} onChangeText={v => update('familyPlanning', v)} placeholder={t('family_planning_placeholder')} placeholderTextColor="#999" />

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={prevStep}>
          <Text style={styles.secondaryBtnText}>{t('back')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.flex1]} onPress={nextStep}>
          <Text style={styles.buttonText}>{t('next')}</Text>
        </TouchableOpacity>
      </View>
    </View>,

    // Step 2: Childcare
    <View key="step2">
      <Text style={styles.stepTitle}>{t('diary_childcare')}</Text>
      <Text style={styles.stepDesc}>{t('diary_childcare_desc')}</Text>

      <Text style={styles.label}>{t('knows_vaccinations')}</Text>
      <View style={styles.optionsRow}>
        <TouchableOpacity
          style={[styles.optionBtn, data.knowsVaccinations === true && styles.optionBtnActive]}
          onPress={() => update('knowsVaccinations', true)}
        >
          <Text style={[styles.optionBtnText, data.knowsVaccinations === true && styles.optionBtnTextActive]}>
            {t('yes')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.optionBtn, data.knowsVaccinations === false && styles.optionBtnActive]}
          onPress={() => update('knowsVaccinations', false)}
        >
          <Text style={[styles.optionBtnText, data.knowsVaccinations === false && styles.optionBtnTextActive]}>
            {t('no')}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>{t('care_support')}</Text>
      <TextInput style={styles.input} value={data.careSupport} onChangeText={v => update('careSupport', v)} placeholder={t('care_support_placeholder')} placeholderTextColor="#999" />

      <Text style={styles.label}>{t('emergency_transport')}</Text>
      <View style={styles.optionsRow}>
        <TouchableOpacity
          style={[styles.optionBtn, data.emergencyTransport === true && styles.optionBtnActive]}
          onPress={() => update('emergencyTransport', true)}
        >
          <Text style={[styles.optionBtnText, data.emergencyTransport === true && styles.optionBtnTextActive]}>
            {t('yes')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.optionBtn, data.emergencyTransport === false && styles.optionBtnActive]}
          onPress={() => update('emergencyTransport', false)}
        >
          <Text style={[styles.optionBtnText, data.emergencyTransport === false && styles.optionBtnTextActive]}>
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
          onPress={handleComplete}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t('complete_diary')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>,
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('pregnancy_diary')}</Text>
        <Text style={styles.headerSub}>{t('diary_intro')}</Text>
      </View>

      <View style={styles.stepIndicator}>
        {[0, 1, 2].map(i => (
          <View key={i} style={styles.stepSegment}>
            <View style={[styles.stepDot, i <= step && styles.stepDotActive]}>
              <Text style={[styles.stepDotText, i <= step && styles.stepDotTextActive]}>{i + 1}</Text>
            </View>
            {i < 2 && <View style={[styles.stepLine, i < step && styles.stepLineActive]} />}
          </View>
        ))}
      </View>
      <View style={styles.stepLabelsRow}>
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
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#2C3E50' },
  headerSub: { fontSize: 13, color: '#7F8C8D', marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginTop: 8, elevation: 3, boxShadow: '0 2px 6px rgba(0,0,0,0.1)' },
  stepIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 12 },
  stepSegment: { flexDirection: 'row', alignItems: 'center' },
  stepDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center' },
  stepDotActive: { backgroundColor: '#C0392B' },
  stepDotText: { fontSize: 14, fontWeight: '600', color: '#999' },
  stepDotTextActive: { color: '#fff' },
  stepLine: { width: 40, height: 3, backgroundColor: '#F0F0F0', marginHorizontal: 4 },
  stepLineActive: { backgroundColor: '#C0392B' },
  stepLabelsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 10, marginBottom: 8 },
  stepLabel: { fontSize: 11, color: '#7F8C8D', fontWeight: '500' },
  stepTitle: { fontSize: 18, fontWeight: 'bold', color: '#C0392B', marginBottom: 6 },
  stepDesc: { fontSize: 13, color: '#666', marginBottom: 16, lineHeight: 18 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6, marginTop: 14 },
  input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, padding: 12, fontSize: 15, backgroundColor: '#FAFAFA' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  halfField: { width: '48%' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: '#E0E0E0', backgroundColor: '#FAFAFA' },
  chipActive: { backgroundColor: '#C0392B', borderColor: '#C0392B' },
  chipText: { fontSize: 12, color: '#666' },
  chipTextActive: { color: '#fff' },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  optionBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#E0E0E0' },
  optionBtnActive: { backgroundColor: '#C0392B', borderColor: '#C0392B' },
  optionBtnText: { fontSize: 13, color: '#666' },
  optionBtnTextActive: { color: '#fff' },
  button: { backgroundColor: '#C0392B', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 24 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  secondaryBtn: { flex: 1, padding: 16, alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: '#E0E0E0' },
  secondaryBtnText: { color: '#666', fontSize: 16, fontWeight: '600' },
  flex1: { flex: 1 },
});
