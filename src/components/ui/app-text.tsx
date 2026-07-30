import { Text, type TextProps, type TextStyle } from 'react-native';
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

export function AppText({
  variant = 'body',
  color,
  style,
  ...props
}: TextProps & { variant?: Variant; color?: string }) {
  const theme = useAppTheme();
  return (
    <Text
      maxFontSizeMultiplier={variant === 'display' ? 1.5 : 2}
      {...props}
      style={[variants[variant], { color: color ?? theme.colors.text }, style]}
    />
  );
}
