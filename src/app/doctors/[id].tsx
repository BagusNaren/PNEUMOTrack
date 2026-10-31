// src/app/doctors/[id].tsx
// Doctor profile detail — matches doctor profile_user.png.

import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Image,
  Linking,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScreenHeader } from '@/components/ui/screen-header';
import { doctorsService } from '@/services/doctors';
import type { Doctor } from '@/types/domain';

export default function DoctorDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    doctorsService
      .get(id)
      .then(setDoctor)
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading || !doctor) {
    return (
      <View className="flex-1 items-center justify-center bg-surface dark:bg-surface-dark">
        <Text className="text-body text-ink-muted">Memuat profil dokter…</Text>
      </View>
    );
  }

  const handlePhone = () => {
    if (doctor.phone) {
      Linking.openURL(`tel:${doctor.phone}`).catch(() => {});
    }
  };

  const handleWhatsApp = () => {
    if (doctor.whatsapp) {
      const text = encodeURIComponent(
        `Halo ${doctor.name}, saya ingin konsultasi terkait hasil skrining batuk anak saya di PNEUMOTrack.`
      );
      Linking.openURL(`https://wa.me/${doctor.whatsapp}?text=${text}`).catch(() => {});
    }
  };

  const handleChat = () => {
    router.push(`/chats/${doctor.id}` as any);
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
      <ScreenHeader title="Detail Dokter" />

      {/* Hero Profile Card */}
      <Card variant="brand" className="my-4 items-center py-6">
        <Image
          source={require('@/assets/images/image_doctor.png')}
          style={{ width: 96, height: 96, borderRadius: 24 }}
        />
        <Text className="mt-3 text-title font-bold text-brand dark:text-brand-light text-center">
          {doctor.name}
        </Text>
        <Text className="text-body font-semibold text-ink-muted text-center">
          {doctor.specialty}
        </Text>
        <Text className="text-caption text-ink-muted text-center mt-0.5">
          {doctor.hospital_name}
        </Text>

        <View className="mt-3 flex-row items-center gap-2">
          <Badge label={`★ ${doctor.rating?.toFixed(1) ?? '4.9'}`} variant="brand" />
          <Badge label="Tersedia untuk Konsultasi" variant="safe" />
        </View>
      </Card>

      {/* About Section */}
      <Card variant="default" className="mb-4 gap-2">
        <Text className="text-label font-bold text-ink dark:text-ink-dark">
          Tentang Dokter
        </Text>
        <Text className="text-body text-ink-muted leading-6">
          {doctor.bio ??
            `${doctor.name} adalah dokter spesialis berpengalaman di bidang kesehatan anak dan infeksi saluran pernapasan pediatrik. Berpraktik di ${doctor.hospital_name} dengan dedikasi tinggi pada penanganan pneumonia dan asma anak.`}
        </Text>
      </Card>

      {/* Schedule Section */}
      <Card variant="default" className="mb-6 gap-2.5">
        <Text className="text-label font-bold text-ink dark:text-ink-dark">
          Jadwal Praktik di Faskes
        </Text>
        {doctor.schedule && doctor.schedule.length > 0 ? (
          <View className="gap-2 pt-1">
            {doctor.schedule.map((item, idx) => (
              <View
                key={idx}
                className="flex-row items-center justify-between py-1.5 border-b border-border/50 dark:border-border-dark/50"
              >
                <Text className="text-body font-medium text-ink dark:text-ink-dark">
                  {item.day}
                </Text>
                <Text className="text-caption font-semibold text-brand dark:text-brand-light">
                  {item.time}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text className="text-caption text-ink-muted">
            Senin - Jumat: 09:00 - 15:00 WITA
          </Text>
        )}
      </Card>

      {/* Action Buttons */}
      <View className="gap-3">
        <Button
          label="Mulai Chat Konsultasi"
          size="lg"
          variant="primary"
          icon={<Text className="text-xl">💬</Text>}
          onPress={handleChat}
        />

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button
              label="WhatsApp"
              size="md"
              variant="secondary"
              onPress={handleWhatsApp}
            />
          </View>
          <View className="flex-1">
            <Button
              label="Telepon Faskes"
              size="md"
              variant="secondary"
              onPress={handlePhone}
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

