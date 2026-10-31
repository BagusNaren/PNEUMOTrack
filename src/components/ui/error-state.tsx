import { Text, View } from "react-native";
import { copy } from "@/constants/copy";
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
    <View className="gap-4 py-6">
      <Icon name="error" tone="muted" />
      <Text
        accessibilityRole="alert"
        selectable
        className="text-subtitle font-semibold text-ink dark:text-ink-dark"
      >
        {title}
      </Text>
      <Text
        selectable
        className="text-body text-ink-muted dark:text-ink-dark-muted"
      >
        {description}
      </Text>
      {onAction && <Button label={actionLabel} onPress={onAction} />}
    </View>
  );
}
