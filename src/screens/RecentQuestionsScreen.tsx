// ========================================
// Recent Questions Screen (Son 300 Soru)
// Shows the last 300 questions from quiz history
// Allows re-solving and reviewing past questions
// ========================================

import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Platform, UIManager,
  LayoutAnimation,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, borderRadius, spacing, fontSize, shadow, AppTheme } from '../theme/colors';
import { useHistoryStore } from '../store/useHistoryStore';
import { QuizQuestion } from '../types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'RecentQuestions'>;
};

interface RecentQuestionItem {
  question: QuizQuestion;
  userAnswer: string | null;
  isCorrect: boolean;
  testDate: string;
}

type FilterType = 'all' | 'correct' | 'wrong' | 'empty';

export const RecentQuestionsScreen: React.FC<Props> = ({ navigation }) => {
  const colors = useTheme();
  const { history } = useHistoryStore();

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 20;

  // Extract last 300 questions from history (most recent first)
  const allRecentQuestions = useMemo(() => {
    const items: RecentQuestionItem[] = [];
    const seenIds = new Set<number>();

    for (const test of history) {
      if (!test.questions) continue;

      const wrongIds = new Set(test.result.wrongAnswers.map(wa => wa.question.id));
      const emptyIds = new Set(test.result.emptyAnswers.map(ea => ea.question.id));

      // Build userAnswers map from test data
      const wrongAnswerMap: Record<number, string> = {};
      test.result.wrongAnswers.forEach(wa => {
        wrongAnswerMap[wa.question.id] = wa.userAnswer;
      });

      for (const q of test.questions) {
        if (seenIds.has(q.id)) continue;
        seenIds.add(q.id);

        let userAnswer: string | null = null;
        let isCorrect = false;

        if (wrongIds.has(q.id)) {
          userAnswer = wrongAnswerMap[q.id] || null;
          isCorrect = false;
        } else if (emptyIds.has(q.id)) {
          userAnswer = null;
          isCorrect = false;
        } else {
          userAnswer = q.correct_answer;
          isCorrect = true;
        }

        items.push({
          question: q,
          userAnswer,
          isCorrect,
          testDate: test.date,
        });

        if (items.length >= 300) break;
      }
      if (items.length >= 300) break;
    }

    return items;
  }, [history]);

  // Apply filter
  const filteredQuestions = useMemo(() => {
    switch (activeFilter) {
      case 'correct':
        return allRecentQuestions.filter(q => q.isCorrect);
      case 'wrong':
        return allRecentQuestions.filter(q => !q.isCorrect && q.userAnswer !== null);
      case 'empty':
        return allRecentQuestions.filter(q => q.userAnswer === null);
      default:
        return allRecentQuestions;
    }
  }, [allRecentQuestions, activeFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredQuestions.length / ITEMS_PER_PAGE);
  const paginatedQuestions = filteredQuestions.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  const correctCount = allRecentQuestions.filter(q => q.isCorrect).length;
  const wrongCount = allRecentQuestions.filter(q => !q.isCorrect && q.userAnswer !== null).length;
  const emptyCount = allRecentQuestions.filter(q => q.userAnswer === null).length;

  const toggleExpanded = (id: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    setCurrentPage(0);
    setExpandedId(null);
  };

  const s = getStyles(colors);

  if (allRecentQuestions.length === 0) {
    return (
      <SafeAreaView style={s.container} edges={['bottom']}>
        <View style={s.emptyContainer}>
          <Text style={s.emptyEmoji}>📋</Text>
          <Text style={s.emptyTitle}>Henüz Soru Yok</Text>
          <Text style={s.emptySub}>
            Test çözdükçe son 300 sorunuz burada listelenecek.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['bottom']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.content}
      >
        {/* Stats Summary */}
        <View style={s.statsCard}>
          <Text style={s.statsTitle}>Son {allRecentQuestions.length} Soru</Text>
          <View style={s.statsRow}>
            <View style={s.statItem}>
              <Text style={[s.statNumber, { color: colors.success }]}>{correctCount}</Text>
              <Text style={s.statLabel}>Doğru</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={[s.statNumber, { color: colors.error }]}>{wrongCount}</Text>
              <Text style={s.statLabel}>Yanlış</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={[s.statNumber, { color: colors.textMuted }]}>{emptyCount}</Text>
              <Text style={s.statLabel}>Boş</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={[s.statNumber, { color: colors.primary }]}>
                %{allRecentQuestions.length > 0 ? Math.round((correctCount / allRecentQuestions.length) * 100) : 0}
              </Text>
              <Text style={s.statLabel}>Başarı</Text>
            </View>
          </View>
        </View>

        {/* Filter Pills */}
        <View style={s.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterScroll}>
            <TouchableOpacity
              style={[s.filterPill, activeFilter === 'all' ? s.filterPillActive : null]}
              onPress={() => handleFilterChange('all')}
              activeOpacity={0.8}
            >
              <Text style={[s.filterText, activeFilter === 'all' ? s.filterTextActive : null]}>
                Tümü ({allRecentQuestions.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.filterPill, activeFilter === 'correct' ? s.filterPillActive : null]}
              onPress={() => handleFilterChange('correct')}
              activeOpacity={0.8}
            >
              <Text style={[s.filterText, activeFilter === 'correct' ? s.filterTextActive : null]}>
                ✓ Doğru ({correctCount})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.filterPill, activeFilter === 'wrong' ? s.filterPillActive : null]}
              onPress={() => handleFilterChange('wrong')}
              activeOpacity={0.8}
            >
              <Text style={[s.filterText, activeFilter === 'wrong' ? s.filterTextActive : null]}>
                ✗ Yanlış ({wrongCount})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.filterPill, activeFilter === 'empty' ? s.filterPillActive : null]}
              onPress={() => handleFilterChange('empty')}
              activeOpacity={0.8}
            >
              <Text style={[s.filterText, activeFilter === 'empty' ? s.filterTextActive : null]}>
                ○ Boş ({emptyCount})
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Question Cards */}
        {paginatedQuestions.map((item, idx) => {
          const globalIndex = currentPage * ITEMS_PER_PAGE + idx;
          const isExpanded = expandedId === item.question.id;
          const isEmpty = item.userAnswer === null;
          const borderColor = item.isCorrect ? colors.success : (isEmpty ? colors.warning : colors.error);
          const statusLabel = item.isCorrect ? 'DOĞRU' : (isEmpty ? 'BOŞ' : 'YANLIŞ');
          const statusBg = item.isCorrect ? colors.successGlow : (isEmpty ? colors.warningGlow : colors.errorGlow);
          const statusColor = item.isCorrect ? colors.success : (isEmpty ? colors.warning : colors.error);

          return (
            <TouchableOpacity
              key={`recent-${item.question.id}`}
              onPress={() => toggleExpanded(item.question.id)}
              activeOpacity={0.9}
              style={[s.questionCard, { borderLeftColor: borderColor }]}
            >
              {/* Header */}
              <View style={s.cardHeader}>
                <View style={s.cardBadgeRow}>
                  <View style={s.questionBadge}>
                    <Text style={s.questionNumber}>Soru {globalIndex + 1}</Text>
                  </View>
                  <View style={[s.statusBadge, { backgroundColor: statusBg }]}>
                    <Text style={[s.statusText, { color: statusColor }]}>{statusLabel}</Text>
                  </View>
                </View>
                <Text style={s.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
              </View>

              {/* Question text */}
              <Text style={s.questionText} numberOfLines={isExpanded ? undefined : 2}>
                {item.question.question_text}
              </Text>

              {isExpanded && (
                <View style={s.details}>
                  {/* Answer Badges */}
                  <View style={s.badgeGrid}>
                    {!isEmpty && (
                      <View style={s.badgeGridCol}>
                        <Text style={s.badgeGridLabel}>Senin Seçimin</Text>
                        <View style={[s.answerBadge, { borderColor: item.isCorrect ? colors.success : colors.error }]}>
                          <Text style={[s.answerBadgeText, { color: item.isCorrect ? colors.success : colors.error }]}>
                            {item.userAnswer}) {item.question.options[item.userAnswer as keyof typeof item.question.options]}
                          </Text>
                        </View>
                      </View>
                    )}

                    {!item.isCorrect && (
                      <View style={s.badgeGridCol}>
                        <Text style={s.badgeGridLabel}>Doğru Cevap</Text>
                        <View style={[s.answerBadge, { borderColor: colors.success }]}>
                          <Text style={[s.answerBadgeText, { color: colors.success }]}>
                            {item.question.correct_answer}) {item.question.options[item.question.correct_answer as keyof typeof item.question.options]}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Explanation */}
                  <View style={s.explanationContainer}>
                    <Text style={s.explanationTitle}>💡 Açıklama</Text>
                    <Text style={s.explanationText}>{item.question.rational_explanation}</Text>
                  </View>

                  {/* All Options */}
                  <View style={s.allOptions}>
                    <Text style={s.allOptionsTitle}>Seçenekler</Text>
                    {(['A', 'B', 'C', 'D', 'E'] as const).map((opt) => {
                      const isCorrect = opt === item.question.correct_answer;
                      const isUserWrong = opt === item.userAnswer && !isCorrect;
                      return (
                        <View
                          key={opt}
                          style={[
                            s.optionRow,
                            isCorrect ? s.optionCorrect : null,
                            isUserWrong ? s.optionWrong : null,
                          ]}
                        >
                          <View style={[
                            s.optionBadge,
                            isCorrect ? s.optionBadgeCorrect : null,
                            isUserWrong ? s.optionBadgeWrong : null,
                          ]}>
                            <Text style={[
                              s.optionLabel,
                              isCorrect ? { color: colors.success } : null,
                              isUserWrong ? { color: colors.error } : null,
                            ]}>{opt}</Text>
                          </View>
                          <Text style={[
                            s.optionText,
                            isCorrect ? s.optionTextCorrect : null,
                            isUserWrong ? s.optionTextWrong : null,
                          ]}>{item.question.options[opt]}</Text>
                          {isCorrect && <Text style={s.optionIcon}>✓</Text>}
                          {isUserWrong && <Text style={s.optionIconWrong}>✗</Text>}
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {/* Pagination */}
        {totalPages > 1 && (
          <View style={s.paginationRow}>
            <TouchableOpacity
              style={[s.pageBtn, currentPage === 0 ? s.pageBtnDisabled : null]}
              disabled={currentPage === 0}
              onPress={() => { setCurrentPage(p => p - 1); setExpandedId(null); }}
              activeOpacity={0.7}
            >
              <Text style={s.pageBtnText}>← Önceki</Text>
            </TouchableOpacity>

            <Text style={s.pageInfo}>{currentPage + 1} / {totalPages}</Text>

            <TouchableOpacity
              style={[s.pageBtn, currentPage >= totalPages - 1 ? s.pageBtnDisabled : null]}
              disabled={currentPage >= totalPages - 1}
              onPress={() => { setCurrentPage(p => p + 1); setExpandedId(null); }}
              activeOpacity={0.7}
            >
              <Text style={s.pageBtnText}>Sonraki →</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (colors: AppTheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: '900',
    marginBottom: spacing.sm,
  },
  emptySub: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 20,
  },
  statsCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadow(1, colors.primary),
  },
  statsTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: '900',
    marginBottom: spacing.md,
    letterSpacing: -0.3,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: fontSize.lg,
    fontWeight: '900',
    marginBottom: 2,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xxs + 1,
    fontWeight: '700',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.borderSubtle,
  },
  filterRow: {
    marginBottom: spacing.lg,
  },
  filterScroll: {
    gap: spacing.sm,
  },
  filterPill: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    color: colors.textSecondary,
    fontSize: fontSize.xs + 1,
    fontWeight: '700',
  },
  filterTextActive: {
    color: colors.textInverse,
    fontWeight: '800',
  },
  questionCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderLeftWidth: 3.5,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow(1, colors.primary),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  cardBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  questionBadge: {
    backgroundColor: colors.surfaceHighlight,
    borderRadius: borderRadius.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  questionNumber: {
    color: colors.textPrimary,
    fontSize: fontSize.xxs + 1,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  statusBadge: {
    borderRadius: borderRadius.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: fontSize.xxs + 1,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  expandIcon: {
    color: colors.textMuted,
    fontSize: 10,
  },
  questionText: {
    color: colors.textPrimary,
    fontSize: fontSize.md - 1,
    lineHeight: 22,
    fontWeight: '700',
  },
  details: {
    marginTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: spacing.lg,
  },
  badgeGrid: {
    flexDirection: 'column',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  badgeGridCol: {
    flex: 1,
  },
  badgeGridLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xxs + 1,
    fontWeight: '700',
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  answerBadge: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.md - 2,
  },
  answerBadgeText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  explanationContainer: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  explanationTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  explanationText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
    fontWeight: '500',
  },
  allOptions: {
    marginTop: spacing.xs,
  },
  allOptionsTitle: {
    color: colors.textMuted,
    fontSize: fontSize.xxs + 1,
    fontWeight: '700',
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionCorrect: {
    backgroundColor: colors.successGlow,
    borderColor: colors.success,
  },
  optionWrong: {
    backgroundColor: colors.errorGlow,
    borderColor: colors.error,
  },
  optionBadge: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.xs,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  optionBadgeCorrect: {
    backgroundColor: 'rgba(15, 150, 107, 0.15)',
  },
  optionBadgeWrong: {
    backgroundColor: 'rgba(222, 60, 82, 0.15)',
  },
  optionLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '800',
  },
  optionText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  optionTextCorrect: {
    color: colors.success,
    fontWeight: '800',
  },
  optionTextWrong: {
    color: colors.error,
    fontWeight: '800',
  },
  optionIcon: {
    color: colors.success,
    fontSize: 14,
    fontWeight: '900',
    marginLeft: spacing.sm,
  },
  optionIconWrong: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '900',
    marginLeft: spacing.sm,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
  },
  pageBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
  },
  pageBtnDisabled: {
    opacity: 0.3,
  },
  pageBtnText: {
    color: colors.textPrimary,
    fontSize: fontSize.xs + 1,
    fontWeight: '800',
  },
  pageInfo: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '800',
  },
});
