import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback } from "react";
import { Text, View } from "react-native";
import { NoiseMeter } from "@/components/screening/noise-meter";
import { OfflineBanner } from "@/components/screening/offline-banner";
import { PermissionPanel } from "@/components/screening/permission-panel";
import { RecordingGuide } from "@/components/screening/recording-guide";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Screen } from "@/components/ui/screen";
import { ScreenHeader } from "@/components/ui/screen-header";
import { copy } from "@/constants/copy";
import { useRecorder } from "@/hooks/use-recorder";
import { useScreening } from "@/hooks/use-screening";
import { useSingleFlight } from "@/hooks/use-single-flight";
import {
  originHrefForSource,
  parseScreeningSource,
  withScreeningSource,
} from "@/services/api/screening-source";

export default function GuideScreen() {
  const { source: rawSource } = useLocalSearchParams<{
    source?: string | string[];
  }>();
  const source = parseScreeningSource(rawSource);
  const recorder = useRecorder();
  const { activeChild, isOnline, clearSession } = useScreening();
  const actionGate = useSingleFlight();
  const { cancelRecording } = recorder;
  useFocusEffect(
    useCallback(
      () => () => {
        void cancelRecording();
      },
      [cancelRecording],
    ),
  );
  return (
    <Screen>
      <ScreenHeader
        title={copy.record.title}
        onBack={() => {
          void actionGate.navigate(async () => {
            await cancelRecording();
            if (source === "monitoring") {
              router.dismissTo(originHrefForSource(source));
              return true;
            }
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(tabs)");
            }
            return true;
          });
        }}
      />
      <OfflineBanner visible={!isOnline} />
      {activeChild.status === "loading" ? (
        <LoadingState label={copy.guide.childLoading} />
      ) : activeChild.status === "error" ? (
        <ErrorState
          description={copy.networkErrors.offline}
          onAction={activeChild.onRetry}
        />
      ) : activeChild.status === "empty" ? (
        <EmptyState
          title={copy.guide.noChild}
          description={copy.guide.noChildBody}
          actionLabel={copy.placeholder.newChild}
          onAction={() => {
            void actionGate.navigate(() => {
              router.push("/children/new");
            });
          }}
        />
      ) : (
        <>
          <Card variant="soft">
            <Text className="text-subtitle font-semibold text-ink dark:text-ink-dark">
              {activeChild.child.name}
            </Text>
            <Text className="text-body text-ink-muted dark:text-ink-dark-muted">
              {activeChild.child.ageLabel}
            </Text>
            {activeChild.child.isPreview && (
              <Text className="text-caption text-ink-muted dark:text-ink-dark-muted">
                {copy.guide.previewNotice}
              </Text>
            )}
          </Card>
          <Text
            accessibilityRole="header"
            className="text-center text-title font-bold text-brand dark:text-brand-light"
          >
            {copy.guide.heading}
          </Text>
          <RecordingGuide />
          <View className="gap-3">
            {copy.guide.tips.map((tip) => (
              <Text key={tip} className="text-body text-ink dark:text-ink-dark">
                {tip}
              </Text>
            ))}
          </View>
          <PermissionPanel recorder={recorder} />
          {recorder.permission === "granted" && (
            <>
              <NoiseMeter
                level={recorder.noiseLevel}
                status={recorder.noiseStatus}
                checking={recorder.isCheckingNoise}
              />
              <Button
                label={
                  recorder.noiseLevel === null
                    ? copy.guide.checkNoise
                    : copy.guide.checkAgain
                }
                variant="secondary"
                disabled={recorder.isCheckingNoise}
                loading={recorder.busy}
                onPress={() => {
                  void actionGate.run(() => recorder.startNoiseCheck());
                }}
              />
              <Button
                label={copy.guide.start}
                loading={recorder.busy}
                disabled={recorder.isCheckingNoise}
                onPress={() => {
                  void actionGate.navigate(async () => {
                    if (
                      (await recorder.stopNoiseCheck()) &&
                      (await clearSession())
                    ) {
                      router.push(
                        withScreeningSource("/screening/record", source),
                      );
                      return true;
                    }
                    return false;
                  });
                }}
              />
            </>
          )}
          {recorder.error && (
            <Text
              accessibilityRole="alert"
              className="text-body text-ink dark:text-ink-dark"
            >
              {recorder.error}
            </Text>
          )}
        </>
      )}
    </Screen>
  );
}
