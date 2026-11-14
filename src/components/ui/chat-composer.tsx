import { Alert, Pressable, TextInput, View } from "react-native";

import { Icon } from "@/components/ui/icon";
import { copy } from "@/constants/copy";
import { UI } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export function ChatComposer({
  value,
  onChangeText,
  onSend,
  sending = false,
  disabled = false,
}: {
  value: string;
  onChangeText: (value: string) => void;
  onSend: () => void;
  sending?: boolean;
  disabled?: boolean;
}) {
  const theme = useTheme();
  const blocked = disabled || sending || !value.trim();

  const showComingSoon = () =>
    Alert.alert(copy.chats.comingSoonTitle, copy.chats.comingSoonBody);

  return (
    <View className="flex-row items-center gap-2">
      <View className="min-h-14 flex-1 flex-row items-center gap-1 rounded-pill border border-border bg-surface-muted px-2 py-1.5">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.chats.attach}
          onPress={showComingSoon}
          className="h-10 w-10 items-center justify-center rounded-full active:opacity-70"
        >
          <Icon name="add" tone="brand" size={UI.iconMd} />
        </Pressable>
        <TextInput
          accessibilityLabel={copy.chats.input}
          value={value}
          onChangeText={onChangeText}
          multiline
          maxLength={2000}
          placeholder={copy.chats.input}
          placeholderTextColor={theme.inkMuted}
          className="max-h-24 min-w-0 flex-1 py-1 text-body text-ink"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.chats.voice}
          onPress={showComingSoon}
          className="h-10 w-10 items-center justify-center rounded-full active:opacity-70"
        >
          <Icon name="mic" tone="brand" size={UI.iconMd} />
        </Pressable>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={copy.chats.send}
        accessibilityState={{ disabled: blocked, busy: sending }}
        disabled={blocked}
        onPress={onSend}
        className={`h-12 w-12 items-center justify-center rounded-full active:opacity-80 ${
          blocked ? "bg-surface-muted" : "bg-brand"
        }`}
      >
        <Icon
          name="send"
          tone={blocked ? "muted" : "onBrand"}
          size={UI.iconMd}
        />
      </Pressable>
    </View>
  );
}
