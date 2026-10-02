import {
  candidateFromRawContact,
  candidatesFromRawContacts,
  contactMatchesQuery,
  duplicateMessage,
  emailKey,
  findDuplicateGuest,
  isValidEmail,
  mergeContactIntoGuest,
  normalizeEmail,
  normalizePhone,
  phoneKey,
  planContactImport,
} from '@/domain/contacts';
import type { Guest } from '@/domain/models';
import { GUEST_DEFAULTS } from './fixtures';

const now = '2026-10-02T10:00:00.000Z';
const guest = (overrides: Partial<Guest> = {}): Guest => ({
  id: 'g1',
  name: 'Ayşe Demir',
  phone: '',
  side: 'common',
  partySize: 1,
  childCount: 0,
  rsvp: 'pending',
  notes: '',
  mealNotes: '',
  group: 'other',
  ...GUEST_DEFAULTS,
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

describe('Turkish phone normalization', () => {
  it.each([
    '0532 123 45 67',
    '05321234567',
    '532 123 45 67',
    '5321234567',
    '+90 532 123 45 67',
    '+905321234567',
    '0090 532 123 45 67',
    '90 532 123 45 67',
    '(0532) 123-45-67',
    '+90 (532) 123 45 67',
  ])('treats %s as the same mobile number', (raw) => {
    expect(normalizePhone(raw)).toEqual({
      key: '905321234567',
      display: '+90 532 123 45 67',
      isTurkishMobile: true,
    });
  });

  it('recognises landlines as Turkish but not mobile', () => {
    expect(normalizePhone('0212 555 11 22')).toMatchObject({ key: '902125551122', isTurkishMobile: false });
    expect(phoneKey('+90 212 555 11 22')).toBe('902125551122');
  });

  it('keeps foreign international numbers and rejects junk', () => {
    expect(normalizePhone('+44 7700 900123')).toEqual({
      key: '447700900123',
      display: '+447700900123',
      isTurkishMobile: false,
    });
    expect(normalizePhone('')).toBeUndefined();
    expect(normalizePhone('abc')).toBeUndefined();
    expect(normalizePhone('123')).toBeUndefined();
    expect(normalizePhone('0532')).toBeUndefined();
  });
});

describe('email normalization', () => {
  it('validates and lower-cases addresses', () => {
    expect(isValidEmail('ayse@example.com')).toBe(true);
    expect(isValidEmail('ayse@example')).toBe(false);
    expect(isValidEmail('a b@example.com')).toBe(false);
    expect(normalizeEmail('  Ayse@Example.COM ')).toBe('ayse@example.com');
    expect(emailKey('Ayse@Example.com')).toBe('ayse@example.com');
    expect(emailKey('yanlış')).toBeUndefined();
  });
});

describe('duplicate guest detection', () => {
  const guests = [
    guest({ id: 'a', name: 'Ayşe', phone: '0532 123 45 67', email: 'ayse@example.com' }),
    guest({ id: 'b', name: 'Mehmet', phone: '' }),
  ];

  it('matches the same phone in any Turkish format', () => {
    expect(findDuplicateGuest(guests, { phone: '+905321234567' })?.guest.id).toBe('a');
    expect(findDuplicateGuest(guests, { phone: '5321234567' })?.reason).toBe('phone');
  });
  it('matches email case-insensitively', () => {
    const match = findDuplicateGuest(guests, { email: 'AYSE@example.com' });
    expect(match?.reason).toBe('email');
    expect(match && duplicateMessage(match)).toContain('Ayşe');
  });
  it('ignores the record being edited and empty values', () => {
    expect(findDuplicateGuest(guests, { phone: '0532 123 45 67' }, 'a')).toBeUndefined();
    expect(findDuplicateGuest(guests, { phone: '', email: '' })).toBeUndefined();
    expect(findDuplicateGuest(guests, { phone: '0555 000 00 00' })).toBeUndefined();
  });
});

describe('merging a contact into an existing guest', () => {
  it('fills only empty fields', () => {
    const merged = mergeContactIntoGuest(
      guest({ phone: '', email: '' }),
      { phone: '05321234567', email: 'A@b.co' },
      now,
    );
    expect(merged).toMatchObject({ phone: '+90 532 123 45 67', email: 'a@b.co' });
    const untouched = guest({ phone: '0500 000 00 00', email: 'x@y.co' });
    expect(mergeContactIntoGuest(untouched, { phone: '05321234567', email: 'a@b.co' }, now)).toBe(untouched);
  });
});

describe('contact candidates', () => {
  it('builds candidates with unique normalized options and ignores unusable data', () => {
    const candidate = candidateFromRawContact({
      id: 'c1',
      givenName: 'Ayşe',
      familyName: 'Demir',
      phones: [{ number: '0532 123 45 67', label: 'mobile' }, { number: '+90 532 123 45 67' }, { number: 'abc' }],
      emails: [{ address: 'Ayse@Example.com' }, { address: 'ayse@example.com' }, { address: 'bozuk' }],
    });
    expect(candidate?.name).toBe('Ayşe Demir');
    expect(candidate?.phones).toHaveLength(1);
    expect(candidate?.emails).toEqual([{ value: 'ayse@example.com', display: 'Ayse@Example.com', label: '' }]);
    expect(candidateFromRawContact({ id: 'c2', phones: [{ number: '05321234567' }] })).toBeUndefined();
  });

  it('keeps contacts with at least one contact method, sorted with Turkish collation', () => {
    const list = candidatesFromRawContacts([
      { id: '1', givenName: 'Zeynep', phones: [{ number: '05321234567' }] },
      { id: '2', givenName: 'Çağla', phones: [{ number: '05331234567' }] },
      { id: '3', givenName: 'Ada', phones: [], emails: [] },
      { id: '4', givenName: 'Ada', emails: [{ address: 'ada@example.com' }] },
    ]);
    expect(list.map((item) => item.id)).toEqual(['4', '2', '1']);
  });

  it('searches names with Turkish case folding, email and phone digits', () => {
    const [candidate] = candidatesFromRawContacts([
      {
        id: '1',
        givenName: 'İpek',
        familyName: 'Işık',
        phones: [{ number: '0532 123 45 67' }],
        emails: [{ address: 'ipek@example.com' }],
      },
    ]);
    expect(contactMatchesQuery(candidate, 'ipek')).toBe(true);
    expect(contactMatchesQuery(candidate, 'IŞIK')).toBe(true);
    expect(contactMatchesQuery(candidate, '532 123')).toBe(true);
    expect(contactMatchesQuery(candidate, 'ipek@')).toBe(true);
    expect(contactMatchesQuery(candidate, 'zeynep')).toBe(false);
  });
});

describe('import planning', () => {
  const [ayse, mehmet] = candidatesFromRawContacts([
    { id: '1', givenName: 'Ayşe', phones: [{ number: '0532 123 45 67' }], emails: [{ address: 'ayse@example.com' }] },
    { id: '2', givenName: 'Mehmet', phones: [{ number: '0533 999 88 77' }] },
  ]);
  const existing = [guest({ id: 'a', name: 'Ayşe (eski)', phone: '+90 532 123 45 67' })];

  it('skips duplicates by default and merges when asked', () => {
    const selections = [
      { candidate: ayse, phone: ayse.phones[0], email: ayse.emails[0] },
      { candidate: mehmet, phone: mehmet.phones[0] },
    ];
    const skipped = planContactImport(existing, selections, false);
    expect(skipped[0]).toMatchObject({ kind: 'skip' });
    expect(skipped[1]).toMatchObject({ kind: 'add', name: 'Mehmet', phone: '+90 533 999 88 77' });
    const merged = planContactImport(existing, selections, true);
    expect(merged[0]).toMatchObject({ kind: 'merge', guestId: 'a' });
  });

  it('catches duplicates inside the same import', () => {
    const selection = { candidate: mehmet, phone: mehmet.phones[0] };
    const plan = planContactImport([], [selection, { ...selection }], true);
    expect(plan.map((item) => item.kind)).toEqual(['add', 'skip']);
  });
});
