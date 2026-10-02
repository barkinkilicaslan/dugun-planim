import { t } from '@/i18n';
import type { Guest } from './models';

/**
 * Telefon/e-posta normalizasyonu ve yinelenen davetli denetimi. Saf fonksiyonlardır; rehber verisi
 * burada yalnızca bellekte işlenir, loglanmaz ve herhangi bir yere gönderilmez.
 */

export interface PhoneParts {
  /** Karşılaştırma anahtarı: yalnız rakamlar, Türkiye cep numaraları `905XXXXXXXXX` biçiminde. */
  key: string;
  /** Kullanıcıya gösterilen/saklanan biçim: `+90 5XX XXX XX XX` veya sadeleştirilmiş uluslararası numara. */
  display: string;
  isTurkishMobile: boolean;
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * `05xx…`, `5xx…`, `+90 5xx…`, `0090 5xx…` ve `90 5xx…` biçimlerini aynı Türkiye cep numarasına indirger.
 * Tanınamayan değerler için `undefined` döner.
 */
export function normalizePhone(raw: string): PhoneParts | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const hasPlus = trimmed.startsWith('+');
  let digits = digitsOnly(trimmed);
  if (!digits) return undefined;
  if (digits.startsWith('00')) digits = digits.slice(2);

  const asTurkishNational = (national: string): PhoneParts | undefined =>
    /^[2-5]\d{9}$/.test(national)
      ? {
          key: `90${national}`,
          display: `+90 ${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6, 8)} ${national.slice(8)}`,
          isTurkishMobile: national.startsWith('5'),
        }
      : undefined;

  if (digits.startsWith('90') && digits.length === 12) {
    const turkish = asTurkishNational(digits.slice(2));
    if (turkish) return turkish;
  }
  if (digits.startsWith('0') && digits.length === 11) {
    const turkish = asTurkishNational(digits.slice(1));
    if (turkish) return turkish;
  }
  if (digits.length === 10) {
    const turkish = asTurkishNational(digits);
    if (turkish) return turkish;
  }
  // Türkiye cep numarası olmayan numaralar: yalnız makul uzunlukta ve uluslararası biçimde ise kabul et.
  if (digits.length >= 8 && digits.length <= 15 && (hasPlus || digits.length > 11)) {
    return { key: digits, display: `+${digits}`, isTurkishMobile: false };
  }
  // Sabit hat veya yerel numara: karşılaştırma için rakamları koru, gösterimi değiştirme.
  if (digits.length >= 7 && digits.length <= 15) return { key: digits, display: trimmed, isTurkishMobile: false };
  return undefined;
}

export function phoneKey(raw: string): string | undefined {
  return normalizePhone(raw)?.key;
}

export function normalizeEmail(raw: string): string {
  return raw.trim().toLocaleLowerCase('en');
}

