// src/app/chats/index.tsx
// Chat conversations list — matches chat list_user.png.

import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Image,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ListRow } from '@/components/ui/list-row';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SegmentedTabs } from '@/components/ui/segmented-tabs';
import { useSession } from '@/hooks/use-session';
import { chatService } from '@/services/chat';
import type { Conversation } from '@/types/domain';

type ChatTab = 'all' | 'doctors' | 'active';

export default function ChatsListScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useSession();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeTab, setActiveTab] = useState<ChatTab>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    try {
      const parentId = user?.id ?? 'user-demo';
      const list = await chatService.listConversations(parentId);
      setConversations(list);
    } catch {
      // fallback
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadConversations();
  };

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
        title="Pesan Konsultasi"
        subtitle="Diskusi hasil skrining dengan dokter"
      />

      {/* Tabs */}
      <View className="my-4">
        <SegmentedTabs
          options={[
            { key: 'all', label: 'Semua Pesan' },
            { key: 'doctors', label: 'Dokter Spesialis' },
            { key: 'active', label: 'Konsultasi Aktif' },
          ]}
          value={activeTab}
          onChange={(k) => setActiveTab(k as ChatTab)}
        />
      </View>

      {/* Conversations List */}
      {conversations.length === 0 ? (
        <EmptyState
          title="Belum Ada Pesan"
          body="Anda belum memulai konsultasi chat dengan dokter spesialis."
          actionLabel="Pilih Dokter untuk Konsultasi"
          onAction={() => router.push('/doctors')}
          className="my-8"
        />
      ) : (
        <Card variant="default" className="p-1 mb-4">
          {conversations.map((item, idx) => {
            const docName = item.doctor?.name ?? 'dr. Spesialis Anak';
            const lastMsg = item.last_message?.content ?? 'Halo Bunda, ada yang bisa dibantu?';
            const timeStr = item.last_message?.created_at
              ? new Date(item.last_message.created_at).toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Baru saja';

            return (
              <ListRow
                key={item.id}
                onPress={() => router.push(`/chats/${item.doctor_id}` as any)}
                leading={
                  <View className="relative">
                    <Image
                      source={require('@/assets/images/image_doctor.png')}
                      style={{ width: 52, height: 52, borderRadius: 26 }}
                    />
                    <View className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-safe dark:border-surface-dark" />
                  </View>
                }
                title={docName}
                subtitle={
                  <Text numberOfLines={1} className="text-caption text-ink-muted">
                    {lastMsg}
                  </Text>
                }
                trailing={
                  <View className="items-end gap-1">
                    <Text className="text-caption text-ink-muted">{timeStr}</Text>
                    {item.unread_count && item.unread_count > 0 ? (
                      <View className="h-5 min-w-[20px] items-center justify-center rounded-full bg-brand px-1.5">
                        <Text className="text-caption font-bold text-on-brand">
                          {item.unread_count}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                }
                className={idx === conversations.length - 1 ? 'border-b-0' : ''}
              />
            );
          })}
        </Card>
      )}
    </ScrollView>
  );
}

