import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import { useTranslation } from '../context/LanguageContext';
import api from '../services/api';

export default function MonitoringScreen() {
  const { t } = useTranslation();
  const [pregnancies, setPregnancies] = useState([]);
  const [selectedPregnancy, setSelectedPregnancy] = useState(null);
  const [measurements, setMeasurements] = useState({
    weightKg: '', bpSystolic: '', bpDiastolic: '', bloodSugar: '', symptoms: '', fetalMovements: '', notes: '',
  });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const pregList = await api.getPregnancies();
      setPregnancies(pregList);
      if (pregList.length > 0) {
        const active = pregList.find(p => p.status === 'active') || pregList[0];
        setSelectedPregnancy(active.id);
        const mon = await api.getSelfMonitoring({ pregnancyId: active.id });
        setHistory(mon);
      }
    } catch (err) {
      // silent
    } finally {
      setLoading(false);
    }
  }

  function updateField(field, value) {
    setMeasurements(prev => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!selectedPregnancy) {
      Alert.alert(t('error'), t('no_active_pregnancy'));
      return;
    }
    setSaving(true);
    try {
      const data = { pregnancyId: selectedPregnancy };
      if (measurements.weightKg) data.weightKg = parseFloat(measurements.weightKg);
      if (measurements.bpSystolic) data.bpSystolic = parseInt(measurements.bpSystolic);
      if (measurements.bpDiastolic) data.bpDiastolic = parseInt(measurements.bpDiastolic);
      if (measurements.bloodSugar) data.bloodSugar = parseFloat(measurements.bloodSugar);
      if (measurements.symptoms) data.symptoms = measurements.symptoms.split(',').map(s => s.trim());
      if (measurements.fetalMovements) data.fetalMovements = measurements.fetalMovements;
      if (measurements.notes) data.notes = measurements.notes;

      await api.recordSelfMonitoring(data);
      Alert.alert('Success', 'Measurements recorded successfully');
      setMeasurements({ weightKg: '', bpSystolic: '', bpDiastolic: '', bloodSugar: '', symptoms: '', fetalMovements: '', notes: '' });
      const mon = await api.getSelfMonitoring({ pregnancyId: selectedPregnancy });
      setHistory(mon);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  }

  function getBPStatus(systolic, diastolic) {
    if (!systolic || !diastolic) return '';
    if (systolic >= 140 || diastolic >= 90) return t('bp_high');
    if (systolic >= 130 || diastolic >= 85) return t('bp_elevated');
    return t('bp_normal');
  }

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#C0392B" /></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('self_monitoring')}</Text>
        <Text style={styles.headerSub}>{t('track_health')}</Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.cardTitle}>{t('record_measurements')}</Text>

        <Text style={styles.label}>{t('weight_kg')}</Text>
        <TextInput style={styles.input} value={measurements.weightKg} onChangeText={v => updateField('weightKg', v)} placeholder="e.g. 65.5" keyboardType="decimal-pad" placeholderTextColor="#999" />

        <Text style={styles.fieldHint}>At home you can track weight, symptoms, fetal movements and notes. BP and blood sugar are typically measured at facility visits — leave blank if unavailable.</Text>

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>{t('bp_systolic') + ' (if available)'}</Text>
            <TextInput style={styles.input} value={measurements.bpSystolic} onChangeText={v => updateField('bpSystolic', v)} placeholder="e.g. 120" keyboardType="number-pad" placeholderTextColor="#999" />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>{t('bp_diastolic') + ' (if available)'}</Text>
            <TextInput style={styles.input} value={measurements.bpDiastolic} onChangeText={v => updateField('bpDiastolic', v)} placeholder="e.g. 80" keyboardType="number-pad" placeholderTextColor="#999" />
          </View>
        </View>

        {measurements.bpSystolic && measurements.bpDiastolic && (
          <Text style={[styles.bpStatus, (parseInt(measurements.bpSystolic) >= 140 || parseInt(measurements.bpDiastolic) >= 90) && styles.bpDanger]}>
            {getBPStatus(parseInt(measurements.bpSystolic), parseInt(measurements.bpDiastolic))}
          </Text>
        )}

        <Text style={styles.label}>{t('blood_sugar') + ' (if available)'}</Text>
        <TextInput style={styles.input} value={measurements.bloodSugar} onChangeText={v => updateField('bloodSugar', v)} placeholder="e.g. 5.2" keyboardType="decimal-pad" placeholderTextColor="#999" />

        <Text style={styles.label}>{t('symptoms_comma')}</Text>
        <TextInput style={styles.input} value={measurements.symptoms} onChangeText={v => updateField('symptoms', v)} placeholder="e.g. headache, swelling" placeholderTextColor="#999" />

        <Text style={styles.label}>{t('fetal_movements')}</Text>
        <View style={styles.optionsRow}>
          {['normal', 'reduced', 'none'].map(opt => (
            <TouchableOpacity
              key={opt}
              style={[styles.optionBtn, measurements.fetalMovements === opt && styles.optionSelected]}
              onPress={() => updateField('fetalMovements', opt)}
            >
              <Text style={[styles.optionText, measurements.fetalMovements === opt && styles.optionTextSelected]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>{t('notes')}</Text>
        <TextInput style={[styles.input, styles.textArea]} value={measurements.notes} onChangeText={v => updateField('notes', v)} placeholder="Any additional notes..." placeholderTextColor="#999" multiline numberOfLines={3} />

        <TouchableOpacity style={[styles.saveBtn, saving && styles.savingBtn]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{t('save_measurements')}</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.historyCard}>
        <Text style={styles.cardTitle}>{t('recent_measurements')}</Text>
        {history.length === 0 ? (
          <Text style={styles.noData}>{t('no_measurements')}</Text>
        ) : (
          history.slice(0, 5).map(item => (
            <View key={item.id} style={styles.historyItem}>
              <Text style={styles.historyDate}>{new Date(item.recorded_at).toLocaleDateString()}</Text>
              <View style={styles.historyRow}>
                {item.weight_kg && <Text style={styles.historyMetric}>⚖️ {item.weight_kg} kg</Text>}
                {item.blood_pressure_systolic && <Text style={styles.historyMetric}>❤️ {item.blood_pressure_systolic}/{item.blood_pressure_diastolic}</Text>}
              </View>
              {item.danger_alert_triggered && <Text style={styles.dangerAlert}>🚨 Danger signs detected!</Text>}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5F5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF5F5' },
  header: { padding: 20, paddingBottom: 8 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#2C3E50' },
  headerSub: { fontSize: 14, color: '#7F8C8D', marginTop: 2 },
  formCard: { backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 20, elevation: 3, boxShadow: '0 2px 6px rgba(0,0,0,0.1)' },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6, marginTop: 10 },
  fieldHint: { fontSize: 12, color: '#7F8C8D', fontStyle: 'italic', marginBottom: 8, lineHeight: 18 },
  input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, padding: 12, fontSize: 16, backgroundColor: '#FAFAFA' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  halfField: { width: '48%' },
  bpStatus: { fontSize: 13, color: '#27AE60', marginTop: 4, fontWeight: '600' },
  bpDanger: { color: '#E74C3C' },
  textArea: { height: 80, textAlignVertical: 'top' },
  optionsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 },
  optionBtn: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20, borderWidth: 1, borderColor: '#E0E0E0' },
  optionSelected: { backgroundColor: '#C0392B', borderColor: '#C0392B' },
  optionText: { fontSize: 14, color: '#666', textTransform: 'capitalize' },
  optionTextSelected: { color: '#fff' },
  saveBtn: { backgroundColor: '#C0392B', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 20 },
  savingBtn: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  historyCard: { backgroundColor: '#fff', margin: 16, marginTop: 0, borderRadius: 16, padding: 20, elevation: 3, boxShadow: '0 2px 6px rgba(0,0,0,0.1)' },
  noData: { color: '#999', fontSize: 14, textAlign: 'center', padding: 20 },
  historyItem: { borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingVertical: 12 },
  historyDate: { fontSize: 12, color: '#7F8C8D', marginBottom: 4 },
  historyRow: { flexDirection: 'row', gap: 16 },
  historyMetric: { fontSize: 14, color: '#2C3E50' },
  dangerAlert: { color: '#E74C3C', fontSize: 12, fontWeight: 'bold', marginTop: 4 },
});
