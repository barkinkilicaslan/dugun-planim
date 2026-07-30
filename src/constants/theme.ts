export const palette = {
  ivory: '#F8F3EA',
  warmWhite: '#FFFDFC',
  burgundy: '#6F1D3A',
  burgundyDark: '#521329',
  gold: '#C7A86B',
  ink: '#241E20',
  muted: '#6F6468',
  border: '#DED2C5',
  success: '#356A50',
  warning: '#9A5B14',
  danger: '#A33838',
  darkBackground: '#181315',
  darkSurface: '#261F22',
  darkText: '#F8F3EA',
  darkMuted: '#C9BDC1',
  darkBorder: '#453A3E',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, huge: 40 } as const;
export const radius = { sm: 10, md: 14, lg: 18, pill: 999 } as const;

export interface AppTheme {
  dark: boolean;
  colors: {
    background: string;
    surface: string;
    surfaceAlt: string;
    primary: string;
    primaryText: string;
    accent: string;
    text: string;
    muted: string;
    border: string;
    success: string;
    warning: string;
    danger: string;
    tabBar: string;
  };
}

export const lightTheme: AppTheme = {
  dark: false,
  colors: {
    background: palette.ivory,
    surface: palette.warmWhite,
    surfaceAlt: '#F2E8DC',
    primary: palette.burgundy,
    primaryText: '#FFFFFF',
    accent: palette.gold,
    text: palette.ink,
    muted: palette.muted,
    border: palette.border,
    success: palette.success,
    warning: palette.warning,
    danger: palette.danger,
    tabBar: '#FFFDFC',
  },
};

export const darkTheme: AppTheme = {
  dark: true,
  colors: {
    background: palette.darkBackground,
    surface: palette.darkSurface,
    surfaceAlt: '#33282C',
    primary: '#D78AA4',
    primaryText: '#241E20',
    accent: '#D7BE8C',
    text: palette.darkText,
    muted: palette.darkMuted,
    border: palette.darkBorder,
    success: '#80C9A3',
    warning: '#F1BB72',
    danger: '#F09898',
    tabBar: '#211A1D',
  },
};
