import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';

import type { TaskItem } from '@/domain/models';
import { t } from '@/i18n';

const CONSENT_KEY = 'dugun-planim.notification-consent';

export async function configureNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: t('notifications.channelName'),
      description: t('notifications.channelDescription'),
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

export type NotificationPermission = 'granted' | 'denied' | 'undetermined' | 'unavailable';

/** Bu cihazdaki işletim sistemi bildirim iznini okur. İzin penceresi AÇMAZ ve hiçbir şeyi değiştirmez. */
export async function getNotificationPermission(): Promise<NotificationPermission> {
  if (Platform.OS === 'web') return 'unavailable';
  try {
    const result = await Notifications.getPermissionsAsync();
    if (result.granted || result.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) return 'granted';
    const status = result.ios?.status;
    return status === Notifications.IosAuthorizationStatus.NOT_DETERMINED || result.canAskAgain
      ? 'undetermined'
      : 'denied';
  } catch {
    return 'unavailable';
  }
}

export async function requestNotificationConsent(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const result = await Notifications.requestPermissionsAsync();
  const granted = result.granted || result.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  if (await SecureStore.isAvailableAsync()) await SecureStore.setItemAsync(CONSENT_KEY, granted ? 'granted' : 'denied');
  return granted;
}

export async function scheduleTaskReminder(task: TaskItem): Promise<string | undefined> {
  if (!task.dueDate) return undefined;
  const triggerDate = new Date(`${task.dueDate}T09:00:00`);
  triggerDate.setDate(triggerDate.getDate() - 1);
  if (triggerDate.getTime() <= Date.now()) return undefined;
  return Notifications.scheduleNotificationAsync({
    content: {
      title: t('notifications.taskTitle'),
      body: t('notifications.taskBody', { title: task.title }),
      data: { taskId: task.id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
      channelId: Platform.OS === 'android' ? 'reminders' : undefined,
    },
  });
}

export async function cancelTaskReminder(notificationId?: string): Promise<void> {
  if (notificationId) await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/** Uygulamanın planladığı tüm hatırlatmaları iptal eder; kayıtlı izin kararına (SecureStore) dokunmaz. */
export async function cancelAllScheduledReminders(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Hiçbir görevin kayıtlı bildirim kimliğiyle eşleşmeyen, uygulamanın görev hatırlatmalarını iptal eder (ör. geri
 * yüklemeden veya yarım kalmış bir silmeden kalanlar). Yalnız `data.taskId` taşıyan, uygulamanın kendi hatırlatmaları sayılır.
 */
export async function cancelOrphanedReminders(known: ReadonlySet<string>): Promise<number> {
  if (Platform.OS === 'web') return 0;
  let cancelled = 0;
  for (const scheduled of await Notifications.getAllScheduledNotificationsAsync()) {
    const taskId = (scheduled.content?.data as { taskId?: unknown } | undefined)?.taskId;
    if (typeof taskId !== 'string' || known.has(scheduled.identifier)) continue;
    await Notifications.cancelScheduledNotificationAsync(scheduled.identifier);
    cancelled += 1;
  }
  return cancelled;
}

/** Kayıtlı bildirim izin kararını (SecureStore) siler. */
export async function resetNotificationConsent(): Promise<void> {
  if (await SecureStore.isAvailableAsync()) await SecureStore.deleteItemAsync(CONSENT_KEY);
}

/** Tüm hatırlatmaları iptal eder ve kayıtlı izin kararını siler. İkisi de denenir; ilk hata sonda yeniden atılır. */
export async function clearAllNotifications(): Promise<void> {
  let failure: unknown;
  try {
    await cancelAllScheduledReminders();
  } catch (error) {
    failure = error;
  }
  try {
    await resetNotificationConsent();
  } catch (error) {
    failure ??= error;
  }
  if (failure) throw failure;
}
