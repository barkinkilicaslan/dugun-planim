import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { spacing } from '@/constants/theme';
import { useAppTheme } from '@/context/theme-context';
import { shouldCompactMetricValue } from '@/domain/metric-display';
import { AppText } from './app-text';
import { Card } from './card';

export function MetricCard({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'default' | 'warning' | 'success';
}) {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const color =
    tone === 'warning' ? theme.colors.warning : tone === 'success' ? theme.colors.success : theme.colors.primary;
  return (
    <Card style={styles.card}>
      <AppText variant="caption" color={theme.colors.muted}>
        {label}
      </AppText>
      <AppText
        variant="title"
        color={color}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.78}
        style={[styles.value, shouldCompactMetricValue(value, width) ? styles.compactValue : null]}
      >
        {value}
      </AppText>
      {hint ? (
        <AppText variant="caption" color={theme.colors.muted}>
          {hint}
        </AppText>
      ) : null}
    </Card>
  );
}

export function MetricGrid({ children }: React.PropsWithChildren) {
  return <View style={styles.grid}>{children}</View>;
}
const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  card: { flexGrow: 1, flexBasis: 150, minWidth: 140 },
  value: { fontSize: 21, lineHeight: 27 },
  compactValue: { fontSize: 15, lineHeight: 22 },
});
