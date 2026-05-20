// ========================================
// Settings Store - API Key Management & Asked Questions History
// Zustand + AsyncStorage persist
// ========================================

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_KEY_STORAGE = '@kpss_gemini_api_key';
const THEME_STORAGE = '@kpss_gemini_theme';
const MODEL_STORAGE = '@kpss_gemini_model';
const ASKED_QUESTIONS_STORAGE = '@kpss_gemini_asked_questions';

export type ThemeMode = 'light' | 'dark';

interface SettingsState {
  apiKey: string;
  themeMode: ThemeMode;
  geminiModel: string;
  askedQuestions: string[];
  isLoaded: boolean;

  // Actions
  setApiKey: (key: string) => Promise<void>;
  setThemeMode: (theme: ThemeMode) => Promise<void>;
  setGeminiModel: (model: string) => Promise<void>;
  addAskedQuestions: (questions: string[]) => Promise<void>;
  clearAskedQuestions: () => Promise<void>;
  loadSettings: () => Promise<void>;
  clearApiKey: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  apiKey: '',
  themeMode: 'dark', // Default theme
  geminiModel: 'gemini-2.5-flash', // Default model
  askedQuestions: [],
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

  setGeminiModel: async (model: string) => {
    try {
      await AsyncStorage.setItem(MODEL_STORAGE, model);
      set({ geminiModel: model });
    } catch (error) {
      console.error('Model kaydetme hatası:', error);
    }
  },

  addAskedQuestions: async (newQuestions: string[]) => {
    try {
      const { askedQuestions } = get();
      // Clean and sanitize incoming and existing list
      const cleanedNew = cleanSubtopics(newQuestions);
      const cleanedExisting = cleanSubtopics(askedQuestions);

      // Filter out duplicate entries case-insensitively
      const uniqueNew = cleanedNew.filter(q => {
        if (!q) return false;
        const normalized = q.toLowerCase().trim();
        return !cleanedExisting.some(ex => ex.toLowerCase().trim() === normalized);
      });
      
      // Combine and keep the most recent 100 concepts to avoid huge payload sizes
      const combined = [...uniqueNew, ...cleanedExisting].slice(0, 100);
      
      await AsyncStorage.setItem(ASKED_QUESTIONS_STORAGE, JSON.stringify(combined));
      set({ askedQuestions: combined });
    } catch (error) {
      console.error('Soru geçmişi kaydetme hatası:', error);
    }
  },

  clearAskedQuestions: async () => {
    try {
      await AsyncStorage.removeItem(ASKED_QUESTIONS_STORAGE);
      set({ askedQuestions: [] });
    } catch (error) {
      console.error('Soru geçmişi sıfırlama hatası:', error);
    }
  },

  loadSettings: async () => {
    try {
      const [key, theme, model, asked] = await Promise.all([
        AsyncStorage.getItem(API_KEY_STORAGE),
        AsyncStorage.getItem(THEME_STORAGE),
        AsyncStorage.getItem(MODEL_STORAGE),
        AsyncStorage.getItem(ASKED_QUESTIONS_STORAGE),
      ]);
      
      let parsedAsked: string[] = [];
      if (asked) {
        try {
          parsedAsked = JSON.parse(asked);
        } catch {
          parsedAsked = [];
        }
      }

      // Automatically sanitize legacy history on boot to repair any broad/corrupt topics
      const cleanedAsked = cleanSubtopics(Array.isArray(parsedAsked) ? parsedAsked : []);
      
      set({ 
        apiKey: key || '', 
        themeMode: (theme as ThemeMode) || 'dark',
        geminiModel: model || 'gemini-2.5-flash',
        askedQuestions: cleanedAsked,
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

export function cleanSubtopics(subtopics: string[]): string[] {
  const MAIN_TOPIC_NAMES = new Set([
    "İslamiyet Öncesi Türk Tarihi",
    "İlk Türk İslam Devletleri",
    "Osmanlı Kuruluş Dönemi",
    "Osmanlı Yükselme Dönemi",
    "Osmanlı Duraklama Dönemi",
    "Osmanlı Gerileme ve Dağılma Dönemi",
    "I. Dünya Savaşı ve Mondros Mütarekesi",
    "Kurtuluş Savaşı Hazırlık Dönemi",
    "Kurtuluş Savaşı Muharebeler Dönemi",
    "Atatürk İlke ve İnkılapları",
    "Çağdaş Türk ve Dünya Tarihi",
    "Harita Bilgisi",
    "Türkiye'nin Fiziki Coğrafyası (Yer Şekilleri)",
    "Türkiye'nin İklimi",
    "Türkiye'nin Bitki Örtüsü ve Toprak Yapısı",
    "Türkiye'nin Su Kaynakları (Akarsular, Göller)",
    "Türkiye'de Nüfus ve Yerleşme",
    "Türkiye'nin Ekonomik Coğrafyası (Tarım)",
    "Türkiye'nin Ekonomik Coğrafyası (Sanayi ve Enerji)",
    "Türkiye'nin Ekonomik Coğrafyası (Ulaşım ve Ticaret)",
    "Dünya Coğrafyası",
    "tarih",
    "coğrafya",
    "genel",
    "kpss",
    "kpss tarih",
    "kpss coğrafya",
    "kpss coğrafyası",
    "kpss dersi"
  ]);

  return subtopics
    .map(s => s.trim())
    .filter(s => {
      if (!s) return false;
      const lower = s.toLowerCase();
      // Filter out if it matches a main topic name or generic term
      if (MAIN_TOPIC_NAMES.has(s)) return false;
      if (MAIN_TOPIC_NAMES.has(lower)) return false;
      if (lower === 'tarih' || lower === 'coğrafya' || lower === 'genel' || lower === 'kpss') return false;
      // Also filter out very long strings (e.g. model returned a whole sentence by mistake)
      if (s.length > 50) return false;
      return true;
    });
}
