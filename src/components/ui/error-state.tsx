import { Text, View } from "react-native";
import { copy } from "@/constants/copy";
import { UI } from "@/constants/theme";
import { Button } from "./button";
import type { StateProps } from "./empty-state";
import { Icon } from "./icon";

export function ErrorState({
  title = copy.ui.errorTitle,
  description,
  actionLabel = copy.common.retry,
  onAction,
}: Omit<StateProps, "title"> & { title?: string }) {
  return (
    <View className="items-center gap-3 py-6 px-4">
      <View className="h-14 w-14 items-center justify-center rounded-full bg-risk-surface"><Icon name="error" tone="risk" size={UI.iconXl} /></View>
      <Text
        accessibilityRole="alert"
        selectable
        className="text-center text-subtitle font-semibold text-ink dark:text-ink-dark"
      >
        {title}
      </Text>
      <Text
        selectable
        className="text-center text-body text-ink-muted dark:text-ink-dark-muted"
      >
        {description}
      </Text>
      {onAction && <Button label={actionLabel} onPress={onAction} />}
    </View>
  );
}
