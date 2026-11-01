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

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const { signIn } = useSession();
  const theme = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    if (isLoading) return;
    if (!email.trim() || !password) {
      setError(copy.auth.required);
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await signIn(email.trim(), password);
      router.replace("/(tabs)");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : copy.auth.signInFailed;
      if (msg.includes("Invalid login")) {
        setError(copy.auth.invalidLogin);
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemo = async () => {
    setIsLoading(true);
    try {
      await signIn("demo@pneumotrack.id", "demo1234");
      router.replace("/(tabs)");
    } catch {
      setError(copy.auth.demoUnavailable);
    } finally {
      setIsLoading(false);
    }
  };

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
              {copy.app.name}
            </Text>
            <Text className="text-center text-body text-ink-muted dark:text-ink-dark-muted">
              {copy.auth.signInSubtitle}
            </Text>
          </View>

          <View className="gap-4">
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
                autoComplete="current-password"
                returnKeyType="done"
                onSubmitEditing={handleSignIn}
                accessibilityLabel="Kata Sandi"
              />
            </View>

            {error ? (
              <View className="rounded-xl bg-risk-surface px-4 py-3">
                <Text className="text-caption text-risk">{error}</Text>
              </View>
            ) : null}

            <Button
              label={copy.auth.signInButton}
              onPress={handleSignIn}
              isLoading={isLoading}
              className="mt-2"
            />

            {__DEV__ && (
              <Button
                label={copy.auth.demoButton}
                variant="secondary"
                onPress={handleDemo}
                isLoading={isLoading}
              />
            )}
          </View>

          <View className="mt-8 flex-row flex-wrap items-center justify-center gap-2">
            <Text className="text-body text-ink-muted dark:text-ink-dark-muted">
              {copy.auth.noAccount}
            </Text>
            <Pressable
              onPress={() => router.push("/(auth)/sign-up")}
              accessibilityRole="link"
              className="min-h-12 min-w-12 items-center justify-center"
            >
              <Text className="text-body font-semibold text-brand dark:text-brand-light">
                {copy.auth.signUpButton}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
