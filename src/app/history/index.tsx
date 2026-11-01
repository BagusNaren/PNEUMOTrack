import { router } from "expo-router";
import { useCallback } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { ScreenHeader } from "@/components/ui/screen-header";
import { copy } from "@/constants/copy";
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
  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      <FlatList
        data={isLoading || error ? [] : (history.data ?? [])}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={history.isRefreshing}
            onRefresh={() => {
              void refresh();
              void history.reload();
            }}
          />
        }
        ListHeaderComponent={
          <>
            <ScreenHeader
              title={copy.history.title}
              subtitle={activeChild?.name}
              showBack={false}
            />
            {(error || history.error) && (
              <ErrorState
                description={copy.common.loadFailed}
                onAction={() => {
                  void refresh();
                  void history.reload();
                }}
              />
            )}
            {!!history.data?.length && (
              <Text className="text-caption text-ink-muted">
                {copy.history.count(history.data.length)}
              </Text>
            )}
          </>
        }
        ListEmptyComponent={
          isLoading || history.isLoading ? (
            <LoadingState />
          ) : error || history.error ? undefined : (
            <EmptyState
              title={
                activeChild ? copy.ui.emptyTitle : copy.children.emptyTitle
              }
              body={activeChild ? copy.ui.emptyBody : copy.children.emptyBody}
            />
          )
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: "/history/[id]",
                params: { id: item.id },
              })
            }
            className="min-h-12 gap-2 border-b border-border/40 py-4 active:opacity-70"
          >
            <Text className="text-body font-semibold text-ink">
              {formatDate(item.created_at, true)}
            </Text>
            <Text
              className={`text-label ${item.result === "risk" ? "text-risk" : "text-brand"}`}
            >
              {item.result === "risk"
                ? copy.dashboard.riskStatus
                : copy.dashboard.normalStatus}
            </Text>
            <Text className="text-caption text-ink-muted">
              {formatDuration(item.duration_sec)}
            </Text>
          </Pressable>
        )}
      />
      <View className="px-5 pb-4">
        <Button
          label={activeChild ? copy.record.start : copy.children.addButton}
          onPress={() =>
            router.push(activeChild ? "/screening/guide" : "/children/new")
          }
        />
      </View>
    </View>
  );
}
