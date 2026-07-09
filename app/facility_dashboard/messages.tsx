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

export default function FacilityMessages() {
  const router = useRouter();
  const pathname = usePathname();

  const [facility, setFacility] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFacility();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFacility();
    }, [])
  );

  useEffect(() => {
    if (!facility?.id) return;

    fetchConversations(facility.id);

    const interval = setInterval(() => {
      fetchConversations(facility.id);
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

    if (
      status === "matched" ||
      status === "accepted" ||
      status === "active"
    ) {
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
          ""
      );

      if (!userKey) return;

      const currentConversation = grouped[userKey];

      if (!currentConversation) {
        grouped[userKey] = {
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
        getConversationTimeValue(b) - getConversationTimeValue(a)
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
      })
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

      const withUserProfiles = await fetchUserProfilesForConversations(
        visibleConversations
      );

      const { data: unreadMessages } = await supabase
        .from("messages")
        .select("conversation_id")
        .eq("receiver_id", Number(currentFacilityId))
        .eq("is_read", false);

      const unreadSet = new Set<string>();

      (unreadMessages || []).forEach((message: any) => {
        unreadSet.add(String(message.conversation_id));
      });

      const { data: unreadRequests, error: requestError } = await supabase
        .from("conversations")
        .select("id, status")
        .eq("facility_id", String(currentFacilityId))
        .eq("status", "match_pending");

      if (!requestError) {
        (unreadRequests || []).forEach((conversation: any) => {
          unreadSet.add(String(conversation.id));
        });
      }

      const groupedConversations =
      groupConversationsByUser(withUserProfiles).map((conversation) => ({
        ...conversation,
        hasUnread:
          conversation.related_conversation_ids?.some((id: string) =>
            unreadSet.has(String(id))
          ) || false,
      }));

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
                    conversationIds.includes(id)
                  );
                })
              );

              Alert.alert("Deleted", "Conversation deleted successfully.");
            } catch (error: any) {
              console.log("DELETE FACILITY CONVERSATION ERROR:", error);
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
      pathname: "/facility_dashboard/chat" as any,
      params: {
        conversationId: String(conversation.id || ""),
        user_id: String(conversation.user_id || ""),
        user_name: String(conversation.user_name || "User"),
        user_profile_image: String(conversation.user_profile_image || ""),
        facility_id: String(conversation.facility_id || facility?.id || ""),
        facility_name: String(
          conversation.facility_name || facility?.name || "Facility"
        ),
        item_id: String(conversation.item_id || ""),
        item_name: String(conversation.item_name || ""),
      },
    });
  };

  const goToPage = (path: string) => {
    router.push(path as any);
  };

  const renderConversation = ({ item }: any) => {
    return (
      <SwipeableConversation item={item} onDelete={deleteConversation}>
        <TouchableOpacity
          style={[
            styles.conversationCard,
            item.hasUnread && styles.unreadConversationCard,
          ]}
          activeOpacity={0.85}
          onPress={() => openChat(item)}
        >
          <Image source={getUserImageSource(item)} style={styles.avatar} />

          <View style={styles.conversationInfo}>
            <View style={styles.topRow}>
              <Text
                style={[
                  styles.userName,
                  item.hasUnread && styles.unreadUserName,
                ]}
              >
                {item.user_name || "User"}
              </Text>

              <Text
                style={[
                  styles.timeText,
                  item.hasUnread && styles.unreadTime,
                ]}
              >
                {formatDate(item.updated_at || item.created_at)}
              </Text>
            </View>

            <Text
              style={[
                styles.itemName,
                item.hasUnread && styles.unreadItemName,
              ]}
            >
              Latest item: {item.item_name || "Unnamed Item"}
            </Text>

            <View style={styles.statusRow}>
              <Text
                style={[
                  styles.statusText,
                  getStatusStyle(item),
                  item.hasUnread && styles.unreadStatus,
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
              User match conversations with your facility will appear here.
            </Text>
          </View>
        }
      />

      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => goToPage("/facility_dashboard")}
        >
          <Image
            source={require("../../assets/icons/home.png")}
            style={styles.navImage}
          />

          <Text
            style={[
              styles.navLabel,
              pathname === "/facility_dashboard" && styles.navActive,
            ]}
          >
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => goToPage("/facility_dashboard/facility_map")}
        >
          <Image
            source={require("../../assets/icons/map.png")}
            style={styles.navImage}
          />

          <Text
            style={[
              styles.navLabel,
              pathname === "/facility_dashboard/facility_map" &&
                styles.navActive,
            ]}
          >
            Map
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => goToPage("/facility_dashboard/messages")}
        >
          <Image
            source={require("../../assets/icons/chatting.png")}
            style={styles.navImage}
          />

          <Text
            style={[
              styles.navLabel,
              pathname === "/facility_dashboard/messages" && styles.navActive,
            ]}
          >
            Messages
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => goToPage("/facility_dashboard/profile")}
        >
          <Image
            source={require("../../assets/icons/user.png")}
            style={styles.navImage}
          />

          <Text
            style={[
              styles.navLabel,
              pathname === "/facility_dashboard/profile" &&
                styles.navActive,
            ]}
          >
            Profile
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => goToPage("/facility_dashboard/settings")}
        >
          <Image
            source={require("../../assets/icons/setting_1.png")}
            style={styles.navImage}
          />

          <Text
            style={[
              styles.navLabel,
              pathname === "/facility_dashboard/settings" &&
                styles.navActive,
            ]}
          >
            Settings
          </Text>
        </TouchableOpacity>
      </View>
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

  userName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "bold",
    color: "#111",
    marginRight: 8,
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
    color: "#1976d2",
  },

  cancelledStatus: {
    color: "red",
  },

  defaultStatus: {
    color: "#555",
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

  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#ddd",
    paddingBottom: 10,
  },

  navItem: {
    alignItems: "center",
  },

  navImage: {
    width: 24,
    height: 24,
    marginBottom: 2,
  },

  navLabel: {
    fontSize: 12,
    color: "#777",
  },

  navActive: {
    color: "green",
    fontWeight: "bold",
  },

  unreadConversationCard: {
  backgroundColor: "#f3fff2",
  borderColor: "#2f7d1f",
  borderWidth: 2,
},

unreadUserName: {
  fontWeight: "900",
},

unreadItemName: {
  fontWeight: "700",
},

unreadTime: {
  color: "red",
  fontWeight: "bold",
},

unreadStatus: {
  fontWeight: "bold",
  color: "#d32f2f",
},
});