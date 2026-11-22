import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { RefObject, useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { supabase } from "../utils/supabase";

type ActivePage = "home" | "map" | "messages" | "profile" | "settings";

type Props = {
  facilityId: string;
  active: ActivePage;
  tourRefs?: Partial<Record<ActivePage, RefObject<any>>>;
};

interface NavItemConfig {
  key: ActivePage;
  label: string;
  activeIcon: keyof typeof Ionicons.glyphMap;
  inactiveIcon: keyof typeof Ionicons.glyphMap;
  route: string;
}

export default function FacilityBottomNav({
  facilityId,
  active,
  tourRefs,
}: Props) {
  const router = useRouter();
  const [hasUnreadMessages, setHasUnreadMessages] = useState<boolean>(false);

  const fetchUnreadStatus = async () => {
    if (!facilityId) {
      setHasUnreadMessages(false);
      return;
    }

    try {
      const numericId = Number(facilityId);
      const { count: unreadMessageCount, error: messagesError } =
        Number.isFinite(numericId)
          ? await supabase
              .from("messages")
              .select("id", { count: "exact", head: true })
              .eq("receiver_id", numericId)
              .eq("is_read", false)
          : { count: 0, error: null };

      if (messagesError) {
        console.log("FACILITY NAV UNREAD MESSAGES ERROR:", messagesError);
      }

      const { count: unreadConversationCount, error: conversationsError } =
        await supabase
          .from("conversations")
          .select("id", { count: "exact", head: true })
          .eq("facility_id", String(facilityId))
          .eq("is_read", false);

      if (conversationsError) {
        console.log("FACILITY NAV UNREAD CONVERSATIONS ERROR:", conversationsError);
      }

      setHasUnreadMessages(
        (unreadMessageCount ?? 0) > 0 || (unreadConversationCount ?? 0) > 0,
      );
    } catch (e) {
      console.log("FACILITY NAV UNREAD ERROR:", e);
      setHasUnreadMessages(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUnreadStatus();
    }, [facilityId, active]),
  );

  useEffect(() => {
    if (!facilityId) return;

    fetchUnreadStatus();

    const channelId = `facility-nav-msg-${facilityId}-${Date.now()}`;
    const channel = supabase.channel(channelId);

    channel
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `facility_id=eq.${facilityId}`,
        },
        () => fetchUnreadStatus(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${facilityId}`,
        },
        () => fetchUnreadStatus(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [facilityId]);

  const navItems: NavItemConfig[] = [
    {
      key: "home",
      label: "Home",
      activeIcon: "home",
      inactiveIcon: "home-outline",
      route: "/facility_dashboard",
    },
    {
      key: "map",
      label: "Map",
      activeIcon: "map",
      inactiveIcon: "map-outline",
      route: "/facility_dashboard/facility_map",
    },
    {
      key: "messages",
      label: "Messages",
      activeIcon: "chatbubble-ellipses",
      inactiveIcon: "chatbubble-ellipses-outline",
      route: "/facility_dashboard/messages",
    },
    {
      key: "profile",
      label: "Profile",
      activeIcon: "person",
      inactiveIcon: "person-outline",
      route: "/facility_dashboard/profile",
    },
    {
      key: "settings",
      label: "Settings",
      activeIcon: "settings",
      inactiveIcon: "settings-outline",
      route: "/facility_dashboard/settings",
    },
  ];

  return (
    <View style={navStyles.container}>
      {navItems.map((item) => {
        const isActive = active === item.key;
        const iconName = isActive ? item.activeIcon : item.inactiveIcon;
        const iconColor = isActive ? "#2e7d32" : "#777777";

        return (
          <TouchableOpacity
            key={item.key}
            ref={tourRefs?.[item.key]}
            style={navStyles.navItem}
            activeOpacity={0.7}
            onPress={() => router.push(item.route as any)}
          >
            <View style={navStyles.iconWrapper}>
              <Ionicons name={iconName} size={22} color={iconColor} />

              {item.key === "messages" && hasUnreadMessages && (
                <View style={navStyles.redDot} />
              )}
            </View>

            <Text
              style={[navStyles.navLabel, isActive && navStyles.activeLabel]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
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

