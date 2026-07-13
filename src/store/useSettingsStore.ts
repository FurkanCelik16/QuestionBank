// ========================================
// Settings Store - API Key Management & Asked Questions History
// Zustand + AsyncStorage persist
// ========================================

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { topics } from '../data/topics';
import { SYLLABUS_KEYS } from '../data/syllabusKeys';

const API_KEY_STORAGE = '@kpss_gemini_api_key';
const THEME_STORAGE = '@kpss_gemini_theme';
const MODEL_STORAGE = '@kpss_gemini_model';
const ASKED_QUESTIONS_STORAGE = '@kpss_gemini_asked_questions';
const SEEN_QUESTION_TEXTS_STORAGE = '@kpss_gemini_seen_question_texts';

export type ThemeMode = 'light' | 'dark';

interface SettingsState {
  apiKey: string;
  themeMode: ThemeMode;
  geminiModel: string;
  askedQuestions: string[];
  seenQuestionTexts: string[];
  isLoaded: boolean;

  // Actions
  setApiKey: (key: string) => Promise<void>;
  setThemeMode: (theme: ThemeMode) => Promise<void>;
  setGeminiModel: (model: string) => Promise<void>;
  addAskedQuestions: (questions: string[]) => Promise<void>;
  clearAskedQuestions: () => Promise<void>;
  addSeenQuestionTexts: (texts: string[]) => Promise<void>;
  clearSeenQuestionTexts: () => Promise<void>;
  loadSettings: () => Promise<void>;
  clearApiKey: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  apiKey: 'AIzaSyBTyCo8aoRY7yq5ENnCUZh7_9FWWuicAU0',
  themeMode: 'dark', // Default theme
  geminiModel: 'gemini-3.1-flash-lite', // Default model
  askedQuestions: [],
  seenQuestionTexts: [],
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

      // Combine and keep the most recent 300 concepts to avoid duplicate topics
      const combined = [...uniqueNew, ...cleanedExisting].slice(0, 300);

