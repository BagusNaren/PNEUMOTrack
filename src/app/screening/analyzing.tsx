import { Image } from "expo-image";
import {
  router,
  useFocusEffect,
  useLocalSearchParams,
  usePreventRemove,
} from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import { AnalysisPulse } from "@/components/screening/motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Screen } from "@/components/ui/screen";
import { ScreenHeader } from "@/components/ui/screen-header";
import { copy } from "@/constants/copy";
import { useScreening } from "@/hooks/use-screening";
import { useSingleFlight } from "@/hooks/use-single-flight";
import {
  parseScreeningSource,
  withScreeningSource,
} from "@/services/api/screening-source";

export default function AnalyzingScreen() {
  const { source: rawSource } = useLocalSearchParams<{
    source?: string | string[];
  }>();
  const source = parseScreeningSource(rawSource);
  const {
    status,
    error,
    isDemo,
    retryAnalysis,
    cancelAnalysis,
    clearSession,
    cleanupAnalysisOnLeave,
  } = useScreening();
  const actionGate = useSingleFlight();
  const [confirming, setConfirming] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const working = status === "uploading" || status === "analyzing";
  const disablePrevention = usePreventRemove(working && !leaving, () =>
    setConfirming(true),
  );
  useFocusEffect(
    useCallback(() => cleanupAnalysisOnLeave, [cleanupAnalysisOnLeave]),
  );
  useEffect(() => {
    if (status === "success") {
      void actionGate.navigate(() => {
        router.replace(withScreeningSource("/screening/result", source));
      });
    }
  }, [actionGate, source, status]);

  function leave() {
    void actionGate.navigate(async () => {
      if (await cancelAnalysis()) {
        setLeaving(true);
        disablePrevention();
        router.replace(withScreeningSource("/screening/guide", source));
        return true;
      }
      return false;
    });
  }
  return (
    <Screen>
      <ScreenHeader title={copy.analyzing.title} back={false} />
      {isDemo && (
        <Card variant="soft">
          <Text className="text-label font-semibold text-brand dark:text-brand-light">
            {copy.screening.demo}
          </Text>
          <Text className="text-body text-ink dark:text-ink-dark">
            {copy.screening.demoNotice}
          </Text>
        </Card>
      )}
      {confirming && working ? (
        <Card>
          <Text
            accessibilityRole="alert"
            className="text-subtitle font-semibold text-ink dark:text-ink-dark"
          >
            {copy.analyzing.confirmTitle}
          </Text>
          <Text className="text-body text-ink-muted dark:text-ink-dark-muted">
            {copy.analyzing.confirmBody}
          </Text>
          <Button
            label={copy.analyzing.keep}
            onPress={() => setConfirming(false)}
          />
          <Button
            label={copy.analyzing.cancel}
            variant="secondary"
            onPress={leave}
          />
        </Card>
      ) : working ? (
        <>
          <View className="items-center py-6">
            <AnalysisPulse active={working}>
              <Image
                source={require("../../../UI_reference/logo.png")}
                accessibilityLabel={copy.common.appName}
                contentFit="contain"
                style={{ width: 140, height: 140 }}
              />
            </AnalysisPulse>
          </View>
          <LoadingState
            label={
              status === "uploading"
                ? copy.analyzing.uploading
                : copy.analyzing.processing
            }
          />
          <Text className="text-body text-ink-muted dark:text-ink-dark-muted">
            {copy.analyzing.waiting}
          </Text>
          <Button
            label={copy.analyzing.cancel}
            variant="secondary"
            onPress={() => setConfirming(true)}
          />
        </>
      ) : status === "error" && error ? (
        <>
          <ErrorState
            title={
              error.kind === "audio_validation"
                ? copy.analyzing.audioError
                : copy.analyzing.networkError
            }
            description={error.userMessage}
            actionLabel={
              error.canRetrySameFile ? copy.common.retry : copy.common.rerecord
            }
            onAction={
              error.kind === "unknown"
                ? () => {
                    void actionGate.navigate(async () => {
                      if (await clearSession()) {
                        router.replace(
                          withScreeningSource("/screening/guide", source),
                        );
                        return true;
                      }
                      return false;
                    });
                  }
                : error.canRetrySameFile
                  ? () => {
                      void actionGate.run(() => {
                        setConfirming(false);
                        retryAnalysis();
                      });
                    }
                  : () => {
                      void actionGate.navigate(async () => {
                        if (await clearSession()) {
                          router.replace(
                            withScreeningSource("/screening/record", source),
                          );
                          return true;
                        }
                        return false;
                      });
                    }
            }
          />
          {error.kind === "audio_validation" && (
            <Text className="text-body text-ink-muted dark:text-ink-dark-muted">
              {copy.analyzing.audioTip}
            </Text>
          )}
          {error.canRetrySameFile && (
            <Button
              label={copy.common.rerecord}
              variant="secondary"
              onPress={() => {
                void actionGate.navigate(async () => {
                  if (await clearSession()) {
                    router.replace(
                      withScreeningSource("/screening/record", source),
                    );
                    return true;
                  }
                  return false;
                });
              }}
            />
          )}
          <Button
            label={copy.common.cancel}
            variant="ghost"
            onPress={leave}
          />
        </>
      ) : status !== "success" ? (
        <EmptyState
          title={copy.analyzing.emptyTitle}
          description={copy.analyzing.emptyBody}
          actionLabel={copy.analyzing.guide}
          onAction={() => {
            void actionGate.navigate(() => {
              router.replace(withScreeningSource("/screening/guide", source));
            });
          }}
        />
      ) : (
        <LoadingState label={copy.result.title} />
      )}
    </Screen>
  );
}
