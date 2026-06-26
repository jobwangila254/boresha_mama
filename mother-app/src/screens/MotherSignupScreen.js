import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import CountyLogo from '../components/CountyLogo';
import api from '../services/api';

function toDateString(date) {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const STAGES = [
  { value: 'first_trimester', labelKey: 'stage_first_trimester' },
  { value: 'second_trimester', labelKey: 'stage_second_trimester' },
  { value: 'third_trimester', labelKey: 'stage_third_trimester' },
  { value: 'postnatal', labelKey: 'stage_postnatal' },
];

export default function MotherSignupScreen({ navigation }) {
  const { registerMotherSelf } = useAuth();
  const { t } = useTranslation();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [facilities, setFacilities] = useState([]);
  const [filteredFacilities, setFilteredFacilities] = useState([]);
  const [wards, setWards] = useState([]);
  const [villages, setVillages] = useState([]);
  const [showWardDropdown, setShowWardDropdown] = useState(false);
  const [showVillageDropdown, setShowVillageDropdown] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: null,
    lmpDate: '',
    pregnancyStage: 'first_trimester',
    village: '',
    ward: '',
    facilityId: '',
    phone: '',
    password: '',
  });

  useEffect(() => {
    api.getFacilities().then(setFacilities).catch(() => {});
    api.getLocations().then(data => {
      if (!Array.isArray(data) || data.length === 0) {
        console.warn('Locations API returned empty data');
        return;
      }
      const uniqueWards = [...new Set(data.flatMap(c =>
        c.wards?.map(w => w.ward) || []
      ))].sort();
      setWards(uniqueWards);
    }).catch(err => console.warn('Failed to load wards:', err.message));
  }, []);

  useEffect(() => {
    if (!form.ward) {
      setVillages([]);
      setFilteredFacilities(facilities);
      return;
    }
    setLoadingLocations(true);
    setShowVillageDropdown(false);
    setForm(prev => ({ ...prev, village: '' }));
    Promise.all([
      api.getLocations({ mode: 'villages', ward: form.ward }),
      Promise.resolve(
        facilities.filter(f =>
          f.ward?.toLowerCase() === form.ward.toLowerCase()
        )
      ),
    ]).then(([villageData, filtered]) => {
      setVillages([...new Set(villageData.map(v => v.village))].sort());
      setFilteredFacilities(filtered);
      if (!filtered.some(f => f.id === form.facilityId)) {
        setForm(prev => ({ ...prev, facilityId: '' }));
      }
    }).catch(() => {}).finally(() => setLoadingLocations(false));
  }, [form.ward, facilities]);

  useEffect(() => {
    if (step === 1 && !form.dateOfBirth) {
      setForm(prev => ({ ...prev, dateOfBirth: new Date(1995, 0, 1) }));
    }
  }, [step]);

  function normalizePhone(phone) {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('254') && digits.length === 12) return '+' + digits;
    if (digits.startsWith('07') && digits.length === 10) return '+254' + digits.slice(1);
    if (digits.startsWith('7') && digits.length === 9) return '+254' + digits;
    return phone;
  }

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function isStepValid() {
    switch (step) {
      case 0: return form.firstName.trim() && form.lastName.trim();
      case 1: return form.dateOfBirth !== null;
      case 2: return true;
      case 3: return true;
      case 4: return form.phone.trim() && form.password.length >= 6;
      default: return false;
    }
  }

  function nextStep() {
    if (!isStepValid()) {
      Alert.alert(t('error'), t('fill_required_fields'));
      return;
    }
    setStep(prev => Math.min(prev + 1, 5));
  }

  function prevStep() {
    setStep(prev => Math.max(prev - 1, 0));
  }

  async function handleSubmit() {
    const normalizedPhone = normalizePhone(form.phone);
    if (!normalizedPhone.match(/^\+254\d{9}$/)) {
      Alert.alert(t('error'), t('valid_kenyan_phone'));
      return;
    }
    setLoading(true);
    try {
      await registerMotherSelf({
        firstName: form.firstName,
        lastName: form.lastName,
        phone: normalizedPhone,
        password: form.password,
        dateOfBirth: toDateString(form.dateOfBirth),
        lmpDate: form.lmpDate || null,
        pregnancyStage: form.pregnancyStage,
        village: form.village || null,
        ward: form.ward || null,
        facilityId: form.facilityId || null,
      });
      setStep(5);
    } catch (err) {
      Alert.alert(t('error'), err.message);
    } finally {
      setLoading(false);
    }
  }

  if (step === 5) {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>🎉</Text>
          <Text style={styles.successTitle}>{t('signup_success')}</Text>
          <Text style={styles.successBody}>{t('signup_success_body')}</Text>
          <TouchableOpacity style={styles.button} onPress={() => navigation.replace('Main')}>
            <Text style={styles.buttonText}>{t('go_to_dashboard')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <CountyLogo size={60} />
          <Text style={styles.title}>Boresha-Mama</Text>
          <Text style={styles.subtitle}>{t('mother_signup_title')}</Text>
        </View>

        <View style={styles.stepIndicator}>
          {[0, 1, 2, 3, 4, 5].map(i => (
            <View key={i} style={[styles.dot, i <= step && styles.dotActive]} />
          ))}
        </View>

        <View style={styles.card}>
          {step === 0 && (
            <>
              <Text style={styles.stepTitle}>{t('step_name_title')}</Text>
              <Text style={styles.stepDesc}>{t('step_name_desc')}</Text>
              <Text style={styles.label}>{t('first_name')} *</Text>
              <TextInput
                style={styles.input}
                value={form.firstName}
                onChangeText={v => update('firstName', v)}
                placeholder="e.g. Jane"
                placeholderTextColor="#999"
              />
              <Text style={styles.label}>{t('last_name')} *</Text>
              <TextInput
                style={styles.input}
                value={form.lastName}
                onChangeText={v => update('lastName', v)}
                placeholder="e.g. Doe"
                placeholderTextColor="#999"
              />
              <TouchableOpacity style={styles.button} onPress={nextStep}>
                <Text style={styles.buttonText}>{t('next')}</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 1 && (
            <>
              <Text style={styles.stepTitle}>{t('step_dob_title')}</Text>
              <Text style={styles.stepDesc}>{t('step_dob_desc')}</Text>
              <Text style={styles.label}>{t('date_of_birth')} *</Text>
              <DateTimePicker
                mode="date"
                value={form.dateOfBirth || new Date(2000, 0, 1)}
                maximumDate={new Date()}
                onChange={(event, selectedDate) => {
                  if (selectedDate) update('dateOfBirth', selectedDate);
                }}
                style={styles.datePicker}
              />
              {form.dateOfBirth && (
                <Text style={styles.datePreview}>{toDateString(form.dateOfBirth)}</Text>
              )}
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.secondaryBtn} onPress={prevStep}>
                  <Text style={styles.secondaryBtnText}>{t('back')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.flex1]} onPress={nextStep}>
                  <Text style={styles.buttonText}>{t('next')}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {step === 2 && (
            <>
              <Text style={styles.stepTitle}>{t('step_pregnancy_title')}</Text>
              <Text style={styles.stepDesc}>{t('step_pregnancy_desc')}</Text>
              <Text style={styles.label}>{t('lmp_date_optional')}</Text>
              <TextInput
                style={styles.input}
                value={form.lmpDate}
                onChangeText={v => update('lmpDate', v)}
                placeholder="YYYY-MM-DD (if you know it)"
                placeholderTextColor="#999"
              />
              <Text style={styles.label}>{t('pregnancy_stage')} *</Text>
              <View style={styles.optionsRow}>
                {STAGES.map(s => (
                  <TouchableOpacity
                    key={s.value}
                    style={[styles.optionChip, form.pregnancyStage === s.value && styles.optionChipActive]}
                    onPress={() => update('pregnancyStage', s.value)}
                  >
                    <Text style={[styles.optionChipText, form.pregnancyStage === s.value && styles.optionChipTextActive]}>
                      {t(s.labelKey)}
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
            </>
          )}

          {step === 3 && (
            <>
              <Text style={styles.stepTitle}>{t('step_location_title')}</Text>
              <Text style={styles.stepDesc}>{t('step_location_desc')}</Text>

              <Text style={styles.label}>{t('ward')}</Text>
              <TouchableOpacity
                style={styles.dropdownBtn}
                onPress={() => setShowWardDropdown(!showWardDropdown)}
              >
                <Text style={[styles.dropdownBtnText, !form.ward && styles.dropdownPlaceholder]}>
                  {form.ward || t('select_ward')}
                </Text>
                <Text style={styles.dropdownArrow}>{showWardDropdown ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {showWardDropdown && (
                <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                  {wards.length === 0 ? (
                    <Text style={styles.emptyText}>{t('no_wards')}</Text>
                  ) : (
                    wards.map(w => (
                      <TouchableOpacity
                        key={w}
                        style={[styles.dropdownItem, form.ward === w && styles.dropdownItemActive]}
                        onPress={() => {
                          update('ward', form.ward === w ? '' : w);
                          setShowWardDropdown(false);
                        }}
                      >
                        <Text style={[styles.dropdownItemText, form.ward === w && styles.dropdownItemTextActive]}>
                          {w}
                        </Text>
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              )}

              {form.ward && (
                <>
                  <Text style={styles.label}>{t('village')}</Text>
                  <TouchableOpacity
                    style={styles.dropdownBtn}
                    onPress={() => setShowVillageDropdown(!showVillageDropdown)}
                  >
                    <Text style={[styles.dropdownBtnText, !form.village && styles.dropdownPlaceholder]}>
                      {form.village || t('select_village')}
                    </Text>
                    <Text style={styles.dropdownArrow}>{showVillageDropdown ? '▲' : '▼'}</Text>
                  </TouchableOpacity>
                  {showVillageDropdown && (
                    <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                      {loadingLocations ? (
                        <ActivityIndicator color="#006633" style={{ padding: 20 }} />
                      ) : villages.length === 0 ? (
                        <Text style={styles.emptyText}>{t('no_villages')}</Text>
                      ) : (
                        villages.map(v => (
                          <TouchableOpacity
                            key={v}
                            style={[styles.dropdownItem, form.village === v && styles.dropdownItemActive]}
                            onPress={() => {
                              update('village', form.village === v ? '' : v);
                              setShowVillageDropdown(false);
                            }}
                          >
                            <Text style={[styles.dropdownItemText, form.village === v && styles.dropdownItemTextActive]}>
                              {v}
                            </Text>
                          </TouchableOpacity>
                        ))
                      )}
                    </ScrollView>
                  )}
                </>
              )}

              <Text style={styles.label}>{t('preferred_facility')}</Text>
              <ScrollView style={styles.facilityList} nestedScrollEnabled>
                {filteredFacilities.length === 0 ? (
                  <Text style={styles.emptyText}>{t('no_facilities')}</Text>
                ) : (
                  filteredFacilities.slice(0, 8).map(f => (
                    <TouchableOpacity
                      key={f.id}
                      style={[styles.facilityBtn, form.facilityId === f.id && styles.facilityBtnActive]}
                      onPress={() => update('facilityId', form.facilityId === f.id ? '' : f.id)}
                    >
                      <Text style={[styles.facilityName, form.facilityId === f.id && styles.facilityNameActive]}>
                        {f.name}
                      </Text>
                      <Text style={styles.facilityWard}>{f.ward} — {f.level || f.type}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.secondaryBtn} onPress={prevStep}>
                  <Text style={styles.secondaryBtnText}>{t('back')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.flex1]} onPress={nextStep}>
                  <Text style={styles.buttonText}>{t('next')}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {step === 4 && (
            <>
              <Text style={styles.stepTitle}>{t('step_account_title')}</Text>
              <Text style={styles.stepDesc}>{t('step_account_desc')}</Text>
              <Text style={styles.label}>{t('phone')} *</Text>
              <TextInput
                style={styles.input}
                value={form.phone}
                onChangeText={v => update('phone', v)}
                placeholder="+254712345678"
                keyboardType="phone-pad"
                autoCapitalize="none"
                placeholderTextColor="#999"
              />
              <Text style={styles.label}>{t('password')} *</Text>
              <TextInput
                style={styles.input}
                value={form.password}
                onChangeText={v => update('password', v)}
                placeholder={t('min_6_chars')}
                secureTextEntry
                placeholderTextColor="#999"
              />
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.secondaryBtn} onPress={prevStep}>
                  <Text style={styles.secondaryBtnText}>{t('back')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.flex1, loading && styles.buttonDisabled]}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>{t('sign_up')}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}

          {step === 5 && (
            <View style={styles.summaryContainer}>
              <Text style={styles.stepTitle}>{t('review_details')}</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('name')}</Text>
                <Text style={styles.summaryValue}>{form.firstName} {form.lastName}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('date_of_birth')}</Text>
                <Text style={styles.summaryValue}>{toDateString(form.dateOfBirth)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('pregnancy_stage')}</Text>
                <Text style={styles.summaryValue}>{t('stage_' + form.pregnancyStage)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('village')}</Text>
                <Text style={styles.summaryValue}>{form.village || '-'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('ward')}</Text>
                <Text style={styles.summaryValue}>{form.ward || '-'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('phone')}</Text>
                <Text style={styles.summaryValue}>{form.phone}</Text>
              </View>
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.secondaryBtn} onPress={prevStep}>
                  <Text style={styles.secondaryBtnText}>{t('back')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.flex1, loading && styles.buttonDisabled]}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>{t('confirm_signup')}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.loginLink}>
          <Text style={styles.loginLinkText}>{t('already_have_account')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F8F0' },
  scrollContent: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#004d26', marginBottom: 2 },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center' },
  stepIndicator: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 20 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#E0E0E0' },
  dotActive: { backgroundColor: '#006633' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  stepTitle: { fontSize: 20, fontWeight: 'bold', color: '#2C3E50', marginBottom: 8 },
  stepDesc: { fontSize: 14, color: '#666', marginBottom: 20, lineHeight: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, padding: 14, fontSize: 16, backgroundColor: '#FAFAFA' },
  button: { backgroundColor: '#006633', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 24 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  secondaryBtn: { flex: 1, padding: 16, alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: '#E0E0E0' },
  secondaryBtnText: { color: '#666', fontSize: 16, fontWeight: '600' },
  flex1: { flex: 1 },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  optionChip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: '#E0E0E0' },
  optionChipActive: { backgroundColor: '#006633', borderColor: '#006633' },
  optionChipText: { fontSize: 13, color: '#666' },
  optionChipTextActive: { color: '#fff' },
  facilityList: { maxHeight: 220, marginTop: 8 },
  facilityBtn: { padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E0E0E0', marginBottom: 6, backgroundColor: '#FAFAFA' },
  facilityBtnActive: { backgroundColor: '#E8F5E9', borderColor: '#006633' },
  facilityName: { fontSize: 14, fontWeight: '600', color: '#2C3E50' },
  facilityNameActive: { color: '#006633' },
  facilityWard: { fontSize: 12, color: '#7F8C8D', marginTop: 2 },
  datePicker: { marginTop: 8 },
  datePreview: { fontSize: 14, color: '#2C3E50', fontWeight: '500', marginTop: 8, textAlign: 'center' },
  dropdownBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, padding: 14,
    backgroundColor: '#FAFAFA', marginTop: 4,
  },
  dropdownBtnText: { fontSize: 16, color: '#333', flex: 1 },
  dropdownPlaceholder: { color: '#999' },
  dropdownArrow: { fontSize: 12, color: '#666', marginLeft: 8 },
  dropdownList: { maxHeight: 180, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, marginTop: 4, backgroundColor: '#fff' },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  dropdownItemActive: { backgroundColor: '#E8F5E9' },
  dropdownItemText: { fontSize: 15, color: '#2C3E50' },
  dropdownItemTextActive: { color: '#006633', fontWeight: '600' },
  emptyText: { color: '#999', fontSize: 14, textAlign: 'center', padding: 20 },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  successIcon: { fontSize: 64, marginBottom: 16 },
  successTitle: { fontSize: 24, fontWeight: 'bold', color: '#2C3E50', textAlign: 'center', marginBottom: 8 },
  successBody: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  loginLink: { alignItems: 'center', marginTop: 20 },
  loginLinkText: { color: '#006633', fontSize: 14, fontWeight: '500' },
  summaryContainer: {},
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  summaryLabel: { fontSize: 14, color: '#7F8C8D' },
  summaryValue: { fontSize: 14, color: '#2C3E50', fontWeight: '500' },
});
