import { router, useLocalSearchParams } from "expo-router";
import { useCallback } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DangerSignsBox } from "@/components/ui/danger-signs-box";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { ScreenHeader } from "@/components/ui/screen-header";
import { StatusBanner } from "@/components/ui/status-banner";
import { Waveform } from "@/components/ui/waveform";
import { copy } from "@/constants/copy";
import { useResource } from "@/hooks/use-resource";
import { screeningsService } from "@/services/screenings";
import { formatDate, formatDuration } from "@/utils/format";

export default function HistoryDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const record = useResource(
    useCallback(
      () => (id ? screeningsService.get(id) : Promise.resolve(null)),
      [id],
    ),
  );
  const screening = record.data;
  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentContainerStyle={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: 20,
        gap: 16,
      }}
    >
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
                <Text
                  accessibilityRole="header"
                  className="text-label font-semibold text-ink"
                >
                  {copy.ui.waveform}
                </Text>
                {screening.waveform?.length ? (
                  <Waveform samples={screening.waveform} />
                ) : (
                  <Text className="text-body text-ink-muted">
                    {copy.result.noWaveform}
                  </Text>
                )}
              </Card>
              <Card>
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
                  <Text className="text-body text-ink-muted">
                    {copy.result.disagreement}
                  </Text>
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
    </ScrollView>
  );
}
