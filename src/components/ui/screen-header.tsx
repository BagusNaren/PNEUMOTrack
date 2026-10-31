import { router } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { copy } from "@/constants/copy";
import { Icon } from "./icon";

export function ScreenHeader({
  title,
  subtitle,
  back = true,
  onBack,
  action,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  onBack?: () => void;
  action?: ReactNode;
}) {
  return (
    <View className="min-h-14 flex-row flex-wrap items-center gap-2 py-1">
      {back ? (
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
      </View>
      <View className="min-w-11 shrink-0 items-center">{action}</View>
    </View>
  );
}
