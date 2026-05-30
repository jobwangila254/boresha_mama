import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
  Alert,
} from 'react-native';
import api from '../services/api';
import { useTranslation } from '../context/LanguageContext';

export default function MotherDetailScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { pregnancyId } = route.params;
  const [pregnancy, setPregnancy] = useState(null);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getPregnancy(pregnancyId),
      api.getHomeVisits({ pregnancyId }),
    ]).then(([p, v]) => {
      setPregnancy(p);
      setVisits(v);
    }).catch(() => Alert.alert(t('error'), t('failed_load_details'))).finally(() => setLoading(false));
  }, [pregnancyId]);

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#2980B9" /></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{pregnancy?.mother_name || 'Mother'}</Text>
        <Text style={styles.headerSub}>{pregnancy?.mother_phone}</Text>
      </View>

      {pregnancy && (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Pregnancy Info</Text>
            <View style={styles.row}><Text style={styles.label}>EDD:</Text><Text style={styles.value}>{new Date(pregnancy.edd_date).toLocaleDateString()}</Text></View>
            <View style={styles.row}><Text style={styles.label}>LMP:</Text><Text style={styles.value}>{pregnancy.lmp_date ? new Date(pregnancy.lmp_date).toLocaleDateString() : '—'}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Status:</Text><Text style={styles.value}>{pregnancy.status}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Risk:</Text><Text style={[styles.value, { fontWeight: 'bold', color: pregnancy.risk_level === 'high' ? '#E74C3C' : pregnancy.risk_level === 'medium' ? '#F39C12' : '#27AE60' }]}>{pregnancy.risk_level}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Gravida:</Text><Text style={styles.value}>{pregnancy.gravida}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Parity:</Text><Text style={styles.value}>{pregnancy.parity}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Facility:</Text><Text style={styles.value}>{pregnancy.facility_name || '—'}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Registered by:</Text><Text style={styles.value}>{pregnancy.registered_by_name || 'Unknown'}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Registered:</Text><Text style={styles.value}>{pregnancy.created_at ? new Date(pregnancy.created_at).toLocaleDateString() : '—'}</Text></View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Contact Information</Text>
            <View style={styles.row}><Text style={styles.label}>Phone:</Text><Text style={styles.value}>{pregnancy.mother_phone || '—'}</Text></View>
            {pregnancy.alternate_phone && <View style={styles.row}><Text style={styles.label}>Alt Phone:</Text><Text style={styles.value}>{pregnancy.alternate_phone}</Text></View>}
            {pregnancy.mother_email && <View style={styles.row}><Text style={styles.label}>Email:</Text><Text style={styles.value}>{pregnancy.mother_email}</Text></View>}
            {pregnancy.mother_national_id && <View style={styles.row}><Text style={styles.label}>National ID:</Text><Text style={styles.value}>{pregnancy.mother_national_id}</Text></View>}
            {pregnancy.mother_dob && <View style={styles.row}><Text style={styles.label}>DOB:</Text><Text style={styles.value}>{new Date(pregnancy.mother_dob).toLocaleDateString()}</Text></View>}
            {pregnancy.emergency_contact_name && <View style={styles.row}><Text style={styles.label}>Emergency:</Text><Text style={styles.value}>{pregnancy.emergency_contact_name}</Text></View>}
            {pregnancy.emergency_contact_phone && <View style={styles.row}><Text style={styles.label}>Emerg Phone:</Text><Text style={styles.value}>{pregnancy.emergency_contact_phone}</Text></View>}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Location</Text>
            <View style={styles.row}><Text style={styles.label}>Village:</Text><Text style={styles.value}>{pregnancy.village || '—'}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Sub-location:</Text><Text style={styles.value}>{pregnancy.sub_location || '—'}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Ward:</Text><Text style={styles.value}>{pregnancy.ward || '—'}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Constituency:</Text><Text style={styles.value}>{pregnancy.constituency || '—'}</Text></View>
            <View style={styles.row}><Text style={styles.label}>County:</Text><Text style={styles.value}>{pregnancy.county || '—'}</Text></View>
          </View>
        </>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Home Visits ({visits.length})</Text>
        {visits.length === 0 ? (
          <Text style={styles.emptyText}>No visits recorded yet.</Text>
        ) : (
          visits.slice(0, 5).map(v => (
            <View key={v.id} style={styles.visitItem}>
              <Text style={styles.visitDate}>{new Date(v.visit_date).toLocaleDateString()}</Text>
              <Text style={styles.visitType}>{v.visit_type?.replace(/_/g, ' ')}</Text>
              {v.weight_kg && <Text style={styles.visitDetail}>Weight: {v.weight_kg} kg</Text>}
              {v.blood_pressure_systolic && <Text style={styles.visitDetail}>BP: {v.blood_pressure_systolic}/{v.blood_pressure_diastolic}</Text>}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, backgroundColor: '#2980B9' },
  backBtn: { fontSize: 16, color: '#D5E8F5', marginBottom: 4 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 13, color: '#D5E8F5', marginTop: 2 },
  card: { backgroundColor: '#fff', margin: 12, marginBottom: 0, borderRadius: 12, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50', marginBottom: 12 },
  row: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  label: { fontSize: 14, color: '#7F8C8D', width: 110, maxWidth: '35%' },
  value: { fontSize: 14, color: '#2C3E50', fontWeight: '500' },
  emptyText: { color: '#999', fontSize: 14, textAlign: 'center', padding: 20 },
  visitItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  visitDate: { fontSize: 13, color: '#2980B9', fontWeight: '600' },
  visitType: { fontSize: 13, color: '#666', textTransform: 'capitalize', marginTop: 2 },
  visitDetail: { fontSize: 12, color: '#999', marginTop: 1 },
});
