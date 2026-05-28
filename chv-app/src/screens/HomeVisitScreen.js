import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, Platform,
} from 'react-native';
import api from '../services/api';
import { offlineStore } from '../store/offlineStore';
import { useTranslation } from '../context/LanguageContext';

export default function HomeVisitScreen({ route, navigation }) {
  const { t } = useTranslation();
  const [pregnancies, setPregnancies] = useState([]);
  const [selectedPregnancy, setSelectedPregnancy] = useState(null);
  const [motherId, setMotherId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isOnline, setIsOnline] = useState(Platform.OS === 'web' ? navigator.onLine : true);

  useEffect(() => {
    function handleOnline() { setIsOnline(true); }
    function handleOffline() { setIsOnline(false); }
    if (Platform.OS === 'web') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  const [form, setForm] = useState({
    visitDate: new Date().toISOString().split('T')[0],
    visitType: 'antenatal',
    weightKg: '', bpSystolic: '', bpDiastolic: '', temperatureC: '',
    pulseRate: '', hemoglobin: '', fundalHeightCm: '', fetalHeartRate: '',
    dangerSigns: [], notes: '',
  });

  const dangerSignOptions = [
    'severe_headache', 'blurred_vision', 'vaginal_bleeding',
    'severe_abdominal_pain', 'convulsions', 'fever', 'swelling',
    'reduced_fetal_movements', 'difficulty_breathing', 'severe_vomiting',
  ];

  useEffect(() => {
    loadPregnancies();
  }, []);

  async function loadPregnancies() {
    try {
      const pregs = await api.getAssignedMothers();
      setPregnancies(pregs);
    } catch (err) {
      Alert.alert(t('error'), t('failed_load_mothers'));
    } finally {
      setLoading(false);
    }
  }

  function updateField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function toggleDangerSign(sign) {
    setForm(prev => ({
      ...prev,
      dangerSigns: prev.dangerSigns.includes(sign)
        ? prev.dangerSigns.filter(s => s !== sign)
        : [...prev.dangerSigns, sign],
    }));
  }

  async function handleSave() {
    if (!selectedPregnancy) {
      Alert.alert(t('error'), t('select_mother'));
      return;
    }

    const visitData = {
      pregnancyId: selectedPregnancy,
      motherId,
      visitDate: form.visitDate,
      visitType: form.visitType,
      weightKg: form.weightKg ? parseFloat(form.weightKg) : null,
      bpSystolic: form.bpSystolic ? parseInt(form.bpSystolic) : null,
      bpDiastolic: form.bpDiastolic ? parseInt(form.bpDiastolic) : null,
      temperatureC: form.temperatureC ? parseFloat(form.temperatureC) : null,
      pulseRate: form.pulseRate ? parseInt(form.pulseRate) : null,
      hemoglobin: form.hemoglobin ? parseFloat(form.hemoglobin) : null,
      fundalHeightCm: form.fundalHeightCm ? parseFloat(form.fundalHeightCm) : null,
      fetalHeartRate: form.fetalHeartRate ? parseInt(form.fetalHeartRate) : null,
      dangerSigns: form.dangerSigns,
      notes: form.notes,
    };

    setSaving(true);
    try {
      if (isOnline) {
        await api.createHomeVisit(visitData);
      } else {
        await offlineStore.saveVisit(visitData);
      }
      Alert.alert(t('success'), isOnline ? t('visit_recorded') : t('visit_saved_offline'));
      navigation.goBack();
    } catch (err) {
      Alert.alert(t('error'), err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#2980B9" /></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Record Home Visit</Text>
        <Text style={styles.headerSub}>Fill vitals and observations</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Select Mother</Text>
        {pregnancies.map(p => (
          <TouchableOpacity key={p.id} style={[styles.motherOption, selectedPregnancy === p.id && styles.motherSelected]} onPress={() => { setSelectedPregnancy(p.id); setMotherId(p.mother_id); }}>
            <Text style={[styles.motherText, selectedPregnancy === p.id && styles.motherTextSelected]}>{p.mother_name}</Text>
            <Text style={styles.motherSub}>{p.mother_phone} - EDD: {new Date(p.edd_date).toLocaleDateString()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Visit Details</Text>

        <Text style={styles.label}>Visit Date</Text>
        <TextInput style={styles.input} value={form.visitDate} onChangeText={v => updateField('visitDate', v)} placeholderTextColor="#999" />

        <Text style={styles.label}>Visit Type</Text>
        <View style={styles.optionsRow}>
          {['antenatal', 'postnatal', 'follow_up', 'emergency'].map(type => (
            <TouchableOpacity key={type} style={[styles.option, form.visitType === type && styles.optionSelected]} onPress={() => updateField('visitType', type)}>
              <Text style={[styles.optionText, form.visitType === type && styles.optionTextSelected]}>{type.replace('_', ' ')}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Vital Signs</Text>
        <View style={styles.vitalsRow}>
          <View style={styles.vitalField}>
            <Text style={styles.label}>Weight (kg)</Text>
            <TextInput style={styles.input} value={form.weightKg} onChangeText={v => updateField('weightKg', v)} keyboardType="decimal-pad" placeholderTextColor="#999" />
          </View>
          <View style={styles.vitalField}>
            <Text style={styles.label}>Temp (°C)</Text>
            <TextInput style={styles.input} value={form.temperatureC} onChangeText={v => updateField('temperatureC', v)} keyboardType="decimal-pad" placeholderTextColor="#999" />
          </View>
        </View>

        <View style={styles.vitalsRow}>
          <View style={styles.vitalField}>
            <Text style={styles.label}>BP Systolic</Text>
            <TextInput style={styles.input} value={form.bpSystolic} onChangeText={v => updateField('bpSystolic', v)} keyboardType="number-pad" placeholderTextColor="#999" />
          </View>
          <View style={styles.vitalField}>
            <Text style={styles.label}>BP Diastolic</Text>
            <TextInput style={styles.input} value={form.bpDiastolic} onChangeText={v => updateField('bpDiastolic', v)} keyboardType="number-pad" placeholderTextColor="#999" />
          </View>
        </View>

        <View style={styles.vitalsRow}>
          <View style={styles.vitalField}>
            <Text style={styles.label}>Pulse Rate</Text>
            <TextInput style={styles.input} value={form.pulseRate} onChangeText={v => updateField('pulseRate', v)} keyboardType="number-pad" placeholderTextColor="#999" />
          </View>
          <View style={styles.vitalField}>
            <Text style={styles.label}>Hemoglobin</Text>
            <TextInput style={styles.input} value={form.hemoglobin} onChangeText={v => updateField('hemoglobin', v)} keyboardType="decimal-pad" placeholderTextColor="#999" />
          </View>
        </View>

        <View style={styles.vitalsRow}>
          <View style={styles.vitalField}>
            <Text style={styles.label}>Fundal Height (cm)</Text>
            <TextInput style={styles.input} value={form.fundalHeightCm} onChangeText={v => updateField('fundalHeightCm', v)} keyboardType="decimal-pad" placeholderTextColor="#999" />
          </View>
          <View style={styles.vitalField}>
            <Text style={styles.label}>Fetal Heart Rate</Text>
            <TextInput style={styles.input} value={form.fetalHeartRate} onChangeText={v => updateField('fetalHeartRate', v)} keyboardType="number-pad" placeholderTextColor="#999" />
          </View>
        </View>

        <Text style={styles.sectionLabel}>Danger Signs</Text>
        <View style={styles.dangerGrid}>
          {dangerSignOptions.map(sign => (
            <TouchableOpacity key={sign} style={[styles.dangerChip, form.dangerSigns.includes(sign) && styles.dangerChipSelected]} onPress={() => toggleDangerSign(sign)}>
              <Text style={[styles.dangerChipText, form.dangerSigns.includes(sign) && styles.dangerChipTextSelected]}>{sign.replace(/_/g, ' ')}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {form.bpSystolic && form.bpDiastolic && (parseInt(form.bpSystolic) >= 140 || parseInt(form.bpDiastolic) >= 90) && (
          <View style={styles.alertBox}>
            <Text style={styles.alertText}>High BP detected. Consider urgent referral.</Text>
          </View>
        )}

        <Text style={styles.label}>Notes</Text>
        <TextInput style={[styles.input, styles.textArea]} value={form.notes} onChangeText={v => updateField('notes', v)} placeholderTextColor="#999" multiline />

        <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Visit</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, backgroundColor: '#2980B9' },
  backBtn: { fontSize: 16, color: '#D5E8F5', marginBottom: 8, fontWeight: '600' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 13, color: '#D5E8F5', marginTop: 2 },
  card: { backgroundColor: '#fff', margin: 12, borderRadius: 12, padding: 16, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50', marginBottom: 12 },
  motherOption: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E0E0E0', marginBottom: 6 },
  motherSelected: { borderColor: '#2980B9', backgroundColor: '#EBF5FB' },
  motherText: { fontSize: 15, fontWeight: '600', color: '#2C3E50' },
  motherTextSelected: { color: '#2980B9' },
  motherSub: { fontSize: 12, color: '#7F8C8D', marginTop: 2 },
  label: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 4, marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, padding: 10, fontSize: 15, backgroundColor: '#FAFAFA' },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#E0E0E0' },
  optionSelected: { backgroundColor: '#2980B9', borderColor: '#2980B9' },
  optionText: { fontSize: 13, color: '#666', textTransform: 'capitalize' },
  optionTextSelected: { color: '#fff' },
  sectionLabel: { fontSize: 15, fontWeight: 'bold', color: '#2C3E50', marginTop: 16, marginBottom: 8 },
  vitalsRow: { flexDirection: 'row', gap: 12 },
  vitalField: { flex: 1 },
  dangerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  dangerChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: '#E0E0E0' },
  dangerChipSelected: { backgroundColor: '#E74C3C', borderColor: '#E74C3C' },
  dangerChipText: { fontSize: 12, color: '#666', textTransform: 'capitalize' },
  dangerChipTextSelected: { color: '#fff' },
  alertBox: { backgroundColor: '#FDEDED', padding: 12, borderRadius: 8, marginTop: 8, borderLeftWidth: 3, borderLeftColor: '#E74C3C' },
  alertText: { color: '#C0392B', fontSize: 13, fontWeight: '500' },
  textArea: { height: 80, textAlignVertical: 'top' },
  saveBtn: { backgroundColor: '#2980B9', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 20 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
