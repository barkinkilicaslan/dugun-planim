import { formatDate } from '@/domain/calculations';
import {
  compareIsoDates,
  daysInMonth,
  formatLong,
  formatLongWithWeekday,
  formatNumeric,
  isLeapYear,
  isoFromLocalDate,
  isPastDate,
  localDateFromIso,
  parseIsoDate,
  timeFromLocalDate,
  todayIso,
  weddingDateError,
} from '@/domain/wedding-date';

describe('Turkish wedding date helpers', () => {
  it('formats numeric GG.AA.YYYY and long Turkish dates', () => {
    expect(formatNumeric('2026-10-02')).toBe('02.10.2026');
    expect(formatLong('2026-10-02')).toBe('2 Ekim 2026');
    expect(formatLongWithWeekday('2026-10-02')).toBe('2 Ekim 2026 Cuma');
    expect(formatLong('2027-03-09')).toBe('9 Mart 2027');
    expect(formatLong('2027-12-31')).toBe('31 Aralık 2027');
    expect(formatDate('2026-10-02', 'DD.MM.YYYY')).toBe('02.10.2026');
    expect(formatDate('2026-10-02', 'YYYY-MM-DD')).toBe('2026-10-02');
  });

  it('leaves invalid values untouched instead of inventing a date', () => {
    expect(formatNumeric('02.10.2026')).toBe('02.10.2026');
    expect(formatLong('')).toBe('');
  });

  it('handles leap years and month ends', () => {
    expect(isLeapYear(2028)).toBe(true);
    expect(isLeapYear(2100)).toBe(false);
    expect(isLeapYear(2000)).toBe(true);
    expect(daysInMonth(2028, 2)).toBe(29);
    expect(daysInMonth(2027, 2)).toBe(28);
    expect(daysInMonth(2027, 4)).toBe(30);
    expect(daysInMonth(2027, 12)).toBe(31);
    expect(parseIsoDate('2028-02-29')).toEqual({ year: 2028, month: 2, day: 29 });
    expect(parseIsoDate('2027-02-29')).toBeUndefined();
    expect(parseIsoDate('2027-04-31')).toBeUndefined();
    expect(parseIsoDate('2027-13-01')).toBeUndefined();
    expect(parseIsoDate('2027-6-1')).toBeUndefined();
  });

  it('does not shift the calendar day for any local time of day', () => {
    // Seçici, saat dilimine bağlı bir Date döndürür; yalnız yerel gün/ay/yıl okunur.
    for (const [hours, minutes] of [
      [0, 0],
      [0, 30],
      [12, 0],
      [23, 59],
    ]) {
      expect(isoFromLocalDate(new Date(2027, 2, 28, hours, minutes))).toBe('2027-03-28');
    }
    expect(isoFromLocalDate(new Date(2028, 1, 29, 23, 59))).toBe('2028-02-29');
    expect(isoFromLocalDate(new Date(2027, 11, 31, 0, 0))).toBe('2027-12-31');
  });

  it('round-trips through the picker Date at local noon, including DST change days', () => {
    for (const iso of ['2027-03-28', '2027-10-31', '2026-03-29', '2027-01-01', '2028-02-29', '2027-12-31']) {
      const picker = localDateFromIso(iso);
      expect(picker?.getHours()).toBe(12);
      expect(picker && isoFromLocalDate(picker)).toBe(iso);
    }
    expect(localDateFromIso('2027-02-30')).toBeUndefined();
  });

  it('is independent of the process time zone', () => {
    const original = process.env.TZ;
    try {
      for (const zone of ['Europe/Istanbul', 'Pacific/Kiritimati', 'Pacific/Pago_Pago', 'America/Los_Angeles']) {
        process.env.TZ = zone;
        expect(formatNumeric('2027-06-12')).toBe('12.06.2027');
        const picker = localDateFromIso('2027-06-12');
        expect(picker && isoFromLocalDate(picker)).toBe('2027-06-12');
        expect(todayIso(new Date(2026, 9, 2, 23, 59))).toBe('2026-10-02');
      }
    } finally {
      if (original === undefined) delete process.env.TZ;
      else process.env.TZ = original;
    }
  });

  it('uses the local calendar day for "today" regardless of UTC offset', () => {
    expect(todayIso(new Date(2026, 9, 2, 0, 5))).toBe('2026-10-02');
    expect(todayIso(new Date(2026, 9, 2, 23, 55))).toBe('2026-10-02');
  });

  it('rejects past, missing and impossible wedding dates only', () => {
    const now = new Date(2026, 9, 2, 15, 0);
    expect(weddingDateError('', now)).toMatch(/seçin/);
    expect(weddingDateError('2027-02-31', now)).toMatch(/geçerli/);
    expect(weddingDateError('2026-10-01', now)).toMatch(/geçmişte/);
    expect(weddingDateError('2026-10-02', now)).toBeUndefined();
    expect(weddingDateError('2027-06-12', now)).toBeUndefined();
    expect(isPastDate('2025-01-01', now)).toBe(true);
    expect(compareIsoDates('2026-10-02', '2026-10-03')).toBeLessThan(0);
  });

  it('formats picker time as HH:MM', () => {
    expect(timeFromLocalDate(new Date(2000, 0, 1, 7, 5))).toBe('07:05');
    expect(timeFromLocalDate(new Date(2000, 0, 1, 19, 30))).toBe('19:30');
  });
});
