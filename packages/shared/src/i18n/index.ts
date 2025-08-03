import { en } from './en';
import { ko } from './ko';

type Messages = typeof en;

type Locale = 'en' | 'ko';

const allMessages: Record<Locale, Messages> = {
  en,
  ko,
};

let currentLocale: Locale = 'ko'; // Default to Korean as per user's request

export function setLocale(locale: Locale) {
  if (allMessages[locale]) {
    currentLocale = locale;
  } else {
    console.warn(`Locale ${locale} not found. Falling back to ${currentLocale}.`);
  }
}

export function t(key: string, replacements?: Record<string, string>): string {
  const keys = key.split('.');
  let message: any = allMessages[currentLocale];

  for (const k of keys) {
    if (message && typeof message === 'object' && k in message) {
      message = message[k];
    } else {
      console.warn(`Translation key "${key}" not found for locale "${currentLocale}".`);
      // Fallback to English if translation not found in current locale
      message = allMessages['en'];
      for (const enKey of keys) {
        if (message && typeof message === 'object' && enKey in message) {
          message = message[enKey];
        } else {
          return key; // Return the key itself if not found even in English
        }
      }
      break;
    }
  }

  if (typeof message === 'string' && replacements) {
    for (const [placeholder, value] of Object.entries(replacements)) {
      message = message.replace(`{{${placeholder}}}`, value);
    }
  }

  return typeof message === 'string' ? message : key;
}
