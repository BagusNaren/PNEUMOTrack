// src/components/ui/segmented-tabs.tsx
// SegmentedTabs component for filter/tab chips (e.g. Chat tabs, History tabs, Sex selector).

import { Pressable, Text, View } from "react-native";

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
  className = "",
}: SegmentedTabsProps<T>) {
  return (
    <View
      className={`flex-row flex-wrap gap-2 rounded-card bg-surface-brand-soft p-1 ${className}`}
    >
      {options.map((option) => {
        const isActive = option.key === value;
        return (
          <Pressable
            key={option.key}
            onPress={() => onChange(option.key)}
            className={`min-h-12 min-w-[120px] flex-1 items-center justify-center rounded-card py-3 px-3 active:opacity-90 ${
              isActive ? "bg-brand" : "bg-transparent"
            }`}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <Text
              className={`text-label font-semibold ${
                isActive ? "text-on-brand" : "text-brand dark:text-brand-light"
              }`}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
