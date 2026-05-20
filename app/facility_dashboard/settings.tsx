import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "../../config";

export default function FacilitySettings() {
  const router = useRouter();

  const [facility, setFacility] = useState({
    name: "",
    location: "",
    profileImage: "",
  });

  useEffect(() => {
    loadFacility();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFacility();
    }, [])
  );

  const addCacheBuster = (url: string) => {
    if (!url) return "";

    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}t=${Date.now()}`;
  };

  const loadFacility = async () => {
    try {
      const stored = await AsyncStorage.getItem("user");

      if (!stored) return;

      const parsed = JSON.parse(stored);

      const profileImage =
        parsed?.profileImage ||
        parsed?.profile_image ||
        parsed?.user?.profileImage ||
        parsed?.user?.profile_image ||
        parsed?.data?.profileImage ||
        parsed?.data?.profile_image ||
        "";

      const rawProfileImage =
        profileImage && profileImage.startsWith("http")
          ? profileImage
          : profileImage
          ? profileImage.includes("facility_profile")
            ? `${API_URL}/${profileImage}`
            : `${API_URL}/uploads/profile/facility_profile/${profileImage}`
          : "";

      const finalProfileImage = addCacheBuster(rawProfileImage);

      setFacility({
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
      "Are you sure you want to delete your facility account? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Notice",
              "Delete account function is not connected yet."
            );
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.back}>←</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        <View style={styles.profileHeader}>
          <Image
            source={
              facility.profileImage
                ? { uri: facility.profileImage }
                : require("../../assets/icons/avatar.png")
            }
            style={styles.avatar}
          />

          <View style={styles.userInfo}>
            <Text style={styles.name}>{facility.name}</Text>

            <View style={styles.locationRow}>
              <Image
                source={require("../../assets/icons/location.png")}
                style={styles.locationIcon}
              />
              <Text style={styles.address}>{facility.location}</Text>
            </View>
          </View>
        </View>

        <View style={styles.profileSectionSpacing}>
          <View style={styles.menu}>
            <TouchableOpacity
              style={styles.item}
              onPress={() => router.push("/facility_dashboard/my_postings" as any)}
            >
              <Image
                source={require("../../assets/icons/price-tag.png")}
                style={styles.icon}
              />
              <Text style={styles.text}>My Postings</Text>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.item}
              onPress={() =>
                router.push("/facility_dashboard/recycling_history" as any)
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
          <TouchableOpacity
            style={styles.item}
            onPress={() => router.push("/facility_dashboard/profile" as any)}
          >
            <Image
              source={require("../../assets/icons/user_2.png")}
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
    fontSize: 20,
    fontWeight: "bold",
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  locationIcon: {
    width: 14,
    height: 14,
    marginRight: 5,
    tintColor: "#fff",
  },

  address: {
    color: "#fff",
    fontSize: 13,
    flex: 1,
  },

  profileSectionSpacing: {
    marginTop: 15,
  },

  sectionTitle: {
    marginTop: 22,
    marginLeft: 20,
    marginBottom: 8,
    fontSize: 16,
    fontWeight: "600",
  },

  menu: {
    marginHorizontal: 15,
    backgroundColor: "#fff",
    borderRadius: 10,
    overflow: "hidden",
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },

  icon: {
    width: 20,
    height: 20,
    marginRight: 12,
  },

  text: {
    flex: 1,
    fontSize: 16,
  },

  arrow: {
    fontSize: 20,
    color: "#777",
  },

  version: {
    color: "#777",
    fontSize: 14,
  },

  logoutBox: {
    marginTop: 30,
    marginHorizontal: 20,
    backgroundColor: "#1b5e20",
    padding: 15,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  logoutIcon: {
    width: 18,
    height: 18,
    marginRight: 8,
    tintColor: "#fff",
  },

  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  deleteBox: {
    marginTop: 15,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: "red",
    padding: 15,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  deleteIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
    tintColor: "red",
  },

  deleteText: {
    color: "red",
    fontSize: 16,
    fontWeight: "600",
  },
});