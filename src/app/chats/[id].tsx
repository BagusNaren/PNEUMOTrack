// src/app/chats/[id].tsx
// Interactive doctor consultation chat room — matches chat room_user.png.

import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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

export default function ChatRoomScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const scrollViewRef = useRef<ScrollView>(null);

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    if (!id) return;

    // Fetch doctor info
    doctorsService.get(id).then((doc) => {
      if (doc) setDoctor(doc);
    });

    // Initial mock consultation history
    setMessages([
      {
        id: 'msg-1',
        conversation_id: `conv-${id}`,
        sender_id: id,
        sender_role: 'doctor',
        content:
          'Halo Bunda, saya sudah menerima notifikasi hasil skrining batuk ananda. Bisa ceritakan sejak kapan batuknya dimulai dan apakah disertai demam?',
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
      {
        id: 'msg-2',
        conversation_id: `conv-${id}`,
        sender_id: 'user-demo',
        sender_role: 'parent',
        content:
          'Halo Dok, batuknya sudah 3 hari, semalam agak hangat dan napasnya terdengar sedikit grok-grok.',
        created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
      },
      {
        id: 'msg-3',
        conversation_id: `conv-${id}`,
        sender_id: id,
        sender_role: 'doctor',
        content:
          'Baik Bunda, dari hasil evaluasi akustik PNEUMOTrack terindikasi pola batuk tidak biasa. Harap perhatikan apakah ada tarikan di sela iga saat menarik napas. Jika napas anak tampak cepat atau lebih dari 40x per menit saat tidur, segera bawa ke faskes ya.',
        created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      },
    ]);
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

    // Simulated doctor reply for hackathon interactive demo
    setTimeout(() => {
      const docReply: Message = {
        id: `msg-reply-${Date.now()}`,
        conversation_id: `conv-${id}`,
        sender_id: id ?? 'doc-1',
        sender_role: 'doctor',
        content:
          'Terima kasih atas informasinya Bunda. Teruskan hidrasi air hangat/ASI secara berkala. Saya tetap sarankan pemeriksaan fisik langsung stetoskop ke poli anak terdekat untuk memastikan saluran napas bawah bersih.',
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, docReply]);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 1800);
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
      {/* Custom Chat Room Header */}
      <View
        style={{ paddingTop: insets.top + 8 }}
        className="border-b border-border bg-surface px-4 pb-3 dark:border-border-dark dark:bg-surface-card-dark"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2.5">
            <Pressable
              onPress={() => router.back()}
              className="h-10 w-10 items-center justify-center rounded-full active:opacity-70"
            >
              <Text className="text-2xl text-ink dark:text-ink-dark">‹</Text>
            </Pressable>

            <Image
              source={require('@/assets/images/image_doctor.png')}
              style={{ width: 42, height: 42, borderRadius: 21 }}
            />

            <View>
              <Text className="text-label font-bold text-ink dark:text-ink-dark">
                {doctor?.name ?? 'dr. Sarah Sp.A'}
              </Text>
              <View className="flex-row items-center gap-1.5">
                <View className="h-2 w-2 rounded-full bg-safe" />
                <Text className="text-caption text-safe font-medium">Online</Text>
              </View>
            </View>
          </View>

          <Pressable
            onPress={handleCall}
            className="h-10 w-10 items-center justify-center rounded-full bg-surface-brand-soft active:opacity-70"
            accessibilityLabel="Telepon Dokter"
          >
            <Text className="text-lg">📞</Text>
          </Pressable>
        </View>
      </View>

      {/* Emergency Warning Banner */}
      <View className="border-b border-risk-border bg-risk-surface px-4 py-2">
        <Text className="text-caption font-semibold text-risk text-center">
          ⚠️ Bukan layanan gawat darurat. Hubungi 119 jika anak sesak napas berat.
        </Text>
      </View>

      {/* Messages Scroll Area */}
      <ScrollView
        ref={scrollViewRef}
        className="flex-1 px-4 py-4"
        contentContainerStyle={{ gap: 12, paddingBottom: 16 }}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        <Text className="text-center text-caption text-ink-muted my-2">
          Konsultasi Medis Dimulai • Rekam Medis Dijaga Kerahasiaannya
        </Text>

        {messages.map((msg) => {
          const isMe = msg.sender_role === 'parent';
          const time = new Date(msg.created_at).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <View
              key={msg.id}
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                isMe
                  ? 'self-end bg-brand rounded-br-sm'
                  : 'self-start bg-surface-brand rounded-bl-sm dark:bg-surface-brand-dark'
              }`}
            >
              <Text
                className={`text-body leading-5 ${
                  isMe ? 'text-on-brand' : 'text-ink dark:text-ink-dark'
                }`}
              >
                {msg.content}
              </Text>
              <Text
                className={`mt-1 text-right text-caption ${
                  isMe ? 'text-white/70' : 'text-ink-muted'
                }`}
              >
                {time}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Composer Input Bar */}
      <View
        style={{ paddingBottom: insets.bottom > 0 ? insets.bottom : 12 }}
        className="border-t border-border bg-surface px-4 pt-2.5 dark:border-border-dark dark:bg-surface-card-dark"
      >
        <View className="flex-row items-center gap-2">
          <View className="flex-1 flex-row items-center rounded-pill border border-border bg-surface-muted px-4 py-1.5 dark:border-border-dark dark:bg-surface-dark">
            <TextInput
              className="flex-1 text-body text-ink dark:text-ink-dark"
              placeholder="Tulis pesan konsultasi…"
              placeholderTextColor="#AEB7C2"
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
          </View>

          <Pressable
            onPress={handleSend}
            disabled={!inputText.trim()}
            className={`h-11 w-11 items-center justify-center rounded-full ${
              inputText.trim() ? 'bg-brand active:opacity-80' : 'bg-surface-muted opacity-50'
            }`}
          >
            <Text className="text-lg text-on-brand">➤</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

