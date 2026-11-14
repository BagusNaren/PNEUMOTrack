import { Text, View } from "react-native";
import { UI } from "@/constants/theme";
import { Button } from "./button";
import { Icon } from "./icon";

export type StateProps = {
  title: string;
  description?: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
};

export function EmptyState({
  title,
  description,
  body,
  actionLabel,
  onAction,
  className = "",
}: StateProps) {
  const detail = description ?? body;
  return (
    <View className={`items-center gap-3 py-6 px-4 ${className}`}>
      <View className="h-14 w-14 items-center justify-center rounded-full bg-surface-brand-soft"><Icon name="empty" tone="brand" size={UI.iconXl} /></View>
      <Text
        accessibilityRole="header"
        className="text-center text-subtitle font-semibold text-ink dark:text-ink-dark"
      >
        {title}
      </Text>
      {detail ? (
        <Text className="text-center text-body text-ink-muted dark:text-ink-dark-muted">
          {detail}
        </Text>
      ) : null}
      {actionLabel && onAction && (
        <Button label={actionLabel} onPress={onAction} />
      )}
    </View>
  );
}
