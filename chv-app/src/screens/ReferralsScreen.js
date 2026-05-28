import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import api from '../services/api';
import { useTranslation } from '../context/LanguageContext';

const wardProximity = {
  'Kiminini': ['Kiminini Health Centre', 'Kitale County Referral Hospital', 'Mt. Elgon Hospital'],
  'Waitaluk': ['Nabiswa Dispensary', 'Matunda Sub-County Hospital', 'Kitale County Referral Hospital'],
  'Sikhendu': ['Kiminini Health Centre', 'Kitale County Referral Hospital', 'Mt. Elgon Hospital'],
  'Nabiswa': ['Nabiswa Dispensary', 'Kiminini Health Centre', 'Matunda Sub-County Hospital', 'Kitale County Referral Hospital'],
  'Sirende': ['Kiminini Health Centre', 'Kitale County Referral Hospital', 'Mt. Elgon Hospital'],
  'Hospital': ['Kiminini Health Centre', 'Kitale County Referral Hospital', 'Mt. Elgon Hospital'],
};

export default function ReferralsScreen({ navigation }) {
  const { t } = useTranslation();
  const [pregnancies, setPregnancies] = useState([]);
  const [allFacilities, setAllFacilities] = useState([]);
  const [selectedPregnancy, setSelectedPregnancy] = useState(null);
  const [motherId, setMotherId] = useState(null);
  const [motherWard, setMotherWard] = useState(null);
  const [toFacilityId, setToFacilityId] = useState(null);
  const [referralReason, setReferralReason] = useState('');
  const [priority, setPriority] = useState('normal');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.getAssignedMothers(),
      api.getFacilities(),
    ]).then(([pregs, facs]) => {
      setPregnancies(pregs);
      const seen = new Set();
      setAllFacilities(facs.filter(f => {
        if (seen.has(f.name)) return false;
        seen.add(f.name);
        return true;
      }));
    }).catch(() => Alert.alert(t('error'), t('failed_load_data'))).finally(() => setLoading(false));
  }, []);

  function getNearest() {
    if (!motherWard) return [];
    const nearNames = wardProximity[motherWard] || [];
    return allFacilities.filter(f => nearNames.includes(f.name));
  }

  function getOther() {
    if (!motherWard) return allFacilities;
    const nearNames = wardProximity[motherWard] || [];
    return allFacilities.filter(f => !nearNames.includes(f.name));
  }

  function selectMother(p) {
    setSelectedPregnancy(p.id);
    setMotherId(p.mother_id);
    setMotherWard(p.mother_ward || null);
    setToFacilityId(null);
  }

  async function handleSubmit() {
    if (!selectedPregnancy) {
      Alert.alert(t('error'), t('select_mother'));
      return;
    }
    if (!toFacilityId) {
      Alert.alert(t('error'), t('select_facility'));
      return;
    }
    if (!referralReason.trim()) {
      Alert.alert(t('error'), t('enter_referral_reason'));
      return;
    }

    setSaving(true);
    try {
      await api.createReferral({
        pregnancyId: selectedPregnancy,
        motherId,
        toFacilityId,
        referralReason: referralReason.trim(),
        priority,
        notes: notes.trim() || undefined,
      });
      Alert.alert(t('success'), t('referral_created'));
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
        <Text style={styles.headerTitle}>Create Referral</Text>
        <Text style={styles.headerSub}>Refer a mother to a health facility</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Select Mother</Text>
        {pregnancies.map(p => (
          <View key={p.id} style={styles.motherRow}>
            <View style={styles.motherInfo}>
              <Text style={styles.optionTitle}>{p.mother_name}</Text>
              <Text style={styles.optionSub}>
                {p.mother_phone} — {p.mother_ward || 'Ward N/A'} • EDD: {new Date(p.edd_date).toLocaleDateString()}
              </Text>
            </View>
            {selectedPregnancy === p.id ? (
              <View style={styles.selectedBadge}>
                <Text style={styles.selectedBadgeText}>Selected</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.createRefBtn} onPress={() => selectMother(p)}>
                <Text style={styles.createRefBtnText}>Create Referral</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      {selectedPregnancy && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Referral Details</Text>

          <Text style={styles.label}>Refer To (Facility) *</Text>

          {getNearest().length > 0 && (
            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>Nearest to {motherWard}</Text>
              </View>
              {getNearest().map(f => (
                <TouchableOpacity
                  key={f.id}
                  style={[styles.option, toFacilityId === f.id && styles.optionSelected, styles.optionRecommended]}
                  onPress={() => setToFacilityId(f.id)}
                >
                  <Text style={[styles.optionTitle, toFacilityId === f.id && styles.optionTitleSelected]}>{f.name}</Text>
                  <Text style={styles.optionSub}>{f.level} — {f.type?.replace(/_/g, ' ')}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {getOther().length > 0 && (
            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>Other Facilities</Text>
              </View>
              {getOther().map(f => (
                <TouchableOpacity
                  key={f.id}
                  style={[styles.option, toFacilityId === f.id && styles.optionSelected]}
                  onPress={() => setToFacilityId(f.id)}
                >
                  <Text style={[styles.optionTitle, toFacilityId === f.id && styles.optionTitleSelected]}>{f.name}</Text>
                  <Text style={styles.optionSub}>{f.level} — {f.type?.replace(/_/g, ' ')} — {f.ward}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.label}>Referral Reason *</Text>
          <TextInput style={styles.input} value={referralReason} onChangeText={setReferralReason} placeholder="e.g. High BP, preterm labour" placeholderTextColor="#999" />

          <Text style={styles.label}>Priority</Text>
          <View style={styles.row}>
            {['normal', 'urgent', 'emergency'].map(p => (
              <TouchableOpacity
                key={p}
                style={[styles.chip, priority === p && (p === 'emergency' ? styles.chipEmergency : p === 'urgent' ? styles.chipUrgent : styles.chipSelected)]}
                onPress={() => setPriority(p)}
              >
                <Text style={[styles.chipText, priority === p && styles.chipTextSelected]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput style={[styles.input, styles.textArea]} value={notes} onChangeText={setNotes} placeholderTextColor="#999" multiline />
        </View>
      )}

      <TouchableOpacity style={[styles.submitBtn, saving && { opacity: 0.6 }]} onPress={handleSubmit} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Submit Referral</Text>}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
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
  label: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 4, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, padding: 10, fontSize: 15, backgroundColor: '#FAFAFA' },
  textArea: { height: 80, textAlignVertical: 'top' },
  option: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E0E0E0', marginBottom: 6 },
  optionSelected: { borderColor: '#2980B9', backgroundColor: '#EBF5FB' },
  optionRecommended: { borderColor: '#27AE60', backgroundColor: '#E8F8F5' },
  optionTitle: { fontSize: 15, fontWeight: '600', color: '#2C3E50' },
  optionTitleSelected: { color: '#2980B9' },
  optionSub: { fontSize: 12, color: '#7F8C8D', marginTop: 2 },
  sectionHeader: { marginTop: 8, marginBottom: 4 },
  sectionHeaderText: { fontSize: 13, fontWeight: '700', color: '#27AE60', textTransform: 'uppercase' },
  row: { flexDirection: 'row', gap: 8, marginTop: 4 },
  chip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#E0E0E0' },
  chipSelected: { backgroundColor: '#2980B9', borderColor: '#2980B9' },
  chipUrgent: { backgroundColor: '#F39C12', borderColor: '#F39C12' },
  chipEmergency: { backgroundColor: '#E74C3C', borderColor: '#E74C3C' },
  chipText: { fontSize: 13, color: '#666', textTransform: 'capitalize' },
  chipTextSelected: { color: '#fff' },
  motherRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E0E0E0', marginBottom: 6 },
  motherInfo: { flex: 1 },
  createRefBtn: { backgroundColor: '#2980B9', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14 },
  createRefBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  selectedBadge: { backgroundColor: '#27AE60', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14 },
  selectedBadgeText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  submitBtn: { backgroundColor: '#2980B9', margin: 12, borderRadius: 12, padding: 16, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
