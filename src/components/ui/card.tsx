import type { PropsWithChildren } from 'react';
import { Platform, StyleSheet, View, type ViewProps } from 'react-native';
import { cardRadius } from '@/constants/themes';
import { spacing } from '@/constants/theme';
import { useAppTheme } from '@/context/theme-context';

export function Card({ style, ...props }: PropsWithChildren<ViewProps>) {
  const theme = useAppTheme();
  const opacity = theme.shape?.shadowOpacity ?? 0.06;
  const blur = theme.shape?.shadowRadius ?? 10;
  const shadow = theme.colors.shadow ?? '#241E20';
  return (
    <View
      {...props}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: cardRadius(theme),
          borderWidth: theme.shape?.cardBorderWidth ?? StyleSheet.hairlineWidth,
        },
        opacity > 0
          ? Platform.select({
              web: {
                boxShadow: `0 3px ${blur}px ${shadow}${Math.round(opacity * 255)
                  .toString(16)
                  .padStart(2, '0')}`,
              },
              default: {
                shadowColor: shadow,
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: opacity,
                shadowRadius: blur,
                elevation: 2,
              },
            })
          : null,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.lg, gap: spacing.md },
});
