import { useEffect, useRef } from "react";
import { supabase } from "./supabase";

export function useChatRealtime(
  conversationId: string,
  onMessagesChanged: () => void,
  onConversationChanged: () => void,
) {
  const messagesRef = useRef(onMessagesChanged);
  const conversationRef = useRef(onConversationChanged);

  useEffect(() => {
    messagesRef.current = onMessagesChanged;
    conversationRef.current = onConversationChanged;
  });

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`chat-${conversationId}-${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => messagesRef.current(),
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
          filter: `id=eq.${conversationId}`,
        },
        () => conversationRef.current(),
      )
      .subscribe((status) => {
        if (status !== "SUBSCRIBED") {
          console.log("CHAT REALTIME STATUS:", status);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);
}
