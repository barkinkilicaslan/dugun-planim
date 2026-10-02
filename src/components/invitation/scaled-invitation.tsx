import type { Ref } from 'react';
import { View } from 'react-native';

import { INVITATION_CARD_HEIGHT, INVITATION_CARD_WIDTH } from '@/domain/invitation-templates';
import { InvitationCard } from './invitation-card';

type CardProps = Parameters<typeof InvitationCard>[0];

/**
 * Sabit boyutlu kartı verilen genişliğe ölçekleyerek gösterir. `cardRef` ölçeklenmemiş kartı işaret eder;
 * PNG yakalama her zaman tam 360 × 540 boyutundan yapılır.
 */
export function ScaledInvitation({ width, cardRef, ...card }: CardProps & { width: number; cardRef?: Ref<View> }) {
  const scale = width / INVITATION_CARD_WIDTH;
  return (
    <View style={{ width, height: INVITATION_CARD_HEIGHT * scale, overflow: 'hidden', borderRadius: 6 }}>
      <View
        style={{
          width: INVITATION_CARD_WIDTH,
          height: INVITATION_CARD_HEIGHT,
          transform: [{ scale }],
          transformOrigin: 'top left',
        }}
      >
        <InvitationCard {...card} cardRef={cardRef} />
      </View>
    </View>
  );
}
