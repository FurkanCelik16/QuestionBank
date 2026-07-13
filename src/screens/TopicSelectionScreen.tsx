import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Animated, ActivityIndicator,
  Platform, TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, borderRadius, spacing, fontSize, shadow, AppTheme } from '../theme/colors';
import { topics, questionCountOptions } from '../data/topics';
import { TopicCheckbox } from '../components/TopicCheckbox';
import { useSettingsStore } from '../store/useSettingsStore';
import { useQuizStore } from '../store/useQuizStore';
import { uploadToGeminiFiles } from '../services/geminiService';
import { MapQuizHomeScreen } from './MapQuizHomeScreen';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, DifficultyLevel } from '../types';

const difficultyOptions: { key: DifficultyLevel; label: string; emoji: string }[] = [
  { key: 'easy', label: 'Kolay', emoji: '😊' },
  { key: 'medium', label: 'Orta', emoji: '🎯' },
  { key: 'hard', label: 'Zor', emoji: '🔥' },
  { key: 'extreme', label: 'Uzman', emoji: '💀' },
];

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'TopicSelection'>;
  route: RouteProp<RootStackParamList, 'TopicSelection'>;
};

export const TopicSelectionScreen: React.FC<Props> = ({ navigation, route }) => {
  const { apiKey } = useSettingsStore();
  const { 
    selectedTopics, questionCount, difficulty, 
    setSelectedTopics, setQuestionCount, setDifficulty,
    pdfUri, pdfName, setPdfContext, clearPdfContext,
    pdfPageRange, setPdfPageRange, loadPdfContext,
    pdfSlots, selectedSlotId, selectPdfSlot, clearPdfSlot, uploadToPdfSlot
  } = useQuizStore();
  
  React.useEffect(() => {
    loadPdfContext();
    checkActiveSession();
  }, []);

  const checkActiveSession = async () => {
    try {
      const stored = await AsyncStorage.getItem('@kpss_active_quiz_session');
      if (stored) {
        const session = JSON.parse(stored);
        if (session && session.questions && session.questions.length > 0) {
          const answered = Object.keys(session.userAnswers || {}).length;
          const total = session.questions.length;
          const details = `${session.difficulty === 'easy' ? 'Kolay' : session.difficulty === 'medium' ? 'Orta' : session.difficulty === 'hard' ? 'Zor' : 'Uzman'} zorlukta, ${total} soruluk sınavın ${answered} sorusu çözülmüş.`;

          if (Platform.OS === 'web') {
            const confirmResume = window.confirm(`Yarım kalan bir sınavınız var.\n${details}\n\nDevam etmek ister misiniz?`);
            if (confirmResume) {
              const quizStore = useQuizStore.getState();
              await quizStore.loadActiveSession();
              navigation.navigate('Quiz');
            } else {
              await AsyncStorage.removeItem('@kpss_active_quiz_session');
            }
          } else {
            Alert.alert(
              'Yarım Kalan Sınav 📝',
              `Yarım kalan bir sınavınız var.\n\n${details}\n\nDevam etmek ister misiniz?`,
              [
                { 
                  text: 'Sil ve Yeni Başlat', 
                  style: 'destructive',
                  onPress: async () => {
                    await AsyncStorage.removeItem('@kpss_active_quiz_session');
                  }
                },
                { 
                  text: 'Devam Et', 
                  onPress: async () => {
                    const quizStore = useQuizStore.getState();
                    await quizStore.loadActiveSession();
                    navigation.navigate('Quiz');
                  }
                }
              ]
            );
          }
        }
      }
    } catch (e) {
      console.warn('Check active session failed:', e);
    }
  };
  
  const [isPicking, setIsPicking] = useState(false);
  const [activeTab, setActiveTab] = useState<'tarih' | 'cografya' | 'vatandaslik' | 'guncel' | 'harita'>(route.params?.initialTab || 'tarih');
  const buttonScale = React.useRef(new Animated.Value(1)).current;
  const colors = useTheme();

  const selectedTopicsSet = new Set(selectedTopics);
  const filteredTopics = topics.filter((t) => t.category === activeTab);

  const toggleTopic = useCallback((topicId: string) => {
    const { selectedTopics: currentTopics } = useQuizStore.getState();
    const nextSet = new Set(currentTopics);
    nextSet.has(topicId) ? nextSet.delete(topicId) : nextSet.add(topicId);
    setSelectedTopics(Array.from(nextSet));
  }, [setSelectedTopics]);

  const selectAllInCategory = () => {
    const catTopics = topics.filter((t) => t.category === activeTab);
    const allSel = catTopics.every((t) => selectedTopicsSet.has(t.id));
    
    const nextSet = new Set(selectedTopicsSet);
    catTopics.forEach((t) => allSel ? nextSet.delete(t.id) : nextSet.add(t.id));
    setSelectedTopics(Array.from(nextSet));
  };

  const pickDocument = async (slotId: string) => {
    if (!apiKey) {
      if (Platform.OS === 'web') {
        window.alert('Lütfen PDF yüklemeden önce Ayarlar (Settings) ekranından Gemini API anahtarınızı girin.');
      } else {
        Alert.alert(
          'API Anahtarı Gerekli',
          'PDF yüklemek için önce Ayarlar ekranından Gemini API anahtarınızı girin.',
          [{ text: 'Tamam' }]
        );
      }
      return;
    }

    try {
      setIsPicking(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        let base64 = '';

        if (Platform.OS === 'web') {
          const response = await fetch(asset.uri);
          const blob = await response.blob();
          base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const res = reader.result as string;
              resolve(res.split(',')[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } else {
          base64 = await FileSystem.readAsStringAsync(asset.uri, {
            encoding: 'base64',
          });
        }

        const geminiUri = await uploadToGeminiFiles(base64, asset.name, apiKey, Platform.OS !== 'web' ? asset.uri : null);

        uploadToPdfSlot(slotId, asset.uri, base64, asset.name, geminiUri);

        if (Platform.OS === 'web') {
          window.alert(`${asset.name} başarıyla yüklendi!`);
        } else {
          Alert.alert(
            'Yükleme Başarılı',
            `${asset.name} başarıyla yüklendi!`
          );
        }
      }
    } catch (err: any) {
      console.error('PDF Pick & Upload Error:', err);
      if (Platform.OS === 'web') {
        window.alert('Dosya yüklenirken bir hata oluştu: ' + (err.message || ''));
      } else {
        Alert.alert('Hata', err.message || 'Dosya seçilirken bir hata oluştu.');
      }
    } finally {
      setIsPicking(false);
    }
  };

  const handleStartQuiz = () => {
    if (!apiKey) {
      if (Platform.OS === 'web') {
        const confirm = window.confirm('Test oluşturmak için önce Gemini API anahtarınızı girmelisiniz. Ayarlar sayfasına gitmek ister misiniz?');
        if (confirm) {
          navigation.navigate('Settings');
        }
      } else {
        Alert.alert('API Anahtarı Gerekli',
          'Test oluşturmak için önce Gemini API anahtarınızı girmelisiniz.',
          [{ text: 'İptal', style: 'cancel' },
           { text: 'Ayarlara Git', onPress: () => navigation.navigate('Settings') }]);
      }
      return;
    }
    if (selectedTopics.length === 0 && !pdfUri) {
      if (Platform.OS === 'web') {
        window.alert('Lütfen en az bir konu seçin veya bir PDF dokümanı yükleyin.');
      } else {
        Alert.alert('Seçim Yapın', 'Lütfen en az bir konu seçin veya bir PDF dokümanı yükleyin.');
      }
      return;
    }
    const names = topics.filter((t) => selectedTopicsSet.has(t.id)).map((t) => t.name);
    Animated.sequence([
      Animated.timing(buttonScale, { toValue: 0.96, duration: 60, useNativeDriver: true }),
      Animated.spring(buttonScale, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();
    
    navigation.navigate('Loading', { selectedTopics: names, questionCount, difficulty });
  };

  const tarihCount = topics.filter((t) => t.category === 'tarih' && selectedTopicsSet.has(t.id)).length;
  const cogCount = topics.filter((t) => t.category === 'cografya' && selectedTopicsSet.has(t.id)).length;
  const vatCount = topics.filter((t) => t.category === 'vatandaslik' && selectedTopicsSet.has(t.id)).length;
  const gunCount = topics.filter((t) => t.category === 'guncel' && selectedTopicsSet.has(t.id)).length;
  const allCategorySel = filteredTopics.length > 0 && filteredTopics.every((t) => selectedTopicsSet.has(t.id));

  const s = getStyles(colors);

  return (
    <SafeAreaView style={s.container} edges={['bottom']}>
      {/* Flat Minimalist Header Section (No Generic AI Gradients) */}
      <View style={s.headerOuter}>
        <Text style={s.headerTitle}>KPSS Yapay Zeka</Text>
        <Text style={s.headerSub}>Konuları seç, özel testler üret, eksiklerini kapat</Text>
      </View>
      
      {/* Segmented Pill Tab Bar (Claude style) */}
      <View style={s.tabRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.tabScrollViewContent}
        >
          <TouchableOpacity 
            style={[s.tab, activeTab === 'tarih' && s.tabAct]} 
            onPress={() => setActiveTab('tarih')} 
            activeOpacity={0.8}
          >
            <Text style={s.tabEmoji}>📜</Text>
            <Text style={[s.tabText, activeTab === 'tarih' && s.tabTextAct]}>Tarih</Text>
            {tarihCount > 0 && (
              <View style={[s.badge, { backgroundColor: colors.primary }]}>
                <Text style={s.badgeText}>{tarihCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[s.tab, activeTab === 'cografya' && s.tabAct]} 
            onPress={() => setActiveTab('cografya')} 
            activeOpacity={0.8}
          >
            <Text style={s.tabEmoji}>🌍</Text>
            <Text style={[s.tabText, activeTab === 'cografya' && s.tabTextAct]}>Coğrafya</Text>
            {cogCount > 0 && (
              <View style={[s.badge, { backgroundColor: colors.primary }]}>
                <Text style={s.badgeText}>{cogCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[s.tab, activeTab === 'vatandaslik' && s.tabAct]} 
            onPress={() => setActiveTab('vatandaslik')} 
            activeOpacity={0.8}
          >
            <Text style={s.tabEmoji}>⚖️</Text>
            <Text style={[s.tabText, activeTab === 'vatandaslik' && s.tabTextAct]}>Vatandaşlık</Text>
            {vatCount > 0 && (
              <View style={[s.badge, { backgroundColor: colors.primary }]}>
                <Text style={s.badgeText}>{vatCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[s.tab, activeTab === 'guncel' && s.tabAct]} 
            onPress={() => setActiveTab('guncel')} 
            activeOpacity={0.8}
          >
            <Text style={s.tabEmoji}>📰</Text>
            <Text style={[s.tabText, activeTab === 'guncel' && s.tabTextAct]}>Güncel</Text>
            {gunCount > 0 && (
              <View style={[s.badge, { backgroundColor: colors.primary }]}>
                <Text style={s.badgeText}>{gunCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[s.tab, activeTab === 'harita' && s.tabAct]} 
            onPress={() => setActiveTab('harita')} 
            activeOpacity={0.8}
          >
            <Text style={s.tabEmoji}>🗺️</Text>
            <Text style={[s.tabText, activeTab === 'harita' && s.tabTextAct]}>Harita</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      
      {activeTab === 'harita' ? (
        <View style={{ flex: 1 }}>
          <MapQuizHomeScreen navigation={navigation as any} />
        </View>
      ) : (
        <>
          <View style={s.listHeader}>
            <Text style={s.listTitle}>Müfredat Konuları</Text>
            <TouchableOpacity style={s.selAll} onPress={selectAllInCategory} activeOpacity={0.7}>
              <Text style={s.selAllText}>{allCategorySel ? '✗ Tümünü Kaldır' : '✓ Tümünü Seç'}</Text>
            </TouchableOpacity>
          </View>
      
          <ScrollView style={s.list} showsVerticalScrollIndicator={false} contentContainerStyle={s.listContent}>
            {filteredTopics.map((t) => (
              <TopicCheckbox 
                key={t.id} 
                label={t.name} 
                isSelected={selectedTopicsSet.has(t.id)} 
                onToggle={() => toggleTopic(t.id)} 
                category={t.category} 
              />
            ))}
          </ScrollView>

          {/* Minimal Bottom Settings Panel */}
          <View style={s.bottomPanel}>
            
            {/* Sources section */}
            <View style={s.qcSection}>
              <View style={s.pdfHeader}>
                <Text style={s.qcLabel}>Kaynak PDF Dokümanları (En Fazla 4)</Text>
                {pdfUri && (
                  <TouchableOpacity onPress={() => selectPdfSlot(null)}>
                    <Text style={s.clearPdf}>Seçimi Kaldır</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={s.slotsRow}>
                {['slot_1', 'slot_2', 'slot_3', 'slot_4'].map((slotId, index) => {
                  const slot = pdfSlots[slotId];
                  const isSelected = selectedSlotId === slotId;

                  return (
                    <View key={slotId} style={s.slotWrapper}>
                      <TouchableOpacity
                        style={[
                          s.slotCard,
                          isSelected && s.slotCardSelected,
                          slot && s.slotCardFilled,
                        ]}
                        onPress={() => {
                          if (slot) {
                            selectPdfSlot(isSelected ? null : slotId);
                          } else {
                            pickDocument(slotId);
                          }
                        }}
                        disabled={isPicking}
                        activeOpacity={0.8}
                      >
                        {isPicking && !slot && selectedSlotId === slotId ? (
                          <ActivityIndicator size="small" color={colors.primary} />
                        ) : slot ? (
                          <View style={s.slotActiveContent}>
                            <View style={[s.slotInnerOverlay, isSelected && s.slotInnerOverlayActive]}>
                              <Text style={s.slotEmoji}>📄</Text>
                              <Text style={[s.slotName, isSelected && { color: colors.textPrimary }]} numberOfLines={2}>
                                {slot.name}
                              </Text>
                            </View>
                          </View>
                        ) : (
                          <View style={s.slotEmptyContent}>
                            <Text style={s.slotEmptyEmoji}>+</Text>
                            <Text style={s.slotEmptyText}>Slot {index + 1}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                      {slot && (
                        <TouchableOpacity
                          style={s.slotDeleteBtn}
                          onPress={() => {
                            if (Platform.OS === 'web') {
                              const confirm = window.confirm(`"${slot.name}" belgesini silmek istediğinize emin misiniz?`);
                              if (confirm) {
                                clearPdfSlot(slotId);
                              }
                            } else {
                              Alert.alert(
                                'Dokümanı Sil',
                                `"${slot.name}" belgesini silmek istediğinize emin misiniz?`,
                                [
                                  { text: 'Vazgeç', style: 'cancel' },
                                  { text: 'Sil', style: 'destructive', onPress: () => clearPdfSlot(slotId) },
                                ]
                              );
                            }
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={s.slotDeleteEmoji}>×</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
              {pdfUri && <Text style={s.pdfHint}>* Soru üretiminde öncelikli olarak seçilen PDF kullanılacaktır.</Text>}
            </View>

            {/* Question Count Section */}
            <View style={s.qcSection}>
              <Text style={s.qcLabel}>Soru Sayısı</Text>
              <View style={s.qcRow}>
                {questionCountOptions.map((c) => {
                  const isAct = questionCount === c;
                  return (
                    <TouchableOpacity 
                      key={c} 
                      style={[s.qcBtn, isAct && s.qcBtnAct]} 
                      onPress={() => setQuestionCount(c)} 
                      activeOpacity={0.8}
                    >
                      <Text style={[s.qcBtnText, isAct && s.qcBtnTextAct]}>{c}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Difficulty Section */}
            <View style={s.qcSection}>
              <Text style={s.qcLabel}>Zorluk Seviyesi</Text>
              <View style={s.qcRow}>
                {difficultyOptions.map((d) => {
                  const isAct = difficulty === d.key;
                  return (
                    <TouchableOpacity 
                      key={d.key} 
                      style={[s.qcBtn, isAct && s.qcBtnAct]} 
                      onPress={() => setDifficulty(d.key)} 
                      activeOpacity={0.8}
                    >
                      <Text style={s.diffText}>{d.emoji}</Text>
                      <Text style={[s.diffLabel, isAct && s.qcBtnTextAct]}>{d.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Solid Start Button */}
            <Animated.View style={{ transform: [{ scale: buttonScale }], marginTop: spacing.xs }}>
              <TouchableOpacity 
                style={[s.startBtn, (selectedTopics.length === 0 && !pdfUri) && s.startBtnDis]} 
                onPress={handleStartQuiz} 
                activeOpacity={0.9} 
                disabled={selectedTopics.length === 0 && !pdfUri}
              >
                <Text style={s.startBtnText}>Başlayın →</Text>
                {(selectedTopics.length > 0 || pdfUri) && (
                  <Text style={s.startBtnSub}>
                    {pdfUri ? 'PDF + ' : ''}{selectedTopics.length} Konu · {questionCount} Soru · {difficultyOptions.find(d => d.key === difficulty)?.label}
                  </Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const getStyles = (colors: AppTheme) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
  headerOuter: {
    marginHorizontal: spacing.xxl,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    ...shadow(1),
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
    lineHeight: 18,
  },
  tabRow: { 
    marginHorizontal: spacing.xxl, 
    marginBottom: spacing.md, 
    backgroundColor: colors.backgroundAlt, 
    borderRadius: borderRadius.md,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabScrollViewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  tab: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderRadius: borderRadius.sm, 
    paddingVertical: spacing.md - 3, 
    paddingHorizontal: spacing.md,
    gap: spacing.xs 
  },
  tabAct: { 
    backgroundColor: colors.surfaceElevated, 
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow(1),
  },
  tabEmoji: { 
    fontSize: 14 
  },
  tabText: { 
    color: colors.textSecondary, 
    fontSize: fontSize.sm - 1, 
    fontWeight: '700' 
  },
  tabTextAct: { 
    color: colors.textPrimary,
    fontWeight: '800' 
  },
  badge: { 
    borderRadius: borderRadius.full, 
    minWidth: 16, 
    height: 16, 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingHorizontal: 4,
    marginLeft: 2,
  },
  badgeText: { 
    color: colors.textInverse, 
    fontSize: 9, 
    fontWeight: '900' 
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    marginBottom: spacing.sm,
  },
  listTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selAll: { 
    paddingVertical: spacing.xs, 
    paddingHorizontal: spacing.sm 
  },
  selAllText: { 
    color: colors.textPrimary, 
    fontSize: fontSize.xs, 
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  list: { 
    flex: 1, 
    paddingHorizontal: spacing.xxl 
  },
  listContent: { 
    paddingBottom: spacing.lg 
  },
  bottomPanel: { 
    paddingHorizontal: spacing.md, 
    paddingTop: spacing.xs, 
    paddingBottom: spacing.md, 
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    borderTopWidth: 1.5, 
    borderColor: colors.border, 
    backgroundColor: colors.surfaceElevated,
    ...shadow(2),
  },
  qcSection: { 
    marginBottom: spacing.sm 
  },
  qcLabel: { 
    color: colors.textPrimary, // Increased contrast to pure white/black
    fontSize: fontSize.xxs + 1, 
    fontWeight: '800', 
    marginBottom: spacing.sm, 
    textTransform: 'uppercase', 
    letterSpacing: 0.5 
  },
  qcRow: { 
    flexDirection: 'row', 
    gap: spacing.sm 
  },
  qcBtn: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center',
    paddingVertical: spacing.md - 3, 
    borderRadius: borderRadius.md, 
    backgroundColor: colors.surface, 
    borderWidth: 1.5, 
    borderColor: colors.border,
    height: 40,
  },
  qcBtnAct: { 
    borderColor: colors.primary, 
    backgroundColor: colors.primary,
  },
  qcBtnText: { 
    color: colors.textSecondary, 
    fontSize: fontSize.md - 1, 
    fontWeight: '800' 
  },
  qcBtnTextAct: { 
    color: colors.textInverse,
    fontWeight: '900',
  },
  diffText: { 
    fontSize: 12,
    marginBottom: 1,
  },
  diffLabel: { 
    color: colors.textSecondary, 
    fontSize: fontSize.xxs + 1, 
    fontWeight: '800' 
  },
  startBtn: { 
    backgroundColor: colors.primary, 
    borderRadius: borderRadius.md, 
    paddingVertical: spacing.lg - 2, 
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    ...shadow(3, colors.primaryDark),
  },
  startBtnDis: { 
    backgroundColor: colors.surfaceHighlight,
    shadowOpacity: 0,
    elevation: 0,
  },
  startBtnText: { 
    color: colors.textInverse, 
    fontSize: fontSize.md, 
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  startBtnTextDis: { 
    color: colors.textMuted 
  },
  startBtnSub: { 
    color: colors.textMuted, 
    fontSize: fontSize.xs - 1, 
    marginTop: 1,
    fontWeight: '700',
  },
  pdfHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: spacing.xs 
  },
  clearPdf: { 
    color: colors.textSecondary, // Increased contrast
    fontSize: fontSize.xs, 
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  pdfHint: { 
    color: colors.textSecondary, // Increased contrast
    fontSize: 10, 
    marginTop: 6, 
    fontStyle: 'italic',
    fontWeight: '700',
  },
  slotsRow: { 
    flexDirection: 'row', 
    gap: spacing.xs, 
    justifyContent: 'space-between', 
    marginBottom: spacing.xs, 
  },
  slotWrapper: { 
    width: '23.5%', 
    position: 'relative' 
  },
  slotCard: { 
    width: '100%', 
    height: 50, 
    borderRadius: borderRadius.md, 
    borderWidth: 1.5, 
    borderColor: colors.border, 
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  slotCardSelected: { 
    borderColor: colors.primary, 
  },
  slotCardFilled: { 
    borderStyle: 'solid' 
  },
  slotActiveContent: {
    width: '100%',
    height: '100%',
  },
  slotInnerOverlay: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
    backgroundColor: colors.surface,
  },
  slotInnerOverlayActive: {
    backgroundColor: colors.primarySoft,
  },
  slotEmptyContent: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
    borderStyle: 'dashed',
  },
  slotEmoji: { 
    fontSize: 12, 
    marginBottom: 0 
  },
  slotName: { 
    color: colors.textPrimary, 
    fontSize: 7.5, 
    lineHeight: 9,
    fontWeight: '700', 
    textAlign: 'center', 
    marginBottom: 0 
  },
  slotBadge: { 
    backgroundColor: colors.surfaceLight, 
    borderRadius: borderRadius.sm, 
    paddingVertical: 1, 
    paddingHorizontal: spacing.sm, 
    borderWidth: 1, 
    borderColor: colors.border 
  },
  slotBadgeSelected: { 
    backgroundColor: colors.primary, 
    borderColor: colors.primary, 
  },
  slotBadgeText: { 
    color: colors.textSecondary, 
    fontSize: 8, 
    fontWeight: '800' 
  },
  slotEmptyEmoji: { 
    fontSize: 12, 
    color: colors.textMuted, 
    fontWeight: '600',
    marginBottom: 0 
  },
  slotEmptyText: { 
    color: colors.textMuted, 
    fontSize: 7.5, 
    lineHeight: 9,
    fontWeight: '700' 
  },
  slotDeleteBtn: { 
    position: 'absolute', 
    top: -5, 
    right: -5, 
    width: 18, 
    height: 18, 
    borderRadius: 9, 
    backgroundColor: colors.surfaceElevated, 
    borderWidth: 1, 
    borderColor: colors.border, 
    alignItems: 'center', 
    justifyContent: 'center', 
    ...shadow(2),
  },
  slotDeleteEmoji: { 
    fontSize: 12, 
    color: colors.textPrimary,
    fontWeight: '900',
    marginTop: -2,
  },
});
