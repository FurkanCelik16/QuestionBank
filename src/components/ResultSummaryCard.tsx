import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme, borderRadius, spacing, fontSize } from '../theme/colors';
import { QuizResult } from '../types';

interface ResultSummaryCardProps {
  result: QuizResult;
}

export const ResultSummaryCard: React.FC<ResultSummaryCardProps> = ({
  result,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const scoreAnim = useRef(new Animated.Value(0)).current;
  const colors = useTheme();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(scoreAnim, {
      toValue: result.scorePercentage,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, []);

  const getScoreColor = () => {
    if (result.scorePercentage >= 70) return colors.success;
    if (result.scorePercentage >= 40) return colors.warning;
    return colors.error;
  };

  const getScoreEmoji = () => {
    if (result.scorePercentage >= 80) return '🌟';
    if (result.scorePercentage >= 60) return '💪';
    if (result.scorePercentage >= 40) return '📚';
    return '🔄';
  };

  const getScoreMessage = () => {
    if (result.scorePercentage >= 80) return 'Mükemmel!';
    if (result.scorePercentage >= 60) return 'İyi gidiyorsun!';
    if (result.scorePercentage >= 40) return 'Geliştirebilirsin!';
    return 'Daha çok çalışmalısın!';
  };

  const s = getStyles(colors);

  return (
    <Animated.View
      style={[
        s.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {/* Score circle */}
      <View style={s.scoreSection}>
        <View
          style={[
            s.scoreCircle,
            { borderColor: getScoreColor() },
          ]}
        >
          <Text style={s.scoreEmoji}>{getScoreEmoji()}</Text>
          <Text
            style={[s.scoreText, { color: getScoreColor() }]}
          >
            %{result.scorePercentage}
          </Text>
        </View>
        <Text style={s.scoreMessage}>{getScoreMessage()}</Text>
      </View>

      {/* Stats row */}
      <View style={s.statsRow}>
        <View style={[s.statCard, { backgroundColor: colors.successGlow }]}>
          <Text style={[s.statNumber, { color: colors.success }]}>
            {result.correctCount}
          </Text>
          <Text style={s.statLabel}>Doğru</Text>
          <Text style={[s.statIcon]}>✓</Text>
        </View>

        <View style={[s.statCard, { backgroundColor: colors.errorGlow }]}>
          <Text style={[s.statNumber, { color: colors.error }]}>
            {result.wrongCount}
          </Text>
          <Text style={s.statLabel}>Yanlış</Text>
          <Text style={[s.statIcon]}>✗</Text>
        </View>

        <View style={[s.statCard, { backgroundColor: colors.warningGlow }]}>
          <Text style={[s.statNumber, { color: colors.warning }]}>
            {result.emptyCount}
          </Text>
          <Text style={s.statLabel}>Boş</Text>
          <Text style={[s.statIcon]}>○</Text>
        </View>
      </View>

      <View style={s.totalRow}>
        <Text style={s.totalLabel}>Toplam Soru</Text>
        <Text style={s.totalValue}>{result.totalQuestions}</Text>
      </View>
    </Animated.View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xxl,
    marginBottom: spacing.xl,
  },
  scoreSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceLight,
    marginBottom: spacing.md,
  },
  scoreEmoji: {
    fontSize: 28,
    marginBottom: 2,
  },
  scoreText: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
  },
  scoreMessage: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  statNumber: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: '500',
    marginTop: 2,
  },
  statIcon: {
    fontSize: 16,
    color: colors.textMuted,
    marginTop: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.lg,
  },
  totalLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  totalValue: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
});
