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
    const { pdfBase64, geminiFileUri, pdfPageRange, pdfName, pdfUri } = useQuizStore.getState();
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

    // Lazy load base64 from disk on startup if empty (respects 6MB AsyncStorage limit!)
    let finalBase64 = pdfBase64;
    if (!finalBase64 && pdfUri && Platform.OS !== 'web') {
      try {
        const FileSystem = require('expo-file-system');
        finalBase64 = await FileSystem.readAsStringAsync(pdfUri, {
          encoding: 'base64',
        });
      } catch (err) {
        console.warn('Startup dynamic base64 read for Gemini failed:', err);
      }
    }

    try {
      const quiz = await generateQuiz(
        selectedTopics,
        questionCount,
        apiKey,
        difficulty,
        finalBase64,
        askedQuestions,
        geminiFileUri,
        finalPageRange,
        pdfName
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
      // PDF Dosya Süresi Dolma / Silinme Hatası ve Otomatik İyileştirme (Auto-healing)
      const isPdfExpired = error.message && (
        error.message.includes('PDF_EXPIRED') ||
        error.message.includes('permission to access the File') ||
        error.message.includes('may not exist') ||
        error.message.includes('files/') ||
        error.message.includes('not found')
      );

      let canTryHealing = false;
      if (isPdfExpired) {
        if (finalBase64) {
          canTryHealing = true;
        } else if (pdfUri && Platform.OS !== 'web') {
          try {
            const FileSystem = require('expo-file-system');
            const fileInfo = await FileSystem.getInfoAsync(pdfUri);
            if (fileInfo.exists) {
              canTryHealing = true;
            }
          } catch (e) {
            console.warn('Check local file existence failed:', e);
          }
        }
      }

      let healed = false;
      if (isPdfExpired && canTryHealing) {
        try {
          console.log('[Auto-Healing] PDF dosyasının süresi dolmuş veya silinmiş. Otomatik olarak yeniden yükleniyor...');
          const { uploadToGeminiFiles } = require('../services/geminiService');
          
          // Re-upload the PDF to get a new active File URI
          const newGeminiFileUri = await uploadToGeminiFiles(
            finalBase64 || '',
            pdfName || 'kpss_document.pdf',
            apiKey,
            Platform.OS !== 'web' ? pdfUri : null
          );

          if (newGeminiFileUri) {
            console.log('[Auto-Healing] PDF başarıyla yeniden yüklendi. Yeni URI:', newGeminiFileUri);
            
            // Update the Zustand store and AsyncStorage with the new File URI
            const quizStore = useQuizStore.getState();
            quizStore.setPdfContext(pdfUri, finalBase64, pdfName, newGeminiFileUri);
            
            // If the PDF belongs to a specific slot, update the slot as well
            if (quizStore.selectedSlotId) {
              quizStore.uploadToPdfSlot(quizStore.selectedSlotId, pdfUri || '', finalBase64 || '', pdfName || '', newGeminiFileUri);
            }

            // Retry generating the quiz with the new active File URI
            const quiz = await generateQuiz(
              selectedTopics,
              questionCount,
              apiKey,
              difficulty,
              finalBase64,
              askedQuestions,
              newGeminiFileUri,
              finalPageRange,
              pdfName
            );

            if (quiz.questions) {
              const newSubtopics = quiz.questions
                .map((q) => q.subtopic || '')
                .filter(Boolean);
              if (newSubtopics.length > 0) {
                await addAskedQuestions(newSubtopics);
              }
            }

            setQuestions(quiz.questions);
            healed = true;
            navigation.replace('Quiz');
            return; // Success! Exit early.
          }
        } catch (healingError: any) {
          console.warn('[Auto-Healing] PDF yeniden yükleme başarısız oldu:', healingError.message);
        }
      }

      // If we got here and it was a PDF expired error, it means we couldn't heal it because local files are missing
      let displayMsg = error.message || 'Beklenmedik bir hata oluştu. Lütfen API anahtarınızı ve internetinizi kontrol edin.';
      if (isPdfExpired && !healed) {
        const expiredFriendlyError = 'Seçtiğiniz PDF belgesinin sunucudaki 48 saatlik süresi dolmuş veya cihazınızdaki geçici önbellek silinmiş.\n\nÇözüm: Lütfen ana sayfadaki "Kaynak Doküman Kütüphanesi" alanından bu belgeyi çöp kutusu simgesine basarak silin ve dosyayı cihazınızdan tekrar yükleyin.';
        setError(expiredFriendlyError);
        displayMsg = expiredFriendlyError;
      } else {
        setError(error.message || 'Bilinmeyen bir hata oluştu.');
      }
      
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
