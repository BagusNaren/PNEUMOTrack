import { useLocalSearchParams } from "expo-router";
import { useCallback, useRef, useState, type ComponentRef } from "react";
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
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
        <ScreenHeader title={doctor.data?.name ?? copy.chats.title} />
      </View>
      <ScrollView
        ref={scroll}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 24,
          gap: 16,
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
            className={`max-w-[90%] gap-1 rounded-card px-4 py-3 ${message.sender_role === "parent" ? "self-end bg-brand" : "self-start bg-surface-brand"}`}
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
        {doctor.data?.phone && (
          <Button
            label={copy.chats.call}
            variant="secondary"
            icon={<Icon name="phone" tone="brand" />}
            onPress={() => void call()}
          />
        )}
        {callFailed && (
          <Text accessibilityRole="alert" className="text-body text-risk">
            {copy.chats.callError}
          </Text>
        )}
      </ScrollView>
      <View
        style={{ paddingBottom: insets.bottom + 12 }}
        className="gap-2 border-t border-border px-5 pt-3"
      >
        {chat.sendFailed && (
          <Text accessibilityRole="alert" className="text-label text-risk">
            {copy.chats.sendError}
          </Text>
        )}
        <Text className="text-label font-semibold text-ink">
          {copy.chats.input}
        </Text>
        <TextInput
          accessibilityLabel={copy.chats.input}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={2000}
          placeholder={copy.chats.input}
          placeholderTextColor={theme.inkMuted}
          className="min-h-12 rounded-xl border border-border px-4 py-3 text-body text-ink"
        />
        <Button
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
    </KeyboardAvoidingView>
  );
}
