import { useState } from 'react';
import type { TextInputProps } from 'react-native';

import { TextField } from '@/components/ui/text-field';
import { useI18n } from '@/context/language-context';
import { formatMoneyInput, parseMoney } from '@/domain/money';

/**
 * Tutar alanı: kullanıcının yazdığı metni kendisi tutar, saklanan değer kuruş olarak yukarı bildirilir.
 * Yazarken ondalık ayırıcı silinmez ("12," → "12,"), "0" alanı boşaltmaz; geçersiz bir tuş vuruşu (ör. ikinci virgül,
 * harf, üçüncü ondalık basamak) yok sayılır. Alandan çıkınca metin normalleştirilir ("1.250,5" → "1250,5").
 */
export function MoneyField({
  label,
  cents,
  onChangeCents,
  ...props
}: Omit<TextInputProps, 'value' | 'onChangeText' | 'keyboardType'> & {
  label: string;
  cents: number;
  onChangeCents: (cents: number) => void;
  error?: string;
}) {
  const { locale } = useI18n();
  const [text, setText] = useState(() => formatMoneyInput(cents, locale));
  // Metin dışarıdan değişen değerle (ör. yedek geri yükleme) çelişirse saklanan değer esas alınır.
  const parsed = parseMoney(text, locale);
  const shown = parsed && parsed.cents === cents ? text : formatMoneyInput(cents, locale);

  function change(next: string) {
    const result = parseMoney(next, locale);
    if (!result) return;
    setText(next);
    onChangeCents(result.cents);
  }

  return (
    <TextField
      {...props}
      label={label}
      value={shown}
      onChangeText={change}
      onBlur={(event) => {
        setText(formatMoneyInput(cents, locale));
        props.onBlur?.(event);
      }}
      keyboardType="decimal-pad"
    />
  );
}
