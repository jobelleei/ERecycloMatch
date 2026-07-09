import { useEffect, useState } from "react";
import { supabase } from "../../utils/supabase";

type Role = "user" | "facility";

export default function useUnreadCount(
  accountId: string,
  role: Role
) {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    if (!accountId) {
      setUnreadCount(0);
      return;
    }

    let unreadRequests: any[] = [];

    if (role === "facility") {
      const { data } = await supabase
        .from("conversations")
        .select("id")
        .eq("facility_id", accountId)
        .eq("is_read", false);

      unreadRequests = data || [];
    } else {
      const { data } = await supabase
        .from("conversations")
        .select("id")
        .eq("user_id", accountId)
        .eq("is_read", false);

      unreadRequests = data || [];
    }

    console.log("Account ID:", accountId);
    console.log("Role:", role);
    console.log("Unread requests:", unreadRequests);
    console.log("Unread count:", unreadRequests.length);

    setUnreadCount(unreadRequests.length);
  };

  useEffect(() => {
    fetchUnreadCount();
  }, [accountId, role]);

  useEffect(() => {
    if (!accountId) return;

    const channel = supabase.channel(
      `unread-${role}-${accountId}-${Date.now()}`
    );

    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "conversations",
        filter:
          role === "facility"
            ? `facility_id=eq.${accountId}`
            : `user_id=eq.${accountId}`,
      },
      () => {
        fetchUnreadCount();
      }
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [accountId, role]);

  return unreadCount;
}