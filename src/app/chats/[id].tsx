import { UI, Spacing } from "@/constants/theme";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useRef, useState, type ComponentRef } from "react";
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Icon } from "@/components/ui/icon";
import { LoadingState } from "@/components/ui/loading-state";
import { ScreenHeader } from "@/components/ui/screen-header";
import { copy } from "@/constants/copy";
import { useConversation } from "@/hooks/use-conversation";
import { useResource } from "@/hooks/use-resource";
import { useSession } from "@/hooks/use-session";
import { useTheme } from "@/hooks/use-theme";
import { doctorsService } from "@/services/doctors";
import { formatDate } from "@/utils/format";

export default function ChatRoomScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { user } = useSession();
  const { id } = useLocalSearchParams<{ id: string }>();
  const doctor = useResource(
    useCallback(
      () => (id ? doctorsService.get(id) : Promise.resolve(null)),
      [id],
    ),
  );
  const chat = useConversation(user?.id ?? "user-demo", id);
  const [input, setInput] = useState("");
  const [callFailed, setCallFailed] = useState(false);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const call = async () => {
    setCallFailed(false);
    try {
      await Linking.openURL(`tel:${doctor.data?.phone}`);
    } catch {
      setCallFailed(true);
    }
  };
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-surface"
      style={{ paddingTop: insets.top }}
    >
      <View className="px-4">
        <ScreenHeader title={doctor.data?.name ?? copy.chats.title} rightAction={doctor.data?.phone ? <Pressable accessibilityRole="button" accessibilityLabel={copy.chats.call} onPress={() => void call()} className="min-h-12 min-w-12 items-center justify-center rounded-full active:opacity-70"><Icon name="phone" tone="brand" /></Pressable> : undefined} />
      </View>
      <ScrollView
        ref={scroll}
        contentContainerStyle={{
          paddingHorizontal: UI.gutter,
          paddingBottom: Spacing.four,
          gap: Spacing.three,
        }}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() =>
          scroll.current?.scrollToEnd({ animated: false })
        }
      >
        {(doctor.isLoading || chat.isLoading) && <LoadingState />}
        {doctor.error && (
          <ErrorState
            description={copy.common.loadFailed}
            onAction={() => void doctor.reload()}
          />
        )}
        {chat.error && (
          <ErrorState
            description={copy.common.loadFailed}
            onAction={() => void chat.reload()}
          />
        )}
        {!doctor.isLoading && !doctor.error && !doctor.data && (
          <EmptyState
            title={copy.care.noDoctor}
            body={copy.care.noDoctorBody}
          />
        )}
        {!chat.isLoading && !chat.error && !chat.data?.messages.length && (
          <EmptyState
            title={copy.chats.noMessage}
            body={copy.chats.emptyBody}
          />
        )}
        {chat.data?.messages.map((message) => (
          <View
            key={message.id}
            className={`max-w-[78%] gap-1 rounded-card px-4 py-3 ${message.sender_role === "parent" ? "self-end bg-brand" : "self-start bg-surface-brand"}`}
          >
            <Text
              selectable
              className={`text-body ${message.sender_role === "parent" ? "text-on-brand" : "text-ink"}`}
            >
              {message.content}
            </Text>
            <Text
              className={`text-caption ${message.sender_role === "parent" ? "text-on-brand" : "text-ink-muted"}`}
            >
              {formatDate(message.created_at, true)}
            </Text>
          </View>
        ))}
        {callFailed && (
          <Text accessibilityRole="alert" className="text-body text-risk">
            {copy.chats.callError}
          </Text>
        )}
      </ScrollView>
      <View
        style={{ paddingBottom: insets.bottom + UI.gap }}
        className="gap-2 border-t border-subtle bg-surface px-4 pt-2.5"
      >
        {chat.sendFailed && (
          <Text accessibilityRole="alert" className="text-label text-risk">
            {copy.chats.sendError}
          </Text>
        )}
        <View className="flex-row items-end gap-2">
        <TextInput
          accessibilityLabel={copy.chats.input}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={2000}
          placeholder={copy.chats.input}
          placeholderTextColor={theme.inkMuted}
          className="min-w-0 flex-1 min-h-12 max-h-28 rounded-2xl border border-border bg-surface-muted px-4 py-2.5 text-body text-ink"
        />
        <Button
          className="px-5"
          label={copy.chats.send}
          loading={chat.sending}
          disabled={
            !input.trim() || !doctor.data || chat.isLoading || chat.error
          }
          onPress={async () => {
            const draft = input;
            if (await chat.send(draft))
              setInput((current) => (current === draft ? "" : current));
          }}
        />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
