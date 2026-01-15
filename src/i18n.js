import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import zhTW from './locales/zh-TW.json';
import en from './locales/en.json';

i18n
  .use(LanguageDetector) // 自動偵測瀏覽器語言
  .use(initReactI18next)
  .init({
    resources: {
      'zh-TW': { translation: zhTW },
      'en': { translation: en }
    },
    fallbackLng: 'zh-TW', // 預設語言
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;