/**
 * Personal AI — one dark colour system.
 * Semantic tokens only. No light theme. No mood-based or per-screen palettes.
 */

export const theme = {
  background: '#151D1B',
  surface: '#1E2925',
  surfaceRaised: '#26332D',
  surfaceHover: '#2C3C34',

  textPrimary: '#EAF0EB',
  textSecondary: '#B4C1BA',
  textMuted: '#9AAEA2',

  borderSubtle: '#3B4C42',
  borderControl: '#7A9182',

  primary: '#A4CDBB',
  primaryHover: '#B5DAC9',
  primaryPressed: '#91BAA7',
  onPrimary: '#152B23',
  primaryContainer: '#293F34',

  aiAccent: '#C6B8E2',
  aiContainer: '#332D40',

  success: '#B4D2A2',
  successContainer: '#2A3827',

  warning: '#E8C582',
  warningContainer: '#3D3324',

  danger: '#ECA7A1',
  dangerContainer: '#422B2A',

  focusRing: '#A4CDBB',
  focusRingGap: '#151D1B',
} as const;

export type ThemeToken = keyof typeof theme;

const restrainedShadow = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.18,
  shadowRadius: 4,
  elevation: 2,
} as const;

export const colors = {
  background: theme.background,
  surface: theme.surface,
  surfaceElevated: theme.surfaceRaised,
  surfaceRaised: theme.surfaceRaised,
  surfaceHover: theme.surfaceHover,

  textPrimary: theme.textPrimary,
  textSecondary: theme.textSecondary,
  textMuted: theme.textMuted,

  border: theme.borderSubtle,
  borderLight: theme.borderControl,
  borderSubtle: theme.borderSubtle,
  borderControl: theme.borderControl,

  primary: theme.primary,
  primaryHover: theme.primaryHover,
  primaryPressed: theme.primaryPressed,
  onPrimary: theme.onPrimary,
  primaryContainer: theme.primaryContainer,

  aiAccent: theme.aiAccent,
  aiContainer: theme.aiContainer,

  success: theme.success,
  successContainer: theme.successContainer,
  warning: theme.warning,
  warningContainer: theme.warningContainer,
  error: theme.danger,
  danger: theme.danger,
  dangerContainer: theme.dangerContainer,
  info: theme.primary,
  focusRing: theme.focusRing,
  focusRingGap: theme.focusRingGap,

  // Legacy category keys. Subordinate labels only — never a second primary system.
  category: {
    work: theme.textSecondary,
    leverage: theme.textSecondary,
    health: theme.textSecondary,
    stability: theme.textSecondary,
  },

  glow: {
    work: 'transparent',
    leverage: 'transparent',
    health: 'transparent',
    stability: 'transparent',
    default: 'transparent',
  },
} as const;

export const gradients = {
  background: {
    colors: [theme.background, theme.background, theme.background] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  card: {
    colors: [theme.surface, theme.surface] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  raised: {
    colors: [theme.surfaceRaised, theme.surfaceRaised] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  category: {
    work: [theme.surface, theme.surface] as const,
    leverage: [theme.surface, theme.surface] as const,
    health: [theme.surface, theme.surface] as const,
    stability: [theme.surface, theme.surface] as const,
  },
  accent: {
    purpleTeal: [theme.surface, theme.surface] as const,
    tealGreen: [theme.surface, theme.surface] as const,
  },
} as const;

export const shadows = {
  small: restrainedShadow,
  medium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  large: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },
  glow: {
    work: restrainedShadow,
    leverage: restrainedShadow,
    health: restrainedShadow,
    stability: restrainedShadow,
  },
} as const;

export const spacing = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
} as const;

export const typography = {
  fontFamily: {
    regular: 'System',
    semibold: 'System',
  },
  fontSize: {
    title: 22,
    body: 16,
    caption: 13,
    small: 12,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeight: {
    title: 28,
    body: 24,
    caption: 18,
  },
} as const;

export const borderRadius = {
  small: 8,
  medium: 12,
  large: 16,
  xl: 20,
  round: 9999,
} as const;

export const animations = {
  fast: 150,
  normal: 250,
  slow: 350,
  verySlow: 500,
} as const;

export const motionDuration = (duration: number, reduceMotion: boolean): number =>
  reduceMotion ? 0 : duration;

export const focusRingStyle = {
  borderWidth: 2,
  borderColor: theme.focusRing,
  outlineColor: theme.focusRingGap,
} as const;

export const getCategoryColor = (_category: string): string => colors.textSecondary;

export const getCategoryGlow = (_category: string): string => 'transparent';

export const getCategoryShadow = (_category: string) => shadows.small;
