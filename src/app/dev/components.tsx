import { Redirect, router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Collapsible } from "@/components/ui/collapsible";
import { DangerSignsBox } from "@/components/ui/danger-signs-box";
import { Disclaimer } from "@/components/ui/disclaimer";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { MenuSheet } from "@/components/ui/menu-sheet";
import { Screen } from "@/components/ui/screen";
import { ScreenHeader } from "@/components/ui/screen-header";
import { StatusBanner } from "@/components/ui/status-banner";
import { Waveform } from "@/components/ui/waveform";
import { copy } from "@/constants/copy";
import { devSaveModes, useScreening } from "@/hooks/use-screening";
import { useSingleFlight } from "@/hooks/use-single-flight";
import { mockScenarios } from "@/services/api/screening.mock";

const samples = [
  0.04, 0.08, 0.12, 0.4, 0.8, 1, 0.72, 0.2, 0.1, 0.4, 0.6, 0.88, 0.5, 0.22,
  0.04, 0.1,
];
const routes = [
  { label: copy.nav.home, href: "/(tabs)" },
  { label: copy.nav.history, href: "/(tabs)/history" },
  { label: copy.nav.children, href: "/(tabs)/children" },
  { label: copy.nav.monitoring, href: "/(tabs)/monitoring" },
  { label: copy.nav.more, href: "/(tabs)/more" },
  { label: copy.placeholder.signIn, href: "/sign-in" },
  { label: copy.placeholder.signUp, href: "/sign-up" },
  { label: copy.placeholder.newChild, href: "/children/new" },
  { label: copy.placeholder.historyDetail, href: "/history/preview" },
  { label: copy.guide.title, href: "/screening/guide" },
  {
    label: copy.placeholder.guideFromMonitoring,
    href: "/screening/guide?source=monitoring",
  },
  { label: copy.record.title, href: "/screening/record" },
  {
    label: copy.placeholder.recordFromMonitoring,
    href: "/screening/record?source=monitoring",
  },
  { label: copy.analyzing.progress, href: "/screening/analyzing" },
  { label: copy.result.title, href: "/screening/result" },
  { label: copy.recommendation.title, href: "/recommendation" },
  { label: copy.placeholder.doctors, href: "/doctors" },
  { label: copy.placeholder.doctorDetail, href: "/doctors/preview" },
  { label: copy.placeholder.chats, href: "/chats" },
  { label: copy.placeholder.chatDetail, href: "/chats/preview" },
  { label: copy.placeholder.hospitals, href: "/hospitals" },
  { label: copy.placeholder.map, href: "/hospitals/map" },
  { label: copy.nav.articles, href: "/articles" },
  { label: copy.placeholder.articleDetail, href: "/articles/preview" },
] as const;

function SectionTitle({ children }: { children: string }) {
  return (
    <Text
      accessibilityRole="header"
      className="text-subtitle font-semibold text-ink dark:text-ink-dark"
    >
      {children}
    </Text>
  );
}

