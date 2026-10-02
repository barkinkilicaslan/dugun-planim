import { createElement, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';

import { radius, spacing } from '@/constants/theme';
import { useI18n } from '@/context/language-context';
import { useAppTheme } from '@/context/theme-context';
import {
  formatLongWithWeekday,
  formatNumeric,
  formatTime,
  isoFromLocalDate,
  isValidTimeString,
  localDateFromIso,
  localDateFromTime,
  timeFromLocalDate,
} from '@/domain/wedding-date';
import { AppText } from './app-text';

interface BaseProps {
  label: string;
  error?: string;
  /** Alanın boş bırakılabildiği durumlarda "Temizle" düğmesini gösterir. */
  clearable?: boolean;
}

type PickerKind = 'date' | 'time';

interface PickerFieldProps extends BaseProps {
  kind: PickerKind;
  value: string;
  onChange: (value: string) => void;
  minimumDate?: string;
  placeholder: string;
  describe: (value: string) => string;
}

function PickerField({
  kind,
  label,
  value,
  onChange,
  minimumDate,
  placeholder,
  describe,
  error,
  clearable,
}: PickerFieldProps) {
  const theme = useAppTheme();
  const { t, intl, locale } = useI18n();
  const [iosOpen, setIosOpen] = useState(false);
  const hasValue = kind === 'date' ? Boolean(localDateFromIso(value)) : isValidTimeString(value);
  const display = hasValue ? describe(value) : placeholder;
  const pickerDate = kind === 'date' ? (localDateFromIso(value) ?? new Date()) : localDateFromTime(value);
  const minimum = kind === 'date' && minimumDate ? localDateFromIso(minimumDate) : undefined;

  function handlePicked(picked: Date) {
    onChange(kind === 'date' ? isoFromLocalDate(picked) : timeFromLocalDate(picked));
  }

  function open() {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: pickerDate,
        mode: kind,
        is24Hour: locale === 'tr',
        minimumDate: minimum,
        onValueChange: (_event, picked) => handlePicked(picked),
      });
    } else setIosOpen((current) => !current);
  }

  return (
    <View style={styles.group}>
      <AppText variant="label">{label}</AppText>
      {Platform.OS === 'web' ? (
        createElement('input', {
          type: kind,
          'aria-label': label,
          value: hasValue ? value : '',
          min: kind === 'date' ? minimumDate : undefined,
          onChange: (event: { target: { value: string } }) => onChange(event.target.value),
          style: {
            minHeight: 48,
            borderRadius: radius.md,
            border: `1px solid ${error ? theme.colors.danger : theme.colors.border}`,
            padding: '0 12px',
            fontSize: 16,
            color: theme.colors.text,
            backgroundColor: theme.colors.surface,
          },
        })
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            hasValue ? t('date.field.selected', { label, value: display }) : t('date.field.notSelected', { label })
          }
          onPress={open}
          style={({ pressed }) => [
            styles.input,
            {
              backgroundColor: theme.colors.surface,
              borderColor: error ? theme.colors.danger : theme.colors.border,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <AppText color={hasValue ? theme.colors.text : theme.colors.muted}>{display}</AppText>
          <AppText color={theme.colors.primary} style={styles.icon}>
            {kind === 'date' ? '▦' : '◷'}
          </AppText>
        </Pressable>
      )}
      {Platform.OS === 'ios' && iosOpen ? (
        <DateTimePicker
          value={pickerDate}
          mode={kind}
          display={kind === 'date' ? 'inline' : 'spinner'}
          locale={intl}
          minimumDate={minimum}
          accentColor={theme.colors.primary}
          themeVariant={theme.dark ? 'dark' : 'light'}
          onValueChange={(_event, picked) => handlePicked(picked)}
        />
      ) : null}
      {clearable && hasValue ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('date.field.clear', { label })}
          onPress={() => onChange('')}
          style={styles.clear}
        >
          <AppText variant="caption" color={theme.colors.primary}>
            {t('common.clear')}
          </AppText>
        </Pressable>
      ) : null}
      {error ? (
        <AppText variant="caption" color={theme.colors.danger}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

/** Takvim tarihi seçici: değer `YYYY-AA-GG` metnidir, görünüm `GG.AA.YYYY · 2 Ekim 2026 Cuma` biçimindedir. */
export function DateField({
  value,
  onChange,
  minimumDate,
  placeholder,
  ...rest
}: BaseProps & { value: string; onChange: (value: string) => void; minimumDate?: string; placeholder?: string }) {
  const { t, locale } = useI18n();
  return (
    <PickerField
      kind="date"
      value={value}
      onChange={onChange}
      minimumDate={minimumDate}
      placeholder={placeholder ?? t('date.field.pickDate')}
      describe={(date) => `${formatNumeric(date)} · ${formatLongWithWeekday(date, locale)}`}
      {...rest}
    />
  );
}

/** Saat seçici: değer `SS:DD` metnidir. */
export function TimeField({
  value,
  onChange,
  placeholder,
  ...rest
}: BaseProps & { value: string; onChange: (value: string) => void; placeholder?: string }) {
  const { t, locale } = useI18n();
  return (
    <PickerField
      kind="time"
      value={value}
      onChange={onChange}
      placeholder={placeholder ?? t('date.field.pickTime')}
      describe={(time) => formatTime(time, locale)}
      {...rest}
    />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  icon: { fontSize: 20 },
  clear: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
});
