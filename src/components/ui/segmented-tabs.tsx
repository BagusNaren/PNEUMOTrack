// src/components/ui/segmented-tabs.tsx
// SegmentedTabs component for filter/tab chips (e.g. Chat tabs, History tabs, Sex selector).

import { Pressable, Text, View } from 'react-native';

export interface TabOption<T extends string> {
  key: T;
  label: string;
}

interface SegmentedTabsProps<T extends string> {
  options: TabOption<T>[];
  value: T;
  onChange: (key: T) => void;
  className?: string;
}

export function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
  className = '',
}: SegmentedTabsProps<T>) {
  return (
    <View className={`flex-row gap-1 rounded-pill bg-surface-brand-soft p-1 dark:bg-surface-brand-soft-dark ${className}`}>
      {options.map((option) => {
        const isActive = option.key === value;
        return (
          <Pressable
            key={option.key}
            onPress={() => onChange(option.key)}
            className={`flex-1 items-center justify-center rounded-pill py-2 px-3 transition-colors ${
              isActive
                ? 'bg-brand shadow-sm'
                : 'bg-transparent active:opacity-70'
            }`}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <Text
              className={`text-label font-semibold ${
                isActive ? 'text-on-brand' : 'text-brand dark:text-brand-light'
              }`}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

