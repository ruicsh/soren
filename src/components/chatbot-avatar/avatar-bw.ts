/**
 * Configuration object for @zamplyy/react-native-nice-avatar.
 * Maps exact property names used by the library.
 */
export interface NiceAvatarConfig {
  [key: string]: any;
  bgColor?: string;
  earSize?: 'big' | 'small';
  eyeStyle?: 'circle' | 'smile';
  faceColor?: string;
  hairColor?: string;
  hairColorRandom?: boolean;
  hairStyle?: string;
  hatColor?: string;
  hatStyle?: string;
  isGradient?: boolean;
  mouthStyle?: string;
  noseStyle?: string;
  shirtColor?: string;
  shirtStyle?: string;
}

/**
 * Shared black-and-white color palette for avatars.
 * Ensures consistent grayscale rendering.
 */
export const BW_AVATAR_COLORS = {
  bgColor: '#FFFFFF',
  faceColor: '#FFFFFF',
  hairColor: '#1A1A1A',
  hatColor: '#333333',
  shirtColor: '#D9D9D9',
} as const;

/**
 * Forces a NiceAvatarConfig into black and white mode.
 * Disables gradients and random colors to maintain consistency.
 */
export function applyAvatarBW(config: NiceAvatarConfig): NiceAvatarConfig {
  return {
    ...config,
    ...BW_AVATAR_COLORS,
    hairColorRandom: false,
    isGradient: false,
  };
}
