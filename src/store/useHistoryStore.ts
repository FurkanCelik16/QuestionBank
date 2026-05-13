// ========================================
// History Store
// Saves and retrieves past test results
// ========================================

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TestHistoryItem } from '../types';

const HISTORY_STORAGE_KEY = '@kpss_gemini_history';

interface HistoryState {
  history: TestHistoryItem[];
  isLoaded: boolean;

  // Actions
  addTestResult: (item: TestHistoryItem) => Promise<void>;
  clearHistory: () => Promise<void>;
  loadHistory: () => Promise<void>;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  history: [],
  isLoaded: false,

  addTestResult: async (item: TestHistoryItem) => {
    try {
      const currentHistory = get().history;
      const updatedHistory = [item, ...currentHistory]; // Newest first
      await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
      set({ history: updatedHistory });
    } catch (error) {
      console.error('Test geçmişi kaydetme hatası:', error);
    }
  },

  clearHistory: async () => {
    try {
      await AsyncStorage.removeItem(HISTORY_STORAGE_KEY);
      set({ history: [] });
    } catch (error) {
      console.error('Test geçmişi silme hatası:', error);
    }
  },

  loadHistory: async () => {
    try {
      const stored = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
      if (stored) {
        const history = JSON.parse(stored);
        set({ history, isLoaded: true });
      } else {
        set({ history: [], isLoaded: true });
      }
    } catch (error) {
      console.error('Test geçmişi yükleme hatası:', error);
      set({ isLoaded: true });
    }
  },
}));
