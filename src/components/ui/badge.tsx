// src/components/ui/badge.tsx
// Badge for status labels (Normal / Risiko) in lists.

import { Text, View } from 'react-native';

type BadgeVariant = 'normal' | 'risk' | 'muted' | 'warning';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const styles: Record<BadgeVariant, { bg: string; text: string }> = {
  normal: { bg: 'bg-surface-safe dark:bg-surface-safe-dark', text: 'text-safe dark:text-safe-light' },
  risk: { bg: 'bg-risk-surface dark:bg-risk-surface-dark', text: 'text-risk dark:text-risk-light' },
  muted: { bg: 'bg-surface-muted dark:bg-surface-muted-dark', text: 'text-ink-muted dark:text-ink-dark-muted' },
  warning: { bg: 'bg-amber-100', text: 'text-amber-700' },
};

export function Badge({ label, variant = 'muted' }: BadgeProps) {
  const s = styles[variant];
  return (
    <View className={`rounded-pill px-2 py-0.5 ${s.bg}`}>
      <Text className={`text-caption font-semibold ${s.text}`}>{label}</Text>
    </View>
  );
}
