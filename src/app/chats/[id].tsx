// src/app/chats/[id].tsx
// Doctor consultation chat room — matches chat room_user.png.

import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { doctorsService } from '@/services/doctors';
import type { Doctor, Message } from '@/types/domain';

function createInitialMessages(doctorId: string): Message[] {
  const now = Date.now();
  return [
    {
      id: 'msg-1',
      conversation_id: `conv-${doctorId}`,
      sender_id: doctorId,
      sender_role: 'doctor',
      content: 'Hello, How can I help you?',
      created_at: new Date(now - 30 * 60 * 1000).toISOString(),
    },
    {
      id: 'msg-2',
      conversation_id: `conv-${doctorId}`,
      sender_id: 'user-demo',
      sender_role: 'parent',
      content:
        'Does my son really have pneumonia? The app shows a pneumonia indication for my son.',
      created_at: new Date(now - 20 * 60 * 1000).toISOString(),
    },
    {
      id: 'msg-3',
      conversation_id: `conv-${doctorId}`,
      sender_id: doctorId,
      sender_role: 'doctor',
      content:
        'I recommend you to do further examination at nearby hospital.',
      created_at: new Date(now - 15 * 60 * 1000).toISOString(),
    },
    {
      id: 'msg-4',
      conversation_id: `conv-${doctorId}`,
      sender_id: 'user-demo',
      sender_role: 'parent',
      content:
        'Thank you doc! Do you have any recommendation of the hospital?',
      created_at: new Date(now - 10 * 60 * 1000).toISOString(),
    },
  ];
}

export default function ChatRoomScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const scrollViewRef = useRef<ComponentRef<typeof ScrollView>>(null);

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [messages, setMessages] = useState<Message[]>(() =>
    createInitialMessages(id ?? 'doc-1'),
  );
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    if (!id) return;
    let active = true;

    doctorsService.get(id).then((doc) => {
      if (!active) return;
      if (doc) setDoctor(doc);
    });

    return () => {
      active = false;
    };
  }, [id]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      conversation_id: `conv-${id}`,
      sender_id: 'user-demo',
      sender_role: 'parent',
      content: inputText.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    setTimeout(() => {
      const docReply: Message = {
        id: `msg-reply-${Date.now()}`,
        conversation_id: `conv-${id}`,
        sender_id: id ?? 'doc-1',
        sender_role: 'doctor',
        content:
          'You can visit RSUP Sanglah or RS Kasih Ibu. They have 24-hour pediatric emergency facilities.',
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, docReply]);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 1500);
  };

  const handleCall = () => {
    if (doctor?.phone) {
      Linking.openURL(`tel:${doctor.phone}`).catch(() => {});
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-surface dark:bg-surface-dark"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View
        style={{ paddingTop: insets.top + 8 }}
        className="border-b border-border bg-surface px-4 pb-3 dark:border-border-dark dark:bg-surface-card-dark"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => router.back()}
              className="h-10 w-10 items-center justify-center rounded-full active:opacity-70"
            >
              <Text className="text-2xl text-ink dark:text-ink-dark">‹</Text>
            </Pressable>

            <Text className="text-subtitle font-bold text-ink dark:text-ink-dark">
              {doctor?.name ?? 'Dr. Ichi Ni San'}
            </Text>
          </View>

          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={handleCall}
              className="h-9 w-9 items-center justify-center rounded-full active:opacity-70"
            >
              <Text className="text-lg">📹</Text>
            </Pressable>
            <Pressable
              onPress={handleCall}
              className="h-9 w-9 items-center justify-center rounded-full active:opacity-70"
            >
              <Text className="text-lg">📞</Text>
            </Pressable>
            <Pressable className="h-9 w-9 items-center justify-center rounded-full active:opacity-70">
              <Text className="text-lg font-bold text-ink-muted">⋮</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        className="flex-1 px-4 py-3"
        contentContainerStyle={{ gap: 14, paddingBottom: 16 }}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        <View className="items-center my-2">
          <View className="rounded-full bg-surface-brand-soft px-4 py-1.5 mb-1">
            <Text className="text-caption font-bold text-brand">
              Consultation Start
            </Text>
          </View>
          <Text className="text-caption text-ink-muted">
            You can consult your condition to the doctor
          </Text>
        </View>

        {messages.map((msg) => {
          const isMe = msg.sender_role === 'parent';

          if (!isMe) {
            return (
              <View key={msg.id} className="self-start max-w-[80%] gap-1.5">
                <View className="flex-row items-center gap-2">
                  <Image
                    source={require('@/assets/images/image_doctor.png')}
                    style={{ width: 28, height: 28, borderRadius: 14 }}
                  />
                  <Text className="text-caption font-bold text-ink dark:text-ink-dark">
                    {doctor?.name ?? 'Dr. Ichi Ni San'}
                  </Text>
                  <Text className="text-caption text-ink-muted">10:20 AM</Text>
                </View>

                <View className="rounded-2xl rounded-tl-sm bg-surface-brand px-4 py-2.5 dark:bg-surface-brand-dark">
                  <Text className="text-body text-ink dark:text-ink-dark leading-5">
                    {msg.content}
                  </Text>
                </View>
              </View>
            );
          }

          return (
            <View
              key={msg.id}
              className="self-end max-w-[80%] rounded-2xl rounded-br-sm bg-brand px-4 py-2.5 shadow-sm"
            >
              <Text className="text-body text-on-brand leading-5">
                {msg.content}
              </Text>
              <View className="mt-1 flex-row items-center justify-end gap-1">
                <Text className="text-caption text-white/70">10:21 AM</Text>
                <Text className="text-caption text-white/80">✓✓</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View
        style={{ paddingBottom: insets.bottom > 0 ? insets.bottom : 12 }}
        className="border-t border-border bg-surface px-4 pt-2.5 dark:border-border-dark dark:bg-surface-card-dark"
      >
        <View className="flex-row items-center gap-2.5">
          <View className="flex-1 flex-row items-center rounded-pill border border-border bg-surface-muted px-4 py-2 dark:border-border-dark dark:bg-surface-dark">
            <TextInput
              className="flex-1 text-body text-ink dark:text-ink-dark"
              placeholder="Type Message..."
              placeholderTextColor="#AEB7C2"
              value={inputText}
              onChangeText={setInputText}
            />
            <Text className="text-base text-icon-muted ml-2">📎</Text>
          </View>

          <Pressable
            onPress={handleSend}
            disabled={!inputText.trim()}
            className={`h-11 px-5 items-center justify-center rounded-pill ${
              inputText.trim() ? 'bg-brand active:opacity-80' : 'bg-brand/50'
            }`}
          >
            <Text className="text-label font-bold text-on-brand">
              Send
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
