import { createBackup, parseBackup } from '@/domain/backup';
import { EMPTY_APP_DATA, EMPTY_PROFILE } from '@/domain/models';

const data = {
  ...EMPTY_APP_DATA,
  profile: {
    ...EMPTY_PROFILE,
    couple1Name: 'Ada',
    couple2Name: 'Deniz',
    weddingDate: '2027-06-12',
    estimatedBudgetCents: 1_000_00,
    estimatedGuestCount: 80,
    onboardingCompleted: true,
  },
};

describe('portable backup', () => {
  it('round-trips a versioned backup', () => {
    const raw = createBackup(data, new Date('2026-07-30T12:00:00.000Z'));
    expect(JSON.parse(raw)).toMatchObject({ format: 'dugun-planim-backup', schemaVersion: 3, appVersion: '1.0.0' });
    expect(parseBackup(raw)).toEqual(data);
  });
  it('migrates a schema 1 backup without a venue layout', () => {
    const legacyPayload = { ...data } as Record<string, unknown>;
    delete legacyPayload.venueLayoutItems;
    const restored = parseBackup(
      JSON.stringify({
        format: 'dugun-planim-backup',
        schemaVersion: 1,
        appVersion: '1.0.0',
        exportedAt: '2026-07-30T12:00:00.000Z',
        payload: legacyPayload,
      }),
    );
    expect(restored.venueLayoutItems).toEqual([]);
  });
  it('rejects corrupt JSON without returning partial data', () =>
    expect(() => parseBackup('{broken')).toThrow('geçerli JSON'));
  it('rejects an unknown format', () =>
    expect(() => parseBackup(JSON.stringify({ format: 'other', schemaVersion: 1, payload: data }))).toThrow(
      'Düğün Planım yedeği değil',
    ));
  it('rejects an unsupported schema version', () =>
    expect(() =>
      parseBackup(JSON.stringify({ format: 'dugun-planim-backup', schemaVersion: 999, payload: data })),
    ).toThrow('desteklenmiyor'));
  it('rejects oversized untrusted input before parsing', () =>
    expect(() => parseBackup('x'.repeat(10_000_001))).toThrow('boyutu'));
});
