// src/components/ui/disclaimer.tsx
// Disclaimer and DangerSignsBox — required on result, recommendation, and history screens.

import { Text, View } from 'react-native';
import { copy } from '@/constants/copy';

export function Disclaimer() {
  return (
    <View className="rounded-card border border-border bg-surface-muted p-3 dark:border-border-dark dark:bg-surface-muted-dark">
      <Text className="text-caption text-ink-muted dark:text-ink-dark-muted">
        ⓘ {copy.result.disclaimer}
      </Text>
    </View>
  );
}

export function DangerSignsBox() {
  return (
    <View className="rounded-card border border-risk-border bg-risk-surface p-4 dark:border-risk-border-dark dark:bg-risk-surface-dark">
      <Text className="mb-2 text-label font-bold text-risk dark:text-risk-light">
        {copy.result.dangerTitle}
      </Text>
      {copy.result.dangerSigns.map((sign) => (
        <Text key={sign} className="text-caption text-ink dark:text-ink-dark">
          • {sign}
        </Text>
      ))}
    </View>
  );
}
