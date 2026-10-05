import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type ViewStyle } from 'react-native';
import { CoverImage, SideScrim } from '@/components/theme/cover-image';
import { Motif } from '@/components/theme/decor';
import { AppText } from '@/components/ui/app-text';
import { THEME_IMAGES } from '@/constants/theme-images';
import { withAlpha, type PhotoShape } from '@/constants/themes';
import { useAppTheme } from '@/context/theme-context';

interface HeroProps {
  /** Çift isimleri ("Ada & Deniz"); hero içinde gerçek, okunabilir metin olarak gösterilir. */
  names: string;
  /** "128 gün", "Bugün" gibi görünen geri sayım metni. */
  countdown: string;
  /** Ekran okuyucu için tam cümle ("Düğününüze 128 gün kaldı"). */
  countdownA11y: string;
  eyebrow: string;
  dateText: string;
}

const MIN_HEIGHT = 232;
const MAX_HEIGHT = 380;
const MAX_WIDTH = 640;
const TILE_COUNT = 9;

/** Büyük harf ve harf aralığı gibi küçük etiket stili temadan gelir. */
export function Eyebrow({ children, color }: { children: string; color: string }) {
  const theme = useAppTheme();
  const upper = theme.typography.labelUppercase;
  return (
    <AppText
      variant="caption"
      color={color}
      style={{
        letterSpacing: theme.typography.labelTracking,
        textTransform: upper ? 'uppercase' : 'none',
        fontWeight: '700',
      }}
    >
      {children}
    </AppText>
  );
}

/** Çerçeve biçimi → köşe yarıçapları. */
export function heroRadii(shape: PhotoShape): ViewStyle {
  switch (shape) {
    case 'soft-arch':
      return {
        borderTopLeftRadius: 56,
        borderTopRightRadius: 56,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
      };
    case 'leaf':
      return {
        borderTopLeftRadius: 44,
        borderTopRightRadius: 8,
        borderBottomRightRadius: 44,
        borderBottomLeftRadius: 8,
      };
    case 'sharp':
      return { borderRadius: 0 };
    case 'gilded':
      return { borderRadius: 12 };
    case 'pill':
      return { borderRadius: 36 };
    default:
      return { borderRadius: 16 };
  }
}

const HIDDEN = {
  accessibilityElementsHidden: true,
  importantForAccessibility: 'no-hide-descendants' as const,
  pointerEvents: 'none' as const,
};

function HeroBody({ names, countdown, countdownA11y, eyebrow, dateText }: HeroProps) {
  const theme = useAppTheme();
  const c = theme.colors;
  const image = THEME_IMAGES[theme.id];
  const variant = theme.layout.hero;
  const [width, setWidth] = useState(0);
  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);
  const minHeight = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, Math.round(width * 0.6)));
  const gilded = variant === 'starry';
  return (
    <View
      testID="home-hero-frame"
      onLayout={onLayout}
      style={[
        styles.frame,
        heroRadii(theme.shape.photo),
        {
          minHeight,
          backgroundColor: c.heroBackground,
          borderWidth: gilded ? 1.5 : 0,
          borderColor: c.heroDecor,
        },
      ]}
    >
      <CoverImage
        testID={`home-hero-image-${theme.id}`}
        source={image.hero}
        size={image.heroSize}
        focal={image.focal}
      />
      <SideScrim {...theme.heroScrim} />

      {variant === 'tile-banner' ? (
        <View {...HIDDEN} style={styles.tiles}>
          {Array.from({ length: TILE_COUNT }, (_, i) => (
            <View
              key={i}
              style={[
                styles.tile,
                { backgroundColor: i % 3 === 0 ? c.heroDecorAlt : i % 3 === 1 ? c.heroDecor : c.heroText },
              ]}
            />
          ))}
        </View>
      ) : null}
      {variant === 'monogram' ? (
        <View {...HIDDEN} style={[styles.inset, styles.frameInset, { borderColor: c.heroDecor }]} />
      ) : null}
      {variant === 'sunset-arc' ? (
        <View {...HIDDEN} style={[styles.inset, styles.stitchInset, { borderColor: withAlpha(c.heroText, 0.6) }]} />
      ) : null}
      {gilded ? (
        <View {...HIDDEN} style={[styles.inset, styles.goldInset, { borderColor: withAlpha(c.heroDecor, 0.55) }]} />
      ) : null}
      {variant !== 'monogram' ? (
        <View {...HIDDEN} style={styles.motif}>
          <Motif kind={theme.motif} size={84} color={c.heroDecor} altColor={c.heroDecorAlt} />
        </View>
      ) : null}

      <View style={styles.content}>
        <AppText variant="title" color={c.heroText} accessibilityRole="header">
          {names}
        </AppText>
        <View style={styles.bottom}>
          <Eyebrow color={c.heroMuted}>{eyebrow}</Eyebrow>
          <AppText variant="display" color={c.heroText} accessibilityLabel={countdownA11y}>
            {countdown}
          </AppText>
          <AppText color={c.heroMuted}>{dateText}</AppText>
        </View>
      </View>
    </View>
  );
}

/**
 * Ana sayfanın üstündeki fotoğraflı hero. Görsel dekoratiftir (ekran okuyucudan gizli); çift isimleri, geri sayım ve
 * tarih görselin üstünde gerçek metindir. Tema varyantı `testID` ile işaretlenir, böylece testler altı kompozisyonun
 * gerçekten farklı çizildiğini doğrulayabilir. Yalnızca etkin temanın görseli render edilir.
 */
export function HomeHero(props: HeroProps) {
  const theme = useAppTheme();
  return (
    <View testID={`home-hero-${theme.layout.hero}`} style={styles.wrap}>
      <HeroBody {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center' },
  frame: { overflow: 'hidden', justifyContent: 'center' },
  content: { flex: 1, width: '64%', padding: 20, paddingTop: 24, justifyContent: 'space-between', gap: 16 },
  bottom: { gap: 2 },
  tiles: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', gap: 3, padding: 3 },
  tile: { flex: 1, height: 12, borderRadius: 2 },
  inset: { position: 'absolute' },
  frameInset: { left: 8, top: 8, right: 8, bottom: 8, borderWidth: 1 },
  stitchInset: {
    left: 9,
    top: 9,
    right: 9,
    bottom: 9,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 18,
  },
  goldInset: { left: 5, top: 5, right: 5, bottom: 5, borderWidth: 1, borderRadius: 8 },
  motif: { position: 'absolute', left: -14, bottom: -14, opacity: 0.28 },
});
