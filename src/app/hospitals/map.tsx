// src/app/hospitals/map.tsx
// Hospital map screen — matches hospital map_user.png exactly.

import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/card';
import { ScreenHeader } from '@/components/ui/screen-header';
import { hospitalsService } from '@/services/hospitals';
import type { Hospital } from '@/types/domain';

export default function HospitalMapScreen() {
  const insets = useSafeAreaInsets();
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

  return (
    <View className="flex-1 bg-surface dark:bg-surface-dark">
      {/* Top Header: < Hospital : (hospital map_user.png) */}
      <View
        style={{ paddingTop: insets.top }}
        className="bg-surface px-4 pb-2 z-10 dark:bg-surface-card-dark"
      >
        <ScreenHeader
          title="Hospital"
          rightAction={<Text className="text-xl font-bold text-ink-muted">⋮</Text>}
        />

        {/* Search Bar: "Search location, ZIP code..." */}
        <View className="my-2 h-11 flex-row items-center rounded-pill border border-border bg-surface-muted px-4 dark:border-border-dark dark:bg-surface-dark">
          <Text className="mr-2 text-icon-muted">🔍</Text>
          <TextInput
            className="flex-1 text-label text-ink dark:text-ink-dark"
            placeholder="Search location, ZIP code..."
            placeholderTextColor="#AEB7C2"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Map Area with Location Circle & Hospital Pins (hospital map_user.png) */}
      <View className="flex-1 bg-surface-brand-soft items-center justify-center overflow-hidden">
        {/* Radius Circle */}
        <View className="h-72 w-72 rounded-full border border-brand/20 bg-brand/5 items-center justify-center">
          <View className="h-44 w-44 rounded-full border border-brand/30 bg-brand/10 items-center justify-center">
            {/* Center User Location Pin */}
            <View className="h-7 w-7 rounded-full border-2 border-white bg-brand items-center justify-center shadow-md">
              <View className="h-2.5 w-2.5 rounded-full bg-white" />
            </View>
          </View>
        </View>

        {/* Hospital Pins */}
        {hospitals.slice(0, 5).map((h, idx) => {
          const isSelected = selectedHospital?.id === h.id;
          const positions = [
            { top: '25%', left: '22%' },
            { top: '32%', right: '20%' },
            { bottom: '38%', left: '28%' },
            { bottom: '28%', right: '25%' },
            { top: '15%', right: '35%' },
          ];
          const pos = positions[idx % positions.length];

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
                    ? 'bg-brand border-2 border-white'
                    : 'bg-surface border border-border dark:bg-surface-card-dark'
                }`}
              >
                <Text className="text-xs">🏥</Text>
                <Text
                  className={`text-caption font-bold ${
                    isSelected ? 'text-on-brand' : 'text-ink dark:text-ink-dark'
                  }`}
                  numberOfLines={1}
                >
                  {h.name.slice(0, 10)}
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

      {/* Bottom Sheet Card: Hospital Name, Address, "See Detail" Button (hospital map_user.png) */}
      {selectedHospital && (
        <View
          style={{ paddingBottom: insets.bottom + 16 }}
          className="absolute bottom-0 left-0 right-0 z-20 px-5 pt-3"
        >
          <Card
            variant="default"
            className="rounded-sheet shadow-xl border border-border p-5 gap-3"
          >
            <Text className="text-subtitle font-bold text-ink dark:text-ink-dark">
              {selectedHospital.name}
            </Text>

            <View className="flex-row items-center gap-2">
              <Text className="text-base text-brand">📍</Text>
              <Text className="flex-1 text-caption text-ink-muted leading-4">
                {selectedHospital.address}
              </Text>
            </View>

            {/* Dark Navy Pill Button "See Detail" (hospital map_user.png) */}
            <Pressable
              onPress={() => handleNavigate(selectedHospital)}
              className="h-12 w-full items-center justify-center rounded-pill bg-brand active:opacity-80 mt-1"
            >
              <Text className="text-label font-bold text-on-brand">
                See Detail
              </Text>
            </Pressable>
          </Card>
        </View>
      )}
    </View>
  );
}
