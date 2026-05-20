import { create } from 'zustand';
import { MapQuizQuestion, MapQuizMode } from '../services/mapQuizEngine';

interface MapQuizState {
  mode: MapQuizMode;
  questions: MapQuizQuestion[];
  currentIndex: number;
  userAnswers: Record<number, string>;
  isGenerating: boolean;
  score: number;
  questionCount: number;

  // Actions
  setMode: (mode: MapQuizMode) => void;
  setQuestionCount: (count: number) => void;
  setQuestions: (questions: MapQuizQuestion[]) => void;
  selectAnswer: (questionId: number, answer: string) => void;
  nextQuestion: () => void;
  resetQuiz: () => void;

  // Computed
  getCurrentQuestion: () => MapQuizQuestion | null;
  getAnsweredCount: () => number;
  isLastQuestion: () => boolean;
}

export const useMapQuizStore = create<MapQuizState>((set, get) => ({
  mode: 'turkey',
  questions: [],
  currentIndex: 0,
  userAnswers: {},
  isGenerating: false,
  score: 0,
  questionCount: 10,

  setMode: (mode) => set({ mode }),
  setQuestionCount: (count) => set({ questionCount: count }),
  setQuestions: (questions) => set({ questions, currentIndex: 0, userAnswers: {}, score: 0 }),
  
  selectAnswer: (questionId, answer) => {
    set((state) => {
      // Sadece bir kere cevaplanabilir (ilk cevabı al)
      if (state.userAnswers[questionId]) return state;
      
      const isCorrect = state.questions.find(q => q.id === questionId)?.correct_answer === answer;
      
      return {
        userAnswers: { ...state.userAnswers, [questionId]: answer },
        score: isCorrect ? state.score + 1 : state.score
      };
    });
  },

  nextQuestion: () => {
    const { currentIndex, questions } = get();
    if (currentIndex < questions.length - 1) {
      set({ currentIndex: currentIndex + 1 });
    }
  },

  resetQuiz: () => set({
    questions: [],
    currentIndex: 0,
    userAnswers: {},
    score: 0
  }),

  getCurrentQuestion: () => {
    const { questions, currentIndex } = get();
    return questions[currentIndex] || null;
  },

  getAnsweredCount: () => {
    const { userAnswers } = get();
    return Object.keys(userAnswers).length;
  },

  isLastQuestion: () => {
    const { currentIndex, questions } = get();
    return currentIndex === questions.length - 1;
  }
}));
