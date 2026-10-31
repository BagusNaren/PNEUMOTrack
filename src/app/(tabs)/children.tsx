// src/app/(tabs)/children.tsx
// Children profile list and active child switcher.

import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ScreenHeader } from '@/components/ui/screen-header';
import { copy } from '@/constants/copy';
import { useActiveChild } from '@/hooks/use-active-child';
import { childrenService } from '@/services/children';
import type { Child } from '@/types/domain';

export default function ChildrenScreen() {
  const insets = useSafeAreaInsets();
  const { activeChild, children, setActiveChild, refresh } = useActiveChild();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  const handleDelete = (child: Child) => {
    Alert.alert(
      'Hapus Profil Anak',
      `Yakin ingin menghapus profil ${child.name}? Riwayat skrining akan tetap tersimpan.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await childrenService.remove(child.id);
              await refresh();
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : 'Gagal menghapus';
              Alert.alert('Error', msg);
            }
          },
        },
      ]
    );
  };

  const getAgeString = (birthDateStr: string) => {
    const birth = new Date(birthDateStr);
    const now = new Date();
    const diffMonths =
      (now.getFullYear() - birth.getFullYear()) * 12 +
      (now.getMonth() - birth.getMonth());
    const years = Math.floor(diffMonths / 12);
    const months = diffMonths % 12;
    if (years > 0 && months > 0) return `${years} tahun ${months} bulan`;
    if (years > 0) return `${years} tahun`;
    return `${months} bulan`;
  };

  return (
    <View className="flex-1 bg-surface dark:bg-surface-dark">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: insets.top,
          paddingBottom: insets.bottom + 90,
          paddingHorizontal: 20,
        }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title={copy.children.listTitle}
          showBack={false}
          rightAction={
            <Pressable
              onPress={() => router.push('/children/new')}
              className="h-10 w-10 items-center justify-center rounded-full bg-surface-brand active:opacity-70"
              accessibilityLabel="Tambah Anak"
            >
              <Text className="text-xl font-bold text-brand">+</Text>
            </Pressable>
          }
        />

        {children.length === 0 ? (
          <EmptyState
            title={copy.children.emptyTitle}
            body={copy.children.emptyBody}
            actionLabel={copy.children.addButton}
            onAction={() => router.push('/children/new')}
            className="mt-12"
          />
        ) : (
          <View className="gap-3 mt-2">
            {children.map((child) => {
              const isActive = activeChild?.id === child.id;

              return (
                <Card
                  key={child.id}
                  variant={isActive ? 'brand' : 'default'}
                  className="gap-3"
                >
                  <View className="flex-row items-center gap-3">
                    <Image
                      source={require('@/assets/images/image_children.png')}
                      style={{ width: 56, height: 56, borderRadius: 28 }}
                    />

                    <View className="flex-1">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-subtitle font-bold text-ink dark:text-ink-dark">
                          {child.name}
                        </Text>
                        {isActive && (
                          <Badge label="Aktif" variant="brand" />
                        )}
                      </View>

                      <Text className="text-caption text-ink-muted">
                        {getAgeString(child.birth_date)} •{' '}
                        {child.sex === 'male' ? 'Laki-laki' : 'Perempuan'}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between pt-2 border-t border-border/60 dark:border-border-dark/60">
                    {isActive ? (
                      <Text className="text-caption font-semibold text-brand dark:text-brand-light">
                        ✓ Profil sedang dipantau
                      </Text>
                    ) : (
                      <Pressable
                        onPress={() => setActiveChild(child)}
                        className="active:opacity-70"
                      >
                        <Text className="text-caption font-bold text-brand dark:text-brand-light">
                          Jadikan Anak Aktif
                        </Text>
                      </Pressable>
                    )}

                    <Pressable
                      onPress={() => handleDelete(child)}
                      className="px-2 py-1 active:opacity-60"
                      hitSlop={8}
                    >
                      <Text className="text-caption text-ink-muted">Hapus</Text>
                    </Pressable>
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Floating Add Child Button at Bottom */}
      <View
        style={{ paddingBottom: insets.bottom + 16 }}
        className="absolute bottom-0 left-0 right-0 bg-surface/90 px-5 pt-3 dark:bg-surface-dark/90"
      >
        <Button
          label="+ Tambah Profil Anak Baru"
          size="md"
          variant="secondary"
          onPress={() => router.push('/children/new')}
        />
      </View>
    </View>
  );
}

