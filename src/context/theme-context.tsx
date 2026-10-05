import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { Appearance, Platform } from 'react-native';

import { DEFAULT_THEME_ID, getTheme, type AppTheme, type ThemeId } from '@/constants/themes';
import { clearThemeId, loadThemeId, saveThemeId } from '@/services/theme-storage';

export interface ThemeControls {
  /** Kullanıcı bir tarz seçtiyse `true`; değilse "Tarzını seç" ekranı gösterilir. */
  hasChosen: boolean;
  themeId: ThemeId;
  /** Tarzı anında değiştirir ve cihazda saklar. */
  setThemeId: (id: ThemeId) => void;
  /** Kayıtlı tarzı siler (tüm veriler silindiğinde ilk kurulum akışına dönmek için). */
  resetTheme: () => void;
}

const ThemeContext = createContext<AppTheme>(getTheme(DEFAULT_THEME_ID));
const ThemeControlsContext = createContext<ThemeControls | undefined>(undefined);

export function AppThemeProvider({ children }: PropsWithChildren) {
  const [stored, setStored] = useState<ThemeId | null>(() => loadThemeId());
  const setThemeId = useCallback((id: ThemeId) => {
    saveThemeId(id);
    setStored(id);
  }, []);
  const resetTheme = useCallback(() => {
    clearThemeId();
    setStored(null);
  }, []);
  const themeId = stored ?? DEFAULT_THEME_ID;
  const theme = useMemo(() => getTheme(themeId), [themeId]);
  // Yerel bileşenler (uyarılar, klavye, tarih/kişi seçicileri) işletim sistemi karanlık modunu değil, seçili temanın
  // açık/koyu durumunu izler; aksi halde açık temada koyu yerel diyaloglar çıkardı.
  useEffect(() => {
    if (Platform.OS === 'web') return;
    try {
      Appearance.setColorScheme(theme.dark ? 'dark' : 'light');
    } catch {
      // Eski çalışma zamanlarında desteklenmeyebilir; uygulama yine çalışır.
    }
  }, [theme.dark]);
  const controls = useMemo<ThemeControls>(
    () => ({ hasChosen: stored !== null, themeId, setThemeId, resetTheme }),
    [stored, themeId, setThemeId, resetTheme],
  );
  return (
    <ThemeContext.Provider value={theme}>
      <ThemeControlsContext.Provider value={controls}>{children}</ThemeControlsContext.Provider>
    </ThemeContext.Provider>
  );
}

/** Etkin tema token'ları. Tema seçilmemişken varsayılan (Romantik Bahçe) döner. */
export function useAppTheme(): AppTheme {
  return useContext(ThemeContext);
}

/** Sağlayıcı dışında (ör. testlerde) varsayılan temaya düşer ve seçim yapmaz. */
export function useThemeControls(): ThemeControls {
  const value = useContext(ThemeControlsContext);
  if (value) return value;
  return {
    hasChosen: true,
    themeId: DEFAULT_THEME_ID,
    setThemeId: () => undefined,
    resetTheme: () => undefined,
  };
}
