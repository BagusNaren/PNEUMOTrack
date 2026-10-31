// src/app/history/index.tsx
// Screening history list with trend charts — matches cough history_user.png & Recording List.png.

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

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ListRow } from '@/components/ui/list-row';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SegmentedTabs } from '@/components/ui/segmented-tabs';
import { useActiveChild } from '@/hooks/use-active-child';
import { screeningsService } from '@/services/screenings';
import type { Screening } from '@/types/domain';

type TimeFilter = '7d' | '30d' | 'all';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { activeChild } = useActiveChild();

  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [filter, setFilter] = useState<TimeFilter>('7d');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!activeChild) {
      setScreenings([]);
      setIsLoading(false);
      return;
    }
    try {
      const list = await screeningsService.listByChild(activeChild.id);
      setScreenings(list);
    } catch {
      // fallback
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [activeChild]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  // Filter list
  const filteredList = screenings.filter((s) => {
    if (filter === 'all') return true;
    const diffDays =
      (Date.now() - new Date(s.created_at).getTime()) / (1000 * 60 * 60 * 24);
    if (filter === '7d') return diffDays <= 7;
    if (filter === '30d') return diffDays <= 30;
    return true;
  });

  const normalCount = filteredList.filter((s) => s.result === 'normal').length;
  const riskCount = filteredList.filter((s) => s.result === 'risk').length;

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
        title="Riwayat Skrining"
        subtitle={`${screenings.length} Rekaman Terdaftar`}
      />

      {/* Child Summary Card */}
      <Card variant="brand" className="mb-4 flex-row items-center justify-between">
        <View>
          <Text className="text-caption text-ink-muted">Riwayat untuk Anak:</Text>
          <Text className="text-subtitle font-bold text-brand dark:text-brand-light">
            {activeChild ? activeChild.name : 'Semua Anak'}
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/(tabs)/children')}
          className="rounded-pill bg-white/80 px-3 py-1 dark:bg-black/20"
        >
          <Text className="text-caption font-semibold text-brand">Ganti Anak</Text>
        </Pressable>
      </Card>

      {/* Filter Tabs */}
      <View className="mb-4">
        <SegmentedTabs
          options={[
            { key: '7d', label: '7 Hari Terakhir' },
            { key: '30d', label: '30 Hari' },
            { key: 'all', label: 'Semua' },
          ]}
          value={filter}
          onChange={(v) => setFilter(v as TimeFilter)}
        />
      </View>

      {/* Trend & Statistic Card */}
      <Card variant="default" className="mb-5">
        <Text className="text-label font-bold text-ink dark:text-ink-dark mb-2">
          Statistik Skrining Periode Ini
        </Text>
        <View className="flex-row items-center justify-around py-2">
          <View className="items-center">
            <Text className="text-2xl font-bold text-ink dark:text-ink-dark">
              {filteredList.length}
            </Text>
            <Text className="text-caption text-ink-muted">Total Skrining</Text>
          </View>
          <View className="h-8 w-px bg-border" />
          <View className="items-center">
            <Text className="text-2xl font-bold text-safe">
              {normalCount}
            </Text>
            <Text className="text-caption text-ink-muted">Pola Normal</Text>
          </View>
          <View className="h-8 w-px bg-border" />
          <View className="items-center">
            <Text className="text-2xl font-bold text-risk">
              {riskCount}
            </Text>
            <Text className="text-caption text-ink-muted">Perlu Perhatian</Text>
          </View>
        </View>

        {/* Visual Activity Bar */}
        {filteredList.length > 0 && (
          <View className="mt-3 pt-3 border-t border-border">
            <View className="h-3 w-full flex-row rounded-full overflow-hidden bg-border/40">
              <View
                style={{
                  flex: normalCount || 1,
                  backgroundColor: '#1F7A5C',
                }}
              />
              <View
                style={{
                  flex: riskCount || 0,
                  backgroundColor: '#A33A3A',
                }}
              />
            </View>
            <View className="flex-row justify-between mt-1.5">
              <Text className="text-caption text-safe">
                ● Normal ({normalCount})
              </Text>
              <Text className="text-caption text-risk">
                ● Risiko ({riskCount})
              </Text>
            </View>
          </View>
        )}
      </Card>

      {/* Screenings List */}
      <View className="mb-2">
        <Text className="text-subtitle font-bold text-ink dark:text-ink-dark mb-2">
          Daftar Catatan Skrining
        </Text>

        {filteredList.length === 0 ? (
          <EmptyState
            title="Belum Ada Riwayat"
            body="Belum ada riwayat skrining batuk pada rentang waktu ini."
            actionLabel="Mulai Skrining Sekarang"
            onAction={() => router.push('/screening/guide' as any)}
            className="my-6"
          />
        ) : (
          <Card variant="default" className="p-1">
            {filteredList.map((item, index) => {
              const isRisk = item.result === 'risk';
              const dateStr = new Date(item.created_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });
              const timeStr = new Date(item.created_at).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <ListRow
                  key={item.id}
                  onPress={() => router.push(`/history/${item.id}` as any)}
                  leading={
                    <View
                      className={`h-11 w-11 items-center justify-center rounded-xl ${
                        isRisk ? 'bg-risk-surface' : 'bg-surface-safe'
                      }`}
                    >
                      <Text className="text-lg">{isRisk ? '⚠' : '✓'}</Text>
                    </View>
                  }
                  title={`${dateStr}, ${timeStr}`}
                  subtitle={`${item.duration_sec?.toFixed(1) ?? '6.0'} dtk • ${item.chunks ?? 4} batuk terdeteksi`}
                  trailing={
                    <Badge
                      label={isRisk ? 'Perlu Perhatian' : 'Pola Normal'}
                      variant={isRisk ? 'risk' : 'safe'}
                    />
                  }
                  className={index === filteredList.length - 1 ? 'border-b-0' : ''}
                />
              );
            })}
          </Card>
        )}
      </View>
    </ScrollView>
  );
}

