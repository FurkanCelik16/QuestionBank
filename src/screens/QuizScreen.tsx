import React, { useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Animated, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, borderRadius, spacing, fontSize, AppTheme, shadow } from '../theme/colors';
import { useQuizStore } from '../store/useQuizStore';
import { useHistoryStore } from '../store/useHistoryStore';
import { OptionButton } from '../components/OptionButton';
import { TurkeyMapSvg } from '../components/maps/TurkeyMapSvg';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Quiz'>;
};

export const QuizScreen: React.FC<Props> = ({ navigation }) => {
  const colors = useTheme();
  const {
    questions, currentIndex, userAnswers,
    selectAnswer, nextQuestion, previousQuestion,
    isLastQuestion, isFirstQuestion, getCurrentQuestion, getAnsweredCount,
    getResults, selectedTopics, questionCount, difficulty,
    resetQuiz
  } = useQuizStore();
  const { addTestResult } = useHistoryStore();

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const question = getCurrentQuestion();
  const totalQuestions = questions.length;
  const progress = totalQuestions > 0 ? (currentIndex + 1) / totalQuestions : 0;

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(10);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();
  }, [currentIndex]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const handleSelectOption = (option: string) => {
    if (!question) return;
    const currentAnswer = userAnswers[question.id];
    if (currentAnswer === option) {
      selectAnswer(question.id, '');
    } else {
      selectAnswer(question.id, option);
    }
  };

  const completeQuiz = async () => {
    const result = getResults();
    await addTestResult({
      id: Date.now().toString(),
      date: new Date().toISOString(),
      topics: selectedTopics,
      questionCount: questionCount,
      difficulty: difficulty,
      result: result,
      questions: questions,
    });
    await useQuizStore.getState().clearActiveSession();
    navigation.replace('Result');
  };

  const handleFinish = () => {
    const answered = getAnsweredCount();
    const unanswered = totalQuestions - answered;
    if (unanswered > 0) {
      if (Platform.OS === 'web') {
        const confirmFinish = window.confirm(`${unanswered} soru boş bırakılacak. Testi bitirmek istiyor musunuz?`);
        if (confirmFinish) {
          completeQuiz();
        }
        return;
      }
      Alert.alert(
        'Testi Bitir',
        `${unanswered} soru boş bırakılacak. Testi bitirmek istiyor musunuz?`,
        [{ text: 'İptal', style: 'cancel' }, { text: 'Bitir', onPress: completeQuiz }]
      );
    } else {
      completeQuiz();
    }
  };

  const handleQuit = () => {
    if (Platform.OS === 'web') {
      const confirmQuit = window.confirm('Testi bırakmak istediğinize emin misiniz? İlerlemeniz kaybolacaktır.');
      if (confirmQuit) {
        resetQuiz();
        navigation.reset({ index: 0, routes: [{ name: 'TopicSelection' }] });
      }
      return;
    }
    Alert.alert('Testi Bırak', 'İlerlemeniz kaybolacak. Emin misiniz?',
      [{ text: 'İptal', style: 'cancel' },
       { text: 'Bırak', style: 'destructive', onPress: () => {
         resetQuiz();
         navigation.reset({ index: 0, routes: [{ name: 'TopicSelection' }] });
       } }]);
  };

  if (!question) return null;

  const selectedAnswer = userAnswers[question.id];
  const s = getStyles(colors);

  const widthInterpolate = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={s.container} edges={['bottom']}>
      {/* Top bar with clean flat background */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={handleQuit} style={s.quitBtn} activeOpacity={0.8}>
          <Text style={s.quitText}>✕</Text>
        </TouchableOpacity>
        <View style={s.progressInfo}>
          <Text style={s.progressText}>Soru {currentIndex + 1} / {totalQuestions}</Text>
        </View>
        <View style={s.answeredBadge}>
          <Text style={s.answeredText}>{getAnsweredCount()} / {totalQuestions} Yanıtlandı</Text>
        </View>
      </View>

      {/* Minimal progress bar */}
      <View style={s.progressWrapper}>
        <View style={s.progressBarBg}>
          <Animated.View style={[s.progressBarFill, { width: widthInterpolate }]} />
        </View>
      </View>

      {/* Question scroll container */}
      <ScrollView style={s.scrollArea} showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          
          {/* Flat Minimalist Question Card (No Generic Gradients) */}
          <View style={s.questionCard}>
            <View style={s.qTypeRow}>
              <View style={s.qTypeBadge}>
                <Text style={s.qType} numberOfLines={1} ellipsizeMode="tail">
                  {question.page_number ? `Doküman Sayfa ${question.page_number}` : `KPSS Testi · Soru ${currentIndex + 1} / ${totalQuestions}`}
                </Text>
              </View>
              {difficulty && (
                <View style={s.difficultyBadge}>
                  <Text style={s.difficultyText}>
                    {difficulty === 'easy' ? 'Kolay' : difficulty === 'medium' ? 'Orta' : difficulty === 'hard' ? 'Zor' : 'Uzman'}
                  </Text>
                </View>
              )}
            </View>
            
            {/* INLINE TURKEY MAP */}
            {question.highlighted_province_ids && question.highlighted_province_ids.length > 0 && (
              <View style={s.mapWrapper}>
                <TurkeyMapSvg highlightedProvinceIds={question.highlighted_province_ids} />
              </View>
            )}
            
            <Text style={s.questionText}>{question.question_text}</Text>
          </View>

          {/* Options list */}
          <View style={s.optionsContainer}>
            {(['A', 'B', 'C', 'D', 'E'] as const).map((opt) => (
              <OptionButton
                key={opt}
                label={opt}
                text={question.options[opt]}
                isSelected={selectedAnswer === opt}
                onPress={() => handleSelectOption(opt)}
              />
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Elegant Action Buttons */}
      <View style={s.navRow}>
        <TouchableOpacity
          style={[s.navBtn, isFirstQuestion() && s.navBtnDisabled]}
          onPress={previousQuestion}
          disabled={isFirstQuestion()}
          activeOpacity={0.8}
        >
          <Text style={[s.navBtnText, isFirstQuestion() && s.navBtnTextDisabled]}>← Geri</Text>
        </TouchableOpacity>

        {isLastQuestion() ? (
          <TouchableOpacity style={s.finishBtn} onPress={handleFinish} activeOpacity={0.9}>
            <Text style={s.finishBtnText}>Sınavı Bitir ✓</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={s.nextBtn} onPress={nextQuestion} activeOpacity={0.8}>
            <Text style={s.nextBtnText}>İleri →</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Dot indicators */}
      <View style={s.dotsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.dotsContainer}>
          {questions.map((q, i) => {
            const isCurrent = i === currentIndex;
            const isAnswered = !!userAnswers[q.id];
            
            return (
              <TouchableOpacity
                key={q.id}
                style={[
                  s.dot,
                  isCurrent && s.dotActive,
                  isAnswered && s.dotAnswered,
                  isCurrent && isAnswered && s.dotActiveAnswered,
                ]}
                onPress={() => useQuizStore.getState().goToQuestion(i)}
                activeOpacity={0.8}
              >
                <Text style={[
                  s.dotText, 
                  isCurrent && s.dotTextActive,
                  isAnswered && !isCurrent && { color: colors.textPrimary }
                ]}>
                  {i + 1}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const getStyles = (colors: AppTheme) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
  topBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: spacing.lg, 
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceElevated,
    borderBottomWidth: 1.5,
    borderColor: colors.border,
  },
  quitBtn: { 
    width: 32, 
    height: 32, 
    borderRadius: borderRadius.sm, 
    backgroundColor: colors.surface, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 1.5, 
    borderColor: colors.border 
  },
  quitText: { 
    color: colors.textPrimary, 
    fontSize: 12, 
    fontWeight: '900' 
  },
  progressInfo: { 
    flex: 1, 
    alignItems: 'center' 
  },
  progressText: { 
    color: colors.textPrimary, 
    fontSize: fontSize.md - 1, 
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  answeredBadge: { 
    backgroundColor: colors.surfaceHighlight, 
    borderRadius: borderRadius.sm, 
    paddingHorizontal: spacing.md, 
    paddingVertical: 5, 
    borderWidth: 1, 
    borderColor: colors.border 
  },
  answeredText: { 
    color: colors.textSecondary, 
    fontSize: fontSize.xs - 1, 
    fontWeight: '800' 
  },
  progressWrapper: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    backgroundColor: colors.surfaceElevated,
  },
  progressBarBg: { 
    height: 4, 
    backgroundColor: colors.backgroundAlt, 
    borderRadius: borderRadius.full, 
    overflow: 'hidden' 
  },
  progressBarFill: { 
    height: '100%', 
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
  },
  scrollArea: { 
    flex: 1 
  },
  scrollContent: { 
    padding: spacing.xl, 
    paddingTop: spacing.lg 
  },
  questionCard: { 
    backgroundColor: colors.surfaceElevated, 
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md, 
    padding: spacing.xl, 
    marginBottom: spacing.lg,
    ...shadow(1),
  },
  qTypeRow: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md 
  },
  qTypeBadge: {
    backgroundColor: colors.surfaceHighlight,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    flexShrink: 1,
    marginRight: spacing.sm,
  },
  qType: { 
    color: colors.textPrimary, 
    fontSize: fontSize.xxs + 1, 
    fontWeight: '800', 
    letterSpacing: 0.5 
  },
  difficultyBadge: {
    backgroundColor: colors.surfaceHighlight,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  difficultyText: {
    color: colors.textPrimary,
    fontSize: fontSize.xxs + 1,
    fontWeight: '800',
  },
  mapWrapper: { 
    height: 180, 
    width: '100%', 
    marginVertical: spacing.md, 
    borderRadius: borderRadius.md, 
    overflow: 'hidden', 
    backgroundColor: colors.background, 
    borderWidth: 1, 
    borderColor: colors.border 
  },
  questionText: { 
    color: colors.textPrimary, 
    fontSize: fontSize.lg - 1, 
    fontWeight: '800', 
    lineHeight: 25,
    letterSpacing: -0.3,
  },
  optionsContainer: {
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  navRow: { 
    flexDirection: 'row', 
    paddingHorizontal: spacing.xl, 
    paddingVertical: spacing.md, 
    gap: spacing.md,
    backgroundColor: colors.surfaceElevated,
    borderTopWidth: 1.5,
    borderColor: colors.border,
  },
  navBtn: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center',
    height: 48, 
    borderRadius: borderRadius.md, 
    backgroundColor: colors.surface, 
    borderWidth: 1.5, 
    borderColor: colors.border 
  },
  navBtnDisabled: { 
    opacity: 0.3 
  },
  navBtnText: { 
    color: colors.textSecondary, 
    fontSize: fontSize.sm + 1, 
    fontWeight: '800' 
  },
  navBtnTextDisabled: { 
    color: colors.textMuted 
  },
  nextBtn: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center',
    height: 48, 
    borderRadius: borderRadius.md, 
    backgroundColor: colors.surface, 
    borderWidth: 1.5, 
    borderColor: colors.primary 
  },
  nextBtnText: { 
    color: colors.textPrimary, 
    fontSize: fontSize.sm + 1, 
    fontWeight: '700' 
  },
  finishBtn: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center',
    height: 48, 
    borderRadius: borderRadius.md, 
    backgroundColor: colors.primary,
    ...shadow(3, colors.primaryDark),
  },
  finishBtnText: { 
    color: colors.textInverse, 
    fontSize: fontSize.sm + 1, 
    fontWeight: '900' 
  },
  dotsWrapper: {
    backgroundColor: colors.surfaceElevated,
    borderTopWidth: 1,
    borderColor: colors.borderSubtle,
    height: 48,
    justifyContent: 'center',
  },
  dotsContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: spacing.xl, 
    gap: spacing.sm 
  },
  dot: { 
    width: 28, 
    height: 28, 
    borderRadius: borderRadius.sm, 
    backgroundColor: colors.surface, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 1.5, 
    borderColor: colors.border 
  },
  dotActive: { 
    borderColor: colors.primary, 
    borderWidth: 2,
    backgroundColor: colors.surfaceHighlight,
  },
  dotAnswered: { 
    backgroundColor: colors.surfaceHighlight, 
    borderColor: colors.border,
  },
  dotActiveAnswered: { 
    backgroundColor: colors.primary, 
    borderColor: colors.primary 
  },
  dotText: { 
    color: colors.textMuted, 
    fontSize: fontSize.xs - 1, 
    fontWeight: '800' 
  },
  dotTextActive: { 
    color: colors.textInverse 
  },
});
