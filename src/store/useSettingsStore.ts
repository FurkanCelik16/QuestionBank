// ========================================
// Settings Store - API Key Management
// Zustand + AsyncStorage persist
// ========================================

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_KEY_STORAGE = '@kpss_gemini_api_key';
const THEME_STORAGE = '@kpss_gemini_theme';

export type ThemeMode = 'light' | 'dark';

interface SettingsState {
  apiKey: string;
  themeMode: ThemeMode;
  isLoaded: boolean;

  // Actions
  setApiKey: (key: string) => Promise<void>;
  setThemeMode: (theme: ThemeMode) => Promise<void>;
  loadSettings: () => Promise<void>;
  clearApiKey: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  apiKey: '',
  themeMode: 'dark', // Default theme
  isLoaded: false,

  setApiKey: async (key: string) => {
    try {
      await AsyncStorage.setItem(API_KEY_STORAGE, key);
      set({ apiKey: key });
    } catch (error) {
      console.error('API key kaydetme hatası:', error);
    }
  },

  setThemeMode: async (theme: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE, theme);
      set({ themeMode: theme });
    } catch (error) {
      console.error('Theme kaydetme hatası:', error);
    }
  },

  loadSettings: async () => {
    try {
      const [key, theme] = await Promise.all([
        AsyncStorage.getItem(API_KEY_STORAGE),
        AsyncStorage.getItem(THEME_STORAGE),
      ]);
      set({ 
        apiKey: key || '', 
        themeMode: (theme as ThemeMode) || 'dark',
        isLoaded: true 
      });
    } catch (error) {
      console.error('Ayarları yükleme hatası:', error);
      set({ isLoaded: true });
    }
  },

  clearApiKey: async () => {
    try {
      await AsyncStorage.removeItem(API_KEY_STORAGE);
      set({ apiKey: '' });
    } catch (error) {
      console.error('API key silme hatası:', error);
    }
  },
}));
