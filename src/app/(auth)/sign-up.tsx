// src/app/(auth)/sign-up.tsx
// Sign-up screen — name, email, password registration.

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

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const { signUp } = useSession();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = (): string | null => {
    if (!name.trim()) return 'Nama wajib diisi.';
    if (!email.trim() || !email.includes('@')) return 'Email tidak valid.';
    if (password.length < 8) return 'Kata sandi minimal 8 karakter.';
    return null;
  };

  const handleSignUp = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);
    setIsLoading(true);
    try {
      await signUp(email.trim(), password, name.trim());
      setSuccess(true);
      // Auto-redirect to sign in after success
      setTimeout(() => router.replace('/(auth)/sign-in'), 2000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Gagal mendaftar. Coba lagi.';
      if (msg.includes('already registered')) {
        setError('Email ini sudah terdaftar. Silakan masuk.');
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
        <Text className="mb-4 text-5xl">✅</Text>
        <Text className="text-center text-subtitle font-bold text-brand dark:text-brand-light">
          Akun berhasil dibuat!
        </Text>
        <Text className="mt-2 text-center text-body text-ink-muted">
          Mengalihkan ke halaman masuk…
        </Text>
      </View>
    );
  }

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
          {/* Header */}
          <View className="mb-10 items-center gap-2">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-surface-brand">
              <Text className="text-3xl">🫁</Text>
            </View>
            <Text className="text-title font-bold text-brand dark:text-brand-light">
              {copy.auth.signUpTitle}
            </Text>
          </View>

          {/* Form */}
          <View className="gap-4">
            <View className="gap-1.5">
              <Text className="text-label font-semibold text-ink dark:text-ink-dark">
                {copy.auth.nameLabel}
              </Text>
              <TextInput
                className="h-12 rounded-xl border border-border bg-surface px-4 text-body text-ink dark:border-border-dark dark:bg-surface-card-dark dark:text-ink-dark"
                placeholder={copy.auth.namePlaceholder}
                placeholderTextColor="#AEB7C2"
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

          {/* Sign in link */}
          <View className="mt-8 flex-row items-center justify-center gap-1">
            <Text className="text-body text-ink-muted dark:text-ink-dark-muted">
              {copy.auth.hasAccount}
            </Text>
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="link"
              hitSlop={8}
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
