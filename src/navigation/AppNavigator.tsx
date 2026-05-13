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
            name="Settings"
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
                      onPress={() => navigation.navigate('History')}
                      style={navStyles.headerBtn}
                    >
                      <Text style={navStyles.headerIcon}>📊</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('Settings')}
                      style={navStyles.headerBtn}
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
