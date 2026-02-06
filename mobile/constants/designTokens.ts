// Design tokens - Calm New Age Gaming Aesthetic
// Combines calm colors, new-age mystical feel, and subtle gaming aesthetics

export const colors = {
  // Base colors (Calm + Dark Gaming)
  background: '#0F1419', // Deep charcoal - reduces eye strain
  surface: '#1E2530', // Soft dark gray with subtle transparency
  surfaceElevated: '#252B38', // Slightly lighter for elevated surfaces
  textPrimary: '#E8EAED', // Off-white/soft silver
  textSecondary: '#8B95A6', // Muted gray-blue
  
  // Category accents (New Age + Gaming)
  category: {
    work: '#00D9FF', // Soft cyan/teal - calm tech feel
    leverage: '#10D9A0', // Emerald green - growth energy
    health: '#FFB84D', // Warm amber - vitality
    stability: '#A78BFA', // Soft purple/violet - mystical calm
  },
  
  // Glow variants (subtle neon effects)
  glow: {
    work: '#00D9FF40', // 25% opacity
    leverage: '#10D9A040',
    health: '#FFB84D40',
    stability: '#A78BFA40',
    default: 'rgba(167, 139, 250, 0.2)', // Soft purple glow
  },
  
  // Borders
  border: '#2A3441', // Subtle border color
  borderLight: '#3A4451', // Lighter border for focus states
  
  // Status colors
  success: '#10D9A0',
  warning: '#FFB84D',
  error: '#FF6B6B',
  info: '#00D9FF',
} as const;

// Gradient definitions
export const gradients = {
  // Background gradients
  background: {
    colors: ['#0F1419', '#1A1F2E', '#0F1419'], // Deep navy to charcoal
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  
  // Card gradients
  card: {
    colors: ['#1E2530', '#252B38'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  
  // Category gradients (color to transparent)
  category: {
    work: ['#00D9FF', '#00D9FF00'],
    leverage: ['#10D9A0', '#10D9A000'],
    health: ['#FFB84D', '#FFB84D00'],
    stability: ['#A78BFA', '#A78BFA00'],
  },
  
  // Accent gradients
  accent: {
    purpleTeal: ['#A78BFA', '#00D9FF'], // New-age mystical
    tealGreen: ['#00D9FF', '#10D9A0'], // Calm tech
  },
} as const;

// Shadow/glow presets for gaming aesthetic
export const shadows = {
  // Soft shadows with color tints
  small: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  
  medium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  
  large: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  
  // Colored glows for category items
  glow: {
    work: {
      shadowColor: '#00D9FF',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 4,
    },
    leverage: {
      shadowColor: '#10D9A0',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 4,
    },
    health: {
      shadowColor: '#FFB84D',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 4,
    },
    stability: {
      shadowColor: '#A78BFA',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 4,
    },
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
  // Font families - System default (San Francisco / Roboto)
  fontFamily: {
    regular: 'System',
    semibold: 'System',
  },
  
  // Font sizes
  fontSize: {
    title: 22, // 20-22px, semibold
    body: 16, // 15-16px, regular
    caption: 13, // 12-13px
    small: 11,
  },
  
  // Font weights
  fontWeight: {
    regular: '400' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  
  // Line heights
  lineHeight: {
    title: 28,
    body: 22,
    caption: 18,
  },
} as const;

// Border radius (more pronounced for modern look)
export const borderRadius = {
  small: 8,
  medium: 12,
  large: 16,
  xl: 20,
  round: 9999,
} as const;

// Animation timing
export const animations = {
  fast: 150,
  normal: 250,
  slow: 350,
  verySlow: 500,
} as const;

// Helper function to get category color
export const getCategoryColor = (category: string): string => {
  const categoryKey = category.toLowerCase() as keyof typeof colors.category;
  return colors.category[categoryKey] || colors.textPrimary;
};

// Helper function to get category glow
export const getCategoryGlow = (category: string): string => {
  const categoryKey = category.toLowerCase() as keyof typeof colors.glow;
  return colors.glow[categoryKey] || colors.glow.default;
};

// Helper function to get category shadow
export const getCategoryShadow = (category: string) => {
  const categoryKey = category.toLowerCase() as keyof typeof shadows.glow;
  return shadows.glow[categoryKey] || shadows.medium;
};
