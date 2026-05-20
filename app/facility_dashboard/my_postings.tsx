import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import { useFocusEffect, usePathname, useRouter } from "expo-router";
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
import { API_URL } from "../../config";

export default function MyPostings() {
  const router = useRouter();
  const pathname = usePathname();

  const [facilityId, setFacilityId] = useState("");
  const [postings, setPostings] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("All");

  const [editVisible, setEditVisible] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [editedItemNeeded, setEditedItemNeeded] = useState("");
  const [editedDescription, setEditedDescription] = useState("");

  const getStatus = (post: any) => post.status || "Posted";

  const postedCount = postings.filter(
    (post) => getStatus(post) === "Posted"
  ).length;

  const matchedCount = postings.filter(
    (post) => getStatus(post) === "Matched"
  ).length;

  const pendingMatchCount = postings.filter(
    (post) => getStatus(post) === "Pending Match"
  ).length;

  const filteredPostings =
    filter === "All"
      ? postings
      : postings.filter((post) => getStatus(post) === filter);

  useEffect(() => {
    fetchPostings();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPostings();
    }, [])
  );

  const fetchPostings = async () => {
    try {
      const stored = await AsyncStorage.getItem("user");

      if (!stored) {
        setPostings([]);
        return;
      }

      const parsed = JSON.parse(stored);

      const id =
        parsed?.id ||
        parsed?.facility_id ||
        parsed?.user?.id ||
        parsed?.data?.id ||
        "";

      setFacilityId(String(id));

      if (!id) {
        setPostings([]);
        return;
      }

      const response = await fetch(
        `${API_URL}/get_facility_postings.php?facility_id=${encodeURIComponent(
          String(id)
        )}`
      );

      const text = await response.text();
      console.log("MY POSTINGS RESPONSE:", text);

      const result = JSON.parse(text);

      if (result.success && Array.isArray(result.postings)) {
        const sorted = [...result.postings].sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA;
        });

        setPostings(sorted);
      } else {
        setPostings([]);
      }
    } catch (error) {
      console.log("FETCH MY POSTINGS ERROR:", error);
      setPostings([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPostings();
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
    return styles.postedStatus;
  };

  const openEditModal = (post: any) => {
    setEditingPost(post);
    setEditedItemNeeded(post.item_needed || "");
    setEditedDescription(post.description || "");
    setEditVisible(true);
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

    Keyboard.dismiss();

    const formData = new FormData();
    formData.append("id", String(editingPost.id));
    formData.append("facility_id", facilityId);
    formData.append("item_needed", editedItemNeeded.trim());
    formData.append("description", editedDescription.trim());

    try {
      const response = await fetch(`${API_URL}/update_facility_posting.php`, {
        method: "POST",
        body: formData,
      });

      const text = await response.text();
      console.log("UPDATE POSTING RESPONSE:", text);

      const result = JSON.parse(text);

      if (result.success) {
        Alert.alert("Success", "Posting updated successfully.");
        setEditVisible(false);
        setEditingPost(null);
        setEditedItemNeeded("");
        setEditedDescription("");
        fetchPostings();
      } else {
        Alert.alert("Update Failed", result.message || "Failed to update post.");
      }
    } catch (error) {
      console.log("UPDATE POSTING ERROR:", error);
      Alert.alert("Error", "Failed to update posting.");
    }
  };

  const renderPosting = ({ item }: any) => {
    const status = getStatus(item);

    return (
      <TouchableOpacity style={styles.card} onPress={() => openEditModal(item)}>
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
              {item.submitter_name || "Facility"}
            </Text>

            <Text style={[styles.statusText, getStatusStyle(status)]}>
              {status}
            </Text>
          </View>
        </View>

        <Text style={styles.description}>
          {item.description || "No description added."}
        </Text>

        <View style={styles.divider} />

        <View style={styles.dateRow}>
          <Text style={styles.dateLabel}>Date Posted</Text>
          <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
        </View>

        <Text style={styles.tapHint}>Tap to edit posting</Text>
      </TouchableOpacity>
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
                />

                <Text style={styles.modalLabel}>Description</Text>
                <TextInput
                  value={editedDescription}
                  onChangeText={setEditedDescription}
                  style={styles.descriptionInput}
                  placeholder="Enter description"
                  multiline
                  textAlignVertical="top"
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      Keyboard.dismiss();
                      setEditVisible(false);
                      setEditingPost(null);
                    }}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={updatePosting}
                  >
                    <Text style={styles.saveText}>Save</Text>
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
          onPress={() => router.push("/facility_dashboard" as any)}
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
          onPress={() =>
            router.push("/facility_dashboard/facility_map" as any)
          }
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
          onPress={() => router.push("/facility_dashboard/messages" as any)}
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
          onPress={() => router.push("/facility_dashboard/profile" as any)}
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
          onPress={() => router.push("/facility_dashboard/settings" as any)}
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
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 25,
    marginBottom: 28,
    color: "#000",
  },

  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 28,
  },

  statsItem: {
    alignItems: "center",
    width: "30%",
  },

  statsNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
  },

  statsLabel: {
    fontSize: 14,
    color: "gray",
    marginTop: 5,
    textAlign: "center",
  },

  filterWrapper: {
    height: 55,
    marginBottom: 8,
  },

  filterContent: {
    alignItems: "center",
    paddingRight: 20,
  },

  filterButton: {
    height: 42,
    paddingHorizontal: 22,
    borderRadius: 24,
    borderWidth: 1.3,
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
    fontSize: 15,
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

  description: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 19,
    color: "#333",
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
  },

  descriptionInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginTop: 5,
    minHeight: 100,
    fontSize: 14,
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