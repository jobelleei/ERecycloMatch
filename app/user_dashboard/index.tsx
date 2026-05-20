import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TextInput,
  ImageBackground,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, usePathname, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "../../config";

export default function UserDashboard() {
  const [userName, setUserName] = useState("");
  const [submitterName, setSubmitterName] = useState("");
  const [recentItems, setRecentItems] = useState<any[]>([]);

  const [searchText, setSearchText] = useState("");
  const [searchedFacilities, setSearchedFacilities] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    loadUser();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, [])
  );

  useEffect(() => {
    if (submitterName) {
      fetchRecentItems();
    }
  }, [submitterName]);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchText.trim().length > 0) {
        searchApprovedFacilities(searchText.trim());
      } else {
        setSearchedFacilities([]);
        setShowSearchResults(false);
      }
    }, 400);

    return () => clearTimeout(delaySearch);
  }, [searchText]);

  const loadUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user");

      if (storedUser) {
        const parsed = JSON.parse(storedUser);

        const name =
          parsed?.name ||
          parsed?.user?.name ||
          parsed?.data?.name ||
          parsed?.fullname ||
          parsed?.full_name ||
          parsed?.username ||
          parsed?.user?.username ||
          parsed?.data?.username ||
          "User";

        setUserName(name);
        setSubmitterName(String(name).trim());
      }
    } catch (error) {
      console.log("LOAD USER ERROR:", error);
    }
  };

  const fetchRecentItems = async () => {
    try {
      const encodedName = encodeURIComponent(submitterName);

      const response = await fetch(
        `${API_URL}/get_my_items.php?submitter_name=${encodedName}`
      );

      const text = await response.text();
      console.log("DASHBOARD RECENT ITEMS RESPONSE:", text);

      const result = JSON.parse(text);

      if (result.success && Array.isArray(result.items)) {
        const limitedItems = result.items.slice(0, 3);
        setRecentItems(limitedItems);
      } else {
        setRecentItems([]);
      }
    } catch (error) {
      console.log("FETCH RECENT ITEMS ERROR:", error);
      setRecentItems([]);
    }
  };

  const searchApprovedFacilities = async (keyword: string) => {
    try {
      setIsSearching(true);
      setShowSearchResults(true);

      const encodedKeyword = encodeURIComponent(keyword);

      const response = await fetch(
        `${API_URL}/search_approved_facilities.php?search=${encodedKeyword}`
      );

      const text = await response.text();
      console.log("SEARCH FACILITIES RESPONSE:", text);

      const result = JSON.parse(text);

      if (result.success && Array.isArray(result.facilities)) {
        setSearchedFacilities(result.facilities);
      } else {
        setSearchedFacilities([]);
      }
    } catch (error) {
      console.log("SEARCH FACILITIES ERROR:", error);
      setSearchedFacilities([]);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchText("");
    setSearchedFacilities([]);
    setShowSearchResults(false);
    Keyboard.dismiss();
  };

  const getImageUrl = (item: any) => {
    if (!item.item_image) return "https://via.placeholder.com/100";

    if (item.folder === "approved") {
      return `${API_URL}/uploads/items/approved/${item.item_image}`;
    }

    if (item.folder === "rejected") {
      return `${API_URL}/uploads/items/rejected/${item.item_image}`;
    }

    return `${API_URL}/uploads/items/pending/${item.item_image}`;
  };

  const getFacilityProfileUrl = (facility: any) => {
    if (!facility.profile_image) {
      return `${API_URL}/assets/icons/avatar.png`;
    }

    return `${API_URL}/uploads/profile/facility_profile/${facility.profile_image}`;
  };

  const getStatusStyle = (status: string) => {
    if (status === "Listed") return styles.statusGreen;
    if (status === "Approved") return styles.statusBlue;
    if (status === "Rejected") return styles.statusRed;
    return styles.statusGray;
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <View style={{ flex: 1 }}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.welcome}>
              Welcome Back{userName ? `, ${userName}` : ""}!
            </Text>

            <Image
              source={require("../../assets/icons/icon.png")}
              style={styles.avatar}
            />
          </View>

          {/* SEARCH */}
          <View style={styles.searchArea}>
            <View style={styles.searchBox}>
              <TextInput
                placeholder="Search for facilities or location"
                placeholderTextColor="#777"
                value={searchText}
                onChangeText={(text) => {
                  setSearchText(text);
                  setShowSearchResults(true);
                }}
                onFocus={() => {
                  if (searchText.trim().length > 0) {
                    setShowSearchResults(true);
                  }
                }}
                style={styles.searchInput}
              />

              {searchText.length > 0 && (
                <TouchableOpacity onPress={clearSearch}>
                  <Text style={styles.clearSearch}>×</Text>
                </TouchableOpacity>
              )}
            </View>

            {showSearchResults && searchText.trim().length > 0 && (
              <View style={styles.searchResultsBox}>
                {isSearching ? (
                  <View style={styles.searchLoading}>
                    <ActivityIndicator size="small" color="#2f7d1f" />
                    <Text style={styles.searchLoadingText}>Searching...</Text>
                  </View>
                ) : searchedFacilities.length > 0 ? (
                  searchedFacilities.map((facility) => (
                    <TouchableOpacity
                      key={facility.id}
                      style={styles.facilitySearchItem}
                      activeOpacity={0.8}
                      onPress={() => {
                        Keyboard.dismiss();
                        setShowSearchResults(false);

                        /*
                          If you already have a facility details page,
                          you can change this route.

                          Example:
                          router.push({
                            pathname: "/user_dashboard/facility_details",
                            params: { id: facility.id },
                          } as any);
                        */
                      }}
                    >
                      <Image
                        source={{ uri: getFacilityProfileUrl(facility) }}
                        style={styles.searchFacilityImage}
                        onError={(e) => {
                          console.log("FACILITY IMAGE ERROR:", e.nativeEvent);
                        }}
                      />

                      <View style={styles.searchFacilityInfo}>
                        <Text style={styles.searchFacilityName}>
                          {facility.name}
                        </Text>

                        <Text style={styles.searchFacilityLocation}>
                          {facility.location || "No location provided"}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.noSearchResult}>
                    <Text style={styles.noSearchResultText}>
                      No approved facility found.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* BANNER */}
          <ImageBackground
            source={require("../../assets/images/banner.jpg")}
            style={styles.banner}
            imageStyle={{ borderRadius: 15 }}
          >
            <View style={styles.overlay} />

            <Text style={styles.bannerTitle}>
              RECYCLE SMARTER{"\n"}MATCH FASTER
            </Text>

            <Text style={styles.bannerSub}>
              Find the right place for your e-waste with just a few clicks.
            </Text>
          </ImageBackground>

          {/* RECENT ITEMS */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Items</Text>

            <TouchableOpacity
              onPress={() => router.push("/user_dashboard/user_myItems" as any)}
            >
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>

          {recentItems.length > 0 ? (
            recentItems.map((item) => (
              <View key={`${item.folder}-${item.id}`} style={styles.itemCard}>
                <Image
                  source={{ uri: getImageUrl(item) }}
                  style={styles.itemImage}
                />

                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.itemTitle}>{item.item_name}</Text>

                  <Text style={styles.itemSub}>
                    {item.description || "No description"}
                  </Text>
                </View>

                <Text style={getStatusStyle(item.status)}>{item.status}</Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No recent items yet.</Text>
            </View>
          )}

          {/* FACILITIES */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Partnered Recycling Facilities</Text>
            <Text style={styles.viewAll}>View More</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.facilityCard}>
              <Image
                source={require("../../assets/images/dyma.webp")}
                style={styles.facilityImage}
              />
              <Text style={styles.facilityName}>Dyma Trading & Junk Shop</Text>
            </View>

            <View style={styles.facilityCard}>
              <Image
                source={require("../../assets/images/villa.webp")}
                style={styles.facilityImage}
              />
              <Text style={styles.facilityName}>Villa Fe Junk Shop</Text>
            </View>
          </ScrollView>
        </ScrollView>

        {/* NAVBAR */}
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  welcome: {
    fontSize: 18,
    fontWeight: "600",
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },

  searchArea: {
    marginTop: 15,
    zIndex: 999,
  },

  searchBox: {
    backgroundColor: "#dff0d8",
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
  },

  searchInput: {
    flex: 1,
    height: 42,
    fontSize: 14,
    color: "#222",
  },

  clearSearch: {
    fontSize: 26,
    color: "#555",
    paddingHorizontal: 5,
    marginBottom: 2,
  },

  searchResultsBox: {
    position: "absolute",
    top: 55,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 15,
    paddingVertical: 8,
    maxHeight: 260,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
  },

  searchLoading: {
    padding: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  searchLoadingText: {
    marginLeft: 8,
    color: "#555",
    fontSize: 14,
  },

  facilitySearchItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  searchFacilityImage: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: "#eee",
  },

  searchFacilityInfo: {
    flex: 1,
    marginLeft: 12,
  },

  searchFacilityName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#222",
  },

  searchFacilityLocation: {
    marginTop: 3,
    fontSize: 13,
    color: "#666",
  },

  noSearchResult: {
    padding: 18,
    alignItems: "center",
  },

  noSearchResultText: {
    color: "#777",
    fontSize: 14,
  },

  banner: {
    marginTop: 20,
    height: 180,
    borderRadius: 15,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.5)",
  },

  bannerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },

  bannerSub: {
    marginTop: 8,
    fontSize: 12,
    textAlign: "center",
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    alignItems: "center",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },

  viewAll: {
    color: "#777",
    fontWeight: "600",
  },

  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },

  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
  },

  itemTitle: {
    fontWeight: "bold",
  },

  itemSub: {
    color: "#777",
    marginTop: 2,
  },

  statusGreen: {
    color: "green",
    fontWeight: "600",
  },

  statusBlue: {
    color: "#1976d2",
    fontWeight: "600",
  },

  statusRed: {
    color: "red",
    fontWeight: "600",
  },

  statusGray: {
    color: "gray",
    fontWeight: "600",
  },

  emptyCard: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 10,
    marginTop: 10,
    alignItems: "center",
  },

  emptyText: {
    color: "gray",
    fontSize: 14,
  },

  facilityCard: {
    marginRight: 15,
    marginTop: 10,
  },

  facilityImage: {
    width: 160,
    height: 140,
    borderRadius: 15,
  },

  facilityName: {
    marginTop: 5,
    fontWeight: "600",
    width: 160,
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