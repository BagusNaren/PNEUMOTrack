// src/components/ui/screen-header.tsx
// Centered title header with optional back and right action.

import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export function ScreenHeader({
  title,
  subtitle,
  showBack = true,
  onBack,
  rightAction,
}: ScreenHeaderProps) {
  const handleBack = onBack ?? (() => router.back());

  return (
    <View className="h-14 flex-row items-center justify-between">
      {showBack ? (
        <Pressable
          onPress={handleBack}
          className="h-11 w-11 items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel="Kembali"
          hitSlop={8}
        >
          <Text className="text-2xl text-ink dark:text-ink-dark">‹</Text>
        </Pressable>
      ) : (
        <View className="w-11" />
      )}

      <View className="flex-1 items-center">
        <Text className="text-subtitle font-semibold text-ink dark:text-ink-dark">{title}</Text>
        {subtitle ? (
          <Text className="text-caption text-ink-muted dark:text-ink-dark-muted">{subtitle}</Text>
        ) : null}
      </View>

      <View className="w-11 items-center justify-center">
        {rightAction ?? null}
      </View>
    </View>
  );
}
