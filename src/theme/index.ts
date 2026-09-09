// MyCare+ design system
// Single source of truth for colors, spacing, typography, radius and shadows.
// Import `theme` anywhere; use `roleAccent(role)` for the per-role accent color.

export type Role = 'girl' | 'boy' | 'parent' | 'admin'

const palette = {
  // Brand + role accents
  pink: '#c94f78',
  pinkSoft: '#f8e7ed',
  blue: '#2f6f95',
  blueSoft: '#e5f0f5',
  green: '#3e8066',
  greenSoft: '#e5f1eb',
  red: '#b65353',
  redSoft: '#f8e8e8',

  // Neutrals
  black: '#17211f',
  ink: '#24312e',
  gray700: '#4c5a56',
  gray500: '#71807b',
  gray400: '#9aa6a2',
  gray300: '#c9d1ce',
  gray200: '#e2e8e5',
  gray100: '#f1f4f2',
  surface: '#ffffff',
  background: '#f4f6f3',
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
  lg: 18,
  xl: 26,
  xxl: 36,
} as const

export const radius = {
  sm: 7,
  md: 11,
  lg: 15,
  pill: 999,
} as const

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 21,
  xxl: 30,
  display: 38,
} as const

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const

export const shadow = {
  card: {
    boxShadow: '0px 1px 5px rgba(0, 0, 0, 0.05)',
    elevation: 1,
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
