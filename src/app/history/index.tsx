import { router } from "expo-router";
import { useCallback } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Icon } from "@/components/ui/icon";
import { ListRow } from "@/components/ui/list-row";
import { LoadingState } from "@/components/ui/loading-state";
import { ScreenHeader } from "@/components/ui/screen-header";
import { TrendChart } from "@/components/ui/trend-chart";
import { copy } from "@/constants/copy";
import { Spacing, UI } from "@/constants/theme";
import { useActiveChild } from "@/hooks/use-active-child";
import { useResource } from "@/hooks/use-resource";
import { screeningsService } from "@/services/screenings";
import { formatDate, formatDuration } from "@/utils/format";

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { activeChild, isLoading, error, refresh } = useActiveChild();
  const childId = activeChild?.id;
  const history = useResource(
    useCallback(
      () =>
        childId ? screeningsService.listByChild(childId) : Promise.resolve([]),
      [childId],
    ),
  );

  const items = history.data ?? [];
  const latest = items[0];
  const chronological = [...items].reverse();
  const durations = chronological.map((item) => item.duration_sec ?? 0);
  const segments = chronological.map((item) => item.chunks ?? 0);
  const normalCount = items.filter((item) => item.result === "normal").length;
  const riskCount = items.length - normalCount;
  const averageDuration = durations.length
    ? durations.reduce((total, value) => total + value, 0) / durations.length
    : 0;
  const maxDuration = durations.length ? Math.max(...durations) : 0;
  const averageSegments = segments.length
    ? segments.reduce((total, value) => total + value, 0) / segments.length
    : 0;
  const maxSegments = segments.length ? Math.max(...segments) : 0;
  const hasTrend = items.length >= 2;
  const loading = isLoading || history.isLoading;

  const onRefresh = () => {
    void refresh();
    void history.reload();
  };

  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentContainerStyle={{
        paddingTop: insets.top,
        paddingHorizontal: UI.gutter,
        paddingBottom: Spacing.six,
      }}
      refreshControl={
        <RefreshControl refreshing={history.isRefreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      <View className="w-full max-w-content self-center gap-4">
        <ScreenHeader
          title={copy.history.title}
          subtitle={activeChild?.name}
          showBack={false}
        />

        {error || history.error ? (
          <ErrorState
            description={copy.common.loadFailed}
            onAction={onRefresh}
          />
        ) : loading ? (
          <LoadingState />
        ) : !activeChild ? (
          <EmptyState
            title={copy.children.emptyTitle}
            body={copy.children.emptyBody}
            actionLabel={copy.children.addButton}
            onAction={() => router.push("/children/new")}
          />
        ) : items.length === 0 ? (
          <EmptyState
            title={copy.ui.emptyTitle}
            body={copy.ui.emptyBody}
            actionLabel={copy.record.start}
            onAction={() => router.push("/screening/guide")}
          />
        ) : (
          <>
            {latest ? (
              <Card variant={latest.result === "risk" ? "risk" : "brand"}>
                <View className="flex-row items-center gap-3">
                  <Avatar name={activeChild.name} size="md" />
                  <View className="min-w-0 flex-1 gap-1">
                    <Text className="text-caption text-ink-muted">
                      {copy.history.latest}
                    </Text>
                    <Text
                      className={`text-label font-semibold ${
                        latest.result === "risk" ? "text-risk" : "text-brand"
                      }`}
                    >
                      {latest.result === "risk"
                        ? copy.dashboard.riskStatus
                        : copy.dashboard.normalStatus}
                    </Text>
                    <Text className="text-caption text-ink-muted">
                      {formatDate(latest.created_at, true)} ·{" "}
                      {formatDuration(latest.duration_sec)}
                    </Text>
                  </View>
                  <Icon
                    name={latest.result === "risk" ? "warning" : "check"}
                    tone={latest.result === "risk" ? "risk" : "safe"}
                    size={UI.iconLg}
                  />
                </View>
              </Card>
            ) : null}

            <Card className="gap-4">
              <View className="gap-1">
                <Text
                  accessibilityRole="header"
                  className="text-subtitle font-semibold text-ink"
                >
                  {copy.history.trends}
                </Text>
                <Text className="text-caption text-ink-muted">
                  {copy.history.perRecordingNote}
                </Text>
              </View>

              {hasTrend ? (
                <>
                  <View className="gap-2">
                    <Text className="text-label font-semibold text-ink">
                      {copy.history.durationChart}
                    </Text>
                    <TrendChart
                      samples={durations}
                      accessibilityLabel={copy.history.durationChart}
                    />
                    <View className="flex-row gap-2">
                      <Text className="flex-1 text-caption text-ink-muted">
                        {copy.history.oldest}:{" "}
                        {formatDate(chronological[0].created_at, false)}
                      </Text>
                      <Text className="flex-1 text-right text-caption text-ink-muted">
                        {copy.history.newest}:{" "}
                        {formatDate(
                          chronological[chronological.length - 1].created_at,
                          false,
                        )}
                      </Text>
                    </View>
                    <View className="flex-row gap-2">
                      <Text className="flex-1 text-caption text-ink-muted">
                        {copy.history.average(formatDuration(averageDuration))}
                      </Text>
                      <Text className="flex-1 text-right text-caption text-ink-muted">
                        {copy.history.highest(formatDuration(maxDuration))}
                      </Text>
                    </View>
                  </View>

                  <View className="gap-2">
                    <Text className="text-label font-semibold text-ink">
                      {copy.history.segmentsChart}
                    </Text>
                    <TrendChart
                      samples={segments}
                      variant="bar"
                      showValues
                      accessibilityLabel={copy.history.segmentsChart}
                    />
                    <View className="flex-row gap-2">
                      <Text className="flex-1 text-caption text-ink-muted">
                        {copy.history.average(
                          `${averageSegments.toLocaleString("id-ID", {
                            maximumFractionDigits: 1,
                            minimumFractionDigits: 1,
                          })} segmen`,
                        )}
                      </Text>
                      <Text className="flex-1 text-right text-caption text-ink-muted">
                        {copy.history.highest(`${maxSegments} segmen`)}
                      </Text>
                    </View>
                  </View>
                </>
              ) : (
                <View className="gap-3 rounded-card bg-surface-muted p-4">
                  <Text className="text-label font-semibold text-ink">
                    {copy.history.noTrend}
                  </Text>
                  <Text className="text-caption text-ink-muted">
                    {copy.history.noTrendBody}
                  </Text>
                  <View className="flex-row gap-3">
                    <View className="flex-1 gap-0.5">
                      <Text className="text-caption text-ink-muted">
                        {copy.history.lastDuration}
                      </Text>
                      <Text className="text-label font-semibold text-ink">
                        {formatDuration(latest?.duration_sec ?? 0)}
                      </Text>
                    </View>
                    <View className="flex-1 gap-0.5">
                      <Text className="text-caption text-ink-muted">
                        {copy.history.lastSegments}
                      </Text>
                      <Text className="text-label font-semibold text-ink">
                        {latest?.chunks ?? 0} bagian
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              <View className="flex-row gap-3">
                <View className="flex-1 rounded-card bg-surface-safe p-3">
                  <View className="flex-row items-baseline gap-2">
                    <Text className="text-title font-bold text-safe">
                      {normalCount}
                    </Text>
                    <Text className="text-label font-semibold text-safe">
                      {copy.history.normalLabel}
                    </Text>
                  </View>
                  <Text className="text-caption text-ink-muted">
                    {copy.history.recordingCount(normalCount)}
                  </Text>
                </View>
                <View className="flex-1 rounded-card bg-risk-surface p-3">
                  <View className="flex-row items-baseline gap-2">
                    <Text className="text-title font-bold text-risk">
                      {riskCount}
                    </Text>
                    <Text className="text-label font-semibold text-risk">
                      {copy.history.riskLabel}
                    </Text>
                  </View>
                  <Text className="text-caption text-ink-muted">
                    {copy.history.recordingCount(riskCount)}
                  </Text>
                </View>
              </View>
            </Card>

            <Card variant="soft" className="gap-3">
              <Text
                accessibilityRole="header"
                className="text-subtitle font-semibold text-ink"
              >
                {copy.history.aiSummary}
              </Text>
              <Text className="text-body text-ink">
                {latest?.summary || copy.history.summaryUnavailable}
              </Text>
              <View className="h-px bg-border" />
              <Text className="text-caption text-ink-muted">
                {copy.disclaimer}
              </Text>
            </Card>

            <View className="gap-1">
              <Text
                accessibilityRole="header"
                className="text-subtitle font-semibold text-ink"
              >
                {copy.history.recent}
              </Text>
              {items.slice(0, 5).map((item) => (
                <ListRow
                  key={item.id}
                  onPress={() =>
                    router.push({
                      pathname: "/history/[id]",
                      params: { id: item.id },
                    })
                  }
                  title={formatDate(item.created_at, true)}
                  subtitle={`${formatDuration(item.duration_sec)} · ${item.chunks} segmen`}
                  leading={
                    <View
                      className={`h-9 w-9 items-center justify-center rounded-full ${
                        item.result === "risk"
                          ? "bg-risk-surface"
                          : "bg-surface-safe"
                      }`}
                    >
                      <Icon
                        name={item.result === "risk" ? "warning" : "check"}
                        tone={item.result === "risk" ? "risk" : "safe"}
                      />
                    </View>
                  }
                  trailing={<Badge variant={item.result} />}
                />
              ))}
            </View>

            <Button
              label={copy.record.start}
              onPress={() => router.push("/screening/guide")}
            />
          </>
        )}
      </View>
    </ScrollView>
  );
}
