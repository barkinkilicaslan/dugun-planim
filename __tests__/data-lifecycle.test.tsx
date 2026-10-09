import { act, renderHook, waitFor } from '@testing-library/react-native';

import { AppProvider, useApp } from '@/context/app-context';
import { repository } from '@/data/repository';
import { restoreCompleteMessage } from '@/domain/backup-notices';
import { deleteLeftoverLabels, deletePartialBody } from '@/domain/data-lifecycle';
import { EMPTY_APP_DATA, EMPTY_PROFILE, type AppData, type TaskItem } from '@/domain/models';
import { createTranslator } from '@/i18n';
import * as notifications from '@/services/notifications';

const TR = createTranslator('tr');
const EN = createTranslator('en');
const now = '2026-10-02T10:00:00.000Z';

/** Çağrı sırasını kaydeder: "önce veritabanı, sonra dış temizlik" kuralını doğrulamak için. */
const mockOrder: string[] = [];
const mockRecord = (name: string) => () => {
  mockOrder.push(name);
};

jest.mock('@/data/repository', () => ({
  repository: {
    initialize: jest.fn().mockResolvedValue(undefined),
    load: jest.fn(),
    clearAll: jest.fn(),
    replaceAll: jest.fn(),
    upsertTask: jest.fn(),
    saveProfile: jest.fn(),
  },
}));
jest.mock('@/services/notifications', () => ({
  clearAllNotifications: jest.fn(),
  requestNotificationConsent: jest.fn(),
  scheduleTaskReminder: jest.fn(),
  cancelTaskReminder: jest.fn(),
  getNotificationPermission: jest.fn(),
  cancelAllScheduledReminders: jest.fn(),
  cancelOrphanedReminders: jest.fn(),
  resetNotificationConsent: jest.fn(),
}));
jest.mock('@/services/invitation-photos', () => ({
  removeAllInvitationPhotos: jest.fn(),
  removeInvitationPhoto: jest.fn(),
  removeUnreferencedInvitationPhotos: jest.fn(),
}));
jest.mock('@/services/personal-invitations', () => ({
  removeAllPersonalInvitationFiles: jest.fn(),
  removePersonalInvitationFile: jest.fn(),
  removeUnreferencedPersonalInvitationFiles: jest.fn(),
}));
jest.mock('@/services/export-files', () => ({ removeAllExportFiles: jest.fn() }));
jest.mock('@/services/invitation-files', () => ({ removeInvitationTempFiles: jest.fn() }));

const photos = jest.requireMock('@/services/invitation-photos') as Record<string, jest.Mock>;
const personal = jest.requireMock('@/services/personal-invitations') as Record<string, jest.Mock>;
const exportsMock = jest.requireMock('@/services/export-files') as Record<string, jest.Mock>;
const invitationFiles = jest.requireMock('@/services/invitation-files') as Record<string, jest.Mock>;
const repo = repository as unknown as Record<string, jest.Mock>;
const notif = notifications as unknown as Record<string, jest.Mock>;

const task = (id: string, overrides: Partial<TaskItem> = {}): TaskItem => ({
  id,
  category: 'Venue',
  title: `Görev ${id}`,
  description: '',
  dueDate: '2099-01-01',
  priority: 'medium',
  completed: false,
  createdAt: now,
  updatedAt: now,
  ...overrides,
});
const profile = (overrides = {}) => ({
  ...EMPTY_PROFILE,
  couple1Name: 'Ada',
  couple2Name: 'Deniz',
  weddingDate: '2099-06-12',
  estimatedBudgetCents: 100,
  estimatedGuestCount: 2,
  onboardingCompleted: true,
  ...overrides,
});
const appData = (overrides: Partial<AppData> = {}): AppData => ({
  ...EMPTY_APP_DATA,
  profile: profile(),
  ...overrides,
});

