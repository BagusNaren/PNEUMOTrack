import { router, useLocalSearchParams } from "expo-router";
import { useCallback } from "react";
import { Text, View } from "react-native";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DangerSignsBox } from "@/components/ui/danger-signs-box";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Screen } from "@/components/ui/screen";
import { ScreenHeader } from "@/components/ui/screen-header";
import { StatusBanner } from "@/components/ui/status-banner";
import { Waveform } from "@/components/ui/waveform";
import { copy } from "@/constants/copy";
import { useResource } from "@/hooks/use-resource";
import { screeningsService } from "@/services/screenings";
import { formatDate, formatDuration } from "@/utils/format";

export default function HistoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const record = useResource(
    useCallback(
      () => (id ? screeningsService.get(id) : Promise.resolve(null)),
      [id],
    ),
  );
  const screening = record.data;
  return (
    <Screen>
      <ScreenHeader title={copy.history.detailTitle} />
      {record.isLoading ? (
        <LoadingState />
      ) : (
        <>
          {record.error && (
            <ErrorState
              description={copy.common.loadFailed}
              onAction={() => void record.reload()}
            />
          )}
          {screening ? (
            <>
              <StatusBanner variant={screening.result} />
              <Text className="text-caption text-ink-muted">
                {formatDate(screening.created_at, true)} ·{" "}
                {formatDuration(screening.duration_sec)}
              </Text>
              <Card>
                <View className="flex-row items-center justify-between gap-2">
                  <Text
                    accessibilityRole="header"
                    className="min-w-0 flex-1 text-subtitle font-semibold text-ink"
                  >
                    {screening.result === "risk"
                      ? copy.result.abnormalPattern
                      : copy.result.normalPattern}
                  </Text>
                  <Text className="text-caption text-ink-muted">
                    {formatDuration(screening.duration_sec)}
                  </Text>
                </View>
                {screening.waveform?.length ? (
                  <Waveform
                    samples={screening.waveform}
                    variant={screening.result}
                  />
                ) : (
                  <Text className="text-body text-ink-muted">
                    {copy.result.noWaveform}
                  </Text>
                )}
              </Card>
              <Card variant="soft">
                <Text
                  accessibilityRole="header"
                  className="text-subtitle font-semibold text-ink"
                >
                  {copy.result.summary}
                </Text>
                <Text className="text-body text-ink">
                  {screening.summary || copy.history.summaryUnavailable}
                </Text>
                {!screening.agreement && (
                  <View className="mt-1 gap-2">
                    <Badge variant="disagreement" />
                    <Text className="text-body text-ink-muted">
                      {copy.result.disagreement}
                    </Text>
                  </View>
                )}
              </Card>
              <DangerSignsBox includeDisclaimer />
              <View className="gap-3">
                {screening.result === "risk" && (
                  <Button
                    label={copy.result.recommendation}
                    variant="risk"
                    onPress={() =>
                      router.push({
                        pathname: "/recommendation",
                        params: { screeningId: screening.id },
                      })
                    }
                  />
                )}
                <Button
                  label={copy.common.home}
                  variant="secondary"
                  onPress={() => router.replace("/(tabs)")}
                />
              </View>
            </>
          ) : (
            !record.error && (
              <EmptyState
                title={copy.history.notFound}
                body={copy.history.notFoundBody}
                actionLabel={copy.result.history}
                onAction={() => router.replace("/history")}
              />
            )
          )}
        </>
      )}
    </Screen>
  );
}
