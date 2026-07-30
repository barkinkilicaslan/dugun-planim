import type { PropsWithChildren } from 'react';
import { Platform, StyleSheet, View, type ViewProps } from 'react-native';
import { radius, spacing } from '@/constants/theme';
import { useAppTheme } from '@/context/theme-context';

export function Card({ style, ...props }: PropsWithChildren<ViewProps>) {
  const theme = useAppTheme();
  return (
    <View
      {...props}
      style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }, style]}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    gap: spacing.md,
    ...Platform.select({
      web: { boxShadow: '0 3px 10px rgba(36, 30, 32, 0.06)' },
      default: {
        shadowColor: '#241E20',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 2,
      },
    }),
  },
});
