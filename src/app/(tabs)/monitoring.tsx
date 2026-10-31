// src/app/(tabs)/monitoring.tsx
// Live Monitoring screen — matches cough analysis_user.png exactly.

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
import { HeartGauge } from '@/components/ui/heart-gauge';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Waveform } from '@/components/ui/waveform';
import { useActiveChild } from '@/hooks/use-active-child';
import { screeningsService } from '@/services/screenings';
import type { Screening } from '@/types/domain';

export default function MonitoringScreen() {
  const insets = useSafeAreaInsets();
  const { activeChild } = useActiveChild();

  const [latestScreening, setLatestScreening] = useState<Screening | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadLatest = useCallback(async () => {
    if (!activeChild) return;
    try {
      const scr = await screeningsService.latest(activeChild.id);
      setLatestScreening(scr);
    } catch {
      // ignore
    } finally {
      setIsRefreshing(false);
    }
  }, [activeChild]);

  useEffect(() => {
    loadLatest();
  }, [loadLatest]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadLatest();
  };

  const isRisk = latestScreening?.result === 'risk';

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
        title="Monitoring"
        showBack={false}
        rightAction={<Text className="text-xl font-bold text-ink-muted">⋮</Text>}
      />

      {/* 1. Top Card: Mode Switcher & Child Photo (cough analysis_user.png) */}
      <Card variant={isRisk ? 'risk' : 'brand'} className="mb-4 rounded-2xl p-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3 gap-2">
            <View className="flex-row items-center gap-2">
              <View className="rounded-pill bg-brand px-3 py-1 shadow-sm">
                <Text className="text-caption font-bold text-on-brand">
                  Live Monitoring
                </Text>
              </View>
              <Pressable
                onPress={() => router.push('/history')}
                className="rounded-pill bg-white/70 px-3 py-1 active:opacity-75 dark:bg-black/20"
              >
                <Text className="text-caption font-semibold text-ink-muted">
                  History
                </Text>
              </Pressable>
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
                  ? 'Pneumonia risk detected - needs attention'
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

      {/* 2. Middle Card: Vitals Rows + Button + Concentric Heart Gauge (cough analysis_user.png) */}
      <Card variant={isRisk ? 'risk' : 'brand'} className="mb-4 rounded-2xl p-5">
        <View className="items-center mb-3">
          <View className="h-1 w-12 rounded-full bg-border/60" />
        </View>

        <View className="flex-row items-center justify-between">
          {/* Left Rows */}
          <View className="flex-1 pr-3 gap-2.5">
            <View className="flex-row items-center gap-2.5">
              <Text className="text-base">{isRisk ? '⚠️' : '🫁'}</Text>
              <Text
                className={`text-caption font-bold ${
                  isRisk ? 'text-risk' : 'text-safe'
                }`}
              >
                {isRisk ? 'Pneumonia Indicated' : 'All Good'}
              </Text>
            </View>

            <View className="flex-row items-center gap-2.5">
              <Text className="text-base">🫁</Text>
              <Text className="text-caption font-semibold text-ink">
                {isRisk ? '55 /min' : '27 /min'}
              </Text>
            </View>

            <View className="flex-row items-center gap-2.5">
              <Text className="text-base">🌡️</Text>
              <Text className="text-caption font-semibold text-ink">
                {isRisk ? '38.1°C' : '36.6°C'}
              </Text>
            </View>

            <View className="flex-row items-center gap-2.5">
              <Text className="text-base">💓</Text>
              <Text className="text-caption font-semibold text-ink">
                {isRisk ? '120 bpm' : '90 bpm'}
              </Text>
            </View>

            {/* Buttons */}
            <View className="mt-2 flex-row items-center gap-2">
              <Pressable
                onPress={() =>
                  latestScreening
                    ? router.push(`/history/${latestScreening.id}` as any)
                    : router.push('/history')
                }
                className={`rounded-pill px-4 py-2 active:opacity-80 ${
                  isRisk ? 'bg-risk' : 'bg-brand'
                }`}
              >
                <Text className="text-caption font-bold text-white">
                  View Detail
                </Text>
              </Pressable>

              <Pressable
                onPress={onRefresh}
                className={`h-8 w-8 items-center justify-center rounded-full ${
                  isRisk ? 'bg-risk' : 'bg-brand'
                } active:opacity-80`}
              >
                <Text className="text-xs text-white">🔄</Text>
              </Pressable>

              <Pressable
                onPress={() => router.push('/screening/guide' as any)}
                className={`h-8 w-8 items-center justify-center rounded-full ${
                  isRisk ? 'bg-risk' : 'bg-brand'
                } active:opacity-80`}
              >
                <Text className="text-xs text-white">🎙️</Text>
              </Pressable>
            </View>
          </View>

          {/* Right Heart Gauge */}
          <View className="items-center justify-center">
            <HeartGauge
              variant={!latestScreening ? 'pending' : isRisk ? 'risk' : 'normal'}
              size={110}
            />
            <Text
              className={`mt-2 text-center text-caption font-bold ${
                isRisk ? 'text-risk' : 'text-brand dark:text-brand-light'
              }`}
            >
              {isRisk ? 'At Risk of\nPneumonia' : 'No Sign of\nPneumonia'}
            </Text>
          </View>
        </View>
      </Card>

      {/* 3. Bottom Waveform Card (cough analysis_user.png) */}
      <Card variant="brand" className="mb-4 rounded-2xl p-4">
        <Text className="text-caption font-bold text-brand mb-2">
          Real-time Acoustic Waveform
        </Text>
        <View className="rounded-xl bg-white p-3 dark:bg-surface-card-dark">
          <Waveform
            data={
              latestScreening?.waveform ??
              Array.from({ length: 60 }, (_, i) => Math.sin(i * 0.3) * 0.5 + 0.5)
            }
            variant={isRisk ? 'risk' : 'normal'}
            height={90}
          />
        </View>
      </Card>
    </ScrollView>
  );
}
