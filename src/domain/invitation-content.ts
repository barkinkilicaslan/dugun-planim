import type { InvitationDesign, InvitationTemplateId, WeddingProfile } from './models';
import { ADULTS_ONLY_PRESETS, DEFAULT_INVITATION_MESSAGE, templateById } from './invitation-templates';
import { formatLongTr, formatLongTrWithWeekday } from './wedding-date';

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
export function resolveInvitationContent(design: InvitationDesign, profile: WeddingProfile): InvitationContent {
  const date = design.weddingDate || profile.weddingDate;
  const adultsOnlyNote = profile.adultsOnly
    ? design.adultsOnlyMessage.trim() || profile.adultsOnlyMessage.trim() || ADULTS_ONLY_PRESETS[0]
    : '';
  return {
    coupleNames: design.coupleNames.trim() || defaultCoupleNames(profile),
    dateLong: date ? formatLongTrWithWeekday(date) : '',
    time: design.weddingTime,
    venueName: design.venueName.trim(),
    venueAddress: design.venueAddress.trim(),
    message: design.message.trim() || DEFAULT_INVITATION_MESSAGE,
    rsvpDeadline: design.rsvpDeadline ? formatLongTr(design.rsvpDeadline) : '',
    adultsOnlyNote,
    photoUri: design.photoUri,
  };
}

export function createInvitationDesign(
  id: string,
  templateId: InvitationTemplateId,
  now: string,
  isDefault: boolean,
): InvitationDesign {
  const template = templateById(templateId);
  return {
    id,
    name: `${template.name} davetiye`,
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
): string {
  const lines: string[] = [];
  if (options.guestName) lines.push(`Sevgili ${options.guestName},`, '');
  lines.push(content.message, '');
  if (content.coupleNames) lines.push(`💍 ${content.coupleNames}`);
  const when = [content.dateLong, content.time].filter(Boolean).join(' · ');
  if (when) lines.push(`📅 ${when}`);
  const where = [content.venueName, content.venueAddress].filter(Boolean).join(', ');
  if (where) lines.push(`📍 ${where}`);
  if (content.adultsOnlyNote) lines.push('', content.adultsOnlyNote);
  if (options.rsvpUrl) {
    lines.push('', `Katılım durumunuzu buradan bildirebilirsiniz: ${options.rsvpUrl}`);
    if (content.rsvpDeadline) lines.push(`Son cevap tarihi: ${content.rsvpDeadline}`);
  } else if (content.rsvpDeadline) {
    lines.push('', `Lütfen ${content.rsvpDeadline} tarihine kadar bize dönüş yapın.`);
  }
  return lines.join('\n').trim();
}

export function inviteSubject(content: InvitationContent): string {
  return content.coupleNames ? `${content.coupleNames} · Düğün Davetiyesi` : 'Düğün Davetiyesi';
}

export function invitationFileBase(design: InvitationDesign): string {
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
  return `davetiye-${slug || 'tasarim'}`;
}
