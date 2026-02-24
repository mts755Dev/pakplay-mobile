// PakPlay Color System - Matching the web app theme
export const COLORS = {
  // Primary - Sunset Orange
  primary: '#FF6B35',
  primaryLight: '#FF8A5A',
  primaryDark: '#E65520',
  
  // Secondary - Midnight Blue
  secondary: '#1E3A8A',
  secondaryLight: '#2E4AA5',
  secondaryDark: '#0E2A7A',
  
  // Accent - Lime Green
  accent: '#A7F432',
  accentLight: '#B8FF3F',
  accentDark: '#8FD320',
  
  // Neutrals
  background: '#F8F9FA',  // Off White
  surface: '#FFFFFF',
  foreground: '#212121',  // Charcoal
  
  // Text
  text: '#212121',
  textLight: '#6B7280',
  textMuted: '#9CA3AF',
  textInverse: '#FFFFFF',
  mutedForeground: '#9CA3AF', // Alias for textMuted
  
  // UI Elements
  border: '#E5E7EB',
  divider: '#F3F4F6',
  input: '#E5E7EB',
  placeholder: '#9CA3AF',
  
  // Status
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  destructive: '#EF4444', // Alias for error
  destructiveForeground: '#FFFFFF', // White text on destructive background
  muted: '#F3F4F6', // Light gray for muted backgrounds
  
  // Card & Shadow
  card: '#FFFFFF',
  cardBorder: '#E5E7EB',
  shadow: 'rgba(0, 0, 0, 0.1)',
  
  // Sport Type Colors
  sports: {
    cricket: '#FF6B35',
    football: '#10B981',
    futsal: '#8B5CF6',
    pickleball: '#F59E0B',
    badminton: '#EF4444',
    padel: '#06B6D4',
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const FONT_WEIGHTS = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
};

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};
