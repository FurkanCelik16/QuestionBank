import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, borderRadius, spacing, fontSize, shadow, AppTheme } from '../theme/colors';
import { useHistoryStore } from '../store/useHistoryStore';
import { normalizeTurkish } from '../store/useSettingsStore';
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

  const questionsSolvedToday = history.reduce((acc, curr) => {
    const testDate = new Date(curr.date);
    const today = new Date();
    const isToday = testDate.getDate() === today.getDate() &&
                    testDate.getMonth() === today.getMonth() &&
                    testDate.getFullYear() === today.getFullYear();
    return isToday ? acc + curr.result.totalQuestions : acc;
  }, 0);

  const activeDays = new Set(history.map(item => {
    const d = new Date(item.date);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  })).size;

  const dailyAverageQuestions = activeDays > 0
    ? Math.round(totalQuestions / activeDays)
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

  // Zayıf yön analizi hesaplama
  const subtopicStats = React.useMemo(() => {
    const stats: Record<string, { subtopic: string; wrongCount: number; totalCount: number; parentTopics: Set<string> }> = {};

    history.forEach(test => {
      if (!test.questions) return;
      
      const wrongIds = new Set(test.result.wrongAnswers.map(wa => wa.question.id));

      test.questions.forEach(q => {
        const sub = q.subtopic || '';
        const cleanedSub = normalizeTurkish(sub);
        if (!cleanedSub || cleanedSub.length < 3) return;

        if (!stats[cleanedSub]) {
          stats[cleanedSub] = {
            subtopic: sub,
            wrongCount: 0,
            totalCount: 0,
            parentTopics: new Set<string>(),
          };
        }

        stats[cleanedSub].totalCount++;
        test.topics.forEach(t => stats[cleanedSub].parentTopics.add(t));

        if (wrongIds.has(q.id)) {
          stats[cleanedSub].wrongCount++;
        }
      });
    });

    return Object.values(stats)
      .map(item => ({
        subtopic: item.subtopic,
        wrongCount: item.wrongCount,
        totalCount: item.totalCount,
        failureRate: item.totalCount > 0 ? (item.wrongCount / item.totalCount) : 0,
        parentTopics: Array.from(item.parentTopics),
      }))
      .filter(item => item.wrongCount > 0)
      .sort((a, b) => b.failureRate - a.failureRate || b.wrongCount - a.wrongCount)
      .slice(0, 5);
  }, [history]);

  const startWeaknessQuiz = () => {
    if (subtopicStats.length === 0) return;

    const selectedTopics = Array.from(new Set(subtopicStats.flatMap(s => s.parentTopics)));
    const focusSubtopics = subtopicStats.map(s => s.subtopic);

    const finalTopics = selectedTopics.length > 0 
      ? selectedTopics 
      : Array.from(new Set(history.flatMap(h => h.topics)));

    // Direct navigation to Loading Screen with parameters
    navigation.navigate('Loading', {
      selectedTopics: finalTopics,
      questionCount: 10,
      difficulty: 'medium',
      focusSubtopics: focusSubtopics,
    });
  };

  const s = getStyles(colors);

  const renderItem = ({ item }: { item: TestHistoryItem }) => {
    const isHigh = item.result.scorePercentage >= 70;
    const isMedium = item.result.scorePercentage >= 40 && item.result.scorePercentage < 70;
    const cardAccentColor = isHigh ? colors.success : isMedium ? colors.warning : colors.error;
    const cardGlowColor = isHigh ? colors.successGlow : isMedium ? colors.warningGlow : colors.errorGlow;

    return (
      <TouchableOpacity
        style={[s.historyCard, { borderLeftColor: cardAccentColor }]}
        activeOpacity={0.9}
        onPress={() => handleTestPress(item)}
      >
        <View style={s.cardHeader}>
          <Text style={s.cardDate}>{formatDate(item.date)}</Text>
          <View style={[s.scoreBadge, { backgroundColor: cardGlowColor }]}>
            <Text style={[s.scoreText, { color: cardAccentColor }]}>%{item.result.scorePercentage}</Text>
          </View>
        </View>
        
        <Text style={s.topicsText} numberOfLines={2}>
          {item.topics.join(', ')}
        </Text>
        
        <View style={s.cardDivider} />

        <View style={s.statsRow}>
          <Text style={s.statText}>{DIFF_LABELS[item.difficulty] || '🎯 Orta'}</Text>
          <Text style={s.statDotSeparator}>•</Text>
          <Text style={s.statText}>📝 {item.result.totalQuestions} Soru</Text>
          <Text style={s.statDotSeparator}>•</Text>
          <Text style={[s.statText, { color: colors.success }]}>✓ {item.result.correctCount} D</Text>
          <Text style={s.statDotSeparator}>•</Text>
          <Text style={[s.statText, { color: colors.error }]}>✗ {item.result.wrongCount} Y</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.container} edges={['bottom']}>
      {/* Title */}
      <View style={s.header}>
        <Text style={s.headerTitle}>İstatistiklerim</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        {/* Dashboard Stat Board */}
        <View style={s.overviewCard}>
          <View style={s.overviewRow}>
            <View style={s.overviewItem}>
              <Text style={s.overviewValue}>{totalTests}</Text>
              <Text style={s.overviewLabel}>Çözülen Test</Text>
            </View>
            <View style={s.divider} />
            <View style={s.overviewItem}>
              <Text style={[s.overviewValue, { color: colors.textPrimary }]}>%{avgScore}</Text>
              <Text style={s.overviewLabel}>Ort. Başarı</Text>
            </View>
          </View>
          
          <View style={s.cardDivider} />

          <View style={s.overviewRow}>
            <View style={s.overviewItem}>
              <Text style={s.overviewValue}>{totalQuestions}</Text>
              <Text style={s.overviewLabel}>Görülen Soru</Text>
            </View>
            <View style={s.divider} />
            <View style={s.overviewItem}>
              <Text style={[s.overviewValue, { color: colors.success }]}>{totalCorrect}</Text>
              <Text style={s.overviewLabel}>Toplam Doğru</Text>
            </View>
          </View>
          
          <View style={s.cardDivider} />

          <View style={s.overviewRow}>
            <View style={s.overviewItem}>
              <Text style={[s.overviewValue, { color: colors.warning }]}>{questionsSolvedToday}</Text>
              <Text style={s.overviewLabel}>Bugün Çözülen</Text>
            </View>
            <View style={s.divider} />
            <View style={s.overviewItem}>
              <Text style={[s.overviewValue, { color: colors.textPrimary }]}>{dailyAverageQuestions}</Text>
              <Text style={s.overviewLabel}>Günlük Ort.</Text>
            </View>
          </View>
        </View>

        {/* Minimalist Hata Defteri Button Card */}
        <TouchableOpacity
          style={[
            s.mistakeBtn, 
            wrongQuestionsCount === 0 && s.mistakeBtnDisabled,
            wrongQuestionsCount > 0 && s.mistakeBtnActive
          ]}
          onPress={() => wrongQuestionsCount > 0 && navigation.navigate('MistakeResolver')}
          activeOpacity={0.9}
          disabled={wrongQuestionsCount === 0}
        >
          <View style={s.mistakeBtnLeft}>
            <Text style={s.mistakeEmoji}>📓</Text>
            <Text style={[
              s.mistakeBtnText, 
              wrongQuestionsCount > 0 && { color: colors.warningDark }
            ]}>
              Hata Defterini Çöz
            </Text>
          </View>
          <View style={[
            s.mistakeBadge, 
            { backgroundColor: wrongQuestionsCount === 0 ? colors.backgroundAlt : colors.warningGlow }
          ]}>
            <Text style={[
              s.mistakeBadgeText, 
              { color: wrongQuestionsCount > 0 ? colors.warningDark : colors.success }
            ]}>
              {wrongQuestionsCount > 0 ? `${wrongQuestionsCount} Hatalı Soru` : 'Kusursuz ✓'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Zayıf Yön Analizi Bölümü */}
        {subtopicStats.length > 0 && (
          <View style={s.weaknessCard}>
            <View style={s.weaknessHeader}>
              <Text style={s.weaknessTitle}>Zayıf Olduğun Konular 📉</Text>
              <Text style={s.weaknessDesc}>
                Son testlerde en çok hata yaptığın mikro konu başlıkları. Yapay zeka ile bu konulara özel takviye testi oluşturabilirsin.
              </Text>
            </View>

            <View style={s.weaknessList}>
              {subtopicStats.map((item, index) => {
                const percent = Math.round(item.failureRate * 100);
                return (
                  <View key={index} style={s.weaknessItem}>
                    <View style={s.weaknessTextRow}>
                      <Text style={s.weaknessSubtopic} numberOfLines={1}>
                        🎯 {item.subtopic}
                      </Text>
                      <Text style={[s.weaknessRatio, { color: percent >= 75 ? colors.error : colors.warning }]}>
                        %{percent} Hata ({item.wrongCount}/{item.totalCount})
                      </Text>
                    </View>
                    
                    <View style={s.progressBarBackground}>
                      <View 
                        style={[
                          s.progressBarFill, 
                          { 
                            width: `${percent}%`,
                            backgroundColor: percent >= 75 ? colors.error : colors.warning 
                          }
                        ]} 
                      />
                    </View>
                  </View>
                );
              })}
            </View>

            <TouchableOpacity 
              style={s.weaknessBtn} 
              onPress={startWeaknessQuiz}
              activeOpacity={0.8}
            >
              <Text style={s.weaknessBtnText}>Zayıf Yön Takviye Testi Başlat ⚡</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* History List Title */}
        <Text style={s.listTitle}>Geçmiş Testler ({totalTests})</Text>

        {totalTests === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyEmoji}>📬</Text>
            <Text style={s.emptyText}>Henüz sınav çözülmemiş</Text>
            <Text style={s.emptySubtext}>Yapay zeka ile sınavlar hazırlayıp çözdükçe başarı geçmişiniz burada listelenecektir.</Text>
          </View>
        ) : (
          <View style={s.listWrapper}>
            {history.map((item) => (
              <React.Fragment key={item.id}>
                {renderItem({ item })}
              </React.Fragment>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (colors: AppTheme) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
  scrollContent: {
    paddingBottom: spacing.xxxl,
  },
  header: { 
    paddingHorizontal: spacing.xxl, 
    paddingTop: spacing.md, 
    paddingBottom: spacing.sm 
  },
  headerTitle: { 
    color: colors.textPrimary, 
    fontSize: fontSize.xxl - 1, 
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  mistakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.xxl,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    marginBottom: spacing.xl,
    height: 54,
    ...shadow(1, colors.primary),
  },
  mistakeBtnActive: {
    borderColor: colors.warningDark,
    backgroundColor: colors.surfaceElevated,
  },
  mistakeBtnDisabled: {
    opacity: 0.5,
    borderColor: colors.borderSubtle,
    shadowOpacity: 0,
    elevation: 0,
  },
  mistakeBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  mistakeEmoji: {
    fontSize: 18,
  },
  mistakeBtnText: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: '800',
  },
  mistakeBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: borderRadius.sm,
  },
  mistakeBadgeText: {
    fontSize: fontSize.xxs + 1,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  overviewCard: {
    marginHorizontal: spacing.xxl,
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: spacing.xl,
    paddingVertical: spacing.xs,
    ...shadow(1, colors.primary),
  },
  overviewRow: {
    flexDirection: 'row',
    paddingVertical: spacing.md - 2,
  },
  overviewItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    width: 1,
    backgroundColor: colors.borderSubtle,
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
  },
  overviewValue: {
    color: colors.textPrimary,
    fontSize: fontSize.xl - 2,
    fontWeight: '900',
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  overviewLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xxs + 1,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  listTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: '800',
    marginHorizontal: spacing.xxl,
    marginBottom: spacing.md,
    letterSpacing: -0.2,
  },
  listWrapper: {
    paddingHorizontal: spacing.xxl,
    gap: spacing.md,
  },
  historyCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderLeftWidth: 3.5,
    padding: spacing.xl - 4,
    ...shadow(1, colors.primary),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardDate: {
    color: colors.textMuted,
    fontSize: fontSize.xs - 1,
    fontWeight: '700',
  },
  scoreBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  scoreText: {
    fontSize: fontSize.xs - 1,
    fontWeight: '800',
  },
  topicsText: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: '700',
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  statText: {
    color: colors.textSecondary,
    fontSize: fontSize.xs - 1,
    fontWeight: '700',
  },
  statDotSeparator: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginHorizontal: spacing.xs,
    fontWeight: '900',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxxl,
    marginTop: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    color: colors.textMuted,
    fontSize: fontSize.xs + 1,
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '600',
  },
  weaknessCard: {
    marginHorizontal: spacing.xxl,
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: spacing.xl,
    padding: spacing.xl - 4,
    ...shadow(1, colors.primary),
  },
  weaknessHeader: {
    marginBottom: spacing.md,
  },
  weaknessTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  weaknessDesc: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '600',
    lineHeight: 16,
  },
  weaknessList: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  weaknessItem: {
    gap: 6,
  },
  weaknessTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weaknessSubtopic: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fontSize.sm - 1,
    fontWeight: '700',
  },
  weaknessRatio: {
    color: colors.textSecondary,
    fontSize: fontSize.xs - 1,
    fontWeight: '700',
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: colors.borderSubtle,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  weaknessBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    ...shadow(1, colors.primary),
  },
  weaknessBtnText: {
    color: colors.textOnPrimary,
    fontSize: fontSize.sm,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
});
