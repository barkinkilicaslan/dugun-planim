/**
 * Saat içermeyen takvim tarihi yardımcıları. Tarihler her yerde `YYYY-AA-GG` metni olarak saklanır; bu
 * nedenle cihazın saat dilimi veya yaz saati uygulaması bir günlük kaymaya neden olamaz. `Date` nesneleri
 * yalnızca yerel öğe (gün/ay/yıl) okumak veya seçiciye vermek için üretilir ve her zaman öğlen 12:00'ye kurulur.
 */

const MONTHS_TR = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
] as const;

const WEEKDAYS_TR = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'] as const;

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

/** `GG.AA.YYYY` */
export function formatNumericTr(value: string): string {
  const parsed = parseIsoDate(value);
  return parsed ? `${pad(parsed.day)}.${pad(parsed.month)}.${pad(parsed.year, 4)}` : value;
}

/** `2 Ekim 2026` */
export function formatLongTr(value: string): string {
  const parsed = parseIsoDate(value);
  return parsed ? `${parsed.day} ${MONTHS_TR[parsed.month - 1]} ${parsed.year}` : value;
}

/** `2 Ekim 2026 Cuma` */
export function formatLongTrWithWeekday(value: string): string {
  const parsed = parseIsoDate(value);
  if (!parsed) return value;
  const weekday = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day)).getUTCDay();
  return `${formatLongTr(value)} ${WEEKDAYS_TR[weekday]}`;
}

/** Yeni düğün kaydı için tarih doğrulaması; geçerliyse `undefined`, değilse Türkçe hata mesajı döner. */
export function weddingDateError(value: string, now = new Date()): string | undefined {
  if (!value) return 'Düğün tarihini takvimden seçin.';
  if (!parseIsoDate(value)) return 'Düğün tarihi geçerli bir takvim tarihi olmalıdır.';
  if (isPastDate(value, now)) return 'Düğün tarihi geçmişte olamaz; bugün veya sonraki bir tarih seçin.';
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
