/**
 * Tutar girişi: kullanıcının yazdığı metin ile saklanan kuruş (tam sayı) arasındaki tek dönüşüm noktası.
 *
 * Türkçede virgül ondalık, nokta binlik ayırıcıdır ("1.250,50"); İngilizcede tersi ("1,250.50").
 * Kural: etkin dilin ondalık ayırıcısı her zaman ondalıktır. Diğer ayırıcı yalnızca doğru gruplanmışsa
 * ("1.500", "1.250.000") binliktir; tek başına ve gruplanmamışsa ("12.5") ondalık sayılır. İki ayırıcı birlikte
 * geçiyorsa sonuncusu ondalıktır ("1,250.50" Türkçe arayüzde de 1250,50 olur).
 */
export const MAX_MONEY_CENTS = 100_000_000_000; // 1 milyar birim; toplamlar güvenli tam sayı sınırının çok altında kalır.

export interface ParsedMoney {
  cents: number;
  /** Girdi boştu (yalnız boşluk dahil). */
  empty: boolean;
}

function decimalSeparator(locale: string): ',' | '.' {
  return locale.toLowerCase().startsWith('tr') ? ',' : '.';
}

function isGrouped(value: string, group: string): boolean {
  const escaped = group === '.' ? '\\.' : group;
  return new RegExp(`^\\d{1,3}(?:${escaped}\\d{3})+$`).test(value);
}

/** Geçersiz girdi için `null` döner; çağıran bu tuş vuruşunu yok sayabilir veya hata gösterebilir. */
export function parseMoney(input: string, locale: string): ParsedMoney | null {
  const text = input.replace(/[\s  ]/g, '');
  if (text === '') return { cents: 0, empty: true };
  if (!/^[0-9.,]+$/.test(text)) return null;

  const hasComma = text.includes(',');
  const hasDot = text.includes('.');
  let decimal = decimalSeparator(locale);
  if (hasComma && hasDot) decimal = text.lastIndexOf(',') > text.lastIndexOf('.') ? ',' : '.';
  const group = decimal === ',' ? '.' : ',';

  let whole: string;
  let fraction = '';
  const decimalParts = text.split(decimal);
  if (decimalParts.length > 2) return null;
  if (decimalParts.length === 2) {
    whole = decimalParts[0];
    fraction = decimalParts[1];
    if (whole !== '' && !/^\d+$/.test(whole) && !isGrouped(whole, group)) return null;
  } else {
    const parts = text.split(group);
    if (parts.length === 1 || isGrouped(text, group)) {
      whole = text;
    } else if (parts.length === 2 && /^\d*$/.test(parts[0]) && /^\d*$/.test(parts[1])) {
      // Tek ve gruplanmamış diğer ayırıcı ("12.5" / "12." / ".5"): ondalık olarak yorumlanır.
      whole = parts[0];
      fraction = parts[1];
    } else {
      return null;
    }
  }
  if (!/^\d*$/.test(fraction) || fraction.length > 2) return null;
  const digits = whole.split(group).join('');
  if (digits.length > 12) return null;

  const cents = Number(digits || '0') * 100 + Number(fraction.padEnd(2, '0'));
  if (cents > MAX_MONEY_CENTS) return null;
  return { cents, empty: false };
}

/** Düzenleme alanında gösterilecek ham metin: binlik ayırıcısız, gereksiz sıfırsız. 0 boş alan olur. */
export function formatMoneyInput(cents: number, locale: string): string {
  if (!Number.isFinite(cents) || cents <= 0) return '';
  const whole = Math.floor(cents / 100);
  const fraction = cents % 100;
  if (fraction === 0) return String(whole);
  return `${whole}${decimalSeparator(locale)}${String(fraction).padStart(2, '0').replace(/0$/, '')}`;
}
