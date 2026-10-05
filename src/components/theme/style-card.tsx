import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { AppText } from '@/components/ui/app-text';
import { ThemePreview } from '@/components/theme/theme-preview';
import { THEME_COPY } from '@/components/theme/theme-copy';
import { getTheme, type ThemeId } from '@/constants/themes';
import { useI18n } from '@/context/language-context';
import { useAppTheme } from '@/context/theme-context';

/**
 * Tek bir tarz seçeneği: ad, açıklama, renk örnekleri ve kodla çizilmiş ana sayfa önizlemesi.
 * Seçili durum yalnız renkle değil kalın çerçeve, "Seçili" etiketi ve onay işaretiyle de gösterilir.
 */
export function StyleCard({
  id,
  selected,
  width,
  showImage = true,
  onPress,
  onLayout,
}: {
  id: ThemeId;
  selected: boolean;
  width: number;
  /** Kart görünür alana yakın değilse false: küçük resim yüklenmez. */
  showImage?: boolean;
  onPress: (id: ThemeId) => void;
  onLayout?: (event: LayoutChangeEvent) => void;
}) {
  const { t } = useI18n();
  const base = useAppTheme();
  const theme = getTheme(id);
  const c = theme.colors;
  const name = t(THEME_COPY[id].name);
  const description = t(THEME_COPY[id].description);
  const swatches = [c.primary, c.secondary, c.accent, c.background, c.text];
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, selected }}
      accessibilityLabel={selected ? `${name}. ${t('style.selected')}` : name}
      accessibilityHint={description}
      onPress={() => onPress(id)}
      onLayout={onLayout}
      style={({ pressed }) => [
        styles.card,
        {
          width,
          backgroundColor: base.colors.surface,
          borderColor: selected ? c.primary : base.colors.border,
          borderWidth: selected ? 3 : 1,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <ThemePreview theme={theme} width={width - 20} showImage={showImage} />
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.swatches}>
        {swatches.map((color, index) => (
          <View key={index} style={[styles.swatch, { backgroundColor: color, borderColor: base.colors.border }]} />
        ))}
      </View>
      <AppText
        variant="subtitle"
        style={{ fontFamily: theme.typography.heading.fontFamily, fontStyle: theme.typography.display.fontStyle }}
      >
        {name}
      </AppText>
      <AppText variant="caption" color={base.colors.muted}>
        {description}
      </AppText>
      {selected ? (
        <View style={[styles.badge, { backgroundColor: c.primary }]}>
          <AppText variant="caption" color={c.primaryText} style={styles.badgeText}>
            {'✓ '}
            {t('style.selected')}
          </AppText>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, padding: 10, gap: 8 },
  swatches: { flexDirection: 'row', gap: 6 },
  swatch: { width: 20, height: 20, borderRadius: 10, borderWidth: 1 },
  badge: { position: 'absolute', top: 14, right: 14, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontWeight: '700' },
});
