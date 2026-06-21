import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enJSON from './locales/en.json';
import jaJSON from './locales/ja.json';
import idJSON from './locales/id.json';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: enJSON },
    ja: { translation: jaJSON },
    id: { translation: idJSON },
  },
  lng: localStorage.getItem('language') || 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;