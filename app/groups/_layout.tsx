import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

/**
 * Defines the navigation stack for the Groups feature.
 * Registers the index (list) and create screens and applies theme based on color scheme.
 */
export default function GroupsLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: true, headerBackTitle: 'Back' }}>
        <Stack.Screen 
          name="index" 
          options={{ 
            title: 'Groups',
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="create"
          options={{
            title: 'Create Group',
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
