// src/app/(tabs)/index.tsx
// Dashboard — pixel-matched with dashboard_user.png, pneumonia dashboard_user.png, and information_user.png.

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
import { useActiveChild } from '@/hooks/use-active-child';
import { useSession } from '@/hooks/use-session';
import { articlesService } from '@/services/articles';
import { screeningsService } from '@/services/screenings';
import type { Article, Screening } from '@/types/domain';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useSession();
  const { activeChild, children, setActiveChild, refresh: refreshChildren } = useActiveChild();

  const [latestScreening, setLatestScreening] = useState<Screening | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showChildPicker, setShowChildPicker] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [scr, arts] = await Promise.all([
        activeChild ? screeningsService.latest(activeChild.id) : Promise.resolve(null),
        articlesService.list(),
      ]);
      setLatestScreening(scr);
      setArticles(arts);
    } catch {
      // Fallback handled by empty/default states
    } finally {
      setIsRefreshing(false);
    }
  }, [activeChild]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [scr, arts] = await Promise.all([
          activeChild ? screeningsService.latest(activeChild.id) : Promise.resolve(null),
          articlesService.list(),
        ]);
        if (!active) return;
        setLatestScreening(scr);
        setArticles(arts);
      } catch {
        // Fallback handled by empty/default states
      }
    })();
    return () => {
      active = false;
    };
  }, [activeChild]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await refreshChildren();
    await loadData();
  };

  const isRisk = latestScreening?.result === 'risk';
  const parentName = user?.user_metadata?.full_name?.split(' ')[0] ?? 'Bianca';

  return (
    <ScrollView
      className="flex-1 bg-surface dark:bg-surface-dark"
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: 20,
      }}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      <View className="mb-4 flex-row items-center justify-between">
        <View>
          <Text className="text-title font-bold text-ink dark:text-ink-dark">
            Hi, {parentName}!
          </Text>
          <Text className="text-caption text-ink-muted">
            {"Here's your child's status."}
          </Text>
        </View>

        <Pressable
          onPress={() => router.push('/(tabs)/more')}
          className="h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-card active:opacity-70 dark:border-border-dark dark:bg-surface-card-dark"
          accessibilityLabel="Profil & Pengaturan"
        >
          <Text className="text-base">🔔</Text>
        </Pressable>
      </View>

      <Card
        variant={isRisk ? 'risk' : 'brand'}
        className="mb-4 overflow-hidden rounded-2xl"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Pressable
              onPress={() => setShowChildPicker((prev) => !prev)}
              className="flex-row items-center gap-2 active:opacity-75"
            >
              <View className="h-3 w-3 rounded-full bg-brand dark:bg-brand-light" />
              <Text className="text-subtitle font-bold text-ink dark:text-ink-dark">
                {activeChild ? activeChild.name : 'Pilih Anak'}
              </Text>
              <Text className="text-xs text-ink-muted">
                {showChildPicker ? '▲' : '▼'}
              </Text>
            </Pressable>

            <View className="mt-1 flex-row items-center gap-1.5">
              <View
                className={`h-2 w-2 rounded-full ${
                  isRisk ? 'bg-risk' : 'bg-safe'
                }`}
              />
              <Text
                className={`text-caption font-semibold ${
                  isRisk ? 'text-risk' : 'text-brand dark:text-brand-light'
                }`}
              >
                {isRisk
                  ? 'Pneumonia risk detected - needs attention'
                  : 'No Sign of Pneumonia detected'}
              </Text>
            </View>

            {showChildPicker && (
              <View className="mt-3 pt-2 border-t border-border/50 gap-2">
                {children.map((c) => (
                  <Pressable
                    key={c.id}
                    onPress={() => {
                      setActiveChild(c);
                      setShowChildPicker(false);
                    }}
                    className="flex-row items-center justify-between py-1"
                  >
                    <Text
                      className={`text-caption ${
                        activeChild?.id === c.id
                          ? 'font-bold text-brand'
                          : 'text-ink-muted'
                      }`}
                    >
                      {activeChild?.id === c.id ? '● ' : '○ '}
                      {c.name}
                    </Text>
                  </Pressable>
                ))}
                <Pressable
                  onPress={() => {
                    setShowChildPicker(false);
                    router.push('/children/new');
                  }}
                  className="pt-1 active:opacity-70"
                >
                  <Text className="text-caption font-bold text-brand">
                    + Tambah Anak Baru
                  </Text>
                </Pressable>
              </View>
            )}
          </View>

          <Image
            source={require('@/assets/images/image_children.png')}
            style={{ width: 80, height: 80, borderRadius: 20 }}
            resizeMode="cover"
          />
        </View>
      </Card>

      <Card
        variant={isRisk ? 'risk' : 'brand'}
        className="mb-5 rounded-2xl p-5"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3 gap-2.5">
            <View className="flex-row items-center gap-2.5">
              <Text className="text-base">{isRisk ? '⚠️' : '🫁'}</Text>
              <Text
                className={`text-caption font-bold ${
                  isRisk ? 'text-risk' : 'text-safe'
                }`}
              >
                {isRisk ? 'Pneumonia Indicated' : 'Air Good'}
              </Text>
            </View>

            <View className="flex-row items-center gap-2.5">
              <Text className="text-base">🫁</Text>
              <Text className="text-caption font-semibold text-ink">
                {isRisk ? '55 /min' : '20 /min'}
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
                {isRisk ? '120 bpm' : '85 bpm'}
              </Text>
            </View>

            <View className="mt-2 flex-row items-center gap-2">
              <Pressable
                onPress={() =>
                  isRisk
                    ? router.push('/recommendation')
                    : latestScreening
                    ? router.push(`/history/${latestScreening.id}` as any)
                    : router.push('/history')
                }
                className={`rounded-pill px-4 py-2 active:opacity-80 ${
                  isRisk ? 'bg-risk' : 'bg-brand'
                }`}
              >
                <Text className="text-caption font-bold text-white">
                  {isRisk ? 'Recommendation Action' : 'View Detail'}
                </Text>
              </Pressable>

              <Pressable
                onPress={onRefresh}
                className={`h-8 w-8 items-center justify-center rounded-full ${
                  isRisk ? 'bg-risk' : 'bg-brand'
                } active:opacity-80`}
                accessibilityLabel="Refresh"
              >
                <Text className="text-xs text-white">🔄</Text>
              </Pressable>

              <Pressable
                onPress={() => router.push('/screening/guide' as any)}
                className={`h-8 w-8 items-center justify-center rounded-full ${
                  isRisk ? 'bg-risk' : 'bg-brand'
                } active:opacity-80`}
                accessibilityLabel="Rekam Batuk"
              >
                <Text className="text-xs text-white">🎙️</Text>
              </Pressable>
            </View>
          </View>

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

      <View className="mb-2">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-subtitle font-bold text-ink dark:text-ink-dark">
            Article & News
          </Text>
          <Pressable
            onPress={() => router.push('/articles')}
            className="active:opacity-70"
          >
            <Text className="text-caption font-semibold text-brand dark:text-brand-light">
              See all
            </Text>
          </Pressable>
        </View>

        <View className="gap-3">
          {articles.slice(0, 3).map((item) => (
            <Pressable
              key={item.id}
              onPress={() => router.push(`/articles/${item.id}` as any)}
              className="flex-row items-center gap-3 rounded-card border border-border bg-surface-card p-3 active:opacity-75 dark:border-border-dark dark:bg-surface-card-dark"
            >
              <View className="h-16 w-16 rounded-xl bg-surface-brand-soft items-center justify-center">
                <Text className="text-3xl">🫁</Text>
              </View>

              <View className="flex-1 pr-1">
                <Text
                  numberOfLines={2}
                  className="text-label font-bold text-ink dark:text-ink-dark"
                >
                  {item.title}
                </Text>
                <Text className="mt-1 text-caption text-ink-muted">
                  {(!isNaN(new Date(item.published_at).getTime())
                    ? new Date(item.published_at)
                    : new Date()
                  ).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}{' '}
                  • 5 min read
                </Text>
              </View>

              <Text className="text-base text-icon-muted">🔖</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
