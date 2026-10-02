import { csvToGuests, guestsToCsv, parseCsvRows } from '@/domain/csv';
import type { Guest } from '@/domain/models';
import { GUEST_DEFAULTS } from './fixtures';

const guest: Guest = {
  id: 'g1',
  name: 'Ayşe, Demir',
  phone: '+90 555 000 00 00',
  side: 'couple1',
  partySize: 3,
  childCount: 1,
  rsvp: 'attending',
  notes: 'Pencere "yanı"',
  mealNotes: 'Glütensiz',
  group: 'family',
  ...GUEST_DEFAULTS,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

describe('guest CSV', () => {
  it('escapes commas and quotes and imports a valid exported row', () => {
    const csv = guestsToCsv([guest]);
    expect(parseCsvRows(csv)[1][0]).toBe('Ayşe, Demir');
    const imported = csvToGuests(csv, () => 'new-id');
    expect(imported[0]).toMatchObject({
      id: 'new-id',
      name: guest.name,
      partySize: 3,
      childCount: 1,
      notes: guest.notes,
    });
  });
  it('rejects a changed header and malformed quotes', () => {
    expect(() => csvToGuests('wrong,header\nvalue,value', () => 'x')).toThrow('başlıkları');
    expect(() => parseCsvRows('"unfinished')).toThrow('kapanmamış');
  });
});
