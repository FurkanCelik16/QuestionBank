import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useTheme, borderRadius, spacing, fontSize } from '../theme/colors';
import { QuizQuestion } from '../types';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface WrongAnswerCardProps {
  question: QuizQuestion;
  userAnswer: string | null;
  index: number;
}

export const WrongAnswerCard: React.FC<WrongAnswerCardProps> = ({
  question,
  userAnswer,
  index,
}) => {
  const [expanded, setExpanded] = useState(false);
  const colors = useTheme();
  const isEmpty = userAnswer === null;

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const s = getStyles(colors);

  return (
    <TouchableOpacity
      onPress={toggleExpanded}
      activeOpacity={0.8}
      style={[
        s.container,
        { borderLeftColor: isEmpty ? colors.warning : colors.error },
      ]}
    >
      {/* Header */}
      <View style={s.header}>
        <View style={s.questionBadge}>
          <Text style={s.questionNumber}>S.{index + 1}</Text>
        </View>
        <View style={s.statusBadge}>
          <Text
            style={[
              s.statusText,
              { color: isEmpty ? colors.warning : colors.error },
            ]}
          >
            {isEmpty ? 'BOŞ' : 'YANLIŞ'}
          </Text>
        </View>
        <Text style={s.expandIcon}>{expanded ? '▲' : '▼'}</Text>
      </View>

      {/* Question text */}
      <Text
        style={s.questionText}
        numberOfLines={expanded ? undefined : 2}
      >
        {question.question_text}
      </Text>

      {expanded && (
        <View style={s.details}>
          {/* User's answer */}
          {!isEmpty && (
            <View style={s.answerRow}>
              <Text style={s.answerLabel}>Senin Cevabın:</Text>
              <View style={s.wrongBadge}>
                <Text style={s.wrongBadgeText}>
                  {userAnswer}) {question.options[userAnswer as keyof typeof question.options]}
                </Text>
              </View>
            </View>
          )}

          {/* Correct answer */}
          <View style={s.answerRow}>
            <Text style={s.answerLabel}>Doğru Cevap:</Text>
            <View style={s.correctBadge}>
              <Text style={s.correctBadgeText}>
                {question.correct_answer}) {question.options[question.correct_answer as keyof typeof question.options]}
              </Text>
            </View>
          </View>

          {/* Explanation */}
          <View style={s.explanationContainer}>
            <Text style={s.explanationTitle}>💡 Açıklama</Text>
            <Text style={s.explanationText}>
              {question.rational_explanation}
            </Text>
          </View>

          {/* All options */}
          <View style={s.allOptions}>
            <Text style={s.allOptionsTitle}>Tüm Şıklar:</Text>
            {(['A', 'B', 'C', 'D', 'E'] as const).map((opt) => {
              const isCorrect = opt === question.correct_answer;
              const isUserWrong = opt === userAnswer && !isCorrect;
              return (
                <View
                  key={opt}
                  style={[
                    s.optionRow,
                    isCorrect && s.optionCorrect,
                    isUserWrong && s.optionWrong,
                  ]}
                >
                  <Text
                    style={[
                      s.optionLabel,
                      isCorrect && { color: colors.success },
                      isUserWrong && { color: colors.error },
                    ]}
                  >
                    {opt})
                  </Text>
                  <Text
                    style={[
                      s.optionText,
                      isCorrect && { color: colors.success },
                      isUserWrong && { color: colors.error },
                    ]}
                  >
                    {question.options[opt]}
                  </Text>
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
};

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  questionBadge: {
    backgroundColor: colors.surfaceHighlight,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginRight: spacing.sm,
  },
  questionNumber: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  statusBadge: {
    flex: 1,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    letterSpacing: 1,
  },
  expandIcon: {
    color: colors.textMuted,
    fontSize: 12,
  },
  questionText: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    lineHeight: 22,
    fontWeight: '500',
  },
  details: {
    marginTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.lg,
  },
  answerRow: {
    marginBottom: spacing.md,
  },
  answerLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '600',
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  wrongBadge: {
    backgroundColor: colors.errorGlow,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.error,
    padding: spacing.sm,
  },
  wrongBadgeText: {
    color: colors.error,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  correctBadge: {
    backgroundColor: colors.successGlow,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.success,
    padding: spacing.sm,
  },
  correctBadgeText: {
    color: colors.success,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  explanationContainer: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  explanationTitle: {
    color: colors.accent,
    fontSize: fontSize.sm,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  explanationText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 22,
  },
  allOptions: {
    marginTop: spacing.xs,
  },
  allOptionsTitle: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: 2,
  },
  optionCorrect: {
    backgroundColor: colors.successGlow,
  },
  optionWrong: {
    backgroundColor: colors.errorGlow,
  },
  optionLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '700',
    width: 24,
  },
  optionText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  optionIcon: {
    color: colors.success,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: spacing.sm,
  },
  optionIconWrong: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: spacing.sm,
  },
});