async function mount(
  initial: AppData = appData({ notes: [{ id: 'n1', title: 'N', content: 'x', createdAt: now, updatedAt: now }] }),
) {
  repo.load.mockResolvedValue(initial);
  const wrapper = ({ children }: { children: React.ReactNode }) => <AppProvider>{children}</AppProvider>;
  const hook = await renderHook(() => useApp(), { wrapper });
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return hook;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockOrder.length = 0;
  repo.initialize.mockResolvedValue(undefined);
  repo.clearAll.mockImplementation(async () => mockRecord('db')());
  repo.replaceAll.mockImplementation(async () => mockRecord('db')());
  repo.upsertTask.mockResolvedValue(undefined);
  notif.clearAllNotifications.mockImplementation(async () => mockRecord('reminders')());
  notif.cancelAllScheduledReminders.mockImplementation(async () => mockRecord('cancelAll')());
  notif.cancelOrphanedReminders.mockResolvedValue(0);
  notif.resetNotificationConsent.mockResolvedValue(undefined);
  notif.getNotificationPermission.mockResolvedValue('granted');
  notif.scheduleTaskReminder.mockImplementation(async (item: TaskItem) =>
    item.id === 't-past' ? undefined : `new-${item.id}`,
  );
  notif.cancelTaskReminder.mockResolvedValue(undefined);
  photos.removeAllInvitationPhotos.mockImplementation(async () => mockRecord('photos')());
  photos.removeUnreferencedInvitationPhotos.mockResolvedValue(undefined);
  personal.removeAllPersonalInvitationFiles.mockImplementation(async () => mockRecord('personal')());
  personal.removeUnreferencedPersonalInvitationFiles.mockResolvedValue(undefined);
  exportsMock.removeAllExportFiles.mockImplementation(() => {
    mockOrder.push('exports');
    return { removed: 1, failed: 0 };
  });
  invitationFiles.removeInvitationTempFiles.mockImplementation(() => {
    mockOrder.push('temp');
    return { removed: 1, failed: 0 };
  });
});

describe('"Tüm verilerimi sil" is safe when something fails', () => {
  it('clears the database first and only then the outside files and reminders', async () => {
    const { result } = await mount();
    let outcome: Awaited<ReturnType<typeof result.current.clearAll>> | undefined;
    await act(async () => {
      outcome = await result.current.clearAll();
    });
    expect(outcome).toEqual({ leftovers: [] });
    expect(mockOrder[0]).toBe('db');
    expect([...mockOrder].sort()).toEqual(['db', 'exports', 'personal', 'photos', 'reminders', 'temp'].sort());
    expect(result.current.data.notes).toEqual([]);
    expect(result.current.data.profile.onboardingCompleted).toBe(false);
  });

  it('destroys nothing when the database cannot be cleared, keeps the data, and can be retried', async () => {
    const { result } = await mount();
    repo.clearAll.mockRejectedValueOnce(new Error('disk dolu'));
    await act(async () => {
      await expect(result.current.clearAll()).rejects.toThrow('disk dolu');
    });
    expect(mockOrder).toEqual([]);
    expect(notif.clearAllNotifications).not.toHaveBeenCalled();
    expect(photos.removeAllInvitationPhotos).not.toHaveBeenCalled();
    expect(personal.removeAllPersonalInvitationFiles).not.toHaveBeenCalled();
    expect(exportsMock.removeAllExportFiles).not.toHaveBeenCalled();
    expect(result.current.data.notes).toHaveLength(1);
    let retry: Awaited<ReturnType<typeof result.current.clearAll>> | undefined;
    await act(async () => {
      retry = await result.current.clearAll();
    });
    expect(retry).toEqual({ leftovers: [] });
    expect(result.current.data.notes).toEqual([]);
  });

  it.each([
    ['reminders', () => notif.clearAllNotifications.mockRejectedValueOnce(new Error('x'))],
    ['invitationPhotos', () => photos.removeAllInvitationPhotos.mockRejectedValueOnce(new Error('x'))],
    ['personalInvitations', () => personal.removeAllPersonalInvitationFiles.mockRejectedValueOnce(new Error('x'))],
    ['exportFiles', () => exportsMock.removeAllExportFiles.mockReturnValueOnce({ removed: 0, failed: 2 })],
    ['temporaryFiles', () => invitationFiles.removeInvitationTempFiles.mockReturnValueOnce({ removed: 0, failed: 1 })],
  ])('reports exactly which leftover (%s) could not be removed and still removes the others', async (kind, fail) => {
    const { result } = await mount();
    fail();
    let outcome: Awaited<ReturnType<typeof result.current.clearAll>> | undefined;
    await act(async () => {
      outcome = await result.current.clearAll();
    });
    expect(outcome).toEqual({ leftovers: [kind] });
    // Veritabanı yine de temizlendi; yalnız bildirilen kalıntı kaldı, diğerleri denendi.
    expect(result.current.data.notes).toEqual([]);
    for (const fn of [
      notif.clearAllNotifications,
      photos.removeAllInvitationPhotos,
      personal.removeAllPersonalInvitationFiles,
      exportsMock.removeAllExportFiles,
      invitationFiles.removeInvitationTempFiles,
    ])
      expect(fn).toHaveBeenCalledTimes(1);
    // Tekrar çalıştırmak güvenli ve tamamlar.
    await act(async () => {
      outcome = await result.current.clearAll();
    });
    expect(outcome).toEqual({ leftovers: [] });
  });

  it('collects several leftovers at once', async () => {
    const { result } = await mount();
    notif.clearAllNotifications.mockRejectedValueOnce(new Error('x'));
    exportsMock.removeAllExportFiles.mockReturnValueOnce({ removed: 0, failed: 1 });
    let outcome: Awaited<ReturnType<typeof result.current.clearAll>> | undefined;
    await act(async () => {
      outcome = await result.current.clearAll();
    });
    expect(outcome?.leftovers).toEqual(['reminders', 'exportFiles']);
    expect(deletePartialBody(TR, outcome?.leftovers ?? [])).toContain('planlı hatırlatmalar ve dışa aktarma dosyaları');
    expect(deletePartialBody(EN, outcome?.leftovers ?? [])).toContain('scheduled reminders and export files');
    expect(deleteLeftoverLabels(EN, ['reminders', 'exportFiles', 'temporaryFiles'])).toBe(
      'scheduled reminders, export files and temporary invitation files',
    );
    expect(deleteLeftoverLabels(TR, ['reminders'])).toBe('planlı hatırlatmalar');
  });
});

