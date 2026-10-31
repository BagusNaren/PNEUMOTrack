// src/components/ui/collapsible.tsx
// Cross-platform collapsible accordion matching NativeWind theme.

import { PropsWithChildren, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

export function Collapsible({ children, title }: PropsWithChildren & { title: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View className="rounded-card border border-border bg-surface-card overflow-hidden dark:border-border-dark dark:bg-surface-card-dark">
      <Pressable
        onPress={() => setIsOpen((prev) => !prev)}
        className="flex-row items-center justify-between p-3.5 active:opacity-70"
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
      >
        <Text className="text-label font-bold text-ink dark:text-ink-dark flex-1 pr-2">
          {title}
        </Text>
        <Text className="text-sm font-bold text-ink-muted">
          {isOpen ? '▲' : '▼'}
        </Text>
      </Pressable>
      {isOpen && (
        <View className="px-3.5 pb-3.5 pt-1 border-t border-border/40 dark:border-border-dark/40">
          {children}
        </View>
      )}
    </View>
  );
}
