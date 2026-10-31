import { Text, View } from "react-native";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { copy } from "@/constants/copy";

export function OfflineBanner({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <Card variant="soft">
      <View
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        className="flex-row items-center gap-3"
      >
        <View className="shrink-0">
          <Icon name="error" tone="brand" />
        </View>
        <Text className="min-w-0 flex-1 text-body text-ink dark:text-ink-dark">
          {copy.networkErrors.offlineBanner}
        </Text>
      </View>
    </Card>
  );
}
