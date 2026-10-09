import type { TaskItem } from '@/domain/models';

/**
 * Web derlemesinde yerel bildirim yoktur. Bu dosya `notifications.ts` ile aynı dışa aktarımları taşımalıdır
 * (`__tests__/platform-parity.test.ts` bunu denetler); aksi halde uygulama bağlamı web'de eksik işlevi çağırıp çöker.
 */
export type NotificationPermission = 'granted' | 'denied' | 'undetermined' | 'unavailable';

export async function configureNotifications(): Promise<void> {}

export async function getNotificationPermission(): Promise<NotificationPermission> {
  return 'unavailable';
}

export async function requestNotificationConsent(): Promise<boolean> {
  return false;
}

export async function scheduleTaskReminder(_task: TaskItem): Promise<string | undefined> {
  return undefined;
}

export async function cancelTaskReminder(_notificationId?: string): Promise<void> {}

export async function cancelAllScheduledReminders(): Promise<void> {}

export async function cancelOrphanedReminders(_known: ReadonlySet<string>): Promise<number> {
  return 0;
}

export async function resetNotificationConsent(): Promise<void> {}

export async function clearAllNotifications(): Promise<void> {}
