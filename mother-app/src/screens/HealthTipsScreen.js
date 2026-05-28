import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useTranslation } from '../context/LanguageContext';
import api from '../services/api';

const CATEGORIES = ['all', 'nutrition', 'danger_signs', 'exercise', 'general'];

export default function HealthTipsScreen({ navigation }) {
  const { t, language } = useTranslation();
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');

  useEffect(() => {
    loadTips();
  }, []);

  async function loadTips() {
    try {
      const data = await api.getHealthTips();
      setTips(data);
    } catch (err) {
      setTips([]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = category === 'all' ? tips : tips.filter(t => t.category === category);

  function getContent(tip) {
    return language === 'sw' && tip.content_sw ? tip.content_sw : tip.content_en;
  }

  function getTrimesterLabel(trimester) {
    if (!trimester) return '';
    const labels = { 1: t('trimester_1'), 2: t('trimester_2'), 3: t('trimester_3') };
    return labels[trimester] || '';
  }

  const categoryLabels = {
    all: t('all'),
    nutrition: t('cat_nutrition'),
    danger_signs: t('cat_danger_signs'),
    exercise: t('cat_exercise'),
    general: t('cat_general'),
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>{t('back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>💡 {t('health_tips')}</Text>
        <Text style={styles.headerSub}>{t('evidenced_based_advice')}</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow}>
        {CATEGORIES.map(c => (
          <TouchableOpacity key={c} style={[styles.catChip, category === c && styles.catActive]} onPress={() => setCategory(c)}>
            <Text style={[styles.catChipText, category === c && styles.catActiveText]}>{categoryLabels[c]}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color="#C0392B" /></View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>{t('no_tips_category')}</Text>
        </View>
      ) : (
        filtered.map(tip => (
          <View key={tip.id} style={styles.tipCard}>
            <View style={styles.tipHeader}>
              <Text style={styles.tipTitle}>{tip.title}</Text>
              {tip.trimester && <Text style={styles.tipTrimester}>{getTrimesterLabel(tip.trimester)}</Text>}
            </View>
            <Text style={styles.tipContent}>{getContent(tip)}</Text>
            {tip.category && <Text style={styles.tipCategory}>{tip.category.replace(/_/g, ' ')}</Text>}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5F5' },
  header: { padding: 20, paddingBottom: 8 },
  backBtn: { fontSize: 16, color: '#C0392B', marginBottom: 8 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#2C3E50' },
  headerSub: { fontSize: 13, color: '#7F8C8D', marginTop: 4 },
  centered: { padding: 40, alignItems: 'center' },
  catRow: { paddingHorizontal: 16, marginBottom: 8 },
  catChip: { paddingVertical: 8, paddingHorizontal: 18, borderRadius: 20, borderWidth: 1, borderColor: '#E0E0E0', marginRight: 8, backgroundColor: '#fff' },
  catActive: { backgroundColor: '#C0392B', borderColor: '#C0392B' },
  catChipText: { fontSize: 13, color: '#666', textTransform: 'capitalize' },
  catActiveText: { color: '#fff' },
  emptyCard: { backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 32, alignItems: 'center' },
  emptyText: { color: '#999', fontSize: 14, textAlign: 'center' },
  tipCard: { backgroundColor: '#fff', margin: 16, marginTop: 0, marginBottom: 12, borderRadius: 14, padding: 18, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  tipHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  tipTitle: { fontSize: 16, fontWeight: '700', color: '#2C3E50', flex: 1 },
  tipTrimester: { fontSize: 11, color: '#C0392B', fontWeight: '600', backgroundColor: '#FDEDED', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginLeft: 8 },
  tipContent: { fontSize: 14, color: '#555', lineHeight: 20 },
  tipCategory: { fontSize: 11, color: '#999', marginTop: 8, textTransform: 'capitalize' },
});
