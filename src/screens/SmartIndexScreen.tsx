// ========================================
// KPSS Smart Index (Akıllı Filtre & Sözlük) Screen
// Allows user to select a historical figure or resource and generates
// an on-the-fly clean-text KPSS study guide based on their PDF & academic knowledge.
// ========================================

import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, borderRadius, spacing, fontSize } from '../theme/colors';
import { useSettingsStore } from '../store/useSettingsStore';
import { useQuizStore } from '../store/useQuizStore';
import { generateSmartIndexSummary } from '../services/geminiService';

interface IndexItem {
  id: string;
  name: string;
  emoji: string;
  sub: string;
}

const HISTORICAL_FIGURES: IndexItem[] = [
  { id: '1', name: 'II. Mahmut', emoji: '👑', sub: 'En Çok KPSS Sorusu Çıkan Islahat Padişahı' },
  { id: '2', name: 'III. Selim', emoji: '⚔️', sub: 'Nizam-ı Cedid Dönemi ve Islahatları' },
  { id: '3', name: 'Fatih Sultan Mehmet', emoji: '🏰', sub: 'Yükselme Dönemi, İdari ve Kültürel Atılımlar' },
  { id: '4', name: 'Kanuni Sultan Süleyman', emoji: '⚖️', sub: 'Kanunnameler ve En Geniş Sınırlar' },
  { id: '5', name: 'Mustafa Kemal Atatürk', emoji: '⭐️', sub: 'Kurtuluş Savaşı, İlke ve İnkılaplar' },
  { id: '6', name: 'II. Abdülhamit', emoji: '📜', sub: 'Kanun-i Esasi ve İstibdat Dönemi Gelişmeleri' },
  { id: '7', name: 'Köprülü Mehmed Paşa', emoji: '🛡️', sub: 'Şartlı Sadrazam ve Duraklama Islahatları' },
  { id: '8', name: 'Sokollu Mehmed Paşa', emoji: '🏗️', sub: 'Üç Padişaha Sadrazamlık ve Kanal Projeleri' },
  { id: '9', name: 'Yavuz Sultan Selim', emoji: '🕌', sub: 'Hilafet Makamı ve Doğu Seferleri' },
  { id: '10', name: 'Orhan Bey', emoji: '⚔️', sub: 'Teşkilatlanma Dönemi (Divan, Yaya-Müsellem)' },
  { id: '11', name: 'Osman Bey', emoji: '👑', sub: 'Devletin Kuruluşu ve İlk Bakır Para' },
  { id: '12', name: 'I. Murat', emoji: '🛡️', sub: 'Kapıkulu Ocağı, Tımar ve Sancak Sistemi' },
  { id: '13', name: 'Talat Paşa', emoji: '📜', sub: 'İttihat ve Terakki Dönemi Gelişmeleri' },
  { id: '14', name: 'Damat Ferit Paşa', emoji: '✍️', sub: 'Milli Mücadele Karşıtı Hükümet Dönemleri' },
  { id: '15', name: 'Amiral Bristol', emoji: '📊', sub: 'Türk Haklılığını Kanıtlayan İlk Uluslararası Rapor' },
  { id: '16', name: 'General Harbourd', emoji: '📝', sub: 'Doğu Anadolu ve Ermeni Meselesi Raporu' },
];

const GEOGRAPHICAL_RESOURCES: IndexItem[] = [
  { id: '1', name: 'Bor', emoji: '💎', sub: 'Türkiye\'nin En Zengin Rezervli Madeni' },
  { id: '2', name: 'Bakır', emoji: '⚡', sub: 'Kastamonu Küre, Artvin Murgul Çıkarım ve İşletim' },
  { id: '3', name: 'Linyit', emoji: '🔥', sub: 'En Yaygın Termik Enerji Kaynağımız' },
  { id: '4', name: 'Krom', emoji: '🛡️', sub: 'Paslanmaz Çelik ve Fethiye Muğla Rezervi' },
  { id: '5', name: 'Demir', emoji: '🏗️', sub: 'Sivas Divriği Çıkarım, Karabük Ereğli Fabrikaları' },
  { id: '6', name: 'Doğalgaz', emoji: '☁️', sub: 'Hamitabat ve Akçakoca Çıkarımları' },
  { id: '7', name: 'Taş Kömürü', emoji: '🪨', sub: 'Zonguldak Çıkarımı ve Çatalağzı Santrali' },
  { id: '8', name: 'Jeotermal Enerji', emoji: '♨️', sub: 'Denizli Sarayköy ve Fay Hatları Kaynakları' },
  { id: '9', name: 'Boksit', emoji: '🏗️', sub: 'Konya Seydişehir Alüminyum Tesisleri' },
  { id: '10', name: 'Mermer', emoji: '🪨', sub: 'Türkiye\'nin En Çok İhraç Ettiği Maden Grubu' },
  { id: '11', name: 'Asbest', emoji: '🔥', sub: 'Isıya Dayanıklı Lifli Maden Rezervleri' },
  { id: '12', name: 'Manganez', emoji: '🛡️', sub: 'Demir-Çelik Sanayi Sertleştirici Katkısı' },
  { id: '13', name: 'Barit', emoji: '🛢️', sub: 'Petrol Arama Sondaj Kuyuları Katkısı' },
  { id: '14', name: 'Petrol', emoji: '🛢️', sub: 'Batman Raman Dağı Çıkarım ve Rafineriler' },
  { id: '15', name: 'Rüzgar Enerjisi', emoji: '💨', sub: 'İzmir, Balıkesir ve Ege Kıyıları Potansiyeli' },
  { id: '16', name: 'Güneş Enerjisi', emoji: '☀️', sub: 'Güneydoğu Anadolu ve Akdeniz Bölgeleri Gücü' },
];

