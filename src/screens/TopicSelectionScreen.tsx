import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, borderRadius, spacing, fontSize } from '../theme/colors';
import { topics, questionCountOptions } from '../data/topics';
import { TopicCheckbox } from '../components/TopicCheckbox';
import { useSettingsStore } from '../store/useSettingsStore';
import { useQuizStore } from '../store/useQuizStore';
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
  const { selectedTopics, questionCount, difficulty, setSelectedTopics, setQuestionCount, setDifficulty } = useQuizStore();
  
  const [activeTab, setActiveTab] = useState<'tarih' | 'cografya'>('tarih');
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

  const handleStartQuiz = () => {
    if (!apiKey) {
      Alert.alert('API Anahtarı Gerekli',
        'Test oluşturmak için önce Gemini API anahtarınızı girmelisiniz.',
        [{ text: 'İptal', style: 'cancel' },
         { text: 'Ayarlara Git', onPress: () => navigation.navigate('Settings') }]);
      return;
    }
    if (selectedTopics.length === 0) {
      Alert.alert('Konu Seçin', 'Lütfen en az bir konu seçin.');
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
      </View>
      
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
          <TouchableOpacity style={[s.startBtn, selectedTopics.length === 0 && s.startBtnDis]} onPress={handleStartQuiz} activeOpacity={0.8} disabled={selectedTopics.length === 0}>
            <Text style={[s.startBtnText, selectedTopics.length === 0 && s.startBtnTextDis]}>🚀 Test Oluştur</Text>
            {selectedTopics.length > 0 && <Text style={s.startBtnSub}>{selectedTopics.length} konu · {questionCount} soru · {difficultyOptions.find(d => d.key === difficulty)?.label}</Text>}
          </TouchableOpacity>
        </Animated.View>
      </View>
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
});
