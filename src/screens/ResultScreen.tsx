import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, borderRadius, spacing, fontSize } from '../theme/colors';
import { useQuizStore } from '../store/useQuizStore';
import { ResultSummaryCard } from '../components/ResultSummaryCard';
import { WrongAnswerCard } from '../components/WrongAnswerCard';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Result'>;
  route: RouteProp<RootStackParamList, 'Result'>;
};

export const ResultScreen: React.FC<Props> = ({ navigation, route }) => {
  const colors = useTheme();
  const { getResults, resetQuizKeepTopics } = useQuizStore();
  
  const pastResult = route.params?.pastResult;
  const result = pastResult ? pastResult.result : getResults();

  const handleAction = () => {
    if (pastResult) {
      navigation.goBack();
    } else {
      resetQuizKeepTopics(); // Preserve selected topics for retake
      navigation.popToTop();
    }
  };

  const hasWrongOrEmpty = result.wrongAnswers.length > 0 || result.emptyAnswers.length > 0;
  const s = getStyles(colors);

  return (
    <SafeAreaView style={s.container} edges={['bottom']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.content}
      >
        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>Test Sonucu</Text>
          <Text style={s.headerSub}>
            {result.totalQuestions} sorudan {result.correctCount} doğru cevap
          </Text>
        </View>

        {/* Summary Card */}
        <ResultSummaryCard result={result} />

        {/* Wrong & Empty Section */}
        {hasWrongOrEmpty && (
          <View style={s.analysisSection}>
            <Text style={s.sectionTitle}>📋 Yanlış ve Boş Analizi</Text>
            <Text style={s.sectionSub}>
              Detayları görmek için soruya dokunun
            </Text>

            {/* Wrong answers */}
            {result.wrongAnswers.map((item, index) => (
              <WrongAnswerCard
                key={`wrong-${item.question.id}`}
                question={item.question}
                userAnswer={item.userAnswer}
                index={index}
              />
            ))}

            {/* Empty answers */}
            {result.emptyAnswers.map((item, index) => (
              <WrongAnswerCard
                key={`empty-${item.question.id}`}
                question={item.question}
                userAnswer={null}
                index={result.wrongAnswers.length + index}
              />
            ))}
          </View>
        )}

        {/* No mistakes */}
        {!hasWrongOrEmpty && (
          <View style={s.perfectCard}>
            <Text style={s.perfectEmoji}>🏆</Text>
            <Text style={s.perfectTitle}>Tam Puan!</Text>
            <Text style={s.perfectSub}>
              Tüm soruları doğru cevapladın. Harika bir performans!
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom button */}
      <View style={s.bottom}>
        <TouchableOpacity
          style={s.newQuizBtn}
          onPress={handleAction}
          activeOpacity={0.8}
        >
          <Text style={s.newQuizBtnText}>
            {pastResult ? '← Geri Dön' : '🔄 Yeni Test Oluştur'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xxl, paddingBottom: spacing.xxxl },
  header: { marginBottom: spacing.xl },
  headerTitle: { color: colors.textPrimary, fontSize: fontSize.xxxl, fontWeight: '800' },
  headerSub: { color: colors.textSecondary, fontSize: fontSize.md, marginTop: spacing.xs },
  analysisSection: { marginTop: spacing.md },
  sectionTitle: { color: colors.textPrimary, fontSize: fontSize.xl, fontWeight: '700', marginBottom: spacing.xs },
  sectionSub: { color: colors.textMuted, fontSize: fontSize.sm, marginBottom: spacing.lg },
  perfectCard: {
    backgroundColor: colors.successGlow, borderRadius: borderRadius.xl,
    borderWidth: 1, borderColor: colors.success, padding: spacing.xxxl,
    alignItems: 'center', marginTop: spacing.xl,
  },
  perfectEmoji: { fontSize: 56, marginBottom: spacing.md },
  perfectTitle: { color: colors.success, fontSize: fontSize.xxl, fontWeight: '800', marginBottom: spacing.sm },
  perfectSub: { color: colors.textSecondary, fontSize: fontSize.md, textAlign: 'center', lineHeight: 22 },
  bottom: {
    paddingHorizontal: spacing.xxl, paddingVertical: spacing.lg,
    borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface,
  },
  newQuizBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.lg, paddingVertical: spacing.lg, alignItems: 'center' },
  newQuizBtnText: { color: colors.textInverse, fontSize: fontSize.lg, fontWeight: '700' },
});
