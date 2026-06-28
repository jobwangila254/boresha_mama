import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import CountyLogo from '../components/CountyLogo';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!phone || !password) {
      Alert.alert(t('error'), t('enter_phone_password'));
      return;
    }
    setLoading(true);
    try {
      await login(phone, password);
    } catch (err) {
      Alert.alert(t('login_failed'), err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <CountyLogo size={90} />
          <Text style={styles.title}>Boresha-Mama</Text>
          <Text style={styles.subtitle}>{t('tagline')}</Text>
        </View>
        <View style={styles.form}>
          <Text style={styles.label}>{t('phone')}</Text>
          <TextInput
            style={styles.input}
            placeholder="+254712345678"
            placeholderTextColor="#999"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoCapitalize="none"
          />

          <Text style={styles.label}>{t('password')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('enter_password')}
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{t('login')}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.signupBtn} onPress={() => navigation.navigate('MotherSignup')}>
            <Text style={styles.signupBtnText}>{t('mother_signup')}</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F8F0' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#004d26', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center' },
  form: { backgroundColor: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, padding: 14, fontSize: 16, backgroundColor: '#FAFAFA' },
  button: { backgroundColor: '#006633', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 24 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  signupBtn: { backgroundColor: '#fff', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 16, borderWidth: 2, borderColor: '#006633' },
  signupBtnText: { color: '#006633', fontSize: 16, fontWeight: '600' },

});
