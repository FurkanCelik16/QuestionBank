// ========================================
// Quiz Store - Quiz State Management
// ========================================

import { create } from 'zustand';
import { QuizQuestion, QuizResult, DifficultyLevel } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface PersistedPdf {
  uri: string;
  base64: string;
  name: string;
  geminiFileUri: string;
}

interface QuizState {
  // Config
  selectedTopics: string[];
  questionCount: number;
  difficulty: DifficultyLevel;

  // Quiz data
  questions: QuizQuestion[];
  currentIndex: number;
  userAnswers: Record<number, string>;

  // Loading state
  isGenerating: boolean;
  error: string | null;

  // PDF Context
  pdfUri: string | null;
  pdfBase64: string | null;
  pdfName: string | null;
  geminiFileUri: string | null;
  pdfPageRange: string | null;

  // 3-Slot PDF Library
  pdfSlots: Record<string, PersistedPdf | null>;
  selectedSlotId: string | null;

  // Actions
  setSelectedTopics: (topics: string[]) => void;
  setQuestionCount: (count: number) => void;
  setDifficulty: (difficulty: DifficultyLevel) => void;
  setQuestions: (questions: QuizQuestion[]) => void;
  selectAnswer: (questionId: number, answer: string) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  goToQuestion: (index: number) => void;
  setGenerating: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPdfContext: (uri: string | null, base64: string | null, name: string | null, geminiUri?: string | null) => Promise<void>;
  clearPdfContext: () => Promise<void>;
  setPdfPageRange: (range: string | null) => Promise<void>;
  loadPdfContext: () => Promise<void>;
  selectPdfSlot: (slotId: string | null) => void;
  uploadToPdfSlot: (slotId: string, uri: string, base64: string, name: string, geminiUri: string) => Promise<void>;
  clearPdfSlot: (slotId: string) => Promise<void>;
  resetQuiz: () => void;
  resetQuizKeepTopics: () => void;
  saveActiveSession: () => Promise<void>;
  clearActiveSession: () => Promise<void>;
  loadActiveSession: () => Promise<boolean>;

  // Computed
  getResults: () => QuizResult;
  isLastQuestion: () => boolean;
  isFirstQuestion: () => boolean;
  getCurrentQuestion: () => QuizQuestion | null;
  getAnsweredCount: () => number;
}

