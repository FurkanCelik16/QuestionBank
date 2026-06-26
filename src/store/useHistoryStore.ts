// ========================================
// History Store
// Saves and retrieves past test results
// ========================================

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TestHistoryItem } from '../types';

const HISTORY_STORAGE_KEY = '@kpss_gemini_history';
const SOLVED_WRONGS_KEY = '@kpss_gemini_solved_wrongs';
const MAX_HISTORY_SIZE = 50; // Prevent unbounded AsyncStorage growth

interface HistoryState {
  history: TestHistoryItem[];
  solvedWrongIds: number[];
  isLoaded: boolean;

  // Actions
  addTestResult: (item: TestHistoryItem) => Promise<void>;
  clearHistory: () => Promise<void>;
  loadHistory: () => Promise<void>;
  markWrongAsSolved: (questionId: number) => Promise<void>;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  history: [],
  solvedWrongIds: [],
  isLoaded: false,

  addTestResult: async (item: TestHistoryItem) => {
    try {
      const currentHistory = get().history;
      // Limit history to MAX_HISTORY_SIZE to prevent AsyncStorage overflow
      const updatedHistory = [item, ...currentHistory].slice(0, MAX_HISTORY_SIZE);

      // Prune solvedWrongIds: remove IDs that no longer exist in any remaining history entry
      const allWrongIds = new Set<number>();
      updatedHistory.forEach(h => {
        h.result.wrongAnswers.forEach(wa => allWrongIds.add(wa.question.id));
      });
      const currentSolved = get().solvedWrongIds;
      const prunedSolved = currentSolved.filter(id => allWrongIds.has(id));

      await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
      if (prunedSolved.length !== currentSolved.length) {
        await AsyncStorage.setItem(SOLVED_WRONGS_KEY, JSON.stringify(prunedSolved));
      }
      set({ history: updatedHistory, solvedWrongIds: prunedSolved });
    } catch (error) {
      console.error('Test geçmişi kaydetme hatası:', error);
    }
  },

  clearHistory: async () => {
    try {
      await AsyncStorage.removeItem(HISTORY_STORAGE_KEY);
      await AsyncStorage.removeItem(SOLVED_WRONGS_KEY);
      set({ history: [], solvedWrongIds: [] });
    } catch (error) {
      console.error('Test geçmişi silme hatası:', error);
    }
  },

  loadHistory: async () => {
    try {
      const stored = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
      const solvedStored = await AsyncStorage.getItem(SOLVED_WRONGS_KEY);
      const solvedWrongIds = solvedStored ? JSON.parse(solvedStored) : [];
      if (stored) {
        const history = JSON.parse(stored);
        set({ history, solvedWrongIds, isLoaded: true });
      } else {
        set({ history: [], solvedWrongIds, isLoaded: true });
      }
    } catch (error) {
      console.error('Test geçmişi yükleme hatası:', error);
      set({ isLoaded: true });
    }
  },

  markWrongAsSolved: async (questionId: number) => {
    try {
      const currentSolved = get().solvedWrongIds;
      if (!currentSolved.includes(questionId)) {
        const updated = [...currentSolved, questionId];
        await AsyncStorage.setItem(SOLVED_WRONGS_KEY, JSON.stringify(updated));
        set({ solvedWrongIds: updated });
      }
    } catch (error) {
      console.error('Yanlış soruyu çözüldü olarak işaretleme hatası:', error);
    }
  },
}));
