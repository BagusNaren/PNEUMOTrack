// src/app/children/new.tsx
// Add new child screen — matches design.md §7.17.

import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SegmentedTabs } from '@/components/ui/segmented-tabs';
import { copy } from '@/constants/copy';
import { useActiveChild } from '@/hooks/use-active-child';
import { useSession } from '@/hooks/use-session';
import { childrenService } from '@/services/children';
import type { Sex } from '@/types/domain';

export default function NewChildScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useSession();
  const { refresh, setActiveChild } = useActiveChild();

  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('2023-06-15');
  const [sex, setSex] = useState<Sex>('male');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Perhatian', 'Nama anak wajib diisi.');
      return;
    }

    setIsLoading(true);
    try {
      const parentId = user?.id ?? 'user-demo';
      const created = await childrenService.create(parentId, {
        name: name.trim(),
        birth_date: birthDate,
        sex,
      });

      await refresh();
      setActiveChild(created);
      Alert.alert('Berhasil', 'Profil anak berhasil ditambahkan!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan profil anak.';
      Alert.alert('Error', msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-surface dark:bg-surface-dark"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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

        {/* Avatar Picker Circle */}
        <View className="items-center my-6">
          <View className="h-24 w-24 items-center justify-center rounded-full bg-surface-brand border-2 border-brand/20">
            <Image
              source={require('@/assets/images/image_children.png')}
              style={{ width: 88, height: 88, borderRadius: 44 }}
            />
            <View className="absolute bottom-0 right-0 h-7 w-7 items-center justify-center rounded-full bg-brand">
              <Text className="text-xs text-white">📷</Text>
            </View>
          </View>
          <Text className="mt-2 text-caption text-ink-muted">Foto Profil Anak</Text>
        </View>

        {/* Inputs */}
        <View className="gap-5">
          <View className="gap-1.5">
            <Text className="text-label font-bold text-ink dark:text-ink-dark">
              {copy.children.nameLabel} *
            </Text>
            <TextInput
              className="h-12 rounded-xl border border-border bg-surface px-4 text-body text-ink dark:border-border-dark dark:bg-surface-card-dark dark:text-ink-dark"
              placeholder={copy.children.namePlaceholder}
              placeholderTextColor="#AEB7C2"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View className="gap-1.5">
            <Text className="text-label font-bold text-ink dark:text-ink-dark">
              {copy.children.birthDateLabel} (YYYY-MM-DD)
            </Text>
            <TextInput
              className="h-12 rounded-xl border border-border bg-surface px-4 text-body text-ink dark:border-border-dark dark:bg-surface-card-dark dark:text-ink-dark"
              placeholder="Contoh: 2023-05-20"
              placeholderTextColor="#AEB7C2"
              value={birthDate}
              onChangeText={setBirthDate}
            />
            <Text className="text-caption text-ink-muted">
              Digunakan untuk menghitung kategori usia dan penyesuaian evaluasi.
            </Text>
          </View>

          <View className="gap-1.5">
            <Text className="text-label font-bold text-ink dark:text-ink-dark">
              {copy.children.sexLabel}
            </Text>
            <SegmentedTabs
              options={[
                { key: 'male', label: copy.children.sexMale },
                { key: 'female', label: copy.children.sexFemale },
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

