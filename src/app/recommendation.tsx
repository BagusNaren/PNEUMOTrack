import { router, useLocalSearchParams } from "expo-router";
import { useCallback } from "react";
import { Text, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DangerSignsBox } from "@/components/ui/danger-signs-box";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Icon } from "@/components/ui/icon";
import { LoadingState } from "@/components/ui/loading-state";
import { Screen } from "@/components/ui/screen";
import { ScreenHeader } from "@/components/ui/screen-header";
import { StatusBanner } from "@/components/ui/status-banner";
import { copy } from "@/constants/copy";
import { useActiveChild } from "@/hooks/use-active-child";
import { useResource } from "@/hooks/use-resource";
import { useScreening } from "@/hooks/use-screening";
import { screeningsService } from "@/services/screenings";
import { formatDate } from "@/utils/format";

export default function RecommendationScreen() {
  const { screeningId } = useLocalSearchParams<{ screeningId?: string }>();
  const { lastResult, completedAt, isDemo, activeChild } = useScreening();
  const { children } = useActiveChild();
  const record = useResource(
    useCallback(
      () =>
        screeningId
          ? screeningsService.get(screeningId)
          : Promise.resolve(null),
      [screeningId],
    ),
  );
  const result = screeningId ? record.data : lastResult;
  const timestamp = screeningId ? record.data?.created_at : completedAt;
  const name = screeningId
    ? children.find((child) => child.id === record.data?.child_id)?.name
    : activeChild.status === "ready"
      ? activeChild.child.name
      : null;

  return (
    <Screen>
      <ScreenHeader title={copy.recommendation.title} />
      {!screeningId && isDemo && (
        <Text className="text-label text-brand">
          {copy.screening.demoNotice}
        </Text>
      )}
      {screeningId && record.isLoading ? (
        <LoadingState />
      ) : screeningId && record.error ? (
        <ErrorState
          description={copy.common.loadFailed}
          onAction={() => void record.reload()}
        />
      ) : screeningId && !result ? (
        <EmptyState
          title={copy.history.notFound}
          body={copy.history.notFoundBody}
        />
      ) : result ? (
        <>
          <StatusBanner variant={result.result} />
          <View className="gap-1">
            {name && (
              <Text className="text-body font-semibold text-ink">{name}</Text>
            )}
            {timestamp && (
              <Text className="text-caption text-ink-muted">
                {formatDate(timestamp, true)}
              </Text>
            )}
          </View>
          <Button
            label={copy.recommendation.viewResultDetail}
            variant="secondary"
            onPress={() =>
              router.push(
                screeningId
                  ? { pathname: "/history/[id]", params: { id: screeningId } }
                  : "/screening/result",
              )
            }
          />
        </>
      ) : (
        <Card variant="brand">
          <Text className="text-subtitle font-semibold text-ink">
            {copy.recommendation.staticBannerTitle}
          </Text>
          <Text className="text-body text-ink-muted">
            {copy.recommendation.staticBannerBody}
          </Text>
          <Button
            label={copy.record.start}
            onPress={() => router.push("/screening/guide")}
          />
        </Card>
      )}
      <View className="gap-3">
        <Card>
          <Icon name="doctor" tone="brand" />
          <Text
            accessibilityRole="header"
            className="text-subtitle font-semibold text-ink"
          >
            {copy.recommendation.doctors}
          </Text>
          <Text className="text-body text-ink-muted">
            {copy.recommendation.doctorsDescription}
          </Text>
          <Button
            label={copy.recommendation.consult}
            onPress={() => router.push("/doctors")}
          />
        </Card>
        <Card>
          <Icon name="hospital" tone="brand" />
          <Text
            accessibilityRole="header"
            className="text-subtitle font-semibold text-ink"
          >
            {copy.recommendation.hospitals}
          </Text>
          <Text className="text-body text-ink-muted">
            {copy.recommendation.hospitalsDescription}
          </Text>
          <Button
            label={copy.recommendation.findHospital}
            variant="secondary"
            onPress={() => router.push("/hospitals")}
          />
        </Card>
      </View>
      <DangerSignsBox showEmergencyAction includeDisclaimer />
    </Screen>
  );
}
