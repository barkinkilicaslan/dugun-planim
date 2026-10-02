import { isLanguagePreference, type LanguagePreference } from '@/i18n';

/** Web önizlemesinde dil tercihi `localStorage` içinde tutulur (yerel SQLite çalışanı gerekmez). */
const KEY = 'dugun-planim.language';

export function loadLanguagePreference(): LanguagePreference {
  try {
    const stored = localStorage.getItem(KEY);
    return isLanguagePreference(stored) ? stored : 'auto';
  } catch {
    return 'auto';
  }
}

export function saveLanguagePreference(preference: LanguagePreference): boolean {
  try {
    localStorage.setItem(KEY, preference);
    return true;
  } catch {
    return false;
  }
}
