// ========================================
// KPSS Timeline & Chronology Game (Zaman Tüneli) Screen
// Includes interactive Timeline Explorer and a Chronological Sorting Game (Idea 6).
// Features highly expanded event databases and fully dynamic random subsets.
// ========================================

import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Animated, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, borderRadius, spacing, fontSize } from '../theme/colors';

interface TimelineEvent {
  id: string;
  year: number;
  title: string;
  desc: string;
  emoji: string;
}

interface Era {
  id: string;
  title: string;
  events: TimelineEvent[];
}

const HISTORICAL_ERAS: Era[] = [
  {
    id: 'kurulus',
    title: '👑 Osmanlı Kuruluş ve Yükselme Dönemi',
    events: [
      { id: 'k1', year: 1302, title: 'Koyunhisar Savaşı', desc: 'Bizans İmparatorluğu ile yapılan ilk savaş ve zafer.', emoji: '⚔️' },
      { id: 'k2', year: 1326, title: 'Bursa’nın Fethi', desc: 'Bursa fethedilerek Osmanlı Devleti’nin yeni başkenti yapıldı.', emoji: '🏰' },
      { id: 'k3', year: 1364, title: 'Sırpsındığı Savaşı', desc: 'İlk Osmanlı-Haçlı savaşı ve Haçlıların bozguna uğratılması.', emoji: '⚔️' },
      { id: 'k4', year: 1402, title: 'Ankara Savaşı', desc: 'Yıldırım Bayezid ile Timur arasında yapıldı, Fetret Devri başladı.', emoji: '📉' },
      { id: 'k5', year: 1444, title: 'Edirne-Segedin Antlaşması', desc: 'Osmanlı ile Macarlar arasında imzalanan ilk barış antlaşması.', emoji: '📜' },
      { id: 'k6', year: 1453, title: 'İstanbul’un Fethi', desc: 'Bizans İmparatorluğu’nun sonu, Yeni Çağ’ın açılışı.', emoji: '🏰' },
      { id: 'k7', year: 1473, title: 'Otlukbeli Savaşı', desc: 'Fatih Sultan Mehmet’in Akkoyunlu devletine karşı kesin zaferi.', emoji: '⚔️' },
      { id: 'k8', year: 1514, title: 'Çaldıran Savaşı', desc: 'Yavuz Sultan Selim’in Safevilere karşı kazandığı tarihi doğu zaferi.', emoji: '🛡️' },
      { id: 'k9', year: 1515, title: 'Turnadağ Savaşı', desc: 'Dulkadiroğullarının yıkılmasıyla Anadolu Türk birliği kesin olarak sağlandı.', emoji: '🤝' },
      { id: 'k10', year: 1538, title: 'Preveze Deniz Zaferi', desc: 'Barbaros Hayreddin Paşa komutasında Akdeniz Türk gölü haline geldi.', emoji: '⛵' },
    ]
  },
  {
    id: 'duraklama',
    title: '📉 Osmanlı Duraklama ve Gerileme Dönemi',
    events: [
      { id: 'd1', year: 1590, title: 'Ferhat Paşa Antlaşması', desc: 'Osmanlı Devleti doğuda en geniş sınırlarına ulaştı.', emoji: '📜' },
      { id: 'd2', year: 1606, title: 'Zitvatorok Antlaşması', desc: 'Avusturya kralı Osmanlı padişahına siyasi olarak eşit sayıldı.', emoji: '📜' },
      { id: 'd3', year: 1672, title: 'Bucaş Antlaşması', desc: 'Osmanlı Devleti batıda en geniş sınırlarına ulaştı.', emoji: '📜' },
      { id: 'd4', year: 1699, title: 'Karlofça Antlaşması', desc: 'Osmanlı’nın batıda ilk kez büyük çapta toprak kaybettiği antlaşma.', emoji: '📉' },
      { id: 'd5', year: 1703, title: 'Edirne Vakası', desc: 'Yeniçeri isyanıyla II. Mustafa tahttan indirilip III. Ahmet tahta çıkarıldı.', emoji: '📉' },
      { id: 'd6', year: 1718, title: 'Pasarofça Antlaşması ve Lale Devri', desc: 'Pasarofça sonrası başlayan, batı tarzı ıslahatların yapıldığı Lale Devri.', emoji: '🌷' },
      { id: 'd7', year: 1739, title: 'Belgrad Antlaşması', desc: 'Gerileme döneminin en kazançlı antlaşması; Karadeniz\'in son kez Türk gölü sayılması.', emoji: '✍️' },
      { id: 'd8', year: 1774, title: 'Küçük Kaynarca Antlaşması', desc: 'Kırım bağımsız oldu; Osmanlı ilk kez savaş tazminatı ödedi.', emoji: '📜' },
      { id: 'd9', year: 1792, title: 'Yaş Antlaşması', desc: 'Kırım’ın Rusya’ya ait olduğu kabul edildi; gerileme bitti, dağılma başladı.', emoji: '✍️' },
      { id: 'd10', year: 1808, title: 'Sened-i İttifak', desc: 'II. Mahmut döneminde padişahın yetkilerinin ilk kez sınırlandırılması.', emoji: '📜' },
    ]
  },
  {
    id: 'kurtulus',
    title: '⭐️ Milli Mücadele ve Cumhuriyet Dönemi',
    events: [
      { id: 'm1', year: 1919, title: 'Amasya Genelgesi', desc: 'Milli mücadelenin amacı, gerekçesi ve yönteminin ilk kez belirtilmesi.', emoji: '📢' },
      { id: 'm2', year: 1919, title: 'Erzurum Kongresi', desc: 'Manda ve himaye fikrinin ilk kez reddedilerek ulusal sınırların çizilmesi.', emoji: '🤝' },
      { id: 'm3', year: 1919, title: 'Sivas Kongresi', desc: 'Tüm yararlı cemiyetlerin Anadolu ve Rumeli M.H.C. altında birleşmesi.', emoji: '🤝' },
      { id: 'm4', year: 1920, title: 'TBMM’nin Açılması', desc: 'Ulusal egemenliği temsil eden meclisin Ankara\'da kurulması.', emoji: '🏛️' },
      { id: 'm5', year: 1920, title: 'Sevr Antlaşması', desc: 'Osmanlı\'yı parçalayan, Türk milletince geçersiz kılınan antlaşma.', emoji: '📉' },
      { id: 'm6', year: 1921, title: 'I. İnönü Savaşı', desc: 'Yeni kurulan düzenli ordunun Batı cephesindeki ilk askeri zaferi.', emoji: '🎖️' },
      { id: 'm7', year: 1921, title: 'Sakarya Meydan Muharebesi', desc: 'II. Viyana\'dan beri süren geri çekilmenin bittiği tarihi zafer.', emoji: '🎖️' },
      { id: 'm8', year: 1922, title: 'Büyük Taarruz', desc: 'Başkomutanlık Meydan Muharebesi ile düşmanın yurttan tamamen temizlenmesi.', emoji: '⚔️' },
      { id: 'm9', year: 1922, title: 'Saltanatın Kaldırılması', desc: 'Cumhuriyet ilanı yolundaki ilk büyük laik demokratik inkılap.', emoji: '👑' },
      { id: 'm10', year: 1923, title: 'Lozan Barış Antlaşması', desc: 'Yeni Türk devletinin bağımsızlığının tüm dünyaca hukuken tanınması.', emoji: '✍️' },
    ]
  }
];

