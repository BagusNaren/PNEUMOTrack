import { Text, View } from "react-native";
import { copy } from "@/constants/copy";
import { Card } from "./card";
import { Icon } from "./icon";

export function StatusBanner({
  variant,
  text,
  message,
}: {
  variant: "normal" | "risk";
  text?: string;
  message?: string;
}) {
  const displayText =
    text ??
    message ??
    (variant === "risk" ? copy.result.riskTitle : copy.result.normalTitle);
  return (
    <Card variant={variant === "risk" ? "risk" : "brand"}>
      <View
        className="flex-row flex-wrap items-start gap-3"
        accessibilityLiveRegion="polite"
      >
        <View className="shrink-0">
          <Icon
            name={variant === "risk" ? "warning" : "check"}
            tone={variant === "risk" ? "risk" : "brand"}
          />
        </View>
        <Text
          className={`min-w-0 flex-1 text-label font-semibold ${variant === "risk" ? "text-risk dark:text-risk-light" : "text-brand dark:text-brand-light"}`}
        >
          {displayText}
        </Text>
      </View>
    </Card>
  );
}
