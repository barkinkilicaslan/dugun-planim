import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';

import { darkTheme, lightTheme, type AppTheme } from '@/constants/theme';
import { useApp } from './app-context';

const ThemeContext = createContext<AppTheme>(lightTheme);

export function AppThemeProvider({ children }: PropsWithChildren) {
  const system = useColorScheme();
  const { data } = useApp();
  const preference = data.profile.theme;
  const dark = preference === 'dark' || (preference === 'system' && system === 'dark');
  const theme = useMemo(() => (dark ? darkTheme : lightTheme), [dark]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): AppTheme {
  return useContext(ThemeContext);
}
