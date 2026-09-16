import React, { useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, borderRadius, spacing, fontSize, shadow, AppTheme } from '../theme/colors';
import { useQuizStore } from '../store/useQuizStore';
import { ResultSummaryCard } from '../components/ResultSummaryCard';
import { WrongAnswerCard } from '../components/WrongAnswerCard';
import { CorrectAnswerCard } from '../components/CorrectAnswerCard';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Result'>;
  route: RouteProp<RootStackParamList, 'Result'>;
};

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const ConfettiItem = ({ delay }: { delay: number }) => {
  const anim = useRef(new Animated.Value(0)).current;
  const colors = ['#FFFFFF', '#E2E8F0', '#94A3B8', '#64748B', '#FBBF24', '#F59E0B'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  const randomLeft = Math.random() * 90 + 5 + '%';
  const randomSize = Math.random() * 6 + 5;
  const randomDuration = Math.random() * 2500 + 2000;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: randomDuration,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT * 0.8, -100],
  });
  const rotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const opacity = anim.interpolate({
    inputRange: [0, 0.15, 0.85, 1],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: randomLeft as any,
        width: randomSize,
        height: randomSize,
        borderRadius: randomSize / 2,
        backgroundColor: randomColor,
        opacity,
        transform: [{ translateY }, { rotate }],
        zIndex: 99,
      }}
    />
  );
};

export const ResultScreen: React.FC<Props> = ({ navigation, route }) => {
  const colors = useTheme();
  const { getResults, resetQuizKeepTopics } = useQuizStore();
  
  const pastResult = route.params?.pastResult;
  const result = pastResult ? pastResult.result : getResults();

  const handleAction = () => {
    if (pastResult) {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.popToTop();
      }
    } else {
      resetQuizKeepTopics();
      navigation.popToTop();
    }
  };

  const hasWrongOrEmpty = result.wrongAnswers.length > 0 || result.emptyAnswers.length > 0;
  const hasCorrect = result.correctAnswers && result.correctAnswers.length > 0;
  const isHighPerformance = result.scorePercentage >= 80;
  const s = getStyles(colors);

  return (
    <SafeAreaView style={s.container} edges={['bottom']}>
      {/* Celebration floating particles */}
      {isHighPerformance && (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          {Array.from({ length: 15 }).map((_, i) => (
            <ConfettiItem key={i} delay={i * 200} />
          ))}
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.content}
      >
        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>Sınav Sonucu</Text>
          <Text style={s.headerSub}>
            Performans detayları ve yapay zeka analiz raporu
          </Text>
        </View>

        {/* Summary Card */}
        <ResultSummaryCard result={result} />

        {/* Wrong & Empty Section */}
        {hasWrongOrEmpty && (
          <View style={s.analysisSection}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Soru Detayları</Text>
              <Text style={s.sectionSub}>
                Hatalı ve boş bırakılan soruları detaylı incelemek için kartlara dokunun.
              </Text>
            </View>

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

        {/* Minimalist Perfect score card */}
        {!hasWrongOrEmpty && (
          <View style={s.perfectCard}>
            <Text style={s.perfectEmoji}>🏆</Text>
            <Text style={s.perfectTitle}>Kusursuz Sonuç!</Text>
            <Text style={s.perfectSub}>
              Tebrikler! Sınavdaki tüm soruları hatasız yanıtlayarak kusursuz bir başarı elde ettin.
            </Text>
          </View>
        )}

        {/* Correct Answers Section */}
        {hasCorrect && (
          <View style={s.analysisSection}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>✓ Doğru Cevapladığın Sorular</Text>
              <Text style={s.sectionSub}>
                Doğru yanıtladığın soruları ve açıklamalarını incelemek için kartlara dokunun.
              </Text>
            </View>

            {result.correctAnswers.map((item, index) => (
              <CorrectAnswerCard
                key={`correct-${item.question.id}`}
                question={item.question}
                userAnswer={item.userAnswer}
                index={index}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom Button Panel with stark dark button */}
      <View style={s.bottom}>
        <TouchableOpacity
          style={s.newQuizBtn}
          onPress={handleAction}
          activeOpacity={0.9}
        >
          <Text style={s.newQuizBtnText}>
            {pastResult ? '← Geri Dön' : 'Yeni Sınav Hazırla'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const getStyles = (colors: AppTheme) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
  content: { 
    padding: spacing.xl, 
    paddingBottom: spacing.xxxl 
  },
  header: { 
    marginBottom: spacing.xl - 4 
  },
  headerTitle: { 
    color: colors.textPrimary, 
    fontSize: fontSize.xxl - 1, 
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  headerSub: { 
    color: colors.textSecondary, 
    fontSize: fontSize.sm, 
    marginTop: spacing.xs,
    fontWeight: '600',
  },
  analysisSection: { 
    marginTop: spacing.md 
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionTitle: { 
    color: colors.textPrimary, 
    fontSize: fontSize.md + 1, 
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sectionSub: { 
    color: colors.textMuted, 
    fontSize: fontSize.xs + 1, 
    marginTop: 2,
    fontWeight: '600',
  },
  perfectCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.success,
    padding: spacing.xxl,
    alignItems: 'center',
    marginTop: spacing.lg,
    ...shadow(2, colors.success),
  },
  perfectEmoji: { 
    fontSize: 48, 
    marginBottom: spacing.md 
  },
  perfectTitle: { 
    color: colors.success, 
    fontSize: fontSize.xl - 1, 
    fontWeight: '900', 
    marginBottom: spacing.sm 
  },
  perfectSub: { 
    color: colors.textSecondary, 
    fontSize: fontSize.sm + 1, 
    textAlign: 'center', 
    lineHeight: 22,
    fontWeight: '600',
  },
  bottom: {
    paddingHorizontal: spacing.xl, 
    paddingVertical: spacing.md,
    borderTopWidth: 1.5, 
    borderColor: colors.border, 
    backgroundColor: colors.surfaceElevated,
    ...shadow(3, colors.primary),
  },
  newQuizBtn: { 
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md, 
    paddingVertical: spacing.lg - 2, 
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    ...shadow(3, colors.primaryDark),
  },
  newQuizBtnText: { 
    color: colors.textInverse, 
    fontSize: fontSize.md - 1, 
    fontWeight: '900',
    letterSpacing: 0.2,
  },
});
