// src/components/ui/status-banner.tsx
// StatusBanner for normal/risk screening result display.

import { Text, View } from 'react-native';

type StatusBannerVariant = 'normal' | 'risk' | 'pending';

interface StatusBannerProps {
  variant: StatusBannerVariant;
  message: string;
}

const bannerStyles: Record<StatusBannerVariant, { container: string; icon: string; iconText: string; text: string }> = {
  normal: {
    container: 'bg-surface-brand dark:bg-surface-brand-dark',
    icon: 'bg-white',
    iconText: 'text-safe',
    text: 'text-brand dark:text-brand-light',
  },
  risk: {
    container: 'bg-risk-surface dark:bg-risk-surface-dark',
    icon: 'bg-white',
    iconText: 'text-risk dark:text-risk-light',
    text: 'text-risk dark:text-risk-light',
  },
  pending: {
    container: 'bg-surface-muted dark:bg-surface-muted-dark',
    icon: 'bg-white',
    iconText: 'text-ink-muted',
    text: 'text-ink-muted dark:text-ink-dark-muted',
  },
};

const icons: Record<StatusBannerVariant, string> = {
  normal: '✓',
  risk: '⚠',
  pending: '○',
};

export function StatusBanner({ variant, message }: StatusBannerProps) {
  const s = bannerStyles[variant];
  return (
    <View className={`flex-row items-center gap-3 rounded-card p-4 ${s.container}`}>
      <View className={`h-8 w-8 items-center justify-center rounded-full ${s.icon}`}>
        <Text className={`text-base font-bold ${s.iconText}`}>{icons[variant]}</Text>
      </View>
      <Text className={`flex-1 text-label font-semibold ${s.text}`}>{message}</Text>
    </View>
  );
}
