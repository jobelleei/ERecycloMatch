import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useMemo, useState } from "react";
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

const ITEM_OPTIONS = [
  "Laptop",
  "Smartphone",
  "Printer",
  "Camera",
  "Battery",
  "Speaker",
  "Microwave",
  "Oven",
  "Toaster",
  "Refrigerator",
  "Air Conditioner",
  "Boiler",
  "Calculator",
  "Bar Phone",
  "Blood Pressure Monitor",
  "Ceiling Fan",
  "Christmas Lights",
  "Clothes Iron",
  "Coffee Machine",
  "Compact Fluorescent Lamps",
  "Computer Keyboard",
  "Computer Mouse",
  "Drone",
  "DVD Player",
  "Earphones",
  "Flash Drive / USB",
  "Game Console",
  "Hair Dryer",
  "Hard Drive",
  "Headphones",
  "Keyboard",
  "Laptop Charger",
  "Monitor",
  "Motherboard",
  "Mouse",
  "Phone Charger",
  "Power Bank",
  "Projector",
  "Radio",
  "Remote Control",
  "Router",
  "Scanner",
  "Smartwatch",
  "Tablet",
  "Television",
  "Vacuum Cleaner",
  "Washing Machine",
  "Webcam",
  "WiFi Router",
  "CPU",
  "Circuit Board",
  "Modem",
  "PCB",
  "Fan",
  "Electric Kettle",
  "Rice Cooker",
  "Blender",
  "CCTV Camera",
  "Cable",
  "Extension Cord",
  "GPU",
  "RAM",
  "SSD",
  "HDD",
  "UPS",
  "Electric Drill",
  "Electric Shaver",
  "Torchlight",
  "Alarm Clock",
  "MP3 Player",
  "Landline Telephone",
  "Video Camera",
  "Walkie Talkie",
  "Electric Toothbrush",
  "Stylus Pen",
  "Digital Clock",
  "Unknown",
];

