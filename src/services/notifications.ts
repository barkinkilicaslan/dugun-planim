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

export async function clearAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (await SecureStore.isAvailableAsync()) await SecureStore.deleteItemAsync(CONSENT_KEY);
}
