import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, borderRadius, spacing, fontSize, shadow, AppTheme } from '../theme/colors';
import { generateQuiz } from '../services/geminiService';
import { useQuizStore } from '../store/useQuizStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useHistoryStore } from '../store/useHistoryStore';
import { topics } from '../data/topics';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { RouteProp } from '@react-navigation/native';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Loading'>;
  route: RouteProp<RootStackParamList, 'Loading'>;
};

const motivationalMessages = [
  'Yapay zeka sınav sorularını hazırlıyor...',
  'ÖSYM soru standartları çözümleniyor...',
  'Akıllı müfredat veri tabanı taranıyor...',
  'Görsel harita ve soru şıkları harmanlanıyor...',
  'Detaylı çözüm açıklamaları oluşturuluyor...',
  'Sınav zorluk derecesi ayarlanıyor...',
  'Sınavınız hazır olmak üzere, odaklanın!',
];

const ALL_TOPIC_PAGES: Record<string, string> = {
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
  
  const [currentMsg, setCurrentMsg] = useState(motivationalMessages[0]);
  const colors = useTheme();

  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeOpacity = useRef(new Animated.Value(1)).current;
  const progressPercent = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1, duration: 1800, easing: Easing.linear, useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();

    Animated.timing(progressPercent, {
      toValue: 95,
      duration: 10000,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();

    let activeMsgIndex = 0;
    const msgInterval = setInterval(() => {
      Animated.timing(fadeOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        activeMsgIndex = (activeMsgIndex + 1) % motivationalMessages.length;
        setCurrentMsg(motivationalMessages[activeMsgIndex]);
        Animated.timing(fadeOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 3800);

    fetchQuiz();

    return () => clearInterval(msgInterval);
  }, []);

  const fetchQuiz = async () => {
    const { pdfBase64, geminiFileUri, pdfPageRange, pdfName, pdfUri } = useQuizStore.getState();
    const { askedQuestions, addAskedQuestions, seenQuestionTexts, addSeenQuestionTexts } = useSettingsStore.getState();
    const { history } = useHistoryStore.getState();

    const historyQuestionTexts = history
      .slice(0, 6)
      .flatMap(h => {
        const list: string[] = [];
        if (h.questions) {
          h.questions.forEach(q => {
            if (q.question_text) list.push(q.question_text);
          });
        } else {
          if (h.result.wrongAnswers) {
            h.result.wrongAnswers.forEach(wa => {
              if (wa.question?.question_text) list.push(wa.question.question_text);
            });
          }
          if (h.result.emptyAnswers) {
            h.result.emptyAnswers.forEach(ea => {
              if (ea.question?.question_text) list.push(ea.question.question_text);
            });
          }
        }
        return list;
      })
      .filter(Boolean);

    const combinedQuestionTexts = Array.from(new Set([
      ...historyQuestionTexts,
      ...seenQuestionTexts
    ])).slice(0, 60);

    let finalPageRange = pdfPageRange;
    if (!finalPageRange && selectedTopics.length > 0) {
      const ranges: string[] = [];
      selectedTopics.forEach((topicName) => {
        const foundTopic = topics.find((t) => t.name === topicName);
        const topicId = foundTopic ? foundTopic.id : topicName;
        if (ALL_TOPIC_PAGES[topicId]) {
          ranges.push(ALL_TOPIC_PAGES[topicId]);
        }
      });
      if (ranges.length > 0) {
        finalPageRange = Array.from(new Set(ranges)).join(', ');
      }
    }

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
        pdfName,
        combinedQuestionTexts
      );

      if (quiz.questions) {
        const newQuestionTexts = quiz.questions
          .map((q) => q.question_text || '')
          .filter(Boolean);
        const newSubtopics = quiz.questions
          .map((q) => q.subtopic || '')
          .filter(Boolean);
        
        if (newQuestionTexts.length > 0) {
          await addSeenQuestionTexts(newQuestionTexts);
        }
        if (newSubtopics.length > 0) {
          await addAskedQuestions(newSubtopics);
        }
      }

      Animated.timing(progressPercent, {
        toValue: 100,
        duration: 200,
        useNativeDriver: false,
      }).start(() => {
        setQuestions(quiz.questions);
        navigation.replace('Quiz');
      });

    } catch (error: any) {
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
          console.log('[Auto-Healing] PDF expired, re-uploading...');
          const { uploadToGeminiFiles } = require('../services/geminiService');
          
          const newGeminiFileUri = await uploadToGeminiFiles(
            finalBase64 || '',
            pdfName || 'kpss_document.pdf',
            apiKey,
            Platform.OS !== 'web' ? pdfUri : null
          );

          if (newGeminiFileUri) {
            const quizStore = useQuizStore.getState();
            quizStore.setPdfContext(pdfUri, finalBase64, pdfName, newGeminiFileUri);
            
            if (quizStore.selectedSlotId) {
              quizStore.uploadToPdfSlot(quizStore.selectedSlotId, pdfUri || '', finalBase64 || '', pdfName || '', newGeminiFileUri);
            }

            const quiz = await generateQuiz(
              selectedTopics,
              questionCount,
              apiKey,
              difficulty,
              finalBase64,
              askedQuestions,
              newGeminiFileUri,
              finalPageRange,
              pdfName,
              combinedQuestionTexts
            );

            if (quiz.questions) {
              const newQuestionTexts = quiz.questions
                .map((q) => q.question_text || '')
                .filter(Boolean);
              const newSubtopics = quiz.questions
                .map((q) => q.subtopic || '')
                .filter(Boolean);
              
              if (newQuestionTexts.length > 0) {
                await addSeenQuestionTexts(newQuestionTexts);
              }
              if (newSubtopics.length > 0) {
                await addAskedQuestions(newSubtopics);
              }
            }

            Animated.timing(progressPercent, {
              toValue: 100,
              duration: 200,
              useNativeDriver: false,
            }).start(() => {
              setQuestions(quiz.questions);
              healed = true;
              navigation.replace('Quiz');
            });
            return;
          }
        } catch (healingError: any) {
          console.warn('[Auto-Healing] failed:', healingError.message);
        }
      }

      let displayMsg = error.message || 'Hata oluştu. Lütfen bağlantınızı kontrol edin.';
      if (isPdfExpired && !healed) {
        const expiredFriendlyError = 'PDF belgesinin sunucudaki süresi dolmuş. Lütfen bu belgeyi çöp kutusuna basarak silip tekrar yükleyin.';
        setError(expiredFriendlyError);
        displayMsg = expiredFriendlyError;
      } else {
        setError(error.message || 'Bilinmeyen hata.');
      }
      
      if (Platform.OS === 'web') {
        window.alert(`Hata: ${displayMsg}`);
      } else {
        Alert.alert('Hata', displayMsg, [{ text: 'Tamam' }]);
      }
      navigation.goBack();
    }
  };

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const widthPercentage = progressPercent.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const s = getStyles(colors);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.center}>
        
        {/* Sleek, Premium Monochrome Loader */}
        <View style={s.animationContainerOuter}>
          <Animated.View style={[s.spinnerOuter, { transform: [{ rotate: spin }] }]} />
          <Animated.View style={[s.emojiContainer, { transform: [{ scale: pulseAnim }] }]}>
            <Text style={s.emoji}>🧠</Text>
          </Animated.View>
        </View>

        <Text style={s.title}>Test Hazırlanıyor</Text>
        
        <Animated.View style={{ opacity: fadeOpacity, minHeight: 32, justifyContent: 'center' }}>
          <Text style={s.message}>{currentMsg}</Text>
        </Animated.View>

        {/* Micro-thin Progress Bar */}
        <View style={s.progressContainer}>
          <View style={s.progressBarBg}>
            <Animated.View style={[s.progressBarFill, { width: widthPercentage }]} />
          </View>
        </View>

        {/* Flat info card (Warm beige/grey card) */}
        <View style={s.infoCard}>
          <View style={s.infoItem}>
            <Text style={s.infoEmoji}>📝</Text>
            <Text style={s.infoText}>{questionCount} Soru</Text>
          </View>
          <View style={s.infoDivider} />
          <View style={s.infoItem}>
            <Text style={s.infoEmoji}>🎯</Text>
            <Text style={s.infoText}>
              {difficulty === 'easy' ? 'Kolay' : difficulty === 'medium' ? 'Orta' : difficulty === 'hard' ? 'Zor' : 'Uzman'}
            </Text>
          </View>
        </View>

      </View>
    </SafeAreaView>
  );
};

