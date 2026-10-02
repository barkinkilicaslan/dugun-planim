import type { Translator } from '@/i18n';
import type { Guest, InviteChannel, InviteDispatchStatus, RsvpSource, RsvpStatus } from './models';

export const RSVP_STATUSES: readonly RsvpStatus[] = ['pending', 'attending', 'declined', 'maybe'];
export const RSVP_SOURCES: readonly RsvpSource[] = ['none', 'manual', 'online'];
export const INVITE_CHANNELS: readonly InviteChannel[] = ['email', 'sms', 'whatsapp', 'share'];
export const INVITE_STATUSES: readonly InviteDispatchStatus[] = ['none', 'opened', 'markedSent'];

export function rsvpLabel(t: Translator, status: RsvpStatus): string {
  return t(`rsvp.status.${status}`);
}

export function rsvpSourceLabel(t: Translator, source: RsvpSource): string {
  return t(`rsvp.source.${source}`);
}

export function inviteChannelLabel(t: Translator, channel: InviteChannel): string {
  return t(`invite.channel.${channel}`);
}

export function inviteStatusLabel(t: Translator, status: InviteDispatchStatus): string {
  return t(`invite.status.${status}`);
}

export type RsvpFilter = 'all' | RsvpStatus | 'online';

export function adultCount(guest: Pick<Guest, 'partySize' | 'childCount'>): number {
  return Math.max(0, guest.partySize - guest.childCount);
}

export interface RsvpSummary {
  invitations: number;
  responded: number;
  pending: number;
  attending: number;
  declined: number;
  maybe: number;
  /** Kişi sayıları (davetli satırı değil). */
  attendingPeople: number;
  attendingAdults: number;
  attendingChildren: number;
  pendingPeople: number;
  declinedPeople: number;
  maybePeople: number;
  fromOnline: number;
  invitesSent: number;
}

export function rsvpSummary(guests: readonly Guest[]): RsvpSummary {
  const summary: RsvpSummary = {
    invitations: 0,
    responded: 0,
    pending: 0,
    attending: 0,
    declined: 0,
    maybe: 0,
    attendingPeople: 0,
    attendingAdults: 0,
    attendingChildren: 0,
    pendingPeople: 0,
    declinedPeople: 0,
    maybePeople: 0,
    fromOnline: 0,
    invitesSent: 0,
  };
  for (const guest of guests) {
    summary.invitations += 1;
    if (guest.rsvp !== 'pending') summary.responded += 1;
    if (guest.rsvpSource === 'online') summary.fromOnline += 1;
    if (guest.inviteStatus !== 'none') summary.invitesSent += 1;
    summary[guest.rsvp] += 1;
    if (guest.rsvp === 'attending') {
      summary.attendingPeople += guest.partySize;
      summary.attendingAdults += adultCount(guest);
      summary.attendingChildren += guest.childCount;
    } else if (guest.rsvp === 'pending') summary.pendingPeople += guest.partySize;
    else if (guest.rsvp === 'declined') summary.declinedPeople += guest.partySize;
    else summary.maybePeople += guest.partySize;
  }
  return summary;
}

export function matchesRsvpFilter(guest: Guest, filter: RsvpFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'online') return guest.rsvpSource === 'online';
  return guest.rsvp === filter;
}

/** Kullanıcının durumu elle değiştirmesi: kaynak her zaman `manual`, bekliyor durumuna dönüş yanıtı temizler. */
export function applyManualRsvp(guest: Guest, status: RsvpStatus, now: string): Guest {
  if (guest.rsvp === status && (status !== 'pending' || guest.rsvpSource === 'none')) return guest;
  return {
    ...guest,
    rsvp: status,
    rsvpSource: status === 'pending' ? 'none' : 'manual',
    rsvpRespondedAt: status === 'pending' ? '' : now,
    updatedAt: now,
  };
}

/** Çevrimiçi yanıt (ileride `RsvpProvider` aracılığıyla) davetli kaydına işlenir. */
export function applyOnlineRsvp(
  guest: Guest,
  response: { status: RsvpStatus; adults: number; children: number; note?: string; respondedAt: string },
  now: string,
): Guest {
  const attending = response.status === 'attending' || response.status === 'maybe';
  const children = attending ? Math.max(0, response.children) : guest.childCount;
  const adults = attending ? Math.max(0, response.adults) : adultCount(guest);
  return {
    ...guest,
    rsvp: response.status,
    rsvpSource: 'online',
    rsvpRespondedAt: response.respondedAt,
    partySize: attending ? Math.max(1, adults + children) : guest.partySize,
    childCount: children,
    notes: response.note ? [guest.notes, response.note].filter(Boolean).join('\n') : guest.notes,
    updatedAt: now,
  };
}

/** İşletim sistemi gönderim ekranı açıldığında; sonuç doğrulanamadığı için durum yalnız `opened` olur. */
export function recordInviteOpened(guest: Guest, channel: InviteChannel, now: string): Guest {
  if (guest.inviteStatus === 'markedSent')
    return { ...guest, lastInviteChannel: channel, lastInviteSentAt: now, updatedAt: now };
  return { ...guest, inviteStatus: 'opened', lastInviteChannel: channel, lastInviteSentAt: now, updatedAt: now };
}

export function markInviteSent(guest: Guest, now: string, channel?: InviteChannel): Guest {
  return {
    ...guest,
    inviteStatus: 'markedSent',
    lastInviteChannel: channel ?? guest.lastInviteChannel,
    lastInviteSentAt: guest.lastInviteSentAt || now,
    updatedAt: now,
  };
}

export function clearInviteStatus(guest: Guest, now: string): Guest {
  return { ...guest, inviteStatus: 'none', lastInviteChannel: '', lastInviteSentAt: '', updatedAt: now };
}
