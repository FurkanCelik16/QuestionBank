import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Animated, ActivityIndicator,
  Platform, TextInput,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, borderRadius, spacing, fontSize } from '../theme/colors';
import { topics, questionCountOptions } from '../data/topics';
import { TopicCheckbox } from '../components/TopicCheckbox';
import { useSettingsStore } from '../store/useSettingsStore';
import { useQuizStore } from '../store/useQuizStore';
import { uploadToGeminiFiles } from '../services/geminiService';
import { MapQuizHomeScreen } from './MapQuizHomeScreen';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, DifficultyLevel } from '../types';

const difficultyOptions: { key: DifficultyLevel; label: string; emoji: string }[] = [
  { key: 'easy', label: 'Kolay', emoji: '😊' },
  { key: 'medium', label: 'Orta', emoji: '🎯' },
  { key: 'hard', label: 'Zor', emoji: '🔥' },
  { key: 'extreme', label: 'Uzman', emoji: '💀' },
];

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'TopicSelection'>;
};

export const TopicSelectionScreen: React.FC<Props> = ({ navigation }) => {
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
  }, []);
  
  const [isPicking, setIsPicking] = useState(false);
  const [activeTab, setActiveTab] = useState<'tarih' | 'cografya' | 'harita'>('tarih');
  const buttonScale = React.useRef(new Animated.Value(1)).current;
  const colors = useTheme();

  const selectedTopicsSet = new Set(selectedTopics);
  const filteredTopics = topics.filter((t) => t.category === activeTab);

  const toggleTopic = useCallback((topicId: string) => {
    const nextSet = new Set(selectedTopicsSet);
    nextSet.has(topicId) ? nextSet.delete(topicId) : nextSet.add(topicId);
    setSelectedTopics(Array.from(nextSet));
  }, [selectedTopicsSet, setSelectedTopics]);

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
          // Web specific: result.assets[0].file is a File object on web
          const response = await fetch(asset.uri);
          const blob = await response.blob();
          base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const res = reader.result as string;
              resolve(res.split(',')[1]); // Remove data:application/pdf;base64,
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } else {
          // Native specific: Use expo-file-system
          base64 = await FileSystem.readAsStringAsync(asset.uri, {
            encoding: 'base64',
          });
        }

        // Upload directly to Gemini Files API
        const geminiUri = await uploadToGeminiFiles(base64, asset.name, apiKey, Platform.OS !== 'web' ? asset.uri : null);

        uploadToPdfSlot(slotId, asset.uri, base64, asset.name, geminiUri);

        if (Platform.OS === 'web') {
          window.alert(`${asset.name} başarıyla Google Gemini bulut sunucusuna yüklendi! Sorularınız artık saniyeler içinde hazırlanacaktır.`);
        } else {
          Alert.alert(
            'Yükleme Başarılı',
            `${asset.name} başarıyla Google Gemini bulut sunucusuna yüklendi! Sorularınız artık saniyeler içinde hazırlanacaktır.`
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
      Alert.alert('API Anahtarı Gerekli',
        'Test oluşturmak için önce Gemini API anahtarınızı girmelisiniz.',
        [{ text: 'İptal', style: 'cancel' },
         { text: 'Ayarlara Git', onPress: () => navigation.navigate('Settings') }]);
      return;
    }
    if (selectedTopics.length === 0 && !pdfUri) {
      Alert.alert('Seçim Yapın', 'Lütfen en az bir konu seçin veya bir PDF dokümanı yükleyin.');
      return;
    }
    const names = topics.filter((t) => selectedTopicsSet.has(t.id)).map((t) => t.name);
    Animated.sequence([
      Animated.timing(buttonScale, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.spring(buttonScale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    
    // We pass the settings to loading. 
    // Wait, since selectedTopics are now in store, we don't strictly need to pass them in route params,
    // but we can keep it for backwards compatibility with LoadingScreen.
    navigation.navigate('Loading', { selectedTopics: names, questionCount, difficulty });
  };

  const tarihCount = topics.filter((t) => t.category === 'tarih' && selectedTopicsSet.has(t.id)).length;
  const cogCount = topics.filter((t) => t.category === 'cografya' && selectedTopicsSet.has(t.id)).length;
  const allCategorySel = filteredTopics.length > 0 && filteredTopics.every((t) => selectedTopicsSet.has(t.id));

  const s = getStyles(colors);

  return (
    <SafeAreaView style={s.container} edges={['bottom']}>
      <View style={s.header}>
        <Text style={s.headerTitle}>KPSS Hazırlık</Text>
        <Text style={s.headerSub}>Konuları seç, test oluştur, başarını ölç</Text>
      </View>
      
      <View style={s.tabRow}>
        <TouchableOpacity style={[s.tab, activeTab === 'tarih' && s.tabActTarih]} onPress={() => setActiveTab('tarih')} activeOpacity={0.7}>
          <Text style={s.tabEmoji}>📜</Text>
          <Text style={[s.tabText, activeTab === 'tarih' && s.tabTextAct]}>Tarih</Text>
          {tarihCount > 0 && <View style={[s.badge, { backgroundColor: colors.tarih }]}><Text style={s.badgeText}>{tarihCount}</Text></View>}
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, activeTab === 'cografya' && s.tabActCog]} onPress={() => setActiveTab('cografya')} activeOpacity={0.7}>
          <Text style={s.tabEmoji}>🌍</Text>
          <Text style={[s.tabText, activeTab === 'cografya' && s.tabTextAct]}>Coğrafya</Text>
          {cogCount > 0 && <View style={[s.badge, { backgroundColor: colors.cografya }]}><Text style={s.badgeText}>{cogCount}</Text></View>}
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, activeTab === 'harita' && s.tabActHarita]} onPress={() => setActiveTab('harita')} activeOpacity={0.7}>
          <Text style={s.tabEmoji}>🗺️</Text>
          <Text style={[s.tabText, activeTab === 'harita' && s.tabTextAct]}>Harita</Text>
        </TouchableOpacity>
      </View>
      
      {activeTab === 'harita' ? (
        <View style={{ flex: 1 }}>
          <MapQuizHomeScreen navigation={navigation as any} />
        </View>
      ) : (
        <>
          <TouchableOpacity style={s.selAll} onPress={selectAllInCategory} activeOpacity={0.7}>
            <Text style={s.selAllText}>{allCategorySel ? '✗ Tümünü Kaldır' : '✓ Tümünü Seç'}</Text>
          </TouchableOpacity>
      
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
            <View style={s.pdfHeader}>
            <Text style={s.qcLabel}>Kaynak Doküman Kütüphanesi (En Fazla 3 Adet)</Text>
            {pdfUri && (
              <TouchableOpacity onPress={() => selectPdfSlot(null)}>
                <Text style={s.clearPdf}>Seçimi Kaldır</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={s.slotsRow}>
            {['slot_1', 'slot_2', 'slot_3'].map((slotId, index) => {
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
                    activeOpacity={0.7}
                  >
                    {isPicking && !slot && selectedSlotId === slotId ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : slot ? (
                      <>
                        <Text style={s.slotEmoji}>📄</Text>
                        <Text style={s.slotName} numberOfLines={2}>
                          {slot.name}
                        </Text>
                        <View style={[s.slotBadge, isSelected && s.slotBadgeSelected]}>
                          <Text style={[s.slotBadgeText, isSelected && { color: colors.background }]}>
                            {isSelected ? 'Aktif' : 'Seç'}
                          </Text>
                        </View>
                      </>
                    ) : (
                      <>
                        <Text style={s.slotEmptyEmoji}>➕</Text>
                        <Text style={s.slotEmptyText}>Slot {index + 1}</Text>
                        <Text style={s.slotAddSub}>Yükle</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  {slot && (
                    <TouchableOpacity
                      style={s.slotDeleteBtn}
                      onPress={() => {
                        Alert.alert(
                          'Dokümanı Sil',
                          `"${slot.name}" belgesini silmek istediğinize emin misiniz?`,
                          [
                            { text: 'Vazgeç', style: 'cancel' },
                            { text: 'Sil', style: 'destructive', onPress: () => clearPdfSlot(slotId) },
                          ]
                        );
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={s.slotDeleteEmoji}>🗑️</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>

          {pdfUri && <Text style={s.pdfHint}>* Sorular öncelikle seçili olan aktif PDF'teki bilgilere göre hazırlanacaktır.</Text>}
          {pdfUri && (
            <View style={s.pageRangeContainer}>
              <Text style={s.pageRangeLabel}>🎯 Sayfa Aralığı Sınırla (Opsiyonel)</Text>
              <TextInput
                style={s.pageRangeInput}
                placeholder="Örn: 45-60 (Boş bırakırsanız tümü taranır)"
                placeholderTextColor={colors.textSecondary}
                value={pdfPageRange || ''}
                onChangeText={(val) => setPdfPageRange(val || null)}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          )}
      </ScrollView>
      
      <View style={s.bottom}>
        <View style={s.qcSection}>
          <Text style={s.qcLabel}>Soru Sayısı</Text>
          <View style={s.qcRow}>
            {questionCountOptions.map((c) => (
              <TouchableOpacity key={c} style={[s.qcBtn, questionCount === c && s.qcBtnAct]} onPress={() => setQuestionCount(c)} activeOpacity={0.7}>
                <Text style={[s.qcBtnText, questionCount === c && s.qcBtnTextAct]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={s.qcSection}>
          <Text style={s.qcLabel}>Zorluk Seviyesi</Text>
          <View style={s.qcRow}>
            {difficultyOptions.map((d) => (
              <TouchableOpacity key={d.key} style={[s.qcBtn, difficulty === d.key && s.qcBtnAct]} onPress={() => setDifficulty(d.key)} activeOpacity={0.7}>
                <Text style={[s.diffText, difficulty === d.key && s.qcBtnTextAct]}>{d.emoji}</Text>
                <Text style={[s.diffLabel, difficulty === d.key && s.qcBtnTextAct]}>{d.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity 
            style={[s.startBtn, (selectedTopics.length === 0 && !pdfUri) && s.startBtnDis]} 
            onPress={handleStartQuiz} 
            activeOpacity={0.8} 
            disabled={selectedTopics.length === 0 && !pdfUri}
          >
            <Text style={[s.startBtnText, (selectedTopics.length === 0 && !pdfUri) && s.startBtnTextDis]}>🚀 Test Oluştur</Text>
            {(selectedTopics.length > 0 || pdfUri) && (
              <Text style={s.startBtnSub}>
                {pdfUri ? 'PDF + ' : ''}{selectedTopics.length} konu · {questionCount} soru · {difficultyOptions.find(d => d.key === difficulty)?.label}
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

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.xxl, paddingTop: spacing.lg, paddingBottom: spacing.md },
  headerTitle: { color: colors.textPrimary, fontSize: fontSize.xxxl, fontWeight: '800' },
  headerSub: { color: colors.textSecondary, fontSize: fontSize.md, marginTop: spacing.xs },
  tabRow: { flexDirection: 'row', marginHorizontal: spacing.xxl, marginBottom: spacing.md, gap: spacing.sm },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.md, paddingVertical: spacing.md, borderWidth: 1.5, borderColor: colors.border, gap: spacing.xs },
  tabActTarih: { borderColor: colors.tarih, backgroundColor: colors.tarihGlow },
  tabActCog: { borderColor: colors.cografya, backgroundColor: colors.cografyaGlow },
  tabActHarita: { borderColor: colors.primary, backgroundColor: colors.primaryGlow },
  tabEmoji: { fontSize: 18 },
  tabText: { color: colors.textSecondary, fontSize: fontSize.md, fontWeight: '600' },
  tabTextAct: { color: colors.textPrimary },
  badge: { borderRadius: borderRadius.full, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { color: colors.textInverse, fontSize: fontSize.xs, fontWeight: '800' },
  selAll: { alignSelf: 'flex-end', marginRight: spacing.xxl, marginBottom: spacing.sm, paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
  selAllText: { color: colors.accent, fontSize: fontSize.sm, fontWeight: '600' },
  list: { flex: 1, paddingHorizontal: spacing.xxl },
  listContent: { paddingBottom: spacing.md },
  bottom: { paddingHorizontal: spacing.xxl, paddingTop: spacing.lg, paddingBottom: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
  qcSection: { marginBottom: spacing.lg },
  qcLabel: { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: '600', marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  qcRow: { flexDirection: 'row', gap: spacing.sm },
  qcBtn: { flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.surfaceLight, borderWidth: 1.5, borderColor: colors.border },
  qcBtnAct: { borderColor: colors.primary, backgroundColor: colors.primaryGlow },
  qcBtnText: { color: colors.textSecondary, fontSize: fontSize.lg, fontWeight: '700' },
  qcBtnTextAct: { color: colors.primary },
  diffText: { color: colors.textSecondary, fontSize: 14 },
  diffLabel: { color: colors.textSecondary, fontSize: fontSize.xs, fontWeight: '600' },
  startBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.lg, paddingVertical: spacing.lg, alignItems: 'center' },
  startBtnDis: { backgroundColor: colors.surfaceHighlight },
  startBtnText: { color: colors.textInverse, fontSize: fontSize.lg, fontWeight: '700' },
  startBtnTextDis: { color: colors.textMuted },
  startBtnSub: { color: 'rgba(255,255,255,0.7)', fontSize: fontSize.xs, marginTop: 2 },
  pdfHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  clearPdf: { color: colors.error, fontSize: fontSize.xs, fontWeight: '600' },
  pdfBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceLight, borderRadius: borderRadius.md, padding: spacing.md, borderStyle: 'dashed', borderWidth: 1.5, borderColor: colors.border, gap: spacing.sm },
  pdfBtnActive: { borderColor: colors.primary, backgroundColor: colors.primaryGlow, borderStyle: 'solid' },
  pdfEmoji: { fontSize: 20 },
  pdfText: { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: '500', flex: 1 },
  pdfTextActive: { color: colors.primary, fontWeight: '700' },
  pdfHint: { color: colors.textSecondary, fontSize: 10, marginTop: 4, fontStyle: 'italic' },
  pageRangeContainer: { marginTop: spacing.md, backgroundColor: colors.surfaceLight, borderRadius: borderRadius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  pageRangeLabel: { color: colors.textPrimary, fontSize: fontSize.xs, fontWeight: '700', marginBottom: spacing.xs },
  pageRangeInput: { height: 40, backgroundColor: colors.surface, borderRadius: borderRadius.sm, paddingHorizontal: spacing.md, color: colors.textPrimary, fontSize: fontSize.sm, borderWidth: 1, borderColor: colors.border },
  slotsRow: { flexDirection: 'row', gap: spacing.md, justifyContent: 'space-between', marginBottom: spacing.xs },
  slotWrapper: { flex: 1, position: 'relative' },
  slotCard: { flex: 1, aspectRatio: 0.85, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceLight, borderRadius: borderRadius.md, borderWidth: 1.5, borderColor: colors.border, padding: spacing.sm },
  slotCardSelected: { borderColor: colors.primary, backgroundColor: colors.primaryGlow },
  slotCardFilled: { borderStyle: 'solid' },
  slotEmoji: { fontSize: 24, marginBottom: spacing.xs },
  slotName: { color: colors.textPrimary, fontSize: fontSize.xs, fontWeight: '600', textAlign: 'center', flex: 1, marginBottom: 4 },
  slotBadge: { backgroundColor: colors.surface, borderRadius: borderRadius.full, paddingVertical: 2, paddingHorizontal: spacing.sm, borderWidth: 1, borderColor: colors.border },
  slotBadgeSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  slotBadgeText: { color: colors.textSecondary, fontSize: 10, fontWeight: '700' },
  slotEmptyEmoji: { fontSize: 20, color: colors.textSecondary, marginBottom: 2 },
  slotEmptyText: { color: colors.textPrimary, fontSize: fontSize.sm, fontWeight: '700' },
  slotAddSub: { color: colors.textSecondary, fontSize: 10, fontWeight: '500', marginTop: 2 },
  slotDeleteBtn: { position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1, elevation: 2 },
  slotDeleteEmoji: { fontSize: 10 },
});
