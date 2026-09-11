import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { supabase } from "../utils/supabase";

interface UserBottomNavProps {
  userId: string;
  active: "home" | "scan" | "map" | "messages" | "profile" | "settings";
}

export default function UserBottomNav({ userId, active }: UserBottomNavProps) {
  const router = useRouter();
  const [hasUnreadMessages, setHasUnreadMessages] = useState<boolean>(false);

  const fetchUnreadStatus = async () => {
    if (!userId) {
      setHasUnreadMessages(false);
      return;
    }

    try {
      const { count, error } = await supabase
        .from("conversations")
        .select("id", { count: "exact", head: true })
        .eq("user_id", String(userId))
        .eq("is_read", false);

      if (!error && count !== null) {
        setHasUnreadMessages(count > 0);
      } else {
        setHasUnreadMessages(false);
      }
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
  }, [userId]);

  return (
    <View style={navStyles.container}>
      <TouchableOpacity
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

/*import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import useUnreadCount from "./hooks/useUnreadCount";

type ActivePage =
  | "home"
  | "scan"
  | "map"
  | "messages"
  | "profile"
  | "settings";

type Props = {
  userId: string;
  active: ActivePage;
};

export default function UserBottomNav({
  userId,
  active,
}: Props) {
  const router = useRouter();

  const unreadCount = useUnreadCount(userId, "user");

const go = (route: string) => {
  router.replace(route as any);
};

  const navItems = [
    {
      key: "home",
      label: "Home",
      icon: require("../assets/icons/home.png"),
      route: "/user_dashboard",
    },
    {
      key: "scan",
      label: "Scan",
      icon: require("../assets/icons/scan.png"),
      route: "/user_dashboard/user_scan",
    },
    {
      key: "map",
      label: "Map",
      icon: require("../assets/icons/map.png"),
      route: "/user_dashboard/user_map",
    },
    {
      key: "messages",
      label: "Messages",
      icon: require("../assets/icons/chatting.png"),
      route: "/user_dashboard/messages",
    },
    {
      key: "profile",
      label: "Profile",
      icon: require("../assets/icons/user.png"),
      route: "/user_dashboard/profile",
    },
    {
      key: "settings",
      label: "Settings",
      icon: require("../assets/icons/setting_1.png"),
      route: "/user_dashboard/settings",
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
              <Image source={item.icon} style={styles.navImage} />

              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <Image source={item.icon} style={styles.navImage} />
          )}

          <Text
            style={[
              styles.navLabel,
              active === item.key && styles.navActive,
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
    marginBottom: 2,
    resizeMode: "contain",
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
