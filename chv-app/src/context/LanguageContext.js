import React, { createContext, useState, useEffect, useContext } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState('en');
  const [translations, setTranslations] = useState({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadLanguage();
  }, []);

  async function loadLanguage() {
    try {
      const saved = await AsyncStorage.getItem('language');
      const lang = saved || 'en';
      const module = lang === 'sw' ? await import('../i18n/sw.json') : await import('../i18n/en.json');
      setTranslations(module.default || module);
      setLanguageState(lang);
    } catch {
      const en = await import('../i18n/en.json');
      setTranslations(en.default || en);
    } finally {
      setReady(true);
    }
  }

  async function setLanguage(lang) {
    try {
      await AsyncStorage.setItem('language', lang);
    } catch {}
    const module = lang === 'sw' ? await import('../i18n/sw.json') : await import('../i18n/en.json');
    setTranslations(module.default || module);
    setLanguageState(lang);
  }

  function t(key, params) {
    let val = translations[key] || key;
    if (params && typeof val === 'string') {
      for (const [k, v] of Object.entries(params)) {
        val = val.replace(`{${k}}`, v);
      }
    }
    return val;
  }

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#e91e63" />
        <Text style={{ marginTop: 12, fontSize: 16, color: '#666' }}>Loading…</Text>
      </View>
    );
  }

  return (
    <LanguageContext.Provider value={{ t, language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) return { t: k => k, language: 'en', setLanguage: () => {} };
  return ctx;
}
