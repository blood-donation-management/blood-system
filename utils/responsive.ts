import { Dimensions, Platform, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Guideline sizes are based on standard ~5" screen mobile device
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

export const scale = (size: number) => (SCREEN_WIDTH / guidelineBaseWidth) * size;
export const verticalScale = (size: number) => (SCREEN_HEIGHT / guidelineBaseHeight) * size;
export const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

// Responsive font sizes
export const fontSize = {
  xs: moderateScale(10),
  sm: moderateScale(12),
  base: moderateScale(14),
  md: moderateScale(16),
  lg: moderateScale(18),
  xl: moderateScale(20),
  '2xl': moderateScale(24),
  '3xl': moderateScale(30),
  '4xl': moderateScale(36),
};

// Responsive spacing
export const spacing = {
  xs: moderateScale(4),
  sm: moderateScale(8),
  md: moderateScale(12),
  lg: moderateScale(16),
  xl: moderateScale(20),
  '2xl': moderateScale(24),
  '3xl': moderateScale(32),
  '4xl': moderateScale(40),
};

// Device type detection
export const isSmallDevice = SCREEN_WIDTH < 375;
export const isMediumDevice = SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 768;
export const isLargeDevice = SCREEN_WIDTH >= 768;
export const isTablet = SCREEN_WIDTH >= 768;

// Responsive dimensions
export const wp = (percentage: number) => {
  return (SCREEN_WIDTH * percentage) / 100;
};

export const hp = (percentage: number) => {
  return (SCREEN_HEIGHT * percentage) / 100;
};

// Responsive colors with theme
export const colors = {
  primary: {
    50: '#fee2e2',
    100: '#fecaca',
    200: '#fca5a5',
    300: '#f87171',
    400: '#ef4444',
    500: '#dc2626',
    600: '#b91c1c',
    700: '#991b1b',
    800: '#7f1d1d',
    900: '#701a1a',
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  white: '#ffffff',
  black: '#000000',
};

// Responsive shadows
export const shadows = {
  sm: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
};

// Responsive border radius
export const borderRadius = {
  sm: moderateScale(4),
  md: moderateScale(8),
  lg: moderateScale(12),
  xl: moderateScale(16),
  '2xl': moderateScale(20),
  full: 9999,
};

// Common responsive styles
export const commonStyles = {
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.md,
  },
  button: {
    height: moderateScale(48),
    borderRadius: borderRadius.md,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    ...shadows.sm,
  },
  input: {
    height: moderateScale(48),
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.base,
    borderWidth: 1,
    borderColor: colors.gray[300],
  },
};

export const getResponsiveValue = <T,>(values: { small?: T; medium?: T; large?: T }, defaultValue: T): T => {
  if (isSmallDevice && values.small !== undefined) return values.small;
  if (isMediumDevice && values.medium !== undefined) return values.medium;
  if (isLargeDevice && values.large !== undefined) return values.large;
  return values.medium || defaultValue;
};
