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
  isOpen,
  onOpen,
  onClose,
}: {
  item: NotificationItem;
  onDelete: (item: NotificationItem) => void;
  children: React.ReactNode;
  isOpen: boolean;
  onOpen: (id: string) => void;
  onClose: () => void;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const currentX = useRef(0);
  const gestureStartX = useRef(0);

  const DELETE_WIDTH = 80;

  const animateTo = useCallback(
    (toValue: number) => {
      currentX.current = toValue;
      Animated.spring(translateX, {
        toValue,
        useNativeDriver: true,
        tension: 70,
        friction: 10,
      }).start();
    },
    [translateX],
  );

  useEffect(() => {
    if (!isOpen && currentX.current !== 0) {
      animateTo(0);
    }
  }, [isOpen, animateTo]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        const { dx, dy } = gestureState;
        return Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.2;
      },
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const { dx, dy } = gestureState;
        return Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.2;
      },
      onPanResponderGrant: () => {
        translateX.stopAnimation((value) => {
          currentX.current = value;
          gestureStartX.current = value;
        });
      },
      onPanResponderMove: (_, gestureState) => {
        const nextX = Math.max(
          -DELETE_WIDTH,
          Math.min(0, gestureStartX.current + gestureState.dx),
        );
        currentX.current = nextX;
        translateX.setValue(nextX);
      },
      onPanResponderRelease: (_, gestureState) => {
        const finalX = Math.max(
          -DELETE_WIDTH,
          Math.min(0, gestureStartX.current + gestureState.dx),
        );
        if (gestureState.vx > 0.35) {
          onClose();
          animateTo(0);
          return;
        }
        if (finalX <= -DELETE_WIDTH / 2 || gestureState.vx < -0.5) {
          onOpen(item.id);
          animateTo(-DELETE_WIDTH);
        } else {
          onClose();
          animateTo(0);
        }
      },
      onPanResponderTerminate: () => {
        if (currentX.current <= -DELETE_WIDTH / 2) {
          onOpen(item.id);
          animateTo(-DELETE_WIDTH);
        } else {
          onClose();
          animateTo(0);
        }
      },
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  const handleDelete = () => {
    onClose();
    animateTo(0);
    onDelete(item);
  };

  return (
    <View style={styles.swipeWrapper}>
      <View style={styles.behindDelete}>
        <TouchableOpacity
          style={styles.behindDeleteBtn}
          onPress={handleDelete}
        >
          <Text style={styles.behindDeleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
      <Animated.View
        style={[
          styles.swipeFront,
          { transform: [{ translateX }] },
        ]}
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
  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null);
  const screenTouchStart = useRef({ x: 0, y: 0 });
  const screenTouchMoved = useRef(false);

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
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `profile_id=eq.${facilityId}`,
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

      // 1. Fetch conversations belonging to THIS facility only.
      const { data: conversations, error: conversationsError } = await supabase
        .from("conversations")
        .select("*")
        .eq("facility_id", currentFacilityId)
        .order("updated_at", { ascending: false });

      if (conversationsError) {
        console.log("FETCH FACILITY CONVERSATIONS ERROR:", conversationsError);
      }

      if (conversations && conversations.length > 0) {
        const conversationIds = conversations.map((c: any) => c.id);

        const { data: latestMessages, error: latestMessagesError } = await supabase
          .from("messages")
          .select(
            "conversation_id, sender_id, sender_role, sender_type, created_at, message",
          )
          .in("conversation_id", conversationIds)
          .order("created_at", { ascending: false });

        if (latestMessagesError) {
          console.log("FETCH LATEST FACILITY MESSAGES ERROR:", latestMessagesError);
        }

        const latestMsgMap: Record<string, any> = {};
        (latestMessages || []).forEach((m: any) => {
          if (!latestMsgMap[m.conversation_id]) {
            latestMsgMap[m.conversation_id] = m;
          }
        });

        const { data: unreadMsgs, error: unreadMessagesError } = await supabase
          .from("messages")
          .select("conversation_id, id")
          .eq("receiver_id", numericFacilityId)
          .eq("is_read", false);

        if (unreadMessagesError) {
          console.log("FETCH UNREAD FACILITY MESSAGES ERROR:", unreadMessagesError);
        }

        const unreadCountMap: Record<string, number> = {};
        (unreadMsgs || []).forEach((m: any) => {
          unreadCountMap[m.conversation_id] =
            (unreadCountMap[m.conversation_id] || 0) + 1;
        });

        conversations.forEach((c: any) => {
          const lastMsgObj = latestMsgMap[c.id];
          if (!lastMsgObj) return;

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

          // Do not notify the facility about its own latest message.
          if (isSentByFacility) return;

          const userName = c.user_name || "Community User";
          const lastMsg = lastMsgObj.message || c.last_message || "";
          const messageDate =
            lastMsgObj.created_at || c.updated_at || c.created_at;
          const timeVal = new Date(messageDate).getTime();
          const unreadForConv = unreadCountMap[c.id] || 0;
          const isUnread = !c.is_read || unreadForConv > 0;

          if (lastMsg) {
            combined.push({
              id: `conv-msg-${c.id}`,
              type: "message",
              title: `Message from ${userName}`,
              description: lastMsg,
              createdAt: formatRelativeTime(messageDate),
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

      // 2. IMPORTANT: Fetch ONLY notifications addressed to THIS facility.
      //    Do not fetch all recent items from the items table. That would make
      //    every facility see listings belonging to other facilities.
      const notificationProfileId = Number.isFinite(numericFacilityId)
        ? numericFacilityId
        : currentFacilityId;

      const { data: targetedNotifications, error: notificationsError } =
        await supabase
          .from("notifications")
          .select("id, profile_id, title, message, type, is_read, data, created_at")
          .eq("profile_id", notificationProfileId)
          .order("created_at", { ascending: false })
          .limit(100);

      if (notificationsError) {
        console.log("FETCH FACILITY NOTIFICATIONS ERROR:", notificationsError);
      }

      // Collect user/item IDs from targeted nearby-listing notifications so we
      // can display the actual user who posted each item.
      const nearbyNotifications = (targetedNotifications || []).filter(
        (notification: any) =>
          String(notification.type || "").toLowerCase() === "nearby_listing",
      );

      const userIds = nearbyNotifications
        .map((notification: any) => notification?.data?.user_id)
        .filter((id: any) => id !== null && id !== undefined && String(id) !== "")
        .map((id: any) => String(id));

      const uniqueUserIds = [...new Set(userIds)];

      const userMap: Record<string, any> = {};

      if (uniqueUserIds.length > 0) {
        const { data: users, error: usersError } = await supabase
          .from("profiles")
          .select("id, name, full_name, username")
          .in("id", uniqueUserIds);

        if (usersError) {
          console.log("FETCH LISTING USERS ERROR:", usersError);
        }

        (users || []).forEach((profile: any) => {
          userMap[String(profile.id)] = profile;
        });
      }

      (targetedNotifications || []).forEach((notification: any) => {
        const notificationType = String(notification.type || "system").toLowerCase();
        const data = notification.data || {};
        const userId = data.user_id ? String(data.user_id) : "";
        const profile = userId ? userMap[userId] : null;

        const userName =
          profile?.name ||
          profile?.full_name ||
          profile?.username ||
          data.user_name ||
          "A user";

        const itemName =
          data.item_name ||
          "listed item";

        const distance = Number(data.distance_km);
        const hasDistance = Number.isFinite(distance);

        let title = notification.title || "Notification";
        let description = notification.message || "";

        // Build the facility-side nearby listing notification from the
        // notification's targeted user/item data.
        if (notificationType === "nearby_listing") {
          title = `New Listing from ${userName}`;
          description = hasDistance
            ? `${userName} listed "${itemName}" ${distance.toFixed(1)} km from your facility. Tap to view and match.`
            : `${userName} listed "${itemName}". Tap to view and match.`;
        }

        const createdAt = notification.created_at || new Date().toISOString();
        const timeVal = new Date(createdAt).getTime();

        combined.push({
          id: `db-notification-${notification.id}`,
          type:
            notificationType === "nearby_listing"
              ? "item_update"
              : notificationType === "message"
                ? "message"
                : "system",
          title,
          description,
          createdAt: formatRelativeTime(createdAt),
          read: Boolean(notification.is_read),
          timestamp: isNaN(timeVal) ? Date.now() : timeVal,
          data: {
            ...data,
            notification_id: notification.id,
            user_id: data.user_id || null,
            user_name: userName,
            item_id: data.item_id || null,
            item_name: itemName,
            facility_id: currentFacilityId,
          },
        });
      });

      // Prevent duplicate notifications when the same notification is
      // returned by multiple sources.
      const uniqueNotifications = Array.from(
        new Map(combined.map((notification) => [notification.id, notification])).values(),
      );

      setNotifications(uniqueNotifications);
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

    // Mark the actual notification row as read.
    if (item.data?.notification_id) {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", String(item.data.notification_id))
        .eq("profile_id", Number(facilityId));

      if (error) {
        console.log("MARK FACILITY NOTIFICATION READ ERROR:", error);
      }
    }

    if (item.type === "message" && item.data?.conversation_id) {
      await supabase
        .from("conversations")
        .update({ is_read: true })
        .eq("id", String(item.data.conversation_id))
        .eq("facility_id", facilityId);

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
    setOpenSwipeId(null);
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true, unreadCount: 0 })),
    );

    if (!facilityId) return;

    const numericId = Number(facilityId);

    const { error: notificationError } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("profile_id", Number.isFinite(numericId) ? numericId : facilityId)
      .eq("is_read", false);

    if (notificationError) {
      console.log("MARK ALL FACILITY NOTIFICATIONS READ ERROR:", notificationError);
    }

    await supabase
      .from("conversations")
      .update({ is_read: true })
      .eq("facility_id", facilityId);

    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("receiver_id", numericId)
      .eq("is_read", false);
  };

  const deleteNotification = (item: NotificationItem) => {
    setOpenSwipeId(null);
    setNotifications((prev) => prev.filter((n) => n.id !== item.id));
  };

  const handleOpen = async (item: NotificationItem) => {
    setOpenSwipeId(null);
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
    <SwipeableNotificationRow
      item={item}
      onDelete={deleteNotification}
      isOpen={openSwipeId === item.id}
      onOpen={(id) => setOpenSwipeId(id)}
      onClose={() => setOpenSwipeId(null)}
    >
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
    <SafeAreaView
      style={styles.container}
      onTouchStart={(event) => {
        const { pageX, pageY } = event.nativeEvent;
        screenTouchStart.current = { x: pageX, y: pageY };
        screenTouchMoved.current = false;
      }}
      onTouchMove={(event) => {
        const { pageX, pageY } = event.nativeEvent;
        const dx = pageX - screenTouchStart.current.x;
        const dy = pageY - screenTouchStart.current.y;
        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
          screenTouchMoved.current = true;
        }
      }}
      onTouchEnd={() => {
        if (!screenTouchMoved.current && openSwipeId) {
          setOpenSwipeId(null);
        }
      }}
    >
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
              setOpenSwipeId(null);
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
              setOpenSwipeId(null);
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
          onPress={() => { setOpenSwipeId(null); setDropdownOpen((prev) => !prev); }}
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
            onPress={() => { setOpenSwipeId(null); selectSortOption("newest"); }}
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
            onPress={() => { setOpenSwipeId(null); selectSortOption("oldest"); }}
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
  swipeFront: {
    backgroundColor: "#ffffff",
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