describe('backup restore reconciles reminders', () => {
  const backup = (profileOverrides = {}) =>
    appData({
      profile: profile(profileOverrides),
      tasks: [
        task('t1', { notificationId: 'old-1' }),
        task('t2', { notificationId: 'old-2', completed: true }),
        task('t3'),
        task('t-past', { notificationId: 'old-4', dueDate: '2020-01-01' }),
      ],
    });

  it('cancels old reminders, reschedules only reminder tasks on this device and saves the new ids', async () => {
    const { result } = await mount();
    let outcome: Awaited<ReturnType<typeof result.current.replaceAll>> | undefined;
    await act(async () => {
      outcome = await result.current.replaceAll(backup({ notificationsEnabled: true }));
    });
    // Veritabanına yedekteki (başka cihaza ait) bildirim kimlikleri yazılmaz.
    const saved = repo.replaceAll.mock.calls[0][0] as AppData;
    expect(saved.tasks.every((item) => item.notificationId === undefined)).toBe(true);
    expect(saved.profile.notificationsEnabled).toBe(true);
    // Eski hatırlatmalar iptal edilir; veritabanından SONRA.
    expect(mockOrder).toEqual(['db', 'cancelAll']);
    expect(notif.scheduleTaskReminder.mock.calls.map(([item]) => (item as TaskItem).id)).toEqual(['t1', 't-past']);
    expect(repo.upsertTask).toHaveBeenCalledTimes(1);
    expect(repo.upsertTask).toHaveBeenCalledWith(expect.objectContaining({ id: 't1', notificationId: 'new-t1' }));
    const ids = Object.fromEntries(result.current.data.tasks.map((item) => [item.id, item.notificationId]));
    expect(ids).toEqual({ t1: 'new-t1', t2: undefined, t3: undefined, 't-past': undefined });
    expect(outcome).toEqual({
      notificationsEnabled: true,
      notificationsDowngraded: false,
      remindersRestored: 1,
      remindersSkipped: 1,
    });
    expect(notif.requestNotificationConsent).not.toHaveBeenCalled();
  });

  it("does not treat the backup's notificationsEnabled as this device's permission, and never asks for permission", async () => {
    notif.getNotificationPermission.mockResolvedValue('denied');
    const { result } = await mount();
    let outcome: Awaited<ReturnType<typeof result.current.replaceAll>> | undefined;
    await act(async () => {
      outcome = await result.current.replaceAll(backup({ notificationsEnabled: true }));
    });
    expect((repo.replaceAll.mock.calls[0][0] as AppData).profile.notificationsEnabled).toBe(false);
    expect(result.current.data.profile.notificationsEnabled).toBe(false);
    expect(notif.scheduleTaskReminder).not.toHaveBeenCalled();
    expect(notif.requestNotificationConsent).not.toHaveBeenCalled();
    // Eski hatırlatmalar yine de iptal edilir (eski görev başlıklarıyla kalmaz).
    expect(notif.cancelAllScheduledReminders).toHaveBeenCalledTimes(1);
    expect(outcome).toEqual({
      notificationsEnabled: false,
      notificationsDowngraded: true,
      remindersRestored: 0,
      remindersSkipped: 2,
    });
    expect(result.current.data.tasks.every((item) => item.notificationId === undefined)).toBe(true);
  });

  it.each(['undetermined', 'unavailable'])('treats "%s" like no permission (no silent prompt)', async (state) => {
    notif.getNotificationPermission.mockResolvedValue(state);
    const { result } = await mount();
    await act(async () => {
      await result.current.replaceAll(backup({ notificationsEnabled: true }));
    });
    expect(notif.requestNotificationConsent).not.toHaveBeenCalled();
    expect(notif.scheduleTaskReminder).not.toHaveBeenCalled();
    expect(result.current.data.profile.notificationsEnabled).toBe(false);
  });

  it('keeps notifications off when the backup had them off, even if this device allows them', async () => {
    const { result } = await mount();
    let outcome: Awaited<ReturnType<typeof result.current.replaceAll>> | undefined;
    await act(async () => {
      outcome = await result.current.replaceAll(backup({ notificationsEnabled: false }));
    });
    expect(result.current.data.profile.notificationsEnabled).toBe(false);
    expect(notif.scheduleTaskReminder).not.toHaveBeenCalled();
    expect(outcome?.notificationsDowngraded).toBe(false);
    // Hiçbir şey denenmediği için "atlandı" sayılmaz ve kullanıcıya yanıltıcı not gösterilmez.
    expect(outcome?.remindersSkipped).toBe(0);
    expect(restoreCompleteMessage(TR, 0, outcome)).toBe(TR('backup.restoredPlain'));
  });

  it('still reports success when a step after the database write fails (the data is already restored)', async () => {
    notif.cancelAllScheduledReminders.mockRejectedValueOnce(new Error('iptal edilemedi'));
    const { result } = await mount();
    let outcome: Awaited<ReturnType<typeof result.current.replaceAll>> | undefined;
    await act(async () => {
      outcome = await result.current.replaceAll(backup({ notificationsEnabled: true }));
    });
    expect(outcome).toBeDefined();
    expect(result.current.data.tasks).toHaveLength(4);
    expect(result.current.data.profile.couple1Name).toBe('Ada');
  });

  it('shows the restored data immediately after the database write, even if reminder scheduling later fails', async () => {
    notif.scheduleTaskReminder.mockRejectedValue(new Error('planlanamadı'));
    const { result } = await mount();
    let outcome: Awaited<ReturnType<typeof result.current.replaceAll>> | undefined;
    await act(async () => {
      outcome = await result.current.replaceAll(backup({ notificationsEnabled: true }));
    });
    expect(outcome).toMatchObject({ remindersRestored: 0, remindersSkipped: 2 });
    expect(result.current.data.tasks.map((item) => item.id).sort()).toEqual(['t-past', 't1', 't2', 't3']);
  });

  it('leaves existing reminders and files alone when the database restore fails', async () => {
    const { result } = await mount();
    repo.replaceAll.mockRejectedValueOnce(new Error('bozuk'));
    await act(async () => {
      await expect(result.current.replaceAll(backup({ notificationsEnabled: true }))).rejects.toThrow('bozuk');
    });
    expect(notif.cancelAllScheduledReminders).not.toHaveBeenCalled();
    expect(notif.scheduleTaskReminder).not.toHaveBeenCalled();
    expect(photos.removeInvitationPhoto).not.toHaveBeenCalled();
  });

  it('counts a reminder that fails to schedule or save as skipped, and cleans up its notification', async () => {
    notif.scheduleTaskReminder.mockImplementation(async (item: TaskItem) => `new-${item.id}`);
    repo.upsertTask.mockRejectedValueOnce(new Error('yazılamadı'));
    const { result } = await mount();
    let outcome: Awaited<ReturnType<typeof result.current.replaceAll>> | undefined;
    await act(async () => {
      outcome = await result.current.replaceAll(backup({ notificationsEnabled: true }));
    });
    expect(notif.cancelTaskReminder).toHaveBeenCalledWith('new-t1');
    expect(outcome).toMatchObject({ remindersRestored: 1, remindersSkipped: 1 });
    expect(result.current.data.tasks.find((item) => item.id === 't1')?.notificationId).toBeUndefined();
  });

  it("keeps this device's uploaded invitations during a restore", async () => {
    const mine = {
      id: 'p1',
      name: 'Benim',
      imageUri: 'file:///d/p1.png',
      width: 1,
      height: 1,
      sizeBytes: 1,
      createdAt: now,
      updatedAt: now,
    };
    const { result } = await mount(appData({ personalInvitations: [mine as never] }));
    await act(async () => {
      await result.current.replaceAll(backup());
    });
    expect(result.current.data.personalInvitations).toHaveLength(1);
  });
});

