import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { RefObject, useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { supabase } from "../utils/supabase";

type NavKey = "home" | "scan" | "map" | "messages" | "profile" | "settings";

interface UserBottomNavProps {
  userId: string;
  active: NavKey;
  tourRefs?: Partial<Record<NavKey, RefObject<any>>>;
}

export default function UserBottomNav({
  userId,
  active,
  tourRefs,
}: UserBottomNavProps) {
  const router = useRouter();
  const [hasUnreadMessages, setHasUnreadMessages] = useState<boolean>(false);

  const fetchUnreadStatus = async () => {
    if (!userId) {
      setHasUnreadMessages(false);
      return;
    }

    try {
      const numericId = Number(userId);
      const { count: unreadMessageCount, error: messagesError } =
        Number.isFinite(numericId)
          ? await supabase
              .from("messages")
              .select("id", { count: "exact", head: true })
              .eq("receiver_id", numericId)
              .eq("is_read", false)
          : { count: 0, error: null };

      if (messagesError) {
        console.log("NAV UNREAD MESSAGES ERROR:", messagesError);
      }

      const { count: unreadConversationCount, error: conversationsError } =
        await supabase
          .from("conversations")
          .select("id", { count: "exact", head: true })
          .eq("user_id", String(userId))
          .eq("is_read", false);

      if (conversationsError) {
        console.log("NAV UNREAD CONVERSATIONS ERROR:", conversationsError);
      }

      setHasUnreadMessages(
        (unreadMessageCount ?? 0) > 0 || (unreadConversationCount ?? 0) > 0,
      );
    } catch (e) {
      console.log("NAV UNREAD ERROR:", e);
      setHasUnreadMessages(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUnreadStatus();
    }, [userId, active]),
  );

  useEffect(() => {
    if (!userId) return;

    fetchUnreadStatus();

    const channelId = `nav-msg-${userId}-${Date.now()}`;
    const channel = supabase.channel(channelId);

    channel
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `user_id=eq.${userId}`,
        },
        () => fetchUnreadStatus(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${userId}`,
        },
        () => fetchUnreadStatus(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return (
    <View style={navStyles.container}>
      <TouchableOpacity
        ref={tourRefs?.home}
        style={navStyles.navItem}
        onPress={() => router.push("/user_dashboard" as any)}
      >
        <Ionicons
          name={active === "home" ? "home" : "home-outline"}
          size={22}
          color={active === "home" ? "#2e7d32" : "#777"}
        />
        <Text
          style={[
            navStyles.navLabel,
            active === "home" && navStyles.activeLabel,
          ]}
        >
          Home
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        ref={tourRefs?.scan}
        style={navStyles.navItem}
        onPress={() => router.push("/user_dashboard/user_scan" as any)}
      >
        <Ionicons
          name={active === "scan" ? "scan" : "scan-outline"}
          size={22}
          color={active === "scan" ? "#2e7d32" : "#777"}
        />
        <Text
          style={[
            navStyles.navLabel,
            active === "scan" && navStyles.activeLabel,
          ]}
        >
          Scan
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        ref={tourRefs?.map}
        style={navStyles.navItem}
        onPress={() => router.push("/user_dashboard/user_map" as any)}
      >
        <Ionicons
          name={active === "map" ? "map" : "map-outline"}
          size={22}
          color={active === "map" ? "#2e7d32" : "#777"}
        />
        <Text
          style={[
            navStyles.navLabel,
            active === "map" && navStyles.activeLabel,
          ]}
        >
          Map
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        ref={tourRefs?.messages}
        style={navStyles.navItem}
        onPress={() => router.push("/user_dashboard/messages" as any)}
      >
        <View style={navStyles.iconWrapper}>
          <Ionicons
            name={
              active === "messages"
                ? "chatbubble-ellipses"
                : "chatbubble-ellipses-outline"
            }
            size={22}
            color={active === "messages" ? "#2e7d32" : "#777"}
          />
          {hasUnreadMessages && <View style={navStyles.redDot} />}
        </View>
        <Text
          style={[
            navStyles.navLabel,
            active === "messages" && navStyles.activeLabel,
          ]}
        >
          Messages
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        ref={tourRefs?.profile}
        style={navStyles.navItem}
        onPress={() => router.push("/user_dashboard/profile" as any)}
      >
        <Ionicons
          name={active === "profile" ? "person" : "person-outline"}
          size={22}
          color={active === "profile" ? "#2e7d32" : "#777"}
        />
        <Text
          style={[
            navStyles.navLabel,
            active === "profile" && navStyles.activeLabel,
          ]}
        >
          Profile
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        ref={tourRefs?.settings}
        style={navStyles.navItem}
        onPress={() => router.push("/user_dashboard/settings" as any)}
      >
        <Ionicons
          name={active === "settings" ? "settings" : "settings-outline"}
          size={22}
          color={active === "settings" ? "#2e7d32" : "#777"}
        />
        <Text
          style={[
            navStyles.navLabel,
            active === "settings" && navStyles.activeLabel,
          ]}
        >
          Settings
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const navStyles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingBottom: 6,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  iconWrapper: {
    position: "relative",
  },
  redDot: {
    position: "absolute",
    top: -2,
    right: -4,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: "#d32f2f",
    borderWidth: 1.5,
    borderColor: "#ffffff",
  },
  navLabel: {
    fontSize: 10,
    color: "#777777",
    marginTop: 2,
    fontWeight: "500",
  },
  activeLabel: {
    color: "#2e7d32",
    fontWeight: "700",
  },
});

