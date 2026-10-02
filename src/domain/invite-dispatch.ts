import { emailKey, normalizePhone } from './contacts';
import type { PlainMessageKey, Translator } from '@/i18n';
import type { Guest, InviteChannel } from './models';

/**
 * Davetiye gönderiminde uygulama hiçbir mesajı kendisi göndermez. Her adım işletim sisteminin e-posta, SMS,
 * WhatsApp veya paylaşım ekranını açar; son onay kullanıcıdadır. Toplu gönderim, kullanıcının her adımı
 * onayladığı sıralı bir kuyruktur.
 */

export interface DeviceCapabilities {
  mail: boolean;
  sms: boolean;
  /** `undefined`: önceden bilinemez; açma denemesi başarısız olursa paylaşım menüsü önerilir. */
  whatsapp?: boolean;
}

export interface ChannelAvailability {
  channel: InviteChannel;
  available: boolean;
  /** Uygun değilse nedenin çeviri anahtarı; metin arayüzde etkin dile çevrilir. */
  reason?: PlainMessageKey;
}

export function channelAvailability(
  guest: Pick<Guest, 'phone' | 'email'>,
  channel: InviteChannel,
  device: DeviceCapabilities,
): ChannelAvailability {
  switch (channel) {
    case 'email':
      if (!emailKey(guest.email)) return { channel, available: false, reason: 'dispatch.noEmail' };
      if (!device.mail) return { channel, available: false, reason: 'dispatch.noMailAccount' };
      return { channel, available: true };
    case 'sms':
      if (!normalizePhone(guest.phone)) return { channel, available: false, reason: 'dispatch.noPhone' };
      if (!device.sms) return { channel, available: false, reason: 'dispatch.noSms' };
      return { channel, available: true };
    case 'whatsapp':
      if (!normalizePhone(guest.phone)) return { channel, available: false, reason: 'dispatch.noPhone' };
      if (device.whatsapp === false) return { channel, available: false, reason: 'dispatch.noWhatsApp' };
      return { channel, available: true };
    case 'share':
      return { channel, available: true };
  }
}

export function availableChannels(
  guest: Pick<Guest, 'phone' | 'email'>,
  device: DeviceCapabilities,
): ChannelAvailability[] {
  return (['email', 'sms', 'whatsapp', 'share'] as const).map((channel) => channelAvailability(guest, channel, device));
}

/** WhatsApp derin bağlantısı; numara yoksa yalnız metinle sohbet seçici açılır. Dosya eki derin bağlantıyla iletilemez. */
export function buildWhatsAppUrl(phone: string | undefined, text: string): string {
  const parts = phone ? normalizePhone(phone) : undefined;
  const number = parts ? parts.key : '';
  return `whatsapp://send?${number ? `phone=${number}&` : ''}text=${encodeURIComponent(text)}`;
}

/** SMS alıcı numarası: alıcı uygulaması için sadeleştirilmiş numara. */
export function smsRecipient(phone: string): string | undefined {
  const parts = normalizePhone(phone);
  if (!parts) return undefined;
  return parts.isTurkishMobile
    ? `+${parts.key}`
    : parts.display.startsWith('+')
      ? parts.display.replace(/\s/g, '')
      : parts.key;
}

export type QueueEntryState = 'waiting' | 'opened' | 'skipped' | 'cancelled';

export interface QueueEntry {
  guestId: string;
  guestName: string;
  state: QueueEntryState;
  reason?: PlainMessageKey;
}

export interface InviteQueue {
  channel: InviteChannel;
  entries: QueueEntry[];
  /** Sıradaki bekleyen kaydın dizini; bitince `entries.length`. */
  cursor: number;
  cancelled: boolean;
}

export function createInviteQueue(
  guests: readonly Guest[],
  channel: InviteChannel,
  device: DeviceCapabilities,
): InviteQueue {
  const entries = guests.map((guest): QueueEntry => {
    const availability = channelAvailability(guest, channel, device);
    return availability.available
      ? { guestId: guest.id, guestName: guest.name, state: 'waiting' }
      : { guestId: guest.id, guestName: guest.name, state: 'skipped', reason: availability.reason };
  });
  return { channel, entries, cursor: nextWaiting(entries, 0), cancelled: false };
}

function nextWaiting(entries: readonly QueueEntry[], from: number): number {
  const index = entries.findIndex((entry, i) => i >= from && entry.state === 'waiting');
  return index === -1 ? entries.length : index;
}

export function currentEntry(queue: InviteQueue): QueueEntry | undefined {
  return queue.cursor < queue.entries.length ? queue.entries[queue.cursor] : undefined;
}

/** Sıradaki kişi için sistem ekranı açıldı veya kullanıcı bu kişiyi atladı. */
export function resolveCurrent(queue: InviteQueue, state: 'opened' | 'skipped', reason?: PlainMessageKey): InviteQueue {
  const entry = currentEntry(queue);
  if (!entry || queue.cancelled) return queue;
  const entries = queue.entries.map((item, index) => (index === queue.cursor ? { ...item, state, reason } : item));
  return { ...queue, entries, cursor: nextWaiting(entries, queue.cursor + 1) };
}

/** Kullanıcı kuyruğu iptal eder; kalan bekleyenler `cancelled` olur ve hiçbir şey açılmaz. */
export function cancelQueue(queue: InviteQueue): InviteQueue {
  const entries = queue.entries.map((entry): QueueEntry =>
    entry.state === 'waiting' ? { ...entry, state: 'cancelled' } : entry,
  );
  return { ...queue, entries, cursor: entries.length, cancelled: true };
}

export function queueFinished(queue: InviteQueue): boolean {
  return queue.cursor >= queue.entries.length;
}

export function queueSummary(queue: InviteQueue): {
  opened: number;
  skipped: number;
  cancelled: number;
  waiting: number;
} {
  const count = (state: QueueEntryState) => queue.entries.filter((entry) => entry.state === state).length;
  return {
    opened: count('opened'),
    skipped: count('skipped'),
    cancelled: count('cancelled'),
    waiting: count('waiting'),
  };
}

/** Kanalın gerçekte ne taşıdığını söyleyen kullanıcı metni; ekrandaki ifadeler gerçek davranışla aynı olmalıdır. */
export function channelNote(t: Translator, channel: InviteChannel, attachImage: boolean): string {
  switch (channel) {
    case 'sms':
      return `${t('dispatch.noteSms')} ${t('dispatch.imageViaShare')}`;
    case 'whatsapp':
      return `${t('dispatch.noteWhatsApp')} ${t('dispatch.imageViaShare')}`;
    case 'email':
      return t(attachImage ? 'dispatch.noteEmailWithImage' : 'dispatch.noteEmailTextOnly');
    case 'share':
      return t('dispatch.noteShare');
  }
}
