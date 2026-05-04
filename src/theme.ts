import { Platform, PlatformColor } from 'react-native';

/*
 * iOS uses PlatformColor() for automatic dark-mode support.
 * Android / web fall back to the light-mode palette to match
 * the previous global.css behaviour.
 */
const ios = {
  accent: PlatformColor('systemBlue'),
  bg: PlatformColor('systemBackground'),
  bg2: PlatformColor('secondarySystemBackground'),
  bg3: PlatformColor('tertiarySystemBackground'),
  border: PlatformColor('separator'),
  error: PlatformColor('systemRed'),
  fill: PlatformColor('systemFill'),
  fill2: PlatformColor('secondarySystemFill'),
  separator: PlatformColor('separator'),
  success: PlatformColor('systemGreen'),
  text: PlatformColor('label'),
  text2: PlatformColor('secondaryLabel'),
  text3: PlatformColor('tertiaryLabel'),
  warning: PlatformColor('systemOrange'),
} as const;

const fallback = {
  accent: 'rgb(0, 122, 255)',
  bg: '#ffffff',
  bg2: '#f2f2f7',
  bg3: '#ffffff',
  border: 'rgba(60, 60, 67, 0.29)',
  error: 'rgb(255, 59, 48)',
  fill: 'rgba(120, 120, 128, 0.2)',
  fill2: 'rgba(175, 175, 180, 0.2)',
  separator: 'rgba(60, 60, 67, 0.29)',
  success: 'rgb(52, 199, 89)',
  text: '#000000',
  text2: 'rgba(60, 60, 67, 0.6)',
  text3: 'rgba(60, 60, 67, 0.3)',
  warning: 'rgb(255, 149, 0)',
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
  '2xl': 16,
  '3xl': 24,
  full: 9999,
  lg: 12,
  md: 8,
  sm: 4,
  xl: 16,
} as const;

export const typography = {
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  base: 16,
  lg: 18,
  sm: 14,
  xl: 20,
  xs: 12,
} as const;
