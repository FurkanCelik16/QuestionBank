// ========================================
// KPSS AI Quiz App - Premium Design System
// Warm Cream Minimalist (Claude Style) with High Contrast Monochrome
// ========================================

import { useSettingsStore } from '../store/useSettingsStore';
import { Platform } from 'react-native';

// Spacing scale
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
} as const;

// Border radius scale
export const borderRadius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  xxxl: 32,
  full: 999,
} as const;

// Typography scale
export const fontSize = {
  xxs: 10,
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 26,
  xxxl: 34,
  display: 42,
  hero: 48,
} as const;

// Platform-aware shadow utility (extremely subtle for Claude style)
export function shadow(elevation: number, color: string = '#000') {
  if (Platform.OS === 'web') {
    const blur = elevation * 1.5;
    const spread = elevation * 0.2;
    const opacity = Math.min(0.04 + elevation * 0.01, 0.15);
    return {
      boxShadow: `0px ${elevation * 0.5}px ${blur}px ${spread}px rgba(25,25,25,${opacity})`,
    } as any;
  }
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: Math.max(1, elevation * 0.3) },
    shadowOpacity: Math.min(0.04 + elevation * 0.02, 0.18),
    shadowRadius: elevation * 0.8,
    elevation: Math.max(1, Math.round(elevation * 0.6)),
  };
}

export interface AppTheme {
  // Backgrounds
  background: string;
  backgroundAlt: string;
  surface: string;
  surfaceLight: string;
  surfaceHighlight: string;
  surfaceElevated: string;

  // Primary palette (Claude solid contrast)
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryGlow: string;
  primarySoft: string;

  // Accent
  accent: string;
  accentGlow: string;

  // Semantic
  success: string;
  successDark: string;
  successGlow: string;
  error: string;
  errorDark: string;
  errorGlow: string;
  warning: string;
  warningDark: string;
  warningGlow: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  textOnPrimary: string;

  // Borders
  border: string;
  borderLight: string;
  borderSubtle: string;

  // Gradients
  gradientPrimary: readonly [string, string, ...string[]];
  gradientAccent: readonly [string, string, ...string[]];
  gradientSuccess: readonly [string, string, ...string[]];
  gradientError: readonly [string, string, ...string[]];
  gradientSurface: readonly [string, string, ...string[]];
  gradientBackground: readonly [string, string, ...string[]];
  gradientGold: readonly [string, string, ...string[]];
  gradientHero: readonly [string, string, ...string[]];

  // Category
  tarih: string;
  tarihGlow: string;
  tarihSoft: string;
  cografya: string;
  cografyaGlow: string;
  cografyaSoft: string;

  // Overlay & effects
  overlay: string;
  overlayLight: string;
  shimmer: string;
  glassBackground: string;
  glassBorder: string;
}

// ─── Dark Theme (Warm Charcoal & High Contrast Silver) ──────────────────────────
export const darkTheme: AppTheme = {
  background: '#0D0D0C',
  backgroundAlt: '#141413',
  surface: '#1A1A19',
  surfaceLight: '#262624',
  surfaceHighlight: '#333330',
  surfaceElevated: '#1A1A19', // Match surface to prevent card layering mess

  primary: '#FFFFFF', // Clean pure white primary button zıtlığı
  primaryLight: '#FFFFFF',
  primaryDark: '#E2E8F0',
  primaryGlow: 'rgba(255, 255, 255, 0.12)',
  primarySoft: 'rgba(255, 255, 255, 0.06)',

  accent: '#E2E8F0',
  accentGlow: 'rgba(226, 232, 240, 0.12)',

  success: '#34D399',
  successDark: '#10B981',
  successGlow: 'rgba(52, 211, 153, 0.12)',

  error: '#FB7185',
  errorDark: '#F43F5E',
  errorGlow: 'rgba(251, 113, 133, 0.12)',

  warning: '#FBBF24',
  warningDark: '#F59E0B',
  warningGlow: 'rgba(251, 191, 36, 0.12)',

  textPrimary: '#FFFFFF',      // Crisp, pure white text (solved pale issue)
  textSecondary: '#E2E8F0',    // High-legibility bright silver (solved grey issue)
  textMuted: '#94A3B8',        // Clean readable slate-grey
  textInverse: '#0D0D0C',
  textOnPrimary: '#0D0D0C',

  border: 'rgba(255, 255, 255, 0.10)', // Upgraded border contrast
  borderLight: 'rgba(255, 255, 255, 0.18)',
  borderSubtle: 'rgba(255, 255, 255, 0.06)',

  gradientPrimary: ['#FFFFFF', '#E2E8F0'] as const,
  gradientAccent: ['#FFFFFF', '#E2E8F0'] as const,
  gradientSuccess: ['#34D399', '#10B981'] as const,
  gradientError: ['#FB7185', '#F43F5E'] as const,
  gradientSurface: ['#1A1A19', '#141413'] as const,
  gradientBackground: ['#141413', '#0D0D0C'] as const,
  gradientGold: ['#FBBF24', '#F59E0B'] as const,
  gradientHero: ['#262625', '#1A1A19', '#121211'] as const, // Subtle metallic charcoal (solved AI gradient issue)

  tarih: '#FAF9F6',
  tarihGlow: 'rgba(250, 249, 246, 0.08)',
  tarihSoft: 'rgba(250, 249, 246, 0.04)',
  cografya: '#FAF9F6',
  cografyaGlow: 'rgba(250, 249, 246, 0.08)',
  cografyaSoft: 'rgba(250, 249, 246, 0.04)',

  overlay: 'rgba(13, 13, 12, 0.85)',
  overlayLight: 'rgba(13, 13, 12, 0.5)',
  shimmer: 'rgba(255, 255, 255, 0.01)',
  glassBackground: 'rgba(30, 30, 29, 0.55)',
  glassBorder: 'rgba(255, 255, 255, 0.12)',
};

