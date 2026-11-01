import { router } from "expo-router";
import { useCallback } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
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
        data={chats.data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
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
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: "/chats/[id]",
                params: { id: item.doctor_id },
              })
            }
            className="min-h-12 flex-row items-center gap-3 border-b border-border/40 py-4 active:opacity-70"
          >
            <Avatar
              name={item.doctor?.name}
              source={
                item.doctor?.photo_url
                  ? { uri: item.doctor.photo_url }
                  : undefined
              }
            />
            <View className="min-w-0 flex-1 gap-1">
              <Text className="text-body font-semibold text-ink">
                {item.doctor?.name ?? copy.chats.doctorUnknown}
              </Text>
              <Text numberOfLines={2} className="text-label text-ink-muted">
                {item.last_message?.content ?? copy.chats.noMessage}
              </Text>
              {item.last_message && (
                <Text className="text-caption text-ink-muted">
                  {formatDate(item.last_message.created_at, true)}
                </Text>
              )}
            </View>
          </Pressable>
        )}
      />
      <View style={{ paddingBottom: insets.bottom + 16 }} className="px-5">
        <Button
          label={copy.care.consult}
          onPress={() => router.push("/doctors")}
        />
      </View>
    </View>
  );
}
