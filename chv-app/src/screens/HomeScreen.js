import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import api from '../services/api';
import { offlineStore } from '../store/offlineStore';
import CountyLogo from '../components/CountyLogo';

export default function CHVHomeScreen({ navigation }) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [pregnancies, setPregnancies] = useState([]);
  const [syncStatus, setSyncStatus] = useState({ pendingVisits: 0, pendingRegistrations: 0, totalPending: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [pregs, status] = await Promise.all([
        api.getAssignedMothers(),
        offlineStore.getSyncStatus(),
      ]);
      setPregnancies(pregs);
      setSyncStatus(status);
      setIsOnline(true);
    } catch (err) {
      setIsOnline(false);
      const status = await offlineStore.getSyncStatus();
      setSyncStatus(status);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleSync() {
    try {
      const visits = await offlineStore.getOfflineVisits();
      if (visits.length > 0) {
        await api.syncOfflineVisits(visits);
        await offlineStore.clearSyncedVisits();
      }
      const regs = await offlineStore.getOfflineRegistrations();
      if (regs.length > 0) {
        for (const reg of regs) {
          await api.registerPregnancy(reg);
        }
        await offlineStore.clearSyncedRegistrations();
      }
      setIsOnline(true);
      const status = await offlineStore.getSyncStatus();
      setSyncStatus(status);
    } catch (err) {
      Alert.alert(t('sync_failed'), err.message || t('sync_failed_msg'));
    }
  }

  const highRiskCount = pregnancies.filter(p => p.risk_level === 'high' || p.risk_level === 'critical').length;
  const pendingReferrals = pregnancies.filter(p => p.status === 'active').length;

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#2980B9" /></View>;
  }

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}>
      <View style={styles.brandBar}>
        <CountyLogo size={32} showTagline={false} />
        <Text style={styles.brandText}>Trans-Nzoia County</Text>
      </View>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{t('hello')}, {user?.firstName || t('chv')} 👋</Text>
          <Text style={styles.subtitle}>{t('tagline')}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>{t('log_out')}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.syncBanner, !isOnline && styles.syncBannerOffline]} onPress={handleSync}>
        <Text style={styles.syncText}>
          {isOnline ? t('online_status').replace('{count}', syncStatus.totalPending) : t('offline_status')}
        </Text>
        {syncStatus.totalPending > 0 && <Text style={styles.syncAction}>{t('tap_to_sync')}</Text>}
      </TouchableOpacity>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#EBF5FB' }]}>
          <Text style={styles.statNumber}>{pregnancies.length}</Text>
          <Text style={styles.statLabel}>{t('assigned_mothers')}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#FDEDED' }]}>
          <Text style={[styles.statNumber, { color: '#E74C3C' }]}>{highRiskCount}</Text>
          <Text style={styles.statLabel}>{t('high_risk')}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#FEF9E7' }]}>
          <Text style={[styles.statNumber, { color: '#F39C12' }]}>{syncStatus.totalPending}</Text>
          <Text style={styles.statLabel}>{t('pending_sync')}</Text>
        </View>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('RegisterPregnancy')}>
          <Text style={styles.actionIcon}>➕</Text>
          <Text style={styles.actionText}>Register{'\n'}Pregnancy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('HomeVisits')}>
          <Text style={styles.actionIcon}>📋</Text>
          <Text style={styles.actionText}>Record{'\n'}Home Visit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Referrals')}>
          <Text style={styles.actionIcon}>🔄</Text>
          <Text style={styles.actionText}>Create{'\n'}Referral</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Mothers')}>
          <Text style={styles.actionIcon}>👩‍👧</Text>
          <Text style={styles.actionText}>My{'\n'}Mothers</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('recent_pregnancies')}</Text>
        {pregnancies.slice(0, 5).map(p => (
          <TouchableOpacity key={p.id} style={styles.motherCard} onPress={() => navigation.navigate('MotherDetail', { pregnancyId: p.id })}>
            <View style={styles.motherInfo}>
              <Text style={styles.motherName}>{p.mother_name}</Text>
              <Text style={styles.motherPhone}>{p.mother_phone}</Text>
              <Text style={styles.motherDue}>{t('edd')}: {new Date(p.edd_date).toLocaleDateString()}</Text>
            </View>
            <Text style={[styles.riskBadge, p.risk_level === 'high' && styles.riskHigh, p.risk_level === 'medium' && styles.riskMedium, p.risk_level === 'low' && styles.riskLow]}>
              {p.risk_level}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  brandBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#004d26', paddingVertical: 4, paddingHorizontal: 16, gap: 6 },
  brandText: { color: '#FFD700', fontSize: 11, fontWeight: '600', letterSpacing: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#006633' },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 13, color: '#D5E8F5', marginTop: 2 },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  logoutText: { color: '#fff', fontWeight: '600' },
  syncBanner: { backgroundColor: '#D5F5E3', padding: 12, margin: 12, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between' },
  syncBannerOffline: { backgroundColor: '#FDEDED' },
  syncText: { fontSize: 13, fontWeight: '500', color: '#2C3E50' },
  syncAction: { color: '#2980B9', fontWeight: '600', fontSize: 13 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 8, marginBottom: 12 },
  statCard: { flex: 1, borderRadius: 10, padding: 14, alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#2C3E50' },
  statLabel: { fontSize: 11, color: '#7F8C8D', marginTop: 2, textAlign: 'center' },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8 },
  actionBtn: { width: '48%', backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', elevation: 2, flexDirection: 'row', gap: 12 },
  actionIcon: { fontSize: 28 },
  actionText: { fontSize: 13, fontWeight: '600', color: '#2C3E50' },
  section: { padding: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50', marginBottom: 12 },
  motherCard: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 1 },
  motherInfo: { flex: 1 },
  motherName: { fontSize: 16, fontWeight: '600', color: '#2C3E50' },
  motherPhone: { fontSize: 13, color: '#7F8C8D', marginTop: 2 },
  motherDue: { fontSize: 12, color: '#2980B9', marginTop: 2 },
  riskBadge: { fontSize: 11, fontWeight: 'bold', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, overflow: 'hidden', color: '#fff' },
  riskLow: { backgroundColor: '#27AE60' },
  riskMedium: { backgroundColor: '#F39C12' },
  riskHigh: { backgroundColor: '#E74C3C' },
});
