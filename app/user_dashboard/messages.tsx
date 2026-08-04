import UserBottomNav from "../../components/UserBottomNav";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
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
    })
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

export default function UserMessages() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  useFocusEffect(
  useCallback(() => {
    if (user?.id) {
      fetchConversations(user.id);
    }

  }, [user?.id])
);

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem("user");

      if (!stored) {
        setUser(null);
        setConversations([]);
        setLoading(false);
        router.replace("/signin" as any);
        return;
      }

      const parsed = JSON.parse(stored);
      const actualUser = parsed.user || parsed.data || parsed;

      const id =
        actualUser?.id ||
        actualUser?.user_id ||
        parsed?.id ||
        parsed?.user_id ||
        "";

      const name =
        actualUser?.name ||
        actualUser?.username ||
        actualUser?.fullname ||
        actualUser?.full_name ||
        parsed?.name ||
        parsed?.username ||
        "User";

      const role = String(actualUser?.role || parsed?.role || "").toLowerCase();

      if (role && role !== "user") {
        setLoading(false);
        router.replace("/facility_dashboard" as any);
        return;
      }

      if (!id) {
        setUser(null);
        setConversations([]);
        setLoading(false);
        return;
      }

      const finalUser = {
        ...actualUser,
        id: String(id),
        name: String(name),
      };

      setUser(finalUser);
      await fetchConversations(String(id));
    } catch (error) {
      console.log("LOAD USER MESSAGES ERROR:", error);
      setUser(null);
      setConversations([]);
      setLoading(false);
    }
  };

  const getConversationTimeValue = (conversation: any) => {
    const dateValue =
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

  const groupConversationsByFacility = (list: any[]) => {
    const grouped: Record<string, any> = {};

    (list || []).forEach((conversation: any) => {
      const facilityKey = String(
        conversation?.facility_id ||
          conversation?.facility_name ||
          conversation?.id ||
          ""
      );

      if (!facilityKey) return;

      const currentConversation = grouped[facilityKey];

      if (!currentConversation) {
        grouped[facilityKey] = {
          ...conversation,
          related_conversation_ids: [String(conversation.id || "")].filter(
            Boolean
          ),
        };
        return;
      }

      const oldIds = currentConversation.related_conversation_ids || [];
      const newIds = String(conversation.id || "")
        ? [...oldIds, String(conversation.id)]
        : oldIds;

      const currentTime = getConversationTimeValue(currentConversation);
      const newTime = getConversationTimeValue(conversation);

      if (newTime >= currentTime) {
        grouped[facilityKey] = {
          ...conversation,
          related_conversation_ids: newIds,
        };
      } else {
        grouped[facilityKey] = {
          ...currentConversation,
          related_conversation_ids: newIds,
        };
      }
    });

    return Object.values(grouped).sort(
      (a: any, b: any) =>
        getConversationTimeValue(b) - getConversationTimeValue(a)
    );
  };

  const fetchConversations = async (currentUserId = user?.id) => {
    try {
      if (!currentUserId) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("user_id", String(currentUserId))
        .order("updated_at", { ascending: false });

      if (error) {
        console.log("FETCH USER CONVERSATIONS ERROR:", error);
        setConversations([]);
        return;
      }

      const groupedConversations = groupConversationsByFacility(data || []);
      setConversations(groupedConversations);
    } catch (error) {
      console.log("FETCH USER CONVERSATIONS ERROR:", error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);

      if (user?.id) {
        await fetchConversations(user.id);
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

  const getFacilityImageSource = (conversation: any) => {
    const imagePath =
      conversation?.facility_profile_image ||
      conversation?.profile_image ||
      conversation?.facility_image ||
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

  const getRequestSender = (conversation: any) => {
    return String(conversation?.requested_by || "").toLowerCase();
  };

  const isPendingRequest = (conversation: any) => {
    const status = String(conversation?.status || "").toLowerCase();
    const requestStatus = String(
      conversation?.request_status || ""
    ).toLowerCase();

    return (
      status === "match_pending" ||
      status === "request_pending" ||
      requestStatus === "pending"
    );
  };

  const getConversationStatus = (conversation: any) => {
    const status = String(conversation?.status || "").toLowerCase();
    const lastMessage = String(conversation?.last_message || "").toLowerCase();
    const requestSender = getRequestSender(conversation);

    if (isPendingRequest(conversation)) {
      if (requestSender === "user") return "Request Sent";
      if (requestSender === "facility") return "Request Received";
      return "Pending Request";
    }

    if (status === "matched") return "Matched";
    if (status === "accepted") return "Matched";
    if (status === "active") return "Matched";
    if (status === "finish_pending") return "Finish Pending";
    if (status === "finished") return "Finished";
    if (status === "cancelled") return "Cancelled";

    if (status === "rejected" || lastMessage.includes("match rejected")) {
      return "Match Rejected";
    }

    return "Conversation";
  };

  const getStatusStyle = (conversation: any) => {
    const status = String(conversation?.status || "").toLowerCase();
    const lastMessage = String(conversation?.last_message || "").toLowerCase();

    if (isPendingRequest(conversation)) return styles.pendingStatus;

    if (status === "matched" || status === "accepted" || status === "active") {
      return styles.matchedStatus;
    }

    if (status === "finish_pending") return styles.pendingStatus;
    if (status === "finished") return styles.finishedStatus;

    if (
      status === "cancelled" ||
      status === "rejected" ||
      lastMessage.includes("match rejected")
    ) {
      return styles.cancelledStatus;
    }

    return styles.defaultStatus;
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

              const { error: messagesError } = await supabase
                .from("messages")
                .delete()
                .in("conversation_id", conversationIds);

              if (messagesError) {
                console.log("DELETE MESSAGES ERROR:", messagesError);
              }

              const { error: conversationsError } = await supabase
                .from("conversations")
                .delete()
                .in("id", conversationIds)
                .eq("user_id", String(user?.id || ""));

              if (conversationsError) {
                Alert.alert("Delete Failed", conversationsError.message);
                return;
              }

              setConversations((prev) =>
                prev.filter((item) => {
                  const itemIds =
                    item?.related_conversation_ids?.length > 0
                      ? item.related_conversation_ids
                      : [String(item.id || "")].filter(Boolean);

                  return !itemIds.some((id: string) =>
                    conversationIds.includes(id)
                  );
                })
              );

              Alert.alert("Deleted", "Conversation deleted successfully.");
            } catch (error: any) {
              console.log("DELETE CONVERSATION ERROR:", error);
              Alert.alert(
                "Delete Failed",
                error?.message || "Unable to delete conversation."
              );
            }
          },
        },
      ]
    );
  };

  const openChat = (conversation: any) => {
    router.push({
      pathname: "/user_dashboard/chat" as any,
      params: {
        conversationId: String(conversation.id || ""),
        facility_id: String(conversation.facility_id || ""),
        facility_name: String(conversation.facility_name || "Facility"),
        profile_image: String(conversation.facility_profile_image || ""),
        item_id: String(conversation.item_id || ""),
        item_name: String(conversation.item_name || ""),
        status: String(conversation.status || ""),
        requested_by: String(conversation.requested_by || ""),
        request_status: String(conversation.request_status || ""),
      },
    });
  };

  const renderConversation = ({ item }: any) => {
    return (
      <SwipeableConversation item={item} onDelete={deleteConversation}>
        <TouchableOpacity
          style={styles.conversationCard}
          activeOpacity={0.85}
          onPress={() => openChat(item)}
        >
          <Image source={getFacilityImageSource(item)} style={styles.avatar} />

          <View style={styles.conversationInfo}>
  <View style={styles.topRow}>
    <Text
      style={styles.facilityName}
      numberOfLines={1}
    >
      {item.facility_name || "Facility"}
    </Text>

    <Text
      style={[
        styles.timeText,
        item.is_read
          ? styles.readItemText
          : styles.unreadItemText,
      ]}
    >
      {formatDate(item.updated_at || item.created_at)}
    </Text>
  </View>

 <Text
  style={[
    styles.itemName,
    item.is_read
      ? styles.readItemText
      : styles.unreadItemText,
  ]}
>
    Latest item: {item.item_name || "Unnamed Item"}
  </Text>

  <View style={styles.statusRow}>
    <Text
      style={[
        styles.statusText,
        getStatusStyle(item),
      ]}
    >
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
          `conversation-${item.facility_id || item.id || index}`
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
              Your match conversations with facilities will appear here.
            </Text>
          </View>
        }
      />

        <UserBottomNav
          userId={user.id}
          active="messages"
        />
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

  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#ddd",
    marginRight: 12,
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
    color: "#777",
  },

  itemName: {
    marginTop: 3,
    fontSize: 13,
    color: "#111",
    fontWeight: "400",
  },

  readItemText: {
  color: "#888",
  fontWeight: "400",
},

unreadItemText: {
  color: "#111",
  fontWeight: "600",
},

  statusRow: {
    marginTop: 7,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
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