import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import { useTranslation } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function RegisterMotherScreen({ navigation }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [facilities, setFacilities] = useState([]);
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
  });

  useEffect(() => {
    api.getFacilities().then(setFacilities).catch(() => console.warn('Failed to load facilities'));
  }, []);

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleRegister() {
    if (!form.phone || !form.firstName || !form.lastName || !form.lmpDate || !form.ward || !form.village) {
      Alert.alert(t('error'), t('phone_name_lmp_required'));
      return;
    }
    setSaving(true);
    try {
      await api.registerMother({
        ...form,
        gravida: parseInt(form.gravida) || 1,
        parity: parseInt(form.parity) || 0,
      });
      Alert.alert(t('success'), t('mother_registered'));
      setForm({
        phone: '', password: 'changeme123', firstName: '', lastName: '', nationalId: '',
        lmpDate: '', facilityId: '', gravida: '1', parity: '0',
        village: '', ward: '', emergencyContactName: '', emergencyContactPhone: '', alternatePhone: '',
      });
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
          <Text style={styles.backBtn}>{t('back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('register_mother')}</Text>
        <Text style={styles.headerSub}>{t('reg_mother_subtitle')}</Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>{t('mother_personal_info')}</Text>

        <Text style={styles.label}>{t('phone_required')}</Text>
        <TextInput style={styles.input} value={form.phone} onChangeText={v => update('phone', v)} placeholder="+254712345678" keyboardType="phone-pad" placeholderTextColor="#999" />

        <Text style={styles.label}>{t('alternate_phone')}</Text>
        <TextInput style={styles.input} value={form.alternatePhone} onChangeText={v => update('alternatePhone', v)} placeholder="+254712345679" keyboardType="phone-pad" placeholderTextColor="#999" />

        <Text style={styles.label}>{t('temp_password')}</Text>
        <TextInput style={styles.input} value={form.password} onChangeText={v => update('password', v)} placeholder="Default: changeme123" placeholderTextColor="#999" />

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

        <Text style={styles.sectionTitle}>{t('pregnancy_info')}</Text>

        <Text style={styles.label}>{t('lmp_date')} *</Text>
        <TextInput style={styles.input} value={form.lmpDate} onChangeText={v => update('lmpDate', v)} placeholder="YYYY-MM-DD" placeholderTextColor="#999" />

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

        <Text style={styles.sectionTitle}>{t('location_emergency')}</Text>

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>{t('village')} *</Text>
            <TextInput style={styles.input} value={form.village} onChangeText={v => update('village', v)} placeholderTextColor="#999" />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>{t('ward')} *</Text>
            <TextInput style={styles.input} value={form.ward} onChangeText={v => update('ward', v)} placeholder="e.g. Kiminini" placeholderTextColor="#999" />
          </View>
        </View>

        <Text style={styles.label}>{t('emergency_contact_name_label')}</Text>
        <TextInput style={styles.input} value={form.emergencyContactName} onChangeText={v => update('emergencyContactName', v)} placeholderTextColor="#999" />

        <Text style={styles.label}>{t('emergency_phone')}</Text>
        <TextInput style={styles.input} value={form.emergencyContactPhone} onChangeText={v => update('emergencyContactPhone', v)} keyboardType="phone-pad" placeholderTextColor="#999" />

        <TouchableOpacity style={[styles.saveBtn, saving && styles.savingBtn]} onPress={handleRegister} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{t('register_mother_btn')}</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5F5' },
  header: { padding: 20, paddingBottom: 8 },
  backBtn: { fontSize: 16, color: '#C0392B', marginBottom: 8 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#2C3E50' },
  headerSub: { fontSize: 13, color: '#7F8C8D', marginTop: 4 },
  formCard: { backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 20, elevation: 3, boxShadow: '0 2px 6px rgba(0,0,0,0.1)' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#C0392B', marginTop: 16, marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6, marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, padding: 12, fontSize: 16, backgroundColor: '#FAFAFA' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  halfField: { width: '48%' },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  optionBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: '#E0E0E0' },
  optionSelected: { backgroundColor: '#C0392B', borderColor: '#C0392B' },
  optionText: { fontSize: 13, color: '#666' },
  optionTextSelected: { color: '#fff' },
  saveBtn: { backgroundColor: '#C0392B', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 20 },
  savingBtn: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
