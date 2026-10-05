import { StyleSheet, View } from 'react-native';
import { CoverImage, SideScrim } from '@/components/theme/cover-image';
import { THEME_IMAGES } from '@/constants/theme-images';
import type { AppTheme, PhotoShape } from '@/constants/themes';

const HIDDEN = {
  accessibilityElementsHidden: true,
  importantForAccessibility: 'no-hide-descendants' as const,
  pointerEvents: 'none' as const,
};

/**
 * Seçilen temanın ana sayfasının kodla çizilmiş küçük önizlemesi. Gerçek ekran bileşenlerini değil, aynı
 * token'lardan türeyen sade şekilleri kullanır; hero alanında optimize edilmiş küçük resim (thumbnail) görünür.
 * `showImage` false iken (kart henüz görünür değilken) görsel yüklenmez, düz hero rengi çizilir. Ekran okuyuculardan gizlidir.
 */
export function ThemePreview({
  theme,
  width,
  showImage = true,
}: {
  theme: AppTheme;
  width: number;
  showImage?: boolean;
}) {
  const c = theme.colors;
  const unit = width / 160;
  const heroRadius = Math.min(theme.shape.card, 16) * unit;
  const image = THEME_IMAGES[theme.id];
  const segmented =
    theme.shape.progress === 'segments' || theme.shape.progress === 'beads' || theme.shape.progress === 'diamonds';
  const hero = theme.layout.hero;
  const outlined = hero === 'monogram';
  return (
    <View
      {...HIDDEN}
      style={[
        styles.frame,
        {
          width,
          backgroundColor: c.background,
          borderColor: c.border,
          borderRadius: heroRadius + 4 * unit,
          padding: 8 * unit,
        },
      ]}
    >
      <View
        style={[
          styles.hero,
          {
            height: 74 * unit,
            ...previewRadii(theme.shape.photo, unit),
            backgroundColor: c.heroBackground,
            borderWidth: outlined ? 1 : 0,
            borderColor: c.heroDecor,
            padding: 8 * unit,
          },
        ]}
      >
        {showImage ? (
          <>
            <CoverImage
              testID={`style-thumb-${theme.id}`}
              source={image.thumb}
              size={image.thumbSize}
              focal={image.focal}
            />
            <SideScrim {...theme.heroScrim} steps={12} />
          </>
        ) : null}
        <View style={{ flex: 1, justifyContent: 'center', gap: 4 * unit, maxWidth: '58%' }}>
          <View style={{ height: 5 * unit, width: '62%', borderRadius: 3, backgroundColor: c.heroText }} />
          <View
            style={{ height: 3 * unit, width: '40%', borderRadius: 2, backgroundColor: c.heroMuted, opacity: 0.8 }}
          />
          <View style={{ height: 11 * unit, width: '34%', borderRadius: 3, backgroundColor: c.heroDecor }} />
        </View>
      </View>
      <View
        style={[
          styles.row,
          { backgroundColor: c.surface, borderColor: c.border, borderRadius: heroRadius * 0.7, padding: 6 * unit },
        ]}
      >
        {segmented ? (
          <View style={styles.segments}>
            {Array.from({ length: 10 }, (_, i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: 5 * unit,
                  borderRadius: theme.shape.progress === 'segments' ? 1 : 3 * unit,
                  backgroundColor: i < 6 ? c.progressFill : c.progressTrack,
                }}
              />
            ))}
          </View>
        ) : (
          <View
            style={{
              flex: 1,
              height: (theme.shape.progress === 'line' ? 2 : 5) * unit,
              borderRadius: 3,
              backgroundColor: c.progressTrack,
            }}
          >
            <View style={{ width: '60%', height: '100%', borderRadius: 3, backgroundColor: c.progressFill }} />
          </View>
        )}
      </View>
      <View style={styles.tiles}>
        {[0, 1].map((i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 22 * unit,
              borderRadius: heroRadius * 0.6,
              backgroundColor: c.surface,
              borderColor: c.border,
              borderWidth: 1,
              padding: 5 * unit,
              gap: 3 * unit,
            }}
          >
            <View style={{ height: 3 * unit, width: '50%', borderRadius: 2, backgroundColor: c.muted, opacity: 0.6 }} />
            <View
              style={{ height: 5 * unit, width: '75%', borderRadius: 2, backgroundColor: i ? c.secondary : c.primary }}
            />
          </View>
        ))}
      </View>
      <View style={[styles.tabs, { backgroundColor: c.tabBar, borderColor: c.border, borderRadius: heroRadius * 0.7 }]}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={{
              width: 12 * unit,
              height: 12 * unit,
              borderRadius: theme.shape.iconBox === 'square' ? 1 : 6 * unit,
              backgroundColor: i === 0 ? c.tabBarActive : c.muted,
              opacity: i === 0 ? 1 : 0.4,
            }}
          />
        ))}
      </View>
    </View>
  );
}

function previewRadii(shape: PhotoShape, unit: number) {
  const r = (value: number) => value * unit;
  if (shape === 'soft-arch')
    return {
      borderTopLeftRadius: r(14),
      borderTopRightRadius: r(14),
      borderBottomLeftRadius: r(6),
      borderBottomRightRadius: r(6),
    };
  if (shape === 'leaf')
    return {
      borderTopLeftRadius: r(12),
      borderTopRightRadius: r(3),
      borderBottomRightRadius: r(12),
      borderBottomLeftRadius: r(3),
    };
  if (shape === 'sharp') return { borderRadius: 0 };
  if (shape === 'pill') return { borderRadius: r(12) };
  if (shape === 'gilded') return { borderRadius: r(5), borderWidth: 1 };
  return { borderRadius: r(7) };
}

const styles = StyleSheet.create({
  frame: { borderWidth: 1, gap: 6, overflow: 'hidden' },
  hero: { flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  row: { borderWidth: 1 },
  segments: { flexDirection: 'row', gap: 2, flex: 1 },
  tiles: { flexDirection: 'row', gap: 6 },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 5,
    borderWidth: 1,
  },
});
