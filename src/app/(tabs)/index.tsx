// src/app/(tabs)/index.tsx
// Dashboard — matches dashboard_user.png and pneumonia dashboard_user.png.

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

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { HeartGauge } from '@/components/ui/heart-gauge';
import { StatusBanner } from '@/components/ui/status-banner';
import { copy } from '@/constants/copy';
import { useActiveChild } from '@/hooks/use-active-child';
import { useSession } from '@/hooks/use-session';
import { articlesService } from '@/services/articles';
import { screeningsService } from '@/services/screenings';
import type { Article, Screening } from '@/types/domain';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useSession();
  const { activeChild, refresh: refreshChildren } = useActiveChild();

  const [latestScreening, setLatestScreening] = useState<Screening | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      if (activeChild) {
        const scr = await screeningsService.latest(activeChild.id);
        setLatestScreening(scr);
      } else {
        setLatestScreening(null);
      }
      const arts = await articlesService.list();
      setArticles(arts.slice(0, 4));
    } catch {
      // offline / mock fallback handles it
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [activeChild]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await refreshChildren();
    await loadData();
  };

  const isRisk = latestScreening?.result === 'risk';
  const parentName = user?.user_metadata?.full_name ?? 'Bunda';

  // Calculate age string from birth date
  const getAgeString = (birthDateStr: string) => {
    const birth = new Date(birthDateStr);
    const now = new Date();
    const diffMonths =
      (now.getFullYear() - birth.getFullYear()) * 12 +
      (now.getMonth() - birth.getMonth());
    const years = Math.floor(diffMonths / 12);
    const months = diffMonths % 12;
    if (years > 0 && months > 0) return `${years} th ${months} bln`;
    if (years > 0) return `${years} tahun`;
    return `${months} bulan`;
  };

  return (
    <ScrollView
      className="flex-1 bg-surface dark:bg-surface-dark"
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: 20,
      }}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Greeting */}
      <View className="mb-4">
        <Text className="text-caption font-medium text-ink-muted dark:text-ink-dark-muted">
          Hai, {parentName}
        </Text>
        <Text className="text-title font-bold text-ink dark:text-ink-dark">
          {isRisk ? copy.dashboard.subtitleRisk : copy.dashboard.subtitle}
        </Text>
      </View>

      {/* 2. Active Child Hero Card */}
      {activeChild ? (
        <Card
          variant={isRisk ? 'risk' : 'brand'}
          className="mb-4 overflow-hidden"
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3 gap-1">
              <View className="flex-row items-center gap-2">
                <Text
                  className={`text-subtitle font-bold ${
                    isRisk ? 'text-risk dark:text-risk-light' : 'text-brand dark:text-brand-light'
                  }`}
                  numberOfLines={1}
                >
                  {activeChild.name}
                </Text>
              </View>
              <View className="flex-row items-center gap-1.5 flex-wrap">
                <View className="rounded-pill bg-white/70 px-2.5 py-0.5 dark:bg-black/20">
                  <Text className="text-caption font-semibold text-ink">
                    {getAgeString(activeChild.birth_date)}
                  </Text>
                </View>
                <View className="rounded-pill bg-white/70 px-2.5 py-0.5 dark:bg-black/20">
                  <Text className="text-caption text-ink-muted">
                    {activeChild.sex === 'male' ? 'Laki-laki' : 'Perempuan'}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => router.push('/(tabs)/children')}
                className="mt-2 self-start active:opacity-70"
              >
                <Text className="text-caption font-semibold text-brand underline dark:text-brand-light">
                  Ganti profil anak ›
                </Text>
              </Pressable>
            </View>

            <Image
              source={require('@/assets/images/image_children.png')}
              style={{ width: 84, height: 84, borderRadius: 16 }}
              resizeMode="cover"
            />
          </View>
        </Card>
      ) : (
        <Card variant="brand" className="mb-4 items-center py-5">
          <Text className="text-subtitle font-bold text-brand">
            {copy.dashboard.noChildTitle}
          </Text>
          <Text className="mt-1 text-center text-body text-ink-muted">
            {copy.dashboard.noChildBody}
          </Text>
          <Button
            label={copy.dashboard.addChildButton}
            size="sm"
            className="mt-3"
            onPress={() => router.push('/children/new')}
          />
        </Card>
      )}

      {/* 3. Screening Health / Vitals Card */}
      <Card variant="default" className="mb-4">
        <View className="flex-row items-center justify-between pb-3 border-b border-border dark:border-border-dark">
          <Text className="text-label font-bold text-ink dark:text-ink-dark">
            {copy.dashboard.sectionStatus}
          </Text>
          <Pressable
            onPress={() => router.push('/history')}
            className="active:opacity-70"
          >
            <Text className="text-caption font-semibold text-brand dark:text-brand-light">
              Semua Riwayat ›
            </Text>
          </Pressable>
        </View>

        <View className="flex-row items-center justify-between pt-4">
          <View className="flex-1 pr-4 gap-2">
            {latestScreening ? (
              <>
                <View>
                  <Text className="text-caption text-ink-muted">
                    {copy.dashboard.lastScreening}
                  </Text>
                  <Text className="text-body font-bold text-ink dark:text-ink-dark">
                    {new Date(latestScreening.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                </View>

                <View>
                  <Text className="text-caption text-ink-muted">Pola Batuk</Text>
                  <Text
                    className={`text-body font-semibold ${
                      isRisk ? 'text-risk font-bold' : 'text-safe font-bold'
                    }`}
                  >
                    {isRisk ? 'Pola tidak biasa' : 'Pola normal'}
                  </Text>
                </View>

                <View>
                  <Text className="text-caption text-ink-muted">Konsistensi Model</Text>
                  <Text className="text-caption font-medium text-ink">
                    {latestScreening.agreement ? 'Model Sepakat' : 'Perlu Konfirmasi'}
                  </Text>
                </View>
              </>
            ) : (
              <View className="py-2">
                <Text className="text-body font-medium text-ink-muted">
                  {copy.dashboard.noScreeningYet}
                </Text>
                <Text className="text-caption text-ink-muted mt-1">
                  Mulai skrining untuk memantau kesehatan paru anak Anda.
                </Text>
              </View>
            )}
          </View>

          <HeartGauge
            variant={!latestScreening ? 'pending' : isRisk ? 'risk' : 'normal'}
            size={110}
          />
        </View>
      </Card>

      {/* 4. Risk Alert Banner (If risk detected) */}
      {isRisk && (
        <Card variant="risk" className="mb-4 gap-2 border-risk-border bg-risk-surface">
          <StatusBanner
            variant="risk"
            message="Indikasi risiko pneumonia terdeteksi pada batuk si kecil"
          />
          <Text className="text-caption text-ink">
            Disarankan untuk berkonsultasi dengan dokter spesialis anak atau kunjungi fasilitas kesehatan terdekat.
          </Text>
          <Button
            label="Lihat Rekomendasi Tindakan"
            variant="danger"
            size="md"
            className="mt-1"
            onPress={() => router.push('/recommendation')}
          />
        </Card>
      )}

      {/* 5. Big Primary Action: Rekam Batuk */}
      <View className="mb-6">
        <Button
          label={copy.dashboard.recordButton}
          size="lg"
          variant="primary"
          icon={<Text className="text-xl">🎙</Text>}
          onPress={() => router.push('/screening/guide' as any)}
        />
      </View>

      {/* 6. Quick Action Navigation Row */}
      <View className="mb-6 flex-row gap-2.5">
        <Pressable
          onPress={() => router.push('/doctors')}
          className="flex-1 items-center justify-center rounded-card border border-border bg-surface-card p-3 active:opacity-70 dark:border-border-dark dark:bg-surface-card-dark"
        >
          <Text className="text-2xl mb-1">👨‍⚕️</Text>
          <Text className="text-caption font-semibold text-ink dark:text-ink-dark">
            Dokter
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/hospitals')}
          className="flex-1 items-center justify-center rounded-card border border-border bg-surface-card p-3 active:opacity-70 dark:border-border-dark dark:bg-surface-card-dark"
        >
          <Text className="text-2xl mb-1">🏥</Text>
          <Text className="text-caption font-semibold text-ink dark:text-ink-dark">
            Faskes
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/chats')}
          className="flex-1 items-center justify-center rounded-card border border-border bg-surface-card p-3 active:opacity-70 dark:border-border-dark dark:bg-surface-card-dark"
        >
          <Text className="text-2xl mb-1">💬</Text>
          <Text className="text-caption font-semibold text-ink dark:text-ink-dark">
            Pesan
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/history')}
          className="flex-1 items-center justify-center rounded-card border border-border bg-surface-card p-3 active:opacity-70 dark:border-border-dark dark:bg-surface-card-dark"
        >
          <Text className="text-2xl mb-1">📋</Text>
          <Text className="text-caption font-semibold text-ink dark:text-ink-dark">
            Riwayat
          </Text>
        </Pressable>
      </View>

      {/* 7. Artikel & Berita Carousel */}
      <View className="mb-2">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-subtitle font-bold text-ink dark:text-ink-dark">
            {copy.dashboard.sectionArticles}
          </Text>
          <Pressable
            onPress={() => router.push('/articles')}
            className="active:opacity-70"
          >
            <Text className="text-caption font-semibold text-brand dark:text-brand-light">
              Lihat Semua ›
            </Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="-mx-5 px-5"
          contentContainerStyle={{ gap: 12 }}
        >
          {articles.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => router.push(`/articles/${item.id}` as any)}
              className="w-44 rounded-card border border-border bg-surface-card p-3 active:opacity-70 dark:border-border-dark dark:bg-surface-card-dark"
            >
              <View className="h-24 w-full rounded-xl bg-surface-brand-soft items-center justify-center mb-2 overflow-hidden">
                <Text className="text-3xl">📄</Text>
              </View>
              <View className="rounded-pill self-start bg-surface-brand-soft px-2 py-0.5 mb-1.5">
                <Text className="text-caption font-medium text-brand">
                  {item.category}
                </Text>
              </View>
              <Text
                numberOfLines={2}
                className="text-label font-semibold text-ink dark:text-ink-dark"
              >
                {item.title}
              </Text>
              <Text className="mt-1 text-caption text-ink-muted">
                {item.source ?? 'PNEUMOTrack'}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

