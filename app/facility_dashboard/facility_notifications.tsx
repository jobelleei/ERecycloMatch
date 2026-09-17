import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FacilityBottomNav from "../../components/FacilityBottomNav";
import { supabase } from "../../utils/supabase";

type NotificationItem = {
  id: string;
  type: "message" | "item_update" | "system";
  title: string;
  description: string;
  createdAt: string;
  read: boolean;
  unreadCount?: number;
  data?: any;
  timestamp: number;
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

export default function FacilityNotifications() {
  const router = useRouter();

  const [facilityId, setFacilityId] = useState<string>("");
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
    resolveFacility();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (facilityId) {
        fetchAllFacilityUpdates(facilityId);
      }
    }, [facilityId]),
  );

  useEffect(() => {
    if (!facilityId) return;

    const channelId = `facility-notifs-hub-${facilityId}-${Date.now()}`;
    const channel = supabase.channel(channelId);

    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        () => fetchAllFacilityUpdates(facilityId),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `facility_id=eq.${facilityId}`,
        },
        () => fetchAllFacilityUpdates(facilityId),
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "items",
        },
        () => fetchAllFacilityUpdates(facilityId),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [facilityId]);

  const resolveFacility = async () => {
    try {
      setLoading(true);
      const stored = await AsyncStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        const actual = parsed?.user || parsed?.data || parsed;
        const candidateId = String(actual?.id || parsed?.id || "");

        if (candidateId) {
          setFacilityId(candidateId);
          await fetchAllFacilityUpdates(candidateId);
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
          setFacilityId(profileIdStr);
          await fetchAllFacilityUpdates(profileIdStr);
          return;
        }
      }
    } catch (e) {
      console.log("Error loading facility context:", e);
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

  const fetchAllFacilityUpdates = async (currentFacilityId: string) => {
    try {
      const combined: NotificationItem[] = [];
      const numericFacilityId = Number(currentFacilityId);

      // 1. Fetch Conversations where the last message was sent by a USER (not this facility)
      const { data: conversations } = await supabase
        .from("conversations")
        .select("*")
        .eq("facility_id", currentFacilityId)
        .order("updated_at", { ascending: false });

      if (conversations && conversations.length > 0) {
        const conversationIds = conversations.map((c) => c.id);

        // Fetch the latest message for each conversation to verify who sent it
        const { data: latestMessages } = await supabase
          .from("messages")
          .select(
            "conversation_id, sender_id, sender_role, sender_type, created_at, message",
          )
          .in("conversation_id", conversationIds)
          .order("created_at", { ascending: false });

        // Map to keep track of the latest message per conversation
        const latestMsgMap: Record<string, any> = {};
        (latestMessages || []).forEach((m: any) => {
          if (!latestMsgMap[m.conversation_id]) {
            latestMsgMap[m.conversation_id] = m;
          }
        });

        const { data: unreadMsgs } = await supabase
          .from("messages")
          .select("conversation_id, id")
          .eq("receiver_id", numericFacilityId)
          .eq("is_read", false);

        const unreadCountMap: Record<string, number> = {};
        (unreadMsgs || []).forEach((m: any) => {
          unreadCountMap[m.conversation_id] =
            (unreadCountMap[m.conversation_id] || 0) + 1;
        });

        conversations.forEach((c: any) => {
          const lastMsgObj = latestMsgMap[c.id];
          if (!lastMsgObj) return;

          // Check if the last message was sent by the facility itself
          const senderId = lastMsgObj.sender_id
            ? Number(lastMsgObj.sender_id)
            : null;
          const senderRole = String(
            lastMsgObj.sender_role || lastMsgObj.sender_type || "",
          ).toLowerCase();

          const isSentByFacility =
            senderId === numericFacilityId ||
            senderRole === "facility" ||
            senderRole === "recycling facility";

          // Skip notification if the facility was the one who sent the latest message
          if (isSentByFacility) return;

          const userName = c.user_name || "Community User";
          const lastMsg = lastMsgObj.message || c.last_message || "";
          const timeVal = new Date(
            lastMsgObj.created_at || c.updated_at || c.created_at,
          ).getTime();
          const unreadForConv = unreadCountMap[c.id] || 0;
          const isUnread = !c.is_read || unreadForConv > 0;

          if (lastMsg) {
            combined.push({
              id: `conv-msg-${c.id}`,
              type: "message",
              title: `Message from ${userName}`,
              description: lastMsg,
              createdAt: formatRelativeTime(
                lastMsgObj.created_at || c.updated_at || c.created_at,
              ),
              read: !isUnread,
              unreadCount: unreadForConv,
              timestamp: isNaN(timeVal) ? Date.now() : timeVal,
              data: {
                conversation_id: c.id,
                user_id: c.user_id,
                user_name: userName,
                item_id: c.item_id,
                item_name: c.item_name,
              },
            });
          }
        });
      }

      // 2. Fetch Newly Posted Items by Users or items matched to other facilities/this facility
      const { data: recentItems } = await supabase
        .from("items")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(15);

      (recentItems || []).forEach((item: any) => {
        const itemName = item.item_name || item.item_type || "New e-waste item";
        const submitter = item.submitter_name || "A user";
        const timeVal = new Date(item.created_at || item.updated_at).getTime();
        const status = String(
          item.status || item.match_status || "Listed",
        ).toLowerCase();

        if (status === "listed" || status === "approved") {
          combined.push({
            id: `new-item-${item.id}`,
            type: "item_update",
            title: `New Item Listed: ${itemName}`,
            description: `${submitter} listed "${itemName}". Tap to view and match.`,
            createdAt: formatRelativeTime(item.created_at || item.updated_at),
            read: true,
            timestamp: isNaN(timeVal) ? Date.now() : timeVal,
            data: {
              item_id: item.id,
            },
          });
        } else if (status === "matched" || status === "finished") {
          combined.push({
            id: `item-status-${item.id}`,
            type: "item_update",
            title: `Item Status Update: ${itemName}`,
            description: `The status for "${itemName}" has been updated to ${status}.`,
            createdAt: formatRelativeTime(item.updated_at || item.created_at),
            read: true,
            timestamp: isNaN(timeVal) ? Date.now() : timeVal,
            data: {
              item_id: item.id,
            },
          });
        }
      });

      setNotifications(combined);
    } catch (err) {
      console.log("FETCH FACILITY UPDATES ERROR:", err);
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

      if (facilityId) {
        await supabase
          .from("messages")
          .update({ is_read: true })
          .eq("conversation_id", String(item.data.conversation_id))
          .eq("receiver_id", Number(facilityId));
      }
    }
  };

  const markAllAsRead = async () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true, unreadCount: 0 })),
    );

    if (!facilityId) return;

    await supabase
      .from("conversations")
      .update({ is_read: true })
      .eq("facility_id", facilityId);

    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("receiver_id", Number(facilityId));
  };

  const deleteNotification = (item: NotificationItem) => {
    setNotifications((prev) => prev.filter((n) => n.id !== item.id));
  };

  const handleOpen = async (item: NotificationItem) => {
    if (dropdownOpen) setDropdownOpen(false);
    await markAsRead(item);

    if (item.type === "message" && item.data?.conversation_id) {
      router.push({
        pathname: "/facility_dashboard/chat" as any,
        params: {
          conversationId: String(item.data.conversation_id),
          user_id: String(item.data.user_id || ""),
          user_name: String(item.data.user_name || "User"),
          item_id: String(item.data.item_id || ""),
          item_name: String(item.data.item_name || ""),
        },
      });
      return;
    }

    if (item.type === "item_update") {
      if (item.data?.item_id) {
        router.push({
          pathname: "/facility_dashboard/item_details" as any,
          params: { item_id: String(item.data.item_id) },
        });
        return;
      }
      router.push("/facility_dashboard" as any);
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
      case "item_update":
        return "cube-outline";
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

        {/* Filter Slider Option Button */}
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setDropdownOpen((prev) => !prev)}
          activeOpacity={0.7}
        >
          <Ionicons name="options-outline" size={24} color="#66BB6A" />
        </TouchableOpacity>
      </View>

      {dropdownOpen && (
        <TouchableWithoutFeedback onPress={() => setDropdownOpen(false)}>
          <View style={styles.dropdownBackdrop} />
        </TouchableWithoutFeedback>
      )}

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
                if (facilityId) fetchAllFacilityUpdates(facilityId);
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

      {facilityId ? (
        <FacilityBottomNav facilityId={facilityId} active="home" />
      ) : null}
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
