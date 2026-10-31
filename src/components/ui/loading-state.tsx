import { Text, View } from "react-native";
import { copy } from "@/constants/copy";

export function LoadingState({
  label = copy.common.loading,
}: {
  label?: string;
}) {
  return (
    <View
      accessible
      accessibilityLabel={label}
      accessibilityState={{ busy: true }}
      className="gap-3 py-4"
    >
      <Text className="text-body text-ink-muted dark:text-ink-dark-muted">
        {label}
      </Text>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        className="gap-3"
      >
        <View className="h-6 w-2/3 rounded-card bg-surface-muted dark:bg-surface-muted-dark" />
        <View className="h-20 rounded-card bg-surface-muted dark:bg-surface-muted-dark" />
        <View className="h-4 w-4/5 rounded-card bg-surface-muted dark:bg-surface-muted-dark" />
      </View>
    </View>
  );
}
