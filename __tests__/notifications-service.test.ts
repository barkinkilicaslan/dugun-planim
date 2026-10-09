import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';

import {
  cancelAllScheduledReminders,
  cancelOrphanedReminders,
  clearAllNotifications,
  getNotificationPermission,
} from '@/services/notifications';

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  IosAuthorizationStatus: { NOT_DETERMINED: 0, DENIED: 1, AUTHORIZED: 2, PROVISIONAL: 3, EPHEMERAL: 4 },
  AndroidImportance: { DEFAULT: 3 },
  SchedulableTriggerInputTypes: { DATE: 'date' },
}));
jest.mock('expo-secure-store', () => ({
  isAvailableAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const mocked = Notifications as unknown as Record<string, jest.Mock>;
const store = SecureStore as unknown as Record<string, jest.Mock>;

beforeEach(() => {
  jest.clearAllMocks();
  store.isAvailableAsync.mockResolvedValue(true);
  store.deleteItemAsync.mockResolvedValue(undefined);
  mocked.cancelAllScheduledNotificationsAsync.mockResolvedValue(undefined);
  mocked.cancelScheduledNotificationAsync.mockResolvedValue(undefined);
});

describe('getNotificationPermission', () => {
  it.each([
    [{ granted: true, canAskAgain: true }, 'granted'],
    [{ granted: false, canAskAgain: false, ios: { status: 3 } }, 'granted'],
    [{ granted: false, canAskAgain: true, ios: { status: 0 } }, 'undetermined'],
    [{ granted: false, canAskAgain: true }, 'undetermined'],
    [{ granted: false, canAskAgain: false, ios: { status: 1 } }, 'denied'],
    [{ granted: false, canAskAgain: false }, 'denied'],
  ])('maps %j to %s', async (response, expected) => {
    mocked.getPermissionsAsync.mockResolvedValue(response);
    expect(await getNotificationPermission()).toBe(expected);
  });

  it('only reads the permission: it never opens a permission prompt', async () => {
    mocked.getPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: true, ios: { status: 0 } });
    await getNotificationPermission();
    expect(mocked.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it('reports "unavailable" when the system cannot answer', async () => {
    mocked.getPermissionsAsync.mockRejectedValue(new Error('yok'));
    expect(await getNotificationPermission()).toBe('unavailable');
  });
});

describe('cancelOrphanedReminders', () => {
  const scheduled = (identifier: string, data?: Record<string, unknown>) => ({ identifier, content: { data } });

  it("cancels only the app's own task reminders that no saved task points to", async () => {
    mocked.getAllScheduledNotificationsAsync.mockResolvedValue([
      scheduled('keep', { taskId: 't1' }),
      scheduled('orphan-1', { taskId: 't2' }),
      scheduled('orphan-2', { taskId: 't3' }),
      scheduled('other-kind', { campaign: 'x' }),
      scheduled('no-data'),
      scheduled('bad-task-id', { taskId: 42 }),
    ]);
    expect(await cancelOrphanedReminders(new Set(['keep']))).toBe(2);
    expect(mocked.cancelScheduledNotificationAsync.mock.calls.map(([id]) => id)).toEqual(['orphan-1', 'orphan-2']);
  });

  it('does nothing when every reminder belongs to a saved task', async () => {
    mocked.getAllScheduledNotificationsAsync.mockResolvedValue([scheduled('a', { taskId: 't1' })]);
    expect(await cancelOrphanedReminders(new Set(['a']))).toBe(0);
    expect(mocked.cancelScheduledNotificationAsync).not.toHaveBeenCalled();
  });
});

describe('clearing reminders', () => {
  it('cancelAllScheduledReminders leaves the stored consent decision alone', async () => {
    await cancelAllScheduledReminders();
    expect(mocked.cancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);
    expect(store.deleteItemAsync).not.toHaveBeenCalled();
  });

  it('clearAllNotifications removes the reminders and the consent decision', async () => {
    await clearAllNotifications();
    expect(mocked.cancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);
    expect(store.deleteItemAsync).toHaveBeenCalledTimes(1);
  });

  it('still removes the consent decision when cancelling reminders fails, then reports the failure', async () => {
    mocked.cancelAllScheduledNotificationsAsync.mockRejectedValueOnce(new Error('iptal edilemedi'));
    await expect(clearAllNotifications()).rejects.toThrow('iptal edilemedi');
    expect(store.deleteItemAsync).toHaveBeenCalledTimes(1);
  });

  it('still cancels the reminders when removing the consent decision fails, then reports the failure', async () => {
    store.deleteItemAsync.mockRejectedValueOnce(new Error('anahtar silinemedi'));
    await expect(clearAllNotifications()).rejects.toThrow('anahtar silinemedi');
    expect(mocked.cancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);
  });
});
