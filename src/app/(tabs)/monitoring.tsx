import { router } from "expo-router";
import { useCallback } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { ScreenHeader } from "@/components/ui/screen-header";
import { Waveform } from "@/components/ui/waveform";
import { copy } from "@/constants/copy";
import { useActiveChild } from "@/hooks/use-active-child";
import { useResource } from "@/hooks/use-resource";
import { screeningsService } from "@/services/screenings";
import { formatDate, formatDuration } from "@/utils/format";

export default function MonitoringScreen() {
  const insets = useSafeAreaInsets();
  const { activeChild, isLoading, error, refresh } = useActiveChild();
  const childId = activeChild?.id;
  const latest = useResource(
    useCallback(
      () =>
        childId ? screeningsService.latest(childId) : Promise.resolve(null),
      [childId],
    ),
  );
  const screening = latest.data;
  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentContainerStyle={{
        paddingTop: insets.top,
        paddingHorizontal: 20,
        paddingBottom: 24,
        gap: 16,
      }}
      refreshControl={
        <RefreshControl
          refreshing={latest.isRefreshing}
          onRefresh={() => {
            void refresh();
            void latest.reload();
          }}
        />
      }
    >
      <ScreenHeader title={copy.nav.monitoring} subtitle={activeChild?.name} />
      <Text className="text-body text-ink-muted">
        {copy.history.monitoringBody}
      </Text>
      {isLoading || latest.isLoading ? (
        <LoadingState />
      ) : (
        <>
          {(error || latest.error) && (
            <ErrorState
              description={copy.common.loadFailed}
              onAction={() => {
                void refresh();
                void latest.reload();
              }}
            />
          )}
          {screening && !error ? (
            <Card>
              <Text
                accessibilityRole="header"
                className="text-subtitle font-semibold text-ink"
              >
                {copy.history.waveform}
              </Text>
              <Text className="text-caption text-ink-muted">
                {formatDate(screening.created_at, true)} ·{" "}
                {formatDuration(screening.duration_sec)}
              </Text>
              {screening.waveform?.length ? (
                <Waveform samples={screening.waveform} />
              ) : (
                <Text className="text-body text-ink-muted">
                  {copy.result.noWaveform}
                </Text>
              )}
              <Button
                label={copy.dashboard.viewDetail}
                variant="secondary"
                onPress={() =>
                  router.push({
                    pathname: "/history/[id]",
                    params: { id: screening.id },
                  })
                }
              />
            </Card>
          ) : (
            !error &&
            !latest.error && (
              <EmptyState
                title={
                  activeChild ? copy.ui.emptyTitle : copy.children.emptyTitle
                }
                body={activeChild ? copy.ui.emptyBody : copy.children.emptyBody}
              />
            )
          )}
        </>
      )}
      <View>
        <Button
          label={activeChild ? copy.record.start : copy.children.addButton}
          onPress={() =>
            router.push(
              activeChild
                ? "/screening/guide?source=monitoring"
                : "/children/new",
            )
          }
        />
      </View>
    </ScrollView>
  );
}
