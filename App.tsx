import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useSettingsStore } from './src/store/useSettingsStore';
import { useHistoryStore } from './src/store/useHistoryStore';
import { useTheme, fontSize } from './src/theme/colors';

export default function App() {
  const { isLoaded: isSettingsLoaded, loadSettings, themeMode } = useSettingsStore();
  const { isLoaded: isHistoryLoaded, loadHistory } = useHistoryStore();

  useEffect(() => {
    loadSettings();
    loadHistory();
  }, []);

  const colors = useTheme();

  if (!isSettingsLoaded || !isHistoryLoaded) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider style={{ backgroundColor: colors.background }}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: fontSize.md,
    marginTop: 12,
  },
});