describe('startup clean-up of a stale notification consent', () => {
  it('forgets a leftover consent decision when the app is not set up (e.g. after an interrupted delete)', async () => {
    await mount(appData({ profile: profile({ onboardingCompleted: false }) }));
    expect(notif.resetNotificationConsent).toHaveBeenCalledTimes(1);
  });

  it('keeps the consent decision of a set-up app', async () => {
    await mount();
    expect(notif.resetNotificationConsent).not.toHaveBeenCalled();
  });

  it('does not fail startup when the secure store cannot be cleared', async () => {
    notif.resetNotificationConsent.mockRejectedValueOnce(new Error('keychain yok'));
    const { result } = await mount(appData({ profile: profile({ onboardingCompleted: false }) }));
    expect(result.current.error).toBeUndefined();
  });
});

describe('startup clean-up of orphaned reminders', () => {
  it('passes the notification ids that belong to saved tasks and never fails startup', async () => {
    await mount(
      appData({ tasks: [task('a', { notificationId: 'keep-a' }), task('b'), task('c', { notificationId: 'keep-c' })] }),
    );
    expect(notif.cancelOrphanedReminders).toHaveBeenCalledTimes(1);
    expect([...(notif.cancelOrphanedReminders.mock.calls[0][0] as Set<string>)].sort()).toEqual(['keep-a', 'keep-c']);
  });

  it('keeps the app usable if the notification service fails', async () => {
    notif.cancelOrphanedReminders.mockRejectedValueOnce(new Error('bildirim servisi yok'));
    const { result } = await mount();
    expect(result.current.error).toBeUndefined();
    expect(result.current.data.notes).toHaveLength(1);
  });
});

describe('restore message', () => {
  it('adds an honest notification note and no note when nothing changed', () => {
    const base = TR('backup.restoredPlain');
    expect(restoreCompleteMessage(TR, 0)).toBe(base);
    expect(
      restoreCompleteMessage(TR, 0, {
        notificationsEnabled: true,
        notificationsDowngraded: false,
        remindersRestored: 0,
        remindersSkipped: 0,
      }),
    ).toBe(base);
    expect(
      restoreCompleteMessage(EN, 0, {
        notificationsEnabled: false,
        notificationsDowngraded: true,
        remindersRestored: 0,
        remindersSkipped: 2,
      }),
    ).toBe(`${EN('backup.restoredPlain')}\n\n${EN('backup.restoredNotificationsOff')}`);
    const partial = restoreCompleteMessage(TR, 0, {
      notificationsEnabled: true,
      notificationsDowngraded: false,
      remindersRestored: 3,
      remindersSkipped: 1,
    });
    expect(partial).toContain('3 görevin hatırlatması bu cihaz için yeniden planlandı');
    expect(partial).toContain('1 görevin hatırlatması planlanamadı');
  });
});
