import { useEffect, useRef } from "react";
import { supabase } from "./supabase";

/*
 * Live chat updates. Supabase Realtime tells the open chat the moment a
 * message is added or edited, or the conversation changes (accepted,
 * finished, ...), instead of waiting for the next timed refresh.
 *
 * The screens keep a slower timed refresh as a backup in case the live
 * connection drops.
 */
export function useChatRealtime(
  conversationId: string,
  onMessagesChanged: () => void,
  onConversationChanged: () => void,
) {
  // Keep the latest callbacks without re-subscribing on every render
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
