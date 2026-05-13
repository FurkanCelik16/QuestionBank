import React, { useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Animated, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, borderRadius, spacing, fontSize } from '../theme/colors';
import { useQuizStore } from '../store/useQuizStore';
import { useHistoryStore } from '../store/useHistoryStore';
import { OptionButton } from '../components/OptionButton';
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
  const question = getCurrentQuestion();
  const totalQuestions = questions.length;
  const progress = totalQuestions > 0 ? (currentIndex + 1) / totalQuestions : 0;

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();
  }, [currentIndex]);

  const handleSelectOption = (option: string) => {
    if (!question) return;
    selectAnswer(question.id, option);
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
    });
    navigation.replace('Result');
  };

  const handleFinish = () => {
    const answered = getAnsweredCount();
    const unanswered = totalQuestions - answered;
    if (unanswered > 0) {
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

  return (
    <SafeAreaView style={s.container} edges={['bottom']}>
      {/* Top bar */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={handleQuit} style={s.quitBtn}>
          <Text style={s.quitText}>✕</Text>
        </TouchableOpacity>
        <View style={s.progressInfo}>
          <Text style={s.progressText}>Soru {currentIndex + 1}/{totalQuestions}</Text>
        </View>
        <View style={s.answeredBadge}>
          <Text style={s.answeredText}>Çözülen: {getAnsweredCount()}</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={s.progressBarBg}>
        <Animated.View style={[s.progressBarFill, { width: `${progress * 100}%` }]} />
      </View>

      {/* Question */}
      <ScrollView style={s.scrollArea} showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={s.questionCard}>
            <View style={s.qTypeRow}>
              <Text style={s.qType}>{question.type || 'Çoktan Seçmeli'}</Text>
            </View>
            <Text style={s.questionText}>{question.question_text}</Text>
          </View>

          {/* Options */}
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

      {/* Navigation buttons */}
      <View style={s.navRow}>
        <TouchableOpacity
          style={[s.navBtn, isFirstQuestion() && s.navBtnDisabled]}
          onPress={previousQuestion}
          disabled={isFirstQuestion()}
          activeOpacity={0.7}
        >
          <Text style={[s.navBtnText, isFirstQuestion() && s.navBtnTextDisabled]}>← Geri</Text>
        </TouchableOpacity>

        {isLastQuestion() ? (
          <TouchableOpacity style={s.finishBtn} onPress={handleFinish} activeOpacity={0.8}>
            <Text style={s.finishBtnText}>Testi Bitir ✓</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={s.nextBtn} onPress={nextQuestion} activeOpacity={0.7}>
            <Text style={s.nextBtnText}>İleri →</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Question dots */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.dotsScroll} contentContainerStyle={s.dotsContainer}>
        {questions.map((q, i) => (
          <TouchableOpacity
            key={q.id}
            style={[
              s.dot,
              i === currentIndex && s.dotActive,
              userAnswers[q.id] && s.dotAnswered,
              i === currentIndex && userAnswers[q.id] && s.dotActiveAnswered,
            ]}
            onPress={() => useQuizStore.getState().goToQuestion(i)}
          >
            <Text style={[s.dotText, i === currentIndex && s.dotTextActive]}>{i + 1}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  quitBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  quitText: { color: colors.textSecondary, fontSize: 16, fontWeight: '600' },
  progressInfo: { flex: 1, alignItems: 'center' },
  progressText: { color: colors.textPrimary, fontSize: fontSize.md, fontWeight: '700' },
  answeredBadge: { backgroundColor: colors.primaryGlow, borderRadius: borderRadius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderWidth: 1, borderColor: colors.primary },
  answeredText: { color: colors.primary, fontSize: fontSize.xs, fontWeight: '700' },
  progressBarBg: { height: 4, backgroundColor: colors.surface, marginHorizontal: spacing.lg, borderRadius: 2, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },
  scrollArea: { flex: 1 },
  scrollContent: { padding: spacing.xxl, paddingTop: spacing.lg },
  questionCard: { backgroundColor: colors.surface, borderRadius: borderRadius.xl, borderWidth: 1, borderColor: colors.border, padding: spacing.xl, marginBottom: spacing.xl },
  qTypeRow: { marginBottom: spacing.md },
  qType: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  questionText: { color: colors.textPrimary, fontSize: fontSize.lg, fontWeight: '600', lineHeight: 28 },
  optionsContainer: {},
  navRow: { flexDirection: 'row', paddingHorizontal: spacing.xxl, paddingVertical: spacing.md, gap: spacing.sm },
  navBtn: { flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  navBtnDisabled: { opacity: 0.4 },
  navBtnText: { color: colors.textSecondary, fontSize: fontSize.md, fontWeight: '600' },
  navBtnTextDisabled: { color: colors.textMuted },
  nextBtn: { flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.surfaceLight, borderWidth: 1, borderColor: colors.primary },
  nextBtnText: { color: colors.primary, fontSize: fontSize.md, fontWeight: '700' },
  finishBtn: { flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.primary },
  finishBtnText: { color: colors.textInverse, fontSize: fontSize.md, fontWeight: '700' },
  dotsScroll: { maxHeight: 44, borderTopWidth: 1, borderTopColor: colors.border },
  dotsContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.xs },
  dot: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  dotActive: { borderColor: colors.primary, borderWidth: 2 },
  dotAnswered: { backgroundColor: colors.primaryGlow, borderColor: colors.primaryGlow },
  dotActiveAnswered: { backgroundColor: colors.primary, borderColor: colors.primary },
  dotText: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '600' },
  dotTextActive: { color: colors.textInverse },
});
