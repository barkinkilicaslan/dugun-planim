import type { Guest } from '@/domain/models';

/** Davetli alanlarının tamamı için varsayılanlar; testler yalnızca ilgilendikleri alanı geçersiz kılar. */
export const GUEST_DEFAULTS = {
  email: '',
  rsvpSource: 'none',
  rsvpRespondedAt: '',
  lastInviteSentAt: '',
  lastInviteChannel: '',
  inviteStatus: 'none',
} as const satisfies Partial<Guest>;