// ─── Light Theme (Warm Cream Minimalist) ─────────────────────────
export const lightTheme: AppTheme = {
  background: '#FAF9F6',
  backgroundAlt: '#F3F2EE',
  surface: '#FFFFFF',
  surfaceLight: '#F3F2EE',
  surfaceHighlight: '#EFEFEA',
  surfaceElevated: '#FFFFFF',

  primary: '#191919',
  primaryLight: '#333333',
  primaryDark: '#000000',
  primaryGlow: 'rgba(25, 25, 25, 0.08)',
  primarySoft: 'rgba(25, 25, 25, 0.04)',

  accent: '#595954',
  accentGlow: 'rgba(89, 89, 84, 0.08)',

  success: '#0F966B',
  successDark: '#0B7F5A',
  successGlow: 'rgba(15, 150, 107, 0.08)',

  error: '#DE3C52',
  errorDark: '#C12C40',
  errorGlow: 'rgba(222, 60, 82, 0.08)',

  warning: '#D68900',
  warningDark: '#B87200',
  warningGlow: 'rgba(214, 137, 0, 0.08)',

  textPrimary: '#0F0F0E',
  textSecondary: '#4A4A45',
  textMuted: '#7E7E76',
  textInverse: '#FAF9F6',
  textOnPrimary: '#FAF9F6',

  border: 'rgba(25, 25, 25, 0.08)',
  borderLight: 'rgba(25, 25, 25, 0.14)',
  borderSubtle: 'rgba(25, 25, 25, 0.04)',

  gradientPrimary: ['#333333', '#191919'] as const,
  gradientAccent: ['#595954', '#333333'] as const,
  gradientSuccess: ['#0F966B', '#0B7F5A'] as const,
  gradientError: ['#DE3C52', '#C12C40'] as const,
  gradientSurface: ['#FFFFFF', '#FAF9F6'] as const,
  gradientBackground: ['#FAF9F6', '#F3F2EE'] as const,
  gradientGold: ['#E69C24', '#D68900'] as const,
  gradientHero: ['#F5F4F0', '#EAE9E4', '#FAF9F6'] as const, // Subtle warm metallic beige

  tarih: '#191919',
  tarihGlow: 'rgba(25, 25, 25, 0.04)',
  tarihSoft: 'rgba(25, 25, 25, 0.02)',
  cografya: '#191919',
  cografyaGlow: 'rgba(25, 25, 25, 0.04)',
  cografyaSoft: 'rgba(25, 25, 25, 0.02)',

  overlay: 'rgba(250, 249, 246, 0.85)',
  overlayLight: 'rgba(250, 249, 246, 0.5)',
  shimmer: 'rgba(0, 0, 0, 0.01)',
  glassBackground: 'rgba(255, 255, 255, 0.55)',
  glassBorder: 'rgba(25, 25, 25, 0.08)',
};

// Default export for legacy
export const colors = darkTheme;

export function useTheme() {
  const { themeMode } = useSettingsStore();
  return themeMode === 'light' ? lightTheme : darkTheme;
}
