import { StyleSheet, View } from 'react-native';
import { radius } from '@/constants/theme';
import { useAppTheme } from '@/context/theme-context';

export function ProgressBar({ value, label }: { value: number; label: string }) {
  const theme = useAppTheme();
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: clamped }}
      style={[styles.track, { backgroundColor: theme.colors.surfaceAlt }]}
    >
      <View style={[styles.fill, { width: `${clamped}%`, backgroundColor: theme.colors.primary }]} />
    </View>
  );
}
const styles = StyleSheet.create({
  track: { height: 10, borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
});
