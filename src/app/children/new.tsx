import { Icon } from "@/components/ui/icon";
import { Config } from "@/constants/config";
import { UI, Spacing } from "@/constants/theme";
import { router } from "expo-router";
import { useState } from "react";
import {
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
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (isLoading) return;
    const parentId = user?.id ?? (Config.useMockData ? "user-demo" : null);
    if (!parentId) {
      router.replace("/(auth)/sign-in");
      return;
    }
    if (!name.trim()) {
      setError(copy.children.nameRequired);
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
      setError(copy.children.dateRequired);
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const created = await childrenService.create(parentId, {
        name: name.trim(),
        birth_date: birthDate,
        sex,
      });

      await refresh();
      setActiveChild(created);
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/(tabs)/children");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : copy.children.saveFailed;
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-surface"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top,
          paddingBottom: insets.bottom + Spacing.four,
          paddingHorizontal: UI.gutter,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{ maxWidth: UI.maxFormWidth }}
          className="w-full self-center"
        >
          <ScreenHeader title={copy.children.addTitle} />

          <View className="my-6 items-center">
            <Avatar
              size="lg"
              name={name}
              accessibilityLabel={copy.children.avatarLabel(name)}
            />
          </View>

          <View className="gap-5">
            <View className="gap-1.5">
              <Text className="text-label font-bold text-ink">
                {copy.children.nameLabel} *
              </Text>
              <TextInput
                accessibilityLabel={copy.children.nameLabel}
                className={`min-h-12 rounded-xl border bg-surface px-4 py-3 text-body text-ink ${error === copy.children.nameRequired ? "border-risk-border" : "border-border"}`}
                placeholder={copy.children.namePlaceholder}
                placeholderTextColor={theme.inkMuted}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View className="gap-1.5">
              <Text className="text-label font-bold text-ink">
                {copy.children.birthDateLabel} (YYYY-MM-DD)
              </Text>
              <TextInput
                accessibilityLabel={copy.children.birthDateLabel}
                className={`min-h-12 rounded-xl border bg-surface px-4 py-3 text-body text-ink ${error === copy.children.dateRequired ? "border-risk-border" : "border-border"}`}
                placeholder={copy.children.dateHint}
                placeholderTextColor={theme.inkMuted}
                value={birthDate}
                keyboardType="numbers-and-punctuation"
                maxLength={10}
                onChangeText={(value) => {
                  const digits = value.replace(/\D/g, "").slice(0, 8);
                  setBirthDate(
                    [
                      digits.slice(0, 4),
                      digits.slice(4, 6),
                      digits.slice(6, 8),
                    ]
                      .filter(Boolean)
                      .join("-"),
                  );
                }}
              />
            </View>

            <View className="gap-1.5">
              <Text className="text-label font-bold text-ink">
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

          {error && (
            <View
              accessibilityRole="alert"
              className="mt-4 flex-row items-center gap-2 rounded-xl border border-risk-border bg-risk-surface px-4 py-3"
            >
              <Icon name="warning" tone="risk" />
              <Text className="flex-1 text-label text-risk">{error}</Text>
            </View>
          )}
          <View className="mt-10">
            <Button
              label={copy.common.save}
              size="lg"
              isLoading={isLoading}
              onPress={handleSave}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
