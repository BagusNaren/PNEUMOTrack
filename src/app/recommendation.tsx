import { Image } from "expo-image";
import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Text, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DangerSignsBox } from "@/components/ui/danger-signs-box";
import { Disclaimer } from "@/components/ui/disclaimer";
import { Icon } from "@/components/ui/icon";
import { Screen } from "@/components/ui/screen";
import { ScreenHeader } from "@/components/ui/screen-header";
import { copy } from "@/constants/copy";
import { useScreening } from "@/hooks/use-screening";
import { useSingleFlight } from "@/hooks/use-single-flight";
import { useTheme } from "@/hooks/use-theme";

const timeFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatScreeningTime(isoTimestamp: string | null): string | null {
  if (!isoTimestamp) return null;
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) return null;
  return timeFormatter.format(date);
}

export default function RecommendationScreen() {
  const { lastResult, completedAt, activeChild, isDemo } = useScreening();
  const actionGate = useSingleFlight();
  const theme = useTheme();
  const formattedTime = formatScreeningTime(completedAt);
  const childName =
    activeChild.status === "ready" ? activeChild.child.name : null;

  function goBack() {
    void actionGate.navigate(() => {
      if (router.canGoBack()) {
        router.back();
        return true;
      }
      if (lastResult) {
        router.replace("/screening/result");
        return true;
      }
      router.replace("/(tabs)");
      return true;
    });
  }

  return (
    <Screen>
      <ScreenHeader title={copy.recommendation.title} onBack={goBack} />
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
      <Card variant="risk">
        <View
          accessibilityRole="alert"
          className="flex-row flex-wrap items-center gap-3"
        >
          <View className="h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface dark:bg-surface-card-dark">
            <Icon name="warning" tone="risk" />
          </View>
          <Text className="min-w-0 flex-1 text-subtitle font-semibold text-risk dark:text-risk-light">
            {lastResult
              ? copy.result.riskTitle
              : copy.recommendation.staticBannerTitle}
          </Text>
        </View>
        {lastResult ? (
          <>
            <View className="gap-1">
              {childName && (
                <Text className="text-body font-semibold text-ink dark:text-ink-dark">
                  {`${copy.recommendation.childLabel}: ${childName}`}
                </Text>
              )}
              {formattedTime && (
                <Text className="text-body text-ink dark:text-ink-dark">
                  {`${copy.recommendation.timeLabel}: ${formattedTime}`}
                </Text>
              )}
            </View>
            <Button
              label={copy.recommendation.viewResultDetail}
              variant="secondary"
              onPress={() => {
                void actionGate.navigate(() => {
                  if (router.canGoBack()) {
                    router.back();
                  } else {
                    router.replace("/screening/result");
                  }
                });
              }}
            />
          </>
        ) : (
          <>
            <Text className="text-body text-ink dark:text-ink-dark">
              {copy.recommendation.staticBannerBody}
            </Text>
            <Button
              label={copy.analyzing.guide}
              variant="secondary"
              onPress={() => {
                void actionGate.navigate(() => {
                  router.push("/screening/guide");
                });
              }}
            />
          </>
        )}
      </Card>

      <Card variant="risk">
        <View className="flex-row flex-wrap items-center gap-4">
          <View
            className="items-center justify-center overflow-hidden rounded-card bg-surface dark:bg-surface-card-dark"
            style={{ width: 88, height: 96 }}
          >
            <Image
              source={require("../../UI_reference/image_doctor.png")}
              accessible={false}
              contentFit="contain"
              style={{ width: 88, height: 96 }}
            />
          </View>
          <View className="min-w-[180px] flex-1 gap-2">
            <Text
              accessibilityRole="header"
              className="text-subtitle font-semibold text-risk dark:text-risk-light"
            >
              {copy.recommendation.doctors}
            </Text>
            <Text className="text-body text-ink dark:text-ink-dark">
              {copy.recommendation.doctorsDescription}
            </Text>
          </View>
        </View>
        <Button
          label={copy.recommendation.consult}
          variant="risk"
          onPress={() => {
            void actionGate.navigate(() => {
              router.push("/doctors");
            });
          }}
        />
      </Card>

      <Card variant="risk">
        <View className="flex-row flex-wrap items-center gap-4">
          <View className="min-w-[180px] flex-1 gap-2">
            <Text
              accessibilityRole="header"
              className="text-subtitle font-semibold text-risk dark:text-risk-light"
            >
              {copy.recommendation.hospitals}
            </Text>
            <Text className="text-body text-ink dark:text-ink-dark">
              {copy.recommendation.hospitalsDescription}
            </Text>
          </View>
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            className="items-center justify-center rounded-card bg-surface dark:bg-surface-card-dark"
            style={{ width: 88, height: 88 }}
          >
            <SymbolView
              name={{
                ios: "cross.case.fill",
                android: "local_hospital",
                web: "local_hospital",
              }}
              size={44}
              tintColor={theme.risk}
              style={{ width: 44, height: 44 }}
              accessible={false}
            />
          </View>
        </View>
        <Button
          label={copy.recommendation.findHospital}
          variant="risk"
          onPress={() => {
            void actionGate.navigate(() => {
              router.push("/hospitals");
            });
          }}
        />
      </Card>

      <DangerSignsBox showEmergencyAction />
      <Disclaimer />
    </Screen>
  );
}
