// src/app/recommendation.tsx
// Recommended Actions screen — matches recommendations page_user.png exactly.

import { router } from 'expo-router';
import { Image, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/card';
import { Disclaimer } from '@/components/ui/disclaimer';
import { ScreenHeader } from '@/components/ui/screen-header';

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
      {/* Header with back and kebab menu (recommendations page_user.png) */}
      <ScreenHeader
        title="Recommended Action"
        rightAction={<Text className="text-xl font-bold text-ink-muted">⋮</Text>}
      />

      {/* Card 1: Risk Notice & Child Photo (recommendations page_user.png) */}
      <View className="my-3 rounded-2xl bg-risk-surface p-4 flex-row items-center justify-between">
        <View className="flex-1 pr-3 gap-2.5">
          <View className="flex-row items-center gap-1.5">
            <View className="h-2.5 w-2.5 rounded-full bg-risk" />
            <Text className="text-caption font-bold text-risk">
              Pneumonia risk detected{'\n'}needs attention
            </Text>
          </View>

          <Pressable
            onPress={() => router.push('/history')}
            className="self-start rounded-pill bg-risk px-4 py-1.5 active:opacity-80"
          >
            <Text className="text-caption font-bold text-white">
              View Detail
            </Text>
          </Pressable>
        </View>

        <Image
          source={require('@/assets/images/image_children.png')}
          style={{ width: 74, height: 74, borderRadius: 20 }}
          resizeMode="cover"
        />
      </View>

      {/* Card 2: Consult with a Doctor (Doctor Photo on LEFT) (recommendations page_user.png) */}
      <View className="mb-4 rounded-2xl bg-risk-surface p-4 flex-row items-center justify-between">
        <Image
          source={require('@/assets/images/image_doctor.png')}
          style={{ width: 80, height: 80, borderRadius: 20 }}
          resizeMode="cover"
        />

        <View className="flex-1 pl-4 gap-2.5 items-start">
          <Text className="text-subtitle font-bold text-risk">
            Consult with a{'\n'}doctor
          </Text>

          <Pressable
            onPress={() => router.push('/doctors')}
            className="rounded-pill bg-risk px-5 py-2 active:opacity-80"
          >
            <Text className="text-caption font-bold text-white">
              Contact Doctor
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Card 3: Visit the Nearest Health Facility (recommendations page_user.png) */}
      <View className="mb-4 rounded-2xl bg-risk-surface p-4 flex-row items-center justify-between">
        <View className="flex-1 pr-3 gap-2.5 items-start">
          <Text className="text-subtitle font-bold text-risk">
            Visit the nearest{'\n'}health facility
          </Text>

          <Pressable
            onPress={() => router.push('/hospitals')}
            className="rounded-pill bg-risk px-5 py-2 active:opacity-80"
          >
            <Text className="text-caption font-bold text-white">
              Find for Hospital
            </Text>
          </Pressable>
        </View>

        <View className="h-20 w-24 rounded-2xl bg-surface items-center justify-center shadow-sm overflow-hidden">
          <Text className="text-4xl">🏥</Text>
        </View>
      </View>

      {/* Emergency 119 Box */}
      <Card variant="default" className="mb-4 border-risk-border bg-risk-surface/30 p-4 gap-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-label font-bold text-risk">
            Layanan Darurat Medis
          </Text>
          <Pressable
            onPress={handleCallEmergency}
            className="rounded-pill bg-risk px-3 py-1 active:opacity-80"
          >
            <Text className="text-caption font-bold text-white">📞 Hubungi 119</Text>
          </Pressable>
        </View>
        <Text className="text-caption text-ink leading-4">
          Segera bawa anak ke IGD bila napas sangat cepat, dinding dada cekung ke dalam, atau bibir kebiruan.
        </Text>
      </Card>

      {/* Mandatory Disclaimer */}
      <View className="mb-4">
        <Disclaimer />
      </View>
    </ScrollView>
  );
}
