import { Text, View } from "react-native";
import { Card } from "@/components/ui/card";
import { copy } from "@/constants/copy";

export function NoiseMeter({
  level,
  status,
  checking,
}: {
  level: number | null;
  status: "safe" | "noisy" | "unknown";
  checking: boolean;
}) {
  const label = checking
    ? copy.guide.checking
    : status === "safe"
      ? copy.guide.quiet
      : status === "noisy"
        ? copy.guide.noisy
        : copy.guide.unknown;
  return (
    <Card variant="soft">
      <Text
        accessibilityRole="header"
        className="text-label font-semibold text-ink dark:text-ink-dark"
      >
        {copy.guide.noiseTitle}
      </Text>
      <Text
        accessibilityLiveRegion="polite"
        className="text-body text-brand dark:text-brand-light"
      >
        {label}
      </Text>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel={label}
        accessibilityValue={
          level === null
            ? { text: label }
            : { min: 0, max: 100, now: Math.round(level * 100), text: label }
        }
        className="h-2 rounded-pill bg-surface-brand dark:bg-surface-brand-dark"
      >
        {level !== null && (
          <View
            className="h-2 rounded-pill bg-brand dark:bg-brand-light"
            style={{ width: `${Math.round(level * 100)}%` }}
          />
        )}
      </View>
      <View className="flex-row flex-wrap justify-between gap-2">
        <Text className="text-caption text-ink dark:text-ink-dark">
          {copy.guide.quietEndpoint}
        </Text>
        <Text className="text-caption text-ink dark:text-ink-dark">
          {copy.guide.noisyEndpoint}
        </Text>
      </View>
      <Text className="text-caption text-ink-muted dark:text-ink-dark-muted">
        {copy.guide.noiseHint}
      </Text>
    </Card>
  );
}
