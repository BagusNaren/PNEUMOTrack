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
    <Card variant={variant === "risk" ? "risk" : "safe"}>
      <View
        className="flex-row items-center gap-3"
        accessibilityLiveRegion="polite"
      >
        <View
          className={`h-8 w-8 shrink-0 items-center justify-center rounded-full ${variant === "risk" ? "bg-risk-surface" : "bg-surface-safe"}`}
        >
          <Icon
            name={variant === "risk" ? "warning" : "check"}
            tone={variant === "risk" ? "risk" : "safe"}
          />
        </View>
        <Text
          className={`min-w-0 flex-1 text-label font-semibold ${variant === "risk" ? "text-risk" : "text-safe"}`}
        >
          {displayText}
        </Text>
      </View>
    </Card>
  );
}
