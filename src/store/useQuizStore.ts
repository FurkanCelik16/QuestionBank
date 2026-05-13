// ========================================
// Quiz Store - Quiz State Management
// ========================================

import { create } from 'zustand';
import { QuizQuestion, QuizResult, DifficultyLevel } from '../types';

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

  resetQuiz: () => {
    set({
      selectedTopics: [],
      questions: [],
      currentIndex: 0,
      userAnswers: {},
      isGenerating: false,
      error: null,
      difficulty: 'medium',
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
