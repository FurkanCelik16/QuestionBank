// ========================================
// Quiz Store - Quiz State Management
// ========================================

import { create } from 'zustand';
import { QuizQuestion, QuizResult, DifficultyLevel } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  setPdfContext: (uri: string | null, base64: string | null, name: string | null, geminiUri?: string | null) => void;
  clearPdfContext: () => void;
  setPdfPageRange: (range: string | null) => void;
  loadPdfContext: () => Promise<void>;
  selectPdfSlot: (slotId: string | null) => void;
  uploadToPdfSlot: (slotId: string, uri: string, base64: string, name: string, geminiUri: string) => void;
  clearPdfSlot: (slotId: string) => void;
  resetQuiz: () => void;
  resetQuizKeepTopics: () => void;

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
  pdfSlots: { slot_1: null, slot_2: null, slot_3: null },
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
  },

  selectAnswer: (questionId, answer) => {
    set((state) => ({
      userAnswers: {
        ...state.userAnswers,
        [questionId]: answer,
      },
    }));
  },

  nextQuestion: () => {
    const { currentIndex, questions } = get();
    if (currentIndex < questions.length - 1) {
      set({ currentIndex: currentIndex + 1 });
    }
  },

  previousQuestion: () => {
    const { currentIndex } = get();
    if (currentIndex > 0) {
      set({ currentIndex: currentIndex - 1 });
    }
  },

  goToQuestion: (index) => {
    const { questions } = get();
    if (index >= 0 && index < questions.length) {
      set({ currentIndex: index });
    }
  },

  setGenerating: (isGenerating) => set({ isGenerating }),

  setError: (error) => set({ error }),

  setPdfContext: (uri, base64, name, geminiUri) => {
    set({ 
      pdfUri: uri, 
      pdfBase64: base64, 
      pdfName: name, 
      geminiFileUri: geminiUri || null 
    });
    try {
      if (uri) AsyncStorage.setItem('@kpss_pdf_uri', uri);
      else AsyncStorage.removeItem('@kpss_pdf_uri');

      if (base64) AsyncStorage.setItem('@kpss_pdf_base_64', base64);
      else AsyncStorage.removeItem('@kpss_pdf_base_64');

      if (name) AsyncStorage.setItem('@kpss_pdf_name', name);
      else AsyncStorage.removeItem('@kpss_pdf_name');

      if (geminiUri) AsyncStorage.setItem('@kpss_gemini_file_uri', geminiUri);
      else AsyncStorage.removeItem('@kpss_gemini_file_uri');
    } catch (e) {
      console.warn('Persist PDF error:', e);
    }
  },

  clearPdfContext: () => {
    set({ pdfUri: null, pdfBase64: null, pdfName: null, geminiFileUri: null, pdfPageRange: null });
    try {
      AsyncStorage.removeItem('@kpss_pdf_uri');
      AsyncStorage.removeItem('@kpss_pdf_base_64');
      AsyncStorage.removeItem('@kpss_pdf_name');
      AsyncStorage.removeItem('@kpss_gemini_file_uri');
      AsyncStorage.removeItem('@kpss_pdf_page_range');
    } catch (e) {
      console.warn('Clear PDF persist error:', e);
    }
  },

  setPdfPageRange: (range) => {
    set({ pdfPageRange: range });
    try {
      if (range) AsyncStorage.setItem('@kpss_pdf_page_range', range);
      else AsyncStorage.removeItem('@kpss_pdf_page_range');
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

      const pdfSlots = slotsJson 
        ? JSON.parse(slotsJson) 
        : { slot_1: null, slot_2: null, slot_3: null };
      
      const selectedSlotId = selectedId || null;
      let activePdf: PersistedPdf | null = null;
      if (selectedSlotId && pdfSlots[selectedSlotId]) {
        activePdf = pdfSlots[selectedSlotId];
      }

      set({
        pdfSlots,
        selectedSlotId,
        pdfPageRange: range,
        pdfUri: activePdf ? activePdf.uri : null,
        pdfBase64: activePdf ? activePdf.base64 : null,
        pdfName: activePdf ? activePdf.name : null,
        geminiFileUri: activePdf ? activePdf.geminiFileUri : null,
      });
    } catch (e) {
      console.warn('Persisted PDF load error:', e);
    }
  },

  selectPdfSlot: (slotId) => {
    const { pdfSlots } = get();
    const activePdf = slotId ? pdfSlots[slotId] : null;

    set({
      selectedSlotId: slotId,
      pdfUri: activePdf ? activePdf.uri : null,
      pdfBase64: activePdf ? activePdf.base64 : null,
      pdfName: activePdf ? activePdf.name : null,
      geminiFileUri: activePdf ? activePdf.geminiFileUri : null,
    });

    try {
      if (slotId) {
        AsyncStorage.setItem('@kpss_selected_slot_id', slotId);
      } else {
        AsyncStorage.removeItem('@kpss_selected_slot_id');
      }
    } catch (e) {
      console.warn('Persist selected slot error:', e);
    }
  },

  uploadToPdfSlot: (slotId, uri, base64, name, geminiUri) => {
    const { pdfSlots, selectedSlotId } = get();
    const updatedSlots = {
      ...pdfSlots,
      [slotId]: { uri, base64, name, geminiFileUri: geminiUri }
    };

    const shouldSelect = !selectedSlotId;
    const newSelectedSlotId = shouldSelect ? slotId : selectedSlotId;

    set({
      pdfSlots: updatedSlots,
      selectedSlotId: newSelectedSlotId,
    });

    if (shouldSelect) {
      set({
        pdfUri: uri,
        pdfBase64: base64,
        pdfName: name,
        geminiFileUri: geminiUri,
      });
    }

    try {
      AsyncStorage.setItem('@kpss_pdf_slots', JSON.stringify(updatedSlots));
      if (shouldSelect) {
        AsyncStorage.setItem('@kpss_selected_slot_id', slotId);
      }
    } catch (e) {
      console.warn('Persist upload slots error:', e);
    }
  },

  clearPdfSlot: (slotId) => {
    const { pdfSlots, selectedSlotId } = get();
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
      AsyncStorage.setItem('@kpss_pdf_slots', JSON.stringify(updatedSlots));
      if (isCurrentSelected) {
        AsyncStorage.removeItem('@kpss_selected_slot_id');
        AsyncStorage.removeItem('@kpss_pdf_page_range');
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
  },

  resetQuizKeepTopics: () => {
    set({
      questions: [],
      currentIndex: 0,
      userAnswers: {},
      isGenerating: false,
      error: null,
    });
  },

  getResults: () => {
    const { questions, userAnswers } = get();

    let correctCount = 0;
    let wrongCount = 0;
    let emptyCount = 0;
    const wrongAnswers: QuizResult['wrongAnswers'] = [];
    const emptyAnswers: QuizResult['emptyAnswers'] = [];

    questions.forEach((question) => {
      const userAnswer = userAnswers[question.id];

      if (!userAnswer) {
        emptyCount++;
        emptyAnswers.push({ question });
      } else if (userAnswer === question.correct_answer) {
        correctCount++;
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
