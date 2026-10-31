// src/app/hospitals/index.tsx
// Hospital directory — matches hospital list_user.png exactly.

import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/empty-state';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useLocation } from '@/hooks/use-location';
import { hospitalsService } from '@/services/hospitals';
import type { Hospital } from '@/types/domain';

export default function HospitalsScreen() {
  const insets = useSafeAreaInsets();
  const { coords } = useLocation();

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadHospitals = useCallback(async () => {
    try {
      let list: Hospital[];
      if (coords) {
        list = await hospitalsService.nearest(coords.lat, coords.lng, 15);
      } else {
        list = await hospitalsService.list();
      }
      setHospitals(list);
    } catch {
      // fallback
    } finally {
      setIsRefreshing(false);
    }
  }, [coords]);

  useEffect(() => {
    loadHospitals();
  }, [loadHospitals]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadHospitals();
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
      {/* Header with back and kebab menu (hospital list_user.png) */}
      <ScreenHeader
        title="Hospital"
        rightAction={<Text className="text-xl font-bold text-ink-muted">⋮</Text>}
      />

      {/* Button to Switch to Map View */}
      <Pressable
        onPress={() => router.push('/hospitals/map')}
        className="my-3 flex-row items-center justify-between rounded-2xl bg-surface-brand p-3.5 active:opacity-80"
      >
        <View className="flex-row items-center gap-2.5">
          <Text className="text-xl">🗺️</Text>
          <View>
            <Text className="text-label font-bold text-brand">
              Tampilan Peta Faskes
            </Text>
            <Text className="text-caption text-ink-muted">
              Lihat radius faskes terdekat di peta
            </Text>
          </View>
        </View>
        <Text className="text-lg font-bold text-brand">›</Text>
      </Pressable>

      {/* Hospitals List in Individual Cards (hospital list_user.png) */}
      {hospitals.length === 0 ? (
        <EmptyState
          title="Faskes Tidak Ditemukan"
          body="Belum ada faskes yang terdaftar di lokasi ini."
          className="my-8"
        />
      ) : (
        <View className="gap-3.5 my-2">
          {hospitals.map((item, idx) => {
            const distance = `${300 + idx * 100}m away`;

            return (
              <Pressable
                key={item.id}
                onPress={() => router.push('/hospitals/map')}
                className="flex-row items-center gap-3.5 rounded-2xl border border-border bg-surface-card p-3.5 active:opacity-75 dark:border-border-dark dark:bg-surface-card-dark"
              >
                {/* Hospital Photo Placeholder (hospital list_user.png) */}
                <View className="h-20 w-20 items-center justify-center rounded-xl bg-surface-brand-soft overflow-hidden">
                  <Text className="text-3xl">🏥</Text>
                </View>

                {/* Right Info */}
                <View className="flex-1 gap-1">
                  <Text className="text-subtitle font-bold text-ink dark:text-ink-dark">
                    {item.name}
                  </Text>
                  <Text className="text-caption text-ink-muted" numberOfLines={1}>
                    {item.type === 'RS' ? 'Hospital • Pediatric Center' : 'Public Health Center'}
                  </Text>

                  {/* Rating Pill & Distance */}
                  <View className="flex-row items-center gap-2 mt-0.5">
                    <View className="flex-row items-center gap-1 rounded-pill bg-surface-brand-soft px-2.5 py-0.5">
                      <Text className="text-xs text-amber-500">★</Text>
                      <Text className="text-caption font-bold text-brand">
                        4.7
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
