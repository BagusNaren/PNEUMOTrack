import { Text, View } from "react-native";
import { Button } from "./button";
import { Icon } from "./icon";

export type StateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};
export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: StateProps) {
  return (
    <View className="items-center gap-4 py-6">
      <Icon name="empty" tone="muted" />
      <Text
        accessibilityRole="header"
        className="text-center text-subtitle font-semibold text-ink dark:text-ink-dark"
      >
        {title}
      </Text>
      <Text className="text-center text-body text-ink-muted dark:text-ink-dark-muted">
        {description}
      </Text>
      {actionLabel && onAction && (
        <Button label={actionLabel} onPress={onAction} />
      )}
    </View>
  );
}
