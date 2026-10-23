import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './en.json';
import ar from './ar.json';
import ms from './ms.json';

export const supportedLanguages = [
  { code: 'en', label: 'English', flag: '🇬🇧', short: 'EN', dir: 'ltr' as const },
  { code: 'ar', label: 'العربية', flag: '🇸🇦', short: 'AR', dir: 'rtl' as const },
  { code: 'ms', label: 'Bahasa Melayu', flag: '🇲🇾', short: 'MS', dir: 'ltr' as const },
];

function applyDirection(lang: string) {
  const entry = supportedLanguages.find(l => l.code === lang);
  const dir = entry?.dir ?? 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = lang;
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
      ms: { translation: ms },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'ar', 'ms'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'miat_lang',
      caches: ['localStorage'],
    },
  });

applyDirection(i18n.language?.split('-')[0] ?? 'en');

i18n.on('languageChanged', (lang) => {
  applyDirection(lang.split('-')[0]);
});

export default i18n;
