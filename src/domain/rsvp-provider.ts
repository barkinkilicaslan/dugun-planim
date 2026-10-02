import type { Guest, RsvpStatus } from './models';

/** Çevrimiçi bir formdan gelen, davetliye eşlenmemiş ham yanıt. */
export interface OnlineRsvpResponse {
  /** Davetliye özel, tahmin edilmesi zor davet jetonu. */
  inviteToken: string;
  status: RsvpStatus;
  adults: number;
  children: number;
  note?: string;
  respondedAt: string;
}

export interface RsvpInviteLink {
  token: string;
  url: string;
  /** Jetonun geçerlilik sonu (ISO). */
  expiresAt: string;
}

/**
 * Çevrimiçi RSVP sağlayıcı sözleşmesi. Gerçek bir sağlayıcı (ör. Supabase veya Cloudflare Worker + D1)
 * seçilene kadar yalnız `disabledRsvpProvider` kullanılır ve uygulamada hiçbir RSVP bağlantısı üretilmez.
 */
export interface RsvpProvider {
  readonly id: string;
  isEnabled(): boolean;
  /** Davetliye özel bağlantı oluşturur; yalnız çocuk alanı ayarını gönderir, rehber verisi göndermez. */
  createInviteLink(
    guest: Pick<Guest, 'id'>,
    options: { allowChildren: boolean; deadline?: string },
  ): Promise<RsvpInviteLink>;
  /** `since` sonrasında gelen yanıtları getirir (organizer senkronizasyonu). */
  fetchResponses(since?: string): Promise<OnlineRsvpResponse[]>;
  /** Sunucudaki davet ve yanıt verilerini siler (veri minimizasyonu / silme hakkı). */
  revokeAll(): Promise<void>;
}

export const disabledRsvpProvider: RsvpProvider = {
  id: 'disabled',
  isEnabled: () => false,
  createInviteLink: () => Promise.reject(new Error('Çevrimiçi RSVP etkin değil.')),
  fetchResponses: () => Promise.resolve([]),
  revokeAll: () => Promise.resolve(),
};