export function isValidEmail(raw: string): boolean {
  const value = raw.trim();
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

export function emailKey(raw: string): string | undefined {
  return isValidEmail(raw) ? normalizeEmail(raw) : undefined;
}

export interface ContactIdentity {
  phone?: string;
  email?: string;
}

export type DuplicateReason = 'phone' | 'email';

export type GuestIdentity = Pick<Guest, 'id' | 'name' | 'phone' | 'email'>;

export interface DuplicateMatch {
  guest: GuestIdentity;
  reason: DuplicateReason;
}

/** Aynı telefon veya e-postaya sahip ilk davetliyi bulur; düzenlenen kaydı (`excludeId`) yok sayar. */
export function findDuplicateGuest(
  guests: readonly GuestIdentity[],
  candidate: ContactIdentity,
  excludeId?: string,
): DuplicateMatch | undefined {
  const phone = candidate.phone ? phoneKey(candidate.phone) : undefined;
  const email = candidate.email ? emailKey(candidate.email) : undefined;
  if (!phone && !email) return undefined;
  for (const guest of guests) {
    if (guest.id === excludeId) continue;
    if (phone && phoneKey(guest.phone) === phone) return { guest, reason: 'phone' };
    if (email && emailKey(guest.email) === email) return { guest, reason: 'email' };
  }
  return undefined;
}

export function duplicateMessage(match: DuplicateMatch): string {
  return match.reason === 'phone'
    ? t('contacts.duplicatePhone', { name: match.guest.name })
    : t('contacts.duplicateEmail', { name: match.guest.name });
}

/** Mevcut davetlideki boş telefon/e-posta alanlarını yeni bilgiyle doldurur; dolu alanları değiştirmez. */
export function mergeContactIntoGuest(guest: Guest, candidate: ContactIdentity, now: string): Guest {
  const phone = candidate.phone ? normalizePhone(candidate.phone) : undefined;
  const email = candidate.email && isValidEmail(candidate.email) ? normalizeEmail(candidate.email) : '';
  const nextPhone = guest.phone.trim() ? guest.phone : (phone?.display ?? guest.phone);
  const nextEmail = guest.email.trim() ? guest.email : email;
  if (nextPhone === guest.phone && nextEmail === guest.email) return guest;
  return { ...guest, phone: nextPhone, email: nextEmail, updatedAt: now };
}

export interface RawContactPhone {
  number?: string;
  label?: string;
}

export interface RawContactEmail {
  address?: string;
  label?: string;
}

export interface RawContact {
  id: string;
  givenName?: string;
  familyName?: string;
  fullName?: string;
  phones?: readonly RawContactPhone[];
  emails?: readonly RawContactEmail[];
}

export interface ContactOption {
  value: string;
  display: string;
  label: string;
}

/** Rehberden alınan, ekranda gösterilen ve kullanıcı seçene kadar veritabanına yazılmayan aday. */
export interface ContactCandidate {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  phones: ContactOption[];
  emails: ContactOption[];
}

function uniqueBy<T>(items: readonly T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const value = key(item);
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

export function candidateFromRawContact(raw: RawContact): ContactCandidate | undefined {
  const firstName = (raw.givenName ?? '').trim();
  const lastName = (raw.familyName ?? '').trim();
  const name = [firstName, lastName].filter(Boolean).join(' ') || (raw.fullName ?? '').trim();
  if (!name) return undefined;
  const phones = uniqueBy(
    (raw.phones ?? []).flatMap((phone) => {
      const parts = phone.number ? normalizePhone(phone.number) : undefined;
      return parts ? [{ value: parts.key, display: parts.display, label: phone.label ?? '' }] : [];
    }),
    (option) => option.value,
  );
  const emails = uniqueBy(
    (raw.emails ?? []).flatMap((email) =>
      email.address && isValidEmail(email.address)
        ? [{ value: normalizeEmail(email.address), display: email.address.trim(), label: email.label ?? '' }]
        : [],
    ),
    (option) => option.value,
  );
  return { id: raw.id, firstName, lastName, name, phones, emails };
}

export function candidatesFromRawContacts(raws: readonly RawContact[]): ContactCandidate[] {
  return raws
    .flatMap((raw) => {
      const candidate = candidateFromRawContact(raw);
      return candidate && (candidate.phones.length || candidate.emails.length) ? [candidate] : [];
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'tr'));
}

/** Türkçe karakterlere duyarlı, büyük/küçük harf ve aksan farkını yok sayan arama. */
export function contactMatchesQuery(candidate: ContactCandidate, query: string): boolean {
  const needle = query.trim().toLocaleLowerCase('tr');
  if (!needle) return true;
  const digits = digitsOnly(needle);
  return (
    candidate.name.toLocaleLowerCase('tr').includes(needle) ||
    candidate.emails.some((email) => email.value.includes(needle)) ||
    (digits.length >= 3 && candidate.phones.some((phone) => phone.value.includes(digits)))
  );
}

export interface ContactSelection {
  candidate: ContactCandidate;
  phone?: ContactOption;
  email?: ContactOption;
}

export type ImportOutcome =
  | { kind: 'add'; name: string; phone: string; email: string }
  | { kind: 'merge'; guestId: string; phone: string; email: string }
  | { kind: 'skip'; name: string; reason: string };

/**
 * Seçilen kişiler için işlem planı çıkarır: yeni davetli, mevcutla birleştirme veya atlama.
 * Aynı içe aktarma içindeki yinelenenler de yakalanır.
 */
export function planContactImport(
  guests: readonly Guest[],
  selections: readonly ContactSelection[],
  mergeDuplicates: boolean,
): ImportOutcome[] {
  const pending: GuestIdentity[] = [];
  return selections.map((selection): ImportOutcome => {
    const phone = selection.phone?.display ?? '';
    const email = selection.email?.display ?? '';
    const name = selection.candidate.name;
    const known = [...guests, ...pending];
    const duplicate = findDuplicateGuest(known, { phone, email });
    if (duplicate) {
      const isExisting = guests.some((guest) => guest.id === duplicate.guest.id);
      if (mergeDuplicates && isExisting) return { kind: 'merge', guestId: duplicate.guest.id, phone, email };
      return { kind: 'skip', name, reason: duplicateMessage(duplicate) };
    }
    pending.push({ id: `pending-${pending.length}`, name, phone, email });
    return { kind: 'add', name, phone, email };
  });
}
