import { Platform } from 'react-native';

// Design tokens — moon-glow purple professional palette
export const Colors = {
  dark: {
    background:      '#050716',   // deep navy
    secondary:       '#080B1F',
    surface:         'rgba(255,255,255,0.055)',
    surfaceElevated: 'rgba(255,255,255,0.085)',

    border:          'rgba(167,139,250,0.22)',   // lavender glass border
    borderSubtle:    'rgba(167,139,250,0.12)',
    borderStrong:    'rgba(244,114,182,0.55)',    // active pink glow

    text:            '#F8F7FF',
    textSecondary:   'rgba(248,247,255,0.76)',
    textMuted:       'rgba(248,247,255,0.64)',

    tint:            '#A78BFA',
    primary:         '#A78BFA',   // purple
    primaryDim:      '#7C3AED',
    primaryGlow:     '#C4B5FD',   // light lavender

    accent:          '#F472B6',   // pink
    accentDim:       '#DB2777',
    accentHi:        '#F9A8D4',   // light pink

    blue:            '#60A5FA',
    gold:            '#FCD34D',

    glowPurple:      'rgba(167,139,250,0.30)',
    glowPink:        'rgba(244,114,182,0.28)',
    glowBlue:        'rgba(96,165,250,0.22)',

    success:         '#4ADE80',
    warning:         '#FCD34D',
    error:           '#F472B6',

    tabIconDefault:  'rgba(255,255,255,0.56)',
    tabIconSelected: '#F9A8D4',
    icon:            'rgba(248,247,255,0.74)',
  },
  light: {
    background:      '#F8F6FF',
    secondary:       '#EDE9FE',
    surface:         '#FFFFFF',
    surfaceElevated: '#F0EEFF',

    border:          '#DDD6FE',
    borderSubtle:    '#EDE9FE',
    borderStrong:    '#A78BFA',

    text:            '#1A1625',
    textSecondary:   '#5E5878',
    textMuted:       '#7D7798',

    tint:            '#7C5FD1',
    primary:         '#7C5FD1',
    primaryDim:      '#6645B5',
    primaryGlow:     '#C4B5FD',

    accent:          '#EC4899',
    accentDim:       '#DB2777',
    accentHi:        '#F9A8D4',

    blue:            '#3B82F6',
    gold:            '#EAB308',

    glowPurple:      'rgba(124,95,209,0.20)',
    glowPink:        'rgba(236,72,153,0.20)',
    glowBlue:        'rgba(59,130,246,0.20)',

    success:         '#22C55E',
    warning:         '#EAB308',
    error:           '#EF4444',

    tabIconDefault:  '#8E88AE',
    tabIconSelected: '#7C5FD1',
    icon:            '#6B6882',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans:    'system-ui',
    serif:   'ui-serif',
    rounded: 'ui-rounded',
    mono:    'ui-monospace',
  },
  default: {
    sans:    'normal',
    serif:   'serif',
    rounded: 'normal',
    mono:    'monospace',
  },
  web: {
    sans:    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    serif:   "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Nunito', 'Varela Round', sans-serif",
    mono:    "SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
});

export const FontSizes = {
  xs:    12,
  sm:    14,
  base:  16,
  lg:    18,
  xl:    20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
};

export const FontWeights = {
  normal:   '400' as const,
  medium:   '500' as const,
  semibold: '600' as const,
  bold:     '700' as const,
  black:    '900' as const,
};

export const Spacing = {
  xs:    4,
  sm:    8,
  md:    12,
  lg:    16,
  xl:    20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 48,
  '5xl': 64,
  '6xl': 96,
};

export const Radii = {
  sm:    8,
  md:    12,
  lg:    16,
  xl:    20,
  '2xl': 24,
  card:  28,
  '3xl': 32,
  full:  9999,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 24,
    elevation: 8,
  },
};
