import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../utils/supabase";

type FacilityNotification = {
  id: string;
  type: string;
  title: string;
  description: string;
  createdAt: string;
  rawCreatedAt: string;
  read: boolean;
  data?: any;
};

export default function FacilityNotifications() {
  const router = useRouter();

  const [facilityId, setFacilityId] = useState("");
  const [notifications, setNotifications] = useState<FacilityNotification[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications],
  );

  useEffect(() => {
    loadFacility();
  }, []);

  useEffect(() => {
    if (!facilityId) return;

    fetchNotifications();

    const channel = supabase
      .channel(`facility-notifications-${facilityId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `profile_id=eq.${facilityId}`,
        },
        () => {
          fetchNotifications();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [facilityId]);

  const loadFacility = async () => {
    try {
      const storedFacility = await AsyncStorage.getItem("facility");

      const storedUser = await AsyncStorage.getItem("user");

      let parsed: any = null;

      if (storedFacility) {
        parsed = JSON.parse(storedFacility);
      } else if (storedUser) {
        parsed = JSON.parse(storedUser);
      }

      if (!parsed) {
        console.log("FACILITY NOTIFICATION: No stored facility found.");
        setLoading(false);
        return;
      }

      const actualFacility =
        parsed?.facility || parsed?.user || parsed?.data || parsed;

      const id =
        actualFacility?.id ||
        actualFacility?.facility_id ||
        parsed?.id ||
        parsed?.facility_id ||
        "";

      console.log("FACILITY NOTIFICATION ID:", id);

      if (!id) {
        setLoading(false);
        return;
      }

      setFacilityId(String(id));
    } catch (error) {
      console.log("LOAD FACILITY NOTIFICATION ERROR:", error);

      setLoading(false);
    }
  };

  const formatNotificationTime = (dateValue: string) => {
    if (!dateValue) {
      return "";
    }

    const date = new Date(dateValue);

    if (isNaN(date.getTime())) {
      return "";
    }

    const now = new Date();

    const difference = now.getTime() - date.getTime();

    const minutes = Math.floor(difference / 60000);

    const hours = Math.floor(difference / 3600000);

    const days = Math.floor(difference / 86400000);

    if (minutes < 1) {
      return "Just now";
    }

    if (minutes < 60) {
      return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    }

    if (hours < 24) {
      return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    }

    if (days === 1) {
      return "Yesterday";
    }

    if (days < 7) {
      return `${days} days ago`;
    }

    return date.toLocaleDateString();
  };

  const mapNotification = (notification: any): FacilityNotification => {
    return {
      id: String(notification.id),

      type: String(notification.type || ""),

      title: notification.title || "Notification",

      description: notification.message || "",

      createdAt: formatNotificationTime(notification.created_at),

      rawCreatedAt: notification.created_at || "",

      read: Boolean(notification.is_read),

      data: notification.data || {},
    };
  };

  const fetchNotifications = async () => {
    try {
      if (!facilityId) {
        return;
      }

      setLoading(true);

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("profile_id", Number(facilityId))
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.log("FETCH FACILITY NOTIFICATIONS ERROR:", error);

        setNotifications([]);
        return;
      }

      const mappedNotifications = (data || []).map(mapNotification);

      console.log("FACILITY NOTIFICATIONS:", mappedNotifications);

      setNotifications(mappedNotifications);
    } catch (error) {
      console.log("FACILITY NOTIFICATIONS ERROR:", error);

      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      setNotifications((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                read: true,
              }
            : item,
        ),
      );

      const { error } = await supabase
        .from("notifications")
        .update({
          is_read: true,
        })
        .eq("id", Number(id));

      if (error) {
        console.log("MARK NOTIFICATION READ ERROR:", error);
      }
    } catch (error) {
      console.log("MARK READ ERROR:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      if (!facilityId) {
        return;
      }

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          read: true,
        })),
      );

      const { error } = await supabase
        .from("notifications")
        .update({
          is_read: true,
        })
        .eq("profile_id", Number(facilityId))
        .eq("is_read", false);

      if (error) {
        console.log("MARK ALL READ ERROR:", error);
      }
    } catch (error) {
      console.log("MARK ALL READ ERROR:", error);
    }
  };

  const openNotification = async (item: FacilityNotification) => {
    await markAsRead(item.id);

    const type = String(item.type).trim().toLowerCase();

    /*
     * 5 KM NEARBY LISTING
     */
    if (type === "nearby_listing" || type === "listing") {
      const itemId = item?.data?.item_id;

      if (itemId) {
        router.push({
          pathname: "/facility_dashboard/item_details",
          params: {
            item_id: String(itemId),
          },
        });

        return;
      }

      router.push("/facility_dashboard" as any);

      return;
    }

    /*
     * MATCH REQUEST
     */
    if (
      type === "request" ||
      type === "match_request" ||
      type === "match_pending"
    ) {
      router.push("/facility_dashboard/messages" as any);

      return;
    }

    /*
     * MESSAGE
     */
    if (type === "message" || type === "new_message") {
      router.push("/facility_dashboard/messages" as any);

      return;
    }

    /*
     * TRANSACTION
     */
    if (
      type === "transaction" ||
      type === "transaction_completed" ||
      type === "finished"
    ) {
      router.push("/facility_dashboard/recycling_history" as any);

      return;
    }

    /*
     * PROFILE APPROVAL
     */
    if (type === "approval" || type === "facility_approved") {
      router.push("/facility_dashboard/profile" as any);

      return;
    }

    router.push("/facility_dashboard" as any);
  };

  const getIcon = (type: string) => {
    const cleanType = String(type).trim().toLowerCase();

    switch (cleanType) {
      case "request":
      case "match_request":
      case "match_pending":
        return "↔";

      case "message":
      case "new_message":
        return "✉";

      case "listing":
      case "nearby_listing":
        return "♻";

      case "transaction":
      case "transaction_completed":
      case "finished":
        return "✓";

      case "approval":
      case "facility_approved":
        return "★";

      default:
        return "•";
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1b5e20" />

        <Text style={styles.loadingText}>Loading notifications...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>

        <View style={styles.headerContent}>
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
              unreadCount === 0 && styles.markAllDisabled,
            ]}
          >
            Mark all read
          </Text>
        </TouchableOpacity>
      </View>

      {/* NOTIFICATION LIST */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={fetchNotifications}
        contentContainerStyle={[
          styles.listContent,

          notifications.length === 0 && styles.emptyList,
        ]}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, !item.read && styles.unreadCard]}
            activeOpacity={0.8}
            onPress={() => openNotification(item)}
          >
            <View
              style={[styles.iconCircle, !item.read && styles.unreadIconCircle]}
            >
              <Text style={styles.iconText}>{getIcon(item.type)}</Text>
            </View>

            <View style={styles.cardContent}>
              <View style={styles.titleRow}>
                <Text style={[styles.title, !item.read && styles.unreadTitle]}>
                  {item.title}
                </Text>

                {!item.read && <View style={styles.unreadDot} />}
              </View>

              <Text style={styles.description}>{item.description}</Text>

              {item.type === "nearby_listing" &&
                item?.data?.distance_km !== undefined && (
                  <Text style={styles.distanceText}>
                    📍 {Number(item.data.distance_km).toFixed(2)} km away
                  </Text>
                )}

              <Text style={styles.time}>{item.createdAt}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyBell}>🔔</Text>

            <Text style={styles.emptyTitle}>No notifications yet</Text>

            <Text style={styles.emptyDescription}>
              New nearby listings, match requests, messages, and transaction
              updates will appear here.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f5f3",
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: "#f3f5f3",
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 12,
    color: "#666666",
    fontSize: 14,
  },

  header: {
    minHeight: 92,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#1b5e20",
    flexDirection: "row",
    alignItems: "center",
  },

  backButton: {
    width: 34,
    height: 44,
    justifyContent: "center",
  },

  backText: {
    color: "#ffffff",
    fontSize: 38,
    lineHeight: 40,
  },

  headerContent: {
    flex: 1,
    marginLeft: 4,
  },

  headerTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "800",
  },

  headerSubtitle: {
    marginTop: 3,
    color: "#dcefdc",
    fontSize: 12,
  },

  markAllText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },

  markAllDisabled: {
    color: "#8bb58d",
  },

  listContent: {
    padding: 14,
    paddingBottom: 30,
  },

  emptyList: {
    flexGrow: 1,
  },

  card: {
    padding: 14,
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "flex-start",
    elevation: 1,
  },

  unreadCard: {
    backgroundColor: "#f1f8f2",
    borderColor: "#b8d9ba",
  },

  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#a5a5a5",
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

  cardContent: {
    flex: 1,
    marginLeft: 12,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  title: {
    flex: 1,
    color: "#333333",
    fontSize: 15,
    fontWeight: "600",
  },

  unreadTitle: {
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

  description: {
    marginTop: 4,
    color: "#555555",
    fontSize: 13,
    lineHeight: 19,
  },

  distanceText: {
    marginTop: 6,
    color: "#1b5e20",
    fontSize: 12,
    fontWeight: "700",
  },

  time: {
    marginTop: 7,
    color: "#8a8a8a",
    fontSize: 11,
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 36,
  },

  emptyBell: {
    fontSize: 44,
  },

  emptyTitle: {
    marginTop: 14,
    color: "#222222",
    fontSize: 18,
    fontWeight: "800",
  },

  emptyDescription: {
    marginTop: 7,
    color: "#777777",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
});
