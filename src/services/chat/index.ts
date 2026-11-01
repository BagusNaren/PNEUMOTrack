// src/services/chat/index.ts
// Chat service — mock for MVP; Supabase realtime when available.

import { Config } from "@/constants/config";
import { supabase } from "@/services/supabase/client";
import type { Conversation, Message } from "@/types/domain";
import { MOCK_CONVERSATIONS, MOCK_MESSAGES, MOCK_DOCTORS } from "../mock-data";

const mockConvos = [...MOCK_CONVERSATIONS];
const mockMsgs: Record<string, Message[]> = { ...MOCK_MESSAGES };

interface MessageRow {
  id: string;
  conversation_id: string;
  sender_role: "parent" | "doctor";
  body: string;
  created_at: string;
}

function fromMessageRow(row: MessageRow): Message {
  return { ...row, sender_id: "", content: row.body };
}

// Mock implementation
const mockService = {
  getOrCreate: async (
    parentId: string,
    doctorId: string,
  ): Promise<Conversation> => {
    const existing = mockConvos.find((item) => item.doctor_id === doctorId);
    if (existing) return existing;
    const conversation = {
      id: `conv-${Date.now()}`,
      parent_id: parentId,
      doctor_id: doctorId,
      doctor: MOCK_DOCTORS.find((item) => item.id === doctorId),
    };
    mockConvos.push(conversation);
    return conversation;
  },
  listConversations: async (_parentId: string): Promise<Conversation[]> => {
    await new Promise((r) => setTimeout(r, 400));
    return mockConvos.map((conversation) => ({
      ...conversation,
      last_message:
        mockMsgs[conversation.id]?.at(-1) ?? conversation.last_message,
    }));
  },
  getMessages: async (conversationId: string): Promise<Message[]> => {
    await new Promise((r) => setTimeout(r, 300));
    return [...(mockMsgs[conversationId] ?? [])];
  },
  send: async (
    conversationId: string,
    senderId: string,
    content: string,
  ): Promise<Message> => {
    await new Promise((r) => setTimeout(r, 200));
    const msg: Message = {
      id: `msg-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: senderId,
      sender_role: "parent",
      content,
      created_at: new Date().toISOString(),
    };
    if (!mockMsgs[conversationId]) mockMsgs[conversationId] = [];
    mockMsgs[conversationId].push(msg);

    return msg;
  },
  subscribe: (_conversationId: string, _onMessage: (msg: Message) => void) => {
    // No-op for mock; in Supabase this would open a realtime channel
    return { unsubscribe: () => {} };
  },
};

// Supabase implementation (realtime)
const supabaseService = {
  getOrCreate: async (
    parentId: string,
    doctorId: string,
  ): Promise<Conversation> => {
    const { data, error } = await supabase
      .from("conversations")
      .upsert(
        { parent_id: parentId, doctor_id: doctorId },
        { onConflict: "parent_id,doctor_id" },
      )
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  listConversations: async (parentId: string): Promise<Conversation[]> => {
    const { data, error } = await supabase
      .from("conversations")
      .select("*, doctors(*), messages(*)")
      .eq("parent_id", parentId)
      .order("created_at", { referencedTable: "messages", ascending: false });
    if (error) throw error;
    return (data ?? []).map((row) => ({
      id: row.id,
      doctor_id: row.doctor_id,
      parent_id: row.parent_id,
      doctor: row.doctors,
      last_message: row.messages?.length
        ? fromMessageRow(row.messages[0])
        : undefined,
    }));
  },
  getMessages: async (conversationId: string): Promise<Message[]> => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map(fromMessageRow);
  },
  send: async (
    conversationId: string,
    senderId: string,
    content: string,
  ): Promise<Message> => {
    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_role: "parent",
        body: content,
      })
      .select()
      .single();
    if (error) throw error;
    return { ...fromMessageRow(data), sender_id: senderId };
  },
  subscribe: (conversationId: string, onMessage: (msg: Message) => void) => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => onMessage(fromMessageRow(payload.new as MessageRow)),
      )
      .subscribe();
    return { unsubscribe: () => supabase.removeChannel(channel) };
  },
};

export const chatService = Config.useMockData ? mockService : supabaseService;
