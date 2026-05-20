// ========================================
// KPSS AI Quiz App - Color Palette
// Dynamic Light & Dark Mode support
// ========================================

import { useSettingsStore } from '../store/useSettingsStore';

// Common tokens
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 26,
  xxxl: 34,
  display: 42,
} as const;

export interface AppTheme {
  background: string;
  surface: string;
  surfaceLight: string;
  surfaceHighlight: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryGlow: string;
  accent: string;
  accentGlow: string;
  success: string;
  successDark: string;
  successGlow: string;
  error: string;
  errorDark: string;
  errorGlow: string;
  warning: string;
  warningDark: string;
  warningGlow: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  border: string;
  borderLight: string;
  gradientPrimary: readonly string[];
  gradientAccent: readonly string[];
  gradientSuccess: readonly string[];
  gradientError: readonly string[];
  gradientSurface: readonly string[];
  gradientBackground: readonly string[];
  tarih: string;
  tarihGlow: string;
  cografya: string;
  cografyaGlow: string;
  overlay: string;
  overlayLight: string;
}

// Theme Definitions
export const darkTheme: AppTheme = {
  // Backgrounds
  background: '#0F172A',      // Slate 900
  surface: '#1E293B',         // Slate 800
  surfaceLight: '#334155',    // Slate 700
  surfaceHighlight: '#475569',// Slate 600

  // Primary palette (Ocean Blue)
  primary: '#3B82F6',         // Blue 500
  primaryLight: '#60A5FA',    // Blue 400
  primaryDark: '#2563EB',     // Blue 600
  primaryGlow: 'rgba(59, 130, 246, 0.15)',

  // Accent
  accent: '#38BDF8',          // Light Blue 400
  accentGlow: 'rgba(56, 189, 248, 0.15)',

  // Semantic colors
  success: '#10B981',         // Emerald 500
  successDark: '#059669',     // Emerald 600
  successGlow: 'rgba(16, 185, 129, 0.15)',

  error: '#EF4444',           // Red 500
  errorDark: '#DC2626',       // Red 600
  errorGlow: 'rgba(239, 68, 68, 0.15)',

  warning: '#F59E0B',         // Amber 500
  warningDark: '#D97706',     // Amber 600
  warningGlow: 'rgba(245, 158, 11, 0.15)',

  // Text
  textPrimary: '#F8FAFC',     // Slate 50
  textSecondary: '#CBD5E1',   // Slate 300
  textMuted: '#94A3B8',       // Slate 400
  textInverse: '#0F172A',     // Slate 900

  // Borders
  border: '#334155',          // Slate 700
  borderLight: '#475569',     // Slate 600

  // Gradients
  gradientPrimary: ['#3B82F6', '#2563EB'] as const,
  gradientAccent: ['#38BDF8', '#3B82F6'] as const,
  gradientSuccess: ['#34D399', '#10B981'] as const,
  gradientError: ['#F87171', '#EF4444'] as const,
  gradientSurface: ['#334155', '#1E293B'] as const,
  gradientBackground: ['#1E293B', '#0F172A'] as const,

  // Category colors
  tarih: '#F43F5E',           // Rose 500
  tarihGlow: 'rgba(244, 63, 94, 0.15)',
  cografya: '#0EA5E9',        // Sky 500
  cografyaGlow: 'rgba(14, 165, 233, 0.15)',

  // Overlay
  overlay: 'rgba(15, 23, 42, 0.7)',
  overlayLight: 'rgba(15, 23, 42, 0.4)',
};

export const lightTheme: AppTheme = {
  // Backgrounds
  background: '#F8FAFC',      // Slate 50
  surface: '#FFFFFF',         // White
  surfaceLight: '#F1F5F9',    // Slate 100
  surfaceHighlight: '#E2E8F0',// Slate 200

  // Primary palette (Bright Blue)
  primary: '#2563EB',         // Blue 600
  primaryLight: '#3B82F6',    // Blue 500
  primaryDark: '#1D4ED8',     // Blue 700
  primaryGlow: 'rgba(37, 99, 235, 0.15)',

  // Accent
  accent: '#0284C7',          // Light Blue 600
  accentGlow: 'rgba(2, 132, 199, 0.15)',

  // Semantic colors
  success: '#10B981',         // Emerald 500
  successDark: '#059669',     // Emerald 600
  successGlow: 'rgba(16, 185, 129, 0.15)',

  error: '#EF4444',           // Red 500
  errorDark: '#DC2626',       // Red 600
  errorGlow: 'rgba(239, 68, 68, 0.15)',

  warning: '#F59E0B',         // Amber 500
  warningDark: '#D97706',     // Amber 600
  warningGlow: 'rgba(245, 158, 11, 0.15)',

  // Text
  textPrimary: '#0F172A',     // Slate 900
  textSecondary: '#475569',   // Slate 600
  textMuted: '#64748B',       // Slate 500
  textInverse: '#FFFFFF',     // White

  // Borders
  border: '#E2E8F0',          // Slate 200
  borderLight: '#CBD5E1',     // Slate 300

  // Gradients
  gradientPrimary: ['#60A5FA', '#2563EB'] as const,
  gradientAccent: ['#38BDF8', '#0284C7'] as const,
  gradientSuccess: ['#34D399', '#059669'] as const,
  gradientError: ['#F87171', '#DC2626'] as const,
  gradientSurface: ['#F8FAFC', '#F1F5F9'] as const,
  gradientBackground: ['#FFFFFF', '#F8FAFC'] as const,

  // Category colors
  tarih: '#E11D48',           // Rose 600
  tarihGlow: 'rgba(225, 29, 72, 0.15)',
  cografya: '#0284C7',        // Sky 600
  cografyaGlow: 'rgba(2, 132, 199, 0.15)',

  // Overlay
  overlay: 'rgba(255, 255, 255, 0.7)',
  overlayLight: 'rgba(255, 255, 255, 0.4)',
};

// Default export for legacy usages during refactor
export const colors = darkTheme;

export function useTheme() {
  const { themeMode } = useSettingsStore();
  return themeMode === 'light' ? lightTheme : darkTheme;
}
