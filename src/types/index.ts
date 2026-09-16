// ========================================
// KPSS AI Quiz App - Type Definitions
// ========================================

export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'extreme';

export interface QuizQuestion {
  id: number;
  type: string;
  question_text: string;
  subtopic?: string;
  highlighted_province_ids?: number[];
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
    E: string;
  };
  correct_answer: string;
  rational_explanation: string;
  page_number?: number;
  mind_map_svg?: string;
}

export interface Quiz {
  test_id: string;
  questions: QuizQuestion[];
}

export interface UserAnswer {
  questionId: number;
  selectedOption: string | null;
}

export interface QuizResult {
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  emptyCount: number;
  scorePercentage: number;
  correctAnswers: CorrectAnswer[];
  wrongAnswers: WrongAnswer[];
  emptyAnswers: EmptyAnswer[];
}

export interface WrongAnswer {
  question: QuizQuestion;
  userAnswer: string;
}

export interface EmptyAnswer {
  question: QuizQuestion;
}

export interface CorrectAnswer {
  question: QuizQuestion;
  userAnswer: string;
}

export interface TestHistoryItem {
  id: string;
  date: string;
  topics: string[];
  questionCount: number;
  difficulty: DifficultyLevel;
  result: QuizResult;
  questions?: QuizQuestion[];
}

export interface Topic {
  id: string;
  name: string;
  category: 'tarih' | 'cografya' | 'vatandaslik' | 'guncel';
}

export type RootStackParamList = {
  TopicSelection: { initialTab?: 'tarih' | 'cografya' | 'vatandaslik' | 'guncel' | 'harita' } | undefined;
  Loading: {
    selectedTopics: string[];
    questionCount: number;
    difficulty: DifficultyLevel;
    focusSubtopics?: string[];
  };
  Quiz: undefined;
  Result: {
    pastResult?: TestHistoryItem;
  } | undefined;
  Settings: undefined;
  Setup: undefined;
  History: undefined;
  MapQuizHome: undefined;
  MapQuiz: undefined;
  MapQuizResult: undefined;
  MistakeResolver: undefined;
  SmartIndex: undefined;
  TimelineGame: undefined;
  RecentQuestions: undefined;
};
