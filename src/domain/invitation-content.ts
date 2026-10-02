import type { I18nLike, Translator } from '@/i18n';
import type { InvitationDesign, InvitationTemplateId, WeddingProfile } from './models';
import {
  adultsOnlyPreset,
  defaultInvitationMessage,
  resolveAdultsOnlyText,
  templateById,
  templateName,
} from './invitation-templates';
import { formatLong, formatLongWithWeekday, formatTime } from './wedding-date';

/** Davetiyenin ekranda, PNG/PDF'te ve paylaşım metninde gösterdiği çözümlenmiş içerik. */
export interface InvitationContent {
  coupleNames: string;
  /** `2 Ekim 2026 Cuma` */
  dateLong: string;
  time: string;
  venueName: string;
  venueAddress: string;
  message: string;
  rsvpDeadline: string;
  /** Yalnız profilde "yetişkinlere özel" açıksa dolu. */
  adultsOnlyNote: string;
  photoUri: string;
}

export function defaultCoupleNames(profile: Pick<WeddingProfile, 'couple1Name' | 'couple2Name'>): string {
  return [profile.couple1Name.trim(), profile.couple2Name.trim()].filter(Boolean).join(' & ');
}

/** Tasarımdaki boş alanlar düğün profilinden doldurulur; böylece profil değişince eski bilgi kalmaz. */
export function resolveInvitationContent(
  design: InvitationDesign,
  profile: WeddingProfile,
  { t, locale }: I18nLike,
): InvitationContent {
  const date = design.weddingDate || profile.weddingDate;
  const adultsOnlyNote = profile.adultsOnly
    ? resolveAdultsOnlyText(t, design.adultsOnlyMessage) ||
      resolveAdultsOnlyText(t, profile.adultsOnlyMessage) ||
      adultsOnlyPreset(t, 0)
    : '';
  return {
    coupleNames: design.coupleNames.trim() || defaultCoupleNames(profile),
    dateLong: date ? formatLongWithWeekday(date, locale) : '',
    time: design.weddingTime ? formatTime(design.weddingTime, locale) : '',
    venueName: design.venueName.trim(),
    venueAddress: design.venueAddress.trim(),
    message: design.message.trim() || defaultInvitationMessage(t),
    rsvpDeadline: design.rsvpDeadline ? formatLong(design.rsvpDeadline, locale) : '',
    adultsOnlyNote,
    photoUri: design.photoUri,
  };
}

export function createInvitationDesign(
  id: string,
  templateId: InvitationTemplateId,
  now: string,
  isDefault: boolean,
  t: Translator,
): InvitationDesign {
  const template = templateById(templateId);
  return {
    id,
    name: t('invitation.defaultName', { template: templateName(t, templateId) }),
    templateId,
    paletteId: template.defaultPaletteId,
    coupleNames: '',
    weddingDate: '',
    weddingTime: '',
    venueName: '',
    venueAddress: '',
    message: '',
    rsvpDeadline: '',
    adultsOnlyMessage: '',
    photoUri: '',
    isDefault,
    createdAt: now,
    updatedAt: now,
  };
}

/** Düzenleyicide gösterilen değer profildeki varsayılanla aynıysa tasarımda boş saklanır (profili izlemeye devam eder). */
export function storedOverride(value: string, profileDefault: string): string {
  return value.trim() === profileDefault.trim() ? '' : value.trim();
}

/**
 * Gönderim metni. `rsvpUrl` yalnız çevrimiçi RSVP gerçekten etkinse verilir; verilmezse metinde bağlantı
 * veya "bağlantıdan yanıtlayın" ifadesi yer almaz.
 */
export function buildInviteMessage(
  content: InvitationContent,
  options: { guestName?: string; rsvpUrl?: string } = {},
  t: Translator,
): string {
  const lines: string[] = [];
  if (options.guestName) lines.push(t('invitation.messageGreeting', { name: options.guestName }), '');
  lines.push(content.message, '');
  if (content.coupleNames) lines.push(`💍 ${content.coupleNames}`);
  const when = [content.dateLong, content.time].filter(Boolean).join(' · ');
  if (when) lines.push(`📅 ${when}`);
  const where = [content.venueName, content.venueAddress].filter(Boolean).join(', ');
  if (where) lines.push(`📍 ${where}`);
  if (content.adultsOnlyNote) lines.push('', content.adultsOnlyNote);
  if (options.rsvpUrl) {
    lines.push('', t('invitation.messageRsvpLink', { url: options.rsvpUrl }));
    if (content.rsvpDeadline) lines.push(t('invitation.messageDeadline', { date: content.rsvpDeadline }));
  } else if (content.rsvpDeadline) {
    lines.push('', t('invitation.messageReplyBy', { date: content.rsvpDeadline }));
  }
  return lines.join('\n').trim();
}

export function inviteSubject(content: InvitationContent, t: Translator): string {
  return content.coupleNames
    ? t('invitation.subjectWithNames', { names: content.coupleNames })
    : t('invitation.subject');
}

export function invitationFileBase(design: InvitationDesign, t: Translator): string {
  const slug = design.name
    .toLocaleLowerCase('tr')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${t('invitation.fileBase')}-${slug || t('invitation.fileFallbackName')}`;
}
