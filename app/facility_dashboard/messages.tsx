import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, usePathname, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  PanResponder,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FacilityBottomNav from "../../components/FacilityBottomNav";
import { supabase } from "../../utils/supabase";

function SwipeableConversation({
  item,
  onDelete,
  children,
}: {
  item: any;
  onDelete: (conversation: any) => void;
  children: React.ReactNode;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const openValue = -92;

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
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return (
          Math.abs(gestureState.dx) > 12 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy)
        );
      },

      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          const nextValue = Math.max(gestureState.dx, openValue);
          translateX.setValue(nextValue);
        }
      },

      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -45) {
          openRow();
        } else {
          closeRow();
        }
      },
    }),
  ).current;

  return (
    <View style={styles.swipeWrapper}>
      <View style={styles.deleteActionBehind}>
        <TouchableOpacity
          style={styles.deleteSwipeButton}
          activeOpacity={0.85}
          onPress={() => {
            closeRow();
            onDelete(item);
          }}
        >
          <Text style={styles.deleteSwipeText}>Delete</Text>
        </TouchableOpacity>
      </View>

      <Animated.View
        style={[
          styles.swipeForeground,
          {
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

export default function FacilityMessages() {
  const router = useRouter();
  const pathname = usePathname();

  const [facility, setFacility] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isFocusedRef = useRef(true);

  useEffect(() => {
    loadFacility();
  }, []);

  useFocusEffect(
    useCallback(() => {
      isFocusedRef.current = true;
      loadFacility();

      return () => {
        isFocusedRef.current = false;
      };
    }, []),
  );

  useEffect(() => {
    if (!facility?.id) return;

    fetchConversations(facility.id);

    const interval = setInterval(() => {
      if (isFocusedRef.current) {
        fetchConversations(facility.id);
      }
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [facility?.id]);

  const loadFacility = async () => {
    try {
      const stored = await AsyncStorage.getItem("user");

      if (!stored) {
        setFacility(null);
        setConversations([]);
        setLoading(false);
        router.replace("/signin" as any);
        return;
      }

      const parsed = JSON.parse(stored);
      const actualUser = parsed.user || parsed.data || parsed;

      const id =
        actualUser?.id ||
        actualUser?.facility_id ||
        actualUser?.user_id ||
        parsed?.id ||
        parsed?.facility_id ||
        parsed?.user_id ||
        "";

      const name =
        actualUser?.name ||
        actualUser?.facility_name ||
        actualUser?.username ||
        parsed?.name ||
        parsed?.facility_name ||
        parsed?.username ||
        "Facility";

      const role = String(actualUser?.role || parsed?.role || "").toLowerCase();

      if (role && role !== "facility") {
        setLoading(false);
        router.replace("/user_dashboard" as any);
        return;
      }

      if (!id) {
        setFacility(null);
        setConversations([]);
        setLoading(false);
        return;
      }

      let finalFacility = {
        ...actualUser,
        id: String(id),
        name: String(name),
      };

      const email =
        actualUser?.email ||
        parsed?.email ||
        actualUser?.facility_email ||
        parsed?.facility_email ||
        "";

      if (email) {
        const { data: profileByEmail, error: emailError } = await supabase
          .from("profiles")
          .select("*")
          .eq("email", String(email))
          .maybeSingle();

        if (!emailError && profileByEmail?.id) {
          finalFacility = {
            ...finalFacility,
            ...profileByEmail,
            id: String(profileByEmail.id),
            name:
              profileByEmail.name ||
              profileByEmail.facility_name ||
              profileByEmail.username ||
              finalFacility.name ||
              "Facility",
          };
        }
      }

      setFacility(finalFacility);
      await fetchConversations(String(finalFacility.id));
    } catch (error) {
      console.log("LOAD FACILITY MESSAGES ERROR:", error);
      setFacility(null);
      setConversations([]);
      setLoading(false);
    }
  };

  const getConversationTimeValue = (conversation: any) => {
    const dateValue =
      conversation?.last_message_at ||
      conversation?.updated_at ||
      conversation?.created_at ||
      conversation?.finished_at ||
      conversation?.matched_at ||
      0;

    const date = new Date(dateValue);

    if (!isNaN(date.getTime())) {
      return date.getTime();
    }

    const numberValue = Number(dateValue);
    return isNaN(numberValue) ? 0 : numberValue;
  };

  const getStatusPriority = (conversation: any) => {
    const status = String(conversation?.status || "").toLowerCase();

    if (
      status === "match_pending" ||
      status === "pending" ||
      status === "pending match"
    ) {
      return 5;
    }

    if (status === "matched" || status === "accepted" || status === "active") {
      return 4;
    }

    if (status === "finish_pending") {
      return 3;
    }

    if (status === "finished") {
      return 2;
    }

    if (
      status === "cancelled" ||
      status === "canceled" ||
      status === "rejected" ||
      status === "declined"
    ) {
      return 1;
    }

    return 0;
  };

  const groupConversationsByUser = (list: any[]) => {
    const grouped: Record<string, any> = {};

    (list || []).forEach((conversation: any) => {
      const userKey = String(
        conversation?.user_id ||
          conversation?.user_name ||
          conversation?.id ||
          "",
      );

      if (!userKey) return;

      const currentConversation = grouped[userKey];

      if (!currentConversation) {
        grouped[userKey] = {
          ...conversation,
          related_conversation_ids: [String(conversation.id || "")].filter(
            Boolean,
          ),
        };
        return;
      }

      const oldIds = currentConversation.related_conversation_ids || [];
      const newIds = String(conversation.id || "")
        ? [...oldIds, String(conversation.id)]
        : oldIds;

      const currentPriority = getStatusPriority(currentConversation);
      const newPriority = getStatusPriority(conversation);

      if (newPriority > currentPriority) {
        grouped[userKey] = {
          ...conversation,
          related_conversation_ids: newIds,
        };
        return;
      }

      if (newPriority === currentPriority) {
        const currentTime = getConversationTimeValue(currentConversation);
        const newTime = getConversationTimeValue(conversation);

        if (newTime >= currentTime) {
          grouped[userKey] = {
            ...conversation,
            related_conversation_ids: newIds,
          };
        } else {
          grouped[userKey] = {
            ...currentConversation,
            related_conversation_ids: newIds,
          };
        }

        return;
      }

      grouped[userKey] = {
        ...currentConversation,
        related_conversation_ids: newIds,
      };
    });

    return Object.values(grouped).sort(
      (a: any, b: any) =>
        getConversationTimeValue(b) - getConversationTimeValue(a),
    );
  };

  const fetchUserProfilesForConversations = async (conversationList: any[]) => {
    const updatedList = await Promise.all(
      conversationList.map(async (conversation: any) => {
        try {
          const userId = String(conversation.user_id || "");

          if (!userId) return conversation;

          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .maybeSingle();

          if (error || !data) {
            return conversation;
          }

          const userName =
            conversation.user_name && conversation.user_name !== "User"
              ? conversation.user_name
              : data.name ||
                data.username ||
                data.fullname ||
                data.full_name ||
                "User";

          const userProfileImage =
            conversation.user_profile_image || data.profile_image || "";

          return {
            ...conversation,
            user_name: userName,
            user_profile_image: userProfileImage,
          };
        } catch (error) {
          console.log("FETCH USER PROFILE FOR CONVERSATION ERROR:", error);
          return conversation;
        }
      }),
    );

    return updatedList;
  };

  const fetchConversations = async (currentFacilityId = facility?.id) => {
    try {
      if (!currentFacilityId) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("facility_id", String(currentFacilityId))
        .order("updated_at", { ascending: false });

      if (error) {
        console.log("FETCH FACILITY CONVERSATIONS ERROR:", error);
        setConversations([]);
        return;
      }

      const visibleConversations = (data || []).filter((conversation: any) => {
        const hiddenForFacility =
          conversation.facility_deleted === true ||
          conversation.deleted_by_facility === true ||
          conversation.hidden_for_facility === true;

        return !hiddenForFacility;
      });

      const withUserProfiles =
        await fetchUserProfilesForConversations(visibleConversations);

      // Use the timestamp of the latest actual message for the conversation time.
      // This prevents opening/reading a conversation from changing the displayed time.
      const conversationIds = visibleConversations
        .map((conversation: any) => String(conversation.id || ""))
        .filter(Boolean);

      const latestMessageTimeMap: Record<string, string> = {};

      if (conversationIds.length > 0) {
        const { data: messageRows, error: messageTimeError } = await supabase
          .from("messages")
          .select("conversation_id, created_at")
          .in("conversation_id", conversationIds)
          .order("created_at", { ascending: false });

        if (messageTimeError) {
          console.log(
            "FETCH LATEST MESSAGE TIMES ERROR:",
            messageTimeError,
          );
        } else {
          (messageRows || []).forEach((message: any) => {
            const conversationId = String(message?.conversation_id || "");
            if (!conversationId || latestMessageTimeMap[conversationId]) return;

            if (message?.created_at) {
              latestMessageTimeMap[conversationId] = message.created_at;
            }
          });
        }
      }

      const conversationsWithMessageTimes = withUserProfiles.map(
        (conversation: any) => ({
          ...conversation,
          last_message_at:
            latestMessageTimeMap[String(conversation.id || "")] ||
            conversation?.last_message_at ||
            conversation?.created_at ||
            null,
        }),
      );

      const numericFacilityId = Number(currentFacilityId);

      const { data: unreadMessages } = await supabase
        .from("messages")
        .select("conversation_id")
        .eq("receiver_id", numericFacilityId)
        .eq("is_read", false);

      const unreadSet = new Set<string>();

      (unreadMessages || []).forEach((message: any) => {
        unreadSet.add(String(message.conversation_id));
      });

      const { data: unreadRequests, error: requestError } = await supabase
        .from("conversations")
        .select("id, status")
        .eq("facility_id", String(currentFacilityId))
        .eq("is_read", false);

      if (!requestError) {
        (unreadRequests || []).forEach((conversation: any) => {
          unreadSet.add(String(conversation.id));
        });
      }

      const groupedConversations = groupConversationsByUser(
        conversationsWithMessageTimes,
      ).map((conversation) => {
        const ids = conversation.related_conversation_ids || [
          String(conversation.id),
        ];
        const hasUnread = ids.some((id: string) => unreadSet.has(String(id)));

        return {
          ...conversation,
          hasUnread,
        };
      });

      setConversations(groupedConversations);
      setLoading(false);
    } catch (error) {
      console.log("FETCH FACILITY CONVERSATIONS ERROR:", error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);

      if (facility?.id) {
        await fetchConversations(facility.id);
      }
    } finally {
      setRefreshing(false);
    }
  };

  const normalizeStoragePath = (path: string, bucket: string) => {
    if (!path || String(path).trim() === "") return "";

    let cleanPath = String(path).trim();

    if (cleanPath.startsWith("http")) {
      return cleanPath;
    }

    cleanPath = cleanPath.replace(/^\/+/, "");
    cleanPath = cleanPath.replace(`${bucket}/`, "");
    cleanPath = cleanPath.replace(`public/${bucket}/`, "");
    cleanPath = cleanPath.replace(`storage/v1/object/public/${bucket}/`, "");

    return cleanPath;
  };

  const getPublicImageUrl = (bucket: string, path: string) => {
    if (!path || String(path).trim() === "") return "";

    const cleanPath = normalizeStoragePath(path, bucket);

    if (cleanPath.startsWith("http")) {
      return cleanPath;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(cleanPath);

    return data?.publicUrl || "";
  };

  const getUserImageSource = (conversation: any) => {
    const imagePath =
      conversation?.user_profile_image ||
      conversation?.profile_image ||
      conversation?.user_image ||
      "";

    if (!imagePath || String(imagePath).trim() === "") {
      return require("../../assets/icons/avatar.png");
    }

    if (String(imagePath).startsWith("http")) {
      return {
        uri: `${String(imagePath)}?v=${
          conversation?.updated_at || conversation?.created_at || Date.now()
        }`,
      };
    }

    const imageUrl = getPublicImageUrl("profile-images", String(imagePath));

    if (!imageUrl) {
      return require("../../assets/icons/avatar.png");
    }

    return {
      uri: `${imageUrl}?v=${
        conversation?.updated_at || conversation?.created_at || Date.now()
      }`,
    };
  };

  const formatDate = (value: string) => {
    if (!value) return "";

    const date = new Date(value);

    if (isNaN(date.getTime())) return "";

    return date.toLocaleString("en-PH", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getConversationStatus = (conversation: any) => {
    const status = String(conversation?.status || "").toLowerCase();
    const lastMessage = String(conversation?.last_message || "").toLowerCase();

    if (status === "match_pending" || status === "pending") {
      return "Pending Match";
    }

    if (status === "matched" || status === "accepted" || status === "active") {
      return "Matched";
    }

    if (status === "finish_pending") {
      return "Finish Pending";
    }

    if (status === "finished") {
      return "Finished";
    }

    if (
      status === "cancelled" ||
      status === "canceled" ||
      status === "rejected" ||
      status === "declined" ||
      lastMessage.includes("match rejected") ||
      lastMessage.includes("cancelled") ||
      lastMessage.includes("canceled")
    ) {
      return status === "rejected" || lastMessage.includes("match rejected")
        ? "Match Rejected"
        : "Cancelled";
    }

    return "Conversation";
  };

  const getStatusStyle = (conversation: any) => {
    const status = String(conversation?.status || "").toLowerCase();
    const lastMessage = String(conversation?.last_message || "").toLowerCase();

    if (status === "match_pending" || status === "pending") {
      return styles.pendingStatus;
    }

    if (status === "matched" || status === "accepted" || status === "active") {
      return styles.matchedStatus;
    }

    if (status === "finish_pending") {
      return styles.pendingStatus;
    }

    if (status === "finished") {
      return styles.finishedStatus;
    }

    if (
      status === "cancelled" ||
      status === "canceled" ||
      status === "rejected" ||
      status === "declined" ||
      lastMessage.includes("match rejected") ||
      lastMessage.includes("cancelled") ||
      lastMessage.includes("canceled")
    ) {
      return styles.cancelledStatus;
    }

    return styles.defaultStatus;
  };

  const getStatusDotStyle = (conversation: any) => {
    const textStyle = getStatusStyle(conversation) as { color?: string };
    return { backgroundColor: textStyle.color || "#777" };
  };

  const deleteConversation = async (conversation: any) => {
    Alert.alert(
      "Delete Conversation",
      "Are you sure you want to delete this conversation?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const conversationIds =
                conversation?.related_conversation_ids?.length > 0
                  ? conversation.related_conversation_ids
                  : [String(conversation.id || "")].filter(Boolean);

              if (conversationIds.length === 0) {
                Alert.alert("Delete Failed", "Conversation ID is missing.");
                return;
              }

              const { error } = await supabase
                .from("conversations")
                .update({
                  facility_deleted: true,
                  deleted_by_facility: true,
                  hidden_for_facility: true,
                  updated_at: new Date().toISOString(),
                })
                .in("id", conversationIds)
                .eq("facility_id", String(facility?.id || ""));

              if (error) {
                Alert.alert("Delete Failed", error.message);
                return;
              }

              setConversations((prev) =>
                prev.filter((item) => {
                  const itemIds =
                    item?.related_conversation_ids?.length > 0
                      ? item.related_conversation_ids
                      : [String(item.id || "")].filter(Boolean);

                  return !itemIds.some((id: string) =>
                    conversationIds.includes(id),
                  );
                }),
              );

              Alert.alert("Deleted", "Conversation deleted successfully.");
            } catch (error: any) {
              console.log("DELETE FACILITY CONVERSATION ERROR:", error);
              Alert.alert(
                "Delete Failed",
                error?.message || "Unable to delete conversation.",
              );
            }
          },
        },
      ],
    );
  };

  const openChat = async (conversation: any) => {
    const conversationIds =
      conversation?.related_conversation_ids?.length > 0
        ? conversation.related_conversation_ids
        : [String(conversation.id || "")].filter(Boolean);

    const facilityIdNum = Number(facility?.id);

    // 1. Clear the unread flag locally without changing the conversation's position
    setConversations((prev) =>
      prev.map((item) => {
        const clickedId = String(conversation.id);
        const isClicked =
          String(item.id) === clickedId ||
          item.related_conversation_ids?.includes(clickedId);

        return isClicked ? { ...item, hasUnread: false } : item;
      }),
    );

    // 2. Mark conversations as read in database
    if (conversationIds.length > 0) {
      supabase
        .from("conversations")
        .update({ is_read: true })
        .in("id", conversationIds)
        .then();
    }

    // 3. Mark unread messages sent to this facility as read
    if (!isNaN(facilityIdNum) && conversationIds.length > 0) {
      supabase
        .from("messages")
        .update({ is_read: true })
        .in("conversation_id", conversationIds)
        .eq("receiver_id", facilityIdNum)
        .then();
    }

    router.push({
      pathname: "/facility_dashboard/chat" as any,
      params: {
        conversationId: String(conversation.id || ""),
        user_id: String(conversation.user_id || ""),
        user_name: String(conversation.user_name || "User"),
        user_profile_image: String(conversation.user_profile_image || ""),
        facility_id: String(conversation.facility_id || facility?.id || ""),
        facility_name: String(
          conversation.facility_name || facility?.name || "Facility",
        ),
        item_id: String(conversation.item_id || ""),
        item_name: String(conversation.item_name || ""),
      },
    });
  };

  const renderConversation = ({ item }: any) => {
    const isUnread = !!item.hasUnread;

    return (
      <SwipeableConversation item={item} onDelete={deleteConversation}>
        <TouchableOpacity
          style={[
            styles.conversationCard,
            isUnread && styles.unreadConversationCard,
          ]}
          activeOpacity={0.85}
          onPress={() => openChat(item)}
        >
          {isUnread && <View style={styles.unreadAccentBar} />}

          <View style={styles.avatarWrapper}>
            <Image
              source={getUserImageSource(item)}
              style={styles.avatar}
            />
            {isUnread && <View style={styles.unreadAvatarDot} />}
          </View>

          <View style={styles.conversationInfo}>
            <View style={styles.topRow}>
              <Text
                style={[
                  styles.facilityName,
                  isUnread && styles.unreadFacilityName,
                ]}
                numberOfLines={1}
              >
                {item.user_name || "User"}
              </Text>

              <Text
                style={[
                  styles.timeText,
                  isUnread ? styles.unreadItemText : styles.readItemText,
                ]}
              >
                {formatDate(item.last_message_at || item.updated_at || item.created_at)}
              </Text>
            </View>

            <Text
              style={[
                styles.itemName,
                isUnread ? styles.unreadItemText : styles.readItemText,
              ]}
              numberOfLines={1}
            >
              Latest item: {item.item_name || "Unnamed Item"}
            </Text>

            <View style={styles.statusRow}>
              <View style={[styles.statusDot, getStatusDotStyle(item)]} />
              <Text style={[styles.statusText, getStatusStyle(item)]}>
                {getConversationStatus(item)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </SwipeableConversation>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1b5e20" />
        <Text style={styles.loadingText}>Loading messages...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Messages</Text>

      <FlatList
        data={conversations}
        keyExtractor={(item: any, index: number) =>
          `facility-conversation-${item.user_id || item.id || index}`
        }
        renderItem={renderConversation}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No messages yet</Text>

            <Text style={styles.emptyText}>
              Your conversation with other users will appear here.
            </Text>
          </View>
        }
      />

      <FacilityBottomNav facilityId={facility?.id || ""} active="messages" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#1b5e20",
    fontWeight: "600",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111",
    marginTop: 15,
    marginBottom: 15,
  },
  listContent: {
    paddingBottom: 110,
  },
  swipeWrapper: {
    marginBottom: 12,
    position: "relative",
    overflow: "hidden",
    borderRadius: 14,
  },
  swipeForeground: {
    backgroundColor: "#fff",
    borderRadius: 14,
  },
  deleteActionBehind: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 92,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#d32f2f",
    borderRadius: 14,
  },
  conversationCard: {
    flexDirection: "row",
    backgroundColor: "#f7f7f7",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    position: "relative",
    overflow: "hidden",
  },
  unreadConversationCard: {
    backgroundColor: "#f2f8f2",
    borderColor: "#b6dfb8",
  },
  unreadAccentBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: "#1b5e20",
  },
  deleteSwipeButton: {
    width: 92,
    height: "100%",
    backgroundColor: "#d32f2f",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 14,
  },
  deleteSwipeText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  avatarWrapper: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#ddd",
  },
  unreadAvatarDot: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#2e7d32",
    borderWidth: 2,
    borderColor: "#fff",
  },
  conversationInfo: {
    flex: 1,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timeText: {
    fontSize: 11,
  },
  itemName: {
    marginTop: 3,
    fontSize: 13,
  },
  readItemText: {
    color: "#777",
    fontWeight: "400",
  },
  unreadItemText: {
    color: "#1b5e20",
    fontWeight: "700",
  },
  statusRow: {
    marginTop: 7,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  pendingStatus: {
    color: "#fbc02d",
  },
  matchedStatus: {
    color: "#1976d2",
  },
  finishedStatus: {
    color: "green",
  },
  cancelledStatus: {
    color: "red",
  },
  defaultStatus: {
    color: "#555",
  },
  facilityName: {
    flex: 1,
    fontSize: 16,
    color: "#111",
    fontWeight: "bold",
    marginRight: 8,
  },
  unreadFacilityName: {
    color: "#1b5e20",
  },
  emptyBox: {
    backgroundColor: "#f5f5f5",
    marginTop: 40,
    padding: 22,
    borderRadius: 14,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
});
