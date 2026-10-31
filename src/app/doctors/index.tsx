// src/app/doctors/index.tsx
// Doctor directory — matches doctor page_user.png.

import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ListRow } from '@/components/ui/list-row';
import { ScreenHeader } from '@/components/ui/screen-header';
import { doctorsService } from '@/services/doctors';
import type { Doctor } from '@/types/domain';

export default function DoctorsScreen() {
  const insets = useSafeAreaInsets();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadDoctors = useCallback(async (query?: string) => {
    try {
      const list = await doctorsService.list(query);
      setDoctors(list);
    } catch {
      // fallback
    } finally {
      setIsLoading(false);
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
      <ScreenHeader
        title="Dokter Spesialis"
        subtitle="Konsultasi kesehatan anak & pernapasan"
      />

      {/* Search Bar */}
      <View className="my-4">
        <View className="h-12 flex-row items-center rounded-pill border border-border bg-surface-muted px-4 dark:border-border-dark dark:bg-surface-card-dark">
          <Text className="mr-2.5 text-base text-icon-muted">🔍</Text>
          <TextInput
            className="flex-1 text-body text-ink dark:text-ink-dark"
            placeholder="Cari dokter spesialis atau RS…"
            placeholderTextColor="#AEB7C2"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <Text
              onPress={() => setSearchQuery('')}
              className="text-sm text-ink-muted px-2"
            >
              ✕
            </Text>
          ) : null}
        </View>
      </View>

      {/* Doctors List */}
      {doctors.length === 0 ? (
        <EmptyState
          title="Dokter Tidak Ditemukan"
          body="Tidak ada dokter yang cocok dengan kata kunci pencarian Anda."
          actionLabel="Tampilkan Semua Dokter"
          onAction={() => setSearchQuery('')}
          className="my-8"
        />
      ) : (
        <Card variant="default" className="p-1 mb-4">
          {doctors.map((doc, idx) => (
            <ListRow
              key={doc.id}
              onPress={() => router.push(`/doctors/${doc.id}` as any)}
              leading={
                <Image
                  source={require('@/assets/images/image_doctor.png')}
                  style={{ width: 52, height: 52, borderRadius: 16 }}
                />
              }
              title={doc.name}
              subtitle={
                <View className="gap-0.5">
                  <Text numberOfLines={1} className="text-caption text-ink-muted">
                    {doc.specialty} • {doc.hospital_name}
                  </Text>
                  <View className="flex-row items-center gap-2 mt-0.5">
                    <Text className="text-caption font-semibold text-amber-500">
                      ★ {doc.rating?.toFixed(1) ?? '4.9'}
                    </Text>
                    <View className="flex-row items-center gap-1">
                      <View className="h-1.5 w-1.5 rounded-full bg-safe" />
                      <Text className="text-caption font-medium text-safe">
                        Tersedia
                      </Text>
                    </View>
                  </View>
                </View>
              }
              className={idx === doctors.length - 1 ? 'border-b-0' : ''}
            />
          ))}
        </Card>
      )}
    </ScrollView>
  );
}

