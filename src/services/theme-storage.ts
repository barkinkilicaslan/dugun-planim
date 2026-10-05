import Storage from 'expo-sqlite/kv-store';

import { isThemeId, type ThemeId } from '@/constants/themes';

/**
 * Görsel tarz tercihi hassas veri değildir ve cihaza özgüdür: düğün veritabanından ve JSON yedeğinden bağımsız,
 * dil tercihi gibi küçük bir anahtar-değer deposunda (`expo-sqlite/kv-store`) tutulur. Okuma eşzamanlıdır;
 * böylece uygulama ilk karede doğru temayla açılır. Web için `theme-storage.web.ts` kullanılır.
 */
const KEY = 'dugun-planim.theme';

/** Kayıtlı tarz yoksa (veya geçersizse) `null` döner; bu durumda "Tarzını seç" ekranı gösterilir. */
export function loadThemeId(): ThemeId | null {
  try {
    const stored = Storage.getItemSync(KEY);
    return isThemeId(stored) ? stored : null;
  } catch {
    return null;
  }
}

/** Başarıyla kaydedildiyse `true`; depo kullanılamıyorsa tercih yalnız bu oturumda geçerli kalır. */
export function saveThemeId(id: ThemeId): boolean {
  try {
    Storage.setItemSync(KEY, id);
    return true;
  } catch {
    return false;
  }
}

export function clearThemeId(): boolean {
  try {
    Storage.removeItemSync(KEY);
    return true;
  } catch {
    return false;
  }
}
