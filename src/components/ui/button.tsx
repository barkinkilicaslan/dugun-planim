import { ActivityIndicator, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { spacing } from '@/constants/theme';
import { controlRadius } from '@/constants/themes';
import { useAppTheme } from '@/context/theme-context';
import { AppText } from './app-text';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  accessibilityLabel,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  style?: ViewStyle;
}) {
  const theme = useAppTheme();
  const background =
    variant === 'primary'
      ? theme.colors.primary
      : variant === 'danger'
        ? theme.colors.danger
        : variant === 'secondary'
          ? theme.colors.surfaceAlt
          : 'transparent';
  const color =
    variant === 'primary' || variant === 'danger'
      ? theme.colors.primaryText
      : variant === 'ghost'
        ? theme.colors.primary
        : theme.colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: Boolean(disabled || loading), busy: Boolean(loading) }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: background,
          borderColor: variant === 'ghost' ? theme.colors.border : background,
          borderRadius: controlRadius(theme),
          opacity: disabled ? 0.45 : pressed ? 0.78 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <AppText variant="label" color={color} style={styles.label}>
          {label}
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    minWidth: 48,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { textAlign: 'center' },
});
