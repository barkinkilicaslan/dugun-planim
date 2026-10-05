import { StyleSheet, View } from 'react-native';
import { radius } from '@/constants/theme';
import { withAlpha } from '@/constants/themes';
import { useAppTheme } from '@/context/theme-context';

const STEPS = 10;
/** Sabit boyutlu adımlar; `flex: 0` web'de basis'i sıfırladığı için açıkça belirtilir. */
const FIXED = { flexGrow: 0, flexShrink: 0, flexBasis: 'auto' } as const;

/**
 * Hazırlık ilerlemesi. Görünüm temadan gelir (çubuk, bölmeli, ince çizgi, boncuk, ışıltılı, elmas);
 * anlam yalnız renkle değil dolu/boş biçim farkıyla ve erişilebilirlik değeriyle aktarılır.
 */
export function ProgressBar({ value, label }: { value: number; label: string }) {
  const theme = useAppTheme();
  const clamped = Math.max(0, Math.min(100, value));
  const style = theme.shape?.progress ?? 'bar';
  const track = theme.colors.progressTrack ?? theme.colors.surfaceAlt;
  const fill = theme.colors.progressFill ?? theme.colors.primary;
  // Yüzde 0'dan büyükse en az bir, 100'den küçükse en çok dokuz adım dolu görünür; böylece görünüm gerçek durumu yanıltmaz.
  const rounded = Math.round((clamped / 100) * STEPS);
  const filled = clamped <= 0 ? 0 : clamped >= 100 ? STEPS : Math.min(STEPS - 1, Math.max(1, rounded));
  const a11y = {
    accessibilityRole: 'progressbar' as const,
    accessibilityLabel: label,
    accessibilityValue: { min: 0, max: 100, now: clamped },
  };

  if (style === 'segments' || style === 'beads' || style === 'diamonds') {
    return (
      <View {...a11y} style={styles.steps}>
        {Array.from({ length: STEPS }, (_, index) => {
          const on = index < filled;
          const shape =
            style === 'segments'
              ? { height: 12, borderRadius: 3 }
              : style === 'beads'
                ? { height: 14, width: 14, ...FIXED, borderRadius: 7 }
                : { height: 12, width: 12, ...FIXED, borderRadius: 2, transform: [{ rotate: '45deg' }] };
          return (
            <View
              key={index}
              importantForAccessibility="no"
              style={[
                styles.step,
                shape,
                {
                  backgroundColor: on ? fill : 'transparent',
                  borderColor: on ? fill : withAlpha(theme.colors.muted, 0.55),
                  borderWidth: on ? 0 : 2,
                },
              ]}
            />
          );
        })}
      </View>
    );
  }

  if (style === 'line') {
    return (
      <View {...a11y} style={styles.lineWrap}>
        <View style={[styles.line, { backgroundColor: track }]} />
        <View style={[styles.line, styles.lineFill, { width: `${clamped}%`, backgroundColor: fill }]} />
        <View style={[styles.marker, { left: `${clamped}%`, backgroundColor: fill }]} />
      </View>
    );
  }

  const glow = style === 'glow';
  return (
    <View
      {...a11y}
      style={[
        styles.track,
        { backgroundColor: track, height: glow ? 10 : 12 },
        glow ? { borderWidth: 1, borderColor: theme.colors.border, overflow: 'visible' } : null,
      ]}
    >
      <View
        style={[
          styles.fill,
          { width: `${clamped}%`, backgroundColor: fill },
          glow
            ? { shadowColor: fill, shadowOpacity: 0.9, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } }
            : null,
        ]}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  track: { borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
  steps: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4, minHeight: 20 },
  step: { flex: 1 },
  lineWrap: { height: 16, justifyContent: 'center' },
  line: { height: 2, width: '100%', position: 'absolute' },
  lineFill: { alignSelf: 'flex-start' },
  marker: { position: 'absolute', width: 10, height: 10, marginLeft: -5, transform: [{ rotate: '45deg' }] },
});
