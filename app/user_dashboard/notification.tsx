import { usePathname, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type NotificationItem = {
  id: string;
  type: "match" | "message" | "transaction" | "approval";
  title: string;
  description: string;
  createdAt: string;
  read: boolean;
};

const mockNotifications: NotificationItem[] = [
  {
    id: "1",
    type: "match",
    title: "Match accepted",
    description:
      "Green Cycle Facility accepted your request for the old laptop.",
    createdAt: "Just now",
    read: false,
  },
  {
    id: "2",
    type: "message",
    title: "New message",
    description: "Green Cycle Facility sent you a new message.",
    createdAt: "10 minutes ago",
    read: false,
  },
  {
    id: "3",
    type: "transaction",
    title: "Transaction finished",
    description:
      "Your recycling transaction has been completed successfully.",
    createdAt: "Yesterday",
    read: true,
  },
  {
    id: "4",
    type: "approval",
    title: "Listing approved",
    description: "Your uploaded item is now visible to facilities.",
    createdAt: "2 days ago",
    read: true,
  },
];

export default function UserNotifications() {
  const router = useRouter();
  const pathname = usePathname();

  const [notifications, setNotifications] =
    useState<NotificationItem[]>(mockNotifications);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications],
  );

  const markAsRead = (notificationId: string) => {
    setNotifications((current) =>
      current.map((item) =>
        item.id === notificationId ? { ...item, read: true } : item,
      ),
    );
  };

  const markAllAsRead = () => {
    setNotifications((current) =>
      current.map((item) => ({ ...item, read: true })),
    );
  };

  const getNotificationIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "match":
        return "✓";
      case "message":
        return "✉";
      case "transaction":
        return "♻";
      case "approval":
        return "✓";
      default:
        return "•";
    }
  };

  const openNotification = (item: NotificationItem) => {
    markAsRead(item.id);

    if (item.type === "message" || item.type === "match") {
      router.push("/user_dashboard/messages" as any);
      return;
    }

    if (item.type === "transaction") {
      router.push("/user_dashboard/profile" as any);
      return;
    }

    if (item.type === "approval") {
      router.push("/user_dashboard/profile" as any);
    }
  };

  const renderNotification = ({ item }: { item: NotificationItem }) => {
    return (
      <TouchableOpacity
        style={[
          styles.notificationCard,
          !item.read && styles.unreadNotificationCard,
        ]}
        activeOpacity={0.8}
        onPress={() => openNotification(item)}
      >
        <View
          style={[
            styles.iconCircle,
            !item.read && styles.unreadIconCircle,
          ]}
        >
          <Text style={styles.iconText}>
            {getNotificationIcon(item.type)}
          </Text>
        </View>

        <View style={styles.notificationContent}>
          <View style={styles.notificationTitleRow}>
            <Text
              style={[
                styles.notificationTitle,
                !item.read && styles.unreadNotificationTitle,
              ]}
            >
              {item.title}
            </Text>

            {!item.read && <View style={styles.unreadDot} />}
          </View>

          <Text style={styles.notificationDescription}>
            {item.description}
          </Text>

          <Text style={styles.notificationTime}>{item.createdAt}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>

        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Notifications</Text>

          <Text style={styles.headerSubtitle}>
            {unreadCount > 0
              ? `${unreadCount} unread notification${
                  unreadCount === 1 ? "" : "s"
                }`
              : "You're all caught up"}
          </Text>
        </View>

        <TouchableOpacity
          onPress={markAllAsRead}
          disabled={unreadCount === 0}
        >
          <Text
            style={[
              styles.markAllText,
              unreadCount === 0 && styles.disabledMarkAllText,
            ]}
          >
            Mark all read
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          notifications.length === 0 && styles.emptyListContent,
        ]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Text style={styles.emptyIcon}>🔔</Text>
            </View>

            <Text style={styles.emptyTitle}>No notifications yet</Text>

            <Text style={styles.emptyDescription}>
              Match, message, transaction, and approval updates will appear
              here.
            </Text>
          </View>
        }
      />

      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/user_dashboard" as any)}
        >
          <Image
            source={require("../../assets/icons/home.png")}
            style={styles.navImage}
          />
          <Text
            style={[
              styles.navLabel,
              pathname === "/user_dashboard" && styles.navActive,
            ]}
          >
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() =>
            router.push("/user_dashboard/user_scan" as any)
          }
        >
          <Image
            source={require("../../assets/icons/scan.png")}
            style={styles.navImage}
          />
          <Text style={styles.navLabel}>Scan</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() =>
            router.push("/user_dashboard/user_map" as any)
          }
        >
          <Image
            source={require("../../assets/icons/map.png")}
            style={styles.navImage}
          />
          <Text style={styles.navLabel}>Map</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() =>
            router.push("/user_dashboard/messages" as any)
          }
        >
          <Image
            source={require("../../assets/icons/chatting.png")}
            style={styles.navImage}
          />
          <Text style={styles.navLabel}>Messages</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() =>
            router.push("/user_dashboard/profile" as any)
          }
        >
          <Image
            source={require("../../assets/icons/user.png")}
            style={styles.navImage}
          />
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() =>
            router.push("/user_dashboard/settings" as any)
          }
        >
          <Image
            source={require("../../assets/icons/setting_1.png")}
            style={styles.navImage}
          />
          <Text style={styles.navLabel}>Settings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f5f3",
  },

  header: {
    minHeight: 92,
    backgroundColor: "#1b5e20",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },

  backButton: {
    width: 34,
    height: 44,
    alignItems: "flex-start",
    justifyContent: "center",
  },

  backText: {
    color: "#ffffff",
    fontSize: 38,
    lineHeight: 40,
  },

  headerTextContainer: {
    flex: 1,
    marginLeft: 4,
  },

  headerTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "800",
  },

  headerSubtitle: {
    color: "#dcefdc",
    fontSize: 12,
    marginTop: 3,
  },

  markAllText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },

  disabledMarkAllText: {
    color: "#8bb58d",
  },

  listContent: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 100,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  notificationCard: {
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    elevation: 1,
    shadowColor: "#000000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },

  unreadNotificationCard: {
    backgroundColor: "#f1f8f2",
    borderColor: "#b8d9ba",
  },

  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#eeeeee",
    alignItems: "center",
    justifyContent: "center",
  },

  unreadIconCircle: {
    backgroundColor: "#1b5e20",
  },

  iconText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "800",
  },

  notificationContent: {
    flex: 1,
    marginLeft: 12,
  },

  notificationTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  notificationTitle: {
    flex: 1,
    color: "#333333",
    fontSize: 15,
    fontWeight: "600",
  },

  unreadNotificationTitle: {
    color: "#1b5e20",
    fontWeight: "800",
  },

  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#1b5e20",
    marginLeft: 8,
  },

  notificationDescription: {
    color: "#555555",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },

  notificationTime: {
    color: "#8a8a8a",
    fontSize: 11,
    marginTop: 7,
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 36,
    paddingBottom: 80,
  },

  emptyIconCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: "#e5f1e6",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyIcon: {
    fontSize: 32,
  },

  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "800",
    color: "#222222",
  },

  emptyDescription: {
    marginTop: 7,
    textAlign: "center",
    color: "#777777",
    fontSize: 13,
    lineHeight: 19,
  },

  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    minHeight: 70,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#dddddd",
    paddingBottom: 8,
    paddingTop: 7,
  },

  navItem: {
    alignItems: "center",
    justifyContent: "center",
  },

  navImage: {
    width: 23,
    height: 23,
    marginBottom: 2,
  },

  navLabel: {
    color: "#777777",
    fontSize: 11,
  },

  navActive: {
    color: "#1b5e20",
    fontWeight: "800",
  },
});