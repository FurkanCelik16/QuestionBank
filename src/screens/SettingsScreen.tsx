// ========================================
// Settings Screen
// API Key management and App Theme
// ========================================

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
import { useTheme, spacing, borderRadius, fontSize } from '../theme/colors';
import { useSettingsStore, ThemeMode } from '../store/useSettingsStore';

const modelOptions = [
  { key: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash-Lite', emoji: '💡', description: 'Yüksek limit oranına sahip (Günde 500 istek!), son derece hızlı ve güncel model.' },
  { key: 'gemini-3-flash', label: 'Gemini 3 Flash', emoji: '⚡', description: 'Üst düzey performans sunan yeni nesil hızlı model.' },
  { key: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', emoji: '🎯', description: 'Son derece dengeli, hızlı ve kaliteli soru üretimi.' },
  { key: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash-Lite', emoji: '🌟', description: 'Günde 1500 istek limitine sahip, ultra hızlı ve hatasız çalışan stabil Lite model.' },
];

export const SettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { apiKey, themeMode, geminiModel, askedQuestions, setApiKey, setThemeMode, setGeminiModel, clearApiKey, clearAskedQuestions } = useSettingsStore();
  const colors = useTheme();
  
  const [inputKey, setInputKey] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setInputKey(apiKey);
  }, [apiKey]);

  const handleSave = async () => {
    // Sadece geçerli API anahtarı karakterlerini tut, görünmez mobil pano artıklarını ve boşlukları temizle
    const trimmedKey = inputKey.replace(/[^a-zA-Z0-9-_]/g, '').trim();
    if (!trimmedKey) {
      Alert.alert('Uyarı', 'Lütfen bir API anahtarı girin.');
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
  };

  const handleThemeChange = (mode: ThemeMode) => {
    setThemeMode(mode);
  };

  const handleModelChange = (modelKey: string) => {
    setGeminiModel(modelKey);
  };

  const handleClearMemory = () => {
    Alert.alert(
      'Soru Hafızasını Temizle',
      `Daha önce sorulan soruların geçmişi (${askedQuestions.length} kavram) silinecektir. Yapay zeka aynı soruları tekrar sorabilir. Emin misiniz?`,
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
          {/* Header icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>⚙️</Text>
          </View>

          <Text style={styles.title}>Uygulama Ayarları</Text>

          {/* Theme Selection */}
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

          {/* Model Selection */}
          <Text style={styles.sectionTitle}>Yapay Zeka Modeli</Text>
          <Text style={styles.subtitle}>
            Test üretiminde kullanılacak modeli seçin. Limit dolumu yaşarsanız farklı bir model tercih edebilirsiniz.
          </Text>
          <View style={styles.modelContainer}>
            {modelOptions.map((model) => (
              <TouchableOpacity
                key={model.key}
                style={[
                  styles.modelOption,
                  geminiModel === model.key && styles.modelOptionActive,
                ]}
                onPress={() => handleModelChange(model.key)}
                activeOpacity={0.8}
              >
                <View style={styles.modelHeaderRow}>
                  <Text style={styles.modelEmoji}>{model.emoji}</Text>
                  <Text style={[
                    styles.modelName,
                    geminiModel === model.key && styles.modelTextActive,
                  ]}>
                    {model.label}
                  </Text>
                </View>
                <Text style={styles.modelDesc}>{model.description}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Soru Hafızası Section */}
          <Text style={styles.sectionTitle}>Soru Hafızası (Tekrar Engelleme)</Text>
          <Text style={styles.subtitle}>
            Gemini'nin aynı konuları tekrar sormasını engellemek için son çözdüğün {askedQuestions.length} soru konusu hafızada tutuluyor.
          </Text>
          <View style={styles.memoryContainer}>
            <TouchableOpacity
              style={[styles.memoryButton, askedQuestions.length === 0 && styles.memoryButtonDisabled]}
              onPress={handleClearMemory}
              disabled={askedQuestions.length === 0}
              activeOpacity={0.8}
            >
              <Text style={styles.memoryButtonText}>Hafızayı Temizle</Text>
            </TouchableOpacity>
          </View>

          {/* API Key Section */}
          <Text style={styles.sectionTitle}>Gemini API Anahtarı</Text>
          <Text style={styles.subtitle}>
            Testler oluşturmak için Google AI Studio'dan aldığınız Gemini API anahtarınızı girin.
          </Text>

          {/* Info card */}
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>ℹ️</Text>
            <Text style={styles.infoText}>
              API anahtarınız yalnızca cihazınızda saklanır ve hiçbir sunucuya gönderilmez.
              Anahtarı{' '}
              <Text style={styles.infoLink}>
                aistudio.google.com
              </Text>
              {' '}adresinden ücretsiz edinebilirsiniz.
            </Text>
          </View>

          {/* Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={inputKey}
              onChangeText={setInputKey}
              placeholder="AIza..."
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

          {/* Save button */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <Text style={styles.saveButtonText}>Anahtarı Kaydet</Text>
          </TouchableOpacity>

          {/* Saved indicator */}
          {saved && (
            <Animated.View style={[styles.savedBanner, { opacity: fadeAnim }]}>
              <Text style={styles.savedText}>✓ Ayarlar kaydedildi!</Text>
            </Animated.View>
          )}

          {/* Clear button */}
          {apiKey ? (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClear}
              activeOpacity={0.7}
            >
              <Text style={styles.clearButtonText}>API Anahtarını Sil</Text>
            </TouchableOpacity>
          ) : null}

          {/* Status */}
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: apiKey ? colors.success : colors.error },
              ]}
            />
            <Text style={styles.statusText}>
              {apiKey ? 'API anahtarı aktif' : 'API anahtarı girilmedi'}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: spacing.xxl,
    paddingTop: spacing.lg,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.xxl,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  themeRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  themeOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryGlow,
  },
  modelContainer: {
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  modelOption: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  modelOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryGlow,
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
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  modelTextActive: {
    color: colors.primary,
  },
  modelDesc: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    lineHeight: 16,
  },
  themeEmoji: {
    fontSize: 18,
  },
  themeText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  themeTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  infoLink: {
    color: colors.accent,
    fontWeight: '600',
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
    fontSize: fontSize.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  eyeButton: {
    padding: spacing.md,
    paddingRight: spacing.lg,
  },
  eyeIcon: {
    fontSize: 20,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  saveButtonText: {
    color: colors.textInverse,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  savedBanner: {
    backgroundColor: colors.successGlow,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.success,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  savedText: {
    color: colors.success,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  clearButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.xl,
  },
  clearButtonText: {
    color: colors.error,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  memoryContainer: {
    marginBottom: spacing.xxl,
  },
  memoryButton: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  memoryButtonDisabled: {
    opacity: 0.5,
  },
  memoryButtonText: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  statusText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
});
