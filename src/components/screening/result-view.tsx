import { Text, View } from "react-native";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DangerSignsBox } from "@/components/ui/danger-signs-box";
import { StatusBanner } from "@/components/ui/status-banner";
import { Waveform } from "@/components/ui/waveform";
import { copy } from "@/constants/copy";
import type { ResultViewProps } from "@/types/screening";
import { formatDuration } from "@/utils/format";

export function ResultView({ result, onRerecord }: ResultViewProps) {
  return (
    <View className="gap-6">
      <StatusBanner variant={result.result} />
      {!result.agreement && (
        <Card variant="warning">
          <Badge variant="disagreement" />
          <Text className="text-body text-ink dark:text-ink-dark">
            {copy.result.disagreement}
          </Text>
          {onRerecord && (
            <Button
              label={copy.common.rerecord}
              variant="secondary"
              onPress={onRerecord}
            />
          )}
        </Card>
      )}
      <Card>
        <View className="flex-row items-center justify-between gap-2">
          <Text
            accessibilityRole="header"
            className="min-w-0 flex-1 text-subtitle font-semibold text-ink"
          >
            {result.result === "risk"
              ? copy.result.abnormalPattern
              : copy.result.normalPattern}
          </Text>
          <Text className="text-caption text-ink-muted">
            {formatDuration(result.duration_sec)}
          </Text>
        </View>
        {result.waveform.length ? (
          <Waveform samples={result.waveform} variant={result.result} />
        ) : (
          <Text className="text-body text-ink-muted">
            {copy.result.noWaveform}
          </Text>
        )}
      </Card>
      <Card variant="soft">
        <Text
          accessibilityRole="header"
          className="text-subtitle font-semibold text-ink dark:text-ink-dark"
        >
          {copy.result.summary}
        </Text>
        <Text selectable className="text-body text-ink dark:text-ink-dark">
          {result.summary}
        </Text>
      </Card>
      <DangerSignsBox includeDisclaimer />
    </View>
  );
}
