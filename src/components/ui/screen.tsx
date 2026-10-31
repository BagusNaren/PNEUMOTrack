// src/components/ui/screen.tsx
// Base screen wrapper. Provides safe background + max-width centering.

import { ScrollView, View, type ScrollViewProps, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ScreenProps extends ViewProps {
  children: React.ReactNode;
  scrollable?: boolean;
  scrollProps?: ScrollViewProps;
}

export function Screen({ children, scrollable = false, scrollProps, style, ...props }: ScreenProps) {
  const insets = useSafeAreaInsets();

  if (scrollable) {
    return (
      <ScrollView
        className="flex-1 bg-surface dark:bg-surface-dark"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
        {...scrollProps}
      >
        <View className="w-full max-w-content self-center px-5 pt-2" {...props} style={style}>
          {children}
        </View>
      </ScrollView>
    );
  }

  return (
    <View className="flex-1 bg-surface dark:bg-surface-dark" {...props}>
      <View className="w-full max-w-content flex-1 self-center px-5 pt-2" style={style}>
        {children}
      </View>
    </View>
  );
}
