import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from 'react';
import { useLocales } from 'expo-localization';

import {
  createTranslator,
  getActiveLocale,
  intlLocale,
  LOCALE_META,
  resolvePreference,
  setActiveLocale,
  type LanguagePreference,
  type SupportedLocale,
  type TextDirection,
  type Translator,
} from '@/i18n';
import { loadLanguagePreference, saveLanguagePreference } from '@/services/language-storage';

export interface I18nValue {
  /** Kullanıcının seçimi: otomatik, Türkçe veya İngilizce. */
  preference: LanguagePreference;
  /** Gerçekte kullanılan dil. */
  locale: SupportedLocale;
  direction: TextDirection;
  /** `Intl` için BCP 47 etiketi (ör. `tr-TR`, `en-US`). */
  intl: string;
  setPreference: (preference: LanguagePreference) => void;
  /** Etkin dile bağlı çevirici; dil değişince kimliği de değişir. */
  t: Translator;
}

const LanguageContext = createContext<I18nValue | undefined>(undefined);

/**
 * Dil tercihini yükler/saklar ve etkin dili belirler. Tercih değişince `t` değeri güncellenir ve
 * `useI18n()` kullanan tüm ekranlar yeniden çizilir; uygulamayı yeniden başlatmak gerekmez.
 */
export function LanguageProvider({ children }: PropsWithChildren) {
  const deviceLocales = useLocales();
  const [preference, setPreferenceState] = useState<LanguagePreference>(() => loadLanguagePreference());
  const locale = resolvePreference(preference, deviceLocales);
  // Etkin dil, çocukların ilk çiziminden önce ayarlanır; böylece alan (domain) kodundaki `t()` de doğru dili görür.
  setActiveLocale(locale);

  const setPreference = useCallback((next: LanguagePreference) => {
    saveLanguagePreference(next);
    setPreferenceState(next);
  }, []);

  const value = useMemo<I18nValue>(
    () => ({
      preference,
      locale,
      direction: LOCALE_META[locale].direction,
      intl: intlLocale(locale),
      setPreference,
      t: createTranslator(locale),
    }),
    [locale, preference, setPreference],
  );
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

/** Sağlayıcı dışında (ör. bileşen testlerinde) etkin dile düşer ve tercih değiştirmez. */
export function useI18n(): I18nValue {
  const context = useContext(LanguageContext);
  if (context) return context;
  const locale = getActiveLocale();
  return {
    preference: 'auto',
    locale,
    direction: LOCALE_META[locale].direction,
    intl: intlLocale(locale),
    setPreference: () => undefined,
    t: createTranslator(locale),
  };
}
