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

export default function MyListing() {
  const router = useRouter();
  const pathname = usePathname();

  const [items, setItems] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [filter, setFilter] = useState("All");
  const [matchModalVisible, setMatchModalVisible] = useState(false);

  const [matchedProfile, setMatchedProfile] = useState<any>(null);
  const [matchedFacilities, setMatchedFacilities] = useState<any[]>([]);
  const [matchFound, setMatchFound] = useState(false);

  const [editVisible, setEditVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editedDescription, setEditedDescription] = useState("");

  const getItemTimeValue = (item: any) => {
    const dateValue =
      item.listed_at ||
      item.date_listed ||
      item.created_at ||
      item.updated_at ||
      item.date_created ||
      item.id ||
      0;

    const date = new Date(dateValue);

    if (!isNaN(date.getTime())) {
      return date.getTime();
    }

    const numberValue = Number(dateValue);
    return isNaN(numberValue) ? 0 : numberValue;
  };

  const sortByLatest = (list: any[]) => {
    return [...list].sort((a, b) => getItemTimeValue(b) - getItemTimeValue(a));
  };

  const getMatchStatus = (item: any) => {
    return item.match_status || item.matchStatus || item.status || "Listed";
  };

  const filteredItems =
    filter === "All"
      ? items
      : items.filter((item) => getMatchStatus(item) === filter);

  useEffect(() => {
    fetchListings();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchListings();
    }, []),
  );

  const fetchListings = async () => {
    try {
      const stored = await AsyncStorage.getItem("user");

      if (!stored) {
        console.log("No stored user found");
        setItems([]);
        return;
      }

      const parsed = JSON.parse(stored);

      const userId =
        parsed?.id ||
        parsed?.user_id ||
        parsed?.user?.id ||
        parsed?.data?.id ||
        "";

      const userName =
        parsed?.name ||
        parsed?.username ||
        parsed?.user?.name ||
        parsed?.data?.name ||
        "";

      const encodedUserId = encodeURIComponent(String(userId || ""));
      const encodedName = encodeURIComponent(String(userName || ""));

      const response = await fetch(
        `${API_URL}/get_my_listings.php?user_id=${encodedUserId}&submitter_name=${encodedName}`,
      );

      const text = await response.text();
      console.log("LISTINGS RESPONSE:", text);

      const result = JSON.parse(text);

      if (result.success && Array.isArray(result.items)) {
        const listedOnly = result.items.filter((item: any) => {
          const status = getMatchStatus(item);

          return (
            status === "Listed" ||
            status === "Pending Match" ||
            status === "Matched"
          );
        });

        setItems(sortByLatest(listedOnly));
      } else {
        setItems([]);
      }
    } catch (error) {
      console.log("FETCH LISTINGS ERROR:", error);
      setItems([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchListings();
    setRefreshing(false);
  };

  const cleanIssues = (issues: string) => {
    if (!issues) return "None";

    return issues
      .replace(/\s*\([^)]*\)/g, "")
      .replace(/\s*recyclability/gi, "")
      .replace(/\s*hazard/gi, "")
      .trim();
  };

  const getImageUrl = (item: any) => {
    if (!item.item_image) return "https://via.placeholder.com/100";
    return `${API_URL}/uploads/items/approved/${item.item_image}`;
  };

  const openUpdateModal = (item: any) => {
    setEditingItem(item);
    setEditedDescription(item.description || "");
    setEditVisible(true);
  };

  const updateDescription = async () => {
    if (!editingItem) return;

    Keyboard.dismiss();

    const formData = new FormData();
    formData.append("id", String(editingItem.id));
    formData.append("folder", editingItem.folder || "approved");
    formData.append("description", editedDescription);

    try {
      const response = await fetch(`${API_URL}/update_item_description.php`, {
        method: "POST",
        body: formData,
      });

      const text = await response.text();
      console.log("UPDATE LISTING RESPONSE:", text);

      const result = JSON.parse(text);

      Alert.alert("Update Listing", result.message);

      if (result.success) {
        setEditVisible(false);
        fetchListings();
      }
    } catch (error) {
      console.log("UPDATE LISTING ERROR:", error);
      Alert.alert("Error", "Failed to update listing.");
    }
  };

  const deleteItem = async (item: any) => {
    Alert.alert(
      "Delete Listing",
      "Deleting this listing will also remove the generated post from the Profile page. Are you sure?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const formData = new FormData();
            formData.append("id", String(item.id));
            formData.append("folder", item.folder || "approved");

            try {
              const response = await fetch(`${API_URL}/delete_item.php`, {
                method: "POST",
                body: formData,
              });

              const text = await response.text();
              console.log("DELETE LISTING RESPONSE:", text);

              const result = JSON.parse(text);

              Alert.alert("Delete Listing", result.message);

              if (result.success) {
                setItems((prevItems) =>
                  prevItems.filter(
                    (currentItem) => String(currentItem.id) !== String(item.id),
                  ),
                );

                fetchListings();
              }
            } catch (error) {
              console.log("DELETE LISTING ERROR:", error);
              Alert.alert("Error", "Failed to delete listing.");
            }
          },
        },
      ],
    );
  };
  const matchItem = async (item: any) => {
    try {
      const label = item.item_name || "";

      const response = await fetch(
        `http://192.168.1.8:8000/match-facility/${encodeURIComponent(
          label,
        )}?description=${encodeURIComponent(item.description || "")}`,
      );

      const result = await response.json();

      if (result.success && result.matches?.length > 0) {
        setMatchFound(true);

        const facilities = result.matches.map((facility: any) => ({
          id: facility.facility_id,

          name: facility.facility_name,

          address: facility.facility_location,

          image: facility.profile_image
            ? {
                uri: `http://192.168.1.8/Admin_Side/uploads/profile/facility_profile/${facility.profile_image}`,
              }
            : require("../../assets/icons/avatar.png"),
        }));

        setMatchedFacilities(facilities);
      } else {
        setMatchFound(false);
        setMatchedFacilities([]);
      }

      setMatchModalVisible(true);
    } catch (error) {
      console.log("MATCH ERROR:", error);

      Alert.alert("Error", "Failed to match item.");
    }
  };

  const renderItem = ({ item }: any) => {
    const uniqueKey = `listed-${item.id}`;
    const matchStatus = getMatchStatus(item);

    return (
      <View>
        <TouchableOpacity
          style={styles.card}
          onPress={() =>
            setSelectedItem(selectedItem === uniqueKey ? null : uniqueKey)
          }
        >
          <Image source={{ uri: getImageUrl(item) }} style={styles.itemImage} />

          <View style={styles.itemInfo}>
            <Text style={styles.itemTitle}>{item.item_name}</Text>

            <Text style={styles.itemDescription}>
              {item.description || "No description"}
            </Text>

            <Text
              style={
                matchStatus === "Matched"
                  ? styles.matchedStatus
                  : matchStatus === "Pending Match"
                    ? styles.pendingMatchStatus
                    : styles.status
              }
            >
              {matchStatus}
            </Text>
          </View>

          <Text style={styles.dots}>⋮</Text>
        </TouchableOpacity>

        {selectedItem === uniqueKey && (
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={styles.matchButton}
              onPress={() => matchItem(item)}
            >
              <Text style={styles.matchText}>Match</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => openUpdateModal(item)}
            >
              <Text style={styles.actionText}>Update</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deleteItem(item)}
            >
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>My Listing</Text>

      <View style={styles.statsContainer}>
        <View style={styles.statsCard}>
          <Text style={styles.statsNumber}>{items.length}</Text>
          <Text style={styles.statsLabel}>Listed Items</Text>
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.statsNumber}>
            {items.filter((item) => getMatchStatus(item) === "Matched").length}
          </Text>
          <Text style={styles.statsLabel}>Matched</Text>
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.statsNumber}>
            {
              items.filter((item) => getMatchStatus(item) === "Pending Match")
                .length
            }
          </Text>
          <Text style={styles.statsLabel}>Pending Match</Text>
        </View>
      </View>

      <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {["All", "Listed", "Matched", "Pending Match"].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterButton,
                filter === status && styles.activeFilterButton,
              ]}
              onPress={() => {
                setFilter(status);
                setSelectedItem(null);
              }}
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
        data={filteredItems}
        keyExtractor={(item) => `listed-${item.id}`}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No {filter.toLowerCase()} items yet.
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
              <ScrollView
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.modalScrollContent}
              >
                <Text style={styles.modalTitle}>Update Listing</Text>

                {editingItem && (
                  <>
                    <Text style={styles.modalLabel}>Item Name</Text>
                    <Text style={styles.readOnlyText}>
                      {editingItem.item_name}
                    </Text>

                    <Text style={styles.modalLabel}>Issues</Text>
                    <Text style={styles.readOnlyText}>
                      {cleanIssues(editingItem.issues)}
                    </Text>

                    <Text style={styles.modalLabel}>Hazard Status</Text>
                    <Text style={styles.readOnlyText}>
                      {editingItem.hazard_status}%
                    </Text>

                    <Text style={styles.modalLabel}>Recyclability</Text>
                    <Text style={styles.readOnlyText}>
                      {editingItem.recyclability}%
                    </Text>

                    <Text style={styles.modalLabel}>Status</Text>
                    <Text style={[styles.readOnlyText, styles.listedText]}>
                      {getMatchStatus(editingItem)}
                    </Text>

                    <Text style={styles.modalLabel}>Description</Text>
                    <TextInput
                      value={editedDescription}
                      onChangeText={setEditedDescription}
                      style={styles.input}
                      multiline
                      textAlignVertical="top"
                    />
                  </>
                )}

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      Keyboard.dismiss();
                      setEditVisible(false);
                    }}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={updateDescription}
                  >
                    <Text style={styles.saveText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal visible={matchModalVisible} transparent animationType="fade">
        <View style={styles.matchOverlay}>
          <View style={styles.matchCard}>
            <Text style={styles.matchHeader}>
              {matchFound ? "Found a Match!" : "Match not found"}
            </Text>

            {!matchFound && (
              <Text style={styles.matchSubtext}>
                Dispose it to E-Waste Drop Off Bins instead?
              </Text>
            )}

            {matchFound && matchedFacilities.length > 0 ? (
              <ScrollView
                style={{
                  maxHeight: 350,
                  width: "100%",
                }}
                showsVerticalScrollIndicator={false}
              >
                {matchedFacilities.map((facility, index) => (
                  <View
                    key={index}
                    style={{
                      backgroundColor: "#fff",
                      borderRadius: 16,
                      padding: 15,
                      marginBottom: 14,
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: "#ddd",
                    }}
                  >
                    <Image
                      source={facility.image}
                      style={{
                        width: 75,
                        height: 75,
                        borderRadius: 40,
                        marginBottom: 10,
                      }}
                    />

                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "bold",
                      }}
                    >
                      {facility.name}
                    </Text>

                    <Text
                      style={{
                        color: "#666",
                        textAlign: "center",
                        marginTop: 4,
                        marginBottom: 12,
                      }}
                    >
                      {facility.address}
                    </Text>

                    <TouchableOpacity
                      style={styles.matchGreenButton}
                      onPress={async () => {
                        try {
                          const stored = await AsyncStorage.getItem("user");

                          const parsed = JSON.parse(stored || "{}");

                          const actualUser =
                            parsed.user || parsed.data || parsed;

                          const conversationId = `${actualUser.id}_${facility.id}`;

                          setMatchModalVisible(false);

                          router.push({
                            pathname: "/user_dashboard/chat",

                            params: {
                              conversationId,

                              facility_id: facility.id,

                              facility_name: facility.name,

                              profile_image: facility.image?.uri,
                            },
                          });
                        } catch (error) {
                          console.log(error);
                        }
                      }}
                    >
                      <Text style={styles.matchButtonText}>
                        Message This Facility
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.matchSubtext}>
                No facilities available for this item.
              </Text>
            )}

            <TouchableOpacity onPress={() => setMatchModalVisible(false)}>
              <Text style={styles.cancelMatchText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/user_dashboard")}
        >
          <Image
            source={require("../../assets/icons/home.png")}
            style={styles.navImage}
          />
          <Text
            style={[
              styles.navLabel,
              pathname === "/user_dashboard" && styles.navActive,
            ]}
          >
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/user_dashboard/user_scan")}
        >
          <Image
            source={require("../../assets/icons/scan.png")}
            style={styles.navImage}
          />
          <Text
            style={[
              styles.navLabel,
              pathname === "/user_dashboard/user_scan" && styles.navActive,
            ]}
          >
            Scan
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/user_dashboard/user_map")}
        >
          <Image
            source={require("../../assets/icons/map.png")}
            style={styles.navImage}
          />
          <Text
            style={[
              styles.navLabel,
              pathname === "/user_dashboard/user_map" && styles.navActive,
            ]}
          >
            Map
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/user_dashboard/messages")}
        >
          <Image
            source={require("../../assets/icons/chatting.png")}
            style={styles.navImage}
          />
          <Text
            style={[
              styles.navLabel,
              pathname === "/user_dashboard/messages" && styles.navActive,
            ]}
          >
            Messages
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/user_dashboard/profile")}
        >
          <Image
            source={require("../../assets/icons/user.png")}
            style={styles.navImage}
          />
          <Text
            style={[
              styles.navLabel,
              pathname === "/user_dashboard/profile" && styles.navActive,
            ]}
          >
            Profile
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/user_dashboard/settings")}
        >
          <Image
            source={require("../../assets/icons/setting_1.png")}
            style={styles.navImage}
          />
          <Text
            style={[
              styles.navLabel,
              pathname === "/user_dashboard/settings" && styles.navActive,
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
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  statsCard: {
    width: "30%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    elevation: 3,
  },
  statsNumber: { fontSize: 20, fontWeight: "bold" },
  statsLabel: {
    fontSize: 12,
    color: "gray",
    marginTop: 5,
    textAlign: "center",
  },
  filterWrapper: { height: 45, marginBottom: 15 },
  filterContent: { alignItems: "center" },
  filterButton: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    marginRight: 8,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  activeFilterButton: { backgroundColor: "#1b5e20", borderColor: "#1b5e20" },
  filterText: { color: "#555", fontWeight: "bold", fontSize: 12 },
  activeFilterText: { color: "#fff" },
  card: {
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  itemImage: { width: 60, height: 60, borderRadius: 8 },
  itemInfo: { flex: 1, marginLeft: 10 },
  itemTitle: { fontSize: 16, fontWeight: "bold" },
  itemDescription: { color: "gray", marginTop: 2 },
  status: { marginTop: 5, color: "green", fontWeight: "bold", fontSize: 12 },
  pendingMatchStatus: {
    marginTop: 5,
    color: "orange",
    fontWeight: "bold",
    fontSize: 12,
  },
  matchedStatus: {
    marginTop: 5,
    color: "#1976d2",
    fontWeight: "bold",
    fontSize: 12,
  },
  listedText: { color: "green", fontWeight: "bold" },
  dots: { fontSize: 20, color: "gray" },
  actionContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 15,
    marginTop: -5,
    gap: 8,
  },
  actionButton: {
    borderWidth: 1,
    borderColor: "#1976d2",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 5,
    backgroundColor: "#fff",
  },
  actionText: { color: "#1976d2", fontWeight: "bold" },
  deleteButton: {
    borderWidth: 1,
    borderColor: "red",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 5,
    backgroundColor: "#fff",
  },
  matchButton: {
    borderWidth: 1,
    borderColor: "green",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 5,
    backgroundColor: "#fff",
  },
  matchText: { color: "green", fontWeight: "bold" },
  deleteText: { color: "red", fontWeight: "bold" },
  emptyText: {
    textAlign: "center",
    color: "gray",
    marginTop: 40,
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
  modalScrollContent: { paddingBottom: 10 },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  modalLabel: { fontWeight: "bold", marginTop: 10 },
  readOnlyText: {
    backgroundColor: "#eee",
    padding: 10,
    borderRadius: 8,
    marginTop: 5,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    marginTop: 5,
    minHeight: 80,
    textAlignVertical: "top",
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
    backgroundColor: "green",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelText: { color: "gray", fontWeight: "bold" },
  saveText: { color: "#fff", fontWeight: "bold" },
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
  navItem: { alignItems: "center" },
  navImage: { width: 24, height: 24, marginBottom: 2 },
  navLabel: { fontSize: 12, color: "#777" },
  navActive: {
    color: "green",
    fontWeight: "bold",
  },

  matchOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  matchCard: {
    width: "92%",
    backgroundColor: "#fff",
    borderRadius: 25,
    paddingTop: 20,
    paddingHorizontal: 18,
    paddingBottom: 20,
    alignItems: "center",

    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 10,
  },

  matchHeader: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
  },

  matchSubtext: {
    fontSize: 13,
    color: "#444",
    textAlign: "center",
    marginBottom: 14,
  },

  matchImage: {
    width: 180,
    height: 180,
    borderRadius: 20,
    marginBottom: 14,
  },

  matchName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    textAlign: "center",
  },

  matchAddress: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 18,
    paddingHorizontal: 10,
  },

  matchGreenButton: {
    width: "90%",
    height: 50,
    borderRadius: 12,
    backgroundColor: "#53D120",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },

  matchButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },

  cancelMatchText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
});
