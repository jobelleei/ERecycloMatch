import { useMemo, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

type FacilityNotification = {
  id: string;
  type: "request" | "message" | "listing" | "transaction" | "approval";
  title: string;
  description: string;
  createdAt: string;
  read: boolean;
};

const mockNotifications: FacilityNotification[] = [
  {
    id: "1",
    type: "request",
    title: "New match request",
    description: "Juan Dela Cruz requested a match for an old laptop.",
    createdAt: "Just now",
    read: false,
  },
  {
    id: "2",
    type: "message",
    title: "New message",
    description: "You received a new message from Maria Santos.",
    createdAt: "8 minutes ago",
    read: false,
  },
  {
    id: "3",
    type: "listing",
    title: "New nearby listing",
    description: "A damaged smartphone was listed near your facility.",
    createdAt: "25 minutes ago",
    read: false,
  },
  {
    id: "4",
    type: "transaction",
    title: "Transaction completed",
    description: "Your recycling transaction was marked as finished.",
    createdAt: "Yesterday",
    read: true,
  },
  {
    id: "5",
    type: "approval",
    title: "Facility profile approved",
    description: "Your facility profile has been approved by the administrator.",
    createdAt: "2 days ago",
    read: true,
  },
];

export default function FacilityNotifications() {
  const router = useRouter();
  const [notifications, setNotifications] =
    useState<FacilityNotification[]>(mockNotifications);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications],
  );

  const markAsRead = (id: string) => {
    setNotifications((current) =>
      current.map((item) =>
        item.id === id ? { ...item, read: true } : item,
      ),
    );
  };

  const markAllAsRead = () => {
    setNotifications((current) =>
      current.map((item) => ({ ...item, read: true })),
    );
  };

  const openNotification = (item: FacilityNotification) => {
    markAsRead(item.id);

    if (item.type === "request" || item.type === "message") {
      router.push("/facility_dashboard/messages" as any);
      return;
    }

    if (item.type === "listing") {
      router.push("/facility_dashboard" as any);
      return;
    }

    if (item.type === "transaction") {
      router.push("/facility_dashboard/profile" as any);
      return;
    }

    router.push("/facility_dashboard/settings" as any);
  };

  const getIcon = (type: FacilityNotification["type"]) => {
    switch (type) {
      case "request":
        return "↔";
      case "message":
        return "✉";
      case "listing":
        return "♻";
      case "transaction":
        return "✓";
      case "approval":
        return "★";
      default:
        return "•";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtitle}>
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
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
              unreadCount === 0 && styles.markAllDisabled,
            ]}
          >
            Mark all read
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          notifications.length === 0 && styles.emptyList,
        ]}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.card,
              !item.read && styles.unreadCard,
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
              <Text style={styles.iconText}>{getIcon(item.type)}</Text>
            </View>

            <View style={styles.cardContent}>
              <View style={styles.titleRow}>
                <Text
                  style={[
                    styles.title,
                    !item.read && styles.unreadTitle,
                  ]}
                >
                  {item.title}
                </Text>

                {!item.read && <View style={styles.unreadDot} />}
              </View>

              <Text style={styles.description}>{item.description}</Text>
              <Text style={styles.time}>{item.createdAt}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyBell}>🔔</Text>
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptyDescription}>
              New match requests, messages, listings, and transaction updates
              will appear here.
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