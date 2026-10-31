// src/app/hospitals/index.tsx
// Hospital directory — matches hospital list_user.png.

import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useLocation } from '@/hooks/use-location';
import { hospitalsService } from '@/services/hospitals';
import type { Hospital } from '@/types/domain';

export default function HospitalsScreen() {
  const insets = useSafeAreaInsets();
  const { coords } = useLocation();

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
      setIsLoading(false);
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

  const filtered = hospitals.filter(
    (h) =>
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNavigate = (h: Hospital) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(h.name)}@${h.lat},${h.lng}`,
      android: `geo:0,0?q=${h.lat},${h.lng}(${encodeURIComponent(h.name)})`,
      default: `https://www.google.com/maps/search/?api=1&query=${h.lat},${h.lng}`,
    });
    if (url) Linking.openURL(url).catch(() => {});
  };

  const handleCall = (h: Hospital) => {
    if (h.phone) {
      Linking.openURL(`tel:${h.phone}`).catch(() => {});
    }
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
      <ScreenHeader
        title="Fasilitas Kesehatan"
        subtitle="Rumah Sakit & Puskesmas Terdekat"
        rightAction={
          <Pressable
            onPress={() => router.push('/hospitals/map')}
            className="h-10 w-10 items-center justify-center rounded-full bg-surface-brand active:opacity-70"
            accessibilityLabel="Tampilan Peta"
          >
            <Text className="text-lg">🗺️</Text>
          </Pressable>
        }
      />

      {/* Search Bar + Map Switcher Banner */}
      <View className="my-3 gap-3">
        <View className="h-12 flex-row items-center rounded-pill border border-border bg-surface-muted px-4 dark:border-border-dark dark:bg-surface-card-dark">
          <Text className="mr-2 text-base text-icon-muted">🔍</Text>
          <TextInput
            className="flex-1 text-body text-ink dark:text-ink-dark"
            placeholder="Cari RS atau Puskesmas…"
            placeholderTextColor="#AEB7C2"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <Pressable
          onPress={() => router.push('/hospitals/map')}
          className="flex-row items-center justify-between rounded-card bg-surface-brand p-3.5 active:opacity-80"
        >
          <View className="flex-row items-center gap-2.5">
            <Text className="text-xl">📍</Text>
            <View>
              <Text className="text-label font-bold text-brand">
                Lihat di Peta Interaktif
              </Text>
              <Text className="text-caption text-ink-muted">
                Temukan faskes dengan rute terdekat dari lokasi Anda
              </Text>
            </View>
          </View>
          <Text className="text-lg font-bold text-brand">›</Text>
        </Pressable>
      </View>

      {/* Hospitals List */}
      {filtered.length === 0 ? (
        <EmptyState
          title="Faskes Tidak Ditemukan"
          body="Tidak ada fasilitas kesehatan yang sesuai dengan pencarian Anda."
          actionLabel="Tampilkan Semua Faskes"
          onAction={() => setSearchQuery('')}
          className="my-8"
        />
      ) : (
        <View className="gap-3.5 my-2">
          {filtered.map((item) => (
            <Card key={item.id} variant="default" className="gap-3">
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-2">
                  <View className="flex-row items-center gap-2 mb-1 flex-wrap">
                    <Badge
                      label={item.type === 'RS' ? 'Rumah Sakit' : 'Puskesmas'}
                      variant={item.type === 'RS' ? 'brand' : 'safe'}
                    />
                    {item.has_pediatric && (
                      <Badge label="IGD Anak 24 Jam" variant="risk" />
                    )}
                  </View>
                  <Text className="text-subtitle font-bold text-ink dark:text-ink-dark">
                    {item.name}
                  </Text>
                  <Text className="mt-0.5 text-caption text-ink-muted leading-4">
                    {item.address}
                  </Text>
                </View>

                {item.distance_km !== undefined && (
                  <View className="rounded-pill bg-surface-brand-soft px-2.5 py-1 items-center">
                    <Text className="text-caption font-bold text-brand">
                      {item.distance_km.toFixed(1)} km
                    </Text>
                  </View>
                )}
              </View>

              <View className="flex-row items-center gap-2 pt-2 border-t border-border/60">
                <View className="flex-1">
                  <Button
                    label="Arahkan Peta"
                    size="sm"
                    variant="primary"
                    icon={<Text className="text-sm">🧭</Text>}
                    onPress={() => handleNavigate(item)}
                  />
                </View>
                {item.phone && (
                  <View className="flex-1">
                    <Button
                      label="Telepon IGD"
                      size="sm"
                      variant="secondary"
                      icon={<Text className="text-sm">📞</Text>}
                      onPress={() => handleCall(item)}
                    />
                  </View>
                )}
              </View>
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

