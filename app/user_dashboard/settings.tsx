import AsyncStorage from "@react-native-async-storage/async-storage";
import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Keyboard,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../utils/supabase";

export default function Settings() {
  const router = useRouter();

  const [user, setUser] = useState({
    id: "",
    name: "",
    username: "",
    email: "",
    address: "",
    location: "",
    profileImage: "",
    profileImagePath: "",
    usernameChangedAt: "",
  });

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editProfileImage, setEditProfileImage] = useState("");
  const [editProfileImagePath, setEditProfileImagePath] = useState("");

  const [remainingDays, setRemainingDays] = useState(0);

  useEffect(() => {
    loadUser();
  }, []);

  const getPublicImageUrl = (bucket: string, path: string) => {
    if (!path || String(path).trim() === "") return "";

    const cleanPath = String(path).trim();

    if (cleanPath.startsWith("http")) {
      return cleanPath;
    }

    const fixedPath = cleanPath.replace(/^\/+/, "");
    const { data } = supabase.storage.from(bucket).getPublicUrl(fixedPath);

    return data?.publicUrl || "";
  };

  const getProfileImageUrl = (image: string) => {
    if (!image || String(image).trim() === "") return "";
    return getPublicImageUrl("profile-images", image);
  };

  const calculateRemainingDays = (lastChanged: string) => {
    if (!lastChanged) return 0;

    const lastChangedDate = new Date(lastChanged);

    if (isNaN(lastChangedDate.getTime())) {
      return 0;
    }

    const daysPassed = Math.floor(
      (Date.now() - lastChangedDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const daysLeft = 7 - daysPassed;

    return daysLeft > 0 ? daysLeft : 0;
  };

  const getImageExtension = (uri: string) => {
    const cleanUri = uri.split("?")[0];
    const extension = cleanUri.split(".").pop()?.toLowerCase();

    if (extension === "png") return "png";
    if (extension === "webp") return "webp";
    if (extension === "jpeg") return "jpeg";
    if (extension === "jpg") return "jpg";

    return "jpg";
  };

  const getContentType = (extension: string) => {
    if (extension === "png") return "image/png";
    if (extension === "webp") return "image/webp";
    if (extension === "jpeg") return "image/jpeg";
    return "image/jpeg";
  };

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem("user");

      if (!stored) return;

      const parsed = JSON.parse(stored);
      const actualUser = parsed.user || parsed.data || parsed;

      const userId =
        actualUser?.id ||
        actualUser?.user_id ||
        parsed?.id ||
        parsed?.user_id ||
        "";

      const profileImage =
        actualUser?.profileImage ||
        actualUser?.profile_image ||
        parsed?.profileImage ||
        parsed?.profile_image ||
        "";

      const usernameChangedAt =
        actualUser?.usernameChangedAt ||
        actualUser?.username_changed_at ||
        parsed?.usernameChangedAt ||
        parsed?.username_changed_at ||
        "";

      const finalAddress =
        actualUser?.address ||
        actualUser?.location ||
        parsed?.address ||
        parsed?.location ||
        "No location added";

      const finalUser = {
        id: String(userId),
        name:
          actualUser?.name ||
          actualUser?.fullname ||
          actualUser?.full_name ||
          parsed?.name ||
          "User",
        username:
          actualUser?.username ||
          parsed?.username ||
          actualUser?.name ||
          parsed?.name ||
          "username",
        email: actualUser?.email || parsed?.email || "",
        address: finalAddress,
        location:
          actualUser?.location ||
          actualUser?.address ||
          parsed?.location ||
          parsed?.address ||
          finalAddress,
        profileImage: getProfileImageUrl(String(profileImage || "")),
        profileImagePath: String(profileImage || ""),
        usernameChangedAt: String(usernameChangedAt || ""),
      };

      setUser(finalUser);
      setRemainingDays(calculateRemainingDays(String(usernameChangedAt || "")));
    } catch (error) {
      console.log("LOAD SETTINGS USER ERROR:", error);
    }
  };

  const openEditProfileModal = () => {
    setEditName(user.name || "");
    setEditUsername(user.username || "");
    setEditEmail(user.email || "");
    setEditAddress(user.address || "");
    setEditProfileImage(user.profileImage || "");
    setEditProfileImagePath(user.profileImagePath || "");
    setRemainingDays(calculateRemainingDays(user.usernameChangedAt || ""));
    setEditModalVisible(true);
  };

  const validateEditProfile = () => {
    if (!editName.trim()) {
      Alert.alert("Missing Name", "Please enter your name.");
      return false;
    }

    if (!editUsername.trim()) {
      Alert.alert("Missing Username", "Please enter your username.");
      return false;
    }

    if (editUsername.trim().length < 4) {
      Alert.alert(
        "Invalid Username",
        "Username must have at least 4 characters."
      );
      return false;
    }

    if (/\s/.test(editUsername.trim())) {
      Alert.alert("Invalid Username", "Username must not contain spaces.");
      return false;
    }

    const oldUsername = String(user.username || "").trim().toLowerCase();
    const newUsername = editUsername.trim().toLowerCase();
    const usernameChanged = oldUsername !== newUsername;

    if (usernameChanged && remainingDays > 0) {
      Alert.alert(
        "Username Cooldown",
        `You can change your username again in ${remainingDays} day(s).`
      );
      return false;
    }

    return true;
  };

  const changeProfilePhotoInModal = async () => {
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

      setUploadingPhoto(true);

      const extension = getImageExtension(imageUri);
      const contentType = getContentType(extension);
      const filePath = `users/${user.id}-${Date.now()}.${extension}`;

      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const arrayBuffer = decode(base64);

      const { error: uploadError } = await supabase.storage
        .from("profile-images")
        .upload(filePath, arrayBuffer, {
          contentType,
          upsert: false,
        });

      if (uploadError) {
        Alert.alert("Upload Failed", uploadError.message);
        return;
      }

      const imageUrl = getProfileImageUrl(filePath);

      setEditProfileImage(imageUrl);
      setEditProfileImagePath(filePath);

      Alert.alert("Photo Selected", "Profile photo is ready to save.");
    } catch (error: any) {
      console.log("PROFILE PHOTO UPLOAD ERROR:", error);
      Alert.alert(
        "Upload Failed",
        error?.message || "Failed to upload profile photo."
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  const saveProfileChanges = async () => {
    try {
      if (!validateEditProfile()) return;

      if (!user.id) {
        Alert.alert("User Error", "User ID not found. Please log in again.");
        return;
      }

      setSavingProfile(true);
      Keyboard.dismiss();

      const cleanName = editName.trim();
      const cleanUsername = editUsername.trim().toLowerCase();

      const oldUsername = String(user.username || "").trim().toLowerCase();
      const usernameChanged = oldUsername !== cleanUsername;

      const { data: existingUsername, error: usernameCheckError } =
        await supabase
          .from("profiles")
          .select("id, username")
          .eq("username", cleanUsername)
          .neq("id", user.id)
          .maybeSingle();

      if (usernameCheckError) {
        Alert.alert("Update Failed", usernameCheckError.message);
        return;
      }

      if (existingUsername) {
        Alert.alert(
          "Username Already Used",
          "Please choose another username."
        );
        return;
      }

      const updateData: any = {
        name: cleanName,
        username: cleanUsername,
      };

      if (editProfileImagePath) {
        updateData.profile_image = editProfileImagePath;
      }

      if (usernameChanged) {
        updateData.username_changed_at = new Date().toISOString();
      }

      const { data: updatedProfile, error: updateError } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user.id)
        .select()
        .single();

      if (updateError) {
        Alert.alert("Update Failed", updateError.message);
        return;
      }

      const updatedUsernameChangedAt =
        updatedProfile?.username_changed_at ||
        (usernameChanged
          ? updateData.username_changed_at
          : user.usernameChangedAt);

      const updatedUser = {
        ...user,
        name: updatedProfile?.name || cleanName,
        username: updatedProfile?.username || cleanUsername,
        email: user.email,
        address: user.address,
        location: user.location,
        profileImage: editProfileImage || user.profileImage,
        profileImagePath: updatedProfile?.profile_image || editProfileImagePath,
        usernameChangedAt: updatedUsernameChangedAt || "",
      };

      const stored = await AsyncStorage.getItem("user");

      if (stored) {
        const parsed = JSON.parse(stored);

        const updatedStoredUser: any = {
          ...parsed,
          name: updatedUser.name,
          username: updatedUser.username,
          address: updatedUser.address,
          location: updatedUser.location,
          profileImage: updatedUser.profileImage,
          profile_image: updatedUser.profileImagePath,
          usernameChangedAt: updatedUser.usernameChangedAt,
          username_changed_at: updatedUser.usernameChangedAt,
        };

        if (parsed.user) {
          updatedStoredUser.user = {
            ...parsed.user,
            name: updatedUser.name,
            username: updatedUser.username,
            address: updatedUser.address,
            location: updatedUser.location,
            profileImage: updatedUser.profileImage,
            profile_image: updatedUser.profileImagePath,
            usernameChangedAt: updatedUser.usernameChangedAt,
            username_changed_at: updatedUser.usernameChangedAt,
          };
        }

        if (parsed.data) {
          updatedStoredUser.data = {
            ...parsed.data,
            name: updatedUser.name,
            username: updatedUser.username,
            address: updatedUser.address,
            location: updatedUser.location,
            profileImage: updatedUser.profileImage,
            profile_image: updatedUser.profileImagePath,
            usernameChangedAt: updatedUser.usernameChangedAt,
            username_changed_at: updatedUser.usernameChangedAt,
          };
        }

        await AsyncStorage.setItem("user", JSON.stringify(updatedStoredUser));
      }

      setUser(updatedUser);
      setRemainingDays(calculateRemainingDays(updatedUser.usernameChangedAt));
      setEditModalVisible(false);

      Alert.alert("Success", "Your profile details were updated.");
    } catch (error: any) {
      console.log("SAVE PROFILE ERROR:", error);
      Alert.alert(
        "Update Failed",
        error?.message || "Unable to update profile."
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem("user");
    router.replace("/signin" as any);
  };

  const confirmLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: logout,
      },
    ]);
  };

  const deleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: deleteUserAccount,
        },
      ]
    );
  };

  const deleteUserAccount = async () => {
    try {
      if (!user.id) {
        Alert.alert("User Error", "User ID not found. Please log in again.");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          status: "deleted",
        })
        .eq("id", user.id);

      if (error) {
        Alert.alert("Delete Failed", error.message);
        return;
      }

      await AsyncStorage.removeItem("user");

      Alert.alert("Account Deleted", "Your account has been deleted.", [
        {
          text: "OK",
          onPress: () => router.replace("/signin" as any),
        },
      ]);
    } catch (error: any) {
      console.log("DELETE ACCOUNT ERROR:", error);
      Alert.alert(
        "Delete Failed",
        error?.message || "Unable to delete account."
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => router.replace("/user_dashboard" as any)}
          >
            <Text style={styles.back}>←</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        <View style={styles.profileHeader}>
          <Image
            source={
              user.profileImage
                ? { uri: user.profileImage }
                : require("../../assets/icons/avatar.png")
            }
            style={styles.avatar}
          />

          <View style={styles.userInfo}>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.username}>@{user.username}</Text>

            <View style={styles.locationRow}>
              <Image
                source={require("../../assets/icons/location.png")}
                style={styles.locationIcon}
              />

              <Text style={styles.address}>{user.address}</Text>
            </View>
          </View>
        </View>

        <View style={styles.profileSectionSpacing}>
          <View style={styles.menu}>
            <TouchableOpacity
              style={styles.item}
              onPress={() => router.push("/user_dashboard/user_myItems" as any)}
            >
              <Image
                source={require("../../assets/icons/box.png")}
                style={styles.icon}
              />

              <Text style={styles.text}>My Items</Text>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.item}
              onPress={() =>
                router.push("/user_dashboard/user_myListing" as any)
              }
            >
              <Image
                source={require("../../assets/icons/price-tag.png")}
                style={styles.icon}
              />

              <Text style={styles.text}>My Listings</Text>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.item}
              onPress={() =>
                router.push("/user_dashboard/recycling_history" as any)
              }
            >
              <Image
                source={require("../../assets/icons/recycle.png")}
                style={styles.icon}
              />

              <Text style={styles.text}>Recycling History</Text>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Account</Text>

        <View style={styles.menu}>
          <TouchableOpacity style={styles.item} onPress={openEditProfileModal}>
            <Image
              source={require("../../assets/icons/user.png")}
              style={styles.icon}
            />

            <Text style={styles.text}>Edit Profile</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>About</Text>

        <View style={styles.menu}>
          <View style={styles.item}>
            <Image
              source={require("../../assets/icons/smartphone.png")}
              style={styles.icon}
            />

            <Text style={styles.text}>App Version</Text>
            <Text style={styles.version}>1.0.0</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBox} onPress={confirmLogout}>
          <Image
            source={require("../../assets/icons/logout_copy.png")}
            style={styles.logoutIcon}
          />

          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteBox} onPress={deleteAccount}>
          <Image
            source={require("../../assets/icons/bin.png")}
            style={styles.deleteIcon}
          />

          <Text style={styles.deleteText}>Delete Account</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={editModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.editModalBox}>
            <Text style={styles.modalTitle}>Edit Profile</Text>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.profilePhotoSection}>
                <Image
                  source={
                    editProfileImage
                      ? { uri: editProfileImage }
                      : require("../../assets/icons/avatar.png")
                  }
                  style={styles.modalAvatar}
                />

                <TouchableOpacity
                  style={[
                    styles.changePhotoButton,
                    uploadingPhoto && styles.disabledButton,
                  ]}
                  onPress={changeProfilePhotoInModal}
                  disabled={uploadingPhoto}
                >
                  <Text style={styles.changePhotoText}>
                    {uploadingPhoto ? "Uploading..." : "Change Photo"}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter your name"
                style={styles.input}
              />

              <Text style={styles.inputLabel}>Username</Text>
              <TextInput
                value={editUsername}
                onChangeText={setEditUsername}
                placeholder="Enter username"
                style={styles.input}
                autoCapitalize="none"
              />

              {remainingDays > 0 &&
                String(user.username || "").trim().toLowerCase() !==
                  String(editUsername || "").trim().toLowerCase() && (
                  <Text style={styles.cooldownText}>
                    You can change your username again in {remainingDays} day(s).
                  </Text>
                )}

              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                value={editEmail || "No email saved"}
                editable={false}
                style={[styles.input, styles.disabledInput]}
              />

              <Text style={styles.inputLabel}>Address</Text>
              <TextInput
                value={editAddress || "No location added"}
                editable={false}
                multiline
                style={[
                  styles.input,
                  styles.disabledInput,
                  styles.addressInput,
                ]}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    Keyboard.dismiss();
                    setEditModalVisible(false);
                  }}
                  disabled={savingProfile || uploadingPhoto}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    (savingProfile || uploadingPhoto) && styles.disabledButton,
                  ]}
                  onPress={saveProfileChanges}
                  disabled={savingProfile || uploadingPhoto}
                >
                  <Text style={styles.saveText}>
                    {savingProfile ? "Saving..." : "Save Changes"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },

  scrollContent: {
    paddingBottom: 30,
  },

  topBar: {
    backgroundColor: "#1b5e20",
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
  },

  back: {
    fontSize: 22,
    color: "#fff",
    marginRight: 12,
  },

  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },

  profileHeader: {
    backgroundColor: "#1b5e20",
    paddingHorizontal: 20,
    paddingBottom: 25,
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#ddd",
  },

  userInfo: {
    marginLeft: 15,
    flex: 1,
  },

  name: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },

  username: {
    color: "#dcedc8",
    fontSize: 14,
    marginTop: 3,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },

  locationIcon: {
    width: 14,
    height: 14,
    marginRight: 5,
    tintColor: "#fff",
  },

  address: {
    color: "#fff",
    fontSize: 12,
    flex: 1,
  },

  profileSectionSpacing: {
    marginTop: 20,
  },

  sectionTitle: {
    marginTop: 22,
    marginBottom: 8,
    marginHorizontal: 20,
    color: "#777",
    fontWeight: "600",
    fontSize: 14,
  },

  menu: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    borderRadius: 14,
    overflow: "hidden",
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  icon: {
    width: 22,
    height: 22,
    marginRight: 15,
  },

  text: {
    flex: 1,
    fontSize: 15,
    color: "#222",
  },

  arrow: {
    fontSize: 24,
    color: "#999",
  },

  version: {
    color: "#777",
    fontSize: 14,
  },

  logoutBox: {
    marginTop: 25,
    marginHorizontal: 15,
    backgroundColor: "#1b7f00",
    paddingVertical: 16,
    paddingHorizontal: 15,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#d8f7d0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  logoutIcon: {
    width: 22,
    height: 22,
    marginRight: 10,
    tintColor: "#fff",
  },

  logoutText: {
    fontSize: 15,
    color: "#fff",
    fontWeight: "600",
  },

  deleteBox: {
    marginTop: 12,
    marginHorizontal: 15,
    backgroundColor: "#fff",
    paddingVertical: 16,
    paddingHorizontal: 15,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#b90e18",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  deleteIcon: {
    width: 22,
    height: 22,
    marginRight: 10,
    tintColor: "#c62828",
  },

  deleteText: {
    fontSize: 15,
    color: "#ff303d",
    fontWeight: "600",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 20,
  },

  editModalBox: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    maxHeight: "88%",
  },

  modalTitle: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#1b5e20",
    marginBottom: 12,
    textAlign: "center",
  },

  profilePhotoSection: {
    alignItems: "center",
    marginBottom: 15,
  },

  modalAvatar: {
    width: 95,
    height: 95,
    borderRadius: 48,
    backgroundColor: "#ddd",
    borderWidth: 3,
    borderColor: "#1b5e20",
  },

  changePhotoButton: {
    marginTop: 10,
    backgroundColor: "#1b5e20",
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 20,
  },

  changePhotoText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    marginTop: 10,
    marginBottom: 5,
  },

  input: {
    backgroundColor: "#f1f1f1",
    padding: 12,
    borderRadius: 10,
    fontSize: 14,
    color: "#222",
  },

  disabledInput: {
    color: "#777",
    backgroundColor: "#e8e8e8",
  },

  addressInput: {
    minHeight: 75,
    textAlignVertical: "top",
  },

  cooldownText: {
    marginTop: 6,
    color: "#c62828",
    fontSize: 12,
    fontWeight: "600",
  },

  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 18,
    gap: 10,
  },

  cancelButton: {
    backgroundColor: "#ccc",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },

  cancelText: {
    color: "#333",
    fontWeight: "600",
  },

  saveButton: {
    backgroundColor: "#1b5e20",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },

  disabledButton: {
    backgroundColor: "#8aa887",
  },

  saveText: {
    color: "#fff",
    fontWeight: "600",
  },
});