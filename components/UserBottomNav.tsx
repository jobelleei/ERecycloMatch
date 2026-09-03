import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import useUnreadCount from "./hooks/useUnreadCount";

type ActivePage = "home" | "scan" | "map" | "messages" | "profile" | "settings";

type Props = {
  userId: string;
  active: ActivePage;
};

interface NavItemConfig {
  key: ActivePage;
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  route: string;
}

export default function UserBottomNav({ userId, active }: Props) {
  const router = useRouter();
  const unreadCount = useUnreadCount(userId, "user");

  const go = (route: string) => {
    router.replace(route as any);
  };

  const navItems: NavItemConfig[] = [
    {
      key: "home",
      label: "Home",
      iconName: "home-outline",
      route: "/user_dashboard",
    },
    {
      key: "scan",
      label: "Scan",
      iconName: "scan-outline",
      route: "/user_dashboard/user_scan",
    },
    {
      key: "map",
      label: "Map",
      iconName: "map-outline",
      route: "/user_dashboard/user_map",
    },
    {
      key: "messages",
      label: "Messages",
      iconName: "chatbubble-ellipses-outline",
      route: "/user_dashboard/messages",
    },
    {
      key: "profile",
      label: "Profile",
      iconName: "person-outline",
      route: "/user_dashboard/profile",
    },
    {
      key: "settings",
      label: "Settings",
      iconName: "settings-outline",
      route: "/user_dashboard/settings",
    },
  ];

  return (
    <View style={styles.outerContainer}>
      <View style={styles.bottomNav}>
        {navItems.map((item) => {
          const isActive = active === item.key;
          const iconColor = isActive ? "#2f7d1f" : "#444444";

          return (
            <TouchableOpacity
              key={item.key}
              style={styles.navItem}
              activeOpacity={0.8}
              onPress={() => go(item.route)}
            >
              {/* Reference notch arch & white dot */}
              {isActive && (
                <View style={styles.notchWrapper} pointerEvents="none">
                  <Svg width="56" height="26" viewBox="0 0 56 26">
                    {/* The smooth scooped curve connecting to the top edge */}
                    <Path
                      d="M0,0 C14,0 18,18 28,18 C38,18 42,0 56,0 L56,0 Z"
                      fill="#2f7d1f"
                    />
                    {/* The floating white dot centered in the scoop */}
                    <Circle cx="28" cy="8" r="4" fill="#ffffff" />
                  </Svg>
                </View>
              )}

              <View style={styles.iconWrapper}>
                <Ionicons name={item.iconName} size={22} color={iconColor} />

                {item.key === "messages" && unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={[styles.navLabel, isActive && styles.navActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingBottom: 12,
    backgroundColor: "transparent",
  },

  bottomNav: {
    width: "94%",
    height: 64,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#ededed",
  },

  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    position: "relative",
    paddingTop: 8,
  },

  notchWrapper: {
    position: "absolute",
    top: -1,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },

  iconWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },

  navLabel: {
    fontSize: 10.5,
    color: "#777777",
    marginTop: 3,
    fontWeight: "500",
  },

  navActive: {
    color: "#2f7d1f",
    fontWeight: "700",
  },

  badge: {
    position: "absolute",
    top: -4,
    right: -9,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#E53935",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },

  badgeText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "bold",
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
