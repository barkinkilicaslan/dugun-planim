/**
 * Özellik bayrakları. Çevrimiçi RSVP bir sunucu gerektirir; uygulama "hesap/backend yok, veriler cihazda kalır"
 * ilkesine dayandığından varsayılan olarak KAPALIDIR. Bir sağlayıcı seçilip gizlilik belgeleri güncellenmeden
 * açılmamalıdır (bkz. docs/ONLINE_RSVP_DECISION.md).
 */
export const FEATURES = {
  onlineRsvp: false,
} as const;
