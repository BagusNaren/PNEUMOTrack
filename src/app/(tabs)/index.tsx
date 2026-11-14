import { UI, Spacing } from "@/constants/theme";
import { Badge } from "@/components/ui/badge";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArticleRow } from "@/components/ui/article-row";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Icon } from "@/components/ui/icon";
import { LoadingState } from "@/components/ui/loading-state";
import { copy } from "@/constants/copy";
import { Config } from "@/constants/config";
import { useActiveChild } from "@/hooks/use-active-child";
import { useProfile } from "@/hooks/use-profile";
import { useResource } from "@/hooks/use-resource";
import { articlesService } from "@/services/articles";
import { screeningsService } from "@/services/screenings";
import { formatDate, formatDuration } from "@/utils/format";

function formatChildAge(birthDateStr: string): string {
  const birth = new Date(birthDateStr);
  if (Number.isNaN(birth.getTime())) return birthDateStr;
  const now = new Date();
  const totalMonths = Math.max(
    0,
    (now.getFullYear() - birth.getFullYear()) * 12 +
      (now.getMonth() - birth.getMonth()),
  );
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  if (years > 0 && months > 0) return copy.children.ageYearsMonths(years, months);
  if (years > 0) return copy.children.ageYears(years);
  return copy.children.ageMonths(months);
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="gap-0.5">
      <Text className="text-caption text-ink-muted">{label}</Text>
      <Text className="text-label font-semibold text-ink">{value}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { profile, isReady: profileReady } = useProfile();
  const { activeChild, children, setActiveChild, isLoading, error, refresh } =
    useActiveChild();
  const [showChildPicker, setShowChildPicker] = useState(false);
  const childId = activeChild?.id;
  const latest = useResource(
    useCallback(
      () =>
        childId ? screeningsService.latest(childId) : Promise.resolve(null),
      [childId],
    ),
  );
  const articles = useResource(useCallback(() => articlesService.list(), []));
  const screening = latest.data;
  const risk = screening?.result === "risk";
  const name = profile.fullName.trim().split(/\s+/)[0];
  const sexLabel =
    activeChild?.sex === "male" ? copy.children.sexMale : copy.children.sexFemale;
  const ctaLabel = risk
    ? copy.dashboard.viewRecommendation
    : copy.dashboard.recordButton;

  const handleCta = () => {
    if (risk && screening) {
      router.push({
        pathname: "/recommendation",
        params: { screeningId: screening.id },
      });
      return;
    }
    router.push("/screening/guide");
  };

  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentContainerStyle={{
        paddingTop: insets.top + UI.gap,
        paddingBottom: Spacing.four,
        paddingHorizontal: UI.gutter,
      }}
      refreshControl={
        <RefreshControl
          refreshing={latest.isRefreshing || articles.isRefreshing}
          onRefresh={() => {
            void refresh();
            void latest.reload();
            void articles.reload();
          }}
        />
      }
    >
      <View className="w-full max-w-content self-center gap-6">
        <View className="flex-row items-center gap-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.profile.editProfile}
            onPress={() => router.push("/profile/edit")}
            className="active:opacity-80"
          >
            <Avatar
              name={profile.fullName || "Bunda"}
              source={
                profile.avatarUri ? { uri: profile.avatarUri } : undefined
              }
              size="md"
              accessibilityLabel={copy.profile.photo}
            />
          </Pressable>
          <View className="min-w-0 flex-1 gap-1">
            <View className="flex-row flex-wrap items-center justify-between gap-2">
              <Text
                accessibilityRole="header"
                className="text-title font-bold text-ink"
              >
                {copy.dashboard.greeting}
                {name ? `, ${name}` : ""}
              </Text>
              {Config.useMockData && (
                <Badge variant="muted" label={copy.screening.simulationMode} />
              )}
            </View>
            <Text className="text-body text-ink-muted">
              {risk ? copy.dashboard.subtitleRisk : copy.dashboard.subtitle}
            </Text>
          </View>
        </View>

        {isLoading ? (
          <LoadingState label={copy.guide.childLoading} />
        ) : error ? (
          <ErrorState
            description={copy.common.loadFailed}
            onAction={() => void refresh()}
          />
        ) : !activeChild ? (
          <EmptyState
            title={copy.dashboard.noChildTitle}
            body={copy.dashboard.noChildBody}
            actionLabel={copy.dashboard.addChildButton}
            onAction={() => router.push("/children/new")}
          />
        ) : (
          <View className="gap-4">
            <Card variant={risk ? "risk" : "brand"} className="gap-3 p-4">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={copy.dashboard.chooseChild}
                accessibilityState={{ expanded: showChildPicker }}
                onPress={() => setShowChildPicker(!showChildPicker)}
                className="min-h-12 flex-row items-center gap-3 active:opacity-80"
              >
                <Avatar
                  size="lg"
                  name={activeChild.name}
                  accessibilityLabel={copy.children.avatarLabel(
                    activeChild.name,
                  )}
                />
                <View className="min-w-0 flex-1 gap-1">
                  <View className="flex-row flex-wrap items-center gap-2">
                    <Text className="text-title font-bold text-ink">
                      {activeChild.name}
                    </Text>
                    <View className="rounded-pill bg-surface px-2.5 py-0.5">
                      <Text className="text-caption font-semibold text-brand">
                        {formatChildAge(activeChild.birth_date)}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-caption text-ink-muted">{sexLabel}</Text>
                </View>
                <View className="h-10 w-10 items-center justify-center rounded-full bg-surface">
                  <Icon
                    name={showChildPicker ? "chevronUp" : "chevronDown"}
                    tone="brand"
                    size={UI.iconMd}
                  />
                </View>
              </Pressable>

              <View className="flex-row items-start gap-2">
                <Icon
                  name={screening ? (risk ? "warning" : "check") : "history"}
                  tone={risk ? "risk" : screening ? "safe" : "muted"}
                  size={UI.iconMd}
                />
                <Text
                  className={`flex-1 text-label font-semibold ${
                    risk
                      ? "text-risk"
                      : screening
                        ? "text-brand"
                        : "text-ink-muted"
                  }`}
                >
                  {screening
                    ? risk
                      ? copy.dashboard.riskStatus
                      : copy.dashboard.normalStatus
                    : copy.dashboard.noScreeningYet}
                </Text>
              </View>
            </Card>

            {showChildPicker && (
              <Card variant="soft" className="gap-1">
                {children.map((child) => (
                  <Pressable
                    key={child.id}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: child.id === childId }}
                    onPress={() => {
                      setActiveChild(child);
                      setShowChildPicker(false);
                    }}
                    className="min-h-12 flex-row items-center gap-3 py-2 active:opacity-80"
                  >
                    <Avatar size="sm" name={child.name} />
                    <Text className="min-w-0 flex-1 text-body text-ink">
                      {child.name}
                    </Text>
                    {child.id === childId && <Icon name="check" tone="brand" />}
                  </Pressable>
                ))}
                <Button
                  label={copy.children.addButton}
                  variant="secondary"
                  onPress={() => {
                    setShowChildPicker(false);
                    router.push("/children/new");
                  }}
                />
              </Card>
            )}

            <Card variant={risk ? "risk" : "brand"} className="gap-4 p-4">
              <View className="flex-row items-center justify-between gap-2">
                <Text
                  className={`text-label font-semibold ${
                    risk ? "text-risk" : "text-brand"
                  }`}
                >
                  {copy.dashboard.sectionStatus}
                </Text>
              </View>

              {screening ? (
                <View className="flex-row flex-wrap">
                  <View className="w-1/2 pb-3 pr-2">
                    <InfoRow
                      label="Durasi rekaman"
                      value={formatDuration(screening.duration_sec)}
                    />
                  </View>
                  <View className="w-1/2 pb-3 pl-2">
                    <InfoRow
                      label="Segmen batuk"
                      value={`${screening.chunks} bagian`}
                    />
                  </View>
                  <View className="w-1/2 pr-2">
                    <InfoRow
                      label="Tanggal"
                      value={formatDate(screening.created_at, true)}
                    />
                  </View>
                  <View className="w-1/2 pl-2">
                    <InfoRow label="Metode" value="Analisis audio batuk" />
                  </View>
                </View>
              ) : (
                <View className="gap-1">
                  <Text className="text-label font-semibold text-ink">
                    {copy.dashboard.noScreeningYet}
                  </Text>
                  <Text className="text-caption text-ink-muted">
                    Rekam batuk untuk melihat hasil skrining.
                  </Text>
                </View>
              )}

              <View className="flex-row flex-wrap gap-2">
                <Button
                  label={ctaLabel}
                  variant={risk ? "risk" : "primary"}
                  onPress={handleCta}
                  className="flex-1"
                />
                {screening ? (
                  <Button
                    label={copy.dashboard.viewDetail}
                    variant="secondary"
                    onPress={() =>
                      router.push({
                        pathname: "/history/[id]",
                        params: { id: screening.id },
                      })
                    }
                    className="flex-1"
                  />
                ) : null}
              </View>
            </Card>

            {latest.isLoading ? <LoadingState /> : null}
            {latest.error ? (
              <ErrorState
                description={copy.common.loadFailed}
                onAction={() => void latest.reload()}
              />
            ) : null}
          </View>
        )}

        {profileReady && !profile.avatarUri ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.profile.completeTitle}
            onPress={() => router.push("/profile/edit")}
            className="active:opacity-80"
          >
            <Card variant="soft" className="flex-row items-center gap-3">
              <Avatar name={profile.fullName || "Bunda"} size="md" />
              <View className="min-w-0 flex-1 gap-0.5">
                <Text className="text-label font-semibold text-ink">
                  {copy.profile.completeTitle}
                </Text>
                <Text className="text-caption text-ink-muted">
                  {copy.profile.completeBody}
                </Text>
              </View>
              <Icon name="chevronRight" tone="brand" />
            </Card>
          </Pressable>
        ) : null}

        <View className="gap-3">
          <View className="flex-row flex-wrap items-center justify-between gap-2">
            <Text
              accessibilityRole="header"
              className="text-subtitle font-semibold text-ink"
            >
              {copy.dashboard.sectionArticles}
            </Text>
            <Button
              label={copy.common.seeAll}
              variant="ghost"
              onPress={() => router.push("/articles")}
            />
          </View>
          {articles.isLoading ? (
            <LoadingState />
          ) : (
            <>
              {articles.error && (
                <ErrorState
                  title={copy.dashboard.articlesError}
                  description={copy.common.loadFailed}
                  onAction={() => void articles.reload()}
                />
              )}
              {articles.data?.length
                ? articles.data
                    .slice(0, 3)
                    .map((article) => (
                      <ArticleRow key={article.id} article={article} />
                    ))
                : !articles.error && (
                    <EmptyState
                      title={copy.dashboard.articlesEmpty}
                      body={copy.dashboard.articlesEmptyBody}
                    />
                  )}
            </>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
