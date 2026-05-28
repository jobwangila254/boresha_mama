import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import api from '../services/api';
import CountyLogo from '../components/CountyLogo';

function weeksBetween(d1, d2) {
  const diff = Math.abs(d2 - d1);
  return Math.floor(diff / (7 * 86400000));
}

function daysBetween(d1, d2) {
  return Math.floor(Math.abs(d2 - d1) / 86400000);
}

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [pregnancy, setPregnancy] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const pregnancies = await api.getPregnancies();
      if (pregnancies.length > 0) {
        const latest = pregnancies.reduce((a, b) => new Date(a.created_at) > new Date(b.created_at) ? a : b);
        setPregnancy(latest);
        try {
          const tl = await api.getPregnancyTimeline(latest.id);
          setTimeline(tl);
        } catch (e) {
          // timeline may fail for non-active pregnancies
        }
      }
    } catch (err) {
      console.warn('Failed to load pregnancy data:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function onRefresh() {
    setRefreshing(true);
    loadData();
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#C0392B" />
        <Text style={styles.loadingText}>{t('loading_pregnancy')}</Text>
      </View>
    );
  }

  if (!pregnancy) {
    return (
      <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.brandBar}>
          <CountyLogo size={28} showTagline={false} />
          <Text style={styles.brandText}>Trans-Nzoia County</Text>
        </View>
        <View style={styles.greeting}>
          <Text style={styles.greetingText}>{t('hello')}, {user?.firstName || t('mother')} 👋</Text>
          <Text style={styles.greetingSub}>{t('welcome')}</Text>
        </View>
        <View style={styles.onboardingCard}>
          <Text style={styles.onboardIcon}>👶</Text>
          <Text style={styles.onboardTitle}>{t('welcome_title')}</Text>
          <Text style={styles.onboardText}>{t('onboarding_text')}</Text>
        </View>
        <View style={styles.dangerSection}>
          <Text style={styles.dangerTitle}>🚨 {t('danger_signs')}</Text>
          <Text style={styles.dangerText}>{t('danger_signs_warning')}</Text>
          <Text style={styles.emergencyText}>{t('emergency_call')}</Text>
        </View>
      </ScrollView>
    );
  }

  const gestWeeks = pregnancy.lmp_date ? weeksBetween(new Date(pregnancy.lmp_date), new Date()) : null;
  const isActive = pregnancy.status === 'active';
  const isDelivered = pregnancy.status === 'delivered';
  const postnatalWeeks = isDelivered && pregnancy.delivered_at ? weeksBetween(new Date(pregnancy.delivered_at), new Date()) : null;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.brandBar}>
        <CountyLogo size={28} showTagline={false} />
        <Text style={styles.brandText}>Trans-Nzoia County</Text>
      </View>
      <View style={styles.greeting}>
        <Text style={styles.greetingText}>{t('hello')}, {user?.firstName || t('mother')} 👋</Text>
        <Text style={styles.greetingSub}>{t('welcome')}</Text>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Monitoring')}>
          <Text style={styles.actionIcon}>📊</Text>
          <Text style={styles.actionText}>{t('record')}{'\n'}{t('measurements')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Appointments')}>
          <Text style={styles.actionIcon}>📅</Text>
          <Text style={styles.actionText}>{t('book')}{'\n'}{t('appointment')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Facilities')}>
          <Text style={styles.actionIcon}>📍</Text>
          <Text style={styles.actionText}>{t('find')}{'\n'}{t('facility')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('HealthTips')}>
          <Text style={styles.actionIcon}>💡</Text>
          <Text style={styles.actionText}>{t('health_tips')}</Text>
        </TouchableOpacity>
      </View>

      {isActive && (
        <View style={styles.pregnancyCard}>
          <Text style={styles.cardTitle}>{t('my_pregnancy')}</Text>
          <View style={styles.weekRow}>
            <View style={styles.weekCircle}>
              <Text style={styles.weekNumber}>{gestWeeks}</Text>
              <Text style={styles.weekLabel}>{t('weeks')}</Text>
            </View>
            <View style={styles.dueInfo}>
              <Text style={styles.dueLabel}>{t('due_date')}</Text>
              <Text style={styles.dueDate}>{new Date(pregnancy.edd_date).toDateString()}</Text>
              {timeline?.weeksRemaining !== undefined && (
                <Text style={styles.remainLabel}>{timeline.weeksRemaining} {t('weeks_remaining')}</Text>
              )}
            </View>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>{t('lmp')}</Text>
              <Text style={styles.statValue}>{new Date(pregnancy.lmp_date).toLocaleDateString()}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>{t('gravida')}</Text>
              <Text style={styles.statValue}>{pregnancy.gravida}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>{t('parity')}</Text>
              <Text style={styles.statValue}>{pregnancy.parity}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>{t('ward')}</Text>
              <Text style={styles.statValue}>{pregnancy.mother_ward || t('na_label')}</Text>
            </View>
          </View>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, pregnancy.risk_level === 'high' && styles.riskHigh, pregnancy.risk_level === 'medium' && styles.riskMedium, pregnancy.risk_level === 'low' && styles.riskLow]}>
              <Text style={styles.badgeText}>{t('risk_' + pregnancy.risk_level)}</Text>
            </View>
            <View style={[styles.badge, styles.statusBadge]}>
              <Text style={styles.badgeText}>{t('status_active')}</Text>
            </View>
          </View>
        </View>
      )}

      {isDelivered && (
        <>
          <View style={styles.deliveredCard}>
          <Text style={styles.cardTitle}>{t('congratulations')}</Text>
            <Text style={styles.deliveredSub}>{t('baby_arrived')} {daysBetween(new Date(pregnancy.delivered_at), new Date())} {t('days_ago')}</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>{t('delivery_date')}</Text>
                <Text style={styles.statValue}>{new Date(pregnancy.delivered_at).toDateString()}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>{t('postnatal_week')}</Text>
                <Text style={styles.statValue}>{postnatalWeeks}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>{t('gravida')}</Text>
                <Text style={styles.statValue}>{pregnancy.gravida}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>{t('parity')}</Text>
                <Text style={styles.statValue}>{pregnancy.parity}</Text>
              </View>
            </View>
            <View style={styles.postnatalReminder}>
              <Text style={styles.reminderIcon}>📋</Text>
              <View style={styles.reminderContent}>
                <Text style={styles.reminderTitle}>{t('postnatal_checkup')}</Text>
                <Text style={styles.reminderText}>{t('postnatal_checkup_text')}</Text>
              </View>
            </View>
          </View>
          <View style={styles.breastfeedingCard}>
            <Text style={styles.breastfeedTitle}>{t('breastfeeding')}</Text>
            <Text style={styles.breastfeedText}>{t('breastfeeding_text')}</Text>
          </View>
        </>
      )}

      {pregnancy.chv_first_name && (
        <View style={styles.chvCard}>
          <Text style={styles.chvLabel}>{t('your_chv')}</Text>
          <Text style={styles.chvName}>{pregnancy.chv_first_name} {pregnancy.chv_last_name}</Text>
          {pregnancy.chv_phone && <Text style={styles.chvPhone}>{pregnancy.chv_phone}</Text>}
        </View>
      )}

      {timeline?.appointments?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('upcoming_appointments')}</Text>
          {timeline.appointments.filter(a => a.status === 'scheduled').slice(0, 3).map(apt => (
            <View key={apt.id} style={styles.appointmentCard}>
              <Text style={styles.aptDate}>{new Date(apt.appointment_date).toDateString()}</Text>
              <Text style={styles.aptType}>{apt.visit_type.replace('_', ' ')}</Text>
            </View>
          ))}
        </View>
      )}

      {timeline?.healthTips?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('health_tips')}</Text>
          {timeline.healthTips.slice(0, 2).map(tip => (
            <View key={tip.id} style={styles.tipCard}>
              <Text style={styles.tipTitle}>{tip.title}</Text>
              <Text style={styles.tipContent}>{tip.content_en}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.dangerSection}>
        <Text style={styles.dangerTitle}>🚨 {t('danger_signs')}</Text>
        <Text style={styles.dangerText}>
          {isDelivered ? t('danger_signs_postpartum') : t('danger_signs_warning')}
        </Text>
        <Text style={styles.emergencyText}>{t('emergency_call')}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  brandBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#004d26', paddingVertical: 4, paddingHorizontal: 16, gap: 6 },
  brandText: { color: '#FFD700', fontSize: 11, fontWeight: '600', letterSpacing: 1 },
  container: { flex: 1, backgroundColor: '#FFF5F5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF5F5' },
  loadingText: { marginTop: 12, color: '#666', fontSize: 16 },
  greeting: { padding: 20, paddingBottom: 8 },
  greetingText: { fontSize: 24, fontWeight: 'bold', color: '#2C3E50' },
  greetingSub: { fontSize: 14, color: '#7F8C8D', marginTop: 2 },
  pregnancyCard: { backgroundColor: '#fff', margin: 16, marginTop: 8, borderRadius: 16, padding: 20, elevation: 3, boxShadow: '0 2px 6px rgba(0,0,0,0.1)' },
  deliveredCard: { backgroundColor: '#fff', margin: 16, marginTop: 8, borderRadius: 16, padding: 20, elevation: 3, boxShadow: '0 2px 6px rgba(0,0,0,0.1)', borderLeftWidth: 4, borderLeftColor: '#27AE60' },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#2C3E50', marginBottom: 4 },
  deliveredSub: { fontSize: 14, color: '#7F8C8D', marginBottom: 16 },
  weekRow: { flexDirection: 'row', alignItems: 'center' },
  weekCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#C0392B', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  weekNumber: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  weekLabel: { fontSize: 12, color: '#fff', marginTop: -2 },
  dueInfo: { flex: 1 },
  dueLabel: { fontSize: 12, color: '#7F8C8D' },
  dueDate: { fontSize: 16, fontWeight: '600', color: '#2C3E50' },
  remainLabel: { fontSize: 13, color: '#C0392B', marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 16, gap: 1, backgroundColor: '#F0F0F0', borderRadius: 8, overflow: 'hidden' },
  statBox: { width: '50%', backgroundColor: '#FAFAFA', padding: 10 },
  statLabel: { fontSize: 11, color: '#7F8C8D' },
  statValue: { fontSize: 14, fontWeight: '600', color: '#2C3E50', marginTop: 2 },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  riskLow: { backgroundColor: '#27AE60' },
  riskMedium: { backgroundColor: '#F39C12' },
  riskHigh: { backgroundColor: '#E74C3C' },
  statusBadge: { backgroundColor: '#3498DB' },
  badgeText: { fontSize: 11, fontWeight: 'bold', color: '#fff' },
  postnatalReminder: { flexDirection: 'row', backgroundColor: '#E8F8F5', borderRadius: 10, padding: 14, marginTop: 16, gap: 10 },
  reminderIcon: { fontSize: 24 },
  reminderContent: { flex: 1 },
  reminderTitle: { fontSize: 14, fontWeight: '600', color: '#1E8449' },
  reminderText: { fontSize: 12, color: '#555', marginTop: 2, lineHeight: 16 },
  breastfeedingCard: { backgroundColor: '#FFF0F5', margin: 16, marginTop: 0, borderRadius: 12, padding: 16, borderLeftWidth: 3, borderLeftColor: '#E91E63' },
  breastfeedTitle: { fontSize: 15, fontWeight: '600', color: '#C0392B' },
  breastfeedText: { fontSize: 13, color: '#555', marginTop: 4, lineHeight: 18 },
  chvCard: { backgroundColor: '#EBF5FB', margin: 16, marginTop: 0, borderRadius: 12, padding: 14, borderLeftWidth: 3, borderLeftColor: '#2980B9' },
  chvLabel: { fontSize: 11, color: '#2980B9', fontWeight: '600', textTransform: 'uppercase' },
  chvName: { fontSize: 15, fontWeight: '600', color: '#2C3E50', marginTop: 2 },
  chvPhone: { fontSize: 13, color: '#7F8C8D', marginTop: 1 },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 },
  actionCard: { width: '46%', backgroundColor: '#fff', margin: '2%', borderRadius: 12, padding: 16, alignItems: 'center', elevation: 2, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  actionIcon: { fontSize: 32, marginBottom: 8 },
  actionText: { fontSize: 13, fontWeight: '600', color: '#2C3E50', textAlign: 'center' },
  dangerSection: { backgroundColor: '#FDEDED', margin: 16, borderRadius: 12, padding: 16, borderLeftWidth: 4, borderLeftColor: '#E74C3C' },
  dangerTitle: { fontSize: 16, fontWeight: 'bold', color: '#C0392B', marginBottom: 8 },
  dangerText: { fontSize: 13, color: '#555', lineHeight: 20 },
  emergencyText: { fontSize: 14, fontWeight: 'bold', color: '#C0392B', marginTop: 8 },
  section: { margin: 16, marginTop: 0 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50', marginBottom: 12 },
  appointmentCard: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8, elevation: 1 },
  aptDate: { fontSize: 14, fontWeight: '600', color: '#2C3E50' },
  aptType: { fontSize: 13, color: '#7F8C8D', textTransform: 'capitalize', marginTop: 4 },
  tipCard: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8, elevation: 1 },
  tipTitle: { fontSize: 15, fontWeight: '600', color: '#2C3E50', marginBottom: 4 },
  tipContent: { fontSize: 13, color: '#555', lineHeight: 18 },
  onboardingCard: { backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 24, alignItems: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' },
  onboardIcon: { fontSize: 48, marginBottom: 12 },
  onboardTitle: { fontSize: 20, fontWeight: 'bold', color: '#C0392B', textAlign: 'center', marginBottom: 8 },
  onboardText: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20 },
});
