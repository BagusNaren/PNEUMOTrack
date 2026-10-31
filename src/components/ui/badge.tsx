import { Text, View } from "react-native";
import { copy } from "@/constants/copy";

const variants = {
  normal: "bg-surface-brand dark:bg-surface-brand-dark",
  risk: "bg-risk-surface dark:bg-risk-surface-dark",
  disagreement: "bg-surface-brand-soft dark:bg-surface-brand-soft-dark",
} as const;
export function Badge({
  variant,
  label,
}: {
  variant: keyof typeof variants;
  label?: string;
}) {
  const labels = {
    normal: copy.result.normalBadge,
    risk: copy.result.riskBadge,
    disagreement: copy.result.disagreementBadge,
  };
  return (
    <View className={`self-start rounded-pill px-3 py-1 ${variants[variant]}`}>
      <Text
        className={`text-label font-semibold ${variant === "risk" ? "text-risk dark:text-risk-light" : "text-brand dark:text-brand-light"}`}
      >
        {label ?? labels[variant]}
      </Text>
    </View>
  );
}
