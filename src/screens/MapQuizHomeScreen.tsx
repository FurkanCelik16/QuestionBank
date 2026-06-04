import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, borderRadius, spacing, fontSize } from '../theme/colors';
import { useMapQuizStore } from '../store/useMapQuizStore';
import { generateMapQuiz } from '../services/mapQuizEngine';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'TopicSelection'>; // Tab içinde çalışacaksa burası ona göre değişebilir
};

const COUNT_OPTIONS = [5, 10, 15, 20];

export const MapQuizHomeScreen: React.FC<Props> = ({ navigation }) => {
  const colors = useTheme();
  const { mode, setMode, questionCount, setQuestionCount, setQuestions } = useMapQuizStore();
  const buttonScale = React.useRef(new Animated.Value(1)).current;

  const handleStart = () => {
    // Animasyon
    Animated.sequence([
      Animated.timing(buttonScale, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.spring(buttonScale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start(() => {
      // Soruları üret ve quiz'e başla
      const questions = generateMapQuiz(mode, questionCount);
      setQuestions(questions);
      navigation.navigate('MapQuiz');
    });
  };

  const s = getStyles(colors);

  return (
    <SafeAreaView style={s.container} edges={['bottom']}>
      <View style={s.content}>
        <Text style={s.title}>Türkiye Harita Tahmin</Text>
        <Text style={s.subtitle}>Türkiye'nin 81 ilini tahmin ederek coğrafi bilgini test et!</Text>

        <View style={s.optionsSection}>
          <Text style={s.optionsTitle}>Soru Sayısı</Text>
          <View style={s.countRow}>
            {COUNT_OPTIONS.map((c) => (
              <TouchableOpacity 
                key={c} 
                style={[s.countBtn, questionCount === c && s.countBtnActive]}
                onPress={() => setQuestionCount(c)}
              >
                <Text style={[s.countText, questionCount === c && s.countTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Animated.View style={{ transform: [{ scale: buttonScale }], marginTop: 'auto' }}>
          <TouchableOpacity style={s.startBtn} onPress={handleStart} activeOpacity={0.9}>
            <Text style={s.startBtnText}>🗺️ Oyuna Başla</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: spacing.xxl },
  title: { color: colors.textPrimary, fontSize: fontSize.xxxl, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, fontSize: fontSize.md, marginBottom: spacing.xxxl },
  
  modeSection: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xxxl },
  modeCard: { 
    flex: 1, 
    backgroundColor: colors.surface, 
    borderRadius: borderRadius.xl, 
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center'
  },
  modeCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryGlow,
  },
  modeEmoji: { fontSize: 42, marginBottom: spacing.sm },
  modeTitle: { color: colors.textSecondary, fontSize: fontSize.md, fontWeight: '700', marginBottom: 4 },
  modeTitleActive: { color: colors.primary },
  modeDesc: { color: colors.textMuted, fontSize: fontSize.xs, textAlign: 'center' },

  optionsSection: { marginBottom: spacing.xl },
  optionsTitle: { color: colors.textPrimary, fontSize: fontSize.lg, fontWeight: '700', marginBottom: spacing.md },
  countRow: { flexDirection: 'row', gap: spacing.sm },
  countBtn: { flex: 1, paddingVertical: spacing.md, backgroundColor: colors.surface, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  countBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  countText: { color: colors.textSecondary, fontSize: fontSize.md, fontWeight: '700' },
  countTextActive: { color: colors.textInverse },

  startBtn: { backgroundColor: colors.primary, paddingVertical: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center' },
  startBtnText: { color: colors.textInverse, fontSize: fontSize.xl, fontWeight: '800' },
});
