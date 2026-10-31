import { router, useLocalSearchParams } from "expo-router";
import { Text } from "react-native";
import { ResultView } from "@/components/screening/result-view";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Screen } from "@/components/ui/screen";
import { ScreenHeader } from "@/components/ui/screen-header";
import { copy } from "@/constants/copy";
import { useScreening } from "@/hooks/use-screening";
import { useSingleFlight } from "@/hooks/use-single-flight";
import {
  originHrefForSource,
  parseScreeningSource,
  withScreeningSource,
} from "@/services/api/screening-source";

export default function ResultScreen() {
  const { source: rawSource } = useLocalSearchParams<{
    source?: string | string[];
  }>();
  const source = parseScreeningSource(rawSource);
  const { lastResult, saveStatus, isDemo, retrySave, clearSession } =
    useScreening();
  const actionGate = useSingleFlight();
  function goHome() {
    void actionGate.navigate(async () => {
      if (await clearSession()) {
        router.dismissTo("/(tabs)");
        return true;
      }
      return false;
    });
  }
  function rerecord() {
    void actionGate.navigate(async () => {
      if (await clearSession()) {
        router.replace(withScreeningSource("/screening/guide", source));
        return true;
      }
      return false;
    });
  }
  return (
    <Screen>
      <ScreenHeader
        title={copy.result.title}
        onBack={() => {
          void actionGate.navigate(async () => {
            if (source === "monitoring") {
              if (await clearSession()) {
                router.dismissTo(originHrefForSource(source));
                return true;
              }
              return false;
            }
            if (router.canGoBack()) {
              router.back();
              return true;
            }
            if (await clearSession()) {
              router.dismissTo("/(tabs)");
              return true;
            }
            return false;
          });
        }}
      />
      {lastResult ? (
        <>
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
          {saveStatus === "saving" && (
            <Card variant="soft">
              <Text
                accessibilityLiveRegion="polite"
                className="text-body text-ink dark:text-ink-dark"
              >
                {copy.result.savingHistory}
              </Text>
            </Card>
          )}
          {saveStatus === "saved" && (
            <Card variant="soft">
              <Text
                accessibilityLiveRegion="polite"
                className="text-body text-ink dark:text-ink-dark"
              >
                {copy.result.savedHistory}
              </Text>
            </Card>
          )}
          {saveStatus === "save_failed" && (
            <Card variant="soft">
              <Text
                accessibilityRole="alert"
                className="text-label font-semibold text-ink dark:text-ink-dark"
              >
                {copy.result.saveFailedTitle}
              </Text>
              <Text className="text-body text-ink-muted dark:text-ink-dark-muted">
                {copy.result.saveFailedBody}
              </Text>
              <Button
                label={copy.result.retrySave}
                variant="secondary"
                onPress={() => {
                  void actionGate.run(() => {
                    retrySave();
                  });
                }}
              />
            </Card>
          )}
          <ResultView result={lastResult} onRerecord={rerecord} />
          {lastResult.result === "risk" && (
            <Button
              label={copy.result.recommendation}
              variant="risk"
              onPress={() => {
                void actionGate.navigate(() => {
                  router.push("/recommendation");
                });
              }}
            />
          )}
          <Button
            label={copy.common.home}
            variant={lastResult.result === "normal" ? "primary" : "secondary"}
            onPress={goHome}
          />
          {lastResult.result === "normal" && (
            <Button
              label={copy.result.history}
              variant="secondary"
              onPress={() => {
                void actionGate.navigate(async () => {
                  if (await clearSession()) {
                    router.dismissTo("/(tabs)/history");
                    return true;
                  }
                  return false;
                });
              }}
            />
          )}
        </>
      ) : (
        <EmptyState
          title={copy.result.emptyTitle}
          description={copy.result.emptyBody}
          actionLabel={copy.analyzing.guide}
          onAction={() => {
            void actionGate.navigate(() => {
              router.replace(withScreeningSource("/screening/guide", source));
            });
          }}
        />
      )}
    </Screen>
  );
}
