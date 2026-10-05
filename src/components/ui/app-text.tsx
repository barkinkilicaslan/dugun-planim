import { Text, type TextProps, type TextStyle } from 'react-native';
import type { ThemeTypeStyle } from '@/constants/themes';
import { useAppTheme } from '@/context/theme-context';

type Variant = 'display' | 'title' | 'subtitle' | 'body' | 'label' | 'caption';

const variants: Record<Variant, TextStyle> = {
  display: { fontFamily: 'Georgia', fontSize: 31, lineHeight: 38, fontWeight: '700' },
  title: { fontFamily: 'Georgia', fontSize: 24, lineHeight: 31, fontWeight: '700' },
  subtitle: { fontSize: 18, lineHeight: 25, fontWeight: '700' },
  body: { fontSize: 16, lineHeight: 23 },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '700' },
  caption: { fontSize: 13, lineHeight: 18 },
};

function typeStyle(token?: ThemeTypeStyle): TextStyle {
  return token
    ? {
        fontFamily: token.fontFamily,
        fontWeight: token.fontWeight,
        fontStyle: token.fontStyle,
        letterSpacing: token.letterSpacing,
      }
    : {};
}

export function AppText({
  variant = 'body',
  color,
  style,
  ...props
}: TextProps & { variant?: Variant; color?: string }) {
  const theme = useAppTheme();
  // Başlık yazı tipleri temadan gelir; kısmi tema veren testlerde varsayılan stile düşülür.
  const themed =
    variant === 'display'
      ? typeStyle(theme.typography?.display)
      : variant === 'title'
        ? typeStyle(theme.typography?.heading)
        : {};
  return (
    <Text
      maxFontSizeMultiplier={variant === 'display' ? 1.5 : 2}
      {...props}
      style={[variants[variant], themed, { color: color ?? theme.colors.text }, style]}
    />
  );
}
