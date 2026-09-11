import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { supabase } from "../utils/supabase";

type ActivePage = "home" | "map" | "messages" | "profile" | "settings";

type Props = {
  facilityId: string;
  active: ActivePage;
};

interface NavItemConfig {
  key: ActivePage;
  label: string;
  activeIcon: keyof typeof Ionicons.glyphMap;
  inactiveIcon: keyof typeof Ionicons.glyphMap;
  route: string;
}

export default function FacilityBottomNav({ facilityId, active }: Props) {
  const router = useRouter();
  const [hasUnreadMessages, setHasUnreadMessages] = useState<boolean>(false);

  const fetchUnreadStatus = async () => {
    if (!facilityId) {
      setHasUnreadMessages(false);
      return;
    }

    try {
      const { count, error } = await supabase
        .from("conversations")
        .select("id", { count: "exact", head: true })
        .eq("facility_id", String(facilityId))
        .eq("is_read", false);

      if (!error && count !== null) {
        setHasUnreadMessages(count > 0);
      } else {
        setHasUnreadMessages(false);
      }
    } catch (e) {
      console.log("FACILITY NAV UNREAD ERROR:", e);
      setHasUnreadMessages(false);
    }
  };

  // Re-check unread messages status whenever the tab or screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchUnreadStatus();
    }, [facilityId, active]),
  );

  // Realtime subscription with unique channel key to avoid duplicate subscription errors
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
          event: "INSERT",
          schema: "public",
          table: "messages",
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
            style={navStyles.navItem}
            activeOpacity={0.7}
            onPress={() => router.push(item.route as any)}
          >
            <View style={navStyles.iconWrapper}>
              <Ionicons name={iconName} size={22} color={iconColor} />

              {/* Red dot badge matching UserBottomNav */}
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

/*import React from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import useUnreadCount from "./hooks/useUnreadCount";

type ActivePage =
  | "home"
  | "map"
  | "messages"
  | "profile"
  | "settings";

type Props = {
  facilityId: string;
  active: ActivePage;
};

export default function FacilityBottomNav({
  facilityId,
  active,
}: Props) {
  const router = useRouter();

  const unreadCount = useUnreadCount(
    facilityId,
    "facility"
  );

  const go = (route: string) => {
    router.replace(route as any);
  };

  const navItems = [
  {
    key: "home",
    label: "Home",
    icon: require("../assets/icons/home.png"),
    route: "/facility_dashboard",
  },
  {
    key: "map",
    label: "Map",
    icon: require("../assets/icons/map.png"),
    route: "/facility_dashboard/facility_map",
  },
  {
    key: "messages",
    label: "Messages",
    icon: require("../assets/icons/chatting.png"),
    route: "/facility_dashboard/messages",
  },
  {
    key: "profile",
    label: "Profile",
    icon: require("../assets/icons/user.png"),
    route: "/facility_dashboard/profile",
  },
  {
    key: "settings",
    label: "Settings",
    icon: require("../assets/icons/setting_1.png"),
    route: "/facility_dashboard/settings",
  },
];

  return (
    <View style={styles.bottomNav}>
      {navItems.map((item) => (
        <TouchableOpacity
          key={item.key}
          style={styles.navItem}
          onPress={() => go(item.route)}
        >
          {item.key === "messages" ? (
            <View style={styles.iconWrapper}>
              <Image
                source={item.icon}
                style={styles.navImage}
              />

              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 99
                      ? "99+"
                      : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <Image
              source={item.icon}
              style={styles.navImage}
            />
          )}

          <Text
            style={[
              styles.navLabel,
              active === item.key &&
                styles.navActive,
            ]}
          >
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#ddd",
    paddingBottom: 8,
  },

  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  iconWrapper: {
    position: "relative",
  },

  navImage: {
    width: 24,
    height: 24,
    resizeMode: "contain",
    marginBottom: 2,
  },

  navLabel: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
  },

  navActive: {
    color: "#1b5e20",
    fontWeight: "bold",
  },

  badge: {
    position: "absolute",
    top: -6,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#E53935",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },

  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
}); */
