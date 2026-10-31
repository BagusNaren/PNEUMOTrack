// src/app/history/index.tsx
// History screen — matches cough history_user.png and Recording List.png.

import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useActiveChild } from '@/hooks/use-active-child';
import { screeningsService } from '@/services/screenings';
import type { Screening } from '@/types/domain';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { activeChild } = useActiveChild();

  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!activeChild) {
      setScreenings([]);
      return;
    }
    try {
      const list = await screeningsService.listByChild(activeChild.id);
      setScreenings(list);
    } catch {
      // fallback
    } finally {
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

  const latest = screenings[0];
  const isRisk = latest?.result === 'risk';

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
        {/* Header with back and kebab menu (cough history_user.png & Recording List.png) */}
        <ScreenHeader
          title="All Recordings"
          subtitle={`${screenings.length} Recordings`}
          rightAction={<Text className="text-xl font-bold text-ink-muted">⋮</Text>}
        />

        {/* 1. Top Card: Pills + Status + Child Photo (cough history_user.png & Recording List.png) */}
        <Card variant={isRisk ? 'risk' : 'brand'} className="my-3 rounded-2xl p-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3 gap-2">
              <View className="flex-row items-center gap-2">
                <View className="rounded-pill bg-white/70 px-3 py-1 dark:bg-black/20">
                  <Text className="text-caption font-semibold text-brand">
                    Live Monitoring
                  </Text>
                </View>
                <View className="rounded-pill bg-brand px-3 py-1">
                  <Text className="text-caption font-bold text-on-brand">
                    Match
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center gap-1.5 mt-1">
                <View
                  className={`h-2.5 w-2.5 rounded-full ${
                    isRisk ? 'bg-risk' : 'bg-safe'
                  }`}
                />
                <Text
                  className={`text-caption font-bold ${
                    isRisk ? 'text-risk' : 'text-brand dark:text-brand-light'
                  }`}
                >
                  {isRisk
                    ? 'Pneumonia risk detected'
                    : 'No Sign of Pneumonia detected'}
                </Text>
              </View>
            </View>

            <Image
              source={require('@/assets/images/image_children.png')}
              style={{ width: 72, height: 72, borderRadius: 18 }}
            />
          </View>
        </Card>

        {/* 2. Middle Card: 24 Hours Trends (cough history_user.png) */}
        <Card variant="brand" className="mb-4 rounded-2xl p-4 gap-2">
          <View className="flex-row items-center justify-between">
            <View className="rounded-pill bg-brand px-3 py-1 self-start">
              <Text className="text-caption font-bold text-on-brand">
                24 Hours
              </Text>
            </View>
            <Text className="text-caption text-ink-muted">Acoustic Activity</Text>
          </View>

          {/* 4 Mini Trend Charts Visual (3 lines + 1 bar) */}
          <View className="flex-row flex-wrap gap-2 pt-2">
            {/* Box 1 */}
            <View className="h-20 flex-1 rounded-xl bg-white p-2 justify-between dark:bg-surface-card-dark">
              <Text className="text-xs text-ink-muted">Cough Freq</Text>
              <View className="flex-row items-end justify-between h-8 px-1">
                <View className="h-3 w-1.5 rounded-full bg-brand" />
                <View className="h-6 w-1.5 rounded-full bg-brand" />
                <View className="h-4 w-1.5 rounded-full bg-brand" />
                <View className="h-7 w-1.5 rounded-full bg-brand" />
                <View className="h-5 w-1.5 rounded-full bg-brand" />
              </View>
            </View>

            {/* Box 2 */}
            <View className="h-20 flex-1 rounded-xl bg-white p-2 justify-between dark:bg-surface-card-dark">
              <Text className="text-xs text-ink-muted">Breath Rate</Text>
              <View className="flex-row items-end justify-between h-8 px-1">
                <View className="h-4 w-1.5 rounded-full bg-safe" />
                <View className="h-5 w-1.5 rounded-full bg-safe" />
                <View className="h-7 w-1.5 rounded-full bg-safe" />
                <View className="h-4 w-1.5 rounded-full bg-safe" />
                <View className="h-6 w-1.5 rounded-full bg-safe" />
              </View>
            </View>
          </View>

          <View className="flex-row flex-wrap gap-2">
            {/* Box 3 */}
            <View className="h-20 flex-1 rounded-xl bg-white p-2 justify-between dark:bg-surface-card-dark">
              <Text className="text-xs text-ink-muted">Temp Trend</Text>
              <View className="flex-row items-end justify-between h-8 px-1">
                <View className="h-5 w-1.5 rounded-full bg-amber-500" />
                <View className="h-5 w-1.5 rounded-full bg-amber-500" />
                <View className="h-6 w-1.5 rounded-full bg-amber-500" />
                <View className="h-5 w-1.5 rounded-full bg-amber-500" />
                <View className="h-5 w-1.5 rounded-full bg-amber-500" />
              </View>
            </View>

            {/* Box 4 */}
            <View className="h-20 flex-1 rounded-xl bg-white p-2 justify-between dark:bg-surface-card-dark">
              <Text className="text-xs text-ink-muted">Heart Pulse</Text>
              <View className="flex-row items-end justify-between h-8 px-1">
                <View className="h-4 w-1.5 rounded-full bg-risk" />
                <View className="h-6 w-1.5 rounded-full bg-risk" />
                <View className="h-5 w-1.5 rounded-full bg-risk" />
                <View className="h-7 w-1.5 rounded-full bg-risk" />
                <View className="h-5 w-1.5 rounded-full bg-risk" />
              </View>
            </View>
          </View>
        </Card>

        {/* 3. AI Summary Card (cough history_user.png) */}
        <Card variant="brand" className="mb-4 rounded-2xl p-4 gap-2">
          <View className="flex-row items-center gap-2">
            <Text className="text-base text-brand">✨</Text>
            <Text className="text-label font-bold text-brand">AI Summary</Text>
          </View>

          <View className="gap-2 pl-1 pt-1">
            <View>
              <Text className="text-caption font-bold text-ink">
                › Condition: {isRisk ? 'At Risk' : 'Normal'}
              </Text>
              <Text className="text-caption text-ink-muted pl-3">
                {isRisk
                  ? 'Abnormal cough patterns indicating pneumonia were detected.'
                  : 'No patterns indicating pneumonia were detected.'}
              </Text>
            </View>

            <View>
              <Text className="text-caption font-bold text-ink">
                › Cough Pattern:
              </Text>
              <Text className="text-caption text-ink-muted pl-3">
                {isRisk
                  ? 'High intensity acoustic bursts with irregular pauses.'
                  : 'Low and stable intensity. No significant spikes in cough frequency.'}
              </Text>
            </View>

            <View>
              <Text className="text-caption font-bold text-ink">
                › Breathing Rate:
              </Text>
              <Text className="text-caption text-ink-muted pl-3">
                Within the normal range for a child's age. Minimal daily variation.
              </Text>
            </View>
          </View>
        </Card>

        {/* 4. All Recordings List (Recording List.png) */}
        <View className="my-2">
          <View className="flex-row items-center justify-between mb-3 border-b border-border pb-2">
            <Text className="text-subtitle font-bold text-ink dark:text-ink-dark">
              Recording List
            </Text>
            <View className="flex-row items-center gap-3">
              <Text className="text-base text-ink-muted">🔍</Text>
              <Text className="text-base text-ink-muted">⋮</Text>
            </View>
          </View>

          {screenings.length === 0 ? (
            <EmptyState
              title="No Recordings"
              body="No cough recordings registered yet."
              className="my-4"
            />
          ) : (
            <View className="gap-1">
              {screenings.map((item, idx) => {
                const date = !isNaN(new Date(item.created_at).getTime())
                  ? new Date(item.created_at)
                  : new Date();
                const title = `Voice ${date.getFullYear().toString().slice(2)}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}_${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}`;
                const dateStr = date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                });
                const duration = `00:${Math.round(item.duration_sec ?? 6).toString().padStart(2, '0')}`;
                const itemRisk = item.result === 'risk';

                return (
                  <Pressable
                    key={item.id}
                    onPress={() => router.push(`/history/${item.id}` as any)}
                    className="flex-row items-center justify-between py-3 border-b border-border/50 active:opacity-75 dark:border-border-dark/50"
                  >
                    <View className="flex-1 pr-3">
                      <Text className="text-body font-bold text-brand dark:text-brand-light">
                        {title}
                      </Text>
                      <Text className="text-caption text-ink-muted mt-0.5">
                        {dateStr}
                      </Text>
                    </View>

                    {/* Play Button Icon + Duration (Recording List.png) */}
                    <View className="items-end gap-1">
                      <View
                        className={`h-8 w-8 items-center justify-center rounded-full ${
                          itemRisk ? 'bg-risk-surface' : 'bg-surface-brand-soft'
                        }`}
                      >
                        <Text className={`text-xs ${itemRisk ? 'text-risk' : 'text-brand'}`}>
                          ▶
                        </Text>
                      </View>
                      <Text className="text-caption text-ink-muted">{duration}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Center Mic Button (Recording List.png) */}
      <View
        style={{ bottom: insets.bottom + 12 }}
        className="absolute left-0 right-0 items-center"
      >
        <Pressable
          onPress={() => router.push('/screening/guide' as any)}
          className="h-16 w-16 items-center justify-center rounded-full bg-brand shadow-xl active:scale-95"
          accessibilityLabel="Rekam Batuk"
        >
          <Text className="text-2xl text-on-brand">🎙️</Text>
        </Pressable>
      </View>
    </View>
  );
}
