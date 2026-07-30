import { StyleSheet, View } from 'react-native';
import { spacing } from '@/constants/theme';
import { useAppTheme } from '@/context/theme-context';
import { AppText } from './app-text';
import { Button } from './button';

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const theme = useAppTheme();
  return (
    <View accessibilityRole="summary" style={[styles.container, { borderColor: theme.colors.border }]}>
      <AppText variant="subtitle" style={styles.center}>
        {title}
      </AppText>
      <AppText color={theme.colors.muted} style={styles.center}>
        {description}
      </AppText>
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} variant="secondary" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 18,
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.md,
  },
  center: { textAlign: 'center' },
});
