// src/app/index.tsx
// Splash and Auth Gate — redirects to (tabs) if authenticated, or (auth)/sign-in.

import { router } from 'expo-router';
import { useEffect } from 'react';
import { Image, Text, View } from 'react-native';

import { copy } from '@/constants/copy';
import { useSession } from '@/hooks/use-session';

export default function IndexScreen() {
  const { session, isLoading } = useSession();

  useEffect(() => {
    if (isLoading) return;

    // Small delay for smooth splash impression
    const timer = setTimeout(() => {
      if (session) {
        router.replace('/(tabs)/');
      } else {
        // Fallback to sign-in or demo tabs
        router.replace('/(auth)/sign-in');
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [session, isLoading]);

  return (
    <View className="flex-1 items-center justify-center bg-surface px-6 dark:bg-surface-dark">
      <View className="items-center gap-4">
        <Image
          source={require('@/assets/images/logo.png')}
          style={{ width: 150, height: 150 }}
          resizeMode="contain"
        />
        <Text className="text-display font-bold text-brand dark:text-brand-light">
          {copy.app.name}
        </Text>
        <Text className="text-center text-body text-ink-muted dark:text-ink-dark-muted">
          {copy.app.tagline}
        </Text>
      </View>
    </View>
  );
}