function ComponentGallery() {
  const screening = useScreening();
  const actionGate = useSingleFlight();
  const [message, setMessage] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <>
      <Screen>
        <ScreenHeader
          title={copy.gallery.title}
          subtitle={copy.common.appName}
        />
        <Text className="text-body text-ink-muted dark:text-ink-dark-muted">
          {copy.gallery.description}
        </Text>
        <View className="gap-3">
          <SectionTitle>{copy.gallery.scenarios}</SectionTitle>
          <Text className="text-body text-ink-muted dark:text-ink-dark-muted">
            {copy.gallery.scenarioHint}
          </Text>
          {mockScenarios.map((scenario) => (
            <Button
              key={scenario}
              label={copy.screening.scenarios[scenario]}
              variant={
                screening.devMockScenario === scenario ? "primary" : "secondary"
              }
              accessibilityState={{
                selected: screening.devMockScenario === scenario,
              }}
              onPress={() => screening.setDevMockScenario(scenario)}
            />
          ))}
          <Text
            accessibilityLiveRegion="polite"
            className="text-body text-ink dark:text-ink-dark"
          >
            {copy.gallery.selectedScenario}:{" "}
            {screening.devMockScenario &&
              copy.screening.scenarios[screening.devMockScenario]}
          </Text>
          <SectionTitle>{copy.gallery.saveModeTitle}</SectionTitle>
          {devSaveModes.map((mode) => (
            <Button
              key={mode}
              label={copy.gallery.saveModes[mode]}
              variant={screening.devSaveMode === mode ? "primary" : "secondary"}
              accessibilityState={{
                selected: screening.devSaveMode === mode,
              }}
              onPress={() => screening.setDevSaveMode(mode)}
            />
          ))}
          <Text
            accessibilityLiveRegion="polite"
            className="text-body text-ink dark:text-ink-dark"
          >
            {copy.gallery.selectedSaveMode}:{" "}
            {screening.devSaveMode &&
              copy.gallery.saveModes[screening.devSaveMode]}
          </Text>
          <Button
            label={copy.gallery.runScenario}
            onPress={() => {
              void actionGate.navigate(async () => {
                if (
                  (await screening.clearSession()) &&
                  screening.startDevSimulation()
                ) {
                  router.push("/screening/analyzing");
                  return true;
                }
                return false;
              });
            }}
          />
        </View>
        <View className="gap-3">
          <SectionTitle>{copy.gallery.cards}</SectionTitle>
          {(
            [
              ["default", copy.gallery.cardDefault],
              ["brand", copy.gallery.cardBrand],
              ["soft", copy.gallery.cardSoft],
              ["risk", copy.gallery.cardRisk],
            ] as const
          ).map(([variant, label]) => (
            <Card variant={variant} key={variant}>
              <Text className="text-body text-ink dark:text-ink-dark">
                {label}
              </Text>
            </Card>
          ))}
        </View>
        <View className="gap-3">
          <SectionTitle>{copy.gallery.buttons}</SectionTitle>
          {(
            [
              ["primary", copy.gallery.primary],
              ["secondary", copy.gallery.secondary],
              ["risk", copy.gallery.risk],
              ["ghost", copy.gallery.ghost],
            ] as const
          ).map(([variant, label]) => (
            <Button
              key={variant}
              label={label}
              variant={variant}
              onPress={() => setMessage(`${label}: ${copy.gallery.pressed}`)}
            />
          ))}
          <Button label={copy.gallery.loadingButton} loading />
          <Button label={copy.gallery.disabledButton} disabled />
          <Text
            accessibilityLiveRegion="polite"
            className="min-h-6 text-body text-ink dark:text-ink-dark"
          >
            {message}
          </Text>
          <StatusBanner variant="normal" />
          <StatusBanner variant="risk" />
        </View>
        <View className="gap-3">
          <SectionTitle>{copy.gallery.profiles}</SectionTitle>
          <Avatar
            name={copy.gallery.initials}
            accessibilityLabel={copy.gallery.avatar}
          />
          <Avatar accessibilityLabel={copy.ui.avatarFallback} />
          <Badge variant="normal" />
          <Badge variant="risk" />
          <Badge variant="disagreement" />
        </View>
        <View className="gap-3">
          <SectionTitle>{copy.gallery.audio}</SectionTitle>
          <Text className="text-body text-ink dark:text-ink-dark">
            {copy.gallery.staticAudio}
          </Text>
          <Waveform samples={samples} />
          <Waveform samples={samples} variant="risk" />
          <Text className="text-body text-ink dark:text-ink-dark">
            {copy.gallery.liveAudio}
          </Text>
          <Waveform samples={samples.slice().reverse()} mode="live" />
          <Waveform />
        </View>
        <View className="gap-3">
          <SectionTitle>{copy.gallery.states}</SectionTitle>
          <EmptyState
            title={copy.ui.emptyTitle}
            description={copy.ui.emptyBody}
            actionLabel={copy.placeholder.guideLink}
            onAction={() => router.push("/screening/guide")}
          />
          <LoadingState />
          <ErrorState
            description={copy.networkErrors.offline}
            onAction={() => setMessage(copy.gallery.retryDone)}
          />
          <Text
            accessibilityLiveRegion="polite"
            className="text-body text-ink dark:text-ink-dark"
          >
            {message}
          </Text>
          <Collapsible title={copy.gallery.detailsTitle}>
            <Text className="text-body text-ink dark:text-ink-dark">
              {copy.gallery.details}
            </Text>
          </Collapsible>
          <Button label={copy.gallery.menu} onPress={() => setMenuOpen(true)} />
        </View>
        <View className="gap-3">
          <SectionTitle>{copy.gallery.disclaimer}</SectionTitle>
          <Disclaimer />
          <DangerSignsBox />
          <Text className="text-caption text-ink-muted dark:text-ink-dark-muted">
            {copy.gallery.emergency}
          </Text>
        </View>
        <View className="gap-3">
          <SectionTitle>{copy.gallery.routes}</SectionTitle>
          {routes.map((item) => (
            <Button
              key={item.href}
              label={item.label}
              variant="secondary"
              onPress={() => router.push(item.href)}
            />
          ))}
        </View>
      </Screen>
      <MenuSheet open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}

export default function ComponentsScreen() {
  return __DEV__ ? <ComponentGallery /> : <Redirect href="/" />;
}
