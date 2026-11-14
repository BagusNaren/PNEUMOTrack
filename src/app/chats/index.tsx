import { UI, Spacing } from "@/constants/theme";
import { ListRow } from "@/components/ui/list-row";
import { router } from "expo-router";
import { useCallback } from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { ScreenHeader } from "@/components/ui/screen-header";
import { copy } from "@/constants/copy";
import { useResource } from "@/hooks/use-resource";
import { useSession } from "@/hooks/use-session";
import { chatService } from "@/services/chat";
import { formatDate } from "@/utils/format";

export default function ChatsListScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useSession();
  const parentId = user?.id ?? "user-demo";
  const chats = useResource(
    useCallback(() => chatService.listConversations(parentId), [parentId]),
  );
  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      <FlatList
        className="w-full max-w-content flex-1 self-center"
        data={chats.data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: UI.gutter,
          paddingBottom: Spacing.four,
        }}
        refreshControl={
          <RefreshControl
            refreshing={chats.isRefreshing}
            onRefresh={() => void chats.reload()}
          />
        }
        ListHeaderComponent={
          <>
            <ScreenHeader title={copy.chats.title} />
            {chats.error && (
              <ErrorState
                description={copy.common.loadFailed}
                onAction={() => void chats.reload()}
              />
            )}
          </>
        }
        ListEmptyComponent={
          chats.isLoading ? (
            <LoadingState />
          ) : chats.error ? undefined : (
            <EmptyState
              title={copy.chats.emptyTitle}
              body={copy.chats.emptyBody}
            />
          )
        }
        renderItem={({ item }) => (
          <ListRow
            title={item.doctor?.name ?? copy.chats.doctorUnknown}
            subtitle={item.last_message?.content ?? copy.chats.noMessage}
            leading={
              <Avatar
                size="md"
                name={item.doctor?.name}
                source={
                  item.doctor?.photo_url
                    ? { uri: item.doctor.photo_url }
                    : undefined
                }
              />
            }
            trailing={
              <View className="items-end gap-2">
                {item.last_message && (
                  <Text className="text-caption text-ink-muted">
                    {formatDate(item.last_message.created_at)}
                  </Text>
                )}
                {(item.unread_count ?? 0) > 0 && (
                  <View className="h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5">
                    <Text className="text-caption font-bold text-on-brand">
                      {item.unread_count}
                    </Text>
                  </View>
                )}
              </View>
            }
            onPress={() =>
              router.push({
                pathname: "/chats/[id]",
                params: { id: item.doctor_id },
              })
            }
          />
        )}
      />
      <View
        style={{ paddingBottom: insets.bottom + Spacing.three }}
        className="w-full max-w-content self-center px-5"
      >
        <Button
          label={copy.care.consult}
          onPress={() => router.push("/doctors")}
        />
      </View>
    </View>
  );
}
