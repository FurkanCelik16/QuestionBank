import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, borderRadius, spacing, fontSize } from '../theme/colors';
import { generateQuiz } from '../services/geminiService';
import { useQuizStore } from '../store/useQuizStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { RouteProp } from '@react-navigation/native';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Loading'>;
  route: RouteProp<RootStackParamList, 'Loading'>;
};

const motivationalMessages = [
  'Gemini soruları hazırlıyor...',
  'ÖSYM kalitesinde sorular üretiliyor...',
  'Bilgi bankası taranıyor...',
  'Sorular şekilleniyor...',
  'Şıklar düzenleniyor...',
  'Az kaldı, hazırlan!',
  'Testine son dokunuşlar yapılıyor...',
];

const ALL_TOPIC_PAGES: Record<string, string> = {
  // TARİH KONULARI
  tarih_01: '2-8',
  tarih_02: '9-18',
  tarih_03: '23-32',
  tarih_04: '33-38',
  tarih_05: '39-41',
  tarih_06: '42-43',
  tarih_07: '44-51',
  tarih_08: '52-61',
  tarih_09: '62-64',
  tarih_10: '65-67',
  tarih_11: '67-71',
  tarih_12: '73-87',
  tarih_13: '88-89',
  tarih_14: '89-91',
  tarih_15: '91-100',
  tarih_16: '101-103',
  tarih_17: '104-106',
  tarih_18: '109-114',
  tarih_19: '115',

  // COĞRAFYA KONULARI
  cog_01: '3-13',
  cog_02: '23-42',
  cog_03: '55-70',
  cog_04: '85-97',
  cog_05: '110-122',
  cog_06: '132-141',
  cog_07: '151-173',
};

export const LoadingScreen: React.FC<Props> = ({ navigation, route }) => {
  const { selectedTopics, questionCount, difficulty } = route.params;
  const { apiKey } = useSettingsStore();
  const { setQuestions, setError } = useQuizStore();
  const [msgIndex, setMsgIndex] = useState(0);
  const colors = useTheme();

  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const dotAnim1 = useRef(new Animated.Value(0)).current;
  const dotAnim2 = useRef(new Animated.Value(0)).current;
  const dotAnim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Spin animation
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1, duration: 2000, easing: Easing.linear, useNativeDriver: true,
      })
    ).start();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();

    // Dot animations
    const dotLoop = (anim: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: -8, duration: 300, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ])
      ).start();
    };
    dotLoop(dotAnim1, 0);
    dotLoop(dotAnim2, 200);
    dotLoop(dotAnim3, 400);

    // Message rotation
    const msgInterval = setInterval(() => {
      setMsgIndex((p) => (p + 1) % motivationalMessages.length);
    }, 2500);

    // API call
    fetchQuiz();

    return () => clearInterval(msgInterval);
  }, []);

  const fetchQuiz = async () => {
    const { pdfBase64, geminiFileUri, pdfPageRange } = useQuizStore.getState();
    const { askedQuestions, addAskedQuestions } = useSettingsStore.getState();

    // Dynamically calculate the final page range based on selected topics if pdfPageRange is not manually provided
    let finalPageRange = pdfPageRange;
    if (!finalPageRange && selectedTopics.length > 0) {
      const ranges: string[] = [];
      selectedTopics.forEach((topicId) => {
        if (ALL_TOPIC_PAGES[topicId]) {
          ranges.push(ALL_TOPIC_PAGES[topicId]);
        }
      });
      if (ranges.length > 0) {
        // De-duplicate and join multiple ranges
        finalPageRange = Array.from(new Set(ranges)).join(', ');
      }
    }

    try {
      const quiz = await generateQuiz(
        selectedTopics,
        questionCount,
        apiKey,
        difficulty,
        pdfBase64,
        askedQuestions,
        geminiFileUri,
        finalPageRange
      );

      // Save new question subtopics to local history
      if (quiz.questions) {
        const newSubtopics = quiz.questions
          .map((q) => q.subtopic || '')
          .filter(Boolean);
        if (newSubtopics.length > 0) {
          await addAskedQuestions(newSubtopics);
        }
      }

      setQuestions(quiz.questions);
      navigation.replace('Quiz');
    } catch (error: any) {
      setError(error.message || 'Bilinmeyen bir hata oluştu.');
      const displayMsg = error.message || 'Beklenmedik bir hata oluştu. Lütfen API anahtarınızı ve internetinizi kontrol edin.';
      
      if (Platform.OS === 'web') {
        window.alert(`Test Oluşturulamadı!\n\nHata: ${displayMsg}`);
      } else {
        Alert.alert(
          'Test Oluşturulamadı',
          displayMsg,
          [{ text: 'Tamam' }]
        );
      }
      navigation.goBack();
    }
  };

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const s = getStyles(colors);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.center}>
        <View style={s.animationWrapper}>
          <Animated.View style={[s.spinnerOuter, { transform: [{ rotate: spin }] }]} />
          <Animated.View style={[s.emojiContainer, { transform: [{ scale: pulseAnim }] }]}>
            <Text style={s.emoji}>🧠</Text>
          </Animated.View>
        </View>

        <Text style={s.title}>Test Hazırlanıyor</Text>
        <Text style={s.message}>{motivationalMessages[msgIndex]}</Text>

        <View style={s.dotsRow}>
          {[dotAnim1, dotAnim2, dotAnim3].map((anim, i) => (
            <Animated.View key={i} style={[s.dot, { transform: [{ translateY: anim }] }]} />
          ))}
        </View>

        <View style={s.infoCard}>
          <Text style={s.infoLabel}>📝 {questionCount} soru</Text>
          <Text style={s.infoLabel}>📚 {selectedTopics.length} konu</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xxl },
  animationWrapper: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xxl },
  spinnerOuter: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: colors.border, borderTopColor: colors.primary, position: 'absolute' },
  emojiContainer: { alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 56 },
  title: { color: colors.textPrimary, fontSize: fontSize.xxl, fontWeight: '800', marginBottom: spacing.sm },
  message: { color: colors.textSecondary, fontSize: fontSize.md, textAlign: 'center', marginBottom: spacing.xxl },
  dotsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xxxl },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  infoCard: { flexDirection: 'row', gap: spacing.xl, backgroundColor: colors.surface, borderRadius: borderRadius.md, paddingVertical: spacing.md, paddingHorizontal: spacing.xl, borderWidth: 1, borderColor: colors.border },
  infoLabel: { color: colors.textSecondary, fontSize: fontSize.sm },
});
