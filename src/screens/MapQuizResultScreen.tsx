import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, borderRadius, spacing, fontSize } from '../theme/colors';
import { useMapQuizStore } from '../store/useMapQuizStore';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MapQuizResult'>;
};

export const MapQuizResultScreen: React.FC<Props> = ({ navigation }) => {
  const colors = useTheme();
  const { score, questions, userAnswers, resetQuiz } = useMapQuizStore();

  const total = questions.length;
  const percentage = Math.round((score / total) * 100);

  const handleFinish = () => {
    resetQuiz();
    // Topic selection içinde tab olarak ekleneceği için şimdilik MapQuizHome'a değil, 
    // stack'in başına dönelim veya TopicSelection'a gidelim
    navigation.navigate('TopicSelection');
  };

  const handleRetry = () => {
    resetQuiz();
    navigation.replace('MapQuizHome');
  };

  let emoji = '😐';
  let message = 'Daha çok çalışmalısın.';
  
  if (percentage === 100) { emoji = '🏆'; message = 'Mükemmel! Haritaların efendisi sensin.'; }
  else if (percentage >= 80) { emoji = '🔥'; message = 'Harika iş! Coğrafyan çok iyi.'; }
  else if (percentage >= 50) { emoji = '👍'; message = 'Fena değil, ama biraz daha pratik gerek.'; }

  const s = getStyles(colors);

  return (
    <SafeAreaView style={s.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        <View style={s.headerCard}>
          <Text style={s.emoji}>{emoji}</Text>
          <Text style={s.percentage}>%{percentage} Başarı</Text>
          <Text style={s.message}>{message}</Text>
          
          <View style={s.statsRow}>
            <View style={s.statBox}>
              <Text style={[s.statVal, { color: colors.success }]}>{score}</Text>
              <Text style={s.statLabel}>Doğru</Text>
            </View>
            <View style={s.statBox}>
              <Text style={[s.statVal, { color: colors.error }]}>{total - score}</Text>
              <Text style={s.statLabel}>Yanlış/Boş</Text>
            </View>
          </View>
        </View>

        <Text style={s.sectionTitle}>📋 Cevap Özeti</Text>
        
        {questions.map((q, idx) => {
          const uAns = userAnswers[q.id];
          const isCorrect = uAns === q.correct_answer;
          
          return (
            <View key={q.id} style={[s.answerCard, isCorrect ? s.cardCorrect : s.cardWrong]}>
              <Text style={s.qNumber}>Soru {idx + 1}</Text>
              <Text style={s.targetName}>{q.targetName}</Text>
              
              <View style={s.answerRow}>
                <Text style={s.userAnsLabel}>Senin Cevabın:</Text>
                <Text style={[s.userAnsVal, isCorrect ? s.valCorrect : s.valWrong]}>
                  {uAns && uAns !== 'TIMEOUT' ? q.options[uAns as 'A'|'B'|'C'|'D'] : 'Boş Bırakıldı'}
                </Text>
              </View>
              
              {!isCorrect && (
                <View style={s.answerRow}>
                  <Text style={s.userAnsLabel}>Doğru Cevap:</Text>
                  <Text style={[s.userAnsVal, s.valCorrect]}>{q.options[q.correct_answer]}</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity style={s.retryBtn} onPress={handleRetry}>
          <Text style={s.retryBtnText}>🔄 Tekrar Oyna</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.finishBtn} onPress={handleFinish}>
          <Text style={s.finishBtnText}>Ana Menü</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xxl },
  
  headerCard: { backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.xxxl, alignItems: 'center', marginBottom: spacing.xl, borderWidth: 1, borderColor: colors.border },
  emoji: { fontSize: 64, marginBottom: spacing.sm },
  percentage: { fontSize: fontSize.display, fontWeight: '900', color: colors.textPrimary, marginBottom: spacing.xs },
  message: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl },
  
  statsRow: { flexDirection: 'row', gap: spacing.md, width: '100%' },
  statBox: { flex: 1, backgroundColor: colors.background, borderRadius: borderRadius.lg, padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  statVal: { fontSize: fontSize.xxl, fontWeight: '800', marginBottom: 2 },
  statLabel: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '600' },
  
  sectionTitle: { fontSize: fontSize.xl, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.lg },
  
  answerCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderLeftWidth: 4 },
  cardCorrect: { borderColor: colors.border, borderLeftColor: colors.success },
  cardWrong: { borderColor: colors.border, borderLeftColor: colors.error },
  
  qNumber: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
  targetName: { fontSize: fontSize.lg, color: colors.textPrimary, fontWeight: '800', marginBottom: spacing.md },
  
  answerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  userAnsLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  userAnsVal: { fontSize: fontSize.sm, fontWeight: '700' },
  valCorrect: { color: colors.success },
  valWrong: { color: colors.error },
  
  footer: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.xxl, paddingVertical: spacing.lg, backgroundColor: colors.surface, borderTopWidth: 1, borderColor: colors.border },
  retryBtn: { flex: 1, backgroundColor: colors.surfaceLight, paddingVertical: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  retryBtnText: { color: colors.textPrimary, fontSize: fontSize.md, fontWeight: '700' },
  finishBtn: { flex: 1, backgroundColor: colors.primary, paddingVertical: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center' },
  finishBtnText: { color: colors.textInverse, fontSize: fontSize.md, fontWeight: '700' },
});
