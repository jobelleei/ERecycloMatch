import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import useUnreadCount from "./hooks/useUnreadCount";

type ActivePage = "home" | "map" | "messages" | "profile" | "settings";

type Props = {
  facilityId: string;
  active: ActivePage;
};

interface NavItemConfig {
  key: ActivePage;
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  route: string;
}

export default function FacilityBottomNav({ facilityId, active }: Props) {
  const router = useRouter();

  const unreadCount = useUnreadCount(facilityId, "facility");

  const go = (route: string) => {
    router.replace(route as any);
  };

  const navItems: NavItemConfig[] = [
    {
      key: "home",
      label: "Home",
      iconName: "home-outline",
      route: "/facility_dashboard",
    },
    {
      key: "map",
      label: "Map",
      iconName: "map-outline",
      route: "/facility_dashboard/facility_map",
    },
    {
      key: "messages",
      label: "Messages",
      iconName: "chatbubble-ellipses-outline",
      route: "/facility_dashboard/messages",
    },
    {
      key: "profile",
      label: "Profile",
      iconName: "person-outline",
      route: "/facility_dashboard/profile",
    },
    {
      key: "settings",
      label: "Settings",
      iconName: "settings-outline",
      route: "/facility_dashboard/settings",
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
              activeOpacity={0.7}
              onPress={() => go(item.route)}
            >
              {isActive && <View style={styles.activeDot} />}

              <View style={styles.iconWrapper}>
                <Ionicons name={item.iconName} size={23} color={iconColor} />

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
    paddingBottom: 10,
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
  },

  activeDot: {
    position: "absolute",
    top: -5,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: "#2f7d1f",
    borderWidth: 1.5,
    borderColor: "#ffffff",
  },

  iconWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },

  navLabel: {
    fontSize: 11,
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
    top: -5,
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
