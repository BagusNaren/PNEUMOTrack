import { SymbolView } from "expo-symbols";
import { Text, View } from "react-native";
import { copy } from "@/constants/copy";
import { useTheme } from "@/hooks/use-theme";

export function RecordingGuide() {
  const theme = useTheme();
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
        <SymbolView
          name={{
            ios: "person.crop.circle",
            android: "account_circle",
            web: "account_circle",
          }}
          size={56}
          tintColor={theme.brand}
          style={{ width: 56, height: 56 }}
        />
        <View className="min-w-0 flex-1 gap-2">
          <Text className="text-center text-label font-semibold text-brand dark:text-brand-light">
            {copy.guide.distance}
          </Text>
          <View className="h-0.5 w-full bg-brand dark:bg-brand-light" />
        </View>
        <SymbolView
          name={{ ios: "iphone", android: "smartphone", web: "smartphone" }}
          size={56}
          tintColor={theme.brand}
          style={{ width: 56, height: 72 }}
        />
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
