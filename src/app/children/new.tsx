import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { useTheme } from "@/hooks/use-theme";
import { ScreenHeader } from "@/components/ui/screen-header";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { copy } from "@/constants/copy";
import { useActiveChild } from "@/hooks/use-active-child";
import { useSession } from "@/hooks/use-session";
import { childrenService } from "@/services/children";
import type { Sex } from "@/types/domain";

export default function NewChildScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useSession();
  const theme = useTheme();
  const { refresh, setActiveChild } = useActiveChild();

  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [sex, setSex] = useState<Sex>("male");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (isLoading) return;
    if (!user) {
      router.replace('/(auth)/sign-in');
      return;
    }
    if (!name.trim()) {
      Alert.alert(copy.common.errorTitle, copy.children.nameRequired);
      return;
    }
    const parsed = new Date(`${birthDate}T00:00:00`);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(birthDate) ||
      Number.isNaN(parsed.getTime()) ||
      parsed > new Date() ||
      parsed.getFullYear() !== Number(birthDate.slice(0, 4)) ||
      parsed.getMonth() + 1 !== Number(birthDate.slice(5, 7)) ||
      parsed.getDate() !== Number(birthDate.slice(8, 10))
    ) {
      Alert.alert(copy.common.errorTitle, copy.children.dateRequired);
      return;
    }

    setIsLoading(true);
    try {
      const parentId = user.id;
      const created = await childrenService.create(parentId, {
        name: name.trim(),
        birth_date: birthDate,
        sex,
      });

      await refresh();
      setActiveChild(created);
      Alert.alert(copy.common.save, copy.children.saved, [
        { text: copy.common.confirm, onPress: () => router.back() },
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : copy.children.saveFailed;
      Alert.alert(copy.common.errorTitle, msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-surface dark:bg-surface-dark"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 20,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title={copy.children.addTitle} />

        <View className="items-center my-6">
          <Avatar
            name={name}
            accessibilityLabel={copy.children.avatarLabel(name)}
          />
        </View>

        <View className="gap-5">
          <View className="gap-1.5">
            <Text className="text-label font-bold text-ink dark:text-ink-dark">
              {copy.children.nameLabel} *
            </Text>
            <TextInput
              accessibilityLabel={copy.children.nameLabel}
              className="min-h-12 rounded-xl border border-border bg-surface px-4 py-3 text-body text-ink"
              placeholder={copy.children.namePlaceholder}
              placeholderTextColor={theme.inkMuted}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View className="gap-1.5">
            <Text className="text-label font-bold text-ink dark:text-ink-dark">
              {copy.children.birthDateLabel} (YYYY-MM-DD)
            </Text>
            <TextInput
              accessibilityLabel={copy.children.birthDateLabel}
              className="min-h-12 rounded-xl border border-border bg-surface px-4 py-3 text-body text-ink"
              placeholder={copy.children.dateHint}
              placeholderTextColor={theme.inkMuted}
              value={birthDate}
              onChangeText={setBirthDate}
            />
          </View>

          <View className="gap-1.5">
            <Text className="text-label font-bold text-ink dark:text-ink-dark">
              {copy.children.sexLabel}
            </Text>
            <SegmentedTabs
              options={[
                { key: "male", label: copy.children.sexMale },
                { key: "female", label: copy.children.sexFemale },
              ]}
              value={sex}
              onChange={(v) => setSex(v as Sex)}
            />
          </View>
        </View>

        <View className="mt-10">
          <Button
            label={copy.common.save}
            size="lg"
            isLoading={isLoading}
            onPress={handleSave}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
