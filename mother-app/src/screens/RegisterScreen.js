import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { useTranslation } from '../context/LanguageContext';

export default function RegisterScreen({ navigation }) {
  const { t } = useTranslation();
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.icon}>👩‍⚕️</Text>
        <Text style={styles.title}>{t('reg_by_health_worker')}</Text>
        <Text style={styles.body}>
          {t('reg_no_self')}
        </Text>

        <View style={styles.option}>
          <Text style={styles.optionIcon}>🟢</Text>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>{t('chv_title')}</Text>
            <Text style={styles.optionDesc}>
              {t('chv_desc')}
            </Text>
          </View>
        </View>

        <View style={styles.option}>
          <Text style={styles.optionIcon}>🏥</Text>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>{t('health_facility_title')}</Text>
            <Text style={styles.optionDesc}>
              {t('health_facility_desc')}
            </Text>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            {t('reg_info_after')}
          </Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>{t('back_to_login')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF0F0' },
  content: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 24, elevation: 4 },
  icon: { fontSize: 48, textAlign: 'center', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#C0392B', textAlign: 'center', marginBottom: 16 },
  body: { fontSize: 14, color: '#555', lineHeight: 20, marginBottom: 20, textAlign: 'center' },
  option: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-start' },
  optionIcon: { fontSize: 20, marginRight: 12, marginTop: 2 },
  optionText: { flex: 1 },
  optionTitle: { fontSize: 15, fontWeight: '600', color: '#2C3E50', marginBottom: 4 },
  optionDesc: { fontSize: 13, color: '#666', lineHeight: 18 },
  infoBox: { backgroundColor: '#FFF8E1', borderRadius: 10, padding: 14, borderLeftWidth: 3, borderLeftColor: '#F39C12', marginBottom: 20 },
  infoText: { color: '#7F6B2D', fontSize: 13, lineHeight: 18 },
  button: { backgroundColor: '#C0392B', borderRadius: 10, padding: 16, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
