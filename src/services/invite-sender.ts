import { Linking, Platform, Share } from 'react-native';
import * as MailComposer from 'expo-mail-composer';
import * as SMS from 'expo-sms';

import { emailKey } from '@/domain/contacts';
import { buildWhatsAppUrl, smsRecipient, type DeviceCapabilities } from '@/domain/invite-dispatch';
import type { Guest, InviteChannel } from '@/domain/models';
import { shareGeneratedFile, type GeneratedInvitationFile } from './invitation-files';

/**
 * Her fonksiyon işletim sisteminin gönderim ekranını açar; uygulama sessizce veya otomatik mesaj göndermez.
 * `opened`: ekran açıldı ama sonuç doğrulanamıyor. `sent`: sistem gönderimi doğruladı. `cancelled`: kullanıcı vazgeçti.
 * `unavailable`: kanal açılamadı (ör. WhatsApp kurulu değil); çağıran taraf paylaşım menüsü önerir.
 */
export type SendOutcome = 'opened' | 'sent' | 'cancelled' | 'unavailable';

export async function getDeviceCapabilities(): Promise<DeviceCapabilities> {
  if (Platform.OS === 'web') return { mail: false, sms: false, whatsapp: false };
  const [mail, sms] = await Promise.all([
    MailComposer.isAvailableAsync().catch(() => false),
    SMS.isAvailableAsync().catch(() => false),
  ]);
  return { mail, sms };
}

export async function sendInviteByEmail(
  guest: Pick<Guest, 'email'>,
  subject: string,
  body: string,
  attachment?: GeneratedInvitationFile,
): Promise<SendOutcome> {
  const recipient = emailKey(guest.email);
  if (!recipient) return 'unavailable';
  const result = await MailComposer.composeAsync({
    recipients: [recipient],
    subject,
    body,
    attachments: attachment ? [attachment.uri] : undefined,
  });
  if (result.status === MailComposer.MailComposerStatus.CANCELLED) return 'cancelled';
  if (result.status === MailComposer.MailComposerStatus.SENT && Platform.OS === 'ios') return 'sent';
  return 'opened';
}

export async function sendInviteBySms(guest: Pick<Guest, 'phone'>, body: string): Promise<SendOutcome> {
  const recipient = smsRecipient(guest.phone);
  if (!recipient) return 'unavailable';
  const result = await SMS.sendSMSAsync([recipient], body);
  if (result.result === 'cancelled') return 'cancelled';
  if (result.result === 'sent') return 'sent';
  return 'opened';
}

/** WhatsApp derin bağlantısı yalnız metin taşır; görsel için paylaşım menüsü kullanılmalıdır. */
export async function sendInviteByWhatsApp(guest: Pick<Guest, 'phone'>, body: string): Promise<SendOutcome> {
  try {
    await Linking.openURL(buildWhatsAppUrl(guest.phone, body));
    return 'opened';
  } catch {
    return 'unavailable';
  }
}

export async function shareInviteText(subject: string, body: string): Promise<SendOutcome> {
  const result = await Share.share({ title: subject, message: body });
  return result.action === Share.dismissedAction ? 'cancelled' : 'opened';
}

export async function shareInviteImage(file: GeneratedInvitationFile): Promise<SendOutcome> {
  await shareGeneratedFile(file);
  return 'opened';
}

export async function sendInvite(
  channel: InviteChannel,
  guest: Guest,
  message: { subject: string; body: string; attachment?: GeneratedInvitationFile },
): Promise<SendOutcome> {
  switch (channel) {
    case 'email':
      return sendInviteByEmail(guest, message.subject, message.body, message.attachment);
    case 'sms':
      return sendInviteBySms(guest, message.body);
    case 'whatsapp':
      return sendInviteByWhatsApp(guest, message.body);
    case 'share':
      return shareInviteText(message.subject, message.body);
  }
}
