import type { Ref } from 'react';
import { Image, Platform, StyleSheet, Text, View, type TextStyle } from 'react-native';

import type { InvitationContent } from '@/domain/invitation-content';
import {
  INVITATION_CARD_HEIGHT,
  INVITATION_CARD_WIDTH,
  type InvitationPalette,
  type InvitationTemplate,
  type TitleFont,
} from '@/domain/invitation-templates';
import { DividerOrnament, FrameLayer, TopOrnament } from './ornaments';

const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' });

function titleStyle(font: TitleFont): TextStyle {
  if (font === 'sans') return { fontWeight: '300' };
  return { fontFamily: SERIF, fontStyle: font === 'serifItalic' ? 'italic' : 'normal' };
}

/**
 * Tek bileşenle çizilen davetiye kartı (sabit 360 × 540). Şablon ve palet verisi görünümü belirler.
 * Ekran okuyucular için tek bir özet etiketi sunar; PNG/PDF çıktısı bu görünümün birebir yakalanmasıyla üretilir.
 */
export function InvitationCard({
  content,
  template,
  palette,
  cardRef,
}: {
  content: InvitationContent;
  template: InvitationTemplate;
  palette: InvitationPalette;
  cardRef?: Ref<View>;
}) {
  const hasPhoto = Boolean(content.photoUri) && template.photoShape !== 'none';
  const align = template.align === 'left' ? 'left' : 'center';
  const alignItems = template.align === 'left' ? 'flex-start' : 'center';
  const tracked = (value: string) => (template.uppercaseTitle ? value.toLocaleUpperCase('tr') : value);
  const text = (size: number, color: string, extra?: TextStyle): TextStyle => ({
    color,
    fontSize: size,
    textAlign: align,
    letterSpacing: template.letterSpacing * 0.3,
    ...extra,
  });
  const summary = [
    'Düğün davetiyesi',
    content.coupleNames,
    content.dateLong,
    content.time,
    content.venueName,
    content.venueAddress,
    content.adultsOnlyNote,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <View
      ref={cardRef}
      collapsable={false}
      accessible
      accessibilityRole="image"
      accessibilityLabel={summary}
      style={[styles.card, { backgroundColor: palette.background }]}
    >
      <FrameLayer kind={template.frame} color={palette.accent} secondary={palette.muted} />
      <View style={[styles.content, { alignItems, paddingTop: template.frame === 'band' ? 52 : 44 }]}>
        <TopOrnament kind={template.ornament} color={palette.accent} secondary={palette.muted} />
        {hasPhoto ? (
          <Image
            source={{ uri: content.photoUri }}
            accessibilityIgnoresInvertColors
            style={[
              styles.photo,
              template.photoShape === 'circle' && styles.photoCircle,
              template.photoShape === 'arch' && styles.photoArch,
              template.photoShape === 'rounded' && styles.photoRounded,
            ]}
          />
        ) : null}
        <Text
          allowFontScaling={false}
          style={text(12, palette.muted, { letterSpacing: 3, fontWeight: '600', marginTop: 4 })}
        >
          {tracked('Düğün davetiyesi')}
        </Text>
        <Text
          allowFontScaling={false}
          numberOfLines={3}
          adjustsFontSizeToFit
          style={[text(hasPhoto ? 28 : 34, palette.ink, { marginVertical: 6 }), titleStyle(template.titleFont)]}
        >
          {tracked(content.coupleNames || 'İsimler')}
        </Text>
        <DividerOrnament kind={template.divider} color={palette.accent} />
        <Text
          allowFontScaling={false}
          numberOfLines={5}
          style={text(13, palette.ink, { lineHeight: 19, marginTop: 6 })}
        >
          {content.message}
        </Text>
        <View style={styles.details}>
          {content.dateLong ? (
            <Text allowFontScaling={false} style={text(16, palette.accent, { fontWeight: '700' })}>
              {content.dateLong}
            </Text>
          ) : null}
          {content.time ? (
            <Text allowFontScaling={false} style={text(15, palette.ink)}>
              Saat {content.time}
            </Text>
          ) : null}
          {content.venueName ? (
            <Text allowFontScaling={false} numberOfLines={2} style={text(15, palette.ink, { fontWeight: '600' })}>
              {content.venueName}
            </Text>
          ) : null}
          {content.venueAddress ? (
            <Text allowFontScaling={false} numberOfLines={3} style={text(12, palette.muted, { lineHeight: 17 })}>
              {content.venueAddress}
            </Text>
          ) : null}
        </View>
        <View style={styles.footer}>
          {content.adultsOnlyNote ? (
            <Text
              allowFontScaling={false}
              numberOfLines={4}
              style={text(11, palette.muted, { fontStyle: 'italic', lineHeight: 15 })}
            >
              {content.adultsOnlyNote}
            </Text>
          ) : null}
          {content.rsvpDeadline ? (
            <Text allowFontScaling={false} style={text(11, palette.ink, { fontWeight: '600' })}>
              Son cevap tarihi: {content.rsvpDeadline}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: INVITATION_CARD_WIDTH,
    height: INVITATION_CARD_HEIGHT,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    paddingHorizontal: 40,
    paddingBottom: 38,
    gap: 6,
  },
  details: { gap: 4, marginTop: 10, alignSelf: 'stretch' },
  footer: { gap: 6, marginTop: 'auto', alignSelf: 'stretch' },
  photo: { width: 120, height: 120, marginTop: 6 },
  photoCircle: { borderRadius: 60 },
  photoRounded: { borderRadius: 14 },
  photoArch: { width: 104, height: 130, borderTopLeftRadius: 52, borderTopRightRadius: 52, borderRadius: 6 },
});
