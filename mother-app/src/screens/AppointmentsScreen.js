import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, TextInput, Platform,
} from 'react-native';
import { useTranslation } from '../context/LanguageContext';
import api from '../services/api';
import { facilityStore } from '../store/facilityStore';

const REASONS = [
  'Routine checkup',
  'Vaccination',
  'Feeling unwell',
  'Lab results review',
  'Follow-up',
  'Emergency',
  'Ultrasound',
  'Other',
];

export default function AppointmentsScreen() {
  const { t } = useTranslation();
  const [appointments, setAppointments] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [wards, setWards] = useState([]);
  const [pregnancies, setPregnancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [booking, setBooking] = useState({ facilityId: '', appointmentDate: '', visitType: 'antenatal', reason: '' });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('upcoming');
  const [search, setSearch] = useState('');
  const [filterWard, setFilterWard] = useState('');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [apts, facs, pregs] = await Promise.all([
        api.getAppointments(),
        api.getFacilities(),
        api.getPregnancies(),
      ]);
      setAppointments(apts);
      setFacilities(facs);
      setWards([...new Set(facs.map(f => f.ward).filter(Boolean))]);
      setPregnancies(pregs);
      facilityStore.cacheFacilities(facs);
    } catch (err) {
        const cached = await facilityStore.getCachedFacilities();
        if (cached.length > 0) {
          setFacilities(cached);
          setWards([...new Set(cached.map(f => f.ward).filter(Boolean))]);
        }
    } finally {
      setLoading(false);
    }
  }

  async function handleBook() {
    if (!booking.facilityId || !booking.appointmentDate) {
      Alert.alert(t('error'), t('select_facility_date'));
      return;
    }
    const activePreg = pregnancies.find(p => p.status === 'active');
    if (!activePreg) {
      Alert.alert(t('error'), t('no_active_pregnancy'));
      return;
    }
    setSaving(true);
    try {
      await api.createAppointment({
        pregnancyId: activePreg.id,
        motherId: activePreg.mother_id,
        facilityId: booking.facilityId,
        appointmentDate: booking.appointmentDate,
        visitType: booking.visitType,
        reason: booking.reason,
      });
      Alert.alert(t('success'), t('appointment_booked'));
      setShowBooking(false);
      setBooking({ facilityId: '', appointmentDate: '', visitType: 'antenatal', reason: '' });
      const apts = await api.getAppointments();
      setAppointments(apts);
    } catch (err) {
      Alert.alert(t('error'), err.message);
    } finally {
      setSaving(false);
    }
  }

  const filteredFacilities = facilities.filter(f => {
    const matchWard = !filterWard || f.ward === filterWard;
    const matchSearch = !search || f.name.toLowerCase().includes(search.toLowerCase()) || f.ward?.toLowerCase().includes(search.toLowerCase());
    return matchWard && matchSearch;
  });

  const filteredAppointments = appointments.filter(a =>
    tab === 'upcoming' ? a.status === 'scheduled' : a.status !== 'scheduled'
  );

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#C0392B" /></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('appointments')}</Text>
        <TouchableOpacity style={styles.bookBtn} onPress={() => setShowBooking(true)}>
          <Text style={styles.bookBtnText}>+ {t('book')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, tab === 'upcoming' && styles.tabActive]} onPress={() => setTab('upcoming')}>
          <Text style={[styles.tabText, tab === 'upcoming' && styles.tabTextActive]}>{t('upcoming')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'history' && styles.tabActive]} onPress={() => setTab('history')}>
          <Text style={[styles.tabText, tab === 'history' && styles.tabTextActive]}>{t('appointment_history')}</Text>
        </TouchableOpacity>
      </View>

      {filteredAppointments.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{t('no_appointments')}</Text>
        </View>
      ) : (
        filteredAppointments.map(apt => (
          <View key={apt.id} style={styles.aptCard}>
            <View style={styles.aptHeader}>
              <Text style={styles.aptDate}>{new Date(apt.appointment_date).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })}</Text>
              <Text style={[styles.aptStatus, apt.status === 'scheduled' && styles.statusScheduled, apt.status === 'confirmed' && styles.statusConfirmed, apt.status === 'completed' && styles.statusCompleted, apt.status === 'cancelled' && styles.statusCancelled]}>
                {apt.status === 'scheduled' ? t('pending_confirmation') : t(apt.status)}
              </Text>
            </View>
            <Text style={styles.aptType}>{apt.visit_type.replace(/_/g, ' ')}</Text>
            <Text style={styles.aptFacility}>{apt.facility_name}</Text>
          </View>
        ))
      )}

      {showBooking && (
        <View style={styles.modal}>
          <View style={styles.bookingForm}>
            <Text style={styles.bookingTitle}>{t('book_appointment')}</Text>

            <Text style={styles.label}>{t('facility')}</Text>
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
            {filteredFacilities.length === 0 ? (
              <Text style={styles.noFacilities}>{t('no_facilities_filter')}</Text>
            ) : (
              filteredFacilities.map(f => (
                <TouchableOpacity key={f.id} style={[styles.facilityOption, booking.facilityId === f.id && styles.facilitySelected]} onPress={() => setBooking(prev => ({ ...prev, facilityId: f.id }))}>
                  <Text style={[styles.facilityText, booking.facilityId === f.id && styles.facilityTextSelected]}>{f.name}</Text>
                  <Text style={styles.facilityDist}>{f.type} - {f.ward}</Text>
                </TouchableOpacity>
              ))
            )}

            <Text style={styles.label}>{t('visit_type')}</Text>
            <View style={styles.visitRow}>
              {['antenatal', 'postnatal', 'follow_up', 'emergency'].map(type => (
                <TouchableOpacity key={type} style={[styles.visitOption, booking.visitType === type && styles.visitSelected]} onPress={() => setBooking(prev => ({ ...prev, visitType: type }))}>
                  <Text style={[styles.visitText, booking.visitType === type && styles.visitTextSelected]}>{type.replace('_', ' ')}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>{t('date')}</Text>
            {Platform.OS === 'web' ? (
              <input
                type="date"
                style={webDateInput}
                value={booking.appointmentDate}
                onChange={e => setBooking(prev => ({ ...prev, appointmentDate: e.target.value }))}
              />
            ) : (
              <TextInput style={styles.input} value={booking.appointmentDate} onChangeText={v => setBooking(prev => ({ ...prev, appointmentDate: v }))} placeholder="YYYY-MM-DD" placeholderTextColor="#999" />
            )}

            <Text style={styles.label}>{t('reason')}</Text>
            <View style={styles.reasonRow}>
              {REASONS.map(r => (
                <TouchableOpacity
                  key={r}
                  style={[styles.reasonOption, booking.reason === r && styles.reasonSelected]}
                  onPress={() => setBooking(prev => ({ ...prev, reason: prev.reason === r ? '' : r }))}
                >
                  <Text style={[styles.reasonText, booking.reason === r && styles.reasonTextSelected]}>{t('reason_' + r.toLowerCase().replace(/ /g, '_'))}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowBooking(false)}>
                <Text style={styles.cancelBtnText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmBtn, saving && { opacity: 0.6 }]} onPress={handleBook} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmBtnText}>{t('book')}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const webDateInput = {
  width: '100%',
  padding: 12,
  fontSize: 16,
  borderWidth: 1,
  borderColor: '#E0E0E0',
  borderRadius: 10,
  backgroundColor: '#FAFAFA',
  fontFamily: 'inherit',
  color: '#2C3E50',
  boxSizing: 'border-box',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5F5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF5F5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 8 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#2C3E50' },
  bookBtn: { backgroundColor: '#C0392B', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  bookBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  tabRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, backgroundColor: '#fff', borderRadius: 10, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#C0392B' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#666' },
  tabTextActive: { color: '#fff' },
  aptCard: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8, borderRadius: 12, padding: 16, elevation: 2 },
  aptHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  aptDate: { fontSize: 14, fontWeight: '600', color: '#2C3E50' },
  aptStatus: { fontSize: 11, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, overflow: 'hidden', color: '#fff' },
  statusScheduled: { backgroundColor: '#F39C12' },
  statusConfirmed: { backgroundColor: '#3498DB' },
  statusCompleted: { backgroundColor: '#27AE60' },
  statusCancelled: { backgroundColor: '#95A5A6' },
  aptType: { fontSize: 16, fontWeight: '600', color: '#2C3E50', textTransform: 'capitalize', marginBottom: 4 },
  aptFacility: { fontSize: 13, color: '#7F8C8D' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#999' },
  modal: { backgroundColor: 'rgba(0,0,0,0.5)', padding: 16, marginTop: 8, borderRadius: 16 },
  bookingForm: { backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  bookingTitle: { fontSize: 20, fontWeight: 'bold', color: '#2C3E50', marginBottom: 16, textAlign: 'center' },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6, marginTop: 12 },
  searchInput: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, padding: 10, fontSize: 14, backgroundColor: '#FAFAFA', marginBottom: 8 },
  wardRow: { marginBottom: 8 },
  wardChip: { paddingVertical: 5, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: '#E0E0E0', marginRight: 6 },
  wardActive: { backgroundColor: '#C0392B', borderColor: '#C0392B' },
  wardChipText: { fontSize: 12, color: '#666' },
  wardActiveText: { color: '#fff' },
  noFacilities: { fontSize: 13, color: '#999', textAlign: 'center', padding: 12 },
  facilityOption: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E0E0E0', marginBottom: 6 },
  facilitySelected: { borderColor: '#C0392B', backgroundColor: '#FFF0F0' },
  facilityText: { fontSize: 15, fontWeight: '600', color: '#2C3E50' },
  facilityTextSelected: { color: '#C0392B' },
  facilityDist: { fontSize: 12, color: '#7F8C8D' },
  visitRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  visitOption: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#E0E0E0' },
  visitSelected: { backgroundColor: '#C0392B', borderColor: '#C0392B' },
  visitText: { fontSize: 13, color: '#666', textTransform: 'capitalize' },
  visitTextSelected: { color: '#fff' },
  input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, padding: 12, fontSize: 16, backgroundColor: '#FAFAFA' },
  reasonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  reasonOption: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#E0E0E0', marginBottom: 4 },
  reasonSelected: { backgroundColor: '#C0392B', borderColor: '#C0392B' },
  reasonText: { fontSize: 13, color: '#666' },
  reasonTextSelected: { color: '#fff' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  cancelBtn: { flex: 1, padding: 14, alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: '#E0E0E0', marginRight: 8 },
  cancelBtnText: { fontSize: 16, color: '#666', fontWeight: '600' },
  confirmBtn: { flex: 1, backgroundColor: '#C0392B', padding: 14, alignItems: 'center', borderRadius: 10, marginLeft: 8 },
  confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
