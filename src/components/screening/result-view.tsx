import { Text, View } from "react-native";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Collapsible } from "@/components/ui/collapsible";
import { DangerSignsBox } from "@/components/ui/danger-signs-box";
import { Disclaimer } from "@/components/ui/disclaimer";
import { StatusBanner } from "@/components/ui/status-banner";
import { Waveform } from "@/components/ui/waveform";
import { copy } from "@/constants/copy";
import type { ResultViewProps } from "@/types/screening";

const numberFormat = new Intl.NumberFormat("id-ID", {
  maximumSignificantDigits: 6,
});

export function ResultView({ result, onRerecord }: ResultViewProps) {
  const aeError =
    "autoencoder" in result ? result.autoencoder.error : result.ae_error;
  const aeThreshold =
    "autoencoder" in result
      ? result.autoencoder.threshold
      : result.ae_threshold;
  const ocsvmScore =
    "ocsvm" in result ? result.ocsvm.score : result.ocsvm_score;
  const details = [
    [
      copy.result.duration,
      `${numberFormat.format(result.duration_sec)} ${copy.record.seconds}`,
    ],
    [copy.result.chunks, numberFormat.format(result.chunks)],
    [copy.result.aeError, numberFormat.format(aeError)],
    [copy.result.aeThreshold, numberFormat.format(aeThreshold)],
    [copy.result.ocsvm, numberFormat.format(ocsvmScore)],
    [copy.result.modelVersion, result.model_version],
  ];
  return (
    <View className="gap-6">
      <StatusBanner variant={result.result} />
      {!result.agreement && (
        <Card variant="soft">
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
      <View className="gap-3">
        <Text
          accessibilityRole="header"
          className="text-subtitle font-semibold text-ink dark:text-ink-dark"
        >
          {result.result === "risk"
            ? copy.result.abnormalPattern
            : copy.result.normalPattern}
        </Text>
        {result.waveform.length ? (
          <Waveform samples={result.waveform} variant={result.result} />
        ) : (
          <Text className="text-body text-ink-muted dark:text-ink-dark-muted">
            {copy.result.noWaveform}
          </Text>
        )}
      </View>
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
      <Collapsible title={copy.result.technical}>
        <View className="gap-4 p-4">
          <Text className="text-caption text-ink-muted dark:text-ink-dark-muted">
            {copy.result.technicalHint}
          </Text>
          {details.map(([label, value]) => (
            <View key={label} className="gap-1">
              <Text className="text-label text-ink-muted dark:text-ink-dark-muted">
                {label}
              </Text>
              <Text
                selectable
                className="text-body font-semibold text-ink dark:text-ink-dark"
              >
                {value}
              </Text>
            </View>
          ))}
        </View>
      </Collapsible>
      <DangerSignsBox />
      <Disclaimer />
    </View>
  );
}
