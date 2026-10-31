import { Text, View } from "react-native";
import { copy } from "@/constants/copy";

const variants = {
  normal: "bg-surface-brand dark:bg-surface-brand-dark",
  brand: "bg-surface-brand dark:bg-surface-brand-dark",
  risk: "bg-risk-surface dark:bg-risk-surface-dark",
  disagreement: "bg-surface-brand-soft dark:bg-surface-brand-soft-dark",
  muted: "bg-surface-muted dark:bg-surface-muted-dark",
  warning: "bg-surface-brand-soft dark:bg-surface-brand-soft-dark",
} as const;

export function Badge({
  variant = "normal",
  label,
}: {
  variant?: keyof typeof variants;
  label?: string;
}) {
  const labels: Record<keyof typeof variants, string> = {
    normal: copy.result.normalBadge,
    brand: copy.result.normalBadge,
    risk: copy.result.riskBadge,
    disagreement: copy.result.disagreementBadge,
    muted: "",
    warning: copy.result.riskBadge,
  };
  const textColor =
    variant === "risk"
      ? "text-risk dark:text-risk-light"
      : variant === "muted"
        ? "text-ink-muted dark:text-ink-dark-muted"
        : "text-brand dark:text-brand-light";
  return (
    <View className={`self-start rounded-pill px-3 py-1 ${variants[variant]}`}>
      <Text className={`text-label font-semibold ${textColor}`}>
        {label ?? labels[variant]}
      </Text>
    </View>
  );
}
