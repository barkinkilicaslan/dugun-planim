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

import { createTranslator, type I18nLike } from '@/i18n';

/** Çeviriciyi açıkça veren testler için Türkçe ve İngilizce bağlamlar. */
export const TR: I18nLike = { t: createTranslator('tr'), locale: 'tr' };
export const EN: I18nLike = { t: createTranslator('en'), locale: 'en' };
