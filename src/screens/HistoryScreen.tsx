// ========================================
// History Screen
// View overall stats and past quiz results
// ========================================

import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, borderRadius, spacing, fontSize } from '../theme/colors';
import { useHistoryStore } from '../store/useHistoryStore';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, TestHistoryItem, DifficultyLevel } from '../types';

const DIFF_LABELS: Record<DifficultyLevel, string> = {
  easy: '😊 Kolay',
  medium: '🎯 Orta',
  hard: '🔥 Zor',
  extreme: '💀 Uzman',
};

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'History'>;
};

export const HistoryScreen: React.FC<Props> = ({ navigation }) => {
  const colors = useTheme();
  const { history, solvedWrongIds } = useHistoryStore();

  const wrongQuestionsCount = history.reduce<number[]>((acc, curr) => {
    curr.result.wrongAnswers.forEach(wa => {
      if (!acc.includes(wa.question.id) && !solvedWrongIds.includes(wa.question.id)) {
        acc.push(wa.question.id);
      }
    });
    return acc;
  }, []).length;

  const totalTests = history.length;
  const totalQuestions = history.reduce((acc, curr) => acc + curr.result.totalQuestions, 0);
  const totalCorrect = history.reduce((acc, curr) => acc + curr.result.correctCount, 0);
  const avgScore = totalTests > 0 
    ? Math.round(history.reduce((acc, curr) => acc + curr.result.scorePercentage, 0) / totalTests)
    : 0;

  const handleTestPress = (item: TestHistoryItem) => {
    navigation.navigate('Result', { pastResult: item });
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const s = getStyles(colors);

  const renderItem = ({ item }: { item: TestHistoryItem }) => (
    <TouchableOpacity
      style={s.historyCard}
      activeOpacity={0.7}
      onPress={() => handleTestPress(item)}
    >
      <View style={s.cardHeader}>
        <Text style={s.cardDate}>{formatDate(item.date)}</Text>
        <View style={s.scoreBadge}>
          <Text style={s.scoreText}>%{item.result.scorePercentage}</Text>
        </View>
      </View>
      <Text style={s.topicsText} numberOfLines={2}>
        {item.topics.join(', ')}
      </Text>
      <View style={s.statsRow}>
        <Text style={s.statText}>{DIFF_LABELS[item.difficulty] || '🎯 Orta'}</Text>
        <Text style={s.statText}>📝 {item.result.totalQuestions} Soru</Text>
        <Text style={[s.statText, { color: colors.success }]}>✓ {item.result.correctCount} D</Text>
        <Text style={[s.statText, { color: colors.error }]}>✗ {item.result.wrongCount} Y</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={s.container} edges={['bottom']}>
      <View style={s.header}>
        <Text style={s.headerTitle}>İstatistiklerim</Text>
      </View>

      <View style={s.overviewCard}>
        <View style={s.overviewRow}>
          <View style={s.overviewItem}>
            <Text style={s.overviewValue}>{totalTests}</Text>
            <Text style={s.overviewLabel}>Test Çözüldü</Text>
          </View>
          <View style={s.divider} />
          <View style={s.overviewItem}>
            <Text style={s.overviewValue}>%{avgScore}</Text>
            <Text style={s.overviewLabel}>Ortalama Başarı</Text>
          </View>
        </View>
        <View style={[s.overviewRow, s.overviewRowBottom]}>
          <View style={s.overviewItem}>
            <Text style={s.overviewValue}>{totalQuestions}</Text>
            <Text style={s.overviewLabel}>Soru Görüldü</Text>
          </View>
          <View style={s.divider} />
          <View style={s.overviewItem}>
            <Text style={[s.overviewValue, { color: colors.success }]}>{totalCorrect}</Text>
            <Text style={s.overviewLabel}>Toplam Doğru</Text>
          </View>
        </View>
      </View>

      {/* Hata Defteri Button */}
      <TouchableOpacity
        style={[s.mistakeBtn, wrongQuestionsCount === 0 && s.mistakeBtnDisabled]}
        onPress={() => wrongQuestionsCount > 0 && navigation.navigate('MistakeResolver')}
        activeOpacity={0.8}
        disabled={wrongQuestionsCount === 0}
      >
        <Text style={s.mistakeBtnText}>📓 Hata Defterini Çöz</Text>
        <View style={[s.mistakeBadge, { backgroundColor: wrongQuestionsCount === 0 ? colors.surfaceHighlight : colors.warningGlow }]}>
          <Text style={[s.mistakeBadgeText, { color: wrongQuestionsCount > 0 ? colors.warning : colors.success }]}>
            {wrongQuestionsCount > 0 ? `${wrongQuestionsCount} Yanlış sorunuz var` : 'Temiz ✓'}
          </Text>
        </View>
      </TouchableOpacity>

      <Text style={s.listTitle}>Geçmiş Testler ({totalTests})</Text>

      {totalTests === 0 ? (
        <View style={s.emptyState}>
          <Text style={s.emptyEmoji}>📭</Text>
          <Text style={s.emptyText}>Henüz hiç test çözmediniz.</Text>
          <Text style={s.emptySubtext}>Test çözdükçe istatistiklerinizi burada görebilirsiniz.</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.xxl, paddingTop: spacing.md, paddingBottom: spacing.lg },
  headerTitle: { color: colors.textPrimary, fontSize: fontSize.xxl, fontWeight: '800' },
  mistakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.xxl,
    backgroundColor: colors.surface,
    borderColor: colors.warning,
    borderWidth: 1.5,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    marginBottom: spacing.xl,
  },
  mistakeBtnDisabled: {
    borderColor: colors.border,
    opacity: 0.8,
  },
  mistakeBtnText: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  mistakeBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  mistakeBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: '800',
  },
  overviewCard: {
    marginHorizontal: spacing.xxl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  overviewRow: {
    flexDirection: 'row',
    paddingVertical: spacing.lg,
  },
  overviewRowBottom: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  overviewItem: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    backgroundColor: colors.border,
  },
  overviewValue: {
    color: colors.textPrimary,
    fontSize: fontSize.xxl,
    fontWeight: '800',
    marginBottom: 4,
  },
  overviewLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  listTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginHorizontal: spacing.xxl,
    marginBottom: spacing.md,
  },
  listContent: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  historyCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardDate: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  scoreBadge: {
    backgroundColor: colors.primaryGlow,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  scoreText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  topicsText: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  statText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxxl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
});
