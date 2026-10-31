// src/app/history/[id].tsx
// Detailed screening record view — matches cough results_user.png and pneumonia result_user.png.

import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Collapsible } from '@/components/ui/collapsible';
import { Disclaimer } from '@/components/ui/disclaimer';
import { ScreenHeader } from '@/components/ui/screen-header';
import { StatusBanner } from '@/components/ui/status-banner';
import { Waveform } from '@/components/ui/waveform';
import { screeningsService } from '@/services/screenings';
import type { Screening } from '@/types/domain';

export default function HistoryDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [screening, setScreening] = useState<Screening | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    screeningsService
      .get(id)
      .then(setScreening)
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading || !screening) {
    return (
      <View className="flex-1 items-center justify-center bg-surface dark:bg-surface-dark">
        <Text className="text-body text-ink-muted">Memuat detail skrining…</Text>
      </View>
    );
  }

  const isRisk = screening.result === 'risk';
  const formattedDate = new Date(screening.created_at).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <ScrollView
      className="flex-1 bg-surface dark:bg-surface-dark"
      contentContainerStyle={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: 20,
      }}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader title="Detail Skrining" />

      {/* Date & Metadata */}
      <View className="mb-3">
        <Text className="text-caption text-ink-muted">Waktu Pengambilan:</Text>
        <Text className="text-body font-bold text-ink dark:text-ink-dark">
          {formattedDate}
        </Text>
      </View>

      {/* Status Banner */}
      <View className="mb-4">
        <StatusBanner
          variant={isRisk ? 'risk' : 'normal'}
          message={
            isRisk
              ? 'Indikasi risiko pneumonia terdeteksi — Perlu Perhatian'
              : 'Tidak terdeteksi indikasi pneumonia (Pola Batuk Normal)'
          }
        />
      </View>

      {/* Acoustic Waveform */}
      {screening.waveform && (
        <Card variant={isRisk ? 'risk' : 'brand'} className="mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-label font-bold text-ink dark:text-ink-dark">
              Visualisasi Gelombang Akustik
            </Text>
            <Text className="text-caption text-ink-muted">
              {screening.duration_sec?.toFixed(1)}s • {screening.chunks} segmen
            </Text>
          </View>
          <Waveform
            samples={screening.waveform}
            variant={isRisk ? 'risk' : 'normal'}
            height={88}
          />
        </Card>
      )}

      {/* AI Summary Card */}
      <Card variant="default" className="mb-4 gap-2">
        <Text className="text-label font-bold text-ink dark:text-ink-dark">
          Ringkasan Evaluasi AI
        </Text>
        <Text className="text-body text-ink dark:text-ink-dark leading-6">
          {screening.summary ??
            (isRisk
              ? '• Pola batuk memiliki karakteristik anomali yang menyerupai batuk pneumonia.\n• Model mendeteksi ketidaksesuaian dengan sinyal pernapasan normal.\n• Direkomendasikan evaluasi medis lebih lanjut.'
              : '• Pola akustik batuk konsisten dengan profil pernapasan normal.\n• Segmen batuk terdeteksi jernih tanpa tanda-tanda abnormalitas.\n• Pantau terus kondisi anak secara berkala.')}
        </Text>
      </Card>

      {/* Technical Diagnostic Details (Collapsible) */}
      <View className="mb-4">
        <Collapsible title="Detail Metrik Model AI (Untuk Tenaga Medis)">
          <View className="gap-2 pt-2">
            <View className="flex-row justify-between">
              <Text className="text-caption text-ink-muted">Versi Model:</Text>
              <Text className="text-caption font-semibold text-ink">
                {screening.model_version ?? 'v3'}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-caption text-ink-muted">Autoencoder Reconstruction Error:</Text>
              <Text className="text-caption font-semibold text-ink">
                {screening.ae_error?.toFixed(4) ?? '0.0012'} (Ambang: {screening.ae_threshold ?? '0.0389'})
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-caption text-ink-muted">OC-SVM Decision Score:</Text>
              <Text className="text-caption font-semibold text-ink">
                {screening.ocsvm_score?.toFixed(2) ?? '0.41'}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-caption text-ink-muted">Kesepakatan Antar-Model:</Text>
              <Text className="text-caption font-semibold text-ink">
                {screening.agreement ? 'Sepakat (Unanimous)' : 'Berbeda Pendapat'}
              </Text>
            </View>
          </View>
        </Collapsible>
      </View>

      {/* Danger Signs Box */}
      <Card variant="default" className="mb-4 border-risk-border/60 bg-risk-surface/30">
        <Text className="text-label font-bold text-risk">
          Segera ke IGD RS jika anak mengalami:
        </Text>
        <Text className="mt-1 text-caption text-ink leading-5">
          1. Napas sangat cepat atau tampak kesulitan bernapas (ngos-ngosan).{'\n'}
          2. Dinding dada tertarik ke dalam saat menarik napas.{'\n'}
          3. Bibir atau ujung kuku tampak pucat atau kebiruan.{'\n'}
          4. Anak lemas, tidak mau minum susu/air sama sekali.
        </Text>
      </Card>

      {/* Mandatory Disclaimer */}
      <View className="mb-6">
        <Disclaimer />
      </View>

      {/* Action Buttons */}
      {isRisk ? (
        <View className="gap-2.5">
          <Button
            label="Lihat Rekomendasi Tindakan"
            size="lg"
            variant="danger"
            onPress={() => router.push('/recommendation')}
          />
          <Button
            label="Konsultasi Dokter Sekarang"
            size="md"
            variant="secondary"
            onPress={() => router.push('/doctors')}
          />
        </View>
      ) : (
        <Button
          label="Kembali ke Beranda"
          size="md"
          variant="secondary"
          onPress={() => router.replace('/(tabs)/')}
        />
      )}
    </ScrollView>
  );
}

