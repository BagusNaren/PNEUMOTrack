// src/app/_layout.tsx
// Root Layout for PNEUMOTrack with Providers and Stack Navigation.

import '@/global.css';

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ActiveChildProvider } from '@/hooks/use-active-child';
import { SessionProvider, useSession } from '@/hooks/use-session';

function RootNavigator() {
  const { user } = useSession();

  return (
    <ActiveChildProvider parentId={user?.id ?? 'user-demo'}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: '#FFFFFF' },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="children/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="history/index" />
        <Stack.Screen name="history/[id]" />
        <Stack.Screen name="doctors/index" />
        <Stack.Screen name="doctors/[id]" />
        <Stack.Screen name="chats/index" />
        <Stack.Screen name="chats/[id]" />
        <Stack.Screen name="hospitals/index" />
        <Stack.Screen name="hospitals/map" />
        <Stack.Screen name="articles/index" />
        <Stack.Screen name="articles/[id]" />
        <Stack.Screen name="recommendation" />
      </Stack>
    </ActiveChildProvider>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <SessionProvider>
          <RootNavigator />
        </SessionProvider>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
