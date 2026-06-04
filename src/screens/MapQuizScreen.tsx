import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, borderRadius, spacing, fontSize } from '../theme/colors';
import { useMapQuizStore } from '../store/useMapQuizStore';
import { TurkeyMapSvg } from '../components/maps/TurkeyMapSvg';
import { MapOptionButton } from '../components/MapOptionButton';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MapQuiz'>;
};

const TIME_LIMIT = 15; // 15 saniye

export const MapQuizScreen: React.FC<Props> = ({ navigation }) => {
  const colors = useTheme();
  const { mode, getCurrentQuestion, selectAnswer, userAnswers, currentIndex, questions, nextQuestion, isLastQuestion, score } = useMapQuizStore();

  const question = getCurrentQuestion();
  const answered = userAnswers[question?.id || 0];

  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sayaç yönetimi
  useEffect(() => {
    if (!answered && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && !answered) {
      // Süre bitti, yanlış sayılacak (veya boş) - şimdilik rastgele geçersiz bir şık seçmiş gibi yapalım
      selectAnswer(question?.id || 0, 'TIMEOUT');
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, answered, question]);

  // Yeni soruya geçince sayacı sıfırla
  useEffect(() => {
    setTimeLeft(TIME_LIMIT);
  }, [currentIndex]);

  const handleOptionPress = (optionKey: string) => {
    if (answered) return; // Zaten cevaplandı
    selectAnswer(question!.id, optionKey);
  };

  const handleNext = () => {
    if (isLastQuestion()) {
      navigation.replace('MapQuizResult');
    } else {
      nextQuestion();
    }
  };

  const handleQuit = () => {
    if (Platform.OS === 'web') {
      const confirmQuit = window.confirm('Oyunu bitirmek istediğinize emin misiniz?');
      if (confirmQuit) {
        navigation.goBack();
      }
      return;
    }
    Alert.alert('Çıkış', 'Oyunu bitirmek istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Çık', style: 'destructive', onPress: () => navigation.goBack() }
    ]);
  };

  if (!question) return null;

  const s = getStyles(colors);

  return (
    <SafeAreaView style={s.container} edges={['bottom']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={handleQuit} style={s.closeBtn}>
          <Text style={s.closeText}>✕</Text>
        </TouchableOpacity>

        <View style={s.scoreContainer}>
          <Text style={s.scoreText}>🔥 Skor: {score}</Text>
        </View>

        <View style={s.progressContainer}>
          <Text style={s.progressText}>{currentIndex + 1} / {questions.length}</Text>
        </View>
      </View>

      {/* Timer Bar */}
      <View style={s.timerBg}>
        <View style={[
          s.timerFill,
          { width: `${(timeLeft / TIME_LIMIT) * 100}%` },
          timeLeft <= 5 && { backgroundColor: colors.error }
        ]} />
      </View>

      {/* Map Area */}
      <View style={s.mapContainer}>
        <TurkeyMapSvg highlightedProvinceId={question.targetId as number} />
      </View>

      {/* Question / Result feedback */}
      <View style={s.questionArea}>
        {!answered ? (
          <Text style={s.questionText}>Haritadaki işaretli yer neresidir?</Text>
        ) : (
          <Text style={[s.feedbackText, answered === question.correct_answer ? s.correctText : s.wrongText]}>
            {answered === question.correct_answer ? '✅ Doğru Bildin!' : `❌ Yanlış! Doğru cevap: ${question.options[question.correct_answer]}`}
          </Text>
        )}
      </View>

      {/* Options */}
      <View style={s.optionsContainer}>
        {(['A', 'B', 'C', 'D'] as const).map(key => {
          let status: 'idle' | 'correct' | 'wrong' = 'idle';

          if (answered) {
            if (key === question.correct_answer) {
              status = 'correct'; // Doğru şıkkı her zaman yeşil göster
            } else if (key === answered) {
              status = 'wrong'; // Kullanıcının seçtiği yanlış şık
            }
          }

          return (
            <MapOptionButton
              key={key}
              label={key}
              text={question.options[key]}
              onPress={() => handleOptionPress(key)}
              status={status}
              disabled={!!answered}
            />
          )
        })}
      </View>

      {/* Next Button */}
      {answered && (
        <View style={s.footer}>
          <TouchableOpacity style={s.nextBtn} onPress={handleNext} activeOpacity={0.8}>
            <Text style={s.nextBtnText}>{isLastQuestion() ? 'Sonuçları Gör 🏆' : 'Sonraki Soru ➡️'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  closeText: { color: colors.textSecondary, fontSize: 16, fontWeight: '600' },
  scoreContainer: { backgroundColor: colors.warningGlow, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.warning },
  scoreText: { color: colors.warning, fontWeight: '800', fontSize: fontSize.md },
  progressContainer: { backgroundColor: colors.surface, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.border },
  progressText: { color: colors.textPrimary, fontWeight: '700', fontSize: fontSize.sm },

  timerBg: { height: 4, backgroundColor: colors.surface, marginHorizontal: spacing.xl, borderRadius: 2, overflow: 'hidden' },
  timerFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },

  mapContainer: { flex: 1, padding: spacing.xl },
  questionArea: { alignItems: 'center', marginBottom: spacing.lg, paddingHorizontal: spacing.xl },
  questionText: { fontSize: fontSize.xl, fontWeight: '800', color: colors.textPrimary, textAlign: 'center' },
  feedbackText: { fontSize: fontSize.xl, fontWeight: '800', textAlign: 'center' },
  correctText: { color: colors.success },
  wrongText: { color: colors.error },

  optionsContainer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  nextBtn: { backgroundColor: colors.primary, paddingVertical: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center' },
  nextBtnText: { color: colors.textInverse, fontSize: fontSize.lg, fontWeight: '800' },
});
