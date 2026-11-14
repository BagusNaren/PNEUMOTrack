import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { Screen } from "@/components/ui/screen";
import { ScreenHeader } from "@/components/ui/screen-header";
import { copy } from "@/constants/copy";
import { Spacing, UI } from "@/constants/theme";
import { useProfile, type LocalProfile } from "@/hooks/use-profile";
import { useSession } from "@/hooks/use-session";
import { useTheme } from "@/hooks/use-theme";
import { persistProfilePhoto } from "@/services/profile-photo";

function ProfileField({
  label,
  value,
  onChangeText,
  placeholder,
  readOnly = false,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  keyboardType?: "default" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
}) {
  const theme = useTheme();
  return (
    <View className="gap-1.5">
      <Text className="text-label font-semibold text-ink dark:text-ink-dark">
        {label}
      </Text>
      <TextInput
        className={`min-h-12 rounded-xl border px-4 py-3 text-body ${
          readOnly
            ? "border-border bg-surface-muted text-ink-muted"
            : "border-border bg-surface text-ink"
        }`}
        placeholder={placeholder}
        placeholderTextColor={theme.inkMuted}
        value={value}
        onChangeText={onChangeText}
        editable={!readOnly}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        accessibilityLabel={label}
      />
    </View>
  );
}

export default function ProfileEditScreen() {
  const { profile, isReady, loadError, retryLoad } = useProfile();
  if (loadError) {
    return (
      <Screen>
        <ScreenHeader title={copy.profile.editTitle} />
        <ErrorState description={copy.profile.loadFailed} onAction={retryLoad} />
      </Screen>
    );
  }
  if (!isReady) {
    return (
      <Screen>
        <ScreenHeader title={copy.profile.editTitle} />
        <LoadingState />
      </Screen>
    );
  }
  return <ProfileEditForm initial={profile} />;
}

function ProfileEditForm({ initial }: { initial: LocalProfile }) {
  const insets = useSafeAreaInsets();
  const { user } = useSession();
  const { updateProfile } = useProfile();
  const [fullName, setFullName] = useState(initial.fullName);
  const [phone, setPhone] = useState(initial.phone);
  const [city, setCity] = useState(initial.city);
  const [avatarUri, setAvatarUri] = useState<string | null>(initial.avatarUri);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (result.canceled) return;
      const uri = result.assets[0]?.uri;
      if (uri) setAvatarUri(uri);
    } catch {
      Alert.alert(copy.profile.photoErrorTitle, copy.profile.photoErrorBody);
    }
  };

  const save = async () => {
    if (saving) return;
    const name = fullName.trim();
    if (!name) {
      setError(copy.profile.nameRequired);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const nextAvatar = await persistProfilePhoto(
        avatarUri,
        user?.id ?? null,
      );
      await updateProfile({
        fullName: name,
        phone: phone.trim(),
        city: city.trim(),
        avatarUri: nextAvatar,
      });
      router.back();
    } catch {
      setError(copy.profile.saveFailed);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-surface dark:bg-surface-dark"
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
        <View className="w-full max-w-content self-center gap-5">
          <ScreenHeader title={copy.profile.editTitle} />
          <Text className="text-body text-ink-muted dark:text-ink-dark-muted">
            {copy.profile.editSubtitle}
          </Text>

          <View className="items-center gap-2">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.profile.changePhoto}
              onPress={pickPhoto}
              className="relative active:opacity-80"
            >
              <Avatar
                name={fullName || copy.more.account}
                source={avatarUri ? { uri: avatarUri } : undefined}
                size="xl"
                accessibilityLabel={copy.profile.photo}
              />
              <View className="absolute -bottom-1 -right-1 h-8 w-8 items-center justify-center rounded-full border-2 border-surface bg-brand">
                <Icon name="camera" tone="onBrand" size={UI.iconSm} />
              </View>
            </Pressable>
            <View className="flex-row flex-wrap justify-center gap-2">
              <Button
                label={copy.profile.changePhoto}
                variant="secondary"
                size="sm"
                onPress={pickPhoto}
              />
              {avatarUri ? (
                <Button
                  label={copy.profile.removePhoto}
                  variant="ghost"
                  size="sm"
                  onPress={() => setAvatarUri(null)}
                />
              ) : null}
            </View>
            <Text className="text-center text-caption text-ink-muted dark:text-ink-dark-muted">
              {copy.profile.photoHint}
            </Text>
          </View>

          <Card className="gap-4">
            <ProfileField
              label={copy.profile.fullName}
              value={fullName}
              onChangeText={setFullName}
              placeholder={copy.profile.fullNamePlaceholder}
              autoCapitalize="words"
            />
            <ProfileField
              label={copy.profile.email}
              value={user?.email || copy.more.accountUnavailable}
              readOnly
              autoCapitalize="none"
            />
            <Text className="-mt-2 text-caption text-ink-muted dark:text-ink-dark-muted">
              {copy.profile.emailLocked}
            </Text>
            <ProfileField
              label={copy.profile.phone}
              value={phone}
              onChangeText={setPhone}
              placeholder={copy.profile.phonePlaceholder}
              keyboardType="phone-pad"
            />
            <ProfileField
              label={copy.profile.city}
              value={city}
              onChangeText={setCity}
              placeholder={copy.profile.cityPlaceholder}
              autoCapitalize="words"
            />
          </Card>

          {error ? (
            <Text
              accessibilityRole="alert"
              className="text-label text-risk dark:text-risk-light"
            >
              {error}
            </Text>
          ) : null}

          <Button
            label={copy.common.save}
            onPress={save}
            loading={saving}
            disabled={saving}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
