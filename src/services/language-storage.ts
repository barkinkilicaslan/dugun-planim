import Storage from 'expo-sqlite/kv-store';

import { isLanguagePreference, type LanguagePreference } from '@/i18n';

/**
 * Dil tercihi hassas veri değildir; düğün veritabanından bağımsız, küçük bir anahtar-değer deposunda tutulur
 * (`expo-sqlite/kv-store`). Okuma eşzamanlıdır; böylece uygulama ilk karede doğru dilde açılır.
 * Web için `language-storage.web.ts` (localStorage) kullanılır.
 */
const KEY = 'dugun-planim.language';

export function loadLanguagePreference(): LanguagePreference {
  try {
    const stored = Storage.getItemSync(KEY);
    return isLanguagePreference(stored) ? stored : 'auto';
  } catch {
    return 'auto';
  }
}

/** Başarıyla kaydedildiyse `true`; depo kullanılamıyorsa tercih yalnız bu oturumda geçerli kalır. */
export function saveLanguagePreference(preference: LanguagePreference): boolean {
  try {
    Storage.setItemSync(KEY, preference);
    return true;
  } catch {
    return false;
  }
}
