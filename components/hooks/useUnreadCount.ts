import { useEffect, useState } from "react";
import { supabase } from "../../utils/supabase";

type Role = "user" | "facility";

export default function useUnreadCount(
  accountId: string,
  role: Role
) {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    try {
      if (!accountId) {
        setUnreadCount(0);
        return;
      }

      const unreadSet = new Set<string>();

      // ==========================
      // UNREAD CHAT MESSAGES
      // ==========================
      const { data: unreadMessages } = await supabase
        .from("messages")
        .select("conversation_id")
        .eq("receiver_id", Number(accountId))
        .eq("is_read", false);

      (unreadMessages || []).forEach(
        (message: any) => {
          unreadSet.add(
            String(message.conversation_id)
          );
        }
      );

      // ==========================
      // UNREAD REQUESTS
      // ==========================
      if (role === "facility") {
        const { data: unreadRequests } =
          await supabase
            .from("conversations")
            .select("id")
            .eq(
              "facility_id",
              Number(accountId)
            )
            .eq(
              "facility_read",
              false
            );

        (unreadRequests || []).forEach(
          (conversation: any) => {
            unreadSet.add(
              String(conversation.id)
            );
          }
        );
      } else {
        const { data: unreadRequests } =
          await supabase
            .from("conversations")
            .select("id")
            .eq(
              "user_id",
              Number(accountId)
            )
            .eq(
              "user_read",
              false
            );

        (unreadRequests || []).forEach(
          (conversation: any) => {
            unreadSet.add(
              String(conversation.id)
            );
          }
        );
      }

      console.log(
        "Unread count:",
        unreadSet.size
      );

      setUnreadCount(unreadSet.size);
    } catch (error) {
      console.log(
        "FETCH UNREAD COUNT ERROR:",
        error
      );

      setUnreadCount(0);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
  }, [accountId, role]);

  useEffect(() => {
    if (!accountId) return;

    const conversationChannel =
      supabase.channel(
        `conversation-unread-${role}-${accountId}-${Date.now()}`
      );

    conversationChannel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "conversations",
        filter:
          role === "facility"
            ? `facility_id=eq.${Number(
                accountId
              )}`
            : `user_id=eq.${Number(
                accountId
              )}`,
      },
      () => {
        fetchUnreadCount();
      }
    );

    conversationChannel.subscribe();

    const messageChannel =
      supabase.channel(
        `message-unread-${role}-${accountId}-${Date.now()}`
      );

    messageChannel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "messages",
        filter: `receiver_id=eq.${Number(
          accountId
        )}`,
      },
      () => {
        fetchUnreadCount();
      }
    );

    messageChannel.subscribe();

    return () => {
      supabase.removeChannel(
        conversationChannel
      );

      supabase.removeChannel(
        messageChannel
      );
    };
  }, [accountId, role]);

  return unreadCount;
}