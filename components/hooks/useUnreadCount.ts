import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../utils/supabase";

type Role = "user" | "facility";

export default function useUnreadCount(accountId: string, role: Role) {
  const [unreadCount, setUnreadCount] = useState(0);


  const fetchUnreadCount = useCallback(async () => {
    try {
      if (!accountId) {
        setUnreadCount(0);
        return;
      }

      const numericAccountId = Number(accountId);

      if (!Number.isFinite(numericAccountId)) {
        console.log("INVALID ACCOUNT ID:", accountId);

        setUnreadCount(0);
        return;
      }

      const { data, error } = await supabase
        .from("messages")
        .select("conversation_id")
        .eq("receiver_id", numericAccountId)
        .eq("is_read", false);

      if (error) {
        console.log("UNREAD MESSAGE ERROR:", error);

        setUnreadCount(0);
        return;
      }


      const conversationIds = new Set<string>();

      (data || []).forEach((message: any) => {
        if (message?.conversation_id) {
          conversationIds.add(String(message.conversation_id));
        }
      });

      console.log(`UNREAD ${role.toUpperCase()} CONVERSATIONS:`, [
        ...conversationIds,
      ]);

      console.log(`UNREAD ${role.toUpperCase()} COUNT:`, conversationIds.size);

      setUnreadCount(conversationIds.size);
    } catch (error) {
      console.log("FETCH UNREAD COUNT ERROR:", error);

      setUnreadCount(0);
    }
  }, [accountId, role]);


  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);


  useFocusEffect(
    useCallback(() => {
      fetchUnreadCount();
    }, [fetchUnreadCount]),
  );


  useEffect(() => {
    if (!accountId) {
      return;
    }

    const numericAccountId = Number(accountId);

    if (!Number.isFinite(numericAccountId)) {
      return;
    }


    const channelName = `unread-${role}-${accountId}-${Date.now()}-${Math.random()}`;

    const channel = supabase.channel(channelName);

    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "messages",
        filter: `receiver_id=eq.${numericAccountId}`,
      },
      () => {
        fetchUnreadCount();
      },
    );

    channel.subscribe((status) => {
      console.log("UNREAD REALTIME STATUS:", status);
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [accountId, role, fetchUnreadCount]);

  return unreadCount;
}

