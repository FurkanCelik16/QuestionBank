import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, spacing, borderRadius, fontSize, shadow, AppTheme } from '../theme/colors';
import { useSettingsStore, ThemeMode } from '../store/useSettingsStore';

const modelOptions = [
  { key: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash-Lite', emoji: '💡', description: 'Yüksek limit oranına sahip (Günde 500 istek!), son derece hızlı ve güncel model.' },
  { key: 'gemini-3-flash', label: 'Gemini 3 Flash', emoji: '⚡', description: 'Üst düzey performans sunan yeni nesil hızlı model.' },
  { key: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', emoji: '🎯', description: 'Son derece dengeli, hızlı ve kaliteli soru üretimi.' },
  { key: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash-Lite', emoji: '🌟', description: 'Günde 1500 istek limitine sahip, ultra hızlı ve hatasız çalışan stabil Lite model.' },
];

export const SettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { apiKey, themeMode, geminiModel, askedQuestions, seenQuestionTexts, setApiKey, setThemeMode, setGeminiModel, clearApiKey, clearAskedQuestions } = useSettingsStore();
  const colors = useTheme();
  
  const [inputKey, setInputKey] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setInputKey(apiKey);
  }, [apiKey]);

  const handleSave = async () => {
    const trimmedKey = inputKey.replace(/[^a-zA-Z0-9-_]/g, '').trim();
    if (!trimmedKey) {
      if (Platform.OS === 'web') {
        window.alert('Lütfen bir API anahtarı girin.');
      } else {
        Alert.alert('Uyarı', 'Lütfen bir API anahtarı girin.');
      }
      return;
    }

    await setApiKey(trimmedKey);
    setSaved(true);

    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setSaved(false));
  };

  const handleClear = () => {
    if (Platform.OS === 'web') {
      const confirm = window.confirm('API anahtarınız silinecek. Emin misiniz?');
      if (confirm) {
        clearApiKey().then(() => {
          setInputKey('');
        });
      }
    } else {
      Alert.alert(
        'API Anahtarını Sil',
        'API anahtarınız silinecek. Emin misiniz?',
        [
          { text: 'İptal', style: 'cancel' },
          {
            text: 'Sil',
            style: 'destructive',
            onPress: async () => {
              await clearApiKey();
              setInputKey('');
            },
          },
        ]
      );
    }
  };

  const handleThemeChange = (mode: ThemeMode) => {
    setThemeMode(mode);
  };

  const handleModelChange = (modelKey: string) => {
    setGeminiModel(modelKey);
  };

  const handleClearMemory = () => {
    const msg = `Daha önce sorulan soruların geçmişi (${askedQuestions.length} kavram, ${seenQuestionTexts.length} soru metni) silinecektir. Yapay zeka aynı soruları tekrar sorabilir. Emin misiniz?`;
    if (Platform.OS === 'web') {
      const confirm = window.confirm(msg);
      if (confirm) {
        clearAskedQuestions().then(() => {
          window.alert('Soru geçmişi hafızası başarıyla temizlendi.');
        });
      }
    } else {
      Alert.alert(
        'Soru Hafızasını Temizle',
        msg,
        [
          { text: 'İptal', style: 'cancel' },
          {
            text: 'Temizle',
            style: 'destructive',
            onPress: async () => {
              await clearAskedQuestions();
              Alert.alert('Başarılı', 'Soru geçmişi hafızası başarıyla temizlendi.');
            },
          },
        ]
      );
    }
  };

  const styles = getStyles(colors);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Theme selection card */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Görünüm</Text>
            <View style={styles.themeRow}>
              <TouchableOpacity
                style={[styles.themeOption, themeMode === 'light' && styles.themeOptionActive]}
                onPress={() => handleThemeChange('light')}
                activeOpacity={0.8}
              >
                <Text style={styles.themeEmoji}>☀️</Text>
                <Text style={[styles.themeText, themeMode === 'light' && styles.themeTextActive]}>
                  Açık Tema
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.themeOption, themeMode === 'dark' && styles.themeOptionActive]}
                onPress={() => handleThemeChange('dark')}
                activeOpacity={0.8}
              >
                <Text style={styles.themeEmoji}>🌙</Text>
                <Text style={[styles.themeText, themeMode === 'dark' && styles.themeTextActive]}>
                  Koyu Tema
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Model selection card */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Yapay Zeka Sınav Modeli</Text>
            <Text style={styles.subtitle}>
              Soru üretimi ve analiz aşamalarında kullanılacak olan Gemini model sürümünü seçin.
            </Text>
            <View style={styles.modelContainer}>
              {modelOptions.map((model) => {
                const isSelected = geminiModel === model.key;
                return (
                  <TouchableOpacity
                    key={model.key}
                    style={[
                      styles.modelOption,
                      isSelected && styles.modelOptionActive,
                    ]}
                    onPress={() => handleModelChange(model.key)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.modelHeaderRow}>
                      <Text style={styles.modelEmoji}>{model.emoji}</Text>
                      <Text style={[
                        styles.modelName,
                        isSelected && styles.modelTextActive,
                      ]}>
                        {model.label}
                      </Text>
                    </View>
                    <Text style={[styles.modelDesc, isSelected && { color: colors.textInverse }]}>
                      {model.description}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* API key configuration card */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Gemini API Anahtarı</Text>
            <Text style={styles.subtitle}>
              Testleri üretmek için Google AI Studio'dan aldığınız ücretsiz API anahtarınızı girin.
            </Text>

            {/* Flat Info Box */}
            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>🛡️</Text>
              <Text style={styles.infoText}>
                API anahtarınız sadece kendi cihazınızda saklanır. Anahtarınızı{' '}
                <Text style={styles.infoLink}>aistudio.google.com</Text> adresinden tamamen ücretsiz olarak saniyeler içinde oluşturabilirsiniz.
              </Text>
            </View>

            {/* Input Wrapper */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={inputKey}
                onChangeText={setInputKey}
                placeholder="AIzaSy..."
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showKey}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowKey(!showKey)}
                style={styles.eyeButton}
              >
                <Text style={styles.eyeIcon}>{showKey ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              activeOpacity={0.9}
            >
              <Text style={styles.saveButtonText}>Anahtarı Kaydet</Text>
            </TouchableOpacity>

            {/* Success notification banner */}
            {saved && (
              <Animated.View style={[styles.savedBanner, { opacity: fadeAnim }]}>
                <Text style={styles.savedText}>✓ API anahtarı başarıyla güncellendi!</Text>
              </Animated.View>
            )}

            {/* Clear Button */}
            {apiKey ? (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClear}
                activeOpacity={0.7}
              >
                <Text style={styles.clearButtonText}>API Anahtarını Cihazdan Sil</Text>
              </TouchableOpacity>
            ) : null}

            {/* Connection Status Row */}
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: apiKey ? colors.success : colors.error },
                ]}
              />
              <Text style={styles.statusText}>
                {apiKey ? 'API Bağlantısı Etkin' : 'API Bağlantısı Yok'}
              </Text>
            </View>
          </View>

          {/* Soru Hafızası Card */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Soru Hafızası</Text>
            <Text style={styles.subtitle}>
              Sistem, son çözdüğünüz {askedQuestions.length} alt başlığı ve {seenQuestionTexts.length} soru metnini aklında tutarak benzer soruların üretilmesini engeller.
            </Text>
            <View style={styles.memoryContainer}>
              <TouchableOpacity
                style={[
                  styles.memoryButton, 
                  (askedQuestions.length === 0 && seenQuestionTexts.length === 0) && styles.memoryButtonDisabled
                ]}
                onPress={handleClearMemory}
                disabled={askedQuestions.length === 0 && seenQuestionTexts.length === 0}
                activeOpacity={0.8}
              >
                <Text style={styles.memoryButtonText}>Belleği Temizle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const getStyles = (colors: AppTheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  sectionCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.xl,
    ...shadow(1, colors.primary),
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: '800',
    marginBottom: spacing.md,
    letterSpacing: -0.5,
  },
  themeRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md - 3,
    gap: spacing.sm,
  },
  themeOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  modelContainer: {
    gap: spacing.sm,
  },
  modelOption: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  modelOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  modelHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  modelEmoji: {
    fontSize: 16,
  },
  modelName: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: '800',
  },
  modelTextActive: {
    color: colors.textInverse,
    fontWeight: '900',
  },
  modelDesc: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    lineHeight: 16,
    fontWeight: '600',
  },
  themeEmoji: {
    fontSize: 16,
  },
  themeText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm - 1,
    fontWeight: '700',
  },
  themeTextActive: {
    color: colors.textInverse,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.xs + 1,
    lineHeight: 18,
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  infoIcon: {
    fontSize: 14,
    marginRight: spacing.sm,
    marginTop: 1,
  },
  infoText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: fontSize.xs + 1,
    lineHeight: 18,
    fontWeight: '600',
  },
  infoLink: {
    color: colors.textPrimary,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    paddingVertical: spacing.md - 2,
    paddingHorizontal: spacing.md,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '700',
  },
  eyeButton: {
    padding: spacing.md,
  },
  eyeIcon: {
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg - 2,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    ...shadow(3, colors.primaryDark),
  },
  saveButtonText: {
    color: colors.textInverse,
    fontSize: fontSize.sm + 1,
    fontWeight: '900',
  },
  savedBanner: {
    backgroundColor: colors.successGlow,
    borderRadius: borderRadius.sm,
    borderWidth: 1.5,
    borderColor: colors.success,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  savedText: {
    color: colors.success,
    fontSize: fontSize.xs + 1,
    fontWeight: '800',
  },
  clearButton: {
    alignItems: 'center',
    paddingVertical: spacing.md - 3,
    marginTop: spacing.sm,
  },
  clearButtonText: {
    color: colors.error,
    fontSize: fontSize.xs + 1,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  memoryContainer: {
    marginTop: spacing.xs,
  },
  memoryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md - 3,
    alignItems: 'center',
  },
  memoryButtonDisabled: {
    opacity: 0.4,
  },
  memoryButtonText: {
    color: colors.textPrimary,
    fontSize: fontSize.sm - 1,
    fontWeight: '800',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.sm,
  },
  statusText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
});
