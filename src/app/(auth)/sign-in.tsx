// src/app/(auth)/sign-in.tsx
// Sign-in screen — email + password login with demo mode.

import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { copy } from '@/constants/copy';
import { useSession } from '@/hooks/use-session';

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const { signIn } = useSession();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      setError('Email dan kata sandi wajib diisi.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await signIn(email.trim(), password);
      router.replace('/(tabs)');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Gagal masuk. Coba lagi.';
      if (msg.includes('Invalid login')) {
        setError('Email atau kata sandi salah.');
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
      // Demo account — predefined credentials
      await signIn('demo@pneumotrack.id', 'demo1234');
      router.replace('/(tabs)');
    } catch {
      setError('Akun demo tidak tersedia. Silakan buat akun baru.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-surface dark:bg-surface-dark"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top, paddingBottom: insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 justify-center px-6">
          {/* Logo / Header */}
          <View className="mb-10 items-center gap-2">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-surface-brand">
              <Text className="text-3xl">🫁</Text>
            </View>
            <Text className="text-title font-bold text-brand dark:text-brand-light">
              {copy.app.name}
            </Text>
            <Text className="text-center text-body text-ink-muted dark:text-ink-dark-muted">
              {copy.auth.signInSubtitle}
            </Text>
          </View>

          {/* Form */}
          <View className="gap-4">
            <View className="gap-1.5">
              <Text className="text-label font-semibold text-ink dark:text-ink-dark">
                {copy.auth.emailLabel}
              </Text>
              <TextInput
                className="h-12 rounded-xl border border-border bg-surface px-4 text-body text-ink dark:border-border-dark dark:bg-surface-card-dark dark:text-ink-dark"
                placeholder={copy.auth.emailPlaceholder}
                placeholderTextColor="#AEB7C2"
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
                className="h-12 rounded-xl border border-border bg-surface px-4 text-body text-ink dark:border-border-dark dark:bg-surface-card-dark dark:text-ink-dark"
                placeholder={copy.auth.passwordPlaceholder}
                placeholderTextColor="#AEB7C2"
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

          {/* Sign up link */}
          <View className="mt-8 flex-row items-center justify-center gap-1">
            <Text className="text-body text-ink-muted dark:text-ink-dark-muted">
              {copy.auth.noAccount}
            </Text>
            <Pressable
              onPress={() => router.push('/(auth)/sign-up')}
              accessibilityRole="link"
              hitSlop={8}
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
