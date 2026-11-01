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
import { HeartGauge } from "@/components/ui/heart-gauge";
import { Icon } from "@/components/ui/icon";
import { LoadingState } from "@/components/ui/loading-state";
import { copy } from "@/constants/copy";
import { Config } from "@/constants/config";
import { useActiveChild } from "@/hooks/use-active-child";
import { useResource } from "@/hooks/use-resource";
import { useSession } from "@/hooks/use-session";
import { articlesService } from "@/services/articles";
import { screeningsService } from "@/services/screenings";
import { formatDate, formatDuration } from "@/utils/format";

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useSession();
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
  const name = user?.user_metadata?.full_name?.trim().split(/\s+/)[0];

  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingBottom: 24,
        paddingHorizontal: 20,
        gap: 24,
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
      <Text
        accessibilityRole="header"
        className="text-title font-bold text-ink"
      >
        {copy.dashboard.greeting}
        {name ? `, ${name}` : ""}
      </Text>
      {Config.useMockData && (
        <Text className="text-caption text-ink-muted">
          {copy.screening.dataDemo}
        </Text>
      )}
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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.dashboard.chooseChild}
            accessibilityState={{ expanded: showChildPicker }}
            onPress={() => setShowChildPicker(!showChildPicker)}
            className="min-h-12 flex-row items-center gap-3 active:opacity-70"
          >
            <Avatar
              name={activeChild.name}
              accessibilityLabel={copy.children.avatarLabel(activeChild.name)}
            />
            <Text className="min-w-0 flex-1 text-subtitle font-semibold text-ink">
              {activeChild.name}
            </Text>
            <Icon
              name={showChildPicker ? "chevronUp" : "chevronDown"}
              tone="brand"
            />
          </Pressable>
          {showChildPicker && (
            <Card variant="soft">
              {children.map((child) => (
                <Pressable
                  key={child.id}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: child.id === childId }}
                  onPress={() => {
                    setActiveChild(child);
                    setShowChildPicker(false);
                  }}
                  className="min-h-12 flex-row items-center gap-3 py-3 active:opacity-70"
                >
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
          {latest.isLoading ? (
            <LoadingState />
          ) : (
            <>
              {latest.error && (
                <ErrorState
                  description={copy.common.loadFailed}
                  onAction={() => void latest.reload()}
                />
              )}
              {screening ? (
                <Card variant={risk ? "risk" : "brand"}>
                  <View className="items-center">
                    <HeartGauge variant={risk ? "risk" : "normal"} size={112} />
                  </View>
                  <Text
                    className={`text-center text-subtitle font-semibold ${risk ? "text-risk" : "text-brand"}`}
                  >
                    {risk
                      ? copy.dashboard.riskStatus
                      : copy.dashboard.normalStatus}
                  </Text>
                  <Text className="text-center text-caption text-ink-muted">
                    {formatDate(screening.created_at, true)} ·{" "}
                    {formatDuration(screening.duration_sec)}
                  </Text>
                  <Button
                    label={
                      risk
                        ? copy.dashboard.viewRecommendation
                        : copy.dashboard.recordButton
                    }
                    variant={risk ? "risk" : "primary"}
                    onPress={() =>
                      router.push(
                        risk
                          ? {
                              pathname: "/recommendation",
                              params: { screeningId: screening.id },
                            }
                          : "/screening/guide",
                      )
                    }
                  />
                  <Button
                    label={copy.dashboard.viewDetail}
                    variant="ghost"
                    onPress={() =>
                      router.push({
                        pathname: "/history/[id]",
                        params: { id: screening.id },
                      })
                    }
                  />
                </Card>
              ) : (
                !latest.error && (
                  <Card variant="brand">
                    <Text className="text-subtitle font-semibold text-ink">
                      {copy.dashboard.noScreeningYet}
                    </Text>
                    <Button
                      label={copy.dashboard.recordButton}
                      onPress={() => router.push("/screening/guide")}
                    />
                  </Card>
                )
              )}
            </>
          )}
        </View>
      )}
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
    </ScrollView>
  );
}
