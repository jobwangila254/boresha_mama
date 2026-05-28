import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Linking, Platform,
} from 'react-native';
import { useTranslation } from '../context/LanguageContext';
import api from '../services/api';

export default function FacilitiesScreen({ navigation }) {
  const { t } = useTranslation();
  const [facilities, setFacilities] = useState([]);
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterWard, setFilterWard] = useState('');

  useEffect(() => {
    loadFacilities();
  }, []);

  async function loadFacilities() {
    setLoading(true);
    try {
      const data = await api.getFacilities({ constituency: 'Kiminini' });
      setFacilities(data);
      setWards([...new Set(data.map(f => f.ward).filter(Boolean))]);
    } catch (err) {
      setFacilities([]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = facilities.filter(f => {
    const matchWard = !filterWard || f.ward === filterWard;
    const matchSearch = !search || f.name.toLowerCase().includes(search.toLowerCase()) || f.ward?.toLowerCase().includes(search.toLowerCase());
    return matchWard && matchSearch;
  });

  function getTypeIcon(type) {
    if (type?.includes('hospital')) return '🏥';
    if (type?.includes('health_center')) return '🏨';
    if (type?.includes('dispensary')) return '💊';
    return '🏥';
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>{t('back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📍 {t('find_facility')}</Text>
        <Text style={styles.headerSub}>{t('trans_nzoia_facilities')}</Text>
      </View>

      <View style={styles.searchCard}>
        <TextInput style={styles.searchInput} placeholder={t('search_facility_or_ward')} placeholderTextColor="#999" value={search} onChangeText={setSearch} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.wardRow}>
          <TouchableOpacity style={[styles.wardChip, !filterWard && styles.wardActive]} onPress={() => setFilterWard('')}>
            <Text style={[styles.wardChipText, !filterWard && styles.wardActiveText]}>{t('all')}</Text>
          </TouchableOpacity>
          {wards.map(w => (
            <TouchableOpacity key={w} style={[styles.wardChip, filterWard === w && styles.wardActive]} onPress={() => setFilterWard(filterWard === w ? '' : w)}>
              <Text style={[styles.wardChipText, filterWard === w && styles.wardActiveText]}>{w}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color="#C0392B" /></View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>{t('no_facilities_connection')}</Text>
        </View>
      ) : (
        filtered.map(f => (
          <View key={f.id} style={styles.facilityCard}>
            <View style={styles.facilityRow}>
              <Text style={styles.facilityIcon}>{getTypeIcon(f.type)}</Text>
              <View style={styles.facilityInfo}>
                <Text style={styles.facilityName}>{f.name}</Text>
                <Text style={styles.facilityDetail}>{f.type?.replace(/_/g, ' ')} — {f.level || 'N/A'}</Text>
                {f.ward && <Text style={styles.facilityDetail}>📍 {f.ward} Ward, Trans-Nzoia</Text>}
                {f.phone && <Text style={styles.facilityDetail}>📞 {f.phone}</Text>}
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              {f.phone && (
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#27AE60' }]} onPress={() => Linking.openURL(`tel:${f.phone}`)}>
                  <Text style={styles.actionBtnText}>{t('call_facility')}</Text>
                </TouchableOpacity>
              )}
              {f.latitude && f.longitude && (
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#C0392B' }]} onPress={() => {
                  const url = Platform.OS === 'ios'
                    ? `maps://app?daddr=${f.latitude},${f.longitude}`
                    : Platform.OS === 'android'
                      ? `geo:${f.latitude},${f.longitude}?q=${f.latitude},${f.longitude}(${encodeURIComponent(f.name)})`
                      : `https://www.google.com/maps/dir/?api=1&destination=${f.latitude},${f.longitude}`;
                  Linking.openURL(url);
                }}>
                  <Text style={styles.actionBtnText}>{t('directions')}</Text>
                </TouchableOpacity>
              )}
            </View>
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
  searchCard: { backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 16, boxShadow: '0 2px 6px rgba(0,0,0,0.1)' },
  searchInput: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, padding: 12, fontSize: 15, backgroundColor: '#FAFAFA' },
  wardRow: { marginTop: 12 },
  wardChip: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#E0E0E0', marginRight: 8 },
  wardActive: { backgroundColor: '#C0392B', borderColor: '#C0392B' },
  wardChipText: { fontSize: 13, color: '#666' },
  wardActiveText: { color: '#fff' },
  emptyCard: { backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 32, alignItems: 'center' },
  emptyText: { color: '#999', fontSize: 14, textAlign: 'center' },
  facilityCard: { backgroundColor: '#fff', margin: 16, marginTop: 0, marginBottom: 12, borderRadius: 14, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  facilityRow: { flexDirection: 'row', gap: 12 },
  facilityIcon: { fontSize: 32 },
  facilityInfo: { flex: 1 },
  facilityName: { fontSize: 16, fontWeight: '700', color: '#2C3E50' },
  facilityDetail: { fontSize: 13, color: '#7F8C8D', marginTop: 2, textTransform: 'capitalize' },
  actionBtn: { flex: 1, borderRadius: 8, padding: 10, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
