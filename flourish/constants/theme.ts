/**
 * Flourish Design System
 * Calm, premium, warm — inspired by Uber, Apple Fitness, Calm, Headspace
 */

import { Platform } from 'react-native';

// ─── Color Palette ─────────────────────────────────────────────────────
export const Colors = {
  // Primary — sage green (growth, calm, "flourish")
  sage: '#8AAE92',
  sageLight: '#D4E7D9',
  sageMuted: '#B8CFBE',
  sageDark: '#5C7F63',

  // Backgrounds — off-white, never pure white
  background: '#FAF9F6',
  card: '#FFFFFF',
  cardAlt: '#F5F3EF',

  // Text — muted charcoal
  text: '#2D3436',
  textSecondary: '#636E72',
  textMuted: '#A0A4A8',

  // Accents — warm beige / sand
  beige: '#F0E6D8',
  beigeLight: '#FAF5EF',

  // Gold accent — wins / milestones only
  gold: '#D4A843',
  goldLight: '#FFF3D0',

  // System
  border: '#E8E5E0',
  borderLight: '#F0EDE8',
  danger: '#E17055',
  dangerLight: '#FFEAEA',
  success: '#8AAE92',
  successLight: '#D4E7D9',

  // Tab bar
  tabBar: '#FFFFFF',
  tabIconDefault: '#A0A4A8',
  tabIconSelected: '#5C7F63',

  // Legacy compat — keeps existing ThemedText / ThemedView working
  light: {
    text: '#2D3436',
    background: '#FAF9F6',
    tint: '#5C7F63',
    icon: '#636E72',
    tabIconDefault: '#A0A4A8',
    tabIconSelected: '#5C7F63',
  },
  dark: {
    text: '#ECEDEE',
    background: '#1A1D1E',
    tint: '#8AAE92',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#8AAE92',
  },
};

// ─── Spacing ───────────────────────────────────────────────────────────
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// ─── Border Radius ─────────────────────────────────────────────────────
export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

// ─── Shadows ───────────────────────────────────────────────────────────
export const Shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
};

// ─── Fonts ─────────────────────────────────────────────────────────────
export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
});

// ─── Typography ────────────────────────────────────────────────────────
export const Typography = {
  largeTitle: {
    fontSize: 34,
    fontWeight: '700' as const,
    lineHeight: 41,
    letterSpacing: 0.37,
  },
  title1: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
    letterSpacing: 0.36,
  },
  title2: {
    fontSize: 22,
    fontWeight: '600' as const,
    lineHeight: 28,
    letterSpacing: 0.35,
  },
  title3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 25,
    letterSpacing: 0.38,
  },
  headline: {
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 22,
    letterSpacing: -0.41,
  },
  body: {
    fontSize: 17,
    fontWeight: '400' as const,
    lineHeight: 22,
    letterSpacing: -0.41,
  },
  callout: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 21,
    letterSpacing: -0.32,
  },
  subhead: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 20,
    letterSpacing: -0.24,
  },
  footnote: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
    letterSpacing: -0.08,
  },
  caption1: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  caption2: {
    fontSize: 11,
    fontWeight: '400' as const,
    lineHeight: 13,
    letterSpacing: 0.07,
  },
};
