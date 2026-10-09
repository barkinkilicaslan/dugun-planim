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
    expect(JSON.parse(raw)).toMatchObject({ format: 'dugun-planim-backup', schemaVersion: 4, appVersion: '1.0.0' });
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

  it.each([
    [
      'missing payload',
      { format: 'dugun-planim-backup', schemaVersion: 3, appVersion: '1.0.0', exportedAt: '2026-07-30T12:00:00.000Z' },
    ],
    [
      'missing profile',
      {
        format: 'dugun-planim-backup',
        schemaVersion: 3,
        appVersion: '1.0.0',
        exportedAt: '2026-07-30T12:00:00.000Z',
        payload: { ...data, profile: null },
      },
    ],
    [
      'non-object task',
      {
        format: 'dugun-planim-backup',
        schemaVersion: 3,
        appVersion: '1.0.0',
        exportedAt: '2026-07-30T12:00:00.000Z',
        payload: { ...data, tasks: [null] },
      },
    ],
  ])('rejects malformed backup structure (%s) with a user-facing validation error', (_case, envelope) => {
    expect(() => parseBackup(JSON.stringify(envelope))).toThrow('Yedek yapısı geçersiz.');
  });

  it('rejects duplicate entity IDs and dangling guest/vendor links', () => {
    const envelope = (payload: object) =>
      JSON.stringify({
        format: 'dugun-planim-backup',
        schemaVersion: 3,
        appVersion: '1.0.0',
        exportedAt: '2026-07-30T12:00:00.000Z',
        payload,
      });
    const task = {
      id: 'same',
      title: 'Görev',
      category: 'Planlama',
      description: '',
      dueDate: '',
      priority: 'medium',
      completed: false,
      createdAt: '2026-07-30T12:00:00.000Z',
      updatedAt: '2026-07-30T12:00:00.000Z',
    };
    const guest = {
      id: 'guest-1',
      name: 'Ada',
      phone: '',
      email: '',
      side: 'common',
      partySize: 1,
      childCount: 0,
      rsvp: 'pending',
      notes: '',
      mealNotes: '',
      group: 'other',
      rsvpSource: 'none',
      rsvpRespondedAt: '',
      lastInviteSentAt: '',
      lastInviteChannel: '',
      inviteStatus: 'none',
      createdAt: '2026-07-30T12:00:00.000Z',
      updatedAt: '2026-07-30T12:00:00.000Z',
    };
    const budgetItem = {
      id: 'budget-1',
      title: 'Salon',
      category: 'Mekân',
      plannedCents: 1000,
      actualCents: 1000,
      paidCents: 0,
      dueDate: '',
      vendorId: 'missing',
      notes: '',
      createdAt: '2026-07-30T12:00:00.000Z',
      updatedAt: '2026-07-30T12:00:00.000Z',
    };
    const withDuplicateTasks = { ...data, tasks: [task, { ...task }] };
    expect(() => parseBackup(envelope(withDuplicateTasks))).toThrow('Yedek yapısı geçersiz.');
    expect(() => parseBackup(envelope({ ...data, guests: [{ ...guest, tableId: 'missing' }] }))).toThrow(
      'Yedek yapısı geçersiz.',
    );
    expect(() => parseBackup(envelope({ ...data, budgetItems: [budgetItem] }))).toThrow('Yedek yapısı geçersiz.');
  });

  it('rejects enum values that the app cannot safely display', () => {
    const raw = JSON.stringify({
      format: 'dugun-planim-backup',
      schemaVersion: 3,
      appVersion: '1.0.0',
      exportedAt: '2026-07-30T12:00:00.000Z',
      payload: { ...data, profile: { ...data.profile, currency: 'BTC' } },
    });
    expect(() => parseBackup(raw)).toThrow('Yedek yapısı geçersiz.');
  });
});
