import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, TextInput,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import api from '../services/api';

export default function ProfileScreen({ navigation }) {
  const { user, logout, setUser } = useAuth();
  const { language, setLanguage, t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    email: user?.email || '',
    alternatePhone: user?.alternate_phone || '',
  });

  async function handleLanguageChange(value) {
    await setLanguage(value);
    try {
      await api.updateProfile({ preferred_language: value });
    } catch (err) {
      // silent
    }
  }

  async function handleSaveProfile() {
    try {
      await api.updateProfile({
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email,
        alternate_phone: form.alternatePhone,
      });
      setUser(prev => ({ ...prev, ...form, alternate_phone: form.alternatePhone }));
      setEditing(false);
      Alert.alert(t('success'), t('profile_updated'));
    } catch (err) {
      Alert.alert(t('error'), err.message);
    }
  }

  async function handleLogout() {
    Alert.alert(t('logout'), t('logout_confirm'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('logout'), style: 'destructive', onPress: logout },
    ]);
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </Text>
        </View>
        <Text style={styles.name}>{user?.first_name} {user?.last_name}</Text>
        <Text style={styles.phone}>{user?.phone}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('personal_information')}</Text>
        {editing ? (
          <>
            <Text style={styles.label}>{t('first_name')}</Text>
            <TextInput style={styles.input} value={form.firstName} onChangeText={v => setForm(prev => ({ ...prev, firstName: v }))} />
            <Text style={styles.label}>{t('last_name')}</Text>
            <TextInput style={styles.input} value={form.lastName} onChangeText={v => setForm(prev => ({ ...prev, lastName: v }))} />
            <Text style={styles.label}>{t('email')}</Text>
            <TextInput style={styles.input} value={form.email} onChangeText={v => setForm(prev => ({ ...prev, email: v }))} keyboardType="email-address" />
            <Text style={styles.label}>{t('alternate_phone')}</Text>
            <TextInput style={styles.input} value={form.alternatePhone} onChangeText={v => setForm(prev => ({ ...prev, alternatePhone: v }))} keyboardType="phone-pad" />
            <View style={styles.editActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(false)}>
                <Text style={styles.cancelBtnText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile}>
                <Text style={styles.saveBtnText}>{t('save')}</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('name')}</Text>
              <Text style={styles.infoValue}>{user?.first_name} {user?.last_name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('phone')}</Text>
              <Text style={styles.infoValue}>{user?.phone}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('national_id_optional')}</Text>
              <Text style={styles.infoValue}>{user?.national_id || t('na_label')}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('role')}</Text>
              <Text style={styles.infoValue}>{user?.role}</Text>
            </View>
            {user?.date_of_birth && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('date_of_birth')}</Text>
                <Text style={styles.infoValue}>{new Date(user.date_of_birth).toDateString()}</Text>
              </View>
            )}
            {user?.ward && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('ward')}</Text>
                <Text style={styles.infoValue}>{user.ward}</Text>
              </View>
            )}
            {user?.village && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('village')}</Text>
                <Text style={styles.infoValue}>{user.village}</Text>
              </View>
            )}
            {user?.constituency && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('constituency')}</Text>
                <Text style={styles.infoValue}>{user.constituency}</Text>
              </View>
            )}
            {user?.email && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('email')}</Text>
                <Text style={styles.infoValue}>{user?.email}</Text>
              </View>
            )}
            {user?.emergency_contact_name && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('emergency_contact_name_label')}</Text>
                <Text style={styles.infoValue}>{user.emergency_contact_name}</Text>
              </View>
            )}
            {user?.emergency_contact_phone && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('emergency_phone')}</Text>
                <Text style={styles.infoValue}>{user.emergency_contact_phone}</Text>
              </View>
            )}
            {user?.alternate_phone && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('alternate_phone')}</Text>
                <Text style={styles.infoValue}>{user.alternate_phone}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)}>
              <Text style={styles.editBtnText}>{t('edit_profile')}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('language')}</Text>
        <View style={styles.langRow}>
          <Text style={styles.langLabel}>{t('english')}</Text>
          <Switch
            value={language === 'sw'}
            onValueChange={val => handleLanguageChange(val ? 'sw' : 'en')}
            trackColor={{ false: '#E0E0E0', true: '#C0392B' }}
            thumbColor={language === 'sw' ? '#fff' : '#fff'}
          />
          <Text style={styles.langLabel}>{t('swahili')}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('about')}</Text>
        <Text style={styles.aboutText}>{t('version')}</Text>
        <Text style={styles.aboutText}>{t('about_app')}</Text>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>{t('logout')}</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5F5' },
  profileHeader: { alignItems: 'center', padding: 24, paddingTop: 32 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#C0392B', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  name: { fontSize: 22, fontWeight: 'bold', color: '#2C3E50' },
  phone: { fontSize: 14, color: '#7F8C8D', marginTop: 4 },
  section: { backgroundColor: '#fff', margin: 16, marginTop: 0, marginBottom: 12, borderRadius: 12, padding: 16, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50', marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  infoLabel: { fontSize: 14, color: '#7F8C8D' },
  infoValue: { fontSize: 14, color: '#2C3E50', fontWeight: '500' },
  editBtn: { backgroundColor: '#FFF0F0', borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 12 },
  editBtnText: { color: '#C0392B', fontWeight: '600' },
  label: { fontSize: 13, color: '#333', marginBottom: 4, marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, padding: 10, fontSize: 15, backgroundColor: '#FAFAFA' },
  editActions: { flexDirection: 'row', marginTop: 16, gap: 12 },
  cancelBtn: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#E0E0E0' },
  cancelBtnText: { color: '#666', fontWeight: '600' },
  saveBtn: { flex: 1, backgroundColor: '#C0392B', padding: 12, alignItems: 'center', borderRadius: 8 },
  saveBtnText: { color: '#fff', fontWeight: '600' },
  langRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  langLabel: { fontSize: 14, fontWeight: '500', color: '#2C3E50' },
  aboutText: { fontSize: 13, color: '#7F8C8D', marginBottom: 4 },
  logoutBtn: { marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#E74C3C' },
  logoutText: { color: '#E74C3C', fontSize: 16, fontWeight: '600' },
});
