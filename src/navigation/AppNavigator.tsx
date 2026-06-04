import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useTheme, fontSize, spacing } from '../theme/colors';

import { TopicSelectionScreen } from '../screens/TopicSelectionScreen';
import { LoadingScreen } from '../screens/LoadingScreen';
import { QuizScreen } from '../screens/QuizScreen';
import { ResultScreen } from '../screens/ResultScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { MapQuizHomeScreen } from '../screens/MapQuizHomeScreen';
import { MapQuizScreen } from '../screens/MapQuizScreen';
import { MapQuizResultScreen } from '../screens/MapQuizResultScreen';
import { MistakeResolverScreen } from '../screens/MistakeResolverScreen';
import { SmartIndexScreen } from '../screens/SmartIndexScreen';
import { TimelineGameScreen } from '../screens/TimelineGameScreen';
import { useSettingsStore } from '../store/useSettingsStore';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const colors = useTheme();

  const screenOptions = {
    headerStyle: { backgroundColor: colors.background },
    headerTintColor: colors.textPrimary,
    headerShadowVisible: false,
    contentStyle: { backgroundColor: colors.background },
    headerTitleStyle: { fontSize: fontSize.lg, fontWeight: '700' as const },
  };

  const { apiKey } = useSettingsStore();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={screenOptions}>
        {!apiKey ? (
          <Stack.Screen
            name="Setup"
            component={SettingsScreen}
            options={{
              headerTitle: 'Kurulum (API Anahtarı)',
              gestureEnabled: false,
            }}
          />
        ) : (
          <>
            <Stack.Screen
              name="TopicSelection"
              component={TopicSelectionScreen}
              options={({ navigation }) => ({
                headerTitle: '',
                headerRight: () => (
                  <View style={navStyles.headerRightContainer}>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('TimelineGame')}
                      style={navStyles.headerBtn}
                      activeOpacity={0.7}
                    >
                      <Text style={navStyles.headerIcon}>⏳</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('SmartIndex')}
                      style={navStyles.headerBtn}
                      activeOpacity={0.7}
                    >
                      <Text style={navStyles.headerIcon}>🔍</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('History')}
                      style={navStyles.headerBtn}
                      activeOpacity={0.7}
                    >
                      <Text style={navStyles.headerIcon}>📊</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('Settings')}
                      style={navStyles.headerBtn}
                      activeOpacity={0.7}
                    >
                      <Text style={navStyles.headerIcon}>⚙️</Text>
                    </TouchableOpacity>
                  </View>
                ),
              })}
            />
            <Stack.Screen
              name="Loading"
              component={LoadingScreen}
              options={{
                headerShown: false,
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="Quiz"
              component={QuizScreen}
              options={{
                headerShown: false,
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="Result"
              component={ResultScreen}
              options={{
                headerTitle: '',
                headerBackVisible: false,
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{
                headerTitle: 'Ayarlar',
                presentation: 'modal',
              }}
            />
            <Stack.Screen
              name="History"
              component={HistoryScreen}
              options={{
                headerTitle: '',
              }}
            />
            <Stack.Screen
              name="MapQuizHome"
              component={MapQuizHomeScreen}
              options={{
                headerTitle: 'Harita Tahmin',
              }}
            />
            <Stack.Screen
              name="MapQuiz"
              component={MapQuizScreen}
              options={{
                headerShown: false,
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="MapQuizResult"
              component={MapQuizResultScreen}
              options={{
                headerShown: false,
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="MistakeResolver"
              component={MistakeResolverScreen}
              options={{
                headerShown: false,
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="SmartIndex"
              component={SmartIndexScreen}
              options={{
                headerTitle: 'Akıllı İndeks 🔍',
              }}
            />
            <Stack.Screen
              name="TimelineGame"
              component={TimelineGameScreen}
              options={{
                headerTitle: 'Zaman Tüneli ⏳',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const navStyles = StyleSheet.create({
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerBtn: {
    padding: spacing.sm,
  },
  headerIcon: {
    fontSize: 22,
  },
});