      await AsyncStorage.setItem(ASKED_QUESTIONS_STORAGE, JSON.stringify(combined));
      set({ askedQuestions: combined });
    } catch (error) {
      console.error('Soru geçmişi kaydetme hatası:', error);
    }
  },

  clearAskedQuestions: async () => {
    try {
      await AsyncStorage.removeItem(ASKED_QUESTIONS_STORAGE);
      await AsyncStorage.removeItem(SEEN_QUESTION_TEXTS_STORAGE);
      set({ askedQuestions: [], seenQuestionTexts: [] });
    } catch (error) {
      console.error('Soru geçmişi sıfırlama hatası:', error);
    }
  },

  addSeenQuestionTexts: async (newTexts: string[]) => {
    try {
      const { seenQuestionTexts } = get();
      const cleanedNew = newTexts.map(t => t.trim()).filter(Boolean);
      // Filter out duplicates
      const uniqueNew = cleanedNew.filter(t => {
        const normalized = t.toLowerCase().trim();
        return !seenQuestionTexts.some(ex => ex.toLowerCase().trim() === normalized);
      });
      // Keep up to 150 seen questions
      const combined = [...uniqueNew, ...seenQuestionTexts].slice(0, 150);
      await AsyncStorage.setItem(SEEN_QUESTION_TEXTS_STORAGE, JSON.stringify(combined));
      set({ seenQuestionTexts: combined });
    } catch (error) {
      console.error('Görülen soruları kaydetme hatası:', error);
    }
  },

  clearSeenQuestionTexts: async () => {
    try {
      await AsyncStorage.removeItem(SEEN_QUESTION_TEXTS_STORAGE);
      set({ seenQuestionTexts: [] });
    } catch (error) {
      console.error('Görülen soruları sıfırlama hatası:', error);
    }
  },

  loadSettings: async () => {
    try {
      const [key, theme, model, asked, seen] = await Promise.all([
        AsyncStorage.getItem(API_KEY_STORAGE),
        AsyncStorage.getItem(THEME_STORAGE),
        AsyncStorage.getItem(MODEL_STORAGE),
        AsyncStorage.getItem(ASKED_QUESTIONS_STORAGE),
        AsyncStorage.getItem(SEEN_QUESTION_TEXTS_STORAGE),
      ]);

      let parsedAsked: string[] = [];
      if (asked) {
        try {
          parsedAsked = JSON.parse(asked);
        } catch {
          parsedAsked = [];
        }
      }

      let parsedSeen: string[] = [];
      if (seen) {
        try {
          parsedSeen = JSON.parse(seen);
        } catch {
          parsedSeen = [];
        }
      }

      // Automatically sanitize legacy history on boot to repair any broad/corrupt topics
      const cleanedAsked = cleanSubtopics(Array.isArray(parsedAsked) ? parsedAsked : []);

      set({
        apiKey: key || 'AIzaSyBTyCo8aoRY7yq5ENnCUZh7_9FWWuicAU0',
        themeMode: (theme as ThemeMode) || 'dark',
        geminiModel: model || 'gemini-3.1-flash-lite',
        askedQuestions: cleanedAsked,
        seenQuestionTexts: Array.isArray(parsedSeen) ? parsedSeen : [],
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

export function normalizeTurkish(str: string): string {
  if (!str) return '';
  return str.toLowerCase()
    .normalize('NFD') // Decompose characters
    .replace(/[\u0307]/g, '') // Remove combining dot above (i̇ becomes i)
    .normalize('NFC') // Recompose
    .trim();
}

export function cleanSubtopics(subtopics: string[]): string[] {
  const GENERIC_KEYWORDS = new Set([
    'tarih', 'coğrafya', 'cografya', 'kpss', 'genel', 'ders', 'dersi', 'konu', 'konusu', 'soru', 'sorusu', 'test', 'testi',
    'kültür', 'medeniyet', 'uygarlık', 'kültür ve medeniyet', 'kültür ve uygarlık'
  ]);

  // Build a dynamic set of all main topic names and syllabus keys, along with their cleaned variations
  const forbiddenTopicNames = new Set<string>();

  // Helper to add name and its variations
  const addNameAndVariations = (rawName: string) => {
    const name = normalizeTurkish(rawName);
    if (!name) return;

    forbiddenTopicNames.add(name);

    // 1. Strip page reference e.g., " (s. 2-8)", " (s.10-20)"
    const noPage = name.replace(/\s*\(s\.\s*[\d\-–,\s]+\)\s*$/, '').trim();
    if (noPage) forbiddenTopicNames.add(noPage);

    // 2. Strip dash annotations e.g., " - gerileme", " - duraklama"
    const noDash = noPage.replace(/\s*-\s*\w+\s*$/, '').trim();
    if (noDash) forbiddenTopicNames.add(noDash);

    // 3. Strip roman numerals and century references e.g., "xvii. yüzyılda ", "xx. yüzyıl başlarında "
    const noCentury = noDash
      .replace(/^(?:[i|v|x|l|c|d|m]+\.?\s*(?:yüzyılda|yy\.)?\s*(?:başlarında)?\s*)/gi, '')
      .trim();
    if (noCentury) forbiddenTopicNames.add(noCentury);

    // 4. Strip common prefixes like "osmanlı devleti", "osmanlı", "türkiye'nin", "türkiye'de"
    const prefixes = [
      'osmanlı devleti', 'osmanlı', 
      "türkiye'de", "türkiye’de", 
      "türkiye'nin", "türkiye’nin"
    ];
    for (const prefix of prefixes) {
      if (noCentury.startsWith(prefix)) {
        const stripped = noCentury.substring(prefix.length).trim();
        if (stripped.length > 3) {
          forbiddenTopicNames.add(stripped);
        }
      }
    }
  };

  // Add all static syllabus keys
  SYLLABUS_KEYS.forEach(key => addNameAndVariations(key));

  // Add all selectable app topics
  topics.forEach(t => addNameAndVariations(t.name));

  // Add specific historical period terms to be 100% safe
  const extraPeriods = [
    "Osmanlı Gerileme ve Dağılma Dönemi",
    "Osmanlı Duraklama Dönemi",
    "Osmanlı Kuruluş Dönemi",
    "Osmanlı Yükselme Dönemi",
    "Osmanlı Dönemi",
    "Cumhuriyet Dönemi"
  ];
  extraPeriods.forEach(p => addNameAndVariations(p));

  // Sort forbidden names by length descending so that we replace longer matches first
  const sortedForbidden = Array.from(forbiddenTopicNames).sort((a, b) => b.length - a.length);

  return subtopics
    .map(s => {
      let cleaned = normalizeTurkish(s);
      if (!cleaned) return '';

      for (const forbidden of sortedForbidden) {
        if (forbidden.length <= 5) continue;
        cleaned = cleaned.split(forbidden).join('');
      }

      // Strip leading/trailing punctuation, dashes, colons, spaces
      cleaned = cleaned.replace(/^[\s\-–:;,.()_#+/*]+|[\s\-–:;,.()_#+/*]+$/g, '').trim();
      return cleaned;
    })
    .filter(s => {
      if (!s) return false;
      if (GENERIC_KEYWORDS.has(s)) return false;
      if (s.length > 120) return false;
      if (s.length < 3) return false;
      return true;
    });
}