export default function FacilityProfile() {
  const router = useRouter();
  const pathname = usePathname();

  const [facility, setFacility] = useState({
    id: "",
    name: "",
    location: "",
    profileImage: "",
  });

  const [postings, setPostings] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const [postModalVisible, setPostModalVisible] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);

  const [itemName, setItemName] = useState("");
  const [description, setDescription] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredItems = useMemo(() => {
    if (!showDropdown || !itemName.trim()) return [];

    return ITEM_OPTIONS.filter((item) =>
      item.toLowerCase().includes(itemName.toLowerCase()),
    ).slice(0, 20);
  }, [itemName, showDropdown]);

  useEffect(() => {
    loadFacility();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFacility();
    }, []),
  );

  useEffect(() => {
    if (facility.id) {
      fetchPostings();
    }
  }, [facility.id]);

  const loadFacility = async () => {
    try {
      const stored = await AsyncStorage.getItem("user");
      if (!stored) return;

      const parsed = JSON.parse(stored);

      const facilityId =
        parsed?.id ||
        parsed?.facility_id ||
        parsed?.user?.id ||
        parsed?.data?.id ||
        "";

      const profileImage =
        parsed?.profileImage ||
        parsed?.profile_image ||
        parsed?.user?.profileImage ||
        parsed?.user?.profile_image ||
        parsed?.data?.profileImage ||
        parsed?.data?.profile_image ||
        "";

      const finalProfileImage =
        profileImage && profileImage.startsWith("http")
          ? profileImage
          : profileImage
            ? profileImage.includes("facility_profile")
              ? `${API_URL}/${profileImage}`
              : `${API_URL}/uploads/profile/facility_profile/${profileImage}`
            : "";

      setFacility({
        id: String(facilityId),
        name:
          parsed?.name ||
          parsed?.user?.name ||
          parsed?.data?.name ||
          "Facility",
        location:
          parsed?.location ||
          parsed?.address ||
          parsed?.user?.location ||
          parsed?.user?.address ||
          parsed?.data?.location ||
          parsed?.data?.address ||
          "No location added",
        profileImage: finalProfileImage,
      });
    } catch (error) {
      console.log("LOAD FACILITY ERROR:", error);
    }
  };

  const fetchPostings = async () => {
    try {
      const response = await fetch(
        `${API_URL}/get_facility_postings.php?facility_id=${encodeURIComponent(
          facility.id,
        )}`,
      );

      const text = await response.text();
      console.log("FACILITY POSTINGS RESPONSE:", text);

      const result = JSON.parse(text);

      if (result.success && Array.isArray(result.postings)) {
        setPostings(result.postings);
      } else {
        setPostings([]);
      }
    } catch (error) {
      console.log("FETCH FACILITY POSTINGS ERROR:", error);
      setPostings([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFacility();
    await fetchPostings();
    setRefreshing(false);
  };

  const changeProfilePhoto = async () => {
    try {
      if (!facility.id) {
        Alert.alert(
          "Facility Error",
          "Facility ID not found. Please log in again.",
        );
        return;
      }

      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Permission Denied", "Please allow access to your photos.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) return;

      const imageUri = result.assets[0].uri;
      const imageName = imageUri.split("/").pop() || "facility_profile.jpg";

      const formData = new FormData();
      formData.append("facility_id", String(facility.id));

      formData.append("profile_image", {
        uri: Platform.OS === "ios" ? imageUri.replace("file://", "") : imageUri,
        name: imageName,
        type: "image/jpeg",
      } as any);

      const response = await fetch(`${API_URL}/update_facility_profile.php`, {
        method: "POST",
        body: formData,
      });

      const text = await response.text();
      console.log("FACILITY PROFILE IMAGE RESPONSE:", text);

      const data = JSON.parse(text);

      if (!data.success) {
        Alert.alert("Upload Failed", data.message || "Failed to upload image.");
        return;
      }

      const uploadedImageUrl = `${API_URL}/uploads/profile/facility_profile/${data.profile_image}`;

      const stored = await AsyncStorage.getItem("user");

      if (stored) {
        const parsed = JSON.parse(stored);

        const updatedFacility = {
          ...parsed,
          profileImage: uploadedImageUrl,
          profile_image: data.profile_image,
        };

        await AsyncStorage.setItem("user", JSON.stringify(updatedFacility));
      }

      setFacility((prev) => ({
        ...prev,
        profileImage: uploadedImageUrl,
      }));

      Alert.alert("Success", "Facility profile photo updated.");
    } catch (error) {
      console.log("FACILITY IMAGE ERROR:", error);
      Alert.alert("Error", "Failed to update facility profile photo.");
    }
  };

  const openCreateModal = () => {
    setEditingPost(null);
    setItemName("");
    setDescription("");
    setShowDropdown(false);
    setPostModalVisible(true);
  };

  const openEditModal = (post: any) => {
    setEditingPost(post);
    setItemName(post.item_needed || "");
    setDescription(post.description || "");
    setShowDropdown(false);
    setPostModalVisible(true);
  };

  const savePosting = async () => {
    if (!facility.id) {
      Alert.alert("Facility Error", "Facility ID not found.");
      return;
    }

    if (!itemName.trim()) {
      Alert.alert("Item Required", "Please enter or select an item.");
      return;
    }

    if (!description.trim()) {
      Alert.alert("Description Required", "Please add details.");
      return;
    }

    Keyboard.dismiss();

    const formData = new FormData();
    formData.append("facility_id", facility.id);
    formData.append("submitter_name", facility.name);
    formData.append("facility_location", facility.location);
    formData.append("item_needed", itemName.trim());
    formData.append("description", description.trim());

    if (editingPost) {
      formData.append("id", String(editingPost.id));
    }

    const url = editingPost
      ? `${API_URL}/update_facility_posting.php`
      : `${API_URL}/create_facility_posting.php`;

    try {
      const response = await fetch(url, {
        method: "POST",
        body: formData,
      });

      const text = await response.text();
      console.log("SAVE FACILITY POSTING RESPONSE:", text);

      const result = JSON.parse(text);

      if (!result.success) {
        Alert.alert("Failed", result.message || "Failed to save post.");
        return;
      }

      setPostModalVisible(false);
      setEditingPost(null);
      setItemName("");
      setDescription("");
      setShowDropdown(false);

      await fetchPostings();

      Alert.alert("Success", editingPost ? "Post updated." : "Post created.");
    } catch (error) {
      console.log("SAVE POST ERROR:", error);
      Alert.alert("Error", "Failed to save post.");
    }
  };

  const deletePosting = (post: any) => {
    Alert.alert("Delete Post", "Are you sure you want to delete this post?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const formData = new FormData();
            formData.append("id", String(post.id));
            formData.append("facility_id", facility.id);

            const response = await fetch(
              `${API_URL}/delete_facility_posting.php`,
              {
                method: "POST",
                body: formData,
              },
            );

            const text = await response.text();
            console.log("DELETE POST RESPONSE:", text);

            const result = JSON.parse(text);

            if (result.success) {
              await fetchPostings();
              Alert.alert("Deleted", "Post deleted successfully.");
            } else {
              Alert.alert("Failed", result.message || "Failed to delete post.");
            }
          } catch (error) {
            console.log("DELETE POST ERROR:", error);
            Alert.alert("Error", "Failed to delete post.");
          }
        },
      },
    ]);
  };

  const formatDate = (value: string) => {
    if (!value) return "No date available";

    const date = new Date(value);

    if (isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const closeModal = () => {
    setPostModalVisible(false);
    setEditingPost(null);
    setItemName("");
    setDescription("");
    setShowDropdown(false);
  };

  const renderPosting = ({ item }: any) => {
    return (
      <View style={styles.postCard}>
        <Text style={styles.postLabel}>Facility Name</Text>
        <Text style={styles.postTitle}>
          {item.submitter_name || facility.name}
        </Text>

        <Text style={styles.postLabel}>Item Needed</Text>
        <Text style={styles.itemNeeded}>
          {item.item_needed || "No item added"}
        </Text>

        <Text style={styles.postLabel}>Description</Text>
        <Text style={styles.description}>
          {item.description || "No description added."}
        </Text>

        <View style={styles.postMetaRow}>
          <View style={styles.locationRow}>
            <Image
              source={require("../../assets/icons/location.png")}
              style={styles.metaIcon}
            />
            <Text style={styles.metaText}>
              {item.facility_location || facility.location}
            </Text>
          </View>

          <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.postActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => openEditModal(item)}
          >
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deletePosting(item)}
          >
            <Text style={styles.deletePostText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={postings}
        keyExtractor={(item) => `facility-posting-${item.id}`}
        renderItem={renderPosting}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View style={styles.profileHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backText}>←</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.avatarWrapper}
              onPress={changeProfilePhoto}
            >
              <Image
                source={
                  facility.profileImage
                    ? { uri: facility.profileImage }
                    : require("../../assets/icons/avatar.png")
                }
                style={styles.avatar}
              />
            </TouchableOpacity>

            <Text style={styles.tapHint}>Tap photo to change</Text>

            <Text style={styles.name}>{facility.name || "Facility"}</Text>

            <View style={styles.headerLocationRow}>
              <Image
                source={require("../../assets/icons/location.png")}
                style={styles.headerLocationIcon}
              />
              <Text style={styles.headerAddress}>{facility.location}</Text>
            </View>

            <TouchableOpacity
              style={styles.addPostButton}
              onPress={openCreateModal}
            >
              <Text style={styles.addPostText}>＋ Create Item Request</Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No item postings yet.</Text>
        }
      />

      <TouchableOpacity style={styles.floatingButton} onPress={openCreateModal}>
        <Text style={styles.floatingPlus}>＋</Text>
      </TouchableOpacity>

      <Modal visible={postModalVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.keyboardView}
          >
            <View style={styles.modalBox}>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.modalTitle}>
                  {editingPost ? "Edit Item Request" : "Create Item Request"}
                </Text>

                <Text style={styles.helperText}>
                  Add details about what your facility is looking for so users
                  can match their listed items with your request.
                </Text>

                <Text style={styles.modalLabel}>Item Needed</Text>

                <TextInput
                  placeholder="Type or select item"
                  value={itemName}
                  onFocus={() => setShowDropdown(true)}
                  onChangeText={(text) => {
                    setItemName(text);
                    setShowDropdown(true);
                  }}
                  style={styles.input}
                />

                {filteredItems.length > 0 && (
                  <View style={styles.dropdownBox}>
                    <ScrollView
                      nestedScrollEnabled={true}
                      keyboardShouldPersistTaps="handled"
                      showsVerticalScrollIndicator={true}
                    >
                      {filteredItems.map((option) => (
                        <TouchableOpacity
                          key={option}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setItemName(option);
                            setShowDropdown(false);
                            Keyboard.dismiss();
                          }}
                        >
                          <Text style={styles.dropdownText}>{option}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                <Text style={styles.modalLabel}>Description</Text>

                <TextInput
                  placeholder="Example: Looking for working or slightly damaged smartphones for recycling or parts recovery."
                  value={description}
                  onChangeText={setDescription}
                  style={styles.descriptionInput}
                  multiline
                  textAlignVertical="top"
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={closeModal}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={savePosting}
                  >
                    <Text style={styles.saveText}>
                      {editingPost ? "Update" : "Post"}
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
          onPress={() => router.push("/facility_dashboard/facility_map" as any)}
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
  },

  listContent: {
    paddingBottom: 110,
  },

  profileHeader: {
    backgroundColor: "#197900",
    alignItems: "center",
    paddingTop: 15,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },

  backButton: {
    position: "absolute",
    left: 20,
    top: 20,
    zIndex: 5,
  },

  backText: {
    fontSize: 32,
    color: "#000",
  },

  avatarWrapper: {
    marginTop: 5,
  },

  avatar: {
    width: 135,
    height: 135,
    borderRadius: 70,
    backgroundColor: "#ddd",
  },

  tapHint: {
    color: "#e8f5e9",
    fontSize: 12,
    marginTop: 6,
  },

  name: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 8,
    textAlign: "center",
  },

  headerLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    paddingHorizontal: 20,
  },

  headerLocationIcon: {
    width: 15,
    height: 15,
    marginRight: 5,
    tintColor: "#fff",
  },

  headerAddress: {
    color: "#e8f5e9",
    fontSize: 13,
    textAlign: "center",
  },

  addPostButton: {
    backgroundColor: "#fff",
    marginTop: 15,
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 25,
  },

  addPostText: {
    color: "#197900",
    fontWeight: "bold",
    fontSize: 15,
  },

  postCard: {
    backgroundColor: "#fff",
    marginHorizontal: 26,
    marginTop: 15,
    padding: 14,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },

  postLabel: {
    fontSize: 12,
    color: "#777",
    marginTop: 5,
  },

  postTitle: {
    fontSize: 21,
    fontWeight: "bold",
    marginTop: 4,
    color: "#000",
  },

  itemNeeded: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#197900",
    marginTop: 4,
    marginBottom: 8,
  },

  description: {
    color: "#000",
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18,
  },

  postMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 13,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  metaIcon: {
    width: 14,
    height: 14,
    marginRight: 5,
  },

  metaText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#222",
  },

  dateText: {
    fontSize: 11,
    color: "#777",
    marginLeft: 10,
    maxWidth: 150,
    textAlign: "right",
  },

  divider: {
    height: 1,
    backgroundColor: "#888",
    marginTop: 12,
    marginBottom: 12,
  },

  postActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },

  editButton: {
    flex: 1,
    backgroundColor: "#197900",
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: "center",
  },

  deleteButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "red",
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: "center",
  },

  editText: {
    color: "#fff",
    fontWeight: "bold",
  },

  deletePostText: {
    color: "red",
    fontWeight: "bold",
  },

  emptyText: {
    textAlign: "center",
    color: "gray",
    marginTop: 35,
    fontSize: 15,
  },

  floatingButton: {
    position: "absolute",
    right: 20,
    bottom: 90,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#197900",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    zIndex: 20,
  },

  floatingPlus: {
    color: "#fff",
    fontSize: 32,
    marginTop: -2,
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
    maxWidth: 430,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    maxHeight: "85%",
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#000",
  },

  helperText: {
    color: "#555",
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
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
    marginTop: 6,
    fontSize: 14,
  },

  dropdownBox: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginTop: 5,
    height: 160,
    backgroundColor: "#fff",
    overflow: "hidden",
  },

  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  dropdownText: {
    fontSize: 14,
    color: "#000",
  },

  descriptionInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    marginTop: 6,
    minHeight: 100,
    fontSize: 14,
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
    backgroundColor: "#197900",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },

  cancelText: {
    color: "gray",
    fontWeight: "bold",
    fontSize: 16,
  },

  saveText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
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
