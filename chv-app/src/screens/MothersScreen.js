import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
  Alert,
} from 'react-native';
import api from '../services/api';
import { useTranslation } from '../context/LanguageContext';

export default function MothersScreen({ navigation }) {
  const { t } = useTranslation();
  const [pregnancies, setPregnancies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAssignedMothers().then(setPregnancies).catch(() => Alert.alert(t('error'), t('failed_load_mothers'))).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#2980B9" /></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← {t('back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('my_mothers')}</Text>
        <Text style={styles.headerSub}>{pregnancies.length} {t('assigned_mothers')}</Text>
      </View>

      {pregnancies.length === 0 ? (
        <View style={styles.empty}><Text style={styles.emptyText}>{t('no_pregnancies')}</Text></View>
      ) : (
        pregnancies.map(p => (
          <TouchableOpacity key={p.id} style={styles.card} onPress={() => navigation.navigate('MotherDetail', { pregnancyId: p.id })}>
            <View style={styles.cardRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(p.mother_name || 'M')[0]}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{p.mother_name}</Text>
                <Text style={styles.phone}>{p.mother_phone}</Text>
                <Text style={styles.due}>{t('edd')}: {p.edd_date ? new Date(p.edd_date).toLocaleDateString() : 'N/A'}</Text>
              </View>
              <Text style={[styles.risk, p.risk_level === 'high' && styles.riskHigh, p.risk_level === 'medium' && styles.riskMedium, p.risk_level === 'low' && styles.riskLow]}>
                {p.risk_level}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      )}
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
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#999', fontSize: 15 },
  card: { backgroundColor: '#fff', margin: 12, marginBottom: 0, borderRadius: 12, padding: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2980B9', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: '#2C3E50' },
  phone: { fontSize: 13, color: '#7F8C8D' },
  due: { fontSize: 12, color: '#2980B9', marginTop: 2 },
  risk: { fontSize: 11, fontWeight: 'bold', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, color: '#fff' },
  riskLow: { backgroundColor: '#27AE60' },
  riskMedium: { backgroundColor: '#F39C12' },
  riskHigh: { backgroundColor: '#E74C3C' },
});
