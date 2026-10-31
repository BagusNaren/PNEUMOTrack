// src/app/doctors/[id].tsx
// Doctor profile detail — matches doctor profile_user.png exactly.

import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/ui/screen-header';
import { doctorsService } from '@/services/doctors';
import type { Doctor } from '@/types/domain';

export default function DoctorDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!id) return;
    doctorsService
      .get(id)
      .then(setDoctor)
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading || !doctor) {
    return (
      <View className="flex-1 items-center justify-center bg-surface dark:bg-surface-dark">
        <Text className="text-body text-ink-muted">Loading doctor detail…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface dark:bg-surface-dark">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: insets.top,
          paddingBottom: insets.bottom + 90,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with back and kebab menu (doctor profile_user.png) */}
        <ScreenHeader
          title="Doctor Detail"
          rightAction={<Text className="text-xl font-bold text-ink-muted">⋮</Text>}
        />

        {/* Doctor Info Card (doctor profile_user.png) */}
        <View className="my-5 flex-row items-center gap-4">
          <View className="h-28 w-28 items-center justify-center rounded-2xl bg-surface-brand-soft overflow-hidden">
            <Image
              source={require('@/assets/images/image_doctor.png')}
              style={{ width: 92, height: 92 }}
              resizeMode="contain"
            />
          </View>

          <View className="flex-1 gap-1.5">
            <Text className="text-title font-bold text-ink dark:text-ink-dark">
              {doctor.name}
            </Text>
            <Text className="text-body text-ink-muted">
              {doctor.specialty}
            </Text>

            <View className="flex-row items-center gap-1.5 self-start rounded-pill bg-surface-brand-soft px-3 py-1">
              <Text className="text-xs text-amber-500">★</Text>
              <Text className="text-caption font-bold text-brand">
                {doctor.rating?.toFixed(1) ?? '4.7'}
              </Text>
            </View>

            <Text className="text-caption text-ink-muted mt-0.5">
              📍 800m away
            </Text>
          </View>
        </View>

        {/* About Section (doctor profile_user.png) */}
        <View className="my-4 gap-2">
          <Text className="text-subtitle font-bold text-ink dark:text-ink-dark">
            About
          </Text>
          <Text
            className="text-body text-ink-muted leading-6"
            numberOfLines={isExpanded ? undefined : 3}
          >
            {doctor.bio ??
              `${doctor.name} is a dedicated pediatric and respiratory specialist with over 10 years of clinical experience diagnosing and treating infant pneumonia, asthma, and airway conditions at ${doctor.hospital_name}.`}
          </Text>
          <Pressable
            onPress={() => setIsExpanded((prev) => !prev)}
            className="self-start active:opacity-70"
          >
            <Text className="text-label font-bold text-brand dark:text-brand-light">
              {isExpanded ? 'Show less' : '...Read more'}
            </Text>
          </Pressable>
        </View>

        {/* Schedule */}
        <View className="my-3 gap-2">
          <Text className="text-label font-bold text-ink dark:text-ink-dark">
            Practice Schedule
          </Text>
          <View className="rounded-xl border border-border p-3 gap-1.5 dark:border-border-dark">
            <Text className="text-caption text-ink">
              Monday - Friday: 09:00 - 15:00 WITA
            </Text>
            <Text className="text-caption text-ink-muted">
              Location: {doctor.hospital_name}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Navy Pill Button (doctor profile_user.png) */}
      <View
        style={{ paddingBottom: insets.bottom + 16 }}
        className="absolute bottom-0 left-0 right-0 bg-surface/95 px-5 pt-3 dark:bg-surface-dark/95"
      >
        <Pressable
          onPress={() => router.push(`/chats/${doctor.id}` as any)}
          className="h-13 w-full items-center justify-center rounded-pill bg-brand py-3.5 shadow-md active:opacity-80"
        >
          <Text className="text-label font-bold text-on-brand">
            Chat Right Now
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
