import { router } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { copy } from "@/constants/copy";
import { Config } from "@/constants/config";
import { Icon } from "./icon";

export function ScreenHeader({
  title,
  subtitle,
  back,
  showBack,
  onBack,
  action,
  rightAction,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  showBack?: boolean;
  onBack?: () => void;
  action?: ReactNode;
  rightAction?: ReactNode;
}) {
  const canShowBack = back ?? showBack ?? true;
  const trailingAction = action ?? rightAction;
  return (
    <View className="min-h-14 flex-row flex-wrap items-center gap-2 py-1">
      {canShowBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.common.back}
          className="h-11 w-11 shrink-0 items-center justify-center rounded-card active:opacity-70"
          onPress={() => {
            if (onBack) {
              onBack();
              return;
            }
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(tabs)");
            }
          }}
        >
          <Icon name="back" />
        </Pressable>
      ) : (
        <View className="w-11 shrink-0" />
      )}
      <View className="min-w-0 flex-1 flex-wrap items-center py-1">
        <Text
          accessibilityRole="header"
          className="w-full text-center text-subtitle font-semibold text-ink dark:text-ink-dark"
        >
          {title}
        </Text>
        {subtitle && (
          <Text className="w-full text-center text-caption text-ink-muted dark:text-ink-dark-muted">
            {subtitle}
          </Text>
        )}
        {Config.useMockData && (
          <Text className="mt-1 text-center text-caption text-ink-muted">
            {copy.screening.dataDemo}
          </Text>
        )}
      </View>
      <View className="min-w-11 shrink-0 items-center">{trailingAction}</View>
    </View>
  );
}
