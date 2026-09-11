import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import UserBottomNav from "../../components/UserBottomNav";
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

function SwipeableNotificationRow({
  item,
  onDelete,
  children,
}: {
  item: NotificationItem;
  onDelete: (item: NotificationItem) => void;
  children: React.ReactNode;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const openValue = -80;

  const closeRow = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };

  const openRow = () => {
    Animated.spring(translateX, {
      toValue: openValue,
      useNativeDriver: true,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_, g) => {
        if (g.dx < 0) {
          translateX.setValue(Math.max(g.dx, openValue));
        }
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx < -35) openRow();
        else closeRow();
      },
    }),
  ).current;

  return (
    <View style={styles.swipeWrapper}>
      <View style={styles.behindDelete}>
        <TouchableOpacity
          style={styles.behindDeleteBtn}
          onPress={() => {
            closeRow();
            onDelete(item);
          }}
        >
          <Text style={styles.behindDeleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
      <Animated.View
        style={{ transform: [{ translateX }] }}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

export default function UserNotifications() {
  const router = useRouter();

  const [userId, setUserId] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications],
  );

  const displayedNotifications = useMemo(() => {
    if (activeTab === "unread") {
      return notifications.filter((item) => !item.read);
    }
    return notifications;
  }, [notifications, activeTab]);

  useEffect(() => {
    resolveAndLoadUser();
  }, []);

  useEffect(() => {
    if (!userId) return;

    fetchNotifications(userId);

    const channelId = `user-notif-bell-${userId}-${Date.now()}`;
    const channel = supabase.channel(channelId);

    channel
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        (payload: any) => {
          const targetId = payload.new?.profile_id || payload.old?.profile_id;
          if (Number(targetId) === Number(userId)) {
            fetchNotifications(userId);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const resolveAndLoadUser = async () => {
    try {
      setLoading(true);
      const stored = await AsyncStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        const actualUser = parsed?.user || parsed?.data || parsed;
        const candidateId = Number(actualUser?.id || parsed?.id);

        if (!isNaN(candidateId) && candidateId > 0) {
          setUserId(candidateId);
          return;
        }
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", user.email.toLowerCase().trim())
          .maybeSingle();

        if (profile?.id) {
          setUserId(Number(profile.id));
          return;
        }
      }
      setLoading(false);
    } catch (e) {
      console.log("RESOLVE USER ERROR:", e);
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
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const fetchNotifications = async (profileId: number) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("profile_id", profileId)
        .order("created_at", { ascending: false });

      if (error) {
        console.log("FETCH NOTIF ERROR:", error);
        setNotifications([]);
        return;
      }

      const mapped: NotificationItem[] = (data || []).map((notif: any) => ({
        id: String(notif.id),
        type: String(notif.type || ""),
        title: notif.title || "Notification",
        description: notif.message || "",
        createdAt: formatNotificationTime(notif.created_at),
        read: Boolean(notif.is_read),
        data: notif.data || {},
      }));

      setNotifications(mapped);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", Number(id));
  };

  const markAllAsRead = async () => {
    if (!userId) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("profile_id", userId)
      .eq("is_read", false);
  };

  const deleteNotification = (item: NotificationItem) => {
    Alert.alert("Delete", "Remove this notification?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setNotifications((prev) => prev.filter((n) => n.id !== item.id));
          await supabase
            .from("notifications")
            .delete()
            .eq("id", Number(item.id));
        },
      },
    ]);
  };

  const handleOpen = async (item: NotificationItem) => {
    await markAsRead(item.id);
    const type = String(item.type || "").toLowerCase();
    const data = item.data || {};

    if (
      type.includes("message") ||
      type.includes("new_message") ||
      type.includes("match")
    ) {
      if (data?.conversation_id) {
        router.push({
          pathname: "/user_dashboard/chat" as any,
          params: { conversationId: String(data.conversation_id) },
        });
        return;
      }
      router.push("/user_dashboard/messages" as any);
      return;
    }

    if (type.includes("facility")) {
      if (data?.facility_id) {
        router.push({
          pathname: "/user_dashboard/facility_details" as any,
          params: { facilityId: String(data.facility_id) },
        });
        return;
      }
      router.push("/user_dashboard/user_map" as any);
      return;
    }

    if (type.includes("item") || type.includes("approved")) {
      router.push("/user_dashboard/user_myItems" as any);
      return;
    }
  };

  const renderItem = ({ item }: { item: NotificationItem }) => (
    <SwipeableNotificationRow item={item} onDelete={deleteNotification}>
      <TouchableOpacity
        style={[styles.itemCard, !item.read && styles.unreadItemCard]}
        activeOpacity={0.8}
        onPress={() => handleOpen(item)}
      >
        <View style={styles.dotColumn}>
          <View
            style={[styles.statusDot, !item.read && styles.unreadStatusDot]}
          />
        </View>

        <View style={styles.textColumn}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.itemDescription}>{item.description}</Text>
          <Text style={styles.itemTime}>{item.createdAt}</Text>
        </View>
      </TouchableOpacity>
    </SwipeableNotificationRow>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <Text style={styles.panelTitle}>Notifications</Text>
        <TouchableOpacity onPress={markAllAsRead}>
          <Text style={styles.markAllRead}>Mark all as read</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <View style={styles.tabsLeft}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "all" && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab("all")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "all" && styles.tabTextActive,
              ]}
            >
              All Notifications
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "unread" && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab("unread")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "unread" && styles.tabTextActive,
              ]}
            >
              Unread ({unreadCount})
            </Text>
          </TouchableOpacity>
        </View>

        <Ionicons name="filter-outline" size={18} color="#777" />
      </View>

      {loading ? (
        <View style={styles.loaderArea}>
          <ActivityIndicator size="small" color="#2e7d32" />
        </View>
      ) : (
        <FlatList
          data={displayedNotifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyArea}>
              <Text style={styles.emptyText}>No notifications here</Text>
            </View>
          }
        />
      )}

      {userId ? <UserBottomNav userId={String(userId)} active="home" /> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1a1a1a",
  },
  markAllRead: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2e7d32",
  },
  tabsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
    paddingHorizontal: 16,
  },
  tabsLeft: {
    flexDirection: "row",
    gap: 18,
  },
  tabButton: {
    paddingBottom: 10,
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: "#2e7d32",
  },
  tabText: {
    fontSize: 14,
    color: "#777777",
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#2e7d32",
    fontWeight: "700",
  },
  listContainer: {
    paddingBottom: 100,
  },
  swipeWrapper: {
    position: "relative",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  behindDelete: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: "#d32f2f",
    justifyContent: "center",
    alignItems: "center",
  },
  behindDeleteBtn: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  behindDeleteText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 13,
  },
  itemCard: {
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#ffffff",
  },
  unreadItemCard: {
    backgroundColor: "#eaf5e8",
  },
  dotColumn: {
    width: 22,
    paddingTop: 4,
    alignItems: "flex-start",
  },
  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: "transparent",
  },
  unreadStatusDot: {
    backgroundColor: "#2e7d32",
  },
  textColumn: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 3,
  },
  itemDescription: {
    fontSize: 13,
    color: "#4a4a4a",
    lineHeight: 18,
  },
  itemTime: {
    fontSize: 11,
    color: "#8a9a86",
    marginTop: 4,
  },
  loaderArea: {
    paddingTop: 40,
    alignItems: "center",
  },
  emptyArea: {
    paddingTop: 60,
    alignItems: "center",
  },
  emptyText: {
    color: "#888888",
    fontSize: 13,
  },
});
