import type { Guest } from './models';
import { validateGuest, ValidationError } from './validation';

const HEADERS = ['ad', 'telefon', 'taraf', 'kisi_sayisi', 'cocuk_sayisi', 'rsvp', 'grup', 'yemek_alerji', 'notlar'];

function escapeCell(value: string | number): string {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function guestsToCsv(guests: Guest[]): string {
  const rows = guests.map((guest) => [
    guest.name,
    guest.phone,
    guest.side,
    guest.partySize,
    guest.childCount,
    guest.rsvp,
    guest.group,
    guest.mealNotes,
    guest.notes,
  ]);
  return `\uFEFF${[HEADERS, ...rows].map((row) => row.map(escapeCell).join(',')).join('\r\n')}`;
}

export function parseCsvRows(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  const text = input.replace(/^\uFEFF/, '');
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"' && quoted && text[index + 1] === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) {
      row.push(cell);
      cell = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else cell += char;
  }
  if (quoted) throw new ValidationError('CSV dosyasında kapanmamış tırnak var.');
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((item) => item.some(Boolean));
}

export function csvToGuests(input: string, idFactory: () => string): Guest[] {
  const rows = parseCsvRows(input);
  if (rows.length < 2 || HEADERS.some((header, index) => rows[0]?.[index]?.trim().toLowerCase() !== header)) {
    throw new ValidationError(`CSV başlıkları şu sırada olmalıdır: ${HEADERS.join(', ')}.`);
  }
  const now = new Date().toISOString();
  return rows.slice(1).map((cells, index) => {
    const guest: Guest = {
      id: idFactory(),
      name: cells[0] ?? '',
      phone: cells[1] ?? '',
      side: (['couple1', 'couple2', 'common'].includes(cells[2]) ? cells[2] : 'common') as Guest['side'],
      partySize: Number(cells[3]),
      childCount: Number(cells[4]),
      rsvp: (['pending', 'attending', 'declined'].includes(cells[5]) ? cells[5] : 'pending') as Guest['rsvp'],
      group: (['family', 'friends', 'work', 'other'].includes(cells[6]) ? cells[6] : 'other') as Guest['group'],
      mealNotes: cells[7] ?? '',
      notes: cells[8] ?? '',
      createdAt: now,
      updatedAt: now,
    };
    try {
      return validateGuest(guest);
    } catch (error) {
      throw new ValidationError(`CSV ${index + 2}. satır: ${(error as Error).message}`);
    }
  });
}
