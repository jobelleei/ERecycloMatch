import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../../utils/supabase";

type Role = "user" | "facility";

export default function useUnreadCount(
  accountId: string,
  role: Role
) {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      if (!accountId) {
        setUnreadCount(0);
        return;
      }

      const unreadSet = new Set<string>();

      // ==========================
      // UNREAD MESSAGES
      // ==========================
      const {
        data: unreadMessages,
        error: messageError,
      } = await supabase
        .from("messages")
        .select("conversation_id")
        .eq("receiver_id", Number(accountId))
        .eq("is_read", false);

      if (messageError) {
        console.log(
          "UNREAD MESSAGE ERROR:",
          messageError
        );
      }

      (unreadMessages || []).forEach(
        (message: any) => {
          unreadSet.add(
            String(
              message.conversation_id
            )
          );
        }
      );

      // ==========================
      // UNREAD CONVERSATIONS
      // ==========================
      if (role === "facility") {
        const {
          data: unreadConversations,
          error,
        } = await supabase
          .from("conversations")
          .select("id")
          .eq(
            "facility_id",
            String(accountId)
          )
          .eq(
            "is_read",
            false
          );

        if (error) {
          console.log(
            "FACILITY UNREAD ERROR:",
            error
          );
        }

        (
          unreadConversations || []
        ).forEach(
          (conversation: any) => {
            unreadSet.add(
              String(
                conversation.id
              )
            );
          }
        );
      } else {
        const {
          data: unreadConversations,
          error,
        } = await supabase
          .from("conversations")
          .select("id")
          .eq(
            "user_id",
            String(accountId)
          )
          .eq(
            "is_read",
            false
          );

        if (error) {
          console.log(
            "USER UNREAD ERROR:",
            error
          );
        }

        (
          unreadConversations || []
        ).forEach(
          (conversation: any) => {
            unreadSet.add(
              String(
                conversation.id
              )
            );
          }
        );
      }

      console.log(
        "Unread IDs:",
        [...unreadSet]
      );

      setUnreadCount(
        unreadSet.size
      );
    } catch (error) {
      console.log(
        "FETCH UNREAD ERROR:",
        error
      );

      setUnreadCount(0);
    }
  }, [accountId, role]);

  // Initial fetch
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Refresh whenever screen focuses
  useFocusEffect(
    useCallback(() => {
      fetchUnreadCount();
    }, [fetchUnreadCount])
  );

  // ==========================
  // REALTIME
  // ==========================
  useEffect(() => {
    if (!accountId) return;

    const conversationChannelName =
      `conversation-unread-${role}-${accountId}`;

    const messageChannelName =
      `message-unread-${role}-${accountId}`;

    // Remove old channels first
    supabase
      .getChannels()
      .forEach((channel) => {
        if (
          channel.topic ===
            `realtime:${conversationChannelName}` ||
          channel.topic ===
            `realtime:${messageChannelName}`
        ) {
          supabase.removeChannel(
            channel
          );
        }
      });

    const conversationChannel =
      supabase
        .channel(
          conversationChannelName
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table:
              "conversations",
            filter:
              role ===
              "facility"
                ? `facility_id=eq.${String(
                    accountId
                  )}`
                : `user_id=eq.${String(
                    accountId
                  )}`,
          },
          () => {
            fetchUnreadCount();
          }
        )
        .subscribe();

    const messageChannel =
      supabase
        .channel(
          messageChannelName
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table:
              "messages",
            filter:
              `receiver_id=eq.${Number(
                accountId
              )}`,
          },
          () => {
            fetchUnreadCount();
          }
        )
        .subscribe();

    return () => {
      supabase.removeChannel(
        conversationChannel
      );

      supabase.removeChannel(
        messageChannel
      );
    };
  }, [
    accountId,
    role,
    fetchUnreadCount,
  ]);

  return unreadCount;
}