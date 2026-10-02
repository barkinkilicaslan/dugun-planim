import { getActiveLocale, intlLocale, t, type SupportedLocale } from '@/i18n';

/**
 * Saat içermeyen takvim tarihi yardımcıları. Tarihler her yerde `YYYY-AA-GG` metni olarak saklanır; bu
 * nedenle cihazın saat dilimi veya yaz saati uygulaması bir günlük kaymaya neden olamaz. `Date` nesneleri
 * yalnızca yerel öğe (gün/ay/yıl) okumak veya seçiciye vermek için üretilir ve her zaman öğlen 12:00'ye kurulur.
 */

/** `Intl` kullanılamazsa veya hata verirse devreye giren yedek ay/gün adları. */
const MONTHS: Record<SupportedLocale, readonly string[]> = {
  tr: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'],
  en: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
};

const WEEKDAYS: Record<SupportedLocale, readonly string[]> = {
  tr: ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
};

const pad = (value: number, length = 2) => String(value).padStart(length, '0');

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

export interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

export function parseIsoDate(value: string): CalendarDate | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  const [year, month, day] = match.slice(1).map(Number);
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return undefined;
  return { year, month, day };
}

export function toIsoDate({ year, month, day }: CalendarDate): string {
  return `${pad(year, 4)}-${pad(month)}-${pad(day)}`;
}

/** Seçicinin döndürdüğü `Date` değerinin yerel gün/ay/yıl bileşenlerinden takvim tarihi üretir. */
export function isoFromLocalDate(value: Date): string {
  return toIsoDate({ year: value.getFullYear(), month: value.getMonth() + 1, day: value.getDate() });
}

/** Takvim tarihini seçici için yerel öğlen 12:00 `Date` değerine çevirir (saat dilimi kaymasına karşı). */
export function localDateFromIso(value: string): Date | undefined {
  const parsed = parseIsoDate(value);
  return parsed ? new Date(parsed.year, parsed.month - 1, parsed.day, 12, 0, 0, 0) : undefined;
}

export function todayIso(now = new Date()): string {
  return isoFromLocalDate(now);
}

/** Yalnızca takvim günlerini karşılaştırır: negatif ise `a` daha erken. */
export function compareIsoDates(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function isPastDate(value: string, now = new Date()): boolean {
  return parseIsoDate(value) !== undefined && compareIsoDates(value, todayIso(now)) < 0;
}

/** `GG.AA.YYYY` — kayıt/liste biçimi; dilden bağımsızdır. */
export function formatNumeric(value: string): string {
  const parsed = parseIsoDate(value);
  return parsed ? `${pad(parsed.day)}.${pad(parsed.month)}.${pad(parsed.year, 4)}` : value;
}

/** Takvim gününü saat dilimine bağlı kalmadan (UTC öğleni) `Intl` ile biçimlendirir. */
function formatWithIntl(value: string, locale: SupportedLocale, weekday: boolean): string | undefined {
  const parsed = parseIsoDate(value);
  if (!parsed) return undefined;
  const date = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day, 12));
  try {
    return new Intl.DateTimeFormat(intlLocale(locale), {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      ...(weekday ? { weekday: 'long' as const } : {}),
      timeZone: 'UTC',
    }).format(date);
  } catch {
    const base =
      locale === 'en'
        ? `${MONTHS.en[parsed.month - 1]} ${parsed.day}, ${parsed.year}`
        : `${parsed.day} ${MONTHS.tr[parsed.month - 1]} ${parsed.year}`;
    if (!weekday) return base;
    const day = WEEKDAYS[locale][date.getUTCDay()];
    return locale === 'en' ? `${day}, ${base}` : `${base} ${day}`;
  }
}

/** `2 Ekim 2026` / `October 2, 2026` */
export function formatLong(value: string, locale: SupportedLocale = getActiveLocale()): string {
  return formatWithIntl(value, locale, false) ?? value;
}

/** `2 Ekim 2026 Cuma` / `Friday, October 2, 2026` */
export function formatLongWithWeekday(value: string, locale: SupportedLocale = getActiveLocale()): string {
  return formatWithIntl(value, locale, true) ?? value;
}

/** `Ekim 2026` / `October 2026` — ay başlığı. */
export function formatMonthYear(isoMonth: string, locale: SupportedLocale = getActiveLocale()): string {
  const match = /^(\d{4})-(\d{2})$/.exec(isoMonth);
  if (!match) return isoMonth;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return isoMonth;
  try {
    return new Intl.DateTimeFormat(intlLocale(locale), { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
      new Date(Date.UTC(year, month - 1, 15, 12)),
    );
  } catch {
    return `${MONTHS[locale][month - 1]} ${year}`;
  }
}

/** Saat metni (`HH:MM`, 24 saat) dile göre gösterilir: Türkçe `18:30`, İngilizce `6:30 PM`. */
export function formatTime(value: string, locale: SupportedLocale = getActiveLocale()): string {
  if (!isValidTimeString(value)) return value;
  const [hours, minutes] = value.split(':').map(Number);
  try {
    return new Intl.DateTimeFormat(intlLocale(locale), { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }).format(
      new Date(Date.UTC(2000, 0, 1, hours, minutes)),
    );
  } catch {
    return value;
  }
}

/** Kaydedilmiş ISO zaman damgasını (ör. güncelleme zamanı) yerel takvim gününe göre kısa biçimde gösterir. */
export function formatTimestampDate(timestamp: string, locale: SupportedLocale = getActiveLocale()): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;
  try {
    return new Intl.DateTimeFormat(intlLocale(locale)).format(date);
  } catch {
    return formatNumeric(isoFromLocalDate(date));
  }
}

/** Yeni düğün kaydı için tarih doğrulaması; geçerliyse `undefined`, değilse Türkçe hata mesajı döner. */
export function weddingDateError(value: string, now = new Date()): string | undefined {
  if (!value) return t('date.error.required');
  if (!parseIsoDate(value)) return t('date.error.invalid');
  if (isPastDate(value, now)) return t('date.error.past');
  return undefined;
}

export function isValidTimeString(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function timeFromLocalDate(value: Date): string {
  return `${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

export function localDateFromTime(value: string): Date {
  const [hours, minutes] = isValidTimeString(value) ? value.split(':').map(Number) : [18, 0];
  return new Date(2000, 0, 1, hours, minutes, 0, 0);
}