export const TimelineGameScreen: React.FC = () => {
  const colors = useTheme();

  const [activeMode, setActiveMode] = useState<'explore' | 'game'>('explore');
  const [selectedEra, setSelectedEra] = useState<Era>(HISTORICAL_ERAS[0]);

  // Game specific state with dynamic random subset
  const [gameShuffledEvents, setGameShuffledEvents] = useState<TimelineEvent[]>([]);
  const [userSelection, setUserSelection] = useState<TimelineEvent[]>([]);
  const [isGameFinished, setIsGameFinished] = useState(false);
  const [isCorrectSequence, setIsCorrectSequence] = useState(false);

  // Setup game with a dynamic random subset of 4 events from the 10-event pool
  const handleStartGame = (era: Era) => {
    setSelectedEra(era);
    
    // Grab 4 completely random events from the era's 10 events
    const pool = [...era.events].sort(() => Math.random() - 0.5);
    const selectedFour = pool.slice(0, 4);
    
    setGameShuffledEvents(selectedFour);
    setUserSelection([]);
    setIsGameFinished(false);
    setIsCorrectSequence(false);
  };

  const handleSelectGameEvent = (event: TimelineEvent) => {
    if (isGameFinished) return;

    // Toggle selection
    if (userSelection.some(e => e.id === event.id)) {
      setUserSelection(prev => prev.filter(e => e.id !== event.id));
    } else {
      if (userSelection.length < 4) {
        setUserSelection(prev => [...prev, event]);
      }
    }
  };

  const handleVerifySequence = () => {
    if (userSelection.length < 4) {
      Alert.alert('Eksik Seçim', 'Lütfen tüm olayların sıralamasını belirlemek için 4 olaya da sırayla tıklayın.');
      return;
    }

    // Correct chronological order of the selected 4 events based on years
    const correctOrder = [...gameShuffledEvents].sort((a, b) => a.year - b.year);
    
    // Check if user sequence matches correct chronological sequence
    const correct = userSelection.every((event, index) => event.id === correctOrder[index].id);
    
    setIsCorrectSequence(correct);
    setIsGameFinished(true);
  };

  const handleResetGame = () => {
    handleStartGame(selectedEra);
  };

  const s = getStyles(colors);

  return (
    <SafeAreaView style={s.container} edges={['bottom']}>
      {/* Modes Toggle Header */}
      <View style={s.modeToggleRow}>
        <TouchableOpacity
          style={[s.modeBtn, activeMode === 'explore' && s.modeBtnActive]}
          onPress={() => setActiveMode('explore')}
          activeOpacity={0.7}
        >
          <Text style={[s.modeBtnText, activeMode === 'explore' && s.modeBtnTextActive]}>📖 Zaman Tüneli Keşfet</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.modeBtn, activeMode === 'game' && s.modeBtnActive]}
          onPress={() => {
            setActiveMode('game');
            handleStartGame(selectedEra);
          }}
          activeOpacity={0.7}
        >
          <Text style={[s.modeBtnText, activeMode === 'game' && s.modeBtnTextActive]}>🎮 Kronoloji Sıralama Oyunu</Text>
        </TouchableOpacity>
      </View>

      {/* Era Selector Row */}
      <View style={s.eraSelectorContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.eraSelectorScroll}>
          {HISTORICAL_ERAS.map((era) => {
            const isSel = selectedEra.id === era.id;
            return (
              <TouchableOpacity
                key={era.id}
                style={[s.eraTag, isSel && s.eraTagActive]}
                onPress={() => {
                  setSelectedEra(era);
                  if (activeMode === 'game') {
                    handleStartGame(era);
                  }
                }}
                activeOpacity={0.7}
              >
                <Text style={[s.eraTagText, isSel && s.eraTagTextActive]}>
                  {era.id === 'kurulus' ? '👑 Kuruluş' : era.id === 'duraklama' ? '📉 Dağılma' : '⭐️ Cumhuriyet'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* EXPLORE MODE VIEW */}
      {activeMode === 'explore' && (
        <ScrollView style={s.scrollArea} showsVerticalScrollIndicator={false} contentContainerStyle={s.exploreContent}>
          <Text style={s.eraTitle}>{selectedEra.title}</Text>
          <Text style={s.eraDesc}>Aşağıdaki kronolojik akış üzerinden önemli KPSS tarihi dönüm noktalarını inceleyin:</Text>

          <View style={s.timelineContainer}>
            {/* The vertical line */}
            <View style={s.verticalLine} />

            {/* Sort all era events by year to display the full timeline in correct order */}
            {[...selectedEra.events].sort((a, b) => a.year - b.year).map((event, index) => (
              <View key={event.id} style={s.timelineNodeRow}>
                {/* Node circle on the line */}
                <View style={s.timelineDot}>
                  <View style={s.timelineDotInner} />
                </View>

                {/* Event Details Card */}
                <View style={s.eventCard}>
                  <View style={s.eventCardHeader}>
                    <Text style={s.eventYear}>{event.year}</Text>
                    <Text style={s.eventEmoji}>{event.emoji}</Text>
                  </View>
                  <Text style={s.eventTitle}>{event.title}</Text>
                  <Text style={s.eventDescText}>{event.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* CHRONOLOGY GAME MODE VIEW */}
      {activeMode === 'game' && (
        <ScrollView style={s.scrollArea} showsVerticalScrollIndicator={false} contentContainerStyle={s.gameContent}>
          <Text style={s.eraTitle}>🎮 Kronolojik Sıralama Oyunu</Text>
          <Text style={s.eraDesc}>
            Aşağıdaki 4 olayı **kronolojik olarak (en eskiden en yeniye doğru)** sırasıyla seçin:
          </Text>

          {/* Shuffled Event Cards */}
          <View style={s.gameCardsContainer}>
            {gameShuffledEvents.map((event) => {
              const selectIndex = userSelection.findIndex(e => e.id === event.id);
              const isSelected = selectIndex !== -1;

              return (
                <TouchableOpacity
                  key={event.id}
                  activeOpacity={0.7}
                  disabled={isGameFinished}
                  onPress={() => handleSelectGameEvent(event)}
                  style={[s.gameCard, isSelected && s.gameCardSelected]}
                >
                  <View style={s.gameCardLeft}>
                    <Text style={s.gameCardEmoji}>{event.emoji}</Text>
                    <Text style={s.gameCardTitle}>{event.title}</Text>
                  </View>
                  
                  {/* Selection Badge Showing Order: 1, 2, 3, 4 */}
                  <View style={[s.orderBadge, isSelected && s.orderBadgeActive]}>
                    <Text style={[s.orderBadgeText, isSelected && s.orderBadgeTextActive]}>
                      {isSelected ? selectIndex + 1 : '?'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Verification Results Panel */}
          {isGameFinished && (
            <View style={[s.resultPanel, isCorrectSequence ? s.successPanel : s.errorPanel]}>
              <Text style={[s.resultTitle, isCorrectSequence ? s.successText : s.errorText]}>
                {isCorrectSequence ? '🎉 Efsanevi Sıralama! Doğru!' : '❌ Maalesef Hatalı Sıralama!'}
              </Text>
              <Text style={s.resultDesc}>
                {isCorrectSequence
                  ? 'Olayların tarihsel gelişimini kusursuz bir şekilde kronolojik sıraya dizdiniz. Müthiş bir başarı!'
                  : 'Seçilen bu 4 olayın doğru kronolojisi şu şekildedir:'}
              </Text>

              {/* Correct Sequence List (Sorted subset of active chosen events) */}
              <View style={s.correctSequenceList}>
                {[...gameShuffledEvents].sort((a, b) => a.year - b.year).map((event, index) => (
                  <View key={event.id} style={s.correctSeqItem}>
                    <Text style={s.seqIndexText}>{index + 1}.</Text>
                    <Text style={s.seqYear}>{event.year}</Text>
                    <Text style={s.seqTitle}>{event.title}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity style={s.replayBtn} onPress={handleResetGame}>
                <Text style={s.replayBtnText}>Yeniden Oyna (Başka Olaylar) 🔄</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Verify Button */}
          {!isGameFinished && (
            <TouchableOpacity
              style={[s.verifyBtn, userSelection.length < 4 && s.verifyBtnDisabled]}
              onPress={handleVerifySequence}
              activeOpacity={0.8}
              disabled={userSelection.length < 4}
            >
              <Text style={s.verifyBtnText}>Sıralamayı Kontrol Et 🔍</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  modeToggleRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md
  },
  modeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface
  },
  modeBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryGlow
  },
  modeBtnText: { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: '600' },
  modeBtnTextActive: { color: colors.primary, fontWeight: '700' },
  
  eraSelectorContainer: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  eraSelectorScroll: { paddingHorizontal: spacing.xxl, gap: spacing.md },
  eraTag: {
    paddingHorizontal: spacing.xl,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface
  },
  eraTagActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary
  },
  eraTagText: { color: colors.textSecondary, fontSize: fontSize.xs, fontWeight: '700' },
  eraTagTextActive: { color: colors.textInverse },
  
  scrollArea: { flex: 1 },
  exploreContent: { padding: spacing.xxl },
  gameContent: { padding: spacing.xxl },
  eraTitle: { color: colors.textPrimary, fontSize: fontSize.lg, fontWeight: '800', marginBottom: 4 },
  eraDesc: { color: colors.textSecondary, fontSize: fontSize.sm, lineHeight: 20, marginBottom: spacing.xxl },
  
  timelineContainer: { position: 'relative', paddingLeft: 24 },
  verticalLine: {
    position: 'absolute',
    left: 7,
    top: 10,
    bottom: 10,
    width: 2,
    backgroundColor: colors.border
  },
  timelineNodeRow: { flexDirection: 'row', marginBottom: spacing.xl },
  timelineDot: {
    position: 'absolute',
    left: -23,
    top: 12,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    zIndex: 10
  },
  timelineDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary
  },
  eventCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl
  },
  eventCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  eventYear: { color: colors.primary, fontSize: fontSize.lg, fontWeight: '800' },
  eventEmoji: { fontSize: 20 },
  eventTitle: { color: colors.textPrimary, fontSize: fontSize.md, fontWeight: '700', marginBottom: spacing.xs },
  eventDescText: { color: colors.textSecondary, fontSize: fontSize.sm, lineHeight: 22 },
  
  gameCardsContainer: { gap: spacing.md, marginBottom: spacing.xxl },
  gameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.lg
  },
  gameCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryGlow
  },
  gameCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  gameCardEmoji: { fontSize: 22, marginRight: spacing.md },
  gameCardTitle: { color: colors.textPrimary, fontSize: fontSize.md, fontWeight: '700', flex: 1 },
  orderBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border
  },
  orderBadgeActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  orderBadgeText: { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: '800' },
  orderBadgeTextActive: { color: colors.textInverse },
  
  verifyBtn: { backgroundColor: colors.primary, paddingVertical: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center', marginVertical: spacing.lg },
  verifyBtnDisabled: { opacity: 0.6 },
  verifyBtnText: { color: colors.textInverse, fontSize: fontSize.md, fontWeight: '800' },
  
  resultPanel: {
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    padding: spacing.xl,
    marginBottom: spacing.xxxl
  },
  successPanel: { borderColor: colors.success, backgroundColor: colors.successGlow },
  errorPanel: { borderColor: colors.error, backgroundColor: colors.errorGlow },
  resultTitle: { fontSize: fontSize.lg, fontWeight: '800', marginBottom: 8 },
  resultDesc: { color: colors.textSecondary, fontSize: fontSize.sm, lineHeight: 20, marginBottom: spacing.lg },
  successText: { color: colors.success },
  errorText: { color: colors.error },
  correctSequenceList: { gap: spacing.sm, marginVertical: spacing.md },
  correctSeqItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  seqIndexText: { color: colors.textMuted, fontSize: fontSize.md, fontWeight: '700', width: 24 },
  seqYear: { color: colors.primary, fontSize: fontSize.md, fontWeight: '800', marginRight: spacing.md, width: 44 },
  seqTitle: { color: colors.textPrimary, fontSize: fontSize.md, fontWeight: '600' },
  replayBtn: { backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: borderRadius.md, alignItems: 'center', marginTop: spacing.xl },
  replayBtnText: { color: colors.textInverse, fontSize: fontSize.sm, fontWeight: '700' }
});
