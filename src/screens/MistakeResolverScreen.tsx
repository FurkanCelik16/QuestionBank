// ========================================
// Mistake Resolver (Hata Defteri) Screen
// Allows user to re-solve questions they answered incorrectly in past quizzes.
// Supports dynamic AI-driven "Similar Question Generation" (Hata Takviyesi).
// ========================================

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Animated, Platform, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, borderRadius, spacing, fontSize } from '../theme/colors';
import { useHistoryStore } from '../store/useHistoryStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { QuizQuestion } from '../types';
import { TurkeyMapSvg } from '../components/maps/TurkeyMapSvg';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { generateSimilarQuestion } from '../services/geminiService';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MistakeResolver'>;
};

export const MistakeResolverScreen: React.FC<Props> = ({ navigation }) => {
  const colors = useTheme();
  const { history, solvedWrongIds, markWrongAsSolved } = useHistoryStore();
  const { apiKey } = useSettingsStore();
  
  // Extract all unique wrong questions that are NOT marked as solved yet
  const wrongQuestions = history.reduce<QuizQuestion[]>((acc, curr) => {
    curr.result.wrongAnswers.forEach(wa => {
      if (!acc.some(q => q.id === wa.question.id) && !solvedWrongIds.includes(wa.question.id)) {
        acc.push(wa.question);
      }
    });
    return acc;
  }, []);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  // Clamp currentIndex when wrongQuestions list shrinks (e.g., after solving a question)
  useEffect(() => {
    if (wrongQuestions.length > 0 && currentIndex >= wrongQuestions.length) {
      setCurrentIndex(Math.max(0, wrongQuestions.length - 1));
    }
  }, [wrongQuestions.length, currentIndex]);

  // Similar question states
  const [similarQuestion, setSimilarQuestion] = useState<QuizQuestion | null>(null);
  const [isGeneratingSimilar, setIsGeneratingSimilar] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const currentQuestion = wrongQuestions[currentIndex];
  const activeQuestion = similarQuestion || currentQuestion;

  const handleSelectOption = (opt: string) => {
    if (isAnswered) return;
    setSelectedOption(opt);
    setIsAnswered(true);
  };

  const handleGenerateSimilar = async () => {
    if (!apiKey) {
      if (Platform.OS === 'web') {
        window.alert('Lütfen Ayarlar ekranından API anahtarınızı kontrol edin.');
      } else {
        Alert.alert('API Anahtarı Gerekli', 'Lütfen Ayarlar ekranından API anahtarınızı kontrol edin.');
      }
      return;
    }
    try {
      setIsGeneratingSimilar(true);
      const newQuestion = await generateSimilarQuestion(activeQuestion, apiKey);
      
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 15, duration: 1, useNativeDriver: true })
      ]).start(() => {
        setSimilarQuestion(newQuestion);
        setSelectedOption(null);
        setIsAnswered(false);
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
          Animated.spring(slideAnim, { toValue: 0, friction: 6, useNativeDriver: true })
        ]).start();
      });
    } catch (err: any) {
      console.error(err);
      if (Platform.OS === 'web') {
        window.alert('Yapay zeka benzer soru oluştururken bir sorun yaşadı. Lütfen tekrar deneyin.');
      } else {
        Alert.alert('Hata', 'Yapay zeka benzer soru oluştururken bir sorun yaşadı. Lütfen tekrar deneyin.');
      }
    } finally {
      setIsGeneratingSimilar(false);
    }
  };

  const handleNext = async () => {
    // Capture current state before any async operations
    const wasCorrect = selectedOption === currentQuestion?.correct_answer;
    const wasSimilarQuestion = !!similarQuestion;

    // If correct and it was the base question (not similar question), mark it as solved
    if (!wasSimilarQuestion && wasCorrect && currentQuestion) {
      await markWrongAsSolved(currentQuestion.id);
    }

    // Reset local state
    setSelectedOption(null);
    setIsAnswered(false);
    setSimilarQuestion(null); // Return to regular mistake flow

    // After marking as solved, the wrongQuestions list will shrink on next render.
    // If the user answered correctly (and it was the base question), the current item
    // will be removed from the list, so we keep the same index (it will now point to
    // the next item). If wrong, we need to increment the index.
    const listWillShrink = !wasSimilarQuestion && wasCorrect;
    const currentListLength = wrongQuestions.length;
    const futureListLength = listWillShrink ? currentListLength - 1 : currentListLength;

    if (futureListLength <= 0) {
      // All questions solved — useEffect clamp + empty state render will handle it
      setCurrentIndex(0);
      return;
    }

    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 15, duration: 1, useNativeDriver: true })
    ]).start(() => {
      if (listWillShrink) {
        // List shrinks: keep index but clamp to new bounds
        setCurrentIndex(prev => Math.min(prev, futureListLength - 1));
      } else {
        // List stays same size: advance index, wrapping to 0 at end
        setCurrentIndex(prev => {
          if (prev >= currentListLength - 1) return 0; // Wrap to start
          return prev + 1;
        });
      }

      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 6, useNativeDriver: true })
      ]).start();
    });
  };

  const handleQuit = () => {
    navigation.goBack();
  };

  const s = getStyles(colors);

  // Empty State (All mistakes solved!)
  if (wrongQuestions.length === 0 || !currentQuestion) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.emptyContainer}>
          <Text style={s.emptyEmoji}>🎉</Text>
          <Text style={s.emptyTitle}>Harika! Hata Defteriniz Boş</Text>
          <Text style={s.emptyDesc}>
            Daha önce çözdüğünüz testlerdeki tüm yanlışları temizlediniz veya henüz hiç yanlış yapmadınız! Zayıf noktanız bulunmuyor.
          </Text>
          <TouchableOpacity style={s.backBtn} onPress={handleQuit} activeOpacity={0.8}>
            <Text style={s.backBtnText}>Ana Sayfaya Dön 🏠</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isCorrect = selectedOption === activeQuestion.correct_answer;

  return (
    <SafeAreaView style={s.container} edges={['bottom']}>
      {/* Top Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={handleQuit} style={s.closeBtn}>
          <Text style={s.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Hata Defteri 📓</Text>
        <View style={s.progressBadge}>
          <Text style={s.progressText}>
            {similarQuestion ? 'Benzer Takviye 🔄' : `${currentIndex + 1} / ${wrongQuestions.length}`}
          </Text>
        </View>
      </View>

      {/* Generating similar loading overlay */}
      {isGeneratingSimilar ? (
        <View style={s.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={s.loadingText}>Yapay Zeka Benzer Soru Hazırlıyor...</Text>
          <Text style={s.loadingSub}>Aynı konudaki bilginizi pekiştirmeniz için benzersiz bir KPSS sorusu tasarlanıyor.</Text>
        </View>
      ) : (
        <>
          {/* Main Content Area */}
          <ScrollView style={s.scrollArea} showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
              {/* Question Card */}
              <View style={s.questionCard}>
                <View style={s.qTypeRow}>
                  <Text style={[s.qType, similarQuestion && { color: colors.warning }]}>
                    {similarQuestion ? '🔄 BENZER PEKİŞTİRME SORUSU' : activeQuestion.subtopic || 'Hata Çözme Modu'}
                  </Text>
                </View>
                
                {/* Inline Map if present in the question */}
                {activeQuestion.highlighted_province_ids && activeQuestion.highlighted_province_ids.length > 0 && (
                  <View style={s.mapWrapper}>
                    <TurkeyMapSvg highlightedProvinceIds={activeQuestion.highlighted_province_ids} />
                  </View>
                )}

                <Text style={s.questionText}>{activeQuestion.question_text}</Text>
              </View>

              {/* Options */}
              <View style={s.optionsContainer}>
                {(['A', 'B', 'C', 'D', 'E'] as const).map((opt) => {
                  let optStatus: 'idle' | 'correct' | 'wrong' = 'idle';
                  let isSelected = selectedOption === opt;

                  if (isAnswered) {
                    if (opt === activeQuestion.correct_answer) {
                      optStatus = 'correct';
                    } else if (isSelected) {
                      optStatus = 'wrong';
                    }
                  }

                  // Option-specific colors based on status
                  let cardBg = colors.surface;
                  let borderCol = colors.border;
                  let textCol = colors.textSecondary;
                  let badgeBg = colors.surfaceHighlight;
                  let badgeTextCol = colors.textSecondary;

                  if (optStatus === 'correct') {
                    cardBg = colors.successGlow;
                    borderCol = colors.success;
                    textCol = colors.success;
                    badgeBg = colors.success;
                    badgeTextCol = colors.textInverse;
                  } else if (optStatus === 'wrong') {
                    cardBg = colors.errorGlow;
                    borderCol = colors.error;
                    textCol = colors.error;
                    badgeBg = colors.error;
                    badgeTextCol = colors.textInverse;
                  } else if (isSelected) {
                    cardBg = colors.primaryGlow;
                    borderCol = colors.primary;
                    textCol = colors.primary;
                    badgeBg = colors.primary;
                    badgeTextCol = colors.textInverse;
                  } else if (isAnswered) {
                    // Dim other options
                    textCol = colors.textMuted;
                  }

                  return (
                    <TouchableOpacity
                      key={opt}
                      activeOpacity={0.7}
                      disabled={isAnswered}
                      onPress={() => handleSelectOption(opt)}
                      style={[s.optionBtn, { backgroundColor: cardBg, borderColor: borderCol }]}
                    >
                      <View style={[s.optionBadge, { backgroundColor: badgeBg }]}>
                        <Text style={[s.optionBadgeText, { color: badgeTextCol }]}>{opt}</Text>
                      </View>
                      <Text style={[s.optionText, { color: textCol, fontWeight: isSelected || optStatus === 'correct' ? '600' : '400' }]}>
                        {activeQuestion.options[opt]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Solution & Explanation Card */}
              {isAnswered && (
                <View style={[s.explanationCard, isCorrect ? s.successBorder : s.errorBorder]}>
                  <Text style={[s.feedbackTitle, isCorrect ? s.successText : s.errorText]}>
                    {isCorrect ? '✅ Tebrikler, Doğru Çözdünüz!' : '❌ Maalesef Yanlış Cevap!'}
                  </Text>
                  <Text style={s.feedbackSub}>
                    {isCorrect 
                      ? 'Bu soruyu başarıyla kavradınız. Hata Defterinden temizleyip ilerleyebilir veya kendinizi test etmek için benzer yepyeni bir soru üretebilirsiniz!' 
                      : 'Sorunun doğru cevabını ve detaylı analizini aşağıdan inceleyerek zayıf noktanızı pekiştirebilirsiniz.'}
                  </Text>
                  <View style={s.divider} />
                  <Text style={s.explanationLabel}>Soru Çözüm Analizi:</Text>
                  <Text style={s.explanationText}>{activeQuestion.rational_explanation}</Text>
                </View>
              )}
            </Animated.View>
          </ScrollView>

          {/* Footer Navigation Button */}
          {isAnswered && (
            <View style={s.footer}>
              {isCorrect ? (
                <View style={s.footerRow}>
                  <TouchableOpacity style={[s.nextBtn, { flex: 1.2, backgroundColor: colors.warning }]} onPress={handleGenerateSimilar} activeOpacity={0.8}>
                    <Text style={s.nextBtnText}>🔄 Benzer Soru Üret</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.nextBtn, { flex: 1.8 }]} onPress={handleNext} activeOpacity={0.8}>
                    <Text style={s.nextBtnText}>Sil ve İlerle ➡️</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={s.nextBtn} onPress={handleNext} activeOpacity={0.8}>
                  <Text style={s.nextBtnText}>Sonraki Soruyu Dene ➡️</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border
  },
  closeText: { color: colors.textSecondary, fontSize: 16, fontWeight: '600' },
  headerTitle: { color: colors.textPrimary, fontSize: fontSize.lg, fontWeight: '800' },
  progressBadge: {
    backgroundColor: colors.surfaceHighlight,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border
  },
  progressText: { color: colors.textPrimary, fontSize: fontSize.xs, fontWeight: '700' },
  
  loadingOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxxl },
  loadingText: { color: colors.textPrimary, fontSize: fontSize.xl, fontWeight: '800', marginTop: spacing.xl, marginBottom: 8 },
  loadingSub: { color: colors.textSecondary, fontSize: fontSize.md, textAlign: 'center', lineHeight: 22 },
  
  scrollArea: { flex: 1 },
  scrollContent: { padding: spacing.xxl, paddingTop: spacing.lg },
  
  questionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    marginBottom: spacing.xl
  },
  qTypeRow: { marginBottom: spacing.md },
  qType: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  mapWrapper: { height: 180, width: '100%', marginVertical: spacing.md, borderRadius: borderRadius.md, overflow: 'hidden', backgroundColor: colors.surfaceLight, borderWidth: 1, borderColor: colors.border },
  questionText: { color: colors.textPrimary, fontSize: fontSize.lg, fontWeight: '600', lineHeight: 28 },
  
  optionsContainer: { marginBottom: spacing.xl },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm + 2
  },
  optionBadge: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md
  },
  optionBadgeText: { fontSize: fontSize.md, fontWeight: '700' },
  optionText: { flex: 1, fontSize: fontSize.md, lineHeight: 22 },
  
  explanationCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    padding: spacing.xl,
    marginBottom: spacing.xl
  },
  successBorder: { borderColor: colors.success },
  errorBorder: { borderColor: colors.error },
  feedbackTitle: { fontSize: fontSize.lg, fontWeight: '800', marginBottom: 6 },
  feedbackSub: { color: colors.textSecondary, fontSize: fontSize.sm, lineHeight: 20, marginBottom: spacing.md },
  successText: { color: colors.success },
  errorText: { color: colors.error },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  explanationLabel: { color: colors.textPrimary, fontSize: fontSize.md, fontWeight: '700', marginBottom: 6 },
  explanationText: { color: colors.textSecondary, fontSize: fontSize.md, lineHeight: 24 },
  
  footer: { paddingHorizontal: spacing.xxl, paddingBottom: spacing.xl },
  footerRow: { flexDirection: 'row', gap: spacing.md },
  nextBtn: { backgroundColor: colors.primary, paddingVertical: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center' },
  nextBtnText: { color: colors.textInverse, fontSize: fontSize.lg, fontWeight: '800' },
  
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxxl,
    marginTop: '25%'
  },
  emptyEmoji: { fontSize: 72, marginBottom: spacing.lg },
  emptyTitle: { color: colors.textPrimary, fontSize: fontSize.xxl, fontWeight: '800', marginBottom: spacing.md },
  emptyDesc: { color: colors.textSecondary, fontSize: fontSize.md, textAlign: 'center', lineHeight: 24, marginBottom: spacing.xxxl },
  backBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.xxl, paddingVertical: spacing.lg, borderRadius: borderRadius.lg },
  backBtnText: { color: colors.textInverse, fontSize: fontSize.md, fontWeight: '700' }
});
