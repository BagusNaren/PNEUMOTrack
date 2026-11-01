import { useCallback, useEffect, useRef, useState } from "react";
import { chatService } from "@/services/chat";
import { useResource } from "./use-resource";

export function useConversation(parentId: string, doctorId: string) {
  const resource = useResource(
    useCallback(async () => {
      const conversations = await chatService.listConversations(parentId);
      const conversation = conversations.find(
        (item) => item.doctor_id === doctorId,
      );
      return {
        conversation,
        messages: conversation
          ? await chatService.getMessages(conversation.id)
          : [],
      };
    }, [parentId, doctorId]),
  );
  const [sending, setSending] = useState(false);
  const [sendFailed, setSendFailed] = useState(false);
  const pending = useRef(false);
  const conversationId = resource.data?.conversation?.id;
  const { reload } = resource;
  useEffect(() => {
    if (!conversationId) return;
    const subscription = chatService.subscribe(conversationId, () => {
      void reload();
    });
    return () => {
      void subscription.unsubscribe();
    };
  }, [conversationId, reload]);

  const send = async (text: string) => {
    if (pending.current || !text.trim()) return false;
    pending.current = true;
    setSending(true);
    setSendFailed(false);
    try {
      const conversation =
        resource.data?.conversation ??
        (await chatService.getOrCreate(parentId, doctorId));
      await chatService.send(conversation.id, parentId, text.trim());
      await resource.reload();
      return true;
    } catch {
      setSendFailed(true);
      return false;
    } finally {
      pending.current = false;
      setSending(false);
    }
  };
  return { ...resource, send, sending, sendFailed };
}
