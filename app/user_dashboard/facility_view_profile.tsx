import { useLocalSearchParams, usePathname, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "../../config";

export default function FacilityViewProfile() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useLocalSearchParams();

  const facilityId = String(params.facility_id || "");

  const [facility, setFacility] = useState({
    id: "",
    name: "",
    location: "",
    profileImage: "",
    email: "",
    contactNum: "",
  });

  const [postings, setPostings] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (facilityId) {
      fetchFacilityProfile();
    }
  }, [facilityId]);

  const getFacilityProfileUrl = (profileImage: string) => {
    if (!profileImage) {
      return "";
    }

    if (profileImage.startsWith("http")) {
      return profileImage;
    }

    if (profileImage.includes("uploads/")) {
      return `${API_URL}/${profileImage}`;
    }

    return `${API_URL}/uploads/profile/facility_profile/${profileImage}`;
  };

  const fetchFacilityProfile = async () => {
    try {
      const response = await fetch(
        `${API_URL}/get_public_facility_profile.php?facility_id=${encodeURIComponent(
          facilityId
        )}`
      );

      const text = await response.text();
      console.log("PUBLIC FACILITY PROFILE RESPONSE:", text);

      const result = JSON.parse(text);

      if (result.success) {
        const facilityData = result.facility || {};

        setFacility({
          id: String(facilityData.id || ""),
          name: facilityData.name || "Facility",
          location:
            facilityData.location ||
            facilityData.address ||
            "No location provided",
          profileImage: getFacilityProfileUrl(facilityData.profile_image || ""),
          email: facilityData.email || "",
          contactNum: facilityData.contactNum || "",
        });

        setPostings(Array.isArray(result.postings) ? result.postings : []);
      } else {
        setFacility({
          id: "",
          name: "Facility not found",
          location: "No location provided",
          profileImage: "",
          email: "",
          contactNum: "",
        });
        setPostings([]);
      }
    } catch (error) {
      console.log("FETCH PUBLIC FACILITY PROFILE ERROR:", error);

      setFacility({
        id: "",
        name: "Facility not found",
        location: "No location provided",
        profileImage: "",
        email: "",
        contactNum: "",
      });

      setPostings([]);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFacilityProfile();
    setRefreshing(false);
  }, [facilityId]);

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

  const renderPosting = ({ item }: any) => {
    return (
      <View style={styles.postCard}>
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
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={postings}
        keyExtractor={(item) => `public-facility-posting-${item.id}`}
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

            <View style={styles.avatarWrapper}>
              <Image
                source={
                  facility.profileImage
                    ? { uri: facility.profileImage }
                    : require("../../assets/icons/avatar.png")
                }
                style={styles.avatar}
              />
            </View>

            <Text style={styles.name}>{facility.name || "Facility"}</Text>

            <View style={styles.headerLocationRow}>
              <Image
                source={require("../../assets/icons/location.png")}
                style={styles.headerLocationIcon}
              />

              <Text style={styles.headerAddress}>
                {facility.location || "No location provided"}
              </Text>
            </View>

            {facility.email ? (
              <Text style={styles.contactText}>{facility.email}</Text>
            ) : null}

            {facility.contactNum ? (
              <Text style={styles.contactText}>{facility.contactNum}</Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No item postings from this facility yet.
          </Text>
        }
      />

      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/user_dashboard" as any)}
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
          onPress={() => router.push("/user_dashboard/user_scan" as any)}
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
          onPress={() => router.push("/user_dashboard/user_map" as any)}
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
          onPress={() => router.push("/user_dashboard/messages" as any)}
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
          onPress={() => router.push("/user_dashboard/profile" as any)}
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
          onPress={() => router.push("/user_dashboard/settings" as any)}
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
    paddingBottom: 110,
  },

  profileHeader: {
    backgroundColor: "#197900",
    alignItems: "center",
    paddingTop: 15,
    paddingBottom: 22,
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

  name: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 10,
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

  contactText: {
    color: "#e8f5e9",
    fontSize: 13,
    marginTop: 5,
    textAlign: "center",
  },

  readOnlyNote: {
    backgroundColor: "#fff",
    color: "#197900",
    marginTop: 15,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    fontWeight: "bold",
    fontSize: 13,
    textAlign: "center",
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

  emptyText: {
    textAlign: "center",
    color: "gray",
    marginTop: 35,
    fontSize: 15,
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