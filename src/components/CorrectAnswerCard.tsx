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
import { useTheme, borderRadius, spacing, fontSize, shadow, AppTheme } from '../theme/colors';
import { QuizQuestion } from '../types';
import { SvgXml } from 'react-native-svg';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface CorrectAnswerCardProps {
  question: QuizQuestion;
  userAnswer: string;
  index: number;
}

export const CorrectAnswerCard: React.FC<CorrectAnswerCardProps> = ({
  question,
  userAnswer,
  index,
}) => {
  const [expanded, setExpanded] = useState(false);
  const colors = useTheme();

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const s = getStyles(colors);

  return (
    <TouchableOpacity
      onPress={toggleExpanded}
      activeOpacity={0.9}
      style={s.container}
    >
      {/* Header */}
      <View style={s.header}>
        <View style={s.badgeRow}>
          <View style={s.questionBadge}>
            <Text style={s.questionNumber}>Soru {index + 1}</Text>
          </View>
          <View style={s.statusBadge}>
            <Text style={s.statusText}>DOĞRU</Text>
          </View>
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
          {/* Answer Badge */}
          <View style={s.badgeGrid}>
            <View style={s.badgeGridCol}>
              <Text style={s.badgeGridLabel}>Senin Seçimin ✓</Text>
              <View style={s.correctBadge}>
                <Text style={s.correctBadgeText}>
                  {userAnswer}) {question.options[userAnswer as keyof typeof question.options]}
                </Text>
              </View>
            </View>
          </View>

          {/* Explanation Section */}
          <View style={s.explanationContainer}>
            <View style={s.explanationTitleRow}>
              <Text style={s.explanationTitle}>💡 Açıklama ve Çözüm</Text>
            </View>
            <Text style={s.explanationText}>
              {question.rational_explanation}
            </Text>

            {/* Mind Map Section */}
            {question.mind_map_svg && question.mind_map_svg.trim().length > 0 && (
              <View style={s.mindMapContainer}>
                <Text style={s.mindMapTitle}>🧠 AI Kavramsal Akıl Haritası</Text>
                <View style={s.mindMapXmlWrapper}>
                  <SvgXml xml={question.mind_map_svg} width="100%" height={140} />
                </View>
              </View>
            )}
          </View>

          {/* All Options list */}
          <View style={s.allOptions}>
            <Text style={s.allOptionsTitle}>Seçeneklerin Tamamı</Text>
            {(['A', 'B', 'C', 'D', 'E'] as const).map((opt) => {
              const isCorrect = opt === question.correct_answer;
              return (
                <View
                  key={opt}
                  style={[
                    s.optionRow,
                    isCorrect && s.optionCorrect,
                  ]}
                >
                  <View
                    style={[
                      s.optionBadge,
                      isCorrect && s.optionBadgeCorrect,
                    ]}
                  >
                    <Text
                      style={[
                        s.optionLabel,
                        isCorrect && { color: colors.success },
                      ]}
                    >
                      {opt}
                    </Text>
                  </View>
                  <Text
                    style={[
                      s.optionText,
                      isCorrect && s.optionTextCorrect,
                    ]}
                  >
                    {question.options[opt]}
                  </Text>
                  {isCorrect && <Text style={s.optionIcon}>✓</Text>}
                </View>
              );
            })}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const getStyles = (colors: AppTheme) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surfaceElevated,
      borderRadius: borderRadius.md,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderLeftWidth: 3.5,
      borderLeftColor: colors.success,
      padding: spacing.lg,
      marginBottom: spacing.md,
      ...shadow(1, colors.primary),
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    badgeRow: {
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
      backgroundColor: colors.successGlow,
      borderRadius: borderRadius.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
    },
    statusText: {
      color: colors.success,
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
    correctBadge: {
      backgroundColor: colors.backgroundAlt,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md - 2,
    },
    correctBadgeText: {
      color: colors.success,
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
    explanationTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginBottom: spacing.xs,
    },
    explanationTitle: {
      color: colors.textPrimary,
      fontSize: fontSize.sm,
      fontWeight: '800',
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
    optionIcon: {
      color: colors.success,
      fontSize: 14,
      fontWeight: '900',
      marginLeft: spacing.sm,
    },
    mindMapContainer: {
      marginTop: spacing.md,
      backgroundColor: colors.background || '#0f172a',
      borderRadius: borderRadius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    mindMapTitle: {
      color: colors.textPrimary,
      fontSize: fontSize.xxs + 1,
      fontWeight: '800',
      marginBottom: spacing.sm,
      letterSpacing: -0.2,
    },
    mindMapXmlWrapper: {
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      borderRadius: borderRadius.sm,
    },
  });
