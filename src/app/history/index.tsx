import { UI, Spacing } from "@/constants/theme";
import { ListRow } from "@/components/ui/list-row";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { router } from "expo-router";
import { useCallback } from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";
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
        className="w-full max-w-content flex-1 self-center"
        data={isLoading || error ? [] : (history.data ?? [])}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: UI.gutter,
          paddingBottom: Spacing.four,
        }}
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
          <ListRow
            onPress={() =>
              router.push({ pathname: "/history/[id]", params: { id: item.id } })
            }
            title={formatDate(item.created_at, true)}
            subtitle={formatDuration(item.duration_sec)}
            leading={
              <View
                className={`h-9 w-9 items-center justify-center rounded-full ${item.result === "risk" ? "bg-risk-surface" : "bg-surface-safe"}`}
              >
                <Icon
                  name={item.result === "risk" ? "warning" : "check"}
                  tone={item.result === "risk" ? "risk" : "safe"}
                />
              </View>
            }
            trailing={<Badge variant={item.result} />}
          />
        )}
      />
      <View className="w-full max-w-content self-center px-5 pb-4">
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
