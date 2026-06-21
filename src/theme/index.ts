// MyCare+ design system
// Single source of truth for colors, spacing, typography, radius and shadows.
// Import `theme` anywhere; use `roleAccent(role)` for the per-role accent color.

export type Role = 'girl' | 'boy' | 'parent' | 'admin'

const palette = {
  // Brand + role accents
  pink: '#e91e63',
  pinkSoft: '#fce4ec',
  blue: '#2196f3',
  blueSoft: '#e3f2fd',
  green: '#4caf50',
  greenSoft: '#e8f5e9',
  red: '#f44336',
  redSoft: '#ffebee',

  // Neutrals
  black: '#1a1a1a',
  ink: '#222222',
  gray700: '#444444',
  gray500: '#777777',
  gray400: '#999999',
  gray300: '#cccccc',
  gray200: '#e0e0e0',
  gray100: '#f0f0f0',
  surface: '#ffffff',
  background: '#f5f5f7',
  white: '#ffffff',

  // Status
  success: '#2e7d32',
  warning: '#f9a825',
  danger: '#d32f2f',
}

export const colors = {
  ...palette,
  primary: palette.pink, // app-wide default brand (overridden per role at the screen level)
  text: palette.ink,
  textMuted: palette.gray500,
  textInverse: palette.white,
  border: palette.gray200,
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  display: 36,
} as const

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
} as const

// Per-role accent + soft background, used to theme each role's screens.
export const roleColors: Record<Role, { accent: string; soft: string }> = {
  girl: { accent: palette.pink, soft: palette.pinkSoft },
  boy: { accent: palette.blue, soft: palette.blueSoft },
  parent: { accent: palette.green, soft: palette.greenSoft },
  admin: { accent: palette.red, soft: palette.redSoft },
}

export const roleAccent = (role?: Role | string | null): string =>
  (role && roleColors[role as Role]?.accent) || colors.primary

export const theme = {
  colors,
  spacing,
  radius,
  fontSize,
  fontWeight,
  shadow,
  roleColors,
}

export default theme
