// src/app/(tabs)/more.tsx
// More / Menu sheet screen — settings, medical disclaimer, about, logout.

import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/card';
import { Disclaimer } from '@/components/ui/disclaimer';
import { ScreenHeader } from '@/components/ui/screen-header';
import { copy } from '@/constants/copy';
import { useSession } from '@/hooks/use-session';

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useSession();

  const handleSignOut = () => {
    Alert.alert(copy.auth.signOut, copy.auth.signOutConfirm, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/sign-in');
        },
      },
    ]);
  };

  const menuItems = [
    {
      icon: '👨‍⚕️',
      title: 'Dokter Spesialis',
      subtitle: 'Konsultasi dokter spesialis anak & paru',
      route: '/doctors',
    },
    {
      icon: '🏥',
      title: 'Fasilitas Kesehatan & RS',
      subtitle: 'Daftar dan peta rumah sakit terdekat',
      route: '/hospitals',
    },
    {
      icon: '💬',
      title: 'Pesan & Konsultasi',
      subtitle: 'Riwayat percakapan dengan dokter',
      route: '/chats',
    },
    {
      icon: '📰',
      title: 'Artikel & Edukasi',
      subtitle: 'Panduan pneumonia anak dari IDAI & Kemenkes',
      route: '/articles',
    },
    {
      icon: '📋',
      title: 'Semua Riwayat Skrining',
      subtitle: 'Catatan hasil deteksi batuk si kecil',
      route: '/history',
    },
  ];

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
      <ScreenHeader title="Menu & Pengaturan" showBack={false} />

      {/* User Profile Card */}
      <Card variant="brand" className="mb-5 flex-row items-center gap-3">
        <View className="h-14 w-14 items-center justify-center rounded-full bg-brand">
          <Text className="text-2xl text-on-brand">👤</Text>
        </View>
        <View className="flex-1">
          <Text className="text-subtitle font-bold text-brand dark:text-brand-light">
            {user?.user_metadata?.full_name ?? 'Bunda Maya'}
          </Text>
          <Text className="text-caption text-ink-muted">
            {user?.email ?? 'demo@pneumotrack.id'}
          </Text>
          <View className="mt-1 self-start rounded-pill bg-white/70 px-2 py-0.5 dark:bg-black/20">
            <Text className="text-caption font-semibold text-safe">Akun Terverifikasi</Text>
          </View>
        </View>
      </Card>

      {/* Menu List */}
      <View className="mb-5 gap-2">
        <Text className="text-label font-bold text-ink-muted uppercase tracking-wider mb-1">
          Layanan & Fitur
        </Text>
        {menuItems.map((item) => (
          <Pressable
            key={item.route}
            onPress={() => router.push(item.route as any)}
            className="flex-row items-center gap-3.5 rounded-card border border-border bg-surface-card p-4 active:opacity-70 dark:border-border-dark dark:bg-surface-card-dark"
          >
            <Text className="text-2xl">{item.icon}</Text>
            <View className="flex-1">
              <Text className="text-label font-bold text-ink dark:text-ink-dark">
                {item.title}
              </Text>
              <Text className="text-caption text-ink-muted">
                {item.subtitle}
              </Text>
            </View>
            <Text className="text-xl text-icon-muted">›</Text>
          </Pressable>
        ))}
      </View>

      {/* About & Medical Disclaimer */}
      <View className="mb-5 gap-2">
        <Text className="text-label font-bold text-ink-muted uppercase tracking-wider mb-1">
          Informasi & Keamanan
        </Text>
        <Card variant="default" className="gap-2.5">
          <Text className="text-label font-bold text-ink dark:text-ink-dark">
            Tentang PNEUMOTrack
          </Text>
          <Text className="text-caption text-ink-muted leading-5">
            PNEUMOTrack adalah aplikasi skrining awal risiko pneumonia pada anak berbasis analisis akustik batuk dengan kecerdasan buatan (AI).
          </Text>
          <Disclaimer />
        </Card>
      </View>

      {/* Logout */}
      <Pressable
        onPress={handleSignOut}
        className="h-12 flex-row items-center justify-center rounded-pill border border-risk-border bg-risk-surface/40 active:opacity-70"
      >
        <Text className="text-label font-bold text-risk dark:text-risk-light">
          {copy.auth.signOut}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

