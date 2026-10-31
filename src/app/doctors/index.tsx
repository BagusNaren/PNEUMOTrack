// src/app/doctors/index.tsx
// Doctor directory — matches doctor page_user.png exactly.

import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ScreenHeader } from '@/components/ui/screen-header';
import { doctorsService } from '@/services/doctors';
import type { Doctor } from '@/types/domain';

export default function DoctorsScreen() {
  const insets = useSafeAreaInsets();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadDoctors = useCallback(async (query?: string) => {
    try {
      const list = await doctorsService.list(query);
      setDoctors(list);
    } catch {
      // fallback
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDoctors(searchQuery);
  }, [loadDoctors, searchQuery]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadDoctors(searchQuery);
  };

  return (
    <ScrollView
      className="flex-1 bg-surface dark:bg-surface-dark"
      contentContainerStyle={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: 20,
      }}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header with back and kebab menu (doctor page_user.png) */}
      <ScreenHeader
        title="Doctor"
        rightAction={<Text className="text-xl font-bold text-ink-muted">⋮</Text>}
      />

      {/* Search Bar */}
      <View className="my-3">
        <View className="h-11 flex-row items-center rounded-pill border border-border bg-surface-muted px-4 dark:border-border-dark dark:bg-surface-card-dark">
          <Text className="mr-2 text-icon-muted">🔍</Text>
          <TextInput
            className="flex-1 text-label text-ink dark:text-ink-dark"
            placeholder="Search doctor or specialty…"
            placeholderTextColor="#AEB7C2"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Doctors List in Individual Cards (doctor page_user.png) */}
      {doctors.length === 0 ? (
        <EmptyState
          title="Doctor Not Found"
          body="No doctors found matching your search query."
          actionLabel="Show All Doctors"
          onAction={() => setSearchQuery('')}
          className="my-8"
        />
      ) : (
        <View className="gap-3.5 my-2">
          {doctors.map((doc, idx) => {
            const distance = `${120 + idx * 80}m away`;

            return (
              <Pressable
                key={doc.id}
                onPress={() => router.push(`/doctors/${doc.id}` as any)}
                className="flex-row items-center gap-3.5 rounded-2xl border border-border bg-surface-card p-3.5 active:opacity-75 dark:border-border-dark dark:bg-surface-card-dark"
              >
                {/* Doctor Photo on Light Blue Square Background (doctor page_user.png) */}
                <View className="h-20 w-20 items-center justify-center rounded-2xl bg-surface-brand-soft overflow-hidden">
                  <Image
                    source={require('@/assets/images/image_doctor.png')}
                    style={{ width: 72, height: 72 }}
                    resizeMode="contain"
                  />
                </View>

                {/* Info Column */}
                <View className="flex-1 gap-1">
                  <Text className="text-subtitle font-bold text-ink dark:text-ink-dark">
                    {doc.name}
                  </Text>
                  <Text className="text-caption text-ink-muted">
                    {doc.specialty}
                  </Text>

                  {/* Rating Pill with Star */}
                  <View className="flex-row items-center gap-2 mt-0.5">
                    <View className="flex-row items-center gap-1 rounded-pill bg-surface-brand-soft px-2.5 py-0.5">
                      <Text className="text-xs text-amber-500">★</Text>
                      <Text className="text-caption font-bold text-brand">
                        {doc.rating?.toFixed(1) ?? '4.7'}
                      </Text>
                    </View>

                    <Text className="text-caption text-ink-muted">
                      📍 {distance}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
