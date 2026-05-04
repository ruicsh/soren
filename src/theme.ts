import { Platform, PlatformColor } from 'react-native';

/*
 * iOS uses PlatformColor() for automatic dark-mode support.
 * Android / web fall back to the light-mode palette to match
 * the previous global.css behaviour.
 */
const ios = {
  bg: PlatformColor('systemBackground'),
  bg2: PlatformColor('secondarySystemBackground'),
  bg3: PlatformColor('tertiarySystemBackground'),
  text: PlatformColor('label'),
  text2: PlatformColor('secondaryLabel'),
  text3: PlatformColor('tertiaryLabel'),
  accent: PlatformColor('systemBlue'),
  success: PlatformColor('systemGreen'),
  error: PlatformColor('systemRed'),
  warning: PlatformColor('systemOrange'),
  separator: PlatformColor('separator'),
  border: PlatformColor('separator'),
  fill: PlatformColor('systemFill'),
  fill2: PlatformColor('secondarySystemFill'),
} as const;

const fallback = {
  bg: '#ffffff',
  bg2: '#f2f2f7',
  bg3: '#ffffff',
  text: '#000000',
  text2: 'rgba(60, 60, 67, 0.6)',
  text3: 'rgba(60, 60, 67, 0.3)',
  accent: 'rgb(0, 122, 255)',
  success: 'rgb(52, 199, 89)',
  error: 'rgb(255, 59, 48)',
  warning: 'rgb(255, 149, 0)',
  separator: 'rgba(60, 60, 67, 0.29)',
  border: 'rgba(60, 60, 67, 0.29)',
  fill: 'rgba(120, 120, 128, 0.2)',
  fill2: 'rgba(175, 175, 180, 0.2)',
} as const;

export const colors = Platform.OS === 'ios' ? ios : fallback;

export const spacing = {
  0: 0,
  0.5: 2,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 16,
  '3xl': 24,
  full: 9999,
} as const;

export const typography = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
} as const;
