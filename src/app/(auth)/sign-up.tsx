import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { copy } from "@/constants/copy";
import { useSession } from "@/hooks/use-session";
import { useTheme } from "@/hooks/use-theme";
import { Icon } from "@/components/ui/icon";

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const { signUp } = useSession();
  const theme = useTheme();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = (): string | null => {
    if (!name.trim()) return copy.auth.nameRequired;
    if (!email.trim() || !email.includes("@")) return copy.auth.invalidEmail;
    if (password.length < 8) return copy.auth.passwordTooShort;
    return null;
  };

  const handleSignUp = async () => {
    if (isLoading) return;
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await signUp(email.trim(), password, name.trim());
      setSuccess(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : copy.auth.signUpFailed;
      if (msg.includes("already registered")) {
        setError(copy.auth.alreadyRegistered);
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <View className="flex-1 items-center justify-center bg-surface px-6 dark:bg-surface-dark">
        <Icon name="check" tone="brand" />
        <Text className="text-center text-subtitle font-bold text-brand dark:text-brand-light">
          {copy.auth.success}
        </Text>
        <Button
          label={copy.auth.signInButton}
          className="mt-4"
          onPress={() => router.replace("/(auth)/sign-in")}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-surface dark:bg-surface-dark"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top,
          paddingBottom: insets.bottom + 24,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 justify-center px-6">
          <View className="mb-10 items-center gap-2">
            <Text className="text-title font-bold text-brand dark:text-brand-light">
              {copy.auth.signUpTitle}
            </Text>
          </View>

          <View className="gap-4">
            <View className="gap-1.5">
              <Text className="text-label font-semibold text-ink dark:text-ink-dark">
                {copy.auth.nameLabel}
              </Text>
              <TextInput
                className="min-h-12 rounded-xl border border-border bg-surface px-4 py-3 text-body text-ink"
                placeholder={copy.auth.namePlaceholder}
                placeholderTextColor={theme.inkMuted}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoComplete="name"
                returnKeyType="next"
                accessibilityLabel="Nama Lengkap"
              />
            </View>

            <View className="gap-1.5">
              <Text className="text-label font-semibold text-ink dark:text-ink-dark">
                {copy.auth.emailLabel}
              </Text>
              <TextInput
                className="min-h-12 rounded-xl border border-border bg-surface px-4 py-3 text-body text-ink"
                placeholder={copy.auth.emailPlaceholder}
                placeholderTextColor={theme.inkMuted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                returnKeyType="next"
                accessibilityLabel="Email"
              />
            </View>

            <View className="gap-1.5">
              <Text className="text-label font-semibold text-ink dark:text-ink-dark">
                {copy.auth.passwordLabel}
              </Text>
              <TextInput
                className="min-h-12 rounded-xl border border-border bg-surface px-4 py-3 text-body text-ink"
                placeholder={copy.auth.passwordPlaceholder}
                placeholderTextColor={theme.inkMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="new-password"
                returnKeyType="done"
                onSubmitEditing={handleSignUp}
                accessibilityLabel="Kata Sandi"
              />
            </View>

            {error ? (
              <View className="rounded-xl bg-risk-surface px-4 py-3">
                <Text className="text-caption text-risk">{error}</Text>
              </View>
            ) : null}

            <Button
              label={copy.auth.signUpButton}
              onPress={handleSignUp}
              isLoading={isLoading}
              className="mt-2"
            />
          </View>

          <View className="mt-8 flex-row flex-wrap items-center justify-center gap-2">
            <Text className="text-body text-ink-muted dark:text-ink-dark-muted">
              {copy.auth.hasAccount}
            </Text>
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="link"
              className="min-h-12 min-w-12 items-center justify-center"
            >
              <Text className="text-body font-semibold text-brand dark:text-brand-light">
                {copy.auth.signInButton}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