export const useQuizStore = create<QuizState>((set, get) => ({
  selectedTopics: [],
  questionCount: 10,
  difficulty: 'medium',
  questions: [],
  currentIndex: 0,
  userAnswers: {},
  isGenerating: false,
  error: null,
  pdfUri: null,
  pdfBase64: null,
  pdfName: null,
  geminiFileUri: null,
  pdfPageRange: null,
  pdfSlots: { slot_1: null, slot_2: null, slot_3: null, slot_4: null },
  selectedSlotId: null,

  setSelectedTopics: (topics) => set({ selectedTopics: topics }),
  
  setQuestionCount: (count) => set({ questionCount: count }),

  setDifficulty: (difficulty) => set({ difficulty }),

  setQuestions: (questions) => {
    set({
      questions,
      currentIndex: 0,
      userAnswers: {},
      error: null,
    });
    get().saveActiveSession();
  },

  selectAnswer: (questionId, answer) => {
    set((state) => {
      const newAnswers = { ...state.userAnswers };
      if (!answer) {
        delete newAnswers[questionId];
      } else {
        newAnswers[questionId] = answer;
      }
      return { userAnswers: newAnswers };
    });
    get().saveActiveSession();
  },

  nextQuestion: () => {
    const { currentIndex, questions } = get();
    if (currentIndex < questions.length - 1) {
      set({ currentIndex: currentIndex + 1 });
      get().saveActiveSession();
    }
  },

  previousQuestion: () => {
    const { currentIndex } = get();
    if (currentIndex > 0) {
      set({ currentIndex: currentIndex - 1 });
      get().saveActiveSession();
    }
  },

  goToQuestion: (index) => {
    const { questions } = get();
    if (index >= 0 && index < questions.length) {
      set({ currentIndex: index });
      get().saveActiveSession();
    }
  },

  setGenerating: (isGenerating) => set({ isGenerating }),

  setError: (error) => set({ error }),

  setPdfContext: async (uri, base64, name, geminiUri) => {
    set({ 
      pdfUri: uri, 
      pdfBase64: base64, 
      pdfName: name, 
      geminiFileUri: geminiUri || null 
    });
    try {
      if (uri) await AsyncStorage.setItem('@kpss_pdf_uri', uri);
      else await AsyncStorage.removeItem('@kpss_pdf_uri');

      if (base64) await AsyncStorage.setItem('@kpss_pdf_base_64', base64);
      else await AsyncStorage.removeItem('@kpss_pdf_base_64');

      if (name) await AsyncStorage.setItem('@kpss_pdf_name', name);
      else await AsyncStorage.removeItem('@kpss_pdf_name');

      if (geminiUri) await AsyncStorage.setItem('@kpss_gemini_file_uri', geminiUri);
      else await AsyncStorage.removeItem('@kpss_gemini_file_uri');
    } catch (e) {
      console.warn('Persist PDF error:', e);
    }
  },

  clearPdfContext: async () => {
    set({ pdfUri: null, pdfBase64: null, pdfName: null, geminiFileUri: null, pdfPageRange: null });
    try {
      await AsyncStorage.removeItem('@kpss_pdf_uri');
      await AsyncStorage.removeItem('@kpss_pdf_base_64');
      await AsyncStorage.removeItem('@kpss_pdf_name');
      await AsyncStorage.removeItem('@kpss_gemini_file_uri');
      await AsyncStorage.removeItem('@kpss_pdf_page_range');
    } catch (e) {
      console.warn('Clear PDF persist error:', e);
    }
  },

  setPdfPageRange: async (range) => {
    set({ pdfPageRange: range });
    try {
      if (range) await AsyncStorage.setItem('@kpss_pdf_page_range', range);
      else await AsyncStorage.removeItem('@kpss_pdf_page_range');
    } catch (e) {
      console.warn('Persist PDF range error:', e);
    }
  },

  loadPdfContext: async () => {
    try {
      const [slotsJson, selectedId, range] = await Promise.all([
        AsyncStorage.getItem('@kpss_pdf_slots'),
        AsyncStorage.getItem('@kpss_selected_slot_id'),
        AsyncStorage.getItem('@kpss_pdf_page_range'),
      ]);

      const parsedSlots = slotsJson ? JSON.parse(slotsJson) : {};
      const pdfSlots = {
        slot_1: null,
        slot_2: null,
        slot_3: null,
        slot_4: null,
        ...parsedSlots
      };
      
      const selectedSlotId = selectedId || null;
      let activePdf: PersistedPdf | null = null;
      if (selectedSlotId && pdfSlots[selectedSlotId]) {
        activePdf = pdfSlots[selectedSlotId];
      }

      let base64 = activePdf ? activePdf.base64 : null;
      // If we don't have base64 in stored slots but have a local file uri, load it dynamically!
      if (activePdf && !base64 && activePdf.uri) {
        try {
          const FileSystem = require('expo-file-system');
          base64 = await FileSystem.readAsStringAsync(activePdf.uri, {
            encoding: 'base64',
          });
          const slot = pdfSlots[selectedSlotId!];
          if (slot && base64) {
            slot.base64 = base64;
          }
        } catch (err) {
          console.warn('Startup local PDF read error:', err);
        }
      }

      set({
        pdfSlots,
        selectedSlotId,
        pdfPageRange: range,
        pdfUri: activePdf ? activePdf.uri : null,
        pdfBase64: base64,
        pdfName: activePdf ? activePdf.name : null,
        geminiFileUri: activePdf ? activePdf.geminiFileUri : null,
      });
    } catch (e) {
      console.warn('Persisted PDF load error:', e);
    }
  },

  selectPdfSlot: async (slotId) => {
    const { pdfSlots } = get();
    const activePdf = slotId ? pdfSlots[slotId] : null;

    let base64 = activePdf ? activePdf.base64 : null;
    if (activePdf && !base64 && activePdf.uri) {
      try {
        const FileSystem = require('expo-file-system');
        base64 = await FileSystem.readAsStringAsync(activePdf.uri, {
          encoding: 'base64',
        });
        // Cache it in-memory
        const slot = pdfSlots[slotId!];
        if (slot && base64) {
          slot.base64 = base64;
        }
      } catch (err) {
        console.warn('Local PDF read on selection error:', err);
      }
    }

    set({
      selectedSlotId: slotId,
      pdfUri: activePdf ? activePdf.uri : null,
      pdfBase64: base64,
      pdfName: activePdf ? activePdf.name : null,
      geminiFileUri: activePdf ? activePdf.geminiFileUri : null,
    });

    try {
      if (slotId) {
        await AsyncStorage.setItem('@kpss_selected_slot_id', slotId);
      } else {
        await AsyncStorage.removeItem('@kpss_selected_slot_id');
      }
    } catch (e) {
      console.warn('Persist selected slot error:', e);
    }
  },

  uploadToPdfSlot: async (slotId, uri, base64, name, geminiUri) => {
    const { pdfSlots, selectedSlotId } = get();

    // Copy to permanent directory in React Native to avoid system cache cleanup
    let finalUri = uri;
    if (Platform.OS !== 'web') {
      try {
        const FileSystem = require('expo-file-system');
        const permanentUri = FileSystem.documentDirectory + `slot_${slotId}_` + name.replace(/\s+/g, '_');
        await FileSystem.copyAsync({ from: uri, to: permanentUri });
        finalUri = permanentUri;
        console.log('[Permanent Storage] Copied PDF successfully to:', permanentUri);
      } catch (err) {
        console.warn('[Permanent Storage] Failed to copy PDF:', err);
      }
    }

    const updatedSlots = {
      ...pdfSlots,
      [slotId]: { uri: finalUri, base64, name, geminiFileUri: geminiUri }
    };

    const shouldSelect = !selectedSlotId;
    const newSelectedSlotId = shouldSelect ? slotId : selectedSlotId;

    set({
      pdfSlots: updatedSlots,
      selectedSlotId: newSelectedSlotId,
    });

    if (shouldSelect) {
      set({
        pdfUri: finalUri,
        pdfBase64: base64,
        pdfName: name,
        geminiFileUri: geminiUri,
      });
    }

    try {
      // Strip base64 data to keep AsyncStorage size extremely lightweight!
      const slotsForStorage = JSON.parse(JSON.stringify(updatedSlots));
      Object.keys(slotsForStorage).forEach(key => {
        if (slotsForStorage[key]) {
          slotsForStorage[key].base64 = '';
        }
      });

      await AsyncStorage.setItem('@kpss_pdf_slots', JSON.stringify(slotsForStorage));
      if (shouldSelect) {
        await AsyncStorage.setItem('@kpss_selected_slot_id', slotId);
      }
    } catch (e) {
      console.warn('Persist upload slots error:', e);
    }
  },

  clearPdfSlot: async (slotId) => {
    const { pdfSlots, selectedSlotId } = get();
    
    // Delete permanent file from document directory in React Native
    const activeSlot = pdfSlots[slotId];
    if (activeSlot && activeSlot.uri && Platform.OS !== 'web') {
      try {
        const FileSystem = require('expo-file-system');
        const fileInfo = await FileSystem.getInfoAsync(activeSlot.uri);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(activeSlot.uri, { idempotent: true });
          console.log('[Permanent Storage] Deleted permanent PDF file successfully:', activeSlot.uri);
        }
      } catch (err) {
        console.warn('[Permanent Storage] Failed to delete PDF file:', err);
      }
    }

    const updatedSlots = {
      ...pdfSlots,
      [slotId]: null
    };

    const isCurrentSelected = selectedSlotId === slotId;
    const newSelectedSlotId = isCurrentSelected ? null : selectedSlotId;

    set({
      pdfSlots: updatedSlots,
      selectedSlotId: newSelectedSlotId,
    });

    if (isCurrentSelected) {
      set({
        pdfUri: null,
        pdfBase64: null,
        pdfName: null,
        geminiFileUri: null,
        pdfPageRange: null,
      });
    }

    try {
      await AsyncStorage.setItem('@kpss_pdf_slots', JSON.stringify(updatedSlots));
      if (isCurrentSelected) {
        await AsyncStorage.removeItem('@kpss_selected_slot_id');
        await AsyncStorage.removeItem('@kpss_pdf_page_range');
      }
    } catch (e) {
      console.warn('Persist clear slot error:', e);
    }
  },

  resetQuiz: () => {
    set({
      selectedTopics: [],
      questions: [],
      currentIndex: 0,
      userAnswers: {},
      isGenerating: false,
      error: null,
      difficulty: 'medium',
      pdfPageRange: null,
    });
    get().clearActiveSession();
  },

  resetQuizKeepTopics: () => {
    set({
      questions: [],
      currentIndex: 0,
      userAnswers: {},
      isGenerating: false,
      error: null,
    });
    get().clearActiveSession();
  },

  saveActiveSession: async () => {
    const {
      questions,
      currentIndex,
      userAnswers,
      selectedTopics,
      questionCount,
      difficulty,
      pdfUri,
      pdfName,
      pdfPageRange,
    } = get();

    if (questions.length === 0) return;

    try {
      const session = {
        questions,
        currentIndex,
        userAnswers,
        selectedTopics,
        questionCount,
        difficulty,
        pdfUri,
        pdfName,
        pdfPageRange,
      };
      await AsyncStorage.setItem('@kpss_active_quiz_session', JSON.stringify(session));
    } catch (e) {
      console.warn('Failed to save active session:', e);
    }
  },

  clearActiveSession: async () => {
    try {
      await AsyncStorage.removeItem('@kpss_active_quiz_session');
    } catch (e) {
      console.warn('Failed to clear active session:', e);
    }
  },

  loadActiveSession: async () => {
    try {
      const stored = await AsyncStorage.getItem('@kpss_active_quiz_session');
      if (stored) {
        const session = JSON.parse(stored);
        if (session && session.questions && session.questions.length > 0) {
          set({
            questions: session.questions,
            currentIndex: session.currentIndex,
            userAnswers: session.userAnswers || {},
            selectedTopics: session.selectedTopics || [],
            questionCount: session.questionCount || 10,
            difficulty: session.difficulty || 'medium',
            pdfUri: session.pdfUri || null,
            pdfName: session.pdfName || null,
            pdfPageRange: session.pdfPageRange || null,
          });
          return true;
        }
      }
    } catch (e) {
      console.warn('Failed to load active session:', e);
    }
    return false;
  },

  getResults: () => {
    const { questions, userAnswers } = get();

    let correctCount = 0;
    let wrongCount = 0;
    let emptyCount = 0;
    const correctAnswers: QuizResult['correctAnswers'] = [];
    const wrongAnswers: QuizResult['wrongAnswers'] = [];
    const emptyAnswers: QuizResult['emptyAnswers'] = [];

    questions.forEach((question) => {
      const userAnswer = userAnswers[question.id];

      if (!userAnswer) {
        emptyCount++;
        emptyAnswers.push({ question });
      } else if (userAnswer === question.correct_answer) {
        correctCount++;
        correctAnswers.push({ question, userAnswer });
      } else {
        wrongCount++;
        wrongAnswers.push({
          question,
          userAnswer,
        });
      }
    });

    const totalQuestions = questions.length;
    const scorePercentage =
      totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    return {
      totalQuestions,
      correctCount,
      wrongCount,
      emptyCount,
      scorePercentage,
      correctAnswers,
      wrongAnswers,
      emptyAnswers,
    };
  },

  isLastQuestion: () => {
    const { currentIndex, questions } = get();
    return currentIndex === questions.length - 1;
  },

  isFirstQuestion: () => {
    const { currentIndex } = get();
    return currentIndex === 0;
  },

  getCurrentQuestion: () => {
    const { questions, currentIndex } = get();
    return questions[currentIndex] || null;
  },

  getAnsweredCount: () => {
    const { userAnswers } = get();
    return Object.keys(userAnswers).length;
  },
}));
