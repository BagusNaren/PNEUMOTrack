// src/services/chat/index.ts
// Chat service — mock for MVP; Supabase realtime when available.

import { Config } from '@/constants/config';
import { supabase } from '@/services/supabase/client';
import type { Conversation, Message } from '@/types/domain';
import { MOCK_CONVERSATIONS, MOCK_MESSAGES } from '../mock-data';

const mockConvos = [...MOCK_CONVERSATIONS];
const mockMsgs: Record<string, Message[]> = { ...MOCK_MESSAGES };

// Mock implementation
const mockService = {
  listConversations: async (_parentId: string): Promise<Conversation[]> => {
    await new Promise((r) => setTimeout(r, 400));
    return [...mockConvos];
  },
  getMessages: async (conversationId: string): Promise<Message[]> => {
    await new Promise((r) => setTimeout(r, 300));
    return [...(mockMsgs[conversationId] ?? [])];
  },
  send: async (conversationId: string, senderId: string, content: string): Promise<Message> => {
    await new Promise((r) => setTimeout(r, 200));
    const msg: Message = {
      id: `msg-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: senderId,
      sender_role: 'parent',
      content,
      created_at: new Date().toISOString(),
    };
    if (!mockMsgs[conversationId]) mockMsgs[conversationId] = [];
    mockMsgs[conversationId].push(msg);

    // Mock auto-reply after 1.5s
    setTimeout(() => {
      const reply: Message = {
        id: `msg-${Date.now() + 1}`,
        conversation_id: conversationId,
        sender_id: 'doc-auto',
        sender_role: 'doctor',
        content: '[Demo] Terima kasih atas pesan Anda. Dokter akan segera merespons.',
        created_at: new Date().toISOString(),
      };
      mockMsgs[conversationId].push(reply);
    }, 1500);

    return msg;
  },
  subscribe: (_conversationId: string, _onMessage: (msg: Message) => void) => {
    // No-op for mock; in Supabase this would open a realtime channel
    return { unsubscribe: () => {} };
  },
};

// Supabase implementation (realtime)
const supabaseService = {
  listConversations: async (parentId: string): Promise<Conversation[]> => {
    const { data, error } = await supabase
      .from('conversations')
      .select('*, doctors(*), messages(content, created_at, sender_id)')
      .eq('parent_id', parentId)
      .order('created_at', { referencedTable: 'messages', ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as Conversation[];
  },
  getMessages: async (conversationId: string): Promise<Message[]> => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data ?? [];
  },
  send: async (conversationId: string, senderId: string, content: string): Promise<Message> => {
    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: senderId, sender_role: 'parent', content })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  subscribe: (conversationId: string, onMessage: (msg: Message) => void) => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => onMessage(payload.new as Message),
      )
      .subscribe();
    return { unsubscribe: () => supabase.removeChannel(channel) };
  },
};

export const chatService = Config.useMockData ? mockService : supabaseService;
