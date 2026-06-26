import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, borderRadius, spacing, fontSize, shadow, AppTheme } from '../theme/colors';
import { QuizResult } from '../types';

interface ResultSummaryCardProps {
  result: QuizResult;
}

export const ResultSummaryCard: React.FC<ResultSummaryCardProps> = ({
  result,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;
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
        friction: 7,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();
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
    if (result.scorePercentage >= 80) return 'Mükemmel Başarı';
    if (result.scorePercentage >= 60) return 'Güzel Gelişme';
    if (result.scorePercentage >= 40) return 'Geliştirilebilir';
    return 'Çalışmaya Devam';
  };

  const s = getStyles(colors, getScoreColor());

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
      {/* Score Section - Liquid Glass Circle */}
      <View style={s.scoreSection}>
        <View style={s.scoreGlassOuter}>
          {/* Liquid backing colorful gradient */}
          <LinearGradient
            colors={colors.gradientHero}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          {/* Frosted Glass Floating Disc */}
          <View style={s.scoreGlassDisc}>
            <Text style={s.scoreEmoji}>{getScoreEmoji()}</Text>
            <Text style={s.scoreText}>%{result.scorePercentage}</Text>
          </View>
        </View>
        <Text style={s.scoreMessage}>{getScoreMessage()}</Text>
      </View>

      {/* Flat, minimalist stats row (Warm beige/grey cards) */}
      <View style={s.statsRow}>
        <View style={s.statCard}>
          <View style={s.statHeader}>
            <Text style={[s.statIcon, { color: colors.success }]}>✓</Text>
            <Text style={s.statLabel}>Doğru</Text>
          </View>
          <Text style={[s.statNumber, { color: colors.textPrimary }]}>
            {result.correctCount}
          </Text>
        </View>

        <View style={s.statCard}>
          <View style={s.statHeader}>
            <Text style={[s.statIcon, { color: colors.error }]}>✗</Text>
            <Text style={s.statLabel}>Yanlış</Text>
          </View>
          <Text style={[s.statNumber, { color: colors.textPrimary }]}>
            {result.wrongCount}
          </Text>
        </View>

        <View style={s.statCard}>
          <View style={s.statHeader}>
            <Text style={[s.statIcon, { color: colors.textMuted }]}>○</Text>
            <Text style={s.statLabel}>Boş</Text>
          </View>
          <Text style={[s.statNumber, { color: colors.textPrimary }]}>
            {result.emptyCount}
          </Text>
        </View>
      </View>

      <View style={s.divider} />

      <View style={s.totalRow}>
        <Text style={s.totalLabel}>Toplam Soru Sayısı</Text>
        <Text style={s.totalValue}>{result.totalQuestions}</Text>
      </View>
    </Animated.View>
  );
};

const getStyles = (colors: AppTheme, scoreColor: string) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surfaceElevated,
      borderRadius: borderRadius.xl,
      borderWidth: 1.5,
      borderColor: colors.border,
      padding: spacing.xl,
      marginBottom: spacing.xl,
      ...shadow(2, colors.primary),
    },
    scoreSection: {
      alignItems: 'center',
      marginBottom: spacing.xl,
    },
    scoreGlassOuter: {
      width: 130,
      height: 130,
      borderRadius: 65,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      ...shadow(4),
    },
    scoreGlassDisc: {
      width: 114,
      height: 114,
      borderRadius: 57,
      backgroundColor: colors.glassBackground,
      borderWidth: 1.5,
      borderColor: colors.glassBorder,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: 'transparent',
    },
    scoreEmoji: {
      fontSize: 26,
      marginBottom: spacing.xs - 2,
    },
    scoreText: {
      fontSize: fontSize.xxl - 2,
      fontWeight: '900',
      color: colors.textPrimary,
      letterSpacing: -0.5,
    },
    scoreMessage: {
      color: colors.textPrimary,
      fontSize: fontSize.md,
      fontWeight: '800',
      marginTop: spacing.md,
      letterSpacing: -0.2,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
      gap: spacing.md,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.backgroundAlt,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    statHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginBottom: spacing.xs,
    },
    statIcon: {
      fontSize: fontSize.sm,
      fontWeight: '900',
    },
    statLabel: {
      color: colors.textSecondary,
      fontSize: fontSize.xs,
      fontWeight: '700',
    },
    statNumber: {
      fontSize: fontSize.xl - 2,
      fontWeight: '900',
    },
    divider: {
      height: 1,
      backgroundColor: colors.borderSubtle,
      marginVertical: spacing.md - 2,
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: spacing.xs,
    },
    totalLabel: {
      color: colors.textMuted,
      fontSize: fontSize.sm,
      fontWeight: '600',
    },
    totalValue: {
      color: colors.textPrimary,
      fontSize: fontSize.md - 1,
      fontWeight: '800',
    },
  });
