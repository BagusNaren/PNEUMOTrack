import { router } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { copy } from "@/constants/copy";
import { UI } from "@/constants/theme";
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
    <View className="min-h-14 flex-row items-center justify-between gap-2 py-1">
      {canShowBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.common.back}
          style={{ minWidth: UI.touchTarget, minHeight: UI.touchTarget }}
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
      <View className="min-w-0 flex-1 items-center py-1">
        <Text
          numberOfLines={1}
          accessibilityRole="header"
          className="w-full text-center text-subtitle font-semibold text-ink"
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            numberOfLines={1}
            className="w-full text-center text-caption text-ink-muted"
          >
            {subtitle}
          </Text>
        )}
      </View>
      <View className="h-11 min-w-11 shrink-0 items-center justify-center">
        {trailingAction}
      </View>
    </View>
  );
}
