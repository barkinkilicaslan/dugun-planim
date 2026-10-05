import { Pressable, StyleSheet, View } from 'react-native';
import { THEME_COPY } from '@/components/theme/theme-copy';
import { AppText } from '@/components/ui/app-text';
import { getTheme, type ThemeId } from '@/constants/themes';
import { useI18n } from '@/context/language-context';
import { useAppTheme } from '@/context/theme-context';

/** Ayarlar'daki tarz satırı: renk örnekleri, ad, açıklama ve seçili durumda onay işareti. */
export function StyleOptionRow({
  id,
  selected,
  onPress,
}: {
  id: ThemeId;
  selected: boolean;
  onPress: (id: ThemeId) => void;
}) {
  const { t } = useI18n();
  const current = useAppTheme();
  const option = getTheme(id).colors;
  const name = t(THEME_COPY[id].name);
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, selected }}
      accessibilityLabel={selected ? `${name}. ${t('style.selected')}` : name}
      accessibilityHint={t(THEME_COPY[id].description)}
      onPress={() => onPress(id)}
      style={({ pressed }) => [
        styles.row,
        {
          borderColor: selected ? current.colors.primary : current.colors.border,
          borderWidth: selected ? 2 : 1,
          backgroundColor: selected ? current.colors.surfaceAlt : current.colors.surface,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.swatches}>
        {[option.primary, option.secondary, option.accent].map((color, index) => (
          <View
            key={index}
            style={[
              styles.swatch,
              { backgroundColor: color, borderColor: current.colors.border, marginLeft: index ? -8 : 0 },
            ]}
          />
        ))}
      </View>
      <View style={styles.copy}>
        <AppText variant="label">{name}</AppText>
        <AppText variant="caption" color={current.colors.muted}>
          {t(THEME_COPY[id].description)}
        </AppText>
      </View>
      {selected ? (
        <AppText color={current.colors.primary} style={styles.check} allowFontScaling={false}>
          ✓
        </AppText>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, borderRadius: 14, padding: 12 },
  swatches: { flexDirection: 'row', alignItems: 'center', width: 56 },
  swatch: { width: 26, height: 26, borderRadius: 13, borderWidth: 1 },
  copy: { flex: 1, gap: 2 },
  check: { fontSize: 22, fontWeight: '700', width: 24, textAlign: 'center' },
});