export const SmartIndexScreen: React.FC = () => {
  const colors = useTheme();
  const { apiKey } = useSettingsStore();
  const { pdfBase64, geminiFileUri } = useQuizStore();

  const [activeTab, setActiveTab] = useState<'tarih' | 'cografya'>('tarih');
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const items = activeTab === 'tarih' ? HISTORICAL_FIGURES : GEOGRAPHICAL_RESOURCES;

  const handleSelectItem = async (concept: string) => {
    if (!apiKey) {
      Alert.alert('API Anahtarı Gerekli', 'Akıllı özetler hazırlamak için önce Ayarlar ekranından API anahtarınızı girin.');
      return;
    }

    try {
      setLoading(true);
      setSelectedConcept(concept);
      setSummary(null);

      const res = await generateSmartIndexSummary(
        concept,
        activeTab,
        apiKey,
        pdfBase64,
        geminiFileUri
      );
      setSummary(res);
    } catch (err: any) {
      console.error(err);
      Alert.alert('Hata', 'Ders notu hazırlanırken bir hata oluştu. Lütfen tekrar deneyin.');
      setSelectedConcept(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedConcept(null);
    setSummary(null);
  };

  // Helper to clean up Markdown formatting characters so they look clean and polished
  const getCleanLine = (line: string): string => {
    return line
      .replace(/\*\*\*/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/###/g, '')
      .replace(/##/g, '')
      .replace(/#/g, '')
      .trim();
  };

  const s = getStyles(colors);

  return (
    <SafeAreaView style={s.container} edges={['bottom']}>
      {/* Tabs */}
      <View style={s.tabRow}>
        <TouchableOpacity
          style={[s.tab, activeTab === 'tarih' && s.tabActTarih]}
          onPress={() => setActiveTab('tarih')}
          activeOpacity={0.7}
        >
          <Text style={s.tabEmoji}>📜</Text>
          <Text style={[s.tabText, activeTab === 'tarih' && s.tabTextAct]}>Tarih İndeksi</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tab, activeTab === 'cografya' && s.tabActCog]}
          onPress={() => setActiveTab('cografya')}
          activeOpacity={0.7}
        >
          <Text style={s.tabEmoji}>🌍</Text>
          <Text style={[s.tabText, activeTab === 'cografya' && s.tabTextAct]}>Coğrafya İndeksi</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scrollArea} showsVerticalScrollIndicator={false} contentContainerStyle={s.listContent}>
        <Text style={s.title}>
          {activeTab === 'tarih' ? '👑 KPSS Akıllı Padişah & Sadrazam İndeksi' : '⛏️ KPSS Akıllı Maden & Kaynak İndeksi'}
        </Text>
        <Text style={s.subtitle}>
          Aşağıdaki kritik kavramlardan birini seçtiğinizde yapay zeka yüklediğiniz PDF notlarını derinlemesine tarayarak size özel nokta atışı ders notu hazırlar.
        </Text>

        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={s.indexCard}
            onPress={() => handleSelectItem(item.name)}
            activeOpacity={0.7}
          >
            <View style={s.emojiContainer}>
              <Text style={s.cardEmoji}>{item.emoji}</Text>
            </View>
            <View style={s.cardTextContent}>
              <Text style={s.cardTitle}>{item.name}</Text>
              <Text style={s.cardSub}>{item.sub}</Text>
            </View>
            <Text style={s.cardArrow}>➡️</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Loading Modal */}
      {loading && (
        <View style={s.modalOverlay}>
          <View style={s.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={s.loadingTitle}>Ders Notu Hazırlanıyor... ⚡</Text>
            <Text style={s.loadingDesc}>
              Yapay zeka buluttaki PDF dokümanınızı tarıyor, seçtiğiniz kavramı süzüyor ve KPSS altın tüyoları içeren özel bir not tasarlıyor.
            </Text>
          </View>
        </View>
      )}

      {/* Summary View Modal */}
      {!loading && selectedConcept && summary && (
        <View style={s.modalOverlay}>
          <SafeAreaView style={s.modalContainer} edges={['top', 'bottom']}>
            {/* Modal Header */}
            <View style={s.modalHeader}>
              <Text style={s.modalHeaderTitle}>{selectedConcept}</Text>
              <TouchableOpacity style={s.closeBtn} onPress={handleCloseModal}>
                <Text style={s.closeText}>✕ Kapat</Text>
              </TouchableOpacity>
            </View>

            {/* Markdown Summary Render with Clean Formatting */}
            <ScrollView style={s.modalBody} showsVerticalScrollIndicator={false} contentContainerStyle={s.modalBodyContent}>
              {summary.split('\n').map((line, idx) => {
                const cleanLine = getCleanLine(line);
                if (!cleanLine) return null;

                if (line.startsWith('# ')) {
                  return <Text key={idx} style={s.mdH1}>{cleanLine}</Text>;
                } else if (line.startsWith('## ') || line.startsWith('### ')) {
                  return <Text key={idx} style={s.mdH2}>{cleanLine}</Text>;
                } else if (line.startsWith('- ') || line.startsWith('* ') || line.match(/^\d+\./)) {
                  // If it starts with a number or dot, clean the prefix slightly
                  const content = line.replace(/^-\s*/, '').replace(/^\*\s*/, '');
                  return (
                    <View key={idx} style={s.bulletRow}>
                      <Text style={s.bulletDot}>•</Text>
                      <Text style={s.bulletText}>{getCleanLine(content)}</Text>
                    </View>
                  );
                } else {
                  return <Text key={idx} style={s.mdPara}>{cleanLine}</Text>;
                }
              })}
            </ScrollView>
          </SafeAreaView>
        </View>
      )}
    </SafeAreaView>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    padding: spacing.md,
    gap: spacing.md
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface
  },
  tabActTarih: {
    borderColor: colors.tarih,
    backgroundColor: colors.tarih + '15',
  },
  tabActCog: {
    borderColor: colors.cografya,
    backgroundColor: colors.cografya + '15',
  },
  tabEmoji: { fontSize: 16, marginRight: 6 },
  tabText: { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: '600' },
  tabTextAct: { color: colors.textPrimary, fontWeight: '700' },
  
  scrollArea: { flex: 1 },
  listContent: { padding: spacing.xxl },
  title: { color: colors.textPrimary, fontSize: fontSize.xl, fontWeight: '800', marginBottom: 6 },
  subtitle: { color: colors.textSecondary, fontSize: fontSize.sm, lineHeight: 20, marginBottom: spacing.xl },
  
  indexCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md
  },
  emojiContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md
  },
  cardEmoji: { fontSize: 20 },
  cardTextContent: { flex: 1 },
  cardTitle: { color: colors.textPrimary, fontSize: fontSize.md, fontWeight: '700', marginBottom: 2 },
  cardSub: { color: colors.textSecondary, fontSize: fontSize.xs },
  cardArrow: { fontSize: 14, color: colors.textMuted },
  
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999
  },
  loadingBox: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xxxl,
    marginHorizontal: spacing.xxl,
    alignItems: 'center'
  },
  loadingTitle: { color: colors.textPrimary, fontSize: fontSize.lg, fontWeight: '800', marginTop: spacing.xl, marginBottom: spacing.md },
  loadingDesc: { color: colors.textSecondary, fontSize: fontSize.sm, textAlign: 'center', lineHeight: 22 },
  
  modalContainer: {
    width: '94%',
    height: '92%',
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: 'hidden'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  modalHeaderTitle: { color: colors.textPrimary, fontSize: fontSize.lg, fontWeight: '800' },
  closeBtn: {
    backgroundColor: colors.surfaceHighlight,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border
  },
  closeText: { color: colors.textSecondary, fontSize: fontSize.xs, fontWeight: '700' },
  
  modalBody: { flex: 1 },
  modalBodyContent: { padding: spacing.xl, paddingBottom: spacing.xxl },
  
  mdH1: { color: colors.primary, fontSize: fontSize.xl, fontWeight: '800', marginVertical: spacing.lg },
  mdH2: { color: colors.textPrimary, fontSize: fontSize.lg, fontWeight: '800', marginTop: spacing.xl, marginBottom: spacing.md },
  mdPara: { color: colors.textSecondary, fontSize: fontSize.md, lineHeight: 26, marginVertical: 6 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 6 },
  bulletDot: { fontSize: 18, color: colors.primary, marginRight: 8 },
  bulletText: { flex: 1, color: colors.textSecondary, fontSize: fontSize.md, lineHeight: 26 }
});