const getStyles = (colors: AppTheme) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: spacing.xxl 
  },
  animationContainerOuter: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxxl,
  },
  spinnerOuter: { 
    width: 104, 
    height: 104, 
    borderRadius: 52, 
    borderWidth: 2, 
    borderColor: colors.borderSubtle, 
    borderTopColor: colors.primary, 
    position: 'absolute' 
  },
  emojiContainer: { 
    alignItems: 'center', 
    justifyContent: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadow(1),
  },
  emoji: { 
    fontSize: 26 
  },
  title: { 
    color: colors.textPrimary, 
    fontSize: fontSize.xl, 
    fontWeight: '900', 
    marginBottom: spacing.xs,
    letterSpacing: -0.5,
  },
  message: { 
    color: colors.textSecondary, 
    fontSize: fontSize.sm + 1, 
    textAlign: 'center', 
    fontWeight: '700',
    paddingHorizontal: spacing.xl,
  },
  progressContainer: {
    width: '75%',
    marginTop: spacing.lg,
    marginBottom: spacing.xxxl,
  },
  progressBarBg: {
    height: 3, // Micro-thin
    backgroundColor: colors.borderSubtle,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
  },
  infoCard: { 
    flexDirection: 'row', 
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated, 
    borderRadius: borderRadius.md, 
    paddingVertical: spacing.md - 3, 
    paddingHorizontal: spacing.xl, 
    borderWidth: 1.5, 
    borderColor: colors.border,
    ...shadow(1),
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoEmoji: {
    fontSize: 14,
  },
  infoText: { 
    color: colors.textPrimary, 
    fontSize: fontSize.sm - 1,
    fontWeight: '800',
  },
  infoDivider: {
    width: 1,
    height: 12,
    backgroundColor: colors.borderLight,
    marginHorizontal: spacing.md,
  }
});
