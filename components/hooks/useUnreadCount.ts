import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../utils/supabase";

type Role = "user" | "facility";

export default function useUnreadCount(accountId: string, role: Role) {
  const [unreadCount, setUnreadCount] = useState(0);

  /*
  |--------------------------------------------------------------------------
  | Fetch Unread Messages
  |--------------------------------------------------------------------------
  | Counts unique conversations that contain unread messages received
  | by the currently logged-in user or facility.
  |--------------------------------------------------------------------------
  */

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

      /*
      |--------------------------------------------------------------------------
      | Count Unique Conversations
      |--------------------------------------------------------------------------
      */

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

  /*
  |--------------------------------------------------------------------------
  | Initial Fetch
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  /*
  |--------------------------------------------------------------------------
  | Refresh When Screen Gets Focus
  |--------------------------------------------------------------------------
  */

  useFocusEffect(
    useCallback(() => {
      fetchUnreadCount();
    }, [fetchUnreadCount]),
  );

  /*
  |--------------------------------------------------------------------------
  | Realtime Message Listener
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!accountId) {
      return;
    }

    const numericAccountId = Number(accountId);

    if (!Number.isFinite(numericAccountId)) {
      return;
    }

    /*
    |--------------------------------------------------------------------------
    | IMPORTANT
    |--------------------------------------------------------------------------
    | Give every mounted hook instance its own unique channel.
    | This prevents Supabase from trying to modify an already-subscribed
    | channel.
    |--------------------------------------------------------------------------
    */

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

/*
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../utils/supabase";

type Role = "user" | "facility";

export default function useUnreadCount(accountId: string, role: Role) {
  const [unreadCount, setUnreadCount] = useState(0);

  /*
  |--------------------------------------------------------------------------
  | Fetch Unread Count
  |--------------------------------------------------------------------------
  | Counts unique conversations that contain at least one unread message
  | received by the current account.
  |--------------------------------------------------------------------------
  

  const fetchUnreadCount = useCallback(async () => {
    try {
      if (!accountId) {
        setUnreadCount(0);
        return;
      }

      const numericAccountId = Number(accountId);

      if (!Number.isFinite(numericAccountId)) {
        console.log("INVALID ACCOUNT ID FOR UNREAD COUNT:", accountId);

        setUnreadCount(0);
        return;
      }

      /*
      |--------------------------------------------------------------------------
      | Fetch Unread Received Messages
      |--------------------------------------------------------------------------
      

      const { data: unreadMessages, error: messageError } = await supabase
        .from("messages")
        .select(
          `
          id,
          conversation_id,
          receiver_id,
          is_read
          `,
        )
        .eq("receiver_id", numericAccountId)
        .eq("is_read", false);

      if (messageError) {
        console.log("UNREAD MESSAGE ERROR:", messageError);

        setUnreadCount(0);
        return;
      }

      /*
      |--------------------------------------------------------------------------
      | Count Unique Conversations
      |--------------------------------------------------------------------------
      | If one conversation contains 5 unread messages, the badge only
      | increases by 1.
      |--------------------------------------------------------------------------
      

      const unreadConversationIds = new Set<string>();

      (unreadMessages || []).forEach((message: any) => {
        const conversationId = String(message?.conversation_id || "").trim();

        if (conversationId) {
          unreadConversationIds.add(conversationId);
        }
      });

      console.log(`UNREAD ${role.toUpperCase()} CONVERSATIONS:`, [
        ...unreadConversationIds,
      ]);

      console.log(
        `UNREAD ${role.toUpperCase()} COUNT:`,
        unreadConversationIds.size,
      );

      setUnreadCount(unreadConversationIds.size);
    } catch (error) {
      console.log("FETCH UNREAD COUNT ERROR:", error);

      setUnreadCount(0);
    }
  }, [accountId, role]);

  /*
  |--------------------------------------------------------------------------
  | Initial Fetch
  |--------------------------------------------------------------------------
  

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  /*
  |--------------------------------------------------------------------------
  | Refresh When Screen Is Focused
  |--------------------------------------------------------------------------
  

  useFocusEffect(
    useCallback(() => {
      fetchUnreadCount();
    }, [fetchUnreadCount]),
  );

  /*
  |--------------------------------------------------------------------------
  | Realtime Message Updates
  |--------------------------------------------------------------------------
  | Refreshes the badge whenever a message for this user/facility is
  | inserted, updated, or deleted.
  |--------------------------------------------------------------------------
  

  useEffect(() => {
    if (!accountId) {
      return;
    }

    const numericAccountId = Number(accountId);

    if (!Number.isFinite(numericAccountId)) {
      return;
    }

    const channelName = `unread-messages-${role}-${accountId}`;

    const messageChannel = supabase
      .channel(channelName)
      .on(
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
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
    };
  }, [accountId, role, fetchUnreadCount]);

  return unreadCount;
}
*/
