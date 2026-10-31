import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback } from "react";
import { Text, View } from "react-native";
import { AudioPreview } from "@/components/screening/audio-preview";
import { OfflineBanner } from "@/components/screening/offline-banner";
import { PermissionPanel } from "@/components/screening/permission-panel";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Screen } from "@/components/ui/screen";
import { ScreenHeader } from "@/components/ui/screen-header";
import { Waveform } from "@/components/ui/waveform";
import { copy } from "@/constants/copy";
import { useRecorder } from "@/hooks/use-recorder";
import { useScreening } from "@/hooks/use-screening";
import { useSingleFlight } from "@/hooks/use-single-flight";
import {
  triggerRecordStartHaptic,
  triggerRecordStopHaptic,
} from "@/services/api/haptics";
import {
  originHrefForSource,
  parseScreeningSource,
  withScreeningSource,
} from "@/services/api/screening-source";

function formatTimer(ms: number) {
  const tenths = Math.floor(ms / 100);
  return `${String(Math.floor(tenths / 600)).padStart(2, "0")}:${String(Math.floor(tenths / 10) % 60).padStart(2, "0")}.${tenths % 10}`;
}

export default function RecordScreen() {
  const { source: rawSource } = useLocalSearchParams<{
    source?: string | string[];
  }>();
  const source = parseScreeningSource(rawSource);
  const recorder = useRecorder();
  const screening = useScreening();
  const actionGate = useSingleFlight();
  const child = screening.activeChild;
  const active = recorder.phase === "recording" || recorder.phase === "paused";
  const { stopOnBlur } = recorder;
  useFocusEffect(
    useCallback(
      () => () => {
        void stopOnBlur();
      },
      [stopOnBlur],
    ),
  );
  return (
    <Screen>
      <ScreenHeader
        title={copy.record.title}
        onBack={() => {
          void actionGate.navigate(async () => {
            if (
              (await recorder.cancelRecording()) &&
              (await screening.clearSession())
            ) {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.dismissTo(originHrefForSource(source));
              }
              return true;
            }
            return false;
          });
        }}
      />
      <OfflineBanner visible={!screening.isOnline} />
      {child.status === "loading" ? (
        <LoadingState label={copy.guide.childLoading} />
      ) : child.status === "error" ? (
        <ErrorState
          description={copy.networkErrors.offline}
          onAction={child.onRetry}
        />
      ) : child.status === "empty" ? (
        <EmptyState
          title={copy.guide.noChild}
          description={copy.guide.noChildBody}
          actionLabel={copy.analyzing.guide}
          onAction={() => {
            void actionGate.navigate(() => {
              router.replace(withScreeningSource("/screening/guide", source));
            });
          }}
        />
      ) : (
        <>
          <Text className="text-center text-body text-ink dark:text-ink-dark">
            {child.child.name}
          </Text>
          <View className="items-center gap-3 py-4">
            <Text
              accessibilityLiveRegion="polite"
              className="text-center text-display font-bold tabular-nums text-brand dark:text-brand-light"
            >
              {formatTimer(recorder.durationMs)}
            </Text>
            <Text className="text-body text-ink dark:text-ink-dark">
              {recorder.phase === "recording"
                ? copy.record.recording
                : recorder.phase === "paused"
                  ? copy.record.paused
                  : recorder.phase === "stopped"
                    ? copy.record.preview
                    : copy.record.ready}
            </Text>
          </View>
          <Text className="text-body text-ink-muted dark:text-ink-dark-muted">
            {copy.record.hint}
          </Text>
          <Waveform
            samples={recorder.meteringHistory}
            liveSamples={recorder.liveMetering}
            mode={recorder.phase === "recording" ? "live" : "static"}
          />
          <Text className="text-caption text-ink-muted dark:text-ink-dark-muted">
            {copy.record.limit}
          </Text>
          {recorder.interrupted && (
            <Text
              accessibilityRole="alert"
              className="text-body text-ink dark:text-ink-dark"
            >
              {copy.record.background}
            </Text>
          )}
          <PermissionPanel recorder={recorder} />
          {recorder.permission === "granted" && (
            <View className="gap-3">
              {active ? (
                <>
                  <Button
                    label={
                      recorder.phase === "paused"
                        ? copy.record.resume
                        : copy.record.pause
                    }
                    variant="secondary"
                    loading={recorder.busy}
                    onPress={() => {
                      void (recorder.phase === "paused"
                        ? recorder.resumeRecording()
                        : recorder.pauseRecording());
                    }}
                  />
                  <Button
                    label={copy.record.stop}
                    disabled={recorder.busy}
                    onPress={() => {
                      void triggerRecordStopHaptic();
                      void recorder.stopRecording();
                    }}
                  />
                </>
              ) : recorder.phase === "stopped" ? (
                recorder.isTooShort || !recorder.audioUri ? (
                  <>
                    <Text
                      accessibilityRole="alert"
                      className="text-body text-ink dark:text-ink-dark"
                    >
                      {copy.record.tooShort}
                    </Text>
                    <Button
                      label={copy.common.rerecord}
                      loading={recorder.busy}
                      onPress={() => {
                        void recorder.resetRecorder();
                      }}
                    />
                  </>
                ) : (
                  <AudioPreview
                    uri={recorder.audioUri}
                    busy={recorder.busy}
                    onRerecord={() => recorder.resetRecorder()}
                    onAnalyze={() => {
                      if (
                        recorder.audioUri &&
                        !recorder.isTooShort &&
                        screening.startAnalysis(
                          recorder.audioUri,
                          child.child.id,
                        )
                      ) {
                        recorder.transferAudioOwnership();
                        router.replace(
                          withScreeningSource("/screening/analyzing", source),
                        );
                        return true;
                      }
                      return false;
                    }}
                  />
                )
              ) : (
                <Button
                  label={copy.record.start}
                  loading={recorder.busy}
                  onPress={() => {
                    void triggerRecordStartHaptic();
                    void recorder.startRecording();
                  }}
                />
              )}
            </View>
          )}
          {recorder.error && (
            <Text
              selectable
              accessibilityRole="alert"
              className="text-body text-ink dark:text-ink-dark"
            >
              {recorder.error}
            </Text>
          )}
          <Button
            label={copy.common.cancel}
            variant="ghost"
            disabled={recorder.busy}
            onPress={() => {
              void actionGate.navigate(async () => {
                if (
                  (await recorder.cancelRecording()) &&
                  (await screening.clearSession())
                ) {
                  if (source === "monitoring" && !router.canGoBack()) {
                    router.dismissTo(originHrefForSource(source));
                  } else {
                    router.replace(
                      withScreeningSource("/screening/guide", source),
                    );
                  }
                  return true;
                }
                return false;
              });
            }}
          />
        </>
      )}
    </Screen>
  );
}
