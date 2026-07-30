import type { TaskItem } from '@/domain/models';

export async function configureNotifications(): Promise<void> {}

export async function requestNotificationConsent(): Promise<boolean> {
  return false;
}

export async function scheduleTaskReminder(_task: TaskItem): Promise<string | undefined> {
  return undefined;
}

export async function cancelTaskReminder(_notificationId?: string): Promise<void> {}

export async function clearAllNotifications(): Promise<void> {}
