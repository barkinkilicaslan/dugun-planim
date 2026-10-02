import { FEATURES } from '@/constants/features';
import { disabledRsvpProvider, type RsvpProvider } from '@/domain/rsvp-provider';

/**
 * Etkin sağlayıcı. Backend kararı verilene kadar her zaman devre dışı sağlayıcıdır; seçilen sağlayıcı
 * eklendiğinde yalnızca burada, `FEATURES.onlineRsvp` bayrağına bağlanarak döndürülür.
 */
export function getRsvpProvider(): RsvpProvider {
  return disabledRsvpProvider;
}

/** Yalnız çevrimiçi RSVP gerçekten etkinse bağlantı döner; aksi halde `undefined`, böylece sahte bağlantı üretilmez. */
export async function rsvpUrlForGuest(
  guestId: string,
  options: { allowChildren: boolean; deadline?: string },
  provider: RsvpProvider = getRsvpProvider(),
): Promise<string | undefined> {
  if (!FEATURES.onlineRsvp || !provider.isEnabled()) return undefined;
  const link = await provider.createInviteLink({ id: guestId }, options);
  return link.url;
}
