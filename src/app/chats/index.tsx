// src/app/chats/index.tsx
// Chat list screen — matches chat list_user.png.

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

import { EmptyState } from '@/components/ui/empty-state';
import { SegmentedTabs } from '@/components/ui/segmented-tabs';
import { useSession } from '@/hooks/use-session';
import { chatService } from '@/services/chat';
import type { Conversation } from '@/types/domain';

type ChatTab = 'all' | 'group' | 'people';

export default function ChatsListScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useSession();
  const parentId = user?.id ?? 'user-demo';

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeTab, setActiveTab] = useState<ChatTab>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadConversations = useCallback(async () => {
    try {
      const list = await chatService.listConversations(parentId);
      setConversations(list);
    } catch {
      // Fallback handled by empty state
    } finally {
      setIsRefreshing(false);
    }
  }, [parentId]);

  useEffect(() => {
    let active = true;
    chatService
      .listConversations(parentId)
      .then((list) => {
        if (active) setConversations(list);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [parentId]);

  const onRefresh = () => {
    setIsRefreshing(true);
    void loadConversations();
  };

  return (
    <View className="flex-1 bg-surface dark:bg-surface-dark">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 90,
          paddingHorizontal: 20,
        }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-display font-bold text-ink dark:text-ink-dark">
            Message
          </Text>
          <Pressable
            onPress={() => router.push('/doctors')}
            className="h-10 w-10 items-center justify-center rounded-full bg-surface-muted active:opacity-70 dark:bg-surface-card-dark"
          >
            <Text className="text-lg text-ink">🔍</Text>
          </Pressable>
        </View>

        <View className="mb-5">
          <SegmentedTabs
            options={[
              { key: 'all', label: 'All' },
              { key: 'group', label: 'Group' },
              { key: 'people', label: 'People' },
            ]}
            value={activeTab}
            onChange={(k) => setActiveTab(k as ChatTab)}
          />
        </View>

        {conversations.length === 0 ? (
          <EmptyState
            title="No Messages"
            body="Start a consultation with a specialist doctor."
            actionLabel="Choose Doctor"
            onAction={() => router.push('/doctors')}
            className="my-8"
          />
        ) : (
          <View className="gap-1">
            {conversations.map((item) => {
              const docName = item.doctor?.name ?? 'Dr. Ichi Ni San';
              const lastMsg =
                item.last_message?.content ??
                "I have read your child's test results...";
              const time = item.last_message?.created_at
                ? new Date(item.last_message.created_at).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  })
                : '10.20';

              return (
                <Pressable
                  key={item.id}
                  onPress={() => router.push(`/chats/${item.doctor_id}` as any)}
                  className="flex-row items-center gap-3.5 py-3 border-b border-border/50 active:opacity-75 dark:border-border-dark/50"
                >
                  <Image
                    source={require('@/assets/images/image_doctor.png')}
                    style={{ width: 50, height: 50, borderRadius: 25 }}
                  />

                  <View className="flex-1 pr-2">
                    <Text className="text-body font-bold text-ink dark:text-ink-dark">
                      {docName}
                    </Text>
                    <Text
                      numberOfLines={1}
                      className="text-caption text-ink-muted mt-0.5"
                    >
                      {lastMsg}
                    </Text>
                  </View>

                  <View className="items-end gap-1.5">
                    <Text className="text-caption text-ink-muted">{time}</Text>
                    <View className="h-2.5 w-2.5 rounded-full bg-brand" />
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Pressable
        onPress={() => router.push('/doctors')}
        style={{ bottom: insets.bottom + 20 }}
        className="absolute right-5 h-14 w-14 items-center justify-center rounded-full bg-brand shadow-lg active:scale-95"
        accessibilityLabel="Mulai Konsultasi Baru"
      >
        <Text className="text-2xl text-on-brand">💬</Text>
      </Pressable>
    </View>
  );
}
