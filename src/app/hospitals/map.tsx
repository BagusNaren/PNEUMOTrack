// src/app/hospitals/map.tsx
// Interactive hospital map screen — matches hospital map_user.png.

import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLocation } from '@/hooks/use-location';
import { hospitalsService } from '@/services/hospitals';
import type { Hospital } from '@/types/domain';

export default function HospitalMapScreen() {
  const insets = useSafeAreaInsets();
  const { coords } = useLocation();

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    hospitalsService.list().then((list) => {
      setHospitals(list);
      if (list.length > 0) setSelectedHospital(list[0]);
    });
  }, []);

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
    <View className="flex-1 bg-surface-muted dark:bg-surface-muted-dark">
      {/* Top Floating Header & Search Bar */}
      <View
        style={{ paddingTop: insets.top + 8 }}
        className="absolute top-0 left-0 right-0 z-20 px-4 pb-2 bg-gradient-to-b from-black/20 to-transparent"
      >
        <View className="flex-row items-center gap-2 mb-2">
          <Pressable
            onPress={() => router.back()}
            className="h-11 w-11 items-center justify-center rounded-full bg-surface shadow-md active:opacity-70 dark:bg-surface-card-dark"
          >
            <Text className="text-2xl text-ink dark:text-ink-dark">‹</Text>
          </Pressable>

          <View className="flex-1 h-11 flex-row items-center rounded-pill bg-surface px-4 shadow-md dark:bg-surface-card-dark">
            <Text className="mr-2 text-icon-muted">🔍</Text>
            <TextInput
              className="flex-1 text-label text-ink dark:text-ink-dark"
              placeholder="Cari faskes di peta…"
              placeholderTextColor="#AEB7C2"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Quick Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
        >
          <View className="rounded-pill bg-brand px-3.5 py-1.5 shadow-sm">
            <Text className="text-caption font-bold text-on-brand">Semua Faskes</Text>
          </View>
          <View className="rounded-pill bg-surface px-3.5 py-1.5 shadow-sm dark:bg-surface-card-dark">
            <Text className="text-caption font-semibold text-ink">IGD Anak 24 Jam</Text>
          </View>
          <View className="rounded-pill bg-surface px-3.5 py-1.5 shadow-sm dark:bg-surface-card-dark">
            <Text className="text-caption font-semibold text-ink">Puskesmas</Text>
          </View>
        </ScrollView>
      </View>

      {/* Map Graphic Canvas / Simulated View with GPS Radar & Hospital Pins */}
      <View className="flex-1 items-center justify-center bg-surface-brand-soft overflow-hidden">
        {/* Radar Rings around User Location */}
        <View className="absolute h-96 w-96 rounded-full border border-brand/10 bg-brand/5 items-center justify-center">
          <View className="h-64 w-64 rounded-full border border-brand/20 bg-brand/10 items-center justify-center">
            <View className="h-32 w-32 rounded-full border border-brand/30 bg-brand/15 items-center justify-center">
              {/* User GPS Indicator */}
              <View className="h-6 w-6 rounded-full border-2 border-white bg-brand shadow-lg items-center justify-center">
                <View className="h-2 w-2 rounded-full bg-white" />
              </View>
            </View>
          </View>
        </View>

        {/* Hospital Markers Sprinkled on Canvas */}
        {hospitals.slice(0, 6).map((h, idx) => {
          const isSelected = selectedHospital?.id === h.id;
          const offsets = [
            { top: '28%', left: '32%' },
            { top: '35%', right: '22%' },
            { top: '48%', left: '18%' },
            { top: '55%', right: '35%' },
            { top: '22%', right: '40%' },
            { top: '65%', left: '45%' },
          ];
          const pos = offsets[idx % offsets.length];

          return (
            <Pressable
              key={h.id}
              onPress={() => setSelectedHospital(h)}
              style={pos as any}
              className={`absolute items-center active:scale-110`}
            >
              <View
                className={`flex-row items-center gap-1 rounded-pill px-2.5 py-1 shadow-md ${
                  isSelected
                    ? 'bg-brand border-2 border-white scale-110'
                    : 'bg-surface border border-border dark:bg-surface-card-dark'
                }`}
              >
                <Text className="text-xs">{h.has_pediatric ? '🏥' : '🩺'}</Text>
                <Text
                  className={`text-caption font-bold ${
                    isSelected ? 'text-on-brand' : 'text-ink dark:text-ink-dark'
                  }`}
                  numberOfLines={1}
                >
                  {h.name.replace('Rumah Sakit', 'RS').slice(0, 14)}…
                </Text>
              </View>
              <View
                className={`h-2 w-2 rotate-45 -mt-1 ${
                  isSelected ? 'bg-brand' : 'bg-surface dark:bg-surface-card-dark'
                }`}
              />
            </Pressable>
          );
        })}
      </View>

      {/* Selected Hospital Bottom Sheet Card */}
      {selectedHospital && (
        <View
          style={{ paddingBottom: insets.bottom + 16 }}
          className="absolute bottom-0 left-0 right-0 z-30 px-5 pt-3"
        >
          <Card
            variant="default"
            className="rounded-sheet shadow-2xl border-2 border-brand/20 p-5 gap-3"
          >
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-3">
                <View className="flex-row items-center gap-2 mb-1">
                  <Badge
                    label={selectedHospital.type === 'RS' ? 'Rumah Sakit' : 'Puskesmas'}
                    variant="brand"
                  />
                  {selectedHospital.has_pediatric && (
                    <Badge label="IGD Anak 24 Jam" variant="risk" />
                  )}
                </View>
                <Text className="text-subtitle font-bold text-ink dark:text-ink-dark">
                  {selectedHospital.name}
                </Text>
                <Text className="text-caption text-ink-muted leading-4 mt-0.5">
                  {selectedHospital.address}
                </Text>
              </View>

              <View className="rounded-pill bg-surface-brand px-3 py-1 items-center">
                <Text className="text-caption font-bold text-brand">
                  {selectedHospital.distance_km?.toFixed(1) ?? '1.2'} km
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-2.5 pt-2 border-t border-border/50">
              <View className="flex-1">
                <Button
                  label="Arahkan Rute"
                  size="md"
                  variant="primary"
                  icon={<Text className="text-base">🧭</Text>}
                  onPress={() => handleNavigate(selectedHospital)}
                />
              </View>
              {selectedHospital.phone && (
                <View className="flex-1">
                  <Button
                    label="Telepon IGD"
                    size="md"
                    variant="secondary"
                    icon={<Text className="text-base">📞</Text>}
                    onPress={() => handleCall(selectedHospital)}
                  />
                </View>
              )}
            </View>
          </Card>
        </View>
      )}
    </View>
  );
}

