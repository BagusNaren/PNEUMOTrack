// src/app/(tabs)/monitoring.tsx
// Live Monitoring screen — matches cough analysis_user.png.

import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { HeartGauge } from '@/components/ui/heart-gauge';
import { ScreenHeader } from '@/components/ui/screen-header';
import { StatusBanner } from '@/components/ui/status-banner';
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
      <ScreenHeader title="Monitoring Batuk" showBack={false} />

      {/* Child Name & Mode Badge */}
      <View className="mb-4 flex-row items-center justify-between">
        <View>
          <Text className="text-caption text-ink-muted">Anak yang Dipantau</Text>
          <Text className="text-subtitle font-bold text-ink dark:text-ink-dark">
            {activeChild ? activeChild.name : 'Belum Ada Anak Dipilih'}
          </Text>
        </View>
        <View className="flex-row items-center gap-1.5 rounded-pill bg-safe/10 px-3 py-1">
          <View className="h-2 w-2 rounded-full bg-safe" />
          <Text className="text-caption font-semibold text-safe">Live Monitor</Text>
        </View>
      </View>

      {/* Status Banner */}
      <View className="mb-4">
        <StatusBanner
          variant={!latestScreening ? 'pending' : isRisk ? 'risk' : 'normal'}
          message={
            !latestScreening
              ? 'Belum ada data skrining untuk anak ini'
              : isRisk
              ? 'Indikasi pola batuk tidak biasa terdeteksi — Perlu Perhatian'
              : 'Pola batuk anak dalam kondisi normal'
          }
        />
      </View>

      {/* Status Summary Card */}
      <Card variant="default" className="mb-4 items-center py-5">
        <HeartGauge
          variant={!latestScreening ? 'pending' : isRisk ? 'risk' : 'normal'}
          size={120}
        />
        <Text className="mt-3 text-subtitle font-bold text-ink dark:text-ink-dark">
          {!latestScreening
            ? 'Menunggu Skrining'
            : isRisk
            ? 'Risiko Pneumonia Terdeteksi'
            : 'Pola Batuk Normal'}
        </Text>
        <Text className="mt-1 text-center text-caption text-ink-muted px-4">
          {!latestScreening
            ? 'Mulai skrining batuk si kecil untuk melihat grafik frekuensi dan analisis AI.'
            : isRisk
            ? 'Pola batuk menunjukkan anomali yang menyerupai batuk pneumonia. Konsultasikan dengan tenaga medis.'
            : 'Sinyal akustik batuk cocok dengan profil pernapasan sehat.'}
        </Text>
      </Card>

      {/* Acoustic Waveform Card */}
      {latestScreening?.waveform ? (
        <Card variant={isRisk ? 'risk' : 'brand'} className="mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-label font-bold text-ink dark:text-ink-dark">
              Sinyal Akustik Batuk Terakhir
            </Text>
            <Text className="text-caption text-ink-muted">
              {latestScreening.duration_sec?.toFixed(1)}s • {latestScreening.chunks} segmen
            </Text>
          </View>
          <Waveform
            samples={latestScreening.waveform}
            variant={isRisk ? 'risk' : 'normal'}
            height={80}
          />
        </Card>
      ) : null}

      {/* Observational Guidelines */}
      <Card variant="default" className="mb-5 gap-2">
        <Text className="text-label font-bold text-ink dark:text-ink-dark">
          Tanda Bahaya yang Wajib Diwaspadai:
        </Text>
        <View className="gap-1.5 pl-1">
          <Text className="text-caption text-ink leading-5">
            • <Text className="font-semibold">Napas cepat atau sesak:</Text> Anak bernapas lebih cepat dari biasanya saat istirahat.
          </Text>
          <Text className="text-caption text-ink leading-5">
            • <Text className="font-semibold">Tarikan dinding dada:</Text> Kulit di antara iga atau bawah dada tertarik ke dalam saat menarik napas.
          </Text>
          <Text className="text-caption text-ink leading-5">
            • <Text className="font-semibold">Bibir atau kuku kebiruan (Sianosis):</Text> Segera bawa ke IGD RS terdekat.
          </Text>
        </View>
      </Card>

      {/* Action CTA */}
      <View className="gap-2.5">
        <Button
          label="Mulai Skrining Batuk Sekarang"
          size="lg"
          variant="primary"
          icon={<Text className="text-xl">🎙</Text>}
          onPress={() => router.push('/screening/guide' as any)}
        />
        {isRisk && (
          <Button
            label="Lihat Rekomendasi Dokter & RS"
            size="md"
            variant="danger"
            onPress={() => router.push('/recommendation')}
          />
        )}
      </View>
    </ScrollView>
  );
}

