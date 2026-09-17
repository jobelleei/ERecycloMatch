import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  PanResponder,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import UserBottomNav from "../../components/UserBottomNav";
import { supabase } from "../../utils/supabase";

type NotificationItem = {
  id: string;
  type: "message" | "item_status" | "facility_nearby" | "system";
  title: string;
  description: string;
  createdAt: string;
  read: boolean;
  unreadCount?: number;
  data?: any;
  timestamp: number;
};

// Haversine distance formula in kilometers
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

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

  const [userId, setUserId] = useState<string>("");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications],
  );

  const displayedNotifications = useMemo(() => {
    let result =
      activeTab === "unread"
        ? notifications.filter((item) => !item.read)
        : [...notifications];

    result.sort((a, b) =>
      sortOrder === "newest"
        ? b.timestamp - a.timestamp
        : a.timestamp - b.timestamp,
    );

    return result;
  }, [notifications, activeTab, sortOrder]);

  useEffect(() => {
    resolveAndLoadUser();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        fetchAllUpdates(userId);
      }
    }, [userId]),
  );

  useEffect(() => {
    if (!userId) return;

    const channelId = `user-notif-hub-${userId}-${Date.now()}`;
    const channel = supabase.channel(channelId);

    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        () => fetchAllUpdates(userId),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `user_id=eq.${userId}`,
        },
        () => fetchAllUpdates(userId),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "items",
          filter: `user_id=eq.${userId}`,
        },
        () => fetchAllUpdates(userId),
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
        const candidateId = String(actualUser?.id || parsed?.id || "");

        if (candidateId) {
          setUserId(candidateId);
          await fetchAllUpdates(candidateId);
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
          const profileIdStr = String(profile.id);
          setUserId(profileIdStr);
          await fetchAllUpdates(profileIdStr);
          return;
        }
      }
    } catch (e) {
      console.log("Error loading user context:", e);
    } finally {
      setLoading(false);
    }
  };

  const formatRelativeTime = (dateValue: string | number) => {
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
    if (days === 1) return "Yesterday";
    return `${days}d ago`;
  };

  const fetchAllUpdates = async (currentUserId: string) => {
    try {
      const combined: NotificationItem[] = [];

      // 1. Fetch Conversations
      const { data: conversations } = await supabase
        .from("conversations")
        .select("*")
        .eq("user_id", currentUserId)
        .order("updated_at", { ascending: false });

      if (conversations && conversations.length > 0) {
        const numericUserId = Number(currentUserId);

        const { data: unreadMsgs } = await supabase
          .from("messages")
          .select("conversation_id, id")
          .eq("receiver_id", numericUserId)
          .eq("is_read", false);

        const unreadCountMap: Record<string, number> = {};
        (unreadMsgs || []).forEach((m: any) => {
          unreadCountMap[m.conversation_id] =
            (unreadCountMap[m.conversation_id] || 0) + 1;
        });

        conversations.forEach((c: any) => {
          const facilityName = c.facility_name || "Partnered Facility";
          const lastMsg = c.last_message || "";
          const timeVal = new Date(c.updated_at || c.created_at).getTime();
          const unreadForConv = unreadCountMap[c.id] || 0;
          const isUnread = !c.is_read || unreadForConv > 0;

          if (lastMsg) {
            combined.push({
              id: `conv-msg-${c.id}`,
              type: "message",
              title: `Message from ${facilityName}`,
              description: lastMsg,
              createdAt: formatRelativeTime(c.updated_at || c.created_at),
              read: !isUnread,
              unreadCount: unreadForConv,
              timestamp: isNaN(timeVal) ? Date.now() : timeVal,
              data: {
                conversation_id: c.id,
                facility_id: c.facility_id,
                facility_name: facilityName,
              },
            });
          }
        });
      }

      // 2. Fetch User Listed Items
      const { data: items } = await supabase
        .from("items")
        .select("*")
        .eq("user_id", currentUserId)
        .order("updated_at", { ascending: false });

      (items || []).forEach((item: any) => {
        const matchStatus = (
          item.match_status ||
          item.status ||
          "Listed"
        ).trim();
        const itemName = item.item_name || "Your listed item";
        const timeVal = new Date(item.updated_at || item.created_at).getTime();

        let description = `Listing status: ${matchStatus}`;
        if (matchStatus.toLowerCase() === "matched") {
          description = `Great news! "${itemName}" has been matched with a facility.`;
        } else if (matchStatus.toLowerCase() === "pending match") {
          description = `Request pending confirmation for "${itemName}".`;
        } else if (matchStatus.toLowerCase() === "finished") {
          description = `Recycling completed for "${itemName}".`;
        }

        combined.push({
          id: `item-stat-${item.id}`,
          type: "item_status",
          title: `Listing Update: ${itemName}`,
          description: description,
          createdAt: formatRelativeTime(item.updated_at || item.created_at),
          read: true,
          timestamp: isNaN(timeVal) ? Date.now() : timeVal,
          data: {
            item_id: item.id,
          },
        });
      });

      // 3. Nearby facilities within 5km
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });

          const { data: facilities } = await supabase
            .from("profiles")
            .select("id, name, latitude, longitude, address, location")
            .ilike("role", "facility")
            .ilike("status", "approved");

          (facilities || []).forEach((fac: any) => {
            const fLat = parseFloat(fac.latitude);
            const fLng = parseFloat(fac.longitude);

            if (!isNaN(fLat) && !isNaN(fLng)) {
              const dist = getDistanceKm(
                loc.coords.latitude,
                loc.coords.longitude,
                fLat,
                fLng,
              );

              if (dist <= 5) {
                combined.push({
                  id: `nearby-fac-${fac.id}`,
                  type: "facility_nearby",
                  title: "Recycling Facility Nearby",
                  description: `${fac.name || "A partnered facility"} is only ${dist.toFixed(1)} km away from you.`,
                  createdAt: `${dist.toFixed(1)} km`,
                  read: false,
                  timestamp: Date.now(),
                  data: {
                    facility_id: fac.id,
                  },
                });
              }
            }
          });
        }
      } catch (locErr) {
        console.log("Location checking skipped:", locErr);
      }

      setNotifications(combined);
    } catch (err) {
      console.log("FETCH ALL UPDATES ERROR:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markAsRead = async (item: NotificationItem) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === item.id ? { ...n, read: true, unreadCount: 0 } : n,
      ),
    );

    if (item.type === "message" && item.data?.conversation_id) {
      await supabase
        .from("conversations")
        .update({ is_read: true })
        .eq("id", String(item.data.conversation_id));

      if (userId) {
        await supabase
          .from("messages")
          .update({ is_read: true })
          .eq("conversation_id", String(item.data.conversation_id))
          .eq("receiver_id", Number(userId));
      }
    }
  };

  const markAllAsRead = async () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true, unreadCount: 0 })),
    );

    if (!userId) return;

    await supabase
      .from("conversations")
      .update({ is_read: true })
      .eq("user_id", userId);

    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("receiver_id", Number(userId));
  };

  const deleteNotification = (item: NotificationItem) => {
    setNotifications((prev) => prev.filter((n) => n.id !== item.id));
  };

  const handleOpen = async (item: NotificationItem) => {
    if (dropdownOpen) setDropdownOpen(false);
    await markAsRead(item);

    if (item.type === "message" && item.data?.conversation_id) {
      router.push({
        pathname: "/user_dashboard/chat" as any,
        params: {
          conversationId: String(item.data.conversation_id),
          facility_id: String(item.data.facility_id || ""),
          facility_name: String(item.data.facility_name || "Facility"),
        },
      });
      return;
    }

    if (item.type === "item_status") {
      router.push("/user_dashboard/user_myItems" as any);
      return;
    }

    if (item.type === "facility_nearby") {
      if (item.data?.facility_id) {
        router.push({
          pathname: "/user_dashboard/facility_view_profile" as any,
          params: { facility_id: String(item.data.facility_id) },
        });
        return;
      }
      router.push("/user_dashboard/facility_list" as any);
      return;
    }
  };

  const selectSortOption = (order: "newest" | "oldest") => {
    setSortOrder(order);
    setDropdownOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "message":
        return "chatbubbles-outline";
      case "item_status":
        return "pricetags-outline";
      case "facility_nearby":
        return "location-outline";
      default:
        return "notifications-outline";
    }
  };

  const renderItem = ({ item }: { item: NotificationItem }) => (
    <SwipeableNotificationRow item={item} onDelete={deleteNotification}>
      <TouchableOpacity
        style={[styles.itemCard, !item.read && styles.unreadItemCardHighlight]}
        activeOpacity={0.82}
        onPress={() => handleOpen(item)}
      >
        {!item.read && <View style={styles.unreadAccentBar} />}

        <View style={styles.iconColumn}>
          <View
            style={[
              styles.iconCircle,
              !item.read ? styles.unreadIconCircle : styles.readIconCircle,
            ]}
          >
            <Ionicons
              name={getNotificationIcon(item.type) as any}
              size={19}
              color={!item.read ? "#1B5E20" : "#666"}
            />
          </View>
        </View>

        <View style={styles.textColumn}>
          <View style={styles.titleRow}>
            <View style={styles.titleWithBadge}>
              <Text
                style={[
                  styles.itemTitle,
                  !item.read && styles.unreadItemTitleText,
                ]}
                numberOfLines={1}
              >
                {item.title}
              </Text>

              {Boolean(item.unreadCount && item.unreadCount > 0) && (
                <View style={styles.unreadCountBadge}>
                  <Text style={styles.unreadCountText}>
                    {item.unreadCount! > 99 ? "99+" : item.unreadCount}
                  </Text>
                </View>
              )}
            </View>

            {!item.read && <View style={styles.unreadBadgeDot} />}
          </View>

          <Text
            style={[
              styles.itemDescription,
              !item.read && styles.unreadDescriptionText,
            ]}
            numberOfLines={2}
          >
            {item.description}
          </Text>
          <Text style={styles.itemTime}>{item.createdAt}</Text>
        </View>
      </TouchableOpacity>
    </SwipeableNotificationRow>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topHeader}>
        <Text style={styles.panelTitle}>Notifications</Text>
        <TouchableOpacity onPress={markAllAsRead}>
          <Text style={styles.markAllRead}>Mark all as read</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs and Dropdown Toggle Bar */}
      <View style={styles.tabsRow}>
        <View style={styles.tabsLeft}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "all" && styles.tabButtonActive,
            ]}
            onPress={() => {
              if (dropdownOpen) setDropdownOpen(false);
              setActiveTab("all");
            }}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "all" && styles.tabTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "unread" && styles.tabButtonActive,
            ]}
            onPress={() => {
              if (dropdownOpen) setDropdownOpen(false);
              setActiveTab("unread");
            }}
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

        {/* Light green options-outline filter button[cite: 8] */}
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setDropdownOpen((prev) => !prev)}
          activeOpacity={0.7}
        >
          <Ionicons name="options-outline" size={24} color="#66BB6A" />
        </TouchableOpacity>
      </View>

      {/* Outside tap overlay to dismiss dropdown */}
      {dropdownOpen && (
        <TouchableWithoutFeedback onPress={() => setDropdownOpen(false)}>
          <View style={styles.dropdownBackdrop} />
        </TouchableWithoutFeedback>
      )}

      {/* Dropdown Menu directly beneath the button */}
      {dropdownOpen && (
        <View style={styles.dropdownMenu}>
          <TouchableOpacity
            style={[
              styles.dropdownItem,
              sortOrder === "newest" && styles.dropdownItemSelected,
            ]}
            onPress={() => selectSortOption("newest")}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.dropdownItemText,
                sortOrder === "newest" && styles.dropdownItemTextSelected,
              ]}
            >
              Newest first
            </Text>
            {sortOrder === "newest" && (
              <Ionicons name="checkmark" size={17} color="#1B5E20" />
            )}
          </TouchableOpacity>

          <View style={styles.dropdownDivider} />

          <TouchableOpacity
            style={[
              styles.dropdownItem,
              sortOrder === "oldest" && styles.dropdownItemSelected,
            ]}
            onPress={() => selectSortOption("oldest")}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.dropdownItemText,
                sortOrder === "oldest" && styles.dropdownItemTextSelected,
              ]}
            >
              Oldest first
            </Text>
            {sortOrder === "oldest" && (
              <Ionicons name="checkmark" size={17} color="#1B5E20" />
            )}
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.loaderArea}>
          <ActivityIndicator size="small" color="#1B5E20" />
        </View>
      ) : (
        <FlatList
          data={displayedNotifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                if (userId) fetchAllUpdates(userId);
              }}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyArea}>
              <Ionicons
                name="notifications-off-outline"
                size={44}
                color="#bbb"
              />
              <Text style={styles.emptyText}>No notifications here</Text>
            </View>
          }
        />
      )}

      {userId ? <UserBottomNav userId={userId} active="home" /> : null}
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
    fontSize: 20,
    fontWeight: "800",
    color: "#111111",
  },
  markAllRead: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1B5E20",
  },
  tabsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
    paddingHorizontal: 16,
    zIndex: 10,
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
    borderBottomColor: "#1B5E20",
  },
  tabText: {
    fontSize: 14,
    color: "#777777",
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#1B5E20",
    fontWeight: "700",
  },
  filterButton: {
    paddingBottom: 8,
    paddingHorizontal: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  dropdownBackdrop: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999,
  },
  dropdownMenu: {
    position: "absolute",
    top: 105,
    right: 16,
    width: 155,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingVertical: 4,
    zIndex: 1000,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  dropdownItemSelected: {
    backgroundColor: "#F4FBF4",
  },
  dropdownItemText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#333",
  },
  dropdownItemTextSelected: {
    color: "#1B5E20",
    fontWeight: "700",
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
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
    alignItems: "flex-start",
    position: "relative",
  },
  unreadItemCardHighlight: {
    backgroundColor: "#EBF7EB",
  },
  unreadAccentBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: "#1B5E20",
  },
  iconColumn: {
    marginRight: 12,
    paddingTop: 2,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  readIconCircle: {
    backgroundColor: "#F3F4F6",
  },
  unreadIconCircle: {
    backgroundColor: "#DCF5DC",
  },
  textColumn: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  titleWithBadge: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111111",
  },
  unreadItemTitleText: {
    color: "#0E3E12",
    fontWeight: "800",
  },
  unreadCountBadge: {
    backgroundColor: "#2E7D32",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  unreadCountText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
  },
  unreadBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#1B5E20",
    marginLeft: 6,
  },
  itemDescription: {
    fontSize: 13,
    color: "#4a4a4a",
    lineHeight: 18,
    marginTop: 2,
  },
  unreadDescriptionText: {
    color: "#284A2B",
    fontWeight: "500",
  },
  itemTime: {
    fontSize: 11,
    color: "#8a9a86",
    marginTop: 5,
  },
  loaderArea: {
    paddingTop: 40,
    alignItems: "center",
  },
  emptyArea: {
    paddingTop: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: "#888888",
    fontSize: 14,
    marginTop: 10,
  },
});
