// src/components/ui/empty-state.tsx
// EmptyState and ErrorState for network/empty screens.

import { ActivityIndicator, Text, View } from 'react-native';
import { Button } from './button';

interface EmptyStateProps {
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: string;
}

export function EmptyState({ title, body, actionLabel, onAction, icon = '📭' }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center gap-4 px-8 py-16">
      <Text className="text-5xl">{icon}</Text>
      <Text className="text-center text-subtitle font-semibold text-ink dark:text-ink-dark">
        {title}
      </Text>
      {body ? (
        <Text className="text-center text-body text-ink-muted dark:text-ink-dark-muted">{body}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} className="mt-2" />
      ) : null}
    </View>
  );
}

interface ErrorStateProps {
  title?: string;
  body?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({
  title = 'Terjadi Kesalahan',
  body = 'Periksa koneksi internet Anda dan coba lagi.',
  onRetry,
  retryLabel = 'Coba Lagi',
}: ErrorStateProps) {
  return (
    <View className="flex-1 items-center justify-center gap-4 px-8 py-16">
      <Text className="text-5xl">⚡</Text>
      <Text className="text-center text-subtitle font-semibold text-ink dark:text-ink-dark">
        {title}
      </Text>
      <Text className="text-center text-body text-ink-muted dark:text-ink-dark-muted">{body}</Text>
      {onRetry ? <Button label={retryLabel} onPress={onRetry} className="mt-2" /> : null}
    </View>
  );
}

export function LoadingState({ label = 'Memuat…' }: { label?: string }) {
  return (
    <View className="flex-1 items-center justify-center gap-4 py-16">
      <ActivityIndicator size="large" color="#1F4B75" />
      <Text className="text-body text-ink-muted dark:text-ink-dark-muted">{label}</Text>
    </View>
  );
}
