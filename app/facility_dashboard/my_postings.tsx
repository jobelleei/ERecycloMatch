import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, usePathname, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../utils/supabase";

export default function MyPostings() {
  const router = useRouter();
  const pathname = usePathname();

  const [facilityId, setFacilityId] = useState("");
  const [facilityName, setFacilityName] = useState("");
  const [facilityLocation, setFacilityLocation] = useState("");

  const [postings, setPostings] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("All");

  const [editVisible, setEditVisible] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [editedItemNeeded, setEditedItemNeeded] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const goToPage = (path: string) => {
    router.push(path as any);
  };

  const normalizeText = (value: any) => {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  };

  const getStatus = (post: any) => {
    const status = normalizeText(post?.status || "Posted");

    if (status === "matched") return "Matched";
    if (status === "accepted") return "Matched";
    if (status === "active") return "Matched";

    if (status === "pending match") return "Pending Match";
    if (status === "match pending") return "Pending Match";
    if (status === "match_pending") return "Pending Match";
    if (status === "request pending") return "Pending Match";
    if (status === "request_pending") return "Pending Match";
    if (status === "pending") return "Pending Match";

    if (status === "posted") return "Posted";
    if (status === "listed") return "Posted";
    if (status === "rejected") return "Posted";
    if (status === "cancelled") return "Posted";
    if (status === "canceled") return "Posted";

    if (status === "finished") return "Finished";
    if (status === "recycled") return "Finished";
    if (status === "completed") return "Finished";

    return "Posted";
  };

  const isFinishedPosting = (post: any) => {
    const status = getStatus(post);
    return status === "Finished";
  };

  const activePostings = postings.filter((post) => !isFinishedPosting(post));

  const postedCount = activePostings.filter(
    (post) => getStatus(post) === "Posted"
  ).length;

  const matchedCount = activePostings.filter(
    (post) => getStatus(post) === "Matched"
  ).length;

  const pendingMatchCount = activePostings.filter(
    (post) => getStatus(post) === "Pending Match"
  ).length;

  const filteredPostings =
    filter === "All"
      ? activePostings
      : activePostings.filter((post) => getStatus(post) === filter);

  useEffect(() => {
    loadFacility();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFacility();
    }, [])
  );

  useEffect(() => {
    if (facilityId) {
      fetchPostings(facilityId);
    }
  }, [facilityId]);

  useEffect(() => {
    if (!facilityId) return;

    const interval = setInterval(() => {
      fetchPostings(facilityId);
    }, 5000);

    return () => clearInterval(interval);
  }, [facilityId]);

  const loadFacility = async () => {
    try {
      const stored = await AsyncStorage.getItem("user");

      if (!stored) {
        setPostings([]);
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

      const role = String(actualUser?.role || parsed?.role || "").toLowerCase();

      if (role && role !== "facility") {
        router.replace("/user_dashboard" as any);
        return;
      }

      const name =
        actualUser?.name ||
        actualUser?.facility_name ||
        parsed?.name ||
        parsed?.facility_name ||
        "Facility";

      const location =
        actualUser?.location ||
        actualUser?.address ||
        parsed?.location ||
        parsed?.address ||
        "";

      setFacilityId(String(id));
      setFacilityName(String(name));
      setFacilityLocation(String(location));

      if (!id) {
        setPostings([]);
      }
    } catch (error) {
      console.log("LOAD FACILITY ERROR:", error);
      setPostings([]);
    }
  };

  const isConversationConnectedToPosting = (post: any, conversation: any) => {
    const postId = String(post?.id || "");
    const postItemName = normalizeText(post?.item_needed || "");

    const conversationPostingId = String(
      conversation?.facility_posting_id ||
        conversation?.posting_id ||
        conversation?.facility_post_id ||
        conversation?.post_id ||
        ""
    );

    const conversationItemName = normalizeText(
      conversation?.item_name ||
        conversation?.item_needed ||
        conversation?.matched_item_name ||
        ""
    );

    if (conversationPostingId && postId && conversationPostingId === postId) {
      return true;
    }

    if (postItemName && conversationItemName && postItemName === conversationItemName) {
      return true;
    }

    return false;
  };

  const getConversationStatusForPosting = (post: any, conversations: any[]) => {
    const relatedConversations = (conversations || []).filter((conversation) =>
      isConversationConnectedToPosting(post, conversation)
    );

    const hasFinished = relatedConversations.some((conversation) => {
      const status = normalizeText(conversation?.status || "");
      const requestStatus = normalizeText(conversation?.request_status || "");

      return (
        status === "finished" ||
        status === "completed" ||
        status === "recycled" ||
        requestStatus === "finished" ||
        requestStatus === "completed"
      );
    });

    if (hasFinished) return "Finished";

    const hasMatched = relatedConversations.some((conversation) => {
      const status = normalizeText(conversation?.status || "");
      const requestStatus = normalizeText(conversation?.request_status || "");

      return (
        status === "matched" ||
        status === "accepted" ||
        status === "active" ||
        requestStatus === "accepted" ||
        requestStatus === "matched"
      );
    });

    if (hasMatched) return "Matched";

    const hasPending = relatedConversations.some((conversation) => {
      const status = normalizeText(conversation?.status || "");
      const requestStatus = normalizeText(conversation?.request_status || "");

      return (
        status === "match_pending" ||
        status === "match pending" ||
        status === "request_pending" ||
        status === "request pending" ||
        status === "pending" ||
        status === "pending match" ||
        requestStatus === "pending"
      );
    });

    if (hasPending) return "Pending Match";

    return "Posted";
  };

  const getLatestConnectedConversation = (post: any, conversations: any[]) => {
    const relatedConversations = (conversations || []).filter((conversation) =>
      isConversationConnectedToPosting(post, conversation)
    );

    if (relatedConversations.length === 0) return null;

    return relatedConversations.sort((a, b) => {
      const aTime = new Date(
        a?.updated_at || a?.created_at || a?.finished_at || 0
      ).getTime();

      const bTime = new Date(
        b?.updated_at || b?.created_at || b?.finished_at || 0
      ).getTime();

      return bTime - aTime;
    })[0];
  };

  const fetchPostings = async (id: string) => {
    try {
      if (!id) {
        setPostings([]);
        return;
      }

      const { data: postingsData, error: postingsError } = await supabase
        .from("facility_postings")
        .select("*")
        .eq("facility_id", String(id))
        .order("created_at", { ascending: false });

      if (postingsError) {
        console.log("FETCH MY POSTINGS ERROR:", postingsError);
        setPostings([]);
        return;
      }

      const { data: conversationsData, error: conversationsError } =
        await supabase
          .from("conversations")
          .select("*")
          .eq("facility_id", String(id));

      if (conversationsError) {
        console.log("FETCH POSTING CONVERSATIONS ERROR:", conversationsError);
        setPostings(postingsData || []);
        return;
      }

      const updatedPostings = (postingsData || []).map((post: any) => {
        const connectedStatus = getConversationStatusForPosting(
          post,
          conversationsData || []
        );

        const latestConversation = getLatestConnectedConversation(
          post,
          conversationsData || []
        );

        return {
          ...post,
          status: connectedStatus,
          matched_user_name:
            latestConversation?.user_name ||
            latestConversation?.sender_name ||
            post?.matched_user_name ||
            "User",
          matched_item_name:
            latestConversation?.item_name ||
            latestConversation?.matched_item_name ||
            post?.matched_item_name ||
            post?.item_needed ||
            "Matched item",
          matched_at:
            latestConversation?.matched_at ||
            latestConversation?.updated_at ||
            latestConversation?.created_at ||
            post?.matched_at ||
            post?.updated_at ||
            post?.created_at,
          finished_at:
            latestConversation?.finished_at ||
            latestConversation?.completed_at ||
            post?.finished_at ||
            "",
        };
      });

      setPostings(updatedPostings);

      for (const post of updatedPostings) {
        const originalPost = (postingsData || []).find(
          (item: any) => String(item.id) === String(post.id)
        );

        if (String(originalPost?.status || "Posted") !== String(post.status)) {
          const { error: syncError } = await supabase
            .from("facility_postings")
            .update({
              status: post.status,
              updated_at: new Date().toISOString(),
            })
            .eq("id", post.id)
            .eq("facility_id", String(id));

          if (syncError) {
            console.log("SYNC POSTING STATUS ERROR:", syncError);
          }
        }
      }
    } catch (error) {
      console.log("FETCH MY POSTINGS ERROR:", error);
      setPostings([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);

    await loadFacility();

    if (facilityId) {
      await fetchPostings(facilityId);
    }

    setRefreshing(false);
  };

  const formatDate = (value: string) => {
    if (!value) return "No date available";

    const date = new Date(value);

    if (isNaN(date.getTime())) return value;

    return date.toLocaleString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatusStyle = (status: string) => {
    if (status === "Matched") return styles.matchedStatus;
    if (status === "Pending Match") return styles.pendingMatchStatus;
    if (status === "Finished") return styles.finishedStatus;
    return styles.postedStatus;
  };

  const canEditOrDelete = (post: any) => {
    const status = getStatus(post);
    return status === "Posted";
  };

  const openEditModal = (post: any) => {
    if (!canEditOrDelete(post)) {
      Alert.alert(
        "Posting Locked",
        "You cannot edit this posting while it has a pending or matched request."
      );
      return;
    }

    setEditingPost(post);
    setEditedItemNeeded(post.item_needed || "");
    setEditedDescription(post.description || "");
    setEditVisible(true);
  };

  const closeEditModal = () => {
    Keyboard.dismiss();
    setEditVisible(false);
    setEditingPost(null);
    setEditedItemNeeded("");
    setEditedDescription("");
  };

  const updatePosting = async () => {
    if (!editingPost) return;

    if (!editedItemNeeded.trim()) {
      Alert.alert("Item Required", "Please enter the item needed.");
      return;
    }

    if (!editedDescription.trim()) {
      Alert.alert("Description Required", "Please enter a description.");
      return;
    }

    try {
      setSaving(true);
      Keyboard.dismiss();

      const { error } = await supabase
        .from("facility_postings")
        .update({
          item_needed: editedItemNeeded.trim(),
          description: editedDescription.trim(),
          facility_location:
            facilityLocation || editingPost.facility_location || "",
          status: "Posted",
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingPost.id)
        .eq("facility_id", String(facilityId));

      if (error) {
        Alert.alert("Update Failed", error.message);
        return;
      }

      Alert.alert("Success", "Posting updated successfully.");

      closeEditModal();
      fetchPostings(facilityId);
    } catch (error: any) {
      console.log("UPDATE POSTING ERROR:", error);
      Alert.alert("Error", error?.message || "Failed to update posting.");
    } finally {
      setSaving(false);
    }
  };

  const deletePosting = (post: any) => {
    if (!canEditOrDelete(post)) {
      Alert.alert(
        "Posting Locked",
        "You cannot delete this posting while it has a pending or matched request."
      );
      return;
    }

    Alert.alert(
      "Delete Posting",
      "Are you sure you want to delete this posting?",
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
              const { error } = await supabase
                .from("facility_postings")
                .delete()
                .eq("id", post.id)
                .eq("facility_id", String(facilityId));

              if (error) {
                Alert.alert("Delete Failed", error.message);
                return;
              }

              setPostings((prev) =>
                prev.filter(
                  (currentPost) => String(currentPost.id) !== String(post.id)
                )
              );

              Alert.alert("Deleted", "Posting deleted successfully.");
              fetchPostings(facilityId);
            } catch (error: any) {
              console.log("DELETE POSTING ERROR:", error);
              Alert.alert(
                "Error",
                error?.message || "Failed to delete posting."
              );
            }
          },
        },
      ]
    );
  };

  const renderMatchDetails = (item: any) => {
    const status = getStatus(item);

    if (status === "Posted") return null;

    return (
      <View style={styles.matchDetailsBox}>
        <Text style={styles.matchDetailsTitle}>Match Details</Text>

        <Text style={styles.matchDetailsText}>
          Requested by: {item.matched_user_name || "User"}
        </Text>

        <Text style={styles.matchDetailsText}>
          Match started: {formatDate(item.matched_at)}
        </Text>

        {item.finished_at ? (
          <Text style={styles.matchDetailsText}>
            Finished: {formatDate(item.finished_at)}
          </Text>
        ) : null}
      </View>
    );
  };

  const renderPosting = ({ item }: any) => {
    const status = getStatus(item);
    const locked = !canEditOrDelete(item);

    return (
      <View style={styles.card}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            if (canEditOrDelete(item)) {
              openEditModal(item);
            }
          }}
        >
          <View style={styles.cardHeader}>
            <View style={styles.iconBox}>
              <Image
                source={require("../../assets/icons/price-tag.png")}
                style={styles.cardIcon}
              />
            </View>

            <View style={styles.cardInfo}>
              <Text style={styles.itemTitle}>
                {item.item_needed || "No item needed"}
              </Text>

              <Text style={styles.facilityName}>
                {item.submitter_name || facilityName || "Facility"}
              </Text>

              <Text style={[styles.statusText, getStatusStyle(status)]}>
                {status}
              </Text>
            </View>
          </View>

          <Text style={styles.description}>
            {item.description || "No description added."}
          </Text>

          {renderMatchDetails(item)}

          <View style={styles.divider} />

          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>Date Posted</Text>
            <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
          </View>

          <Text style={styles.tapHint}>
            {locked ? "Posting locked during match" : "Tap to edit posting"}
          </Text>
        </TouchableOpacity>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[
              styles.editActionButton,
              locked && styles.disabledActionButton,
            ]}
            disabled={locked}
            onPress={() => openEditModal(item)}
          >
            <Text style={styles.editActionText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.deleteActionButton,
              locked && styles.disabledDeleteButton,
            ]}
            disabled={locked}
            onPress={() => deletePosting(item)}
          >
            <Text
              style={[
                styles.deleteActionText,
                locked && styles.disabledDeleteText,
              ]}
            >
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>My Postings</Text>

      <View style={styles.statsContainer}>
        <View style={styles.statsItem}>
          <Text style={styles.statsNumber}>{postedCount}</Text>
          <Text style={styles.statsLabel}>Posted</Text>
        </View>

        <View style={styles.statsItem}>
          <Text style={styles.statsNumber}>{matchedCount}</Text>
          <Text style={styles.statsLabel}>Matched</Text>
        </View>

        <View style={styles.statsItem}>
          <Text style={styles.statsNumber}>{pendingMatchCount}</Text>
          <Text style={styles.statsLabel}>Pending</Text>
        </View>
      </View>

      <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {["All", "Posted", "Matched", "Pending Match"].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterButton,
                filter === status && styles.activeFilterButton,
              ]}
              onPress={() => setFilter(status)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === status && styles.activeFilterText,
                ]}
              >
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredPostings}
        keyExtractor={(item) => `posting-${item.id}`}
        renderItem={renderPosting}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No {filter.toLowerCase()} postings yet.
          </Text>
        }
      />

      <Modal visible={editVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.keyboardView}
          >
            <View style={styles.modalBox}>
              <ScrollView keyboardShouldPersistTaps="handled">
                <Text style={styles.modalTitle}>Update Posting</Text>

                <Text style={styles.modalLabel}>Item Needed</Text>
                <TextInput
                  value={editedItemNeeded}
                  onChangeText={setEditedItemNeeded}
                  style={styles.input}
                  placeholder="Enter item needed"
                  placeholderTextColor="#777"
                />

                <Text style={styles.modalLabel}>Description</Text>
                <TextInput
                  value={editedDescription}
                  onChangeText={setEditedDescription}
                  style={styles.descriptionInput}
                  placeholder="Enter description"
                  placeholderTextColor="#777"
                  multiline
                  textAlignVertical="top"
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={closeEditModal}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.saveButton, saving && styles.disabledButton]}
                    onPress={updatePosting}
                    disabled={saving}
                  >
                    <Text style={styles.saveText}>
                      {saving ? "Saving..." : "Save"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

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
              pathname === "/facility_dashboard/profile" && styles.navActive,
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
              pathname === "/facility_dashboard/settings" && styles.navActive,
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

  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 20,
    color: "#000",
  },

  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },

  statsItem: {
    alignItems: "center",
    width: "30%",
  },

  statsNumber: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000",
  },

  statsLabel: {
    fontSize: 13,
    color: "gray",
    marginTop: 5,
    textAlign: "center",
  },

  filterWrapper: {
    height: 50,
    marginBottom: 8,
  },

  filterContent: {
    alignItems: "center",
    paddingRight: 20,
  },

  filterButton: {
    height: 38,
    paddingHorizontal: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#ccc",
    marginRight: 10,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },

  activeFilterButton: {
    backgroundColor: "#145f22",
    borderColor: "#145f22",
  },

  filterText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#555",
  },

  activeFilterText: {
    color: "#fff",
  },

  listContent: {
    paddingBottom: 120,
  },

  card: {
    backgroundColor: "#f7f7f7",
    borderRadius: 14,
    padding: 13,
    marginBottom: 13,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: "#e8f5e9",
    justifyContent: "center",
    alignItems: "center",
  },

  cardIcon: {
    width: 28,
    height: 28,
    tintColor: "#145f22",
  },

  cardInfo: {
    flex: 1,
    marginLeft: 12,
  },

  itemTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#000",
  },

  facilityName: {
    fontSize: 13,
    color: "#555",
    marginTop: 2,
  },

  statusText: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "bold",
  },

  postedStatus: {
    color: "green",
  },

  matchedStatus: {
    color: "#1976d2",
  },

  pendingMatchStatus: {
    color: "orange",
  },

  finishedStatus: {
    color: "green",
  },

  description: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 19,
    color: "#333",
  },

  matchDetailsBox: {
    marginTop: 10,
    backgroundColor: "#eef7ee",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#d6ead6",
  },

  matchDetailsTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#145f22",
    marginBottom: 5,
  },

  matchDetailsText: {
    fontSize: 12,
    color: "#333",
    marginTop: 3,
    lineHeight: 17,
  },

  divider: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 10,
  },

  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  dateLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#555",
  },

  dateText: {
    fontSize: 12,
    color: "#777",
    textAlign: "right",
    flex: 1,
    marginLeft: 10,
  },

  tapHint: {
    marginTop: 8,
    fontSize: 11,
    color: "#777",
    textAlign: "right",
  },

  cardActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },

  editActionButton: {
    flex: 1,
    backgroundColor: "#145f22",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },

  disabledActionButton: {
    backgroundColor: "#9db69f",
  },

  editActionText: {
    color: "#fff",
    fontWeight: "bold",
  },

  deleteActionButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "red",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#fff",
  },

  disabledDeleteButton: {
    borderColor: "#aaa",
    backgroundColor: "#eee",
  },

  deleteActionText: {
    color: "red",
    fontWeight: "bold",
  },

  disabledDeleteText: {
    color: "#777",
  },

  emptyText: {
    textAlign: "center",
    color: "gray",
    marginTop: 35,
    fontSize: 15,
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  keyboardView: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },

  modalBox: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    maxHeight: "85%",
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },

  modalLabel: {
    fontWeight: "bold",
    marginTop: 10,
    color: "#000",
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginTop: 5,
    fontSize: 14,
    color: "#000",
  },

  descriptionInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginTop: 5,
    minHeight: 100,
    fontSize: 14,
    color: "#000",
  },

  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 12,
  },

  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "gray",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },

  saveButton: {
    flex: 1,
    backgroundColor: "#145f22",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },

  disabledButton: {
    backgroundColor: "#8aa887",
  },

  cancelText: {
    color: "gray",
    fontWeight: "bold",
  },

  saveText: {
    color: "#fff",
    fontWeight: "bold",
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
});