import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MeetingsProvider } from './src/context/MeetingsContext';
import DashboardScreen from './src/screens/DashboardScreen';
import RecordScreen from './src/screens/RecordScreen';
import MeetingDetailScreen from './src/screens/MeetingDetailScreen';
import { colors } from './src/theme';

const Stack = createNativeStackNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    primary: colors.accent,
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <MeetingsProvider>
        <NavigationContainer theme={navTheme}>
          <StatusBar style="dark" />
          <Stack.Navigator
            screenOptions={{
              headerStyle: { backgroundColor: colors.surface },
              headerTintColor: colors.text,
              headerTitleStyle: { fontWeight: '800' },
              contentStyle: { backgroundColor: colors.bg },
            }}
          >
            <Stack.Screen
              name="Dashboard"
              component={DashboardScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Record"
              component={RecordScreen}
              options={{ title: 'Record Meeting' }}
            />
            <Stack.Screen
              name="MeetingDetail"
              component={MeetingDetailScreen}
              options={{ title: 'Meeting' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </MeetingsProvider>
    </SafeAreaProvider>
  );
}
