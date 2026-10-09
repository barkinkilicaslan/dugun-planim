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

  it.each(['=1+1', '+SUM(A1:A2)', '-1+2', '@SUM(A1:A2)', ' \t=1+1'])(
    'exports formula-leading guest text as spreadsheet-safe text and preserves it on re-import: %s',
    (name) => {
      const csv = guestsToCsv([{ ...guest, name }]);
      const exportedCell = parseCsvRows(csv)[1][0];
      expect(exportedCell).toBe(`\t${name}`);
      const imported = csvToGuests(csv, () => 'new-id');
      // Guest names are intentionally trimmed by validation; spreadsheet protection itself is removed.
      expect(imported[0].name).toBe(name.trim());
    },
  );

  it('preserves whitespace and formula-like text in notes across export and import', () => {
    const notes = ' \t=1+1';
    const csv = guestsToCsv([{ ...guest, notes }]);
    expect(parseCsvRows(csv)[1][8]).toBe(`\t${notes}`);
    expect(csvToGuests(csv, () => 'new-id')[0].notes).toBe(notes);
  });
});
