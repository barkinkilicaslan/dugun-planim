import { en } from './en';
import { tr } from './tr';

/**
 * Çok dilli altyapı. Türkçe (varsayılan/yedek) ve İngilizce desteklenir. Sözlükler `tr.ts` (kaynak) ve `en.ts` içindedir;
 * `en` Türkçe sözlükle aynı anahtar ve parametre yapısına sahip olmak zorundadır (derleme zamanı denetimi).
 * Mimari ileride sağdan sola bir dil eklenebilecek biçimde `direction` bilgisini taşır; şu an yalnız `ltr` diller vardır.
 */

export type SupportedLocale = 'tr' | 'en';
export type LanguagePreference = 'auto' | SupportedLocale;
export type TextDirection = 'ltr' | 'rtl';

export const SUPPORTED_LOCALES: readonly SupportedLocale[] = ['tr', 'en'];
export const DEFAULT_LOCALE: SupportedLocale = 'tr';
export const LANGUAGE_PREFERENCES: readonly LanguagePreference[] = ['auto', 'tr', 'en'];

export const LOCALE_META: Record<SupportedLocale, { intl: string; direction: TextDirection; nativeName: string }> = {
  tr: { intl: 'tr-TR', direction: 'ltr', nativeName: 'Türkçe' },
  en: { intl: 'en-US', direction: 'ltr', nativeName: 'English' },
};

export type MessageKey = keyof typeof tr;
type Catalog = typeof tr;
export type MessageParams<K extends MessageKey> = Catalog[K] extends (params: infer P) => string ? P : undefined;
type MessageArgs<K extends MessageKey> = MessageParams<K> extends undefined ? [] : [MessageParams<K>];

const catalogs: Record<SupportedLocale, Record<string, string | ((params: never) => string)>> = { tr, en };

export function isLanguagePreference(value: unknown): value is LanguagePreference {
  return LANGUAGE_PREFERENCES.some((preference) => preference === value);
}

/**
 * Dil koduna (`tr`, `en`, `en-US`, `en_GB`, `tr-TR`) göre desteklenen dili seçer. Ülke/bölge dikkate alınmaz;
 * desteklenmeyen veya boş değerler Türkçe'ye düşer.
 */
export function resolveLocale(languageCode?: string | null): SupportedLocale {
  const primary = (languageCode ?? '').trim().toLowerCase().split(/[-_]/)[0];
  return SUPPORTED_LOCALES.find((locale) => locale === primary) ?? DEFAULT_LOCALE;
}

export interface DeviceLocaleLike {
  languageCode?: string | null;
  languageTag?: string | null;
}

/** Cihazın tercih sırasındaki ilk desteklenen dili seçer; hiçbiri desteklenmiyorsa Türkçe. */
export function resolveFromDeviceLocales(locales: readonly DeviceLocaleLike[]): SupportedLocale {
  for (const entry of locales) {
    const code = (entry.languageCode ?? entry.languageTag ?? '').trim().toLowerCase().split(/[-_]/)[0];
    const match = SUPPORTED_LOCALES.find((locale) => locale === code);
    if (match) return match;
  }
  return DEFAULT_LOCALE;
}

export function resolvePreference(
  preference: LanguagePreference,
  deviceLocales: readonly DeviceLocaleLike[],
): SupportedLocale {
  return preference === 'auto' ? resolveFromDeviceLocales(deviceLocales) : preference;
}

/** Eksik anahtar veya bozuk sözlük uygulamayı çökertmez: önce Türkçe sözlüğe, sonra anahtarın kendisine düşer. */
export function translate<K extends MessageKey>(locale: SupportedLocale, key: K, ...args: MessageArgs<K>): string {
  const entry = catalogs[locale]?.[key] ?? catalogs[DEFAULT_LOCALE][key];
  if (entry === undefined) return key;
  if (typeof entry === 'string') return entry;
  try {
    return (entry as (params: unknown) => string)(args[0]);
  } catch {
    return key;
  }
}

let activeLocale: SupportedLocale = DEFAULT_LOCALE;

export function getActiveLocale(): SupportedLocale {
  return activeLocale;
}

export function setActiveLocale(locale: SupportedLocale): void {
  activeLocale = locale;
}

/** Etkin dilde çeviri. React bileşenleri yeniden çizim için `useI18n()` kullanmalıdır. */
export function t<K extends MessageKey>(key: K, ...args: MessageArgs<K>): string {
  return translate(activeLocale, key, ...args);
}

export function intlLocale(locale: SupportedLocale = activeLocale): string {
  return LOCALE_META[locale].intl;
}

export type Translator = <K extends MessageKey>(key: K, ...args: MessageArgs<K>) => string;

/**
 * Belirli bir dile bağlı çevirici. Dil değiştiğinde yeni bir işlev kimliği oluşur; böylece önbellekleyen
 * (React Compiler/useMemo) bileşenler eski metni göstermez.
 */
export function createTranslator(locale: SupportedLocale): Translator {
  return (key, ...args) => translate(locale, key, ...args);
}

/** Çevirici ve etkin dili birlikte taşıyan en küçük yapı; alan (domain) işlevleri bunu parametre olarak alır. */
export interface I18nLike {
  t: Translator;
  locale: SupportedLocale;
}

/** Parametresiz (düz metin) mesajların anahtarları; `t(anahtar)` bu anahtarlarla her zaman parametresiz çağrılabilir. */
export type PlainMessageKey = { [K in MessageKey]: Catalog[K] extends string ? K : never }[MessageKey];
