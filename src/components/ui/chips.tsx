import { Pressable, StyleSheet, View } from 'react-native';
import { radius, spacing } from '@/constants/theme';
import { useI18n } from '@/context/language-context';
import { useAppTheme } from '@/context/theme-context';
import { AppText } from './app-text';

export interface ChipOption<T extends string> {
  value: T;
  label: string;
}

export function Chips<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label?: string;
  options: ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  const theme = useAppTheme();
  const { t } = useI18n();
  return (
    <View style={styles.group}>
      {label ? <AppText variant="label">{label}</AppText> : null}
      <View style={styles.row}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={`${label ?? t('common.choice')}: ${option.label}`}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
                  borderColor: selected ? theme.colors.primary : theme.colors.border,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <AppText
                variant="caption"
                color={selected ? theme.colors.primaryText : theme.colors.text}
                style={styles.chipText}
              >
                {option.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
  },
  chipText: { fontWeight: '700' },
});
