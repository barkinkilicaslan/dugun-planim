import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { radius, spacing } from '@/constants/theme';
import { useAppTheme } from '@/context/theme-context';
import { AppText } from './app-text';

export function TextField({
  label,
  error,
  multiline,
  style,
  ...props
}: TextInputProps & { label: string; error?: string }) {
  const theme = useAppTheme();
  return (
    <View style={styles.group}>
      <AppText variant="label">{label}</AppText>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={theme.colors.muted}
        multiline={multiline}
        {...props}
        style={[
          styles.input,
          multiline && styles.multiline,
          {
            color: theme.colors.text,
            backgroundColor: theme.colors.surface,
            borderColor: error ? theme.colors.danger : theme.colors.border,
          },
          style,
        ]}
      />
      {error ? (
        <AppText variant="caption" color={theme.colors.danger}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
  },
  multiline: { minHeight: 112, textAlignVertical: 'top' },
});
