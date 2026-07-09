import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import useUnreadCount from "./hoooks/useUnreadCount";

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
});