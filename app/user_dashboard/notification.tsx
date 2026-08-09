import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePathname, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../utils/supabase";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  description: string;
  createdAt: string;
  read: boolean;
  data?: any;
};

export default function UserNotifications() {
  const router = useRouter();
  const pathname = usePathname();

  const [userId, setUserId] = useState("");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications],
  );

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (!userId) return;

    fetchNotifications(userId);

    const channel = supabase
      .channel(`user-notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `profile_id=eq.${userId}`,
        },
        () => {
          fetchNotifications(userId);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem("user");

      if (!stored) {
        setLoading(false);
        return;
      }

      const parsed = JSON.parse(stored);
      const actualUser = parsed?.user || parsed?.data || parsed;

      const id =
        actualUser?.id ||
        actualUser?.user_id ||
        parsed?.id ||
        parsed?.user_id ||
        "";

      if (!id) {
        console.log("USER NOTIFICATIONS: User ID not found.");
        setLoading(false);
        return;
      }

      setUserId(String(id));
    } catch (error) {
      console.log("LOAD USER NOTIFICATIONS ERROR:", error);
      setLoading(false);
    }
  };

  const formatNotificationTime = (dateValue: string) => {
    if (!dateValue) return "";

    const date = new Date(dateValue);

    if (isNaN(date.getTime())) return "";

    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";

    if (minutes < 60) {
      return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    }

    if (hours < 24) {
      return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    }

    if (days === 1) return "Yesterday";

    if (days < 7) {
      return `${days} days ago`;
    }

    return date.toLocaleDateString();
  };

  const fetchNotifications = async (currentUserId = userId) => {
    try {
      if (!currentUserId) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("profile_id", Number(currentUserId))
        .order("created_at", { ascending: false });

      if (error) {
        console.log("FETCH USER NOTIFICATIONS ERROR:", error);
        setNotifications([]);
        return;
      }

      const mapped: NotificationItem[] = (data || []).map(
        (notification: any) => ({
          id: String(notification.id),
          type: String(notification.type || ""),
          title: notification.title || "Notification",
          description: notification.message || "",
          createdAt: formatNotificationTime(notification.created_at),
          read: Boolean(notification.is_read),
          data: notification.data || {},
        }),
      );

      setNotifications(mapped);
    } catch (error) {
      console.log("USER NOTIFICATIONS ERROR:", error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      setNotifications((current) =>
        current.map((item) =>
          item.id === notificationId ? { ...item, read: true } : item,
        ),
      );

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", Number(notificationId));

      if (error) {
        console.log("MARK USER NOTIFICATION READ ERROR:", error);
      }
    } catch (error) {
      console.log("MARK USER NOTIFICATION READ ERROR:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      if (!userId) return;

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          read: true,
        })),
      );

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("profile_id", Number(userId))
        .eq("is_read", false);

      if (error) {
        console.log("MARK ALL USER NOTIFICATIONS READ ERROR:", error);
      }
    } catch (error) {
      console.log("MARK ALL USER NOTIFICATIONS READ ERROR:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    const cleanType = String(type || "")
      .trim()
      .toLowerCase();

    switch (cleanType) {
      case "match":
      case "match_accepted":
      case "match_request":
        return "✓";

      case "message":
      case "new_message":
        return "✉";

      case "transaction":
      case "transaction_completed":
      case "finished":
        return "♻";

      case "approval":
      case "item_approved":
      case "listing_approved":
        return "✓";

      case "nearby_facility":
        return "📍";

      default:
        return "•";
    }
  };

  const openNotification = async (item: NotificationItem) => {
    await markAsRead(item.id);

    const type = String(item.type || "")
      .trim()
      .toLowerCase();

    if (
      type === "message" ||
      type === "new_message" ||
      type === "match" ||
      type === "match_accepted" ||
      type === "match_request"
    ) {
      router.push("/user_dashboard/messages" as any);
      return;
    }

    if (
      type === "transaction" ||
      type === "transaction_completed" ||
      type === "finished"
    ) {
      router.push("/user_dashboard/profile" as any);
      return;
    }

    if (
      type === "approval" ||
      type === "item_approved" ||
      type === "listing_approved"
    ) {
      router.push("/user_dashboard/user_myItems" as any);
      return;
    }

    if (type === "nearby_facility") {
      router.push("/user_dashboard/user_map" as any);
      return;
    }

    router.push("/user_dashboard" as any);
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
          style={[styles.iconCircle, !item.read && styles.unreadIconCircle]}
        >
          <Text style={styles.iconText}>{getNotificationIcon(item.type)}</Text>
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

          <Text style={styles.notificationDescription}>{item.description}</Text>

          {String(item.type).toLowerCase() === "nearby_facility" &&
            item?.data?.distance_km !== undefined && (
              <Text style={styles.notificationDescription}>
                📍 {Number(item.data.distance_km).toFixed(2)} km away
              </Text>
            )}

          <Text style={styles.notificationTime}>{item.createdAt}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#1b5e20" />
          <Text style={styles.emptyDescription}>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

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

        <TouchableOpacity onPress={markAllAsRead} disabled={unreadCount === 0}>
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
        refreshing={loading}
        onRefresh={() => fetchNotifications(userId)}
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
              Match, nearby facility, message, transaction, and approval updates
              will appear here.
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
          onPress={() => router.push("/user_dashboard/user_scan" as any)}
        >
          <Image
            source={require("../../assets/icons/scan.png")}
            style={styles.navImage}
          />
          <Text style={styles.navLabel}>Scan</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/user_dashboard/user_map" as any)}
        >
          <Image
            source={require("../../assets/icons/map.png")}
            style={styles.navImage}
          />
          <Text style={styles.navLabel}>Map</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/user_dashboard/messages" as any)}
        >
          <Image
            source={require("../../assets/icons/chatting.png")}
            style={styles.navImage}
          />
          <Text style={styles.navLabel}>Messages</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/user_dashboard/profile" as any)}
        >
          <Image
            source={require("../../assets/icons/user.png")}
            style={styles.navImage}
          />
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/user_dashboard/settings" as any)}
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
