import { Text, View } from "react-native";
import { UI } from "@/constants/theme";
import { copy } from "@/constants/copy";
import { Icon } from "@/components/ui/icon";

export function RecordingGuide() {
  return (
    <View
      accessible
      accessibilityLabel={copy.guide.diagram}
      className="items-center gap-4 rounded-card bg-surface-brand-soft p-6 dark:bg-surface-brand-soft-dark"
    >
      <View
        className="w-full flex-row items-center justify-between gap-3"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Icon name="profile" tone="brand" size={UI.diagramSize} />
        <View className="min-w-0 flex-1 gap-2">
          <Text className="text-center text-label font-semibold text-brand dark:text-brand-light">
            {copy.guide.distance}
          </Text>
          <View className="h-0.5 w-full bg-brand dark:bg-brand-light" />
        </View>
        <Icon name="phone" tone="brand" size={UI.diagramSize} />
      </View>
      <View className="w-full flex-row justify-between gap-3">
        <Text className="text-label text-ink dark:text-ink-dark">
          {copy.guide.child}
        </Text>
        <Text className="text-label text-ink dark:text-ink-dark">
          {copy.guide.phone}
        </Text>
      </View>
    </View>
  );
}
