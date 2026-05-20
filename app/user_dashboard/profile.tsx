import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
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
import { API_URL } from "../../config";

export default function Profile() {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState({
    id: "",
    name: "",
    username: "",
    address: "",
    profileImage: "",
  });

  const [items, setItems] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const [usernameModal, setUsernameModal] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [remainingDays, setRemainingDays] = useState(0);

  const [editVisible, setEditVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editedDescription, setEditedDescription] = useState("");

  const getProfileImageUrl = (image: string) => {
    if (!image) return "";
    if (image.startsWith("http")) return image;

    const cleanImage = image
      .replace("uploads/profile/user_profile/", "")
      .replace("uploads/profile/", "")
      .replace(/^\/+/, "");

    return `${API_URL}/uploads/profile/user_profile/${cleanImage}`;
  };

  const getPostStatus = (item: any) => {
    return item.match_status || item.matchStatus || item.status || "Listed";
  };

  const getItemTimeValue = (item: any) => {
    const dateValue =
      item.listed_at ||
      item.date_listed ||
      item.created_at ||
      item.updated_at ||
      item.submitted_at ||
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

  useEffect(() => {
    loadUser();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, []),
  );

  useEffect(() => {
    if (user.id || user.name || user.username) {
      fetchListings();
    }
  }, [user.id, user.name, user.username]);

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem("user");
      if (!stored) return;

      const parsed = JSON.parse(stored);

      const userId =
        parsed?.id ||
        parsed?.user_id ||
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

      const finalProfileImage = getProfileImageUrl(profileImage);

      const lastChanged =
        parsed?.usernameChangedAt ||
        parsed?.username_changed_at ||
        parsed?.user?.username_changed_at ||
        parsed?.data?.username_changed_at ||
        "";

      if (lastChanged) {
        const daysPassed = Math.floor(
          (Date.now() - new Date(lastChanged).getTime()) /
            (1000 * 60 * 60 * 24),
        );

        const daysLeft = 7 - daysPassed;
        setRemainingDays(daysLeft > 0 ? daysLeft : 0);
      }

      setUser({
        id: String(userId),
        name:
          parsed?.name || parsed?.user?.name || parsed?.data?.name || "User",
        username:
          parsed?.username ||
          parsed?.user?.username ||
          parsed?.data?.username ||
          "username",
        address:
          parsed?.address ||
          parsed?.location ||
          parsed?.user?.address ||
          parsed?.data?.address ||
          "No location added",
        profileImage: finalProfileImage,
      });
    } catch (error) {
      console.log("LOAD USER ERROR:", error);
    }
  };

  const fetchListings = async () => {
    try {
      const encodedUserId = encodeURIComponent(String(user.id || ""));
      const encodedName = encodeURIComponent(
        String(user.name || user.username || ""),
      );

      const response = await fetch(
        `${API_URL}/get_my_listings.php?user_id=${encodedUserId}&submitter_name=${encodedName}`,
      );

      const text = await response.text();
      console.log("PROFILE POSTS RESPONSE:", text);

      const result = JSON.parse(text);

      if (result.success && Array.isArray(result.items)) {
        const listedPostsOnly = result.items.filter((item: any) => {
          const status = getPostStatus(item);

          return (
            status === "Listed" ||
            status === "Pending Match" ||
            status === "Matched"
          );
        });

        setItems(sortByLatest(listedPostsOnly));
      } else {
        setItems([]);
      }
    } catch (error) {
      console.log("FETCH PROFILE POSTS ERROR:", error);
      setItems([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUser();
    await fetchListings();
    setRefreshing(false);
  };

  const changeProfilePhoto = async () => {
    try {
      if (!user.id) {
        Alert.alert("User Error", "User ID not found. Please log in again.");
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
      const imageName = imageUri.split("/").pop() || "profile.jpg";

      const formData = new FormData();
      formData.append("user_id", String(user.id));

      formData.append("profile_image", {
        uri: Platform.OS === "ios" ? imageUri.replace("file://", "") : imageUri,
        name: imageName,
        type: "image/jpeg",
      } as any);

      const response = await fetch(`${API_URL}/update_profile.php`, {
        method: "POST",
        body: formData,
      });

      const text = await response.text();
      console.log("PROFILE IMAGE RESPONSE:", text);

      const data = JSON.parse(text);

      if (!data.success) {
        Alert.alert("Upload Failed", data.message || "Failed to upload image.");
        return;
      }

      const uploadedImageUrl = getProfileImageUrl(data.profile_image);

      const stored = await AsyncStorage.getItem("user");

      if (stored) {
        const parsed = JSON.parse(stored);

        const updatedUser = {
          ...parsed,
          profileImage: uploadedImageUrl,
          profile_image: data.profile_image,
        };

        await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
      }

      setUser((prev) => ({
        ...prev,
        profileImage: uploadedImageUrl,
      }));

      Alert.alert("Success", "Profile photo updated.");
    } catch (error) {
      console.log("PROFILE IMAGE ERROR:", error);
      Alert.alert("Error", "Failed to upload profile image.");
    }
  };

  const updateUsername = async () => {
    if (!newUsername.trim()) {
      Alert.alert("Username Required", "Please enter a username.");
      return;
    }

    if (remainingDays > 0) { 
      Alert.alert(
        "Username Cooldown",
        `You can change your username again in ${remainingDays} day(s).`,
      );
      return;
    }

    if (!user.id) {
      Alert.alert("User Error", "User ID not found. Please log in again.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("user_id", String(user.id));
      formData.append("username", newUsername.trim());

      const response = await fetch(`${API_URL}/update_profile.php`, {
        method: "POST",
        body: formData,
      });

      const text = await response.text();
      console.log("USERNAME RESPONSE:", text);

      const data = JSON.parse(text);

      if (!data.success) {
        Alert.alert(
          "Update Failed",
          data.message || "Failed to update username.",
        );
        return;
      }

      const stored = await AsyncStorage.getItem("user");

      if (stored) {
        const parsed = JSON.parse(stored);

        const updatedUser = {
          ...parsed,
          username: newUsername.trim(),
          usernameChangedAt: new Date().toISOString(),
          username_changed_at: new Date().toISOString(),
        };

        await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
      }

      setUser((prev) => ({
        ...prev,
        username: newUsername.trim(),
      }));

      setRemainingDays(7);
      setUsernameModal(false);
      setNewUsername("");

      Alert.alert("Success", "Username updated.");
    } catch (error) {
      console.log("USERNAME UPDATE ERROR:", error);
      Alert.alert("Error", "Failed to update username.");
    }
  };

  const getImageUrl = (item: any) => {
    if (!item.item_image) return "https://via.placeholder.com/300";

    return `${API_URL}/uploads/items/approved/${item.item_image}`;
  };

  const formatListedDate = (item: any) => {
    const dateValue =
      item.listed_at ||
      item.created_at ||
      item.date_listed ||
      item.updated_at ||
      "";

    if (!dateValue) return "No date available";

    const date = new Date(dateValue);

    if (isNaN(date.getTime())) {
      return String(dateValue);
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

  const cleanIssues = (issues: string) => {
    if (!issues) return "None";

    return issues
      .replace(/\s*\([^)]*\)/g, "")
      .replace(/\s*recyclability/gi, "")
      .replace(/\s*hazard/gi, "")
      .trim();
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
    formData.append(
      "id",
      String(editingItem.approved_item_id || editingItem.id),
    );
    formData.append("folder", "approved");
    formData.append("description", editedDescription);

    try {
      const response = await fetch(`${API_URL}/update_item_description.php`, {
        method: "POST",
        body: formData,
      });

      const text = await response.text();
      console.log("UPDATE PROFILE POST RESPONSE:", text);

      const result = JSON.parse(text);

      Alert.alert("Update Post", result.message);

      if (result.success) {
        setEditVisible(false);
        fetchListings();
      }
    } catch (error) {
      console.log("UPDATE PROFILE POST ERROR:", error);
      Alert.alert("Error", "Failed to update post.");
    }
  };

  const confirmDeletePost = (item: any) => {
    Alert.alert("Delete Post", "Are you sure you want to delete this item?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deletePost(item),
      },
    ]);
  };

  const deletePost = async (item: any) => {
    try {
      const formData = new FormData();
      formData.append("id", String(item.id));
      formData.append("folder", "listed");
      formData.append("user_id", String(user.id));
      formData.append("approved_item_id", String(item.approved_item_id || ""));

      const response = await fetch(`${API_URL}/delete_item.php`, {
        method: "POST",
        body: formData,
      });

      const text = await response.text();
      console.log("DELETE PROFILE POST RESPONSE:", text);

      const result = JSON.parse(text);

      Alert.alert("Delete Post", result.message || "Post deleted.");

      if (result.success) {
        setItems((prev) => prev.filter((post) => post.id !== item.id));
        fetchListings();
      }
    } catch (error) {
      console.log("DELETE PROFILE POST ERROR:", error);
      Alert.alert("Error", "Failed to delete post.");
    }
  };

  const renderPost = ({ item }: any) => {
    return (
      <View style={styles.postCard}>
        <Image source={{ uri: getImageUrl(item) }} style={styles.postImage} />

        <Text style={styles.postedBy}>
          Posted By: {item.submitter_name || item.submitterName || user.name}
        </Text>

        <Text style={styles.postTitle}>{item.item_name || "Unnamed Item"}</Text>

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
              {item.location || item.address || user.address}
            </Text>
          </View>

          <Text style={styles.dateText}>{formatListedDate(item)}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.postButtonRow}>
          <TouchableOpacity
            style={styles.editPostButton}
            onPress={() => openUpdateModal(item)}
          >
            <Text style={styles.editPostText}>Edit Post</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deletePostButton}
            onPress={() => confirmDeletePost(item)}
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
        data={items}
        keyExtractor={(item) => `profile-listed-${item.id}`}
        renderItem={renderPost}
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
                  user.profileImage
                    ? { uri: user.profileImage }
                    : require("../../assets/icons/avatar.png")
                }
                style={styles.avatar}
              />
            </TouchableOpacity>

            <Text style={styles.tapHint}>Tap photo to change</Text>

            <Text style={styles.name}>{user.name || "User"}</Text>

            <TouchableOpacity
              style={styles.usernameEditBox}
              onPress={() => {
                setNewUsername(user.username);
                setUsernameModal(true);
              }}
            >
              <Text style={styles.username}>
                @{user.username || "username"}
              </Text>
              <Text style={styles.usernameEditText}>Tap to edit username</Text>
            </TouchableOpacity>

            <View style={styles.headerLocationRow}>
              <Image
                source={require("../../assets/icons/location.png")}
                style={styles.headerLocationIcon}
              />
              <Text style={styles.headerAddress}>{user.address}</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No listed posts yet.</Text>
        }
      />

      <Modal visible={usernameModal} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.usernameModalBox}>
            <Text style={styles.modalTitle}>Change Username</Text>

            <TextInput
              placeholder="Enter new username"
              value={newUsername}
              onChangeText={setNewUsername}
              style={styles.input}
              autoCapitalize="none"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setUsernameModal(false);
                  setNewUsername("");
                }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={updateUsername}
              >
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={editVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.keyboardView}
          >
            <View style={styles.editModalBox}>
              <ScrollView
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.editModalContent}
              >
                <Text style={styles.modalTitle}>Edit Post</Text>

                {editingItem && (
                  <>
                    <Text style={styles.modalLabel}>Posted By</Text>
                    <Text style={styles.readOnlyText}>
                      {editingItem.submitter_name ||
                        editingItem.submitterName ||
                        user.name}
                    </Text>

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
                      {getPostStatus(editingItem)}
                    </Text>

                    <Text style={styles.modalLabel}>Description</Text>
                    <TextInput
                      value={editedDescription}
                      onChangeText={setEditedDescription}
                      style={styles.descriptionInput}
                      multiline
                      textAlignVertical="top"
                    />

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
                  </>
                )}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
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
          <Text style={styles.navLabel}>Messages</Text>
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
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  listContent: {
    paddingBottom: 100,
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
  },

  usernameEditBox: {
    alignItems: "center",
    marginTop: 2,
    marginBottom: 10,
  },

  username: {
    color: "#fff",
    fontSize: 18,
  },

  usernameEditText: {
    color: "#d7ffd9",
    fontSize: 12,
    marginTop: 2,
  },

  headerLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
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

  postImage: {
    width: "100%",
    height: 185,
    resizeMode: "cover",
    backgroundColor: "#eee",
  },

  postedBy: {
    fontSize: 12,
    color: "#555",
    marginTop: 8,
    fontWeight: "600",
  },

  postTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 5,
    color: "#000",
  },

  description: {
    color: "#000",
    fontSize: 12,
    marginTop: 6,
    lineHeight: 16,
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

  postButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },

  editPostButton: {
    flex: 1,
    backgroundColor: "#2d7c1f",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  editPostText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  deletePostButton: {
    flex: 1,
    backgroundColor: "#fff",
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#e53935",
    alignItems: "center",
    justifyContent: "center",
  },

  deletePostText: {
    color: "#e53935",
    fontSize: 16,
    fontWeight: "bold",
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

  usernameModalBox: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
  },

  editModalBox: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    maxHeight: "85%",
  },

  editModalContent: {
    paddingBottom: 10,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#000",
  },

  modalLabel: {
    fontWeight: "bold",
    marginTop: 10,
    color: "#000",
  },

  readOnlyText: {
    backgroundColor: "#eee",
    padding: 10,
    borderRadius: 8,
    marginTop: 5,
    fontSize: 14,
    color: "#000",
  },

  listedText: {
    color: "#1b5e20",
    fontWeight: "bold",
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
  },

  descriptionInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    marginTop: 5,
    minHeight: 80,
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
