// src/app/recommendation.tsx
// Recommended Actions screen — matches recommendations page_user.png.

import { router } from 'expo-router';
import { Image, Linking, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Disclaimer } from '@/components/ui/disclaimer';
import { ScreenHeader } from '@/components/ui/screen-header';
import { StatusBanner } from '@/components/ui/status-banner';

export default function RecommendationScreen() {
  const insets = useSafeAreaInsets();

  const handleCallEmergency = () => {
    Linking.openURL('tel:119').catch(() => {});
  };

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
      <ScreenHeader title="Rekomendasi Tindakan" />

      {/* Summary Risk Banner */}
      <View className="my-3">
        <StatusBanner
          variant="risk"
          message="Indikasi risiko pneumonia terdeteksi — Perlu Perhatian Medis"
        />
      </View>

      {/* Recommendation 1: Konsultasi Dokter */}
      <Card variant="risk" className="mb-4 gap-3 bg-risk-surface border-risk-border">
        <View className="flex-row items-center gap-3">
          <Image
            source={require('@/assets/images/image_doctor.png')}
            style={{ width: 68, height: 68, borderRadius: 18 }}
          />
          <View className="flex-1">
            <Text className="text-subtitle font-bold text-ink dark:text-ink-dark">
              Konsultasi dengan Dokter
            </Text>
            <Text className="text-caption text-ink-muted leading-4 mt-0.5">
              Diskusikan hasil rekaman batuk anak dengan dokter spesialis anak atau paru via chat/telepon.
            </Text>
          </View>
        </View>

        <Button
          label="Mulai Konsultasi Dokter"
          size="md"
          variant="danger"
          onPress={() => router.push('/doctors')}
        />
      </Card>

      {/* Recommendation 2: Kunjungi Fasilitas Kesehatan */}
      <Card variant="default" className="mb-4 gap-3">
        <View className="flex-row items-center gap-3">
          <View className="h-16 w-16 items-center justify-center rounded-2xl bg-surface-brand">
            <Text className="text-3xl">🏥</Text>
          </View>
          <View className="flex-1">
            <Text className="text-subtitle font-bold text-ink dark:text-ink-dark">
              Kunjungi Faskes Terdekat
            </Text>
            <Text className="text-caption text-ink-muted leading-4 mt-0.5">
              Periksakan fisik langsung ke Puskesmas atau RS dengan poli/IGD anak terdekat.
            </Text>
          </View>
        </View>

        <Button
          label="Lihat Daftar & Peta Rumah Sakit"
          size="md"
          variant="primary"
          onPress={() => router.push('/hospitals')}
        />
      </Card>

      {/* Danger Signs & Emergency 119 Box */}
      <Card variant="default" className="mb-5 border-risk-border bg-risk-surface/40 p-4 gap-3">
        <View className="flex-row items-center gap-2">
          <Text className="text-2xl">🚨</Text>
          <Text className="text-subtitle font-bold text-risk">
            Kondisi Darurat (Segera ke IGD)
          </Text>
        </View>

        <View className="gap-1 pl-1">
          <Text className="text-caption text-ink leading-5">
            • Anak bernapas sangat cepat atau terengah-engah.
          </Text>
          <Text className="text-caption text-ink leading-5">
            • Kulit dada atau leher tertarik ke dalam saat bernapas.
          </Text>
          <Text className="text-caption text-ink leading-5">
            • Bibir, lidah, atau kuku berwarna abu-abu atau kebiruan.
          </Text>
          <Text className="text-caption text-ink leading-5">
            • Anak tidak dapat minum, muntah terus-menerus, atau sangat lemas.
          </Text>
        </View>

        <Button
          label="Hubungi Layanan Darurat 119"
          size="md"
          variant="danger"
          icon={<Text className="text-lg">📞</Text>}
          onPress={handleCallEmergency}
        />
      </Card>

      {/* Mandatory Medical Disclaimer */}
      <View className="mb-4">
        <Disclaimer />
      </View>
    </ScrollView>
  );
}

