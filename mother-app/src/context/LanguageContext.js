import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from '../i18n/en.json';
import sw from '../i18n/sw.json';

const translations = { en, sw };

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState('en');

  useEffect(() => {
    AsyncStorage.getItem('language').then(saved => {
      if (saved === 'sw' || saved === 'en') setLanguageState(saved);
    });
  }, []);

  const setLanguage = useCallback(async (lang) => {
    setLanguageState(lang);
    await AsyncStorage.setItem('language', lang);
  }, []);

  const t = useCallback((key) => {
    return translations[language]?.[key] ?? translations.en[key] ?? key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) return { language: 'en', setLanguage: () => {}, t: (k) => k };
  return ctx;
}
