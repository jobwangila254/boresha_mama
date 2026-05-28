import React, { createContext, useState, useEffect, useContext } from 'react';

const LanguageContext = createContext(null);

const cache = {};

async function loadTranslations(lang) {
  if (cache[lang]) return cache[lang];
  try {
    const module = lang === 'sw'
      ? await import('../i18n/sw.json')
      : await import('../i18n/en.json');
    cache[lang] = module.default || module;
    return cache[lang];
  } catch {
    return {};
  }
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState('en');
  const [translations, setTranslations] = useState({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('language') || 'en';
    loadTranslations(saved).then(tr => {
      setTranslations(tr);
      setLanguageState(saved);
      setReady(true);
    });
  }, []);

  async function setLanguage(lang) {
    localStorage.setItem('language', lang);
    const tr = await loadTranslations(lang);
    setTranslations(tr);
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
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        height: '100vh', fontFamily: 'system-ui, sans-serif', fontSize: '16px', color: '#666'
      }}>
        Loading…
      </div>
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
